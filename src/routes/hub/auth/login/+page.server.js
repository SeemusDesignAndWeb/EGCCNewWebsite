import { fail, redirect } from '@sveltejs/kit';
import { authenticateAdmin, createSession, setSessionCookie } from '$lib/crm/server/auth.js';
import { getCsrfToken, verifyCsrfToken } from '$lib/crm/server/auth.js';
import { logAuditEvent } from '$lib/crm/server/audit.js';

// Rate limiting for login attempts
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Clean up old entries periodically
function cleanupLoginAttempts() {
	const now = Date.now();
	for (const [ip, attempts] of loginAttempts.entries()) {
		if (attempts.lockedUntil && attempts.lockedUntil < now) {
			loginAttempts.delete(ip);
		} else if (!attempts.lockedUntil && attempts.count === 0) {
			// Remove entries with no attempts after 1 hour
			loginAttempts.delete(ip);
		}
	}
}

// Run cleanup every 5 minutes
setInterval(cleanupLoginAttempts, 5 * 60 * 1000);

export async function load({ cookies, url }) {
	const csrfToken = getCsrfToken(cookies) || '';
	
	// Check for verification status in URL
	const verified = url.searchParams.get('verified');
	const error = url.searchParams.get('error');
	
	let message = null;
	if (verified === 'true') {
		message = { type: 'success', text: 'Email verified successfully! You can now log in.' };
	} else if (url.searchParams.get('reset') === 'success') {
		message = { type: 'success', text: 'Password reset successfully! You can now log in with your new password.' };
	} else if (error === 'invalid_token') {
		message = { type: 'error', text: 'Invalid or expired verification link. Please contact an administrator.' };
	} else if (error === 'missing_params') {
		message = { type: 'error', text: 'Invalid verification link. Please contact an administrator.' };
	} else if (error === 'verification_failed') {
		message = { type: 'error', text: 'Email verification failed. Please contact an administrator.' };
	}

	return { csrfToken, message };
}

export const actions = {
	login: async ({ request, cookies, getClientAddress }) => {
		const data = await request.formData();
		const email = data.get('email');
		const password = data.get('password');
		const csrfToken = data.get('_csrf');

		// Verify CSRF token
		if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
			return fail(200, { error: 'CSRF token validation failed' });
		}

		if (!email || !password) {
			return fail(200, { error: 'Email and password are required' });
		}

		// Rate limiting check
		let clientIp;
		try {
			clientIp = getClientAddress();
		} catch (error) {
			// Fallback if getClientAddress is not available
			const forwarded = request.headers.get('x-forwarded-for');
			clientIp = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';
		}

		const attempts = loginAttempts.get(clientIp) || { count: 0, lockedUntil: null };

		// Check if locked out
		if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
			const remainingMinutes = Math.ceil((attempts.lockedUntil - Date.now()) / (60 * 1000));
			return fail(200, { error: `Too many login attempts. Please try again in ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}.` });
		}

		// Attempt authentication
		let admin;
		try {
			admin = await authenticateAdmin(email.toString(), password.toString());
		} catch (error) {
			// Handle account lockout or password expiration errors
			if (error.message.includes('locked') || error.message.includes('expired')) {
				return fail(200, { error: error.message });
			}
			// For other errors, treat as failed login
			admin = null;
		}
		
		if (!admin) {
			// Increment failed attempt count (IP-based)
			attempts.count++;
			if (attempts.count >= MAX_ATTEMPTS) {
				attempts.lockedUntil = Date.now() + LOCKOUT_DURATION;
			}
			loginAttempts.set(clientIp, attempts);
			
			// Log failed login attempt
			await logAuditEvent(null, 'login_failed', { email: email.toString(), attemptCount: attempts.count, locked: attempts.count >= MAX_ATTEMPTS }, { getClientAddress: () => clientIp, request });
			
			return fail(200, { error: 'Invalid email or password' });
		}

		// Successful login - reset attempts
		loginAttempts.delete(clientIp);

		const session = await createSession(admin.id);
		setSessionCookie(cookies, session.id, process.env.NODE_ENV === 'production');

		// Log successful login
		await logAuditEvent(admin.id, 'login', { success: true }, { getClientAddress: () => clientIp, request });

		throw redirect(302, '/hub');
	}
};

