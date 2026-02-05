/**
 * Backfill organisationId on all Hub content rows that don't have it.
 * Uses the first organisation's ID (or pass org id/name as first arg).
 *
 * Run: node scripts/backfill-organisation-id.js [organisationId-or-name]
 * Example: node scripts/backfill-organisation-id.js "Eltham Green Community Church"
 *
 * Works with file store and database (uses store_mode.json / DATA_STORE).
 */
import 'dotenv/config';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import pg from 'pg';

const { Pool } = pg;
const TABLE_NAME = 'crm_records';

function getDataDir() {
	const envDataDir = process.env.CRM_DATA_DIR;
	if (envDataDir) return envDataDir;
	return join(process.cwd(), 'data');
}

const DATA_DIR = getDataDir();

async function getStoreMode() {
	const modePath = join(DATA_DIR, 'store_mode.json');
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

async function readNdjson(collection) {
	const filePath = join(DATA_DIR, `${collection}.ndjson`);
	if (!existsSync(filePath)) return [];
	try {
		const content = await readFile(filePath, 'utf8');
		if (!content.trim()) return [];
		return content
			.trim()
			.split('\n')
			.filter((line) => line.trim())
			.map((line) => JSON.parse(line));
	} catch (err) {
		if (err.code === 'ENOENT') return [];
		throw err;
	}
}

async function writeNdjson(collection, records) {
	await mkdir(DATA_DIR, { recursive: true });
	const filePath = join(DATA_DIR, `${collection}.ndjson`);
	await writeFile(
		filePath,
		records.map((r) => JSON.stringify(r)).join('\n') + '\n',
		'utf8'
	);
}

async function getOrganisationsFromDb() {
	const pool = getPool();
	const client = await pool.connect();
	try {
		const res = await client.query(
			`SELECT id, body FROM ${TABLE_NAME} WHERE collection = 'organisations' ORDER BY body->>'name'`
		);
		return res.rows.map((r) => ({ id: r.id, name: (r.body && r.body.name) || r.id }));
	} finally {
		client.release();
		await pool.end();
	}
}

async function backfillDatabase(organisationId) {
	const pool = getPool();
	const client = await pool.connect();
	let totalUpdated = 0;
	try {
		for (const collection of ORG_SCOPED_COLLECTIONS) {
			const res = await client.query(
				`SELECT id, body FROM ${TABLE_NAME} WHERE collection = $1`,
				[collection]
			);
			let count = 0;
			for (const row of res.rows) {
				const body = row.body || {};
				if (body.organisationId === undefined || body.organisationId === null || body.organisationId === '') {
					const newBody = { ...body, organisationId };
					await client.query(
						`UPDATE ${TABLE_NAME} SET body = $1::jsonb, updated_at = NOW() WHERE collection = $2 AND id = $3`,
						[JSON.stringify(newBody), collection, row.id]
					);
					count++;
				}
			}
			if (count > 0) {
				console.log('  ' + collection + ': set organisationId on ' + count + ' row(s)');
				totalUpdated += count;
			}
		}
	} finally {
		client.release();
		await pool.end();
	}
	return totalUpdated;
}

async function main() {
	const arg = process.argv[2];
	const storeMode = await getStoreMode();

	let organisationId;
	let orgName;

	if (storeMode === 'database') {
		const orgs = await getOrganisationsFromDb();
		if (orgs.length === 0) {
			console.error('No organisations found in database. Create an organisation in MultiOrg first.');
			process.exit(1);
		}
		if (arg) {
			const byId = orgs.find((o) => o.id === arg);
			const byName = orgs.find(
				(o) =>
					(o.name || '').toLowerCase().includes((arg || '').toLowerCase()) ||
					(arg || '').toLowerCase().includes((o.name || '').toLowerCase())
			);
			const chosen = byId || byName;
			if (!chosen) {
				console.error('No organisation matched "%s". Available:', arg);
				orgs.forEach((o) => console.log('  ', o.id, ' ', o.name));
				process.exit(1);
			}
			organisationId = chosen.id;
			orgName = chosen.name;
		} else {
			organisationId = orgs[0].id;
			orgName = orgs[0].name;
		}
	} else {
		const orgs = await readNdjson('organisations');
		const firstOrg = orgs && orgs.length > 0 ? orgs[0] : null;
		if (!firstOrg) {
			console.error('No organisations found. Create an organisation in MultiOrg first.');
			process.exit(1);
		}
		organisationId = firstOrg.id;
		orgName = firstOrg.name || firstOrg.id;
	}

	console.log('Using organisation:', orgName, '(' + organisationId + ')');
	console.log('Store mode:', storeMode);

	let totalUpdated = 0;

	if (storeMode === 'database') {
		totalUpdated = await backfillDatabase(organisationId);
	} else {
		for (const collection of ORG_SCOPED_COLLECTIONS) {
			const records = await readNdjson(collection);
			if (records.length === 0) continue;

			const needsUpdate = records.filter((r) => r.organisationId === undefined || r.organisationId === null);
			if (needsUpdate.length === 0) continue;

			const now = new Date().toISOString();
			const updated = records.map((r) => {
				if (r.organisationId === undefined || r.organisationId === null) {
					return { ...r, organisationId, updatedAt: r.updatedAt || now };
				}
				return r;
			});
			await writeNdjson(collection, updated);
			totalUpdated += needsUpdate.length;
			console.log('  ' + collection + ': set organisationId on ' + needsUpdate.length + ' row(s)');
		}

		const hubSettingsPath = join(DATA_DIR, 'hub_settings.ndjson');
		if (existsSync(hubSettingsPath)) {
			const content = await readFile(hubSettingsPath, 'utf8');
			const records = content
				.trim()
				.split('\n')
				.filter((line) => line.trim())
				.map((line) => JSON.parse(line));
			const defaultRecord = records.find((r) => r.id === 'default');
			if (
				defaultRecord &&
				(defaultRecord.currentOrganisationId === undefined || defaultRecord.currentOrganisationId === null)
			) {
				defaultRecord.currentOrganisationId = organisationId;
				defaultRecord.updatedAt = new Date().toISOString();
				await writeNdjson('hub_settings', records);
				console.log('  hub_settings: set currentOrganisationId to first organisation');
			}
		}
	}

	console.log('\nDone. Total rows updated:', totalUpdated);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
