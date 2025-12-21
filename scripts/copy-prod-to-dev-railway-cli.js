#!/usr/bin/env node

/**
 * Alternative script to copy database from production to development using Railway CLI
 * This method directly copies the file between Railway volumes
 * 
 * Usage: 
 *   1. Make sure you're linked to both production and development projects
 *   2. node scripts/copy-prod-to-dev-railway-cli.js
 */

import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration - Service name is the same for both projects
const PROD_SERVICE = process.env.PROD_SERVICE || 'EGCCNewWebsite';
const DEV_SERVICE = process.env.DEV_SERVICE || 'EGCCNewWebsite';
const TEMP_DB_FILE = join(__dirname, '../data/database-temp-prod.json');

async function copyProductionToDev() {
	try {
		console.log('🔄 Copying database from production to development using Railway CLI...\n');

		// Check if Railway CLI is available
		try {
			execSync('railway --version', { stdio: 'ignore' });
		} catch (error) {
			console.error('❌ Railway CLI not found!');
			console.error('   Please install Railway CLI: npm i -g @railway/cli');
			console.error('   Then run: railway login');
			process.exit(1);
		}

		// Step 1: Read database from production
		console.log('📖 Step 1: Reading database from production volume...');
		try {
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
			
			// Save to temp file
			writeFileSync(TEMP_DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
			console.log(`\n💾 Saved to temporary file: ${TEMP_DB_FILE}\n`);

			// Step 2: Write to development
			console.log('📤 Step 2: Writing database to development volume...');
			console.log(`   Service: ${DEV_SERVICE}`);
			
			// Read the temp file and write to dev volume
			const tempContent = readFileSync(TEMP_DB_FILE, 'utf-8');
			
			// Use Railway CLI to write the file
			// We'll use a here-document approach
			execSync(
				`railway run --service ${DEV_SERVICE} sh -c 'cat > /data/database.json'`,
				{
					input: tempContent,
					encoding: 'utf-8',
					stdio: ['pipe', 'pipe', 'pipe']
				}
			);
			
			console.log('✅ Successfully wrote database to development volume');
			console.log('\n🎉 Database successfully copied to development!');
			console.log('   The development site should now have the production data.');
			
			// Clean up temp file
			if (existsSync(TEMP_DB_FILE)) {
				// Keep it as backup, but let user know
				console.log(`\n💾 Temporary file kept at: ${TEMP_DB_FILE}`);
				console.log('   You can delete it if everything looks good.');
			}
			
			return true;
		} catch (railwayError) {
			console.error('❌ Failed:', railwayError.message);
			console.error('\n💡 Troubleshooting:');
			console.error('   1. Make sure you\'re logged in: railway login');
			console.error('   2. Make sure you\'re linked to the correct project: railway link');
			console.error('   3. Check that service names are correct (PROD_SERVICE and DEV_SERVICE)');
			console.error('   4. Verify volumes are mounted at /data on both services');
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

