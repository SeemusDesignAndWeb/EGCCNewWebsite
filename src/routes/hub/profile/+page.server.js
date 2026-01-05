import { redirect } from '@sveltejs/kit';
import { getAdminFromCookies, getAdminById, getAdminByEmail, updateAdminPassword, getCsrfToken, verifyCsrfToken } from '$lib/crm/server/auth.js';
import { update } from '$lib/crm/server/fileStore.js';

export async function load({ cookies, locals }) {
	// Get the current logged-in admin
	const admin = locals.admin;
	if (!admin) {
		throw redirect(302, '/hub/auth/login');
	}

	// Get full admin record
	const fullAdmin = await getAdminById(admin.id);
	if (!fullAdmin) {
		throw redirect(302, '/hub/auth/login');
	}

	// Remove sensitive data before sending to client
	const sanitized = {
		id: fullAdmin.id,
		email: fullAdmin.email,
		name: fullAdmin.name,
		role: fullAdmin.role,
		emailVerified: fullAdmin.emailVerified || false,
		createdAt: fullAdmin.createdAt,
		passwordChangedAt: fullAdmin.passwordChangedAt
	};

	const csrfToken = getCsrfToken(cookies) || '';
	return { admin: sanitized, csrfToken };
}

export const actions = {
	updateEmail: async ({ request, cookies, locals }) => {
		const data = await request.formData();
		const csrfToken = data.get('_csrf');

		if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
			return { error: 'CSRF token validation failed' };
		}

		// Get current admin
		const currentAdmin = locals.admin;
		if (!currentAdmin) {
			return { error: 'Not authenticated' };
		}

		try {
			const newEmail = data.get('email');

			if (!newEmail) {
				return { error: 'Email is required' };
			}

			// Check if email is already taken by another admin
			const existing = await getAdminByEmail(newEmail.toString());
			if (existing && existing.id !== currentAdmin.id) {
				return { error: 'An admin with this email already exists' };
			}

			// Update email
			await update('admins', currentAdmin.id, {
				email: newEmail.toString(),
				// Reset email verification when email changes
				emailVerified: false,
				emailVerificationToken: null,
				emailVerificationTokenExpires: null
			});

			return { success: true, message: 'Email updated successfully. Please verify your new email address.' };
		} catch (error) {
			return { error: error.message || 'Failed to update email' };
		}
	},

	updatePassword: async ({ request, cookies, locals }) => {
		const data = await request.formData();
		const csrfToken = data.get('_csrf');

		if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
			return { error: 'CSRF token validation failed' };
		}

		// Get current admin
		const currentAdmin = locals.admin;
		if (!currentAdmin) {
			return { error: 'Not authenticated' };
		}

		try {
			const currentPassword = data.get('currentPassword');
			const newPassword = data.get('newPassword');
			const confirmPassword = data.get('confirmPassword');

			if (!currentPassword || !newPassword || !confirmPassword) {
				return { error: 'All password fields are required' };
			}

			if (newPassword.toString() !== confirmPassword.toString()) {
				return { error: 'New passwords do not match' };
			}

			// Verify current password
			const admin = await getAdminById(currentAdmin.id);
			const { verifyPassword } = await import('$lib/crm/server/auth.js');
			const isValid = await verifyPassword(currentPassword.toString(), admin.passwordHash);
			
			if (!isValid) {
				return { error: 'Current password is incorrect' };
			}

			// Update password
			await updateAdminPassword(currentAdmin.id, newPassword.toString());

			return { success: true, message: 'Password updated successfully' };
		} catch (error) {
			return { error: error.message || 'Failed to update password' };
		}
	}
};

