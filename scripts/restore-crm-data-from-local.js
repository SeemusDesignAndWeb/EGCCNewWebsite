#!/usr/bin/env node
/**
 * Script to restore CRM data files from local backup to Railway via API
 * This uploads your local data files to restore production
 * 
 * Usage:
 *   node scripts/restore-crm-data-from-local.js
 * 
 * Requires:
 *   - ADMIN_PASSWORD in .env
 *   - Local data files in ./data directory
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../.env') });

const PROD_URL = process.env.PROD_URL || 'https://new.egcc.co.uk';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const LOCAL_DATA_DIR = join(__dirname, '../data');

// CRM data files to restore
const CRM_DATA_FILES = [
	'admins',
	'contacts',
	'events',
	'occurrences',
	'rotas',
	'lists',
	'forms',
	'newsletters',
	'newsletter_templates',
	'event_signups',
	'event_tokens',
	'occurrence_tokens',
	'rota_tokens',
	'sessions',
	'audit_logs'
];

async function restoreCrmDataFromLocal() {
	try {
		console.log('🔄 Restoring CRM data from local files to Railway...\n');

		if (!ADMIN_PASSWORD) {
			console.error('❌ ADMIN_PASSWORD not found!');
			console.error('   Please set ADMIN_PASSWORD in .env or as environment variable');
			process.exit(1);
		}

		// Check if local data directory exists
		if (!existsSync(LOCAL_DATA_DIR)) {
			console.error(`❌ Local data directory not found: ${LOCAL_DATA_DIR}`);
			process.exit(1);
		}

		// Read all data files
		const dataPayload = { force: true }; // Force overwrite to restore
		let foundCount = 0;

		for (const fileKey of CRM_DATA_FILES) {
			const filePath = join(LOCAL_DATA_DIR, `${fileKey}.ndjson`);
			
			if (existsSync(filePath)) {
				try {
					const content = readFileSync(filePath, 'utf-8');
					if (content.trim()) {
						dataPayload[fileKey] = content;
						foundCount++;
						console.log(`✅ Found ${fileKey}.ndjson`);
					} else {
						console.log(`⏭️  Skipping ${fileKey}.ndjson (empty)`);
					}
				} catch (error) {
					console.error(`❌ Error reading ${fileKey}.ndjson:`, error.message);
				}
			} else {
				console.log(`⏭️  Skipping ${fileKey}.ndjson (not found)`);
			}
		}

		if (foundCount === 0) {
			console.error('\n❌ No data files found to restore!');
			process.exit(1);
		}

		console.log(`\n⚠️  WARNING: This will OVERWRITE existing data on Railway!`);
		console.log(`📤 Uploading ${foundCount} files to ${PROD_URL}/api/init-crm-data...`);
		console.log('   (This may take a moment...)\n');

		// Upload via API with force flag
		const response = await fetch(`${PROD_URL}/api/init-crm-data`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${ADMIN_PASSWORD}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(dataPayload)
		});

		const result = await response.json();

		if (!response.ok) {
			console.error('\n❌ Upload failed:');
			console.error('   Status:', response.status);
			console.error('   Error:', result.error || result.message);
			if (result.existingFiles) {
				console.error('   Existing files:', result.existingFiles.join(', '));
				console.error('   Add "force": true to overwrite');
			}
			process.exit(1);
		}

		console.log('\n✅ Restore successful!');
		console.log('   Written:', result.results?.written?.length || 0, 'files');
		console.log('   Overwritten:', result.results?.overwritten?.length || 0, 'files');
		console.log('   Skipped:', result.results?.skipped?.length || 0, 'files');
		if (result.results?.errors?.length > 0) {
			console.log('   Errors:', result.results.errors.length);
			result.results.errors.forEach(err => {
				console.log(`      - ${err.file}: ${err.error}`);
			});
		}
		console.log('\n✅ CRM data successfully restored to Railway!');
		console.log('   Your production application should now have the restored data.\n');

	} catch (error) {
		console.error('\n❌ Error restoring CRM data:', error.message);
		if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
			console.error('   Could not connect to production server.');
			console.error(`   Check that ${PROD_URL} is accessible.\n`);
		}
		process.exit(1);
	}
}

// Run the restore
restoreCrmDataFromLocal();

