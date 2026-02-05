/**
 * Copy the first Hub super admin into the MultiOrg organisation database.
 * - Creates a multi_org_admin with the same email, name and password hash as the Hub super admin
 *   (so the same password works for /multi-org/auth/login).
 * - Sets the first organisation's hubSuperAdminEmail to that person (per-org super admin).
 * - Optionally sets hub_settings.hubSuperAdminEmail if not already set.
 *
 * Run: node scripts/copy-hub-super-admin-to-multiorg.js
 *
 * Prerequisites: at least one organisation and at least one Hub admin (super admin).
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { ulid } from 'ulid';

function getDataDir() {
	const envDataDir = process.env.CRM_DATA_DIR;
	if (envDataDir) return envDataDir;
	return join(process.cwd(), 'data');
}

const DATA_DIR = getDataDir();

async function readNdjson(collection) {
	const filePath = join(DATA_DIR, `${collection}.ndjson`);
	if (!existsSync(filePath)) return [];
	const content = await readFile(filePath, 'utf8');
	if (!content.trim()) return [];
	return content
		.trim()
		.split('\n')
		.filter((line) => line.trim())
		.map((line) => JSON.parse(line));
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

function getFirstHubSuperAdminEmail(admins, hubSettings) {
	const fromSettings = hubSettings?.hubSuperAdminEmail;
	if (fromSettings && typeof fromSettings === 'string' && fromSettings.trim()) {
		return fromSettings.trim().toLowerCase();
	}
	const envEmail = process.env.SUPER_ADMIN_EMAIL;
	if (envEmail && typeof envEmail === 'string' && envEmail.trim()) {
		return envEmail.trim().toLowerCase();
	}
	// Fallback: first admin that has super_admin permission or role
	const superAdmin = admins.find(
		(a) =>
			a.role === 'super_admin' ||
			(Array.isArray(a.permissions) && a.permissions.includes('super_admin'))
	);
	return superAdmin ? (superAdmin.email || '').trim().toLowerCase() : null;
}

async function main() {
	const hubSettingsList = await readNdjson('hub_settings');
	const hubSettings = hubSettingsList.find((r) => r.id === 'default') || null;

	const admins = await readNdjson('admins');
	if (!admins.length) {
		console.error('No Hub admins found. Create a Hub admin first.');
		process.exit(1);
	}

	const superAdminEmail = getFirstHubSuperAdminEmail(admins, hubSettings);
	if (!superAdminEmail) {
		console.error(
			'Could not determine Hub super admin email. Set hub_settings.hubSuperAdminEmail or SUPER_ADMIN_EMAIL, or ensure at least one Hub admin has super_admin permission.'
		);
		process.exit(1);
	}

	const hubAdmin = admins.find(
		(a) => (a.email || '').trim().toLowerCase() === superAdminEmail
	);
	if (!hubAdmin) {
		console.error(
			`Hub super admin email "${superAdminEmail}" not found in admins. Ensure that admin exists in the Hub.`
		);
		process.exit(1);
	}

	const organisations = await readNdjson('organisations');
	const firstOrg = organisations && organisations.length > 0 ? organisations[0] : null;
	if (!firstOrg) {
		console.error('No organisations found. Create an organisation in MultiOrg first.');
		process.exit(1);
	}

	const multiOrgAdmins = await readNdjson('multi_org_admins');
	const normalizedEmail = superAdminEmail.toLowerCase().trim();
	const existingMultiOrg = multiOrgAdmins.find(
		(a) => (a.email || '').toLowerCase().trim() === normalizedEmail
	);

	let created = false;
	if (!existingMultiOrg) {
		const now = new Date().toISOString();
		const newMultiOrgAdmin = {
			id: ulid(),
			email: hubAdmin.email.trim(),
			passwordHash: hubAdmin.passwordHash,
			name: hubAdmin.name || hubAdmin.email || 'MultiOrg Super Admin',
			role: 'super_admin',
			createdAt: now,
			updatedAt: now
		};
		multiOrgAdmins.push(newMultiOrgAdmin);
		await writeNdjson('multi_org_admins', multiOrgAdmins);
		created = true;
		console.log('  multi_org_admins: added', hubAdmin.email, 'as super_admin (same password as Hub)');
	} else {
		console.log('  multi_org_admins:', hubAdmin.email, 'already exists; skipped');
	}

	// Set first organisation's hubSuperAdminEmail
	const orgIndex = organisations.findIndex((o) => o.id === firstOrg.id);
	if (orgIndex >= 0) {
		organisations[orgIndex] = {
			...organisations[orgIndex],
			hubSuperAdminEmail: hubAdmin.email.trim(),
			updatedAt: new Date().toISOString()
		};
		await writeNdjson('organisations', organisations);
		console.log('  organisations: set hubSuperAdminEmail for', firstOrg.name || firstOrg.id, 'to', hubAdmin.email);
	}

	// Set hub_settings.hubSuperAdminEmail if not set
	if (hubSettingsList.length > 0) {
		const defaultRecord = hubSettingsList.find((r) => r.id === 'default');
		if (defaultRecord && !defaultRecord.hubSuperAdminEmail) {
			defaultRecord.hubSuperAdminEmail = hubAdmin.email.trim();
			defaultRecord.updatedAt = new Date().toISOString();
			await writeNdjson('hub_settings', hubSettingsList);
			console.log('  hub_settings: set hubSuperAdminEmail to', hubAdmin.email);
		}
	}

	console.log('\nDone.');
	if (created) {
		console.log('You can log in at /multi-org/auth/login with the same email and password as the Hub super admin.');
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
