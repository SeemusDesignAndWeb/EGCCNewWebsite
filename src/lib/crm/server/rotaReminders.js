import { readCollection } from './fileStore.js';
import { sendUpcomingRotaReminder } from './email.js';

/**
 * Find all rota assignments for occurrences starting in N days
 * @param {number} daysAhead - Number of days ahead to check (default: 3)
 * @returns {Promise<Array>} Array of { contact, rota, event, occurrence } objects
 */
export async function findUpcomingRotaAssignments(daysAhead = 3) {
	const now = new Date();
	const targetDate = new Date(now);
	targetDate.setDate(now.getDate() + daysAhead);
	
	// Set time to start of day for comparison (00:00:00)
	const targetStart = new Date(targetDate);
	targetStart.setHours(0, 0, 0, 0);
	
	// Set time to end of day for comparison (23:59:59.999)
	const targetEnd = new Date(targetDate);
	targetEnd.setHours(23, 59, 59, 999);

	// Load all data
	const rotas = await readCollection('rotas');
	const occurrences = await readCollection('occurrences');
	const events = await readCollection('events');
	const contacts = await readCollection('contacts');

	// Create lookup maps for efficiency
	const eventsMap = new Map(events.map(e => [e.id, e]));
	const occurrencesMap = new Map(occurrences.map(o => [o.id, o]));
	const contactsMap = new Map(contacts.map(c => [c.id, c]));

	// Find occurrences starting on the target date (within the day window)
	const targetOccurrences = occurrences.filter(occ => {
		const startsAt = new Date(occ.startsAt);
		return startsAt >= targetStart && startsAt <= targetEnd;
	});

	const assignments = [];

	// Process each rota
	for (const rota of rotas) {
		const event = eventsMap.get(rota.eventId);
		if (!event) continue;

		// Get occurrences for this rota's event
		const eventOccurrences = occurrences.filter(o => o.eventId === rota.eventId);

		// Determine which occurrences this rota applies to
		let relevantOccurrences = [];
		
		if (rota.occurrenceId) {
			// Rota is for a specific occurrence
			const specificOcc = occurrencesMap.get(rota.occurrenceId);
			if (specificOcc && targetOccurrences.some(to => to.id === specificOcc.id)) {
				relevantOccurrences = [specificOcc];
			}
		} else {
			// Rota is for all occurrences - check all event occurrences that match target date
			relevantOccurrences = eventOccurrences.filter(occ => 
				targetOccurrences.some(to => to.id === occ.id)
			);
		}

		// Process assignees for each relevant occurrence
		for (const occurrence of relevantOccurrences) {
			const assignees = rota.assignees || [];
			
			for (const assignee of assignees) {
				let contactId = null;
				let assigneeOccurrenceId = null;

				// Handle old format (backward compatibility)
				if (typeof assignee === 'string') {
					contactId = assignee;
					assigneeOccurrenceId = rota.occurrenceId || occurrence.id;
				} else if (assignee && typeof assignee === 'object') {
					// New format: { contactId, occurrenceId }
					if (assignee.contactId) {
						contactId = assignee.contactId;
						assigneeOccurrenceId = assignee.occurrenceId || rota.occurrenceId || occurrence.id;
					} else if (assignee.id) {
						contactId = assignee.id;
						assigneeOccurrenceId = assignee.occurrenceId || rota.occurrenceId || occurrence.id;
					} else if (assignee.name && assignee.email) {
						// Public signup format - skip these as they don't have contact IDs
						continue;
					}
				}

				// Skip if no valid contact ID
				if (!contactId || typeof contactId !== 'string') {
					continue;
				}

				// Check if this assignee is for this specific occurrence
				// If assignee has a specific occurrenceId, it must match
				// If assignee has no occurrenceId but rota has one, it must match
				// If both are null, assignee is for all occurrences
				if (assigneeOccurrenceId !== null && assigneeOccurrenceId !== occurrence.id) {
					continue; // This assignee is for a different occurrence
				}

				// Get contact details
				const contact = contactsMap.get(contactId);
				if (!contact || !contact.email) {
					continue; // Skip contacts without email
				}

				// Add assignment
				assignments.push({
					contact,
					rota,
					event,
					occurrence
				});
			}
		}
	}

	return assignments;
}

/**
 * Send rota reminder emails for upcoming assignments
 * @param {number} daysAhead - Number of days ahead to check (default: 3)
 * @param {object} event - SvelteKit event object (for base URL)
 * @returns {Promise<object>} Summary of sent notifications
 */
export async function sendRotaReminders(daysAhead = 3, event) {
	const assignments = await findUpcomingRotaAssignments(daysAhead);

	// Group assignments by contact to avoid duplicate emails
	// If a contact has multiple rotas on the same day, send one email with all of them
	const assignmentsByContact = new Map();

	for (const assignment of assignments) {
		const contactId = assignment.contact.id;
		if (!assignmentsByContact.has(contactId)) {
			assignmentsByContact.set(contactId, []);
		}
		assignmentsByContact.get(contactId).push(assignment);
	}

	const results = {
		totalContacts: assignmentsByContact.size,
		totalAssignments: assignments.length,
		sent: 0,
		failed: 0,
		errors: []
	};

	// Send reminders to each contact
	for (const [contactId, contactAssignments] of assignmentsByContact) {
		const contact = contactAssignments[0].contact;
		const contactName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email;

		// For now, send one email per assignment
		// In the future, we could group multiple assignments into one email
		for (const assignment of contactAssignments) {
			try {
				await sendUpcomingRotaReminder(
					{
						to: contact.email,
						name: contactName
					},
					{
						rota: assignment.rota,
						event: assignment.event,
						occurrence: assignment.occurrence
					},
					event
				);
				results.sent++;
				console.log(`[Rota Reminders] Sent reminder to ${contact.email} for ${assignment.event.title} - ${assignment.rota.role}`);
			} catch (error) {
				results.failed++;
				results.errors.push({
					contact: contact.email,
					event: assignment.event.title,
					rota: assignment.rota.role,
					error: error.message || 'Unknown error'
				});
				console.error(`[Rota Reminders] Failed to send reminder to ${contact.email}:`, error);
			}
		}
	}

	return results;
}
