import { error } from '@sveltejs/kit';
import { isAuthenticated } from '$lib/server/auth';
import { readDatabase } from '$lib/server/database.js';

/**
 * GET /admin/settings/api/download-data
 * Admin only. Returns EGCC website content only (pages, events, hero slides, contact, services,
 * team, home, settings, etc.) from database.json — not HUB/CRM data.
 * Use for backup or for uploading to another environment (e.g. dev).
 */
export async function GET({ cookies }) {
	if (!isAuthenticated(cookies)) throw error(401, 'Unauthorized');

	const payload = { exportedAt: new Date().toISOString(), websiteContent: null };

	try {
		payload.websiteContent = readDatabase();
	} catch (err) {
		console.error('[download-data] websiteContent:', err);
		payload.errors = payload.errors || [];
		payload.errors.push({ source: 'websiteContent', error: err.message });
	}

	const filename = `egcc-content-${new Date().toISOString().slice(0, 10)}.json`;
	return new Response(JSON.stringify(payload, null, 2), {
		headers: {
			'Content-Type': 'application/json',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
}
