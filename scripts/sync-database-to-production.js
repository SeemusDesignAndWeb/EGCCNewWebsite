import { readFileSync, writeFileSync } from 'fs';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Sync local database to Railway production
 * This script copies the local database.json to Railway volume
 */
async function syncDatabaseToProduction() {
	try {
		console.log('🚀 Syncing database to Railway production...\n');
		
		// Check if Railway CLI is available
		try {
			execSync('railway --version', { stdio: 'ignore' });
		} catch (error) {
			console.error('❌ Railway CLI not found!');
			console.error('   Please install Railway CLI: npm i -g @railway/cli');
			console.error('   Then run: railway link');
			process.exit(1);
		}
		
		// Read local database
		const localDbPath = process.env.DATABASE_PATH || './data/database.json';
		
		if (!existsSync(localDbPath)) {
			console.error(`❌ Local database not found: ${localDbPath}`);
			process.exit(1);
		}
		
		console.log(`📖 Reading local database from: ${localDbPath}`);
		const dbData = readFileSync(localDbPath, 'utf-8');
		
		// Validate JSON
		try {
			JSON.parse(dbData);
		} catch (error) {
			console.error('❌ Invalid JSON in database file!');
			process.exit(1);
		}
		
		// Create temporary file for Railway
		const tempPath = join(__dirname, '../data/database-temp.json');
		writeFileSync(tempPath, dbData, 'utf-8');
		
		console.log('📤 Copying database to Railway volume...');
		
		// Copy to Railway volume
		// Railway volume is mounted at /data/database.json
		try {
			execSync(`railway run cp ${tempPath} /data/database.json`, {
				cwd: join(__dirname, '..'),
				stdio: 'inherit'
			});
			
			// Clean up temp file
			if (existsSync(tempPath)) {
				execSync(`rm ${tempPath}`);
			}
			
			console.log('\n✅ Database synced successfully to Railway!');
			console.log('   The production database has been updated with your local changes.\n');
		} catch (error) {
			console.error('\n❌ Error copying to Railway:');
			console.error('   Make sure you are logged in: railway login');
			console.error('   Make sure the project is linked: railway link');
			console.error('   Make sure the volume is mounted at /data\n');
			
			// Alternative: Use railway variables or direct file copy
			console.log('💡 Alternative: You can manually copy the database:');
			console.log(`   1. Copy ${localDbPath} to your Railway volume`);
			console.log('   2. Or use Railway dashboard to upload the file\n');
			
			process.exit(1);
		}
		
	} catch (error) {
		console.error('❌ Error syncing database:', error);
		process.exit(1);
	}
}

// Run the sync
syncDatabaseToProduction();

