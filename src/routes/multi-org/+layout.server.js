import { getMultiOrgCsrfToken } from '$lib/crm/server/multiOrgAuth.js';

export async function load({ cookies, locals }) {
	const csrfToken = getMultiOrgCsrfToken(cookies) || '';
	const multiOrgAdminDomain = !!locals.multiOrgAdminDomain;
	return {
		csrfToken,
		multiOrgAdmin: locals.multiOrgAdmin || null,
		/** When on admin subdomain (e.g. admin.onnuma.com), links use '' so /auth/login; else '/multi-org'. */
		multiOrgBasePath: multiOrgAdminDomain ? '' : '/multi-org'
	};
}
