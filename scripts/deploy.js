#!/usr/bin/env node
/**
 * Run on deploy (e.g. before the app starts on Railway).
 * When using database: ensures crm_records table exists.
 * Exits 0 so the server can start even if this is skipped or fails (when wrapped with || true).
 *
 * To create an admin, run manually: node -r dotenv/config scripts/create-admin.js <email> <password> [name]
 * Or on Railway: railway run -- ./scripts/create-admin-railway.sh
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const DATA_STORE = process.env.DATA_STORE?.trim().toLowerCase();
const DATABASE_URL = process.env.DATABASE_URL?.trim();
const USE_DATABASE = DATA_STORE === 'database' && !!DATABASE_URL;

async function main() {
	if (!USE_DATABASE) {
		console.log('[deploy] DATA_STORE is not database or DATABASE_URL missing; skipping deploy script.');
		return;
	}

	const pg = (await import('pg')).default;
	const { getCreateTableSql } = await import('../src/lib/crm/server/dbSchema.js');

	const pool = new pg.Pool({
		connectionString: DATABASE_URL,
		ssl: DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1')
			? false
			: { rejectUnauthorized: false }
	});

	const client = await pool.connect();
	try {
		await client.query(getCreateTableSql());
		console.log('[deploy] Database table ready.');
	} catch (err) {
		console.error('[deploy] Error:', err.message);
		throw err;
	} finally {
		client.release();
		await pool.end();
	}
}

main().then(
	() => process.exit(0),
	() => process.exit(1)
);
