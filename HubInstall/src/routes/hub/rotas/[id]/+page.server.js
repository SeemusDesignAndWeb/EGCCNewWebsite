import { redirect, fail } from '@sveltejs/kit';
import { findById, update, remove, readCollection } from '$lib/crm/server/fileStore.js';
import { validateRota } from '$lib/crm/server/validators.js';
import { getCsrfToken, verifyCsrfToken } from '$lib/crm/server/auth.js';
import { sanitizeHtml } from '$lib/crm/server/sanitize.js';
import { ensureRotaToken } from '$lib/crm/server/tokens.js';
import { env } from '$env/dynamic/private';

export async function load({ params, cookies, url }) {
	const rota = await findById('rotas', params.id);
	if (!rota) {
		throw redirect(302, '/hub/rotas');
	}

	const event = await findById('events', rota.eventId);
	const occurrence = rota.occurrenceId ? await findById('occurrences', rota.occurrenceId) : null;
	
	// Load all occurrences for this event to show capacity per occurrence
	const allOccurrences = await readCollection('occurrences');
	const eventOccurrences = allOccurrences.filter(o => o.eventId === rota.eventId);

	// Load contact details for assignees
	// New structure: assignees are objects with { contactId, occurrenceId }
	const contacts = await readCollection('contacts');
	
	// Process assignees - handle both old format (backward compatibility) and new format
	const processedAssignees = (rota.assignees || []).map(assignee => {
		let contactId, occurrenceId;
		
		// Handle old format (backward compatibility)
		if (typeof assignee === 'string') {
			contactId = assignee;
			// If rota is for all occurrences (occurrenceId is null), we can't assign to a specific occurrence
			// For now, we'll leave it as null and handle it in the display
			occurrenceId = rota.occurrenceId;
		} else if (assignee && typeof assignee === 'object') {
			// New format: { contactId, occurrenceId } or old public signup format { name, email }
			if (assignee.contactId) {
				contactId = assignee.contactId;
				occurrenceId = assignee.occurrenceId || rota.occurrenceId;
			} else if (assignee.id) {
				contactId = assignee.id;
				occurrenceId = assignee.occurrenceId || rota.occurrenceId;
			} else if (assignee.name && assignee.email) {
				// Public signup format
				contactId = { name: assignee.name, email: assignee.email };
				occurrenceId = assignee.occurrenceId || rota.occurrenceId;
			} else {
				return null;
			}
		} else {
			return null;
		}
		
		// Resolve contact details
		let contactDetails = null;
		if (typeof contactId === 'string') {
			const contact = contacts.find(c => c.id === contactId);
			if (contact) {
				contactDetails = {
					id: contact.id,
					name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email,
					email: contact.email
				};
			} else {
				contactDetails = {
					id: contactId,
					name: 'Unknown Contact',
					email: ''
				};
			}
		} else {
			// Public signup
			contactDetails = {
				id: null,
				name: contactId.name || 'Unknown',
				email: contactId.email || ''
			};
		}
		
		return {
			...contactDetails,
			occurrenceId: occurrenceId
		};
	}).filter(a => a !== null);
	
	// Group assignees by occurrence
	const assigneesByOccurrence = {};
	const unassignedAssignees = []; // Assignees without a specific occurrence (old format, rota for all occurrences)
	
	processedAssignees.forEach(assignee => {
		const occId = assignee.occurrenceId;
		if (occId === null || occId === undefined) {
			// Assignee doesn't have an occurrenceId - this happens with old format when rota is for all occurrences
			unassignedAssignees.push(assignee);
		} else {
			if (!assigneesByOccurrence[occId]) {
				assigneesByOccurrence[occId] = [];
			}
			assigneesByOccurrence[occId].push(assignee);
		}
	});
	
	// If there are unassigned assignees and the rota is for all occurrences, 
	// we need to handle them - for now, show them separately or distribute them
	// For display purposes, if there are unassigned and only one occurrence, assign them to that occurrence
	if (unassignedAssignees.length > 0 && rota.occurrenceId === null && eventOccurrences.length === 1) {
		// Auto-assign to the only occurrence
		const onlyOccId = eventOccurrences[0].id;
		if (!assigneesByOccurrence[onlyOccId]) {
			assigneesByOccurrence[onlyOccId] = [];
		}
		assigneesByOccurrence[onlyOccId].push(...unassignedAssignees);
	} else if (unassignedAssignees.length > 0) {
		// Multiple occurrences - show unassigned separately
		assigneesByOccurrence['unassigned'] = unassignedAssignees;
	}

	// Get all contacts for the add assignees search (excluding those already assigned to this occurrence)
	// For now, we'll show all contacts - filtering by occurrence will be handled in the UI
	const availableContacts = contacts;

	// Ensure a token exists for this rota and generate signup link
	let signupLink = '';
	try {
		const token = await ensureRotaToken(rota.eventId, rota.id, rota.occurrenceId);
		const baseUrl = env.APP_BASE_URL || url.origin || 'http://localhost:5173';
		signupLink = `${baseUrl}/signup/rota/${token.token}`;
	} catch (error) {
		console.error('Error generating rota token:', error);
		// Continue without signup link if token generation fails
	}

	// Load owner contact if rota has an owner
	let owner = null;
	if (rota.ownerId) {
		owner = await findById('contacts', rota.ownerId);
	}

	const csrfToken = getCsrfToken(cookies) || '';
	return { 
		rota: { ...rota, assignees: processedAssignees }, 
		rawRota: rota, // Keep raw rota for operations that need original assignees
		event, 
		occurrence, 
		eventOccurrences,
		assigneesByOccurrence,
		availableContacts, 
		owner,
		signupLink, 
		csrfToken 
	};
}

export const actions = {
	update: async ({ request, params, cookies, url }) => {
		const data = await request.formData();
		const csrfToken = data.get('_csrf');

		if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
			return fail(403, { error: 'CSRF token validation failed' });
		}

		try {
			const notes = data.get('notes') || '';
			const sanitized = await sanitizeHtml(notes);

			const rota = await findById('rotas', params.id);
			if (!rota) {
				return fail(404, { error: 'Rota not found' });
			}

			const rotaData = {
				role: data.get('role'),
				capacity: parseInt(data.get('capacity') || '1', 10),
				notes: sanitized,
				assignees: rota.assignees || [], // Preserve existing assignees
				ownerId: data.get('ownerId') || null
			};

			const validated = validateRota({ ...rotaData, eventId: rota.eventId });
			const oldOwnerId = rota.ownerId;
			await update('rotas', params.id, validated);

			// Send notification to owner if rota was updated
			if (validated.ownerId) {
				try {
					const { sendRotaUpdateNotification } = await import('$lib/crm/server/email.js');
					const updatedRota = await findById('rotas', params.id);
					const owner = await findById('contacts', validated.ownerId);
					if (owner) {
						await sendRotaUpdateNotification({
							to: owner.email,
							name: `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || owner.email
							}, {
								rota: updatedRota,
								event,
								occurrence
							}, { url: new URL(url.toString(), 'http://localhost') });
					}
				} catch (error) {
					console.error('Error sending rota update notification:', error);
					// Don't fail the update if notification fails
				}
			}

			return { success: true };
		} catch (error) {
			console.error('Error updating rota:', error);
			return fail(400, { error: error.message || 'Failed to update rota' });
		}
	},

		delete: async ({ params, cookies, request }) => {
			const data = await request.formData();
			const csrfToken = data.get('_csrf');

			if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
				return fail(403, { error: 'CSRF token validation failed' });
			}

			try {
				await remove('rotas', params.id);
				throw redirect(302, '/hub/rotas');
			} catch (error) {
				if (error.status === 302) throw error; // Re-throw redirects
				console.error('Error deleting rota:', error);
				return fail(400, { error: error.message || 'Failed to delete rota' });
			}
		},

		addAssignees: async ({ request, params, cookies, url }) => {
			const data = await request.formData();
			const csrfToken = data.get('_csrf');

			if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
				return fail(403, { error: 'CSRF token validation failed' });
			}

			try {
				const rota = await findById('rotas', params.id);
				if (!rota) {
					return fail(404, { error: 'Rota not found' });
				}

				const contactIdsJson = data.get('contactIds');
				if (!contactIdsJson) {
					return fail(400, { error: 'No contacts provided' });
				}

				let newContactIds;
				try {
					newContactIds = JSON.parse(contactIdsJson);
				} catch (parseError) {
					return fail(400, { error: 'Invalid contact IDs format' });
				}

				if (!Array.isArray(newContactIds)) {
					return fail(400, { error: 'Contact IDs must be an array' });
				}

				const existingAssignees = Array.isArray(rota.assignees) ? [...rota.assignees] : [];
				
				// Get occurrenceId from form or use rota's occurrenceId
				const occurrenceIdStr = data.get('occurrenceId');
				const targetOccurrenceId = occurrenceIdStr || rota.occurrenceId || null;
				
				// Check capacity per occurrence before adding
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
				
				if (assigneesForOccurrence.length + newContactIds.length > rota.capacity) {
					return fail(400, { error: `Cannot add ${newContactIds.length} contact(s). This occurrence can only have ${rota.capacity} assignee(s) and currently has ${assigneesForOccurrence.length}.` });
				}
				
				// Add new assignees with occurrenceId
				const newAssignees = newContactIds.map(contactId => ({
					contactId: contactId,
					occurrenceId: targetOccurrenceId
				}));
				
				// Merge with existing (avoid duplicates for this occurrence)
				const existingContactIdsForOcc = assigneesForOccurrence
					.map(a => typeof a === 'string' ? a : (a.contactId && typeof a.contactId === 'string' ? a.contactId : null))
					.filter(id => id !== null);
				
				const uniqueNewAssignees = newAssignees.filter(a => !existingContactIdsForOcc.includes(a.contactId));
				const updatedAssignees = [...existingAssignees, ...uniqueNewAssignees];

				// Update with all rota fields to preserve them
				const updatedRota = {
					...rota,
					assignees: updatedAssignees
				};
				const validated = validateRota(updatedRota);
				await update('rotas', params.id, validated);

				// Send notification to owner if rota has an owner
				if (validated.ownerId) {
					try {
						const { sendRotaUpdateNotification } = await import('$lib/crm/server/email.js');
						const event = await findById('events', rota.eventId);
						const occurrence = targetOccurrenceId ? await findById('occurrences', targetOccurrenceId) : null;
						const owner = await findById('contacts', validated.ownerId);
						if (owner) {
							await sendRotaUpdateNotification({
								to: owner.email,
								name: `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || owner.email
							}, {
								rota: validated,
								event,
								occurrence
							}, { url: new URL(url.toString(), 'http://localhost') });
						}
					} catch (error) {
						console.error('Error sending rota update notification:', error);
						// Don't fail the update if notification fails
					}
				}

				return { success: true, type: 'addAssignees' };
			} catch (error) {
				console.error('Error adding assignees:', error);
				return fail(400, { error: error.message || 'Failed to add assignees' });
			}
		},

		removeAssignee: async ({ request, params, cookies, url }) => {
			console.log('[SERVER] removeAssignee action called');
			const data = await request.formData();
			const csrfToken = data.get('_csrf');

			if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
				console.error('[SERVER] CSRF token validation failed');
				return fail(403, { error: 'CSRF token validation failed' });
			}

			try {
				const rota = await findById('rotas', params.id);
				if (!rota) {
					console.error('[SERVER] Rota not found:', params.id);
					return fail(404, { error: 'Rota not found' });
				}

				console.log('[SERVER] Rota found:', {
					id: rota.id,
					role: rota.role,
					occurrenceId: rota.occurrenceId,
					assigneesCount: Array.isArray(rota.assignees) ? rota.assignees.length : 0
				});

				const indexStr = data.get('index');
				console.log('[SERVER] Index from form data:', indexStr);
				if (indexStr === null || indexStr === undefined) {
					console.error('[SERVER] Index is missing');
					return fail(400, { error: 'Index required' });
				}

				const index = parseInt(indexStr, 10);
				console.log('[SERVER] Parsed index:', index);
				if (isNaN(index) || index < 0) {
					console.error('[SERVER] Invalid index:', index);
					return fail(400, { error: 'Invalid index' });
				}

				const existingAssignees = Array.isArray(rota.assignees) ? [...rota.assignees] : [];
				console.log('[SERVER] Existing assignees:', JSON.stringify(existingAssignees, null, 2));
				console.log('[SERVER] Assignees length:', existingAssignees.length);
				
				if (index >= existingAssignees.length) {
					console.error('[SERVER] Index out of range:', { 
						index, 
						length: existingAssignees.length, 
						assignees: JSON.stringify(existingAssignees, null, 2) 
					});
					return fail(400, { error: 'Index out of range' });
				}

				// Log what we're removing for debugging
				console.log('[SERVER] Removing assignee at index', index, ':', JSON.stringify(existingAssignees[index], null, 2));

				// Remove assignee at the specified index
				existingAssignees.splice(index, 1);
				const updatedAssignees = existingAssignees;

				console.log('[SERVER] Updated assignees after removal:', JSON.stringify(updatedAssignees, null, 2));

				// Update with all rota fields to preserve them
				const updatedRota = {
					...rota,
					assignees: updatedAssignees
				};
				const validated = validateRota(updatedRota);
				await update('rotas', params.id, validated);

				// Send notification to owner if rota has an owner
				if (validated.ownerId) {
					try {
						const { sendRotaUpdateNotification } = await import('$lib/crm/server/email.js');
						const event = await findById('events', rota.eventId);
						const occurrence = rota.occurrenceId ? await findById('occurrences', rota.occurrenceId) : null;
						const owner = await findById('contacts', validated.ownerId);
						if (owner) {
							await sendRotaUpdateNotification({
								to: owner.email,
								name: `${owner.firstName || ''} ${owner.lastName || ''}`.trim() || owner.email
							}, {
								rota: validated,
								event,
								occurrence
							}, { url: new URL(url.toString(), 'http://localhost') });
						}
					} catch (error) {
						console.error('Error sending rota update notification:', error);
						// Don't fail the update if notification fails
					}
				}

				console.log('[SERVER] Rota updated successfully');
				return { success: true, type: 'removeAssignee' };
			} catch (error) {
				console.error('[SERVER] Error removing assignee:', error);
				console.error('[SERVER] Error stack:', error.stack);
				return fail(400, { error: error.message || 'Failed to remove assignee' });
			}
		}
	};

