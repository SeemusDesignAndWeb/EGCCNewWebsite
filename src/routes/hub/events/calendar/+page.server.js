import { readCollection } from '$lib/crm/server/fileStore.js';

export async function load({ url }) {
	const events = await readCollection('events');
	const occurrences = await readCollection('occurrences');

	// Enrich occurrences with event data
	const eventsMap = new Map(events.map(e => [e.id, e]));
	const enrichedOccurrences = occurrences.map(occ => ({
		...occ,
		event: eventsMap.get(occ.eventId) || null
	})).filter(occ => occ.event !== null);

	return {
		events,
		occurrences: enrichedOccurrences
	};
}

