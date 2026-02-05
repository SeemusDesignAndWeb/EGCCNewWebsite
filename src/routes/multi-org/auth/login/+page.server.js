import { fail, redirect } from '@sveltejs/kit';
import {
	authenticateMultiOrgAdmin,
	createMultiOrgSession,
	setMultiOrgSessionCookie,
	getMultiOrgCsrfToken,
	verifyMultiOrgCsrfToken
} from '$lib/crm/server/multiOrgAuth.js';

export async function load({ cookies }) {
	const csrfToken = getMultiOrgCsrfToken(cookies) || '';
	return { csrfToken };
}

export const actions = {
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = data.get('email');
		const password = data.get('password');
		const csrfToken = data.get('_csrf');

		if (!csrfToken || !verifyMultiOrgCsrfToken(cookies, csrfToken)) {
			return fail(200, { error: 'CSRF token validation failed' });
		}

		if (!email || !password) {
			return fail(200, { error: 'Email and password are required' });
		}

		const admin = await authenticateMultiOrgAdmin(email.toString(), password.toString());
		if (!admin) {
			return fail(200, { error: 'Invalid email or password' });
		}

		const session = await createMultiOrgSession(admin.id);
		setMultiOrgSessionCookie(cookies, session.id, process.env.NODE_ENV === 'production');

		throw redirect(302, '/multi-org/organisations');
	}
};
