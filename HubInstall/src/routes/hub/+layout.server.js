import { getCsrfToken } from '$lib/crm/server/auth.js';

export async function load({ cookies, locals }) {
	const csrfToken = getCsrfToken(cookies);
	return {
		csrfToken,
		admin: locals.admin || null
	};
}

