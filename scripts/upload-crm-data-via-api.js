#!/usr/bin/env node
/**
 * Script to upload CRM data files to Railway via API endpoint
 * This uses the /api/init-crm-data endpoint to upload files
 * 
 * Usage:
 *   node scripts/upload-crm-data-via-api.js
 * 
 * Requires:
 *   - ADMIN_PASSWORD environment variable or in .env
 *   - Production URL (defaults to https://new.egcc.co.uk)
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

// CRM data files to upload
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

async function uploadCrmDataViaApi() {
	try {
		console.log('🔄 Uploading CRM data files to Railway via API...\n');

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
		const dataPayload = {};
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
			console.error('\n❌ No data files found to upload!');
			process.exit(1);
		}

		console.log(`\n📤 Uploading ${foundCount} files to ${PROD_URL}/api/init-crm-data...`);

		// Upload via API
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
			process.exit(1);
		}

		console.log('\n✅ Upload successful!');
		console.log('   Written:', result.results?.written?.length || 0, 'files');
		console.log('   Skipped:', result.results?.skipped?.length || 0, 'files');
		if (result.results?.errors?.length > 0) {
			console.log('   Errors:', result.results.errors.length);
			result.results.errors.forEach(err => {
				console.log(`      - ${err.file}: ${err.error}`);
			});
		}
		console.log('\n✅ CRM data successfully uploaded to Railway!');
		console.log('   Your production application should now be able to read the CRM data.\n');

	} catch (error) {
		console.error('\n❌ Error uploading CRM data:', error.message);
		if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
			console.error('   Could not connect to production server.');
			console.error(`   Check that ${PROD_URL} is accessible.\n`);
		}
		process.exit(1);
	}
}

// Run the upload
uploadCrmDataViaApi();

