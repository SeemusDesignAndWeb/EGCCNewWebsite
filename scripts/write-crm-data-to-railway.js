#!/usr/bin/env node
/**
 * Script to write CRM data files to Railway volume
 * This script runs INSIDE Railway container to write data to /data
 * 
 * Usage:
 *   railway run node scripts/write-crm-data-to-railway.js
 * 
 * Or copy the data files to Railway first, then run:
 *   railway run node scripts/write-crm-data-to-railway.js
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Paths
const RAILWAY_DATA_DIR = '/data';
const LOCAL_DATA_DIR = join(__dirname, '../data');

// CRM data files to copy
const CRM_DATA_FILES = [
	'admins.ndjson',
	'contacts.ndjson',
	'events.ndjson',
	'occurrences.ndjson',
	'rotas.ndjson',
	'lists.ndjson',
	'forms.ndjson',
	'newsletters.ndjson',
	'newsletter_templates.ndjson',
	'event_signups.ndjson',
	'event_tokens.ndjson',
	'occurrence_tokens.ndjson',
	'rota_tokens.ndjson',
	'sessions.ndjson',
	'audit_logs.ndjson'
];

console.log('🔄 Writing CRM data files to Railway volume...\n');
console.log('Source directory:', LOCAL_DATA_DIR);
console.log('Destination directory:', RAILWAY_DATA_DIR);
console.log('');

let copiedCount = 0;
let skippedCount = 0;
let errorCount = 0;

for (const filename of CRM_DATA_FILES) {
	const sourcePath = join(LOCAL_DATA_DIR, filename);
	const destPath = join(RAILWAY_DATA_DIR, filename);

	try {
		// Check if source file exists
		if (!existsSync(sourcePath)) {
			console.log(`⏭️  Skipping ${filename} (source not found)`);
			skippedCount++;
			continue;
		}

		// Read source file
		const content = readFileSync(sourcePath, 'utf-8');
		
		if (!content.trim()) {
			console.log(`⏭️  Skipping ${filename} (empty file)`);
			skippedCount++;
			continue;
		}

		// Write to Railway volume
		writeFileSync(destPath, content, 'utf-8');
		
		console.log(`✅ Copied ${filename}`);
		copiedCount++;
	} catch (error) {
		if (error.code === 'ENOENT' && error.path === destPath) {
			console.error(`❌ Volume not mounted at ${RAILWAY_DATA_DIR}`);
			console.error('   Please ensure:');
			console.error('   1. Volume is created and attached to the service');
			console.error('   2. Volume mount path is set to /data');
			console.error('   3. Service has been redeployed after volume creation\n');
		} else {
			console.error(`❌ Error copying ${filename}:`, error.message);
		}
		errorCount++;
	}
}

console.log('\n📊 Summary:');
console.log(`   ✅ Copied: ${copiedCount} files`);
console.log(`   ⏭️  Skipped: ${skippedCount} files`);
if (errorCount > 0) {
	console.log(`   ❌ Errors: ${errorCount} files`);
}

if (copiedCount > 0) {
	console.log('\n✅ CRM data successfully written to Railway volume!');
	console.log('   Your production application should now be able to read the CRM data.\n');
} else {
	console.log('\n⚠️  No files were copied.');
	console.log('   Make sure the source files exist in:', LOCAL_DATA_DIR);
	console.log('   Or copy them to Railway first, then run this script.\n');
}

