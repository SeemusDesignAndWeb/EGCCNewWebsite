import { redirect } from '@sveltejs/kit';
import { verifyAdminEmail, getAdminByEmail } from '$lib/crm/server/auth.js';

export async function load({ url, cookies }) {
	const token = url.searchParams.get('token');
	const email = url.searchParams.get('email');

	if (!token || !email) {
		return {
			status: 'error',
			message: 'Invalid verification link. Missing required parameters.',
			email: email || ''
		};
	}

	try {
		const admin = await getAdminByEmail(email);
		if (!admin) {
			return {
				status: 'error',
				message: 'Invalid or expired verification link. The email address may not be associated with an account.',
				email: email
			};
		}

		// Check if already verified
		if (admin.emailVerified) {
			return {
				status: 'already_verified',
				message: 'Your email address has already been verified. You can log in now.',
				email: email
			};
		}

		const verified = await verifyAdminEmail(admin.id, token);
		if (verified) {
			return {
				status: 'success',
				message: 'Email verified successfully! You can now log in to TheHUB.',
				email: email
			};
		} else {
			// Check if token expired
			if (admin.emailVerificationTokenExpires) {
				const expiresAt = new Date(admin.emailVerificationTokenExpires);
				if (expiresAt < new Date()) {
					return {
						status: 'error',
						message: 'This verification link has expired. Please request a new verification email.',
						email: email,
						expired: true
					};
				}
			}
			
			return {
				status: 'error',
				message: 'Invalid verification link. The link may have expired or been used already.',
				email: email
			};
		}
	} catch (error) {
		console.error('Email verification error:', error);
		return {
			status: 'error',
			message: 'An error occurred while verifying your email. Please try again or contact an administrator.',
			email: email || ''
		};
	}
}

