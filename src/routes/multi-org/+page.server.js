import { redirect } from '@sveltejs/kit';
import { getMultiOrgPublicPath } from '$lib/crm/server/hubDomain.js';

export async function load({ locals }) {
	throw redirect(302, getMultiOrgPublicPath('/multi-org/organisations', !!locals.multiOrgAdminDomain));
}
