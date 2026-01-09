import { readCollection } from '$lib/crm/server/fileStore.js';

const ITEMS_PER_PAGE = 20;

export async function load({ url }) {
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const search = url.searchParams.get('search') || '';

	const meetingPlanners = await readCollection('meeting_planners');
	const events = await readCollection('events');
	const occurrences = await readCollection('occurrences');
	
	let filtered = meetingPlanners;
	if (search) {
		const searchLower = search.toLowerCase();
		filtered = meetingPlanners.filter(mp => {
			const event = events.find(e => e.id === mp.eventId);
			return event?.title?.toLowerCase().includes(searchLower);
		});
	}

	const total = filtered.length;
	const start = (page - 1) * ITEMS_PER_PAGE;
	const end = start + ITEMS_PER_PAGE;
	const paginated = filtered.slice(start, end);

	// Enrich with event and occurrence data
	const enriched = paginated.map(mp => {
		const event = events.find(e => e.id === mp.eventId);
		const occurrence = mp.occurrenceId ? occurrences.find(o => o.id === mp.occurrenceId) : null;
		return { 
			...mp, 
			eventTitle: event?.title || 'Unknown Event',
			occurrenceDate: occurrence ? occurrence.startsAt : null
		};
	});

	return {
		meetingPlanners: enriched,
		currentPage: page,
		totalPages: Math.ceil(total / ITEMS_PER_PAGE),
		total,
		search
	};
}
