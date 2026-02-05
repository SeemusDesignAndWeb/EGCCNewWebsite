import { getMultiOrgCsrfToken } from '$lib/crm/server/multiOrgAuth.js';

export async function load({ cookies, locals }) {
	const csrfToken = getMultiOrgCsrfToken(cookies) || '';
	return {
		csrfToken,
		multiOrgAdmin: locals.multiOrgAdmin || null
	};
}
