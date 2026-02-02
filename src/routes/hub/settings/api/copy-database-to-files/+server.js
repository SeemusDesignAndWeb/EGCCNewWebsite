import { json, error } from '@sveltejs/kit';
import { getAdminFromCookies } from '$lib/crm/server/auth.js';
import { isSuperAdmin } from '$lib/crm/server/permissions.js';
import { copyFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { getDataDir } from '$lib/crm/server/fileStoreImpl.js';
import * as fileStoreImpl from '$lib/crm/server/fileStoreImpl.js';
import * as dbStore from '$lib/crm/server/dbStore.js';
import { COLLECTIONS_FOR_DB } from '$lib/crm/server/collections.js';

export async function POST({ cookies }) {
	const admin = await getAdminFromCookies(cookies);
	if (!admin) throw error(401, 'Unauthorized');
	if (!isSuperAdmin(admin)) throw error(403, 'Forbidden: Superadmin access required');

	const dataDir = getDataDir();
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
	const backupDir = join(dataDir, 'backup', timestamp);

	const results = { backupDir, backedUp: [], copied: [], errors: [] };

	try {
		// 1) Backup existing NDJSON files
		await mkdir(backupDir, { recursive: true });
		for (const collection of COLLECTIONS_FOR_DB) {
			const filePath = join(dataDir, `${collection}.ndjson`);
			if (existsSync(filePath)) {
				await copyFile(filePath, join(backupDir, `${collection}.ndjson`));
				results.backedUp.push(collection);
			}
		}

		// 2) Copy data from database to NDJSON files
		for (const collection of COLLECTIONS_FOR_DB) {
			try {
				const records = await dbStore.readCollection(collection);
				await fileStoreImpl.writeCollection(collection, records);
				results.copied.push({ collection, count: records.length });
			} catch (err) {
				console.error(`[copy-database-to-files] ${collection}:`, err);
				results.errors.push({ collection, error: err.message });
			}
		}

		return json({ success: true, results });
	} catch (err) {
		console.error('[copy-database-to-files]', err);
		return json(
			{ success: false, error: err.message, results },
			{ status: 500 }
		);
	}
}
