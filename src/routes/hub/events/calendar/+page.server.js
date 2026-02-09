import { readCollection, create, update, remove } from '$lib/crm/server/fileStore.js';
import { getCsrfToken, verifyCsrfToken } from '$lib/crm/server/auth.js';
import { sanitizeHtml } from '$lib/crm/server/sanitize.js';
import { logDataChange } from '$lib/crm/server/audit.js';
import { getWeekKey } from '$lib/crm/utils/weekUtils.js';
import { getCurrentOrganisationId, filterByOrganisation, withOrganisationId } from '$lib/crm/server/orgContext.js';

export async function load({ url, cookies }) {
	const organisationId = await getCurrentOrganisationId();
	const events = filterByOrganisation(await readCollection('events'), organisationId);
	const occurrences = filterByOrganisation(await readCollection('occurrences'), organisationId);
	const weekNotes = filterByOrganisation(await readCollection('week_notes'), organisationId);

	// Enrich occurrences with event data
	const eventsMap = new Map(events.map(e => [e.id, e]));
	const enrichedOccurrences = occurrences.map(occ => ({
		...occ,
		event: eventsMap.get(occ.eventId) || null
	})).filter(occ => occ.event !== null);

	return {
		events,
		occurrences: enrichedOccurrences,
		weekNotes: weekNotes.sort((a, b) => b.weekKey.localeCompare(a.weekKey)),
		csrfToken: getCsrfToken(cookies) || ''
	};
}

export const actions = {
	saveWeekNote: async ({ request, cookies, locals }) => {
		const data = await request.formData();
		const csrfToken = data.get('_csrf');

		if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
			return { error: 'CSRF token validation failed' };
		}

		try {
			// Handle both single date and multiple dates (repeat)
			const singleDate = data.get('date');
			const datesArray = data.getAll('dates[]');
			const dates = datesArray.length > 0 ? datesArray : (singleDate ? [singleDate] : []);

			if (dates.length === 0) {
				return { error: 'At least one date is required' };
			}

			const note = data.get('note') || '';
			const sanitizedNote = await sanitizeHtml(note);

			const organisationId = await getCurrentOrganisationId();
			const weekNotes = filterByOrganisation(await readCollection('week_notes'), organisationId);
			const adminId = locals?.admin?.id || null;
			const event = { getClientAddress: () => 'unknown', request };
			const savedWeekKeys = [];

			// Process each date
			for (const dateStr of dates) {
				if (!dateStr) continue;

				const weekKey = getWeekKey(dateStr);
				const existingNote = weekNotes.find(n => n.weekKey === weekKey);

				if (existingNote) {
					await update('week_notes', existingNote.id, {
						note: sanitizedNote,
						updatedAt: new Date().toISOString()
					});

					await logDataChange(adminId, 'update', 'week_note', existingNote.id, {
						weekKey: weekKey
					}, event);
				} else {
					const newNote = await create('week_notes', withOrganisationId({
						weekKey: weekKey,
						note: sanitizedNote
					}, organisationId));

					await logDataChange(adminId, 'create', 'week_note', newNote.id, {
						weekKey: weekKey
					}, event);
				}

				savedWeekKeys.push(weekKey);
			}

			return { 
				success: true, 
				type: 'weekNote', 
				weekKey: savedWeekKeys[0],
				count: savedWeekKeys.length
			};
		} catch (error) {
			console.error('[Save Week Note] Error:', error);
			return { error: error.message || 'Failed to save week note' };
		}
	},

	deleteWeekNote: async ({ request, cookies, locals }) => {
		const data = await request.formData();
		const csrfToken = data.get('_csrf');

		if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
			return { error: 'CSRF token validation failed' };
		}

		try {
			const weekKey = data.get('weekKey');
			if (!weekKey) {
				return { error: 'Week key is required' };
			}

			const organisationId = await getCurrentOrganisationId();
			const weekNotes = filterByOrganisation(await readCollection('week_notes'), organisationId);
			const noteToDelete = weekNotes.find(n => n.weekKey === weekKey);

			if (!noteToDelete) {
				return { error: 'Week note not found' };
			}

			await remove('week_notes', noteToDelete.id);

			const adminId = locals?.admin?.id || null;
			const event = { getClientAddress: () => 'unknown', request };
			await logDataChange(adminId, 'delete', 'week_note', noteToDelete.id, {
				weekKey: weekKey
			}, event);

			return { success: true, type: 'deleteWeekNote' };
		} catch (error) {
			console.error('[Delete Week Note] Error:', error);
			return { error: error.message || 'Failed to delete week note' };
		}
	},

	moveOccurrence: async ({ request, cookies, locals }) => {
		const data = await request.formData();
		const csrfToken = data.get('_csrf');

		if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
			return { error: 'CSRF token validation failed' };
		}

		try {
			const occurrenceId = data.get('occurrenceId');
			const newDateStr = data.get('newDate'); // YYYY-MM-DD

			if (!occurrenceId || !newDateStr) {
				return { error: 'Occurrence ID and new date are required' };
			}

			const organisationId = await getCurrentOrganisationId();
			const occurrences = filterByOrganisation(await readCollection('occurrences'), organisationId);
			const occurrence = occurrences.find(o => o.id === occurrenceId);

			if (!occurrence) {
				return { error: 'Occurrence not found' };
			}

			// Calculate time difference
			const oldStartDate = new Date(occurrence.startsAt);
			const newStartDate = new Date(newDateStr);
			
			// Set the year, month, date of the new start date, but keep the time from the old start date
			newStartDate.setHours(oldStartDate.getHours(), oldStartDate.getMinutes(), oldStartDate.getSeconds(), oldStartDate.getMilliseconds());

			// Calculate the duration to update the end date
			const oldEndDate = new Date(occurrence.endsAt);
			const durationMs = oldEndDate.getTime() - oldStartDate.getTime();
			const newEndDate = new Date(newStartDate.getTime() + durationMs);

			await update('occurrences', occurrence.id, {
				startsAt: newStartDate.toISOString(),
				endsAt: newEndDate.toISOString(),
				updatedAt: new Date().toISOString()
			});

			const adminId = locals?.admin?.id || null;
			const event = { getClientAddress: () => 'unknown', request };
			await logDataChange(adminId, 'update', 'occurrence', occurrence.id, {
				action: 'move_date',
				oldStartsAt: occurrence.startsAt,
				newStartsAt: newStartDate.toISOString()
			}, event);

			return { success: true, type: 'moveOccurrence' };
		} catch (error) {
			console.error('[Move Occurrence] Error:', error);
			return { error: error.message || 'Failed to move occurrence' };
		}
	}
};

