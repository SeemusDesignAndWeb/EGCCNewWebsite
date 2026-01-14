#!/usr/bin/env node
/**
 * Recovery Script: Rename newsletters to emails in Railway production
 * 
 * This script:
 * 1. Downloads the current production data files (newsletters.ndjson, newsletter_templates.ndjson)
 * 2. Renames them to emails.ndjson and email_templates.ndjson
 * 3. Uploads them back to Railway
 * 
 * Usage:
 *   node scripts/recover-and-rename-newsletters.js
 * 
 * Requirements:
 *   - Railway CLI installed and authenticated
 *   - Project linked via `railway link`
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const DATA_DIR = process.env.CRM_DATA_DIR || '/data';

async function runRailwayCommand(command) {
	try {
		const result = execSync(`railway run ${command}`, { 
			encoding: 'utf-8',
			stdio: 'pipe'
		});
		return result.trim();
	} catch (error) {
		console.error(`Error running Railway command: ${command}`);
		console.error(error.message);
		throw error;
	}
}

async function downloadFile(remotePath, localPath) {
	console.log(`Downloading ${remotePath} from Railway...`);
	
	// Use railway run cat to get file content
	const content = await runRailwayCommand(`cat ${remotePath}`);
	
	// Save to local file
	writeFileSync(localPath, content, 'utf-8');
	console.log(`✓ Saved to ${localPath}`);
}

async function uploadFile(localPath, remotePath) {
	console.log(`Uploading ${localPath} to Railway at ${remotePath}...`);
	
	// Read local file
	const content = readFileSync(localPath, 'utf-8');
	
	// Base64 encode for safe transmission
	const base64Content = Buffer.from(content).toString('base64');
	
	// Write to Railway using echo and base64 decode
	const command = `echo '${base64Content}' | base64 -d > ${remotePath}`;
	await runRailwayCommand(command);
	
	console.log(`✓ Uploaded to ${remotePath}`);
}

async function checkFileExists(remotePath) {
	try {
		await runRailwayCommand(`test -f ${remotePath} && echo "exists" || echo "not found"`);
		return true;
	} catch {
		return false;
	}
}

async function main() {
	console.log('🔍 Checking Railway production data files...\n');
	
	const oldNewslettersPath = `${DATA_DIR}/newsletters.ndjson`;
	const oldTemplatesPath = `${DATA_DIR}/newsletter_templates.ndjson`;
	const newEmailsPath = `${DATA_DIR}/emails.ndjson`;
	const newTemplatesPath = `${DATA_DIR}/email_templates.ndjson`;
	
	// Check if old files exist
	const oldNewslettersExists = await checkFileExists(oldNewslettersPath);
	const oldTemplatesExists = await checkFileExists(oldTemplatesPath);
	
	// Check if new files already exist
	const newEmailsExists = await checkFileExists(newEmailsPath);
	const newTemplatesExists = await checkFileExists(newTemplatesPath);
	
	console.log('File status:');
	console.log(`  ${oldNewslettersPath}: ${oldNewslettersExists ? '✓ exists' : '✗ not found'}`);
	console.log(`  ${oldTemplatesPath}: ${oldTemplatesExists ? '✓ exists' : '✗ not found'}`);
	console.log(`  ${newEmailsPath}: ${newEmailsExists ? '✓ exists' : '✗ not found'}`);
	console.log(`  ${newTemplatesPath}: ${newTemplatesExists ? '✓ exists' : '✗ not found'}\n`);
	
	if (!oldNewslettersExists && !oldTemplatesExists) {
		console.log('⚠️  No old newsletter files found. They may have already been renamed or never existed.');
		if (newEmailsExists && newTemplatesExists) {
			console.log('✓ New email files already exist. No action needed.');
			return;
		}
	}
	
	// Create backup directory
	const backupDir = join(process.cwd(), 'data', 'backup');
	if (!existsSync(backupDir)) {
		require('fs').mkdirSync(backupDir, { recursive: true });
	}
	
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
	const backupNewsletters = join(backupDir, `newsletters-${timestamp}.ndjson`);
	const backupTemplates = join(backupDir, `newsletter_templates-${timestamp}.ndjson`);
	
	try {
		// Step 1: Download old files as backup
		if (oldNewslettersExists) {
			await downloadFile(oldNewslettersPath, backupNewsletters);
		}
		
		if (oldTemplatesExists) {
			await downloadFile(oldTemplatesPath, backupTemplates);
		}
		
		// Step 2: Rename files on Railway
		console.log('\n📝 Renaming files on Railway...');
		
		if (oldNewslettersExists) {
			// Copy old file to new name
			await runRailwayCommand(`cp ${oldNewslettersPath} ${newEmailsPath}`);
			console.log(`✓ Copied ${oldNewslettersPath} to ${newEmailsPath}`);
			
			// Optionally remove old file (commented out for safety - uncomment if you want to delete)
			// await runRailwayCommand(`rm ${oldNewslettersPath}`);
			// console.log(`✓ Removed ${oldNewslettersPath}`);
		}
		
		if (oldTemplatesExists) {
			// Copy old file to new name
			await runRailwayCommand(`cp ${oldTemplatesPath} ${newTemplatesPath}`);
			console.log(`✓ Copied ${oldTemplatesPath} to ${newTemplatesPath}`);
			
			// Optionally remove old file (commented out for safety - uncomment if you want to delete)
			// await runRailwayCommand(`rm ${oldTemplatesPath}`);
			// console.log(`✓ Removed ${oldTemplatesPath}`);
		}
		
		// Step 3: Verify new files exist
		console.log('\n✅ Verifying new files...');
		const emailsExists = await checkFileExists(newEmailsPath);
		const templatesExists = await checkFileExists(newTemplatesPath);
		
		if (emailsExists && templatesExists) {
			console.log('✓ Success! Files have been renamed.');
			console.log(`\n📦 Backups saved to:`);
			if (oldNewslettersExists) console.log(`   ${backupNewsletters}`);
			if (oldTemplatesExists) console.log(`   ${backupTemplates}`);
		} else {
			console.log('⚠️  Warning: Some files may not have been created successfully.');
		}
		
	} catch (error) {
		console.error('\n❌ Error during recovery:', error.message);
		console.log('\n💾 Backups are available at:');
		if (existsSync(backupNewsletters)) console.log(`   ${backupNewsletters}`);
		if (existsSync(backupTemplates)) console.log(`   ${backupTemplates}`);
		process.exit(1);
	}
}

main().catch(console.error);
