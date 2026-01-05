import { readCollection } from '$lib/crm/server/fileStore.js';

const ITEMS_PER_PAGE = 20;

export async function load({ url }) {
	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const search = url.searchParams.get('search') || '';

	const rotas = await readCollection('rotas');
	const events = await readCollection('events');
	
	let filtered = rotas;
	if (search) {
		const searchLower = search.toLowerCase();
		filtered = rotas.filter(r => {
			const event = events.find(e => e.id === r.eventId);
			return r.role?.toLowerCase().includes(searchLower) ||
				event?.title?.toLowerCase().includes(searchLower);
		});
	}

	const total = filtered.length;
	const start = (page - 1) * ITEMS_PER_PAGE;
	const end = start + ITEMS_PER_PAGE;
	const paginated = filtered.slice(start, end);

	// Enrich with event data
	const enriched = paginated.map(rota => {
		const event = events.find(e => e.id === rota.eventId);
		return { ...rota, eventTitle: event?.title || 'Unknown Event' };
	});

	return {
		rotas: enriched,
		currentPage: page,
		totalPages: Math.ceil(total / ITEMS_PER_PAGE),
		total,
		search
	};
}

