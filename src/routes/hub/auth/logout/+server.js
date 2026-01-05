import { redirect } from '@sveltejs/kit';
import { clearSessionCookie, getAdminFromCookies, removeSession } from '$lib/crm/server/auth.js';

export async function GET({ cookies }) {
	const admin = await getAdminFromCookies(cookies);
	if (admin) {
		const sessionId = cookies.get('crm_session');
		if (sessionId) {
			await removeSession(sessionId);
		}
	}
	
	clearSessionCookie(cookies);
	throw redirect(302, '/hub/auth/login');
}

