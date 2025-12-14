import { json } from '@sveltejs/kit';
import { getPages } from '$lib/server/database';

export const GET = async () => {
	try {
		const allPages = getPages();
		
		// Filter pages that should be shown in navigation
		const navigationPages = allPages
			.filter(page => page.showInNavigation !== false)
			.sort((a, b) => {
				const orderA = a.navigationOrder !== undefined ? a.navigationOrder : 999;
				const orderB = b.navigationOrder !== undefined ? b.navigationOrder : 999;
				if (orderA !== orderB) {
					return orderA - orderB;
				}
				return (a.title || '').localeCompare(b.title || '');
			});
		
		return json(navigationPages);
	} catch (error) {
		console.error('Failed to fetch navigation pages:', error);
		return json({ error: 'Failed to fetch navigation pages' }, { status: 500 });
	}
};









