import { fail } from '@sveltejs/kit';
import { readCollection, findMany, findById, update } from '$lib/crm/server/fileStore.js';
import { getCsrfToken, verifyCsrfToken } from '$lib/crm/server/auth.js';
import { formatDateTimeUK } from '$lib/crm/utils/dateFormat.js';
import { validateRota } from '$lib/crm/server/validators.js';

export async function load({ cookies }) {
	// Load all public rotas
	const allRotas = await readCollection('rotas');
	const rotas = allRotas.filter(r => (r.visibility || 'public') === 'public');
	
	// Load all events
	const events = await readCollection('events');
	
	// Load all occurrences
	const occurrences = await readCollection('occurrences');
	
	// Load contacts to enrich assignees
	const contacts = await readCollection('contacts');
	
	// Group rotas by event
	const eventsMap = new Map(events.map(e => [e.id, e]));
	const rotasByEvent = new Map();
	
	// Initialize events with rotas
	rotas.forEach(rota => {
		if (!rotasByEvent.has(rota.eventId)) {
			const event = eventsMap.get(rota.eventId);
			if (event) {
				rotasByEvent.set(rota.eventId, {
					event,
					rotas: []
				});
			}
		}
	});
	
	// Process rotas with assignee counts per occurrence
	const rotasWithDetails = rotas.map(rota => {
		const assignees = rota.assignees || [];
		const eventOccurrences = occurrences.filter(o => o.eventId === rota.eventId);
		
		// Group assignees by occurrence
		const assigneesByOcc = {};
		if (eventOccurrences.length > 0) {
			eventOccurrences.forEach(occ => {
				assigneesByOcc[occ.id] = assignees.filter(a => {
					if (typeof a === 'string') {
						// Old format - if rota has occurrenceId, only count for that occurrence
						return rota.occurrenceId === occ.id;
					}
					if (a && typeof a === 'object') {
						const aOccId = a.occurrenceId || rota.occurrenceId;
						return aOccId === occ.id;
					}
					return false;
				}).map(a => {
					// Enrich with contact details
					if (typeof a === 'string') {
						const contact = contacts.find(c => c.id === a);
						return {
							id: contact?.id,
							name: contact ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email : 'Unknown',
							email: contact?.email || ''
						};
					}
					if (a && typeof a === 'object' && a.contactId) {
						if (typeof a.contactId === 'string') {
							const contact = contacts.find(c => c.id === a.contactId);
							return {
								id: contact?.id,
								name: contact ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email : (a.name || 'Unknown'),
								email: contact?.email || a.email || ''
							};
						}
						// Public signup format
						return {
							id: null,
							name: a.contactId.name || a.name || 'Unknown',
							email: a.contactId.email || a.email || ''
						};
					}
					// Public signup
					return {
						id: null,
						name: a.name || 'Unknown',
						email: a.email || ''
					};
				});
			});
		}
		
		return {
			...rota,
			assigneesByOcc
		};
	});
	
	// Add rotas to their events
	rotasWithDetails.forEach(rota => {
		if (rotasByEvent.has(rota.eventId)) {
			rotasByEvent.get(rota.eventId).rotas.push(rota);
		}
	});
	
	// Convert to array and sort by event title
	const eventsWithRotas = Array.from(rotasByEvent.values())
		.map(({ event, rotas }) => ({
			event,
			rotas,
			occurrences: occurrences.filter(o => o.eventId === event.id)
		}))
		.sort((a, b) => a.event.title.localeCompare(b.event.title));
	
	const csrfToken = getCsrfToken(cookies) || '';
	return { eventsWithRotas, csrfToken };
}

export const actions = {
	signup: async ({ request, cookies }) => {
		const data = await request.formData();
		const csrfToken = data.get('_csrf');

		if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
			return fail(403, { error: 'CSRF token validation failed' });
		}

		try {
			const name = data.get('name') || '';
			const email = data.get('email') || '';

			if (!name || !email) {
				return fail(400, { error: 'Name and email are required' });
			}

			// Get selected rotas and occurrences
			const selectedRotasStr = data.get('selectedRotas') || '[]';
			
			let selectedRotas;
			try {
				selectedRotas = JSON.parse(selectedRotasStr);
			} catch (parseError) {
				console.error('[General Rota Signup] JSON parse error:', parseError);
				return fail(400, { error: 'Invalid selection data format' });
			}
			
			if (!Array.isArray(selectedRotas)) {
				return fail(400, { error: 'Invalid selection data format' });
			}
			
			if (selectedRotas.length === 0) {
				return fail(400, { error: 'Please select at least one rota and occurrence to sign up for' });
			}

			// Get all occurrences and rotas for validation
			const allOccurrences = await readCollection('occurrences');
			const allRotas = await readCollection('rotas');

			const errors = [];

			// Check for clashes - same occurrence selected multiple times (check this FIRST)
			const occurrenceCounts = {};
			for (const { rotaId, occurrenceId } of selectedRotas) {
				if (occurrenceId) {
					occurrenceCounts[occurrenceId] = (occurrenceCounts[occurrenceId] || 0) + 1;
				}
			}

			for (const [occId, count] of Object.entries(occurrenceCounts)) {
				if (count > 1) {
					return fail(400, { error: 'Your rota selections are clashing, please change one of your rota signups' });
				}
			}

			// Check if already signed up to any rota for the selected occurrences
			for (const { rotaId, occurrenceId } of selectedRotas) {
				const rota = allRotas.find(r => r.id === rotaId);
				if (!rota) {
					errors.push(`Rota not found: ${rotaId}`);
					continue;
				}

				const targetOccurrenceId = occurrenceId || rota.occurrenceId || null;
				
				// Check ALL rotas for this occurrence to see if email is already signed up
				if (targetOccurrenceId) {
					// Get all rotas that apply to this occurrence (same event)
					const eventRotas = allRotas.filter(r => r.eventId === rota.eventId);
					const allRotasForOcc = eventRotas.filter(r => {
						return !r.occurrenceId || r.occurrenceId === targetOccurrenceId;
					});

					for (const r of allRotasForOcc) {
						const assignees = Array.isArray(r.assignees) ? r.assignees : [];
						const assigneesForOcc = assignees.filter(a => {
							if (typeof a === 'string') {
								return r.occurrenceId === targetOccurrenceId;
							}
							if (a && typeof a === 'object') {
								const aOccId = a.occurrenceId || r.occurrenceId;
								return aOccId === targetOccurrenceId;
							}
							return false;
						});

						const emailExists = assigneesForOcc.some(a => {
							if (typeof a === 'string') {
								return false;
							}
							if (a && typeof a === 'object') {
								return a.email && a.email.toLowerCase() === email.toLowerCase();
							}
							return false;
						});

						if (emailExists) {
							const occ = allOccurrences.find(o => o.id === targetOccurrenceId);
							const occTime = occ ? formatDateTimeUK(occ.startsAt) : 'this occurrence';
							errors.push(`You are already signed up for a rota on ${occTime}`);
							break;
						}
					}
				}
			}

			// If there are errors, return them now
			if (errors.length > 0) {
				return fail(400, { error: errors.join('; ') });
			}

			// Process each selected rota/occurrence
			for (const { rotaId, occurrenceId } of selectedRotas) {
				// Reload rota from database to get latest data (in case it was updated in previous iteration)
				const rota = await findById('rotas', rotaId);
				if (!rota) {
					errors.push(`Rota not found: ${rotaId}`);
					continue;
				}

				// Determine the actual occurrenceId to use
				const targetOccurrenceId = occurrenceId || rota.occurrenceId || null;

				// Check capacity per occurrence
				const existingAssignees = Array.isArray(rota.assignees) ? [...rota.assignees] : [];
				const assigneesForOccurrence = existingAssignees.filter(a => {
					if (typeof a === 'string') {
						return rota.occurrenceId === targetOccurrenceId;
					}
					if (a && typeof a === 'object') {
						const aOccurrenceId = a.occurrenceId || rota.occurrenceId;
						return aOccurrenceId === targetOccurrenceId;
					}
					return false;
				});

				if (assigneesForOccurrence.length >= rota.capacity) {
					errors.push(`Rota "${rota.role}" is full for this occurrence`);
					continue;
				}

				// Add assignee as object (name, email, occurrenceId) for public signups
				existingAssignees.push({ name, email, occurrenceId: targetOccurrenceId });

				// Update rota
				const updatedRota = {
					...rota,
					assignees: existingAssignees
				};
				const validated = validateRota(updatedRota);
				await update('rotas', rota.id, validated);
			}

			if (errors.length > 0) {
				return fail(400, { error: errors.join('; ') });
			}

			return { success: true, message: 'Successfully signed up for selected rotas!' };
		} catch (error) {
			console.error('Error in general rota signup:', error);
			return fail(500, { error: error.message || 'Failed to sign up for rotas' });
		}
	}
};
