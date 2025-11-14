import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

const ADMIN_SESSION_KEY = 'admin_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export function isAuthenticated(cookies) {
	const session = cookies.get(ADMIN_SESSION_KEY);
	if (!session) return false;

	try {
		const { timestamp, hash } = JSON.parse(session);
		const now = Date.now();

		// Check if session expired
		if (now - timestamp > SESSION_DURATION) {
			cookies.delete(ADMIN_SESSION_KEY, { path: '/' });
			return false;
		}

		// Verify hash matches password
		const adminPassword = env.ADMIN_PASSWORD || 'admin';
		const expectedHash = hashPassword(adminPassword);
		return hash === expectedHash;
	} catch {
		return false;
	}
}

export function createSession(cookies, password) {
	const adminPassword = env.ADMIN_PASSWORD || 'admin';
	if (password !== adminPassword) {
		return false;
	}

	const hash = hashPassword(password);
	const session = JSON.stringify({
		timestamp: Date.now(),
		hash
	});

	cookies.set(ADMIN_SESSION_KEY, session, {
		path: '/',
		maxAge: SESSION_DURATION / 1000,
		httpOnly: true,
		sameSite: 'strict',
		secure: process.env.NODE_ENV === 'production'
	});

	return true;
}

export function destroySession(cookies) {
	cookies.delete(ADMIN_SESSION_KEY, { path: '/' });
}

export function requireAuth(event) {
	if (!isAuthenticated(event.cookies)) {
		throw redirect(302, '/admin/login');
	}
}

function hashPassword(password) {
	// Simple hash function (in production, use bcrypt or similar)
	let hash = 0;
	for (let i = 0; i < password.length; i++) {
		const char = password.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	return hash.toString(36);
}
