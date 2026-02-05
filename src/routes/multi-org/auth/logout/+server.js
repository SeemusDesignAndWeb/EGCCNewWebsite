import { redirect } from '@sveltejs/kit';
import { getMultiOrgPublicPath } from '$lib/crm/server/hubDomain.js';
import { clearMultiOrgSessionCookie, removeMultiOrgSession } from '$lib/crm/server/multiOrgAuth.js';

export async function GET({ cookies, locals }) {
	try {
		const sessionId = cookies.get('multi_org_session');
		if (sessionId) {
			await removeMultiOrgSession(sessionId);
		}
	} catch (err) {
		// Log but don't fail: ensure user is logged out (clear cookie + redirect) even if
		// session store is unavailable or throws
		if (process.env.NODE_ENV !== 'production') {
			console.error('[multi-org logout]', err);
		}
	}

	clearMultiOrgSessionCookie(cookies, !!locals.multiOrgAdminDomain);
	throw redirect(302, getMultiOrgPublicPath('/multi-org/auth/login', !!locals.multiOrgAdminDomain));
}
