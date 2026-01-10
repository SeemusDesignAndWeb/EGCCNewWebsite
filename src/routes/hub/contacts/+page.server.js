import { readCollection } from '$lib/crm/server/fileStore.js';

const ITEMS_PER_PAGE = 20;

export async function load({ url }) {
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const search = url.searchParams.get('search') || '';

	const contacts = await readCollection('contacts');
	
	// Sort contacts alphabetically by last name, then first name
	const sorted = contacts.sort((a, b) => {
		const aLastName = (a.lastName || '').toLowerCase();
		const bLastName = (b.lastName || '').toLowerCase();
		const aFirstName = (a.firstName || '').toLowerCase();
		const bFirstName = (b.firstName || '').toLowerCase();
		
		// First sort by last name
		if (aLastName !== bLastName) {
			return aLastName.localeCompare(bLastName);
		}
		// If last names are the same, sort by first name
		return aFirstName.localeCompare(bFirstName);
	});
	
	let filtered = sorted;
	if (search) {
		const searchLower = search.toLowerCase();
		filtered = sorted.filter(c => 
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

