#!/usr/bin/env node
/**
 * Run on deploy (e.g. before the app starts on Railway).
 * - When using database: ensures crm_records table exists and at least one admin exists
 *   (creates from SUPER_ADMIN_EMAIL + ADMIN_PASSWORD if none; generates strong password if missing or < 12 chars).
 * - Exits 0 so the server can start even if this is skipped or fails (when wrapped with || true).
 *
 * Set SUPER_ADMIN_EMAIL in production; ADMIN_PASSWORD is optional (generated and logged if missing/short).
 */

import { execFileSync, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

const DATA_STORE = process.env.DATA_STORE?.trim().toLowerCase();
const DATABASE_URL = process.env.DATABASE_URL?.trim();
const USE_DATABASE = DATA_STORE === 'database' && !!DATABASE_URL;

async function main() {
	if (!USE_DATABASE) {
		console.log('[deploy] DATA_STORE is not database or DATABASE_URL missing; skipping deploy script.');
		return;
	}

	const pg = (await import('pg')).default;
	const { getCreateTableSql, TABLE_NAME } = await import('../src/lib/crm/server/dbSchema.js');

	const pool = new pg.Pool({
		connectionString: DATABASE_URL,
		ssl: DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1')
			? false
			: { rejectUnauthorized: false }
	});

	const client = await pool.connect();
	try {
		await client.query(getCreateTableSql());
		const count = await client.query(
			`SELECT 1 FROM ${TABLE_NAME} WHERE collection = $1 LIMIT 1`,
			['admins']
		);
		client.release();
		await pool.end();

		if (count.rows.length > 0) {
			console.log('[deploy] At least one admin exists; skipping admin creation.');
			return;
		}

		let email = process.env.SUPER_ADMIN_EMAIL?.trim();
		let password = process.env.ADMIN_PASSWORD?.trim() || '';
		if (!email) {
			console.warn('[deploy] No admins in database. Set SUPER_ADMIN_EMAIL (and optionally ADMIN_PASSWORD) and redeploy.');
			return;
		}
		if (password.length < 12) {
			password = execSync('node scripts/generate-password.js', { encoding: 'utf8', cwd: rootDir }).trim();
			process.env.ADMIN_PASSWORD = password;
			console.log('[deploy] No admins found; creating initial admin (password generated).');
			console.log('[deploy] ⚠️  Save this password from the logs — you need it to log in:');
			console.log('[deploy]    ' + password);
		} else {
			console.log('[deploy] No admins found; creating initial admin from SUPER_ADMIN_EMAIL.');
		}

		execFileSync(
			process.execPath,
			['-r', 'dotenv/config', join(rootDir, 'scripts', 'create-admin.js'), email, '', 'Admin'],
			{ stdio: 'inherit', cwd: rootDir, env: { ...process.env, ADMIN_PASSWORD: password } }
		);
	} catch (err) {
		client.release?.();
		await pool.end?.();
		console.error('[deploy] Error:', err.message);
		throw err;
	}
}

main().then(
	() => process.exit(0),
	() => process.exit(1)
);
