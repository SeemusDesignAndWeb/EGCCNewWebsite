#!/usr/bin/env node
/**
 * Run on deploy (e.g. before the app starts on Railway).
 * When using database: ensures crm_records table exists, then logs the organisation ID(s)
 * that have data so you can verify/set DEFAULT_ORGANISATION_ID or hub_settings.
 * Exits 0 so the server can start even if this is skipped or fails (when wrapped with || true).
 *
 * To create an admin, run manually: node -r dotenv/config scripts/create-admin.js <email> <password> [name]
 * Or on Railway: railway run -- ./scripts/create-admin-railway.sh
 */

const DATA_STORE = process.env.DATA_STORE?.trim().toLowerCase();
const DATABASE_URL = process.env.DATABASE_URL?.trim();
const USE_DATABASE = DATA_STORE === 'database' && !!DATABASE_URL;

const TABLE_NAME = 'crm_records';

/** Query organisation IDs that have data in org-scoped collections and log them. */
async function logOrganisationIdsWithData(client) {
	try {
		// Get distinct organisationIds from contacts (main org-scoped collection)
		const res = await client.query(
			`SELECT body->>'organisationId' AS org_id, COUNT(*)::int AS n
			 FROM ${TABLE_NAME}
			 WHERE collection = 'contacts' AND body->>'organisationId' IS NOT NULL AND body->>'organisationId' != ''
			 GROUP BY body->>'organisationId'
			 ORDER BY n DESC`
		);
		if (res.rows.length === 0) {
			// Fallback: check any org-scoped collection
			const any = await client.query(
				`SELECT DISTINCT body->>'organisationId' AS org_id FROM ${TABLE_NAME}
				 WHERE collection IN ('contacts','events','rotas','lists') AND body->>'organisationId' IS NOT NULL AND body->>'organisationId' != ''
				 LIMIT 10`
			);
			if (any.rows.length === 0) {
				console.log('[deploy] Organisation ID with data: (none — no org-scoped rows in database yet)');
				return;
			}
			const ids = any.rows.map((r) => r.org_id).filter(Boolean);
			console.log('[deploy] Organisation ID(s) with data in database:', ids.join(', '));
			return;
		}
		const rows = res.rows;
		const primary = rows[0];
		console.log('[deploy] Organisation ID with data (primary, from contacts):', primary.org_id, `(${primary.n} contacts)`);
		if (rows.length > 1) {
			const others = rows.slice(1).map((r) => `${r.org_id} (${r.n})`).join(', ');
			console.log('[deploy] Other organisation IDs with contacts:', others);
		}
		// Resolve name from organisations collection for convenience
		const orgRes = await client.query(
			`SELECT id, body->>'name' AS name FROM ${TABLE_NAME} WHERE collection = 'organisations' AND id = $1`,
			[primary.org_id]
		);
		if (orgRes.rows.length > 0 && orgRes.rows[0].name) {
			console.log('[deploy] Set DEFAULT_ORGANISATION_ID or hub_settings.currentOrganisationId to:', primary.org_id, '—', orgRes.rows[0].name);
		}
	} catch (err) {
		console.warn('[deploy] Could not determine organisation IDs:', err.message);
	}
}

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
		await logOrganisationIdsWithData(client);
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
