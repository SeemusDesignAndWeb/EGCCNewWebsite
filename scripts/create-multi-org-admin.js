/**
 * Create the first MultiOrg super admin.
 * Run: node scripts/create-multi-org-admin.js <email> <password> [name]
 * Example: node scripts/create-multi-org-admin.js multiadmin@example.com "SecurePass123!" "MultiOrg Admin"
 *
 * MultiOrg has a separate login at /multi-org/auth/login. Use this script to create the first super admin
 * who can then create organisations and set the Hub organisation's super admin.
 */

import bcrypt from 'bcryptjs';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { ulid } from 'ulid';

function getDataDir() {
	const envDataDir = process.env.CRM_DATA_DIR;
	if (envDataDir) {
		return envDataDir;
	}
	return join(process.cwd(), 'data');
}

const DATA_DIR = getDataDir();
const MULTI_ORG_ADMINS_FILE = join(DATA_DIR, 'multi_org_admins.ndjson');

async function ensureDir() {
	if (!existsSync(DATA_DIR)) {
		await mkdir(DATA_DIR, { recursive: true });
	}
}

async function readMultiOrgAdmins() {
	await ensureDir();
	if (!existsSync(MULTI_ORG_ADMINS_FILE)) {
		return [];
	}
	try {
		const content = await readFile(MULTI_ORG_ADMINS_FILE, 'utf8');
		if (!content.trim()) return [];
		return content
			.trim()
			.split('\n')
			.filter((line) => line.trim())
			.map((line) => JSON.parse(line));
	} catch (error) {
		if (error.code === 'ENOENT') return [];
		throw error;
	}
}

async function writeMultiOrgAdmins(admins) {
	await ensureDir();
	await writeFile(
		MULTI_ORG_ADMINS_FILE,
		admins.map((a) => JSON.stringify(a)).join('\n') + '\n',
		'utf8'
	);
}

function validatePassword(password) {
	if (!password || password.length < 12) {
		throw new Error('Password must be at least 12 characters long');
	}
	if (!/[a-z]/.test(password)) {
		throw new Error('Password must contain at least one lowercase letter');
	}
	if (!/[A-Z]/.test(password)) {
		throw new Error('Password must contain at least one uppercase letter');
	}
	if (!/[0-9]/.test(password)) {
		throw new Error('Password must contain at least one number');
	}
	if (!/[^a-zA-Z0-9]/.test(password)) {
		throw new Error('Password must contain at least one special character');
	}
	return true;
}

async function createMultiOrgSuperAdmin({ email, password, name }) {
	validatePassword(password);
	const admins = await readMultiOrgAdmins();
	const normalizedEmail = email.toLowerCase().trim();
	const existing = admins.find((a) => (a.email || '').toLowerCase().trim() === normalizedEmail);
	if (existing) {
		console.log('⚠️  MultiOrg admin with this email already exists. Returning existing admin.');
		return existing;
	}
	const hashedPassword = await bcrypt.hash(password, 10);
	const now = new Date().toISOString();
	const admin = {
		id: ulid(),
		email: email.trim(),
		passwordHash: hashedPassword,
		name: (name || email).trim(),
		role: 'super_admin',
		createdAt: now,
		updatedAt: now
	};
	admins.push(admin);
	await writeMultiOrgAdmins(admins);
	return admin;
}

const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4] || 'MultiOrg Admin';

if (!email || !password) {
	console.error('Usage: node scripts/create-multi-org-admin.js <email> <password> [name]');
	console.error('Example: node scripts/create-multi-org-admin.js multiadmin@example.com "SecurePass123!" "MultiOrg Admin"');
	process.exit(1);
}

try {
	const admin = await createMultiOrgSuperAdmin({ email, password, name });
	console.log('✅ MultiOrg super admin created successfully!');
	console.log('   ID:', admin.id);
	console.log('   Email:', admin.email);
	console.log('   Name:', admin.name);
	console.log('\nYou can now log in at /multi-org/auth/login');
} catch (error) {
	console.error('❌ Error:', error.message);
	process.exit(1);
}
