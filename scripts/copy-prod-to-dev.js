#!/usr/bin/env node

/**
 * Script to copy database from production to development
 * Usage: node scripts/copy-prod-to-dev.js
 * 
 * This script:
 * 1. Reads the database from production Railway volume
 * 2. Sends it to development site's init-database endpoint
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const PROD_SERVICE = process.env.PROD_SERVICE || 'EGCCNewWebsite';
const DEV_API_URL = process.env.DEV_API_URL || 'https://egcc-new-website-production.up.railway.app/api/init-database';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Haran153!';
const TEMP_DB_FILE = join(__dirname, '../data/database-temp-prod.json');

async function copyProductionToDev() {
	try {
		console.log('🔄 Copying database from production to development...\n');

		// Check if Railway CLI is available
		try {
			execSync('railway --version', { stdio: 'ignore' });
		} catch (error) {
			console.error('❌ Railway CLI not found!');
			console.error('   Please install Railway CLI: npm i -g @railway/cli');
			console.error('   Then run: railway login');
			process.exit(1);
		}

		// Step 1: Read database from production volume
		console.log('📖 Reading database from production...');
		try {
			// Use Railway CLI to read the database file from production
			// This assumes you're linked to the production project
			const dbContent = execSync(
				`railway run --service ${PROD_SERVICE} cat /data/database.json`,
				{ encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }
			);
			
			// Validate JSON
			const db = JSON.parse(dbContent);
			console.log('✅ Successfully read production database');
			console.log(`   - Pages: ${db.pages?.length || 0}`);
			console.log(`   - Team: ${db.team?.length || 0}`);
			console.log(`   - Events: ${db.events?.length || 0}`);
			console.log(`   - Services: ${db.services?.length || 0}`);
			console.log(`   - Hero Slides: ${db.heroSlides?.length || 0}`);
			console.log(`   - Activities: ${db.activities?.length || 0}`);
			console.log(`   - Community Groups: ${db.communityGroups?.length || 0}`);
			console.log(`   - Podcasts: ${db.podcasts?.length || 0}`);
			
			// Save to temp file as backup
			writeFileSync(TEMP_DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
			console.log(`\n💾 Saved backup to: ${TEMP_DB_FILE}\n`);

			// Step 2: Send to development site
			console.log('📤 Sending database to development site...');
			console.log(`   Dev API: ${DEV_API_URL}`);
			
			// Use force=true to overwrite if database exists
			const apiUrl = `${DEV_API_URL}?force=true`;
			const response = await fetch(apiUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${ADMIN_PASSWORD}`
				},
				body: JSON.stringify({ database: db })
			});

			const result = await response.json();

			if (response.ok) {
				if (result.exists) {
					console.log('⚠️  Database already exists on development site');
					console.log('   If you want to overwrite, you\'ll need to delete it first');
					console.log('   Or use Railway CLI to manually copy the file');
				} else {
					console.log('✅ Success:', result.message);
					console.log('   Path:', result.path);
					console.log('   Size:', result.size, 'bytes');
					console.log('\n🎉 Database successfully copied to development!');
				}
			} else {
				console.error('❌ Error:', result.error);
				if (result.code) {
					console.error('   Code:', result.code);
				}
				console.error('\n💡 Tip: The database might already exist. Check the development site.');
			}

			return response.ok;
		} catch (railwayError) {
			console.error('❌ Failed to read from Railway:', railwayError.message);
			console.error('\n💡 Alternative: You can manually copy the database:');
			console.error('   1. Use Railway dashboard to download /data/database.json from production');
			console.error('   2. Use Railway dashboard to upload it to development volume');
			console.error('   3. Or use: railway run --service <dev-service> cp <local-file> /data/database.json');
			return false;
		}

	} catch (error) {
		console.error('❌ Failed to copy database:', error.message);
		return false;
	}
}

copyProductionToDev().then(success => {
	process.exit(success ? 0 : 1);
});

