import { redirect, fail } from '@sveltejs/kit';
import { readCollection, remove } from '$lib/crm/server/fileStore.js';
import { getCsrfToken, verifyCsrfToken } from '$lib/crm/server/auth.js';

const ITEMS_PER_PAGE = 20;

export async function load({ url, cookies }) {
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

	const csrfToken = getCsrfToken(cookies) || '';
	return {
		rotas: enriched,
		currentPage: page,
		totalPages: Math.ceil(total / ITEMS_PER_PAGE),
		total,
		search,
		csrfToken
	};
}

export const actions = {
	delete: async ({ request, cookies, url }) => {
		const data = await request.formData();
		const csrfToken = data.get('_csrf');
		const rotaId = data.get('rotaId');

		if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
			return fail(403, { error: 'CSRF token validation failed' });
		}

		if (!rotaId) {
			return fail(400, { error: 'Rota ID is required' });
		}

		try {
			await remove('rotas', rotaId);
			
			// Preserve search and page params
			const page = url.searchParams.get('page') || '1';
			const search = url.searchParams.get('search') || '';
			const params = new URLSearchParams();
			if (search) params.set('search', search);
			params.set('page', page);
			
			throw redirect(302, `/hub/rotas?${params.toString()}`);
		} catch (error) {
			if (error.status === 302) throw error; // Re-throw redirects
			console.error('Error deleting rota:', error);
			return fail(400, { error: error.message || 'Failed to delete rota' });
		}
	}
};

