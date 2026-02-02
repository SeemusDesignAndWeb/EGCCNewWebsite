import { json, error } from '@sveltejs/kit';
import { isAuthenticated } from '$lib/server/auth';
import { writeDatabase } from '$lib/server/database.js';

/**
 * POST /admin/settings/api/upload-data
 * Admin only. Accepts JSON body with websiteContent: EGCC website data (pages, events, hero slides,
 * contact, services, team, home, settings, etc.) — written to database.json. HUB data is not accepted.
 * Use on the development site to load data downloaded from production.
 */
export async function POST({ request, cookies }) {
	if (!isAuthenticated(cookies)) throw error(401, 'Unauthorized');

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
	}

	const websiteContent = body?.websiteContent;
	if (websiteContent == null || typeof websiteContent !== 'object') {
		return json(
			{ success: false, error: 'Body must be { websiteContent: { ... } } from an EGCC admin download' },
			{ status: 400 }
		);
	}

	const results = { written: [], errors: [] };
	try {
		writeDatabase(websiteContent);
		results.written.push({ source: 'websiteContent', description: 'EGCC website pages, events, hero slides, contact, services, etc.' });
	} catch (err) {
		console.error('[upload-data] websiteContent:', err);
		results.errors.push({ source: 'websiteContent', error: err.message });
	}

	return json({
		success: results.errors.length === 0,
		results
	});
}
