/**
 * Check which organisationIds exist in org-scoped collections.
 * Run: node scripts/check-organisation-ids.js
 * Use this to see what id the data actually has so you can either point the Hub at it
 * or run a script to rewrite all rows to the current org id.
 */
import 'dotenv/config';
import { readFile, mkdir } from 'fs/promises';
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

async function main() {
	const storeMode = await getStoreMode();
	console.log('Store mode:', storeMode);
	if (storeMode !== 'database') {
		console.log('This script only checks the database. Switch to database store or run with DATA_STORE=database.');
		process.exit(1);
	}

	const pool = getPool();
	const client = await pool.connect();

	try {
		// Current organisations
		const orgsRes = await client.query(
			`SELECT id, body->>'name' AS name FROM ${TABLE_NAME} WHERE collection = 'organisations' ORDER BY body->>'name'`
		);
		console.log('\nOrganisations in database:');
		orgsRes.rows.forEach((r) => console.log('  ', r.id, ' ', r.name || ''));

		// hub_settings current org
		const hubRes = await client.query(
			`SELECT body->>'currentOrganisationId' AS current FROM ${TABLE_NAME} WHERE collection = 'hub_settings' AND id = 'default'`
		);
		const currentId = hubRes.rows[0]?.current || null;
		console.log('\nHub currentOrganisationId (hub_settings):', currentId || '(not set)');

		// Per collection: distinct organisationIds and counts
		const idToCount = new Map();
		const idToCollections = new Map();

		for (const collection of ORG_SCOPED_COLLECTIONS) {
			const res = await client.query(
				`SELECT body->>'organisationId' AS org_id FROM ${TABLE_NAME} WHERE collection = $1`,
				[collection]
			);
			for (const row of res.rows) {
				const oid = row.org_id || '(null)';
				idToCount.set(oid, (idToCount.get(oid) || 0) + 1);
				const colls = idToCollections.get(oid) || new Set();
				colls.add(collection);
				idToCollections.set(oid, colls);
			}
		}

		console.log('\nOrganisationIds found in data (across all org-scoped collections):');
		const sorted = [...idToCount.entries()].sort((a, b) => b[1] - a[1]);
		for (const [oid, count] of sorted) {
			const colls = idToCollections.get(oid);
			const names = orgsRes.rows.filter((r) => r.id === oid).map((r) => r.name);
			const label = names.length ? names[0] : '';
			console.log('  ', oid, '  count:', count, label ? `(${label})` : '');
		}

		if (sorted.length > 0 && currentId && !idToCount.has(currentId)) {
			const [dominantId, dominantCount] = sorted[0];
			console.log('\n⚠️  Hub currentOrganisationId is', currentId, 'but no (or almost no) rows use it.');
			console.log('    Most rows use organisationId:', dominantId, '(' + dominantCount, 'rows).');
			console.log('\nTo fix: either set Hub to use the id that has the data:');
			console.log('    node scripts/set-hub-organisation.js', dominantId);
			console.log('\nOr rewrite all data to use the current org id (01KGPQKWH613K5ZE1AJGTT571W):');
			console.log('    node scripts/rewrite-organisation-id.js 01KGPQKWH613K5ZE1AJGTT571W');
		}
	} finally {
		client.release();
		await pool.end();
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
