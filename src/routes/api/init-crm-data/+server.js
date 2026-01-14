// API endpoint to initialize CRM data files on Railway volume
// Access: POST /api/init-crm-data with data files in body
// Protected by ADMIN_PASSWORD

import { json } from '@sveltejs/kit';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { env } from '$env/dynamic/private';

const DATA_DIR = env.CRM_DATA_DIR || '/data';

export async function POST({ request }) {
	// Simple password check (use your admin password)
	const authHeader = request.headers.get('authorization');
	const password = env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
	
	if (!authHeader || authHeader !== `Bearer ${password}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	
	try {
		// Ensure data directory exists
		if (!existsSync(DATA_DIR)) {
			mkdirSync(DATA_DIR, { recursive: true });
		}

		// Get data from request body
		let body;
		try {
			body = await request.json();
		} catch (parseError) {
			console.error('Failed to parse request body:', parseError);
			return json({ 
				error: 'Invalid JSON in request body: ' + parseError.message
			}, { status: 400 });
		}

		// Expected CRM data files
		const crmFiles = [
			'admins', 'contacts', 'events', 'occurrences', 'rotas', 'lists',
			'forms', 'emails', 'email_templates', 'event_signups',
			'event_tokens', 'occurrence_tokens', 'rota_tokens', 'sessions', 'audit_logs'
		];

		// Check if force flag is set
		const force = body.force === true || body.force === 'true';
		
		// Check if any files already exist (unless force is true)
		if (!force) {
			const existingFiles = [];
			for (const fileKey of crmFiles) {
				const filePath = join(DATA_DIR, `${fileKey}.ndjson`);
				if (existsSync(filePath)) {
					existingFiles.push(fileKey);
				}
			}
			
			if (existingFiles.length > 0) {
				return json({ 
					error: 'Files already exist. Use force=true to overwrite.',
					existingFiles,
					message: 'To prevent accidental data loss, this endpoint will not overwrite existing files. Add "force": true to the request body to overwrite.'
				}, { status: 409 });
			}
		}

		const results = {
			written: [],
			skipped: [],
			errors: [],
			overwritten: []
		};

		// Write each file
		for (const fileKey of crmFiles) {
			const fileContent = body[fileKey];
			
			if (!fileContent) {
				results.skipped.push(fileKey);
				continue;
			}

			try {
				// Validate it's valid NDJSON (at least check it's a string)
				if (typeof fileContent !== 'string') {
					results.errors.push({ file: fileKey, error: 'Content must be a string' });
					continue;
				}

				const filePath = join(DATA_DIR, `${fileKey}.ndjson`);
				const fileExists = existsSync(filePath);
				writeFileSync(filePath, fileContent, 'utf-8');
				
				if (fileExists) {
					results.overwritten.push(fileKey);
				} else {
					results.written.push(fileKey);
				}
			} catch (error) {
				results.errors.push({ file: fileKey, error: error.message });
			}
		}

		return json({ 
			success: true,
			message: 'CRM data files initialized',
			path: DATA_DIR,
			results
		});
		
	} catch (error) {
		console.error('Error initializing CRM data:', error);
		return json({ 
			error: error.message,
			path: DATA_DIR,
			code: error.code
		}, { status: 500 });
	}
}

