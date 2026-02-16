import { readCollection } from '$lib/crm/server/fileStore.js';
import { getCurrentOrganisationId, filterByOrganisation } from '$lib/crm/server/orgContext.js';

const ITEMS_PER_PAGE = 20;

export async function load({ url }) {
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const search = url.searchParams.get('search') || '';

	const organisationId = await getCurrentOrganisationId();
	const meetingPlanners = filterByOrganisation(await readCollection('meeting_planners'), organisationId);
	const events = filterByOrganisation(await readCollection('events'), organisationId);
	const occurrences = filterByOrganisation(await readCollection('occurrences'), organisationId);

	// Today at midnight for excluding previous dates
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// Enrich with event and occurrence data, then filter out previous dates
	const enrichedAll = meetingPlanners.map(mp => {
		const event = events.find(e => e.id === mp.eventId);
		const occurrence = mp.occurrenceId ? occurrences.find(o => o.id === mp.occurrenceId) : null;
		return {
			...mp,
			eventTitle: event?.title || 'Unknown Event',
			occurrenceDate: occurrence ? occurrence.startsAt : null
		};
	});

	// Exclude previous dates (keep "All occurrences" and today or future)
	let filtered = enrichedAll.filter(mp => {
		if (!mp.occurrenceDate) return true;
		const occurrenceDate = new Date(mp.occurrenceDate);
		if (isNaN(occurrenceDate.getTime())) return true;
		occurrenceDate.setHours(0, 0, 0, 0);
		return occurrenceDate >= today;
	});

	if (search) {
		const searchLower = search.toLowerCase();
		filtered = filtered.filter(mp => mp.eventTitle?.toLowerCase().includes(searchLower));
	}

	const total = filtered.length;
	const start = (page - 1) * ITEMS_PER_PAGE;
	const end = start + ITEMS_PER_PAGE;
	const paginated = filtered.slice(start, end);

	return {
		meetingPlanners: paginated,
		currentPage: page,
		totalPages: Math.ceil(total / ITEMS_PER_PAGE),
		total,
		search
	};
}
