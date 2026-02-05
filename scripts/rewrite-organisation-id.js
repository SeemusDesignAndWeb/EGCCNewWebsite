/**
 * Rewrite organisationId in all org-scoped rows to a target org id.
 * Use when data was created under an old org (e.g. 01KGNCSXHK6YNPEBCFMKH2VEQ7) and you
 * want it to belong to the current org (e.g. 01KGPQKWH613K5ZE1AJGTT571W).
 *
 * Run: node scripts/rewrite-organisation-id.js <target-organisation-id-or-name>
 * Example: node scripts/rewrite-organisation-id.js "Eltham Green Community Church"
 * Example: node scripts/rewrite-organisation-id.js 01KGPQKWH613K5ZE1AJGTT571W
 */
import 'dotenv/config';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import pg from 'pg';

const { Pool } = pg;
const TABLE_NAME = 'crm_records';

const ORG_SCOPED_COLLECTIONS = [
	'contacts',
	'lists',
	'events',
	'occurrences',
	'rotas',
	'meeting_planners',
	'forms',
	'registers',
	'emails',
	'email_templates',
	'members',
	'event_signups',
	'rota_tokens',
	'event_tokens',
	'contact_tokens',
	'occurrence_tokens',
	'loom_videos',
	'week_notes',
	'email_stats',
	'holidays'
];

function getDataDir() {
	return process.env.CRM_DATA_DIR || join(process.cwd(), 'data');
}

async function getStoreMode() {
	const dataDir = getDataDir();
	const modePath = join(dataDir, 'store_mode.json');
	if (existsSync(modePath)) {
		try {
			const content = await readFile(modePath, 'utf8');
			const data = JSON.parse(content);
			return (data.dataStore || 'file').toLowerCase();
		} catch {
			// fall through
		}
	}
	return (typeof process.env.DATA_STORE === 'string' &&
		process.env.DATA_STORE.trim().toLowerCase() === 'database')
		? 'database'
		: 'file';
}

function getPool() {
	const url = process.env.DATABASE_URL;
	if (!url) throw new Error('DATABASE_URL is required when using database store');
	return new Pool({
		connectionString: url,
		...(url.includes('localhost') || url.includes('127.0.0.1') ? {} : { ssl: { rejectUnauthorized: false } })
	});
}

async function resolveOrganisationId(arg) {
	const pool = getPool();
	const client = await pool.connect();
	try {
		const res = await client.query(
			`SELECT id, body->>'name' AS name FROM ${TABLE_NAME} WHERE collection = 'organisations'`
		);
		const orgs = res.rows.map((r) => ({ id: r.id, name: (r.name || '').trim() }));
		const byId = orgs.find((o) => o.id === arg);
		if (byId) return byId.id;
		const argLower = (arg || '').toLowerCase();
		const byName = orgs.find(
			(o) =>
				(o.name || '').toLowerCase().includes(argLower) ||
				argLower.includes((o.name || '').toLowerCase())
		);
		return byName ? byName.id : null;
	} finally {
		client.release();
		await pool.end();
	}
}

async function main() {
	const arg = process.argv[2];
	if (!arg) {
		console.error('Usage: node scripts/rewrite-organisation-id.js <target-organisation-id-or-name>');
		console.error('Example: node scripts/rewrite-organisation-id.js "Eltham Green Community Church"');
		process.exit(1);
	}

	const storeMode = await getStoreMode();
	if (storeMode !== 'database') {
		console.error('This script only supports database store.');
		process.exit(1);
	}

	const organisationId = (await resolveOrganisationId(arg)) || arg;
	console.log('Target organisationId:', organisationId);

	const pool = getPool();
	const client = await pool.connect();
	let totalRewritten = 0;

	try {
		for (const collection of ORG_SCOPED_COLLECTIONS) {
			const res = await client.query(
				`SELECT id, body FROM ${TABLE_NAME} WHERE collection = $1`,
				[collection]
			);
			let count = 0;
			for (const row of res.rows) {
				const body = row.body || {};
				const current = body.organisationId;
				if (current !== organisationId) {
					const newBody = { ...body, organisationId };
					await client.query(
						`UPDATE ${TABLE_NAME} SET body = $1::jsonb, updated_at = NOW() WHERE collection = $2 AND id = $3`,
						[JSON.stringify(newBody), collection, row.id]
					);
					count++;
				}
			}
			if (count > 0) {
				console.log('  ' + collection + ': rewritten ' + count + ' row(s) to organisationId', organisationId);
				totalRewritten += count;
			}
		}
	} finally {
		client.release();
		await pool.end();
	}

	console.log('\nDone. Total rows rewritten:', totalRewritten);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
