import { redirect } from '@sveltejs/kit';
import { getMultiOrgAdminFromCookies, clearMultiOrgSessionCookie, removeMultiOrgSession } from '$lib/crm/server/multiOrgAuth.js';

export async function GET({ cookies }) {
	const admin = await getMultiOrgAdminFromCookies(cookies);
	const sessionId = cookies.get('multi_org_session');
	if (sessionId) {
		await removeMultiOrgSession(sessionId);
	}
	clearMultiOrgSessionCookie(cookies);
	throw redirect(302, '/multi-org/auth/login');
}
