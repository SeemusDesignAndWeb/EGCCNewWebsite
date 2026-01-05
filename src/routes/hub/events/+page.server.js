import { redirect } from '@sveltejs/kit';

// Redirect to calendar view by default
export async function load({ url }) {
	const view = url.searchParams.get('view');
	
	// If view=list, show list view, otherwise redirect to calendar
	if (view === 'list') {
		const { readCollection } = await import('$lib/crm/server/fileStore.js');
		const ITEMS_PER_PAGE = 20;
		const page = parseInt(url.searchParams.get('page') || '1', 10);
		const search = url.searchParams.get('search') || '';

		const events = await readCollection('events');
		
		let filtered = events;
		if (search) {
			const searchLower = search.toLowerCase();
			filtered = events.filter(e => 
				e.title?.toLowerCase().includes(searchLower)
			);
		}

		const total = filtered.length;
		const start = (page - 1) * ITEMS_PER_PAGE;
		const end = start + ITEMS_PER_PAGE;
		const paginated = filtered.slice(start, end);

		return {
			events: paginated,
			currentPage: page,
			totalPages: Math.ceil(total / ITEMS_PER_PAGE),
			total,
			search
		};
	}
	
	// Redirect to calendar view
	throw redirect(302, '/hub/events/calendar');
}

