import { redirect } from '@sveltejs/kit';
import { verifyAdminEmail, getAdminByEmail } from '$lib/crm/server/auth.js';
import { notifications } from '$lib/crm/stores/notifications.js';

export async function load({ url, cookies }) {
	const token = url.searchParams.get('token');
	const email = url.searchParams.get('email');

	if (!token || !email) {
		throw redirect(302, '/hub/auth/login?error=missing_params');
	}

	try {
		const admin = await getAdminByEmail(email);
		if (!admin) {
			throw redirect(302, '/hub/auth/login?error=invalid_token');
		}

		const verified = await verifyAdminEmail(admin.id, token);
		if (verified) {
			// Redirect to login with success message
			throw redirect(302, '/hub/auth/login?verified=true');
		} else {
			throw redirect(302, '/hub/auth/login?error=invalid_token');
		}
	} catch (error) {
		if (error.status === 302) {
			throw error; // Re-throw redirects
		}
		throw redirect(302, '/hub/auth/login?error=verification_failed');
	}
}

