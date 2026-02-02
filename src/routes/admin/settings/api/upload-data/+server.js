import { json, error } from '@sveltejs/kit';
import { isAuthenticated } from '$lib/server/auth';
import { writeCollection } from '$lib/crm/server/fileStore.js';
import { COLLECTIONS_FOR_DB } from '$lib/crm/server/collections.js';

const ALLOWED_COLLECTIONS = new Set(COLLECTIONS_FOR_DB);

/**
 * POST /admin/settings/api/upload-data
 * Admin only. Accepts JSON body: { collections: { contacts: [...], events: [...], ... } }.
 * Writes each allowed collection to the current store (file or database).
 * Use this on the development site to load data downloaded from production.
 */
export async function POST({ request, cookies }) {
	if (!isAuthenticated(cookies)) throw error(401, 'Unauthorized');

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
	}

	const collections = body?.collections;
	if (!collections || typeof collections !== 'object') {
		return json(
			{ success: false, error: 'Body must be { collections: { <name>: [...], ... } }' },
			{ status: 400 }
		);
	}

	const results = { written: [], errors: [] };

	for (const [name, records] of Object.entries(collections)) {
		if (!ALLOWED_COLLECTIONS.has(name)) {
			results.errors.push({ collection: name, error: 'Collection not allowed for upload' });
			continue;
		}
		if (!Array.isArray(records)) {
			results.errors.push({ collection: name, error: 'Each collection must be an array' });
			continue;
		}
		try {
			await writeCollection(name, records);
			results.written.push({ collection: name, count: records.length });
		} catch (err) {
			console.error(`[upload-data] ${name}:`, err);
			results.errors.push({ collection: name, error: err.message });
		}
	}

	return json({
		success: results.errors.length === 0,
		results
	});
}
