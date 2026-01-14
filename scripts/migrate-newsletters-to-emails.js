#!/usr/bin/env node
/**
 * Migration Script: Rename newsletters to emails in production
 * 
 * This script runs on Railway production to migrate data files:
 * - newsletters.ndjson → emails.ndjson
 * - newsletter_templates.ndjson → email_templates.ndjson
 * 
 * It's safe to run multiple times (idempotent).
 * 
 * Usage:
 *   railway run node scripts/migrate-newsletters-to-emails.js
 * 
 * Or it can be run automatically on deployment by adding to package.json scripts
 */

import { readFile, writeFile, access, constants } from 'fs/promises';
import { join } from 'path';
import { env } from 'process';

// Get data directory from environment variable or default
function getDataDir() {
	const envDataDir = env.CRM_DATA_DIR;
	if (envDataDir && envDataDir.trim()) {
		const trimmed = envDataDir.trim();
		// If it's an absolute path (starts with /), use it directly
		if (trimmed.startsWith('/')) {
			return trimmed;
		}
		// For relative paths, resolve relative to process.cwd()
		return join(process.cwd(), trimmed);
	}
	// Default to ./data for local development
	return join(process.cwd(), 'data');
}

async function fileExists(filePath) {
	try {
		await access(filePath, constants.F_OK);
		return true;
	} catch {
		return false;
	}
}

async function migrateFile(oldPath, newPath) {
	const oldExists = await fileExists(oldPath);
	const newExists = await fileExists(newPath);
	
	if (!oldExists) {
		console.log(`ℹ️  ${oldPath} does not exist, skipping...`);
		return false;
	}
	
	if (newExists) {
		console.log(`ℹ️  ${newPath} already exists, skipping migration...`);
		return false;
	}
	
	try {
		// Read old file
		console.log(`📖 Reading ${oldPath}...`);
		const content = await readFile(oldPath, 'utf-8');
		
		// Validate it's not empty
		if (!content.trim()) {
			console.log(`⚠️  ${oldPath} is empty, skipping...`);
			return false;
		}
		
		// Write to new file
		console.log(`💾 Writing to ${newPath}...`);
		await writeFile(newPath, content, 'utf-8');
		
		console.log(`✅ Successfully migrated ${oldPath} → ${newPath}`);
		return true;
	} catch (error) {
		console.error(`❌ Error migrating ${oldPath}:`, error.message);
		throw error;
	}
}

async function main() {
	console.log('🔄 Starting newsletter to email migration...\n');
	
	const dataDir = getDataDir();
	console.log(`📁 Data directory: ${dataDir}\n`);
	
	const oldNewslettersPath = join(dataDir, 'newsletters.ndjson');
	const oldTemplatesPath = join(dataDir, 'newsletter_templates.ndjson');
	const newEmailsPath = join(dataDir, 'emails.ndjson');
	const newTemplatesPath = join(dataDir, 'email_templates.ndjson');
	
	let migrated = false;
	
	try {
		// Migrate newsletters → emails
		const newslettersMigrated = await migrateFile(oldNewslettersPath, newEmailsPath);
		if (newslettersMigrated) migrated = true;
		
		// Migrate newsletter_templates → email_templates
		const templatesMigrated = await migrateFile(oldTemplatesPath, newTemplatesPath);
		if (templatesMigrated) migrated = true;
		
		if (migrated) {
			console.log('\n✅ Migration completed successfully!');
			console.log('   The application will now use the new file names.');
			console.log('\n💡 Note: Old files are preserved. You can remove them manually after verifying everything works.');
		} else {
			console.log('\nℹ️  No migration needed - files are already in the correct state.');
		}
		
	} catch (error) {
		console.error('\n❌ Migration failed:', error.message);
		process.exit(1);
	}
}

main().catch(error => {
	console.error('Fatal error:', error);
	process.exit(1);
});
