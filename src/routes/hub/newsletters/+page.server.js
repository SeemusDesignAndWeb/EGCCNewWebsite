import { readCollection } from '$lib/crm/server/fileStore.js';

const ITEMS_PER_PAGE = 20;

export async function load({ url }) {
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const search = url.searchParams.get('search') || '';

	const newsletters = await readCollection('newsletters');
	
	let filtered = newsletters;
	if (search) {
		const searchLower = search.toLowerCase();
		filtered = newsletters.filter(n => 
			n.subject?.toLowerCase().includes(searchLower)
		);
	}

	const total = filtered.length;
	const start = (page - 1) * ITEMS_PER_PAGE;
	const end = start + ITEMS_PER_PAGE;
	const paginated = filtered.slice(start, end);

	return {
		newsletters: paginated,
		currentPage: page,
		totalPages: Math.ceil(total / ITEMS_PER_PAGE),
		total,
		search
	};
}

