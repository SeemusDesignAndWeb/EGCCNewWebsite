/**
 * Reset a Hub admin password (when you've forgotten it).
 * Run from project root: node scripts/reset-password.js <email> <new-password>
 * Example: node scripts/reset-password.js john@egcc.co.uk "NewSecurePass123!"
 * Loads .env so DATABASE_URL is set when using database store.
 * Works with both file store and database; if on database and admin not in DB, tries file and adds to DB.
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import pg from 'pg';

const { Pool } = pg;
const TABLE_NAME = 'crm_records';

function getDataDir() {
	return process.env.CRM_DATA_DIR || join(process.cwd(), 'data');
}

const ADMINS_FILE = join(getDataDir(), 'admins.ndjson');

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
	return (typeof process.env.DATA_STORE === 'string' && process.env.DATA_STORE.trim().toLowerCase() === 'database')
		? 'database'
		: 'file';
}

async function ensureDir() {
	const dir = getDataDir();
	if (!existsSync(dir)) {
		await mkdir(dir, { recursive: true });
	}
}

async function readAdminsFromFile() {
	await ensureDir();
	if (!existsSync(ADMINS_FILE)) return [];
	const content = await readFile(ADMINS_FILE, 'utf8');
	if (!content.trim()) return [];
	return content.trim().split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
}

async function writeAdminsToFile(admins) {
	await ensureDir();
	await writeFile(ADMINS_FILE, admins.map((a) => JSON.stringify(a)).join('\n') + '\n', 'utf8');
}

function getPool() {
	const url = process.env.DATABASE_URL;
	if (!url) throw new Error('DATABASE_URL is required when using database store');
	return new Pool({
		connectionString: url,
		...(url.includes('localhost') || url.includes('127.0.0.1') ? {} : { ssl: { rejectUnauthorized: false } })
	});
}

async function resetInDatabase(email, hashedPassword) {
	const pool = getPool();
	const client = await pool.connect();
	try {
		const res = await client.query(
			`SELECT id, body FROM ${TABLE_NAME} WHERE collection = $1`,
			['admins']
		);
		const normalized = email.toLowerCase().trim();
		const row = res.rows.find((r) => (r.body?.email || '').toLowerCase().trim() === normalized);
		if (!row) return null;
		const now = new Date().toISOString();
		const body = {
			...row.body,
			passwordHash: hashedPassword,
			passwordChangedAt: now,
			passwordResetToken: null,
			passwordResetTokenExpires: null,
			failedLoginAttempts: 0,
			accountLockedUntil: null
		};
		await client.query(
			`UPDATE ${TABLE_NAME} SET body = $1::jsonb, updated_at = NOW() WHERE collection = 'admins' AND id = $2`,
			[JSON.stringify(body), row.id]
		);
		return { email: row.body?.email || email };
	} finally {
		client.release();
		await pool.end();
	}
}

async function ensureInDatabaseFromFile(email, hashedPassword) {
	const admins = await readAdminsFromFile();
	const normalized = email.toLowerCase().trim();
	const admin = admins.find((a) => (a.email || '').toLowerCase().trim() === normalized);
	if (!admin) return null;
	const pool = getPool();
	const client = await pool.connect();
	try {
		const now = new Date().toISOString();
		const record = {
			...admin,
			passwordHash: hashedPassword,
			passwordChangedAt: now,
			updatedAt: now,
			passwordResetToken: null,
			passwordResetTokenExpires: null,
			failedLoginAttempts: 0,
			accountLockedUntil: null
		};
		const body = { ...record };
		delete body.id;
		delete body.createdAt;
		delete body.updatedAt;
		await client.query(
			`INSERT INTO ${TABLE_NAME} (collection, id, body, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)`,
			['admins', record.id, JSON.stringify(body), record.createdAt || null, record.updatedAt]
		);
		return { email: record.email };
	} finally {
		client.release();
		await pool.end();
	}
}

function validatePassword(password) {
	if (!password || password.length < 12) throw new Error('Password must be at least 12 characters long');
	if (!/[a-z]/.test(password)) throw new Error('Password must contain at least one lowercase letter');
	if (!/[A-Z]/.test(password)) throw new Error('Password must contain at least one uppercase letter');
	if (!/[0-9]/.test(password)) throw new Error('Password must contain at least one number');
	if (!/[^a-zA-Z0-9]/.test(password)) throw new Error('Password must contain at least one special character');
	return true;
}

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
	console.error('Usage: node scripts/reset-password.js <email> <new-password>');
	console.error('Example: node scripts/reset-password.js john@egcc.co.uk "NewSecurePass123!"');
	process.exit(1);
}

try {
	validatePassword(newPassword);
	const hashedPassword = await bcrypt.hash(newPassword, 10);
	const storeMode = await getStoreMode();

	if (storeMode === 'database') {
		let updated = await resetInDatabase(email, hashedPassword);
		if (!updated) {
			updated = await ensureInDatabaseFromFile(email, hashedPassword);
			if (updated) {
				console.log('✅ Hub admin found in file and added to database with new password:', updated.email);
			} else {
				console.error('❌ No Hub admin found with that email in the database or in the file.');
				process.exit(1);
			}
		} else {
			console.log('✅ Hub password reset successfully for:', updated.email, '(database)');
		}
	} else {
		const admins = await readAdminsFromFile();
		const normalized = email.toLowerCase().trim();
		const index = admins.findIndex((a) => (a.email || '').toLowerCase().trim() === normalized);
		if (index === -1) {
			console.error('❌ No Hub admin found with that email.');
			process.exit(1);
		}
		const now = new Date().toISOString();
		admins[index] = {
			...admins[index],
			passwordHash: hashedPassword,
			passwordChangedAt: now,
			updatedAt: now,
			passwordResetToken: null,
			passwordResetTokenExpires: null,
			failedLoginAttempts: 0,
			accountLockedUntil: null
		};
		await writeAdminsToFile(admins);
		console.log('✅ Hub password reset successfully for:', admins[index].email, '(file)');
	}
	console.log('   Log in at /hub/auth/login');
} catch (error) {
	console.error('❌ Error:', error.message);
	process.exit(1);
}
