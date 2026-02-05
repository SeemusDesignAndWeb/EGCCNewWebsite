/**
 * Set the Hub's current organisation (hub_settings.currentOrganisationId).
 * Use when the Hub has lost connection to its data after organisations were lost/restored.
 *
 * Run: node scripts/set-hub-organisation.js [organisationId-or-name]
 * Examples:
 *   node scripts/set-hub-organisation.js 01KGNCSXHK6YNPEBCFMKH2VEQ7
 *   node scripts/set-hub-organisation.js "Eltham Green Community Church"
 *   node scripts/set-hub-organisation.js   (lists organisations; then run again with id or name)
 *
 * Uses database when store mode is database; otherwise uses file store.
 */
import 'dotenv/config';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import pg from 'pg';

const { Pool } = pg;
const TABLE_NAME = 'crm_records';

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

async function listOrganisationsFromDb() {
	const pool = getPool();
	const client = await pool.connect();
	try {
		const res = await client.query(
			`SELECT id, body FROM ${TABLE_NAME} WHERE collection = $1 ORDER BY body->>'name'`,
			['organisations']
		);
		return res.rows.map((r) => ({ id: r.id, name: (r.body && r.body.name) || r.id }));
	} finally {
		client.release();
		await pool.end();
	}
}

async function setHubOrganisationInDb(organisationId) {
	const pool = getPool();
	const client = await pool.connect();
	try {
		const res = await client.query(
			`SELECT id, body FROM ${TABLE_NAME} WHERE collection = 'hub_settings' AND id = 'default'`
		);
		if (res.rows.length === 0) {
			// Create default hub_settings record
			const body = { currentOrganisationId: organisationId };
			await client.query(
				`INSERT INTO ${TABLE_NAME} (collection, id, body, created_at, updated_at) VALUES ('hub_settings', 'default', $1::jsonb, NOW(), NOW())`,
				[JSON.stringify(body)]
			);
		} else {
			const body = { ...res.rows[0].body, currentOrganisationId: organisationId };
			await client.query(
				`UPDATE ${TABLE_NAME} SET body = $1::jsonb, updated_at = NOW() WHERE collection = 'hub_settings' AND id = 'default'`,
				[JSON.stringify(body)]
			);
		}
	} finally {
		client.release();
		await pool.end();
	}
}

async function listOrganisationsFromFile() {
	const dataDir = getDataDir();
	const path = join(dataDir, 'organisations.ndjson');
	if (!existsSync(path)) return [];
	const content = await readFile(path, 'utf8');
	if (!content.trim()) return [];
	return content
		.trim()
		.split('\n')
		.filter((l) => l.trim())
		.map((l) => {
			const o = JSON.parse(l);
			return { id: o.id, name: o.name || o.id };
		});
}

async function setHubOrganisationInFile(organisationId) {
	const dataDir = getDataDir();
	await mkdir(dataDir, { recursive: true });
	const path = join(dataDir, 'hub_settings.ndjson');
	let records = [];
	if (existsSync(path)) {
		const content = await readFile(path, 'utf8');
		if (content.trim()) {
			records = content.trim().split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
		}
	}
	const defaultRecord = records.find((r) => r.id === 'default');
	if (defaultRecord) {
		defaultRecord.currentOrganisationId = organisationId;
		defaultRecord.updatedAt = new Date().toISOString();
	} else {
		records.push({
			id: 'default',
			currentOrganisationId: organisationId,
			updatedAt: new Date().toISOString()
		});
	}
	await writeFile(path, records.map((r) => JSON.stringify(r)).join('\n') + '\n', 'utf8');
}

async function main() {
	const arg = process.argv[2];
	const storeMode = await getStoreMode();

	const orgs = storeMode === 'database' ? await listOrganisationsFromDb() : await listOrganisationsFromFile();

	if (orgs.length === 0) {
		console.error('No organisations found. Create an organisation in MultiOrg first.');
		process.exit(1);
	}

	let organisationId = null;
	if (arg) {
		const byId = orgs.find((o) => o.id === arg);
		if (byId) {
			organisationId = byId.id;
		} else {
			const nameLower = arg.toLowerCase();
			const byName = orgs.find(
				(o) => (o.name || '').toLowerCase().includes(nameLower) || nameLower.includes((o.name || '').toLowerCase())
			);
			if (byName) {
				organisationId = byName.id;
			}
		}
		if (!organisationId) {
			console.error('No organisation matched "%s". Available:', arg);
			orgs.forEach((o) => console.log('  ', o.id, ' ', o.name));
			process.exit(1);
		}
	} else {
		console.log('Organisations:');
		orgs.forEach((o) => console.log('  ', o.id, '  ', o.name));
		console.log('\nRun with organisation id or name to set as Hub organisation:');
		console.log('  node scripts/set-hub-organisation.js <id-or-name>');
		console.log('Example: node scripts/set-hub-organisation.js "Eltham Green Community Church"');
		return;
	}

	if (storeMode === 'database') {
		await setHubOrganisationInDb(organisationId);
	} else {
		await setHubOrganisationInFile(organisationId);
	}

	const org = orgs.find((o) => o.id === organisationId);
	console.log('✅ Hub current organisation set to:', org?.name || organisationId, '(' + organisationId + ')');
	console.log('   The Hub will now show this organisation\'s data.');
}

main().catch((err) => {
	console.error('❌', err.message);
	process.exit(1);
});
