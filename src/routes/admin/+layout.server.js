import { redirect } from '@sveltejs/kit';
import { isAuthenticated } from '$lib/server/auth';

export const load = async ({ cookies, url }) => {
	// Allow access to login page without authentication
	if (url.pathname === '/admin/login') {
		return {};
	}

	// Require authentication for all other admin pages
	if (!isAuthenticated(cookies)) {
		throw redirect(302, '/admin/login');
	}

	return {};
};
