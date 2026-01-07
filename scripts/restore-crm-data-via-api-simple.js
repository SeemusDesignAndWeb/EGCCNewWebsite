#!/usr/bin/env node
/**
 * Simple script to restore CRM data via API
 * This version uses a simpler approach with fetch
 * 
 * Usage:
 *   ADMIN_PASSWORD=your-password node scripts/restore-crm-data-via-api-simple.js
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROD_URL = process.env.PROD_URL || 'https://new.egcc.co.uk';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const LOCAL_DATA_DIR = join(__dirname, '../data');

const CRM_DATA_FILES = [
	'admins', 'contacts', 'events', 'occurrences', 'rotas', 'lists',
	'forms', 'newsletters', 'newsletter_templates', 'event_signups',
	'event_tokens', 'occurrence_tokens', 'rota_tokens', 'sessions', 'audit_logs'
];

if (!ADMIN_PASSWORD) {
	console.error('❌ ADMIN_PASSWORD not set!');
	console.error('   Run: ADMIN_PASSWORD=your-password node scripts/restore-crm-data-via-api-simple.js');
	process.exit(1);
}

async function restore() {
	try {
		console.log(`🔄 Restoring CRM data to ${PROD_URL}...\n`);

		const payload = { force: true };
		let foundCount = 0;

		// Read local files
		for (const fileKey of CRM_DATA_FILES) {
			const filePath = join(LOCAL_DATA_DIR, `${fileKey}.ndjson`);
			if (existsSync(filePath)) {
				const content = readFileSync(filePath, 'utf-8');
				if (content.trim()) {
					payload[fileKey] = content;
					foundCount++;
					console.log(`✅ Found ${fileKey}.ndjson`);
				}
			}
		}

		if (foundCount === 0) {
			console.error('❌ No data files found!');
			process.exit(1);
		}

		console.log(`\n📤 Uploading ${foundCount} files...\n`);

		const response = await fetch(`${PROD_URL}/api/init-crm-data`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${ADMIN_PASSWORD}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(payload)
		});

		const result = await response.json();

		if (!response.ok) {
			console.error('❌ Failed:', result.error || result.message);
			process.exit(1);
		}

		console.log('✅ Restore successful!');
		console.log(`   Written: ${result.results?.written?.length || 0} files`);
		console.log(`   Overwritten: ${result.results?.overwritten?.length || 0} files`);
		console.log('\n✅ Data restored!\n');

	} catch (error) {
		console.error('❌ Error:', error.message);
		process.exit(1);
	}
}

restore();

