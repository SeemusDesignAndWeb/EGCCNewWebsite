import { readCollection } from '$lib/crm/server/fileStore.js';

const ITEMS_PER_PAGE = 20;

export async function load({ url }) {
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const search = url.searchParams.get('search') || '';

	const contacts = await readCollection('contacts');
	
	let filtered = contacts;
	if (search) {
		const searchLower = search.toLowerCase();
		filtered = contacts.filter(c => 
			c.email?.toLowerCase().includes(searchLower) ||
			c.firstName?.toLowerCase().includes(searchLower) ||
			c.lastName?.toLowerCase().includes(searchLower)
		);
	}

	const total = filtered.length;
	const start = (page - 1) * ITEMS_PER_PAGE;
	const end = start + ITEMS_PER_PAGE;
	const paginated = filtered.slice(start, end);

	return {
		contacts: paginated,
		currentPage: page,
		totalPages: Math.ceil(total / ITEMS_PER_PAGE),
		total,
		search
	};
}

