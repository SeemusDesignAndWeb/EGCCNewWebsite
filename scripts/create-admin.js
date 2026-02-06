#!/usr/bin/env node
/**
 * Create an admin user. Uses the database when DATA_STORE=database and DATABASE_URL are set;
 * otherwise writes to data/admins.ndjson (file store).
 * Run with: node -r dotenv/config scripts/create-admin.js <email> <password> [name]
 */

import bcrypt from 'bcryptjs';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { ulid } from 'ulid';
import { randomBytes } from 'crypto';

const DATA_STORE = process.env.DATA_STORE?.trim().toLowerCase();
const DATABASE_URL = process.env.DATABASE_URL?.trim();
const USE_DATABASE = DATA_STORE === 'database' && !!DATABASE_URL;

function getDataDir() {
	const envDataDir = process.env.CRM_DATA_DIR;
	if (envDataDir) return envDataDir;
	return join(process.cwd(), 'data');
}

const DATA_DIR = getDataDir();
const ADMINS_FILE = join(DATA_DIR, 'admins.ndjson');

async function ensureDir() {
	if (!existsSync(DATA_DIR)) {
		await mkdir(DATA_DIR, { recursive: true });
	}
}

async function readAdminsFile() {
	await ensureDir();
	if (!existsSync(ADMINS_FILE)) return [];
	try {
		const content = await readFile(ADMINS_FILE, 'utf8');
		if (!content.trim()) return [];
		return content.trim().split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
	} catch (e) {
		if (e.code === 'ENOENT') return [];
		throw e;
	}
}

async function writeAdminsFile(admins) {
	await ensureDir();
	await writeFile(ADMINS_FILE, admins.map((a) => JSON.stringify(a)).join('\n') + '\n', 'utf8');
}

function validatePassword(password) {
	if (!password || password.length < 12) {
		throw new Error('Password must be at least 12 characters long');
	}
	if (!/[a-z]/.test(password)) throw new Error('Password must contain at least one lowercase letter');
	if (!/[A-Z]/.test(password)) throw new Error('Password must contain at least one uppercase letter');
	if (!/[0-9]/.test(password)) throw new Error('Password must contain at least one number');
	if (!/[^a-zA-Z0-9]/.test(password)) throw new Error('Password must contain at least one special character');
	return true;
}

async function hashPassword(password) {
	return bcrypt.hash(password, 10);
}

/** Create admin in Postgres (crm_records table). */
async function createAdminInDatabase({ email, password, name }) {
	validatePassword(password);
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

		const normalizedEmail = email.toLowerCase().trim();
		const existing = await client.query(
			`SELECT id, body, created_at, updated_at FROM ${TABLE_NAME} WHERE collection = $1 AND body->>'email' = $2`,
			['admins', normalizedEmail]
		);
		if (existing.rows.length > 0) {
			const row = existing.rows[0];
			console.log('⚠️  Admin with this email already exists. Returning existing admin.');
			return { id: row.id, email: row.body?.email ?? email, name: row.body?.name ?? name };
		}

		const hashedPassword = await hashPassword(password);
		const now = new Date();
		const verificationToken = randomBytes(32).toString('base64url');
		const id = ulid();
		const body = {
			email: normalizedEmail,
			passwordHash: hashedPassword,
			name: name || 'Admin',
			role: 'admin',
			emailVerified: false,
			emailVerificationToken: verificationToken,
			emailVerificationTokenExpires: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
			passwordChangedAt: now.toISOString(),
			failedLoginAttempts: 0,
			accountLockedUntil: null
		};
		const createdAt = now.toISOString();
		const updatedAt = now.toISOString();

		await client.query(
			`INSERT INTO ${TABLE_NAME} (collection, id, body, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)`,
			['admins', id, JSON.stringify(body), createdAt, updatedAt]
		);

		return { id, email: normalizedEmail, name: body.name, ...body, createdAt, updatedAt };
	} finally {
		client.release();
		await pool.end();
	}
}

/** Create admin in file store (data/admins.ndjson). */
async function createAdminInFile({ email, password, name }) {
	validatePassword(password);
	const admins = await readAdminsFile();
	const normalizedEmail = email.toLowerCase().trim();
	const existing = admins.find((a) => (a.email || '').toLowerCase().trim() === normalizedEmail);
	if (existing) {
		console.log('⚠️  Admin with this email already exists. Returning existing admin.');
		return existing;
	}

	const hashedPassword = await hashPassword(password);
	const now = new Date();
	const verificationToken = randomBytes(32).toString('base64url');
	const admin = {
		id: ulid(),
		email: normalizedEmail,
		passwordHash: hashedPassword,
		name: name || 'Admin',
		role: 'admin',
		emailVerified: false,
		emailVerificationToken: verificationToken,
		emailVerificationTokenExpires: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
		passwordChangedAt: now.toISOString(),
		failedLoginAttempts: 0,
		accountLockedUntil: null,
		createdAt: now.toISOString(),
		updatedAt: now.toISOString()
	};
	admins.push(admin);
	await writeAdminsFile(admins);
	return admin;
}

async function createAdmin({ email, password, name }) {
	if (USE_DATABASE) {
		return createAdminInDatabase({ email, password, name });
	}
	return createAdminInFile({ email, password, name });
}

const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4] || 'Admin';

if (!email || !password) {
	console.error('Usage: node -r dotenv/config scripts/create-admin.js <email> <password> [name]');
	console.error('Example: node -r dotenv/config scripts/create-admin.js admin@example.com "YourSecurePassword12!" "Admin Name"');
	process.exit(1);
}

try {
	const admin = await createAdmin({ email, password, name });
	console.log('✅ Admin created successfully!');
	console.log('   ID:', admin.id);
	console.log('   Email:', admin.email);
	console.log('   Name:', admin.name);
	if (USE_DATABASE) {
		console.log('   Store: database');
	} else {
		console.log('   Store: file (data/admins.ndjson). Set DATA_STORE=database and DATABASE_URL to use the database.');
	}
	console.log('\nYou can now log in at /hub/auth/login');
} catch (error) {
	console.error('❌ Error:', error.message);
	process.exit(1);
}
