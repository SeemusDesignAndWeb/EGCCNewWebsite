import bcrypt from 'bcryptjs';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { ulid } from 'ulid';

const DATA_DIR = join(process.cwd(), 'data');
const ADMINS_FILE = join(DATA_DIR, 'admins.ndjson');

// Ensure data directory exists
async function ensureDir() {
	if (!existsSync(DATA_DIR)) {
		await mkdir(DATA_DIR, { recursive: true });
	}
}

// Read admins
async function readAdmins() {
	await ensureDir();
	if (!existsSync(ADMINS_FILE)) {
		return [];
	}
	try {
		const content = await readFile(ADMINS_FILE, 'utf8');
		if (!content.trim()) {
			return [];
		}
		return content
			.trim()
			.split('\n')
			.filter(line => line.trim())
			.map(line => JSON.parse(line));
	} catch (error) {
		if (error.code === 'ENOENT') {
			return [];
		}
		throw error;
	}
}

// Write admins
async function writeAdmins(admins) {
	await ensureDir();
	await writeFile(ADMINS_FILE, admins.map(a => JSON.stringify(a)).join('\n') + '\n', 'utf8');
}

// Validate password complexity
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

// Hash password
async function hashPassword(password) {
	return bcrypt.hash(password, 10);
}

// Create admin
async function createAdmin({ email, password, name }) {
	// Validate password complexity
	validatePassword(password);
	
	const admins = await readAdmins();
	
	// Check if admin already exists
	const existing = admins.find(a => a.email === email);
	if (existing) {
		// Don't reveal that email exists - return existing admin without error
		// This prevents email enumeration attacks
		console.log('⚠️  Admin with this email already exists. Returning existing admin.');
		return existing;
	}

	const hashedPassword = await hashPassword(password);
	const now = new Date();
	const { randomBytes } = await import('crypto');
	const verificationToken = randomBytes(32).toString('base64url');
	
	const admin = {
		id: ulid(),
		email,
		passwordHash: hashedPassword,
		name,
		role: 'admin',
		emailVerified: false,
		emailVerificationToken: verificationToken,
		emailVerificationTokenExpires: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
		passwordChangedAt: now.toISOString(),
		failedLoginAttempts: 0,
		accountLockedUntil: null,
		createdAt: now.toISOString(),
		updatedAt: now.toISOString()
	};

	admins.push(admin);
	await writeAdmins(admins);

	return admin;
}

// Main
const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4] || 'Admin';

if (!email || !password) {
	console.error('Usage: node scripts/create-admin.js <email> <password> [name]');
	console.error('Example: node scripts/create-admin.js admin@example.com password123 "Admin Name"');
	process.exit(1);
}

try {
	const admin = await createAdmin({ email, password, name });
	console.log('✅ Admin created successfully!');
	console.log('   ID:', admin.id);
	console.log('   Email:', admin.email);
	console.log('   Name:', admin.name);
	console.log('\nYou can now log in at /hub/auth/login');
} catch (error) {
	console.error('❌ Error:', error.message);
	process.exit(1);
}
