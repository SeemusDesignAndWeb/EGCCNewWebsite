import { error } from '@sveltejs/kit';
import { isAuthenticated } from '$lib/server/auth';
import { readCollection } from '$lib/crm/server/fileStore.js';
import { COLLECTIONS_FOR_DB } from '$lib/crm/server/collections.js';

/**
 * GET /admin/settings/api/download-data
 * Admin only. Returns all website content (CRM collections except admins/sessions/audit_logs)
 * as a single JSON file for backup or for uploading to another environment (e.g. dev).
 */
export async function GET({ cookies }) {
	if (!isAuthenticated(cookies)) throw error(401, 'Unauthorized');

	const payload = { exportedAt: new Date().toISOString(), collections: {} };

	for (const collection of COLLECTIONS_FOR_DB) {
		try {
			const records = await readCollection(collection);
			payload.collections[collection] = records;
		} catch (err) {
			console.error(`[download-data] ${collection}:`, err);
			payload.collections[collection] = [];
			payload.errors = payload.errors || [];
			payload.errors.push({ collection, error: err.message });
		}
	}

	const filename = `egcc-content-${new Date().toISOString().slice(0, 10)}.json`;
	return new Response(JSON.stringify(payload, null, 2), {
		headers: {
			'Content-Type': 'application/json',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
}
