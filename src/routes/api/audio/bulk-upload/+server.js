import { json } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/auth';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

// Destination directory (Railway volume or configured path)
const UPLOAD_DIR = process.env.AUDIO_UPLOAD_DIR || '/data/audio/uploaded';

// Ensure upload directory exists
function ensureUploadDir() {
	let uploadPath;
	if (UPLOAD_DIR.startsWith('./') || UPLOAD_DIR.startsWith('../')) {
		// Relative path - resolve from project root (local development)
		uploadPath = join(process.cwd(), UPLOAD_DIR);
	} else {
		// Absolute path (e.g., /data/audio/uploaded for Railway volume)
		uploadPath = UPLOAD_DIR;
	}
	
	// Create directory if it doesn't exist
	if (!existsSync(uploadPath)) {
		try {
			mkdirSync(uploadPath, { recursive: true });
		} catch (error) {
			// Directory might already exist, or volume might not be mounted yet (during build)
			console.warn('[Audio] Could not create upload directory:', error.message);
		}
	}
	return uploadPath;
}

function formatBytes(bytes) {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export const POST = async ({ request, cookies }) => {
	requireAuth({ cookies });

	try {
		const formData = await request.formData();
		const files = formData.getAll('files');

		if (!files || files.length === 0) {
			return json({ error: 'No files provided' }, { status: 400 });
		}

		// Validate all files first
		for (const file of files) {
			if (!(file instanceof File)) {
				return json({ error: 'Invalid file provided' }, { status: 400 });
			}

			// Validate file type
			if (!file.type.startsWith('audio/') && !file.name.endsWith('.mp3') && !file.name.endsWith('.m4a') && !file.name.endsWith('.ogg') && !file.name.endsWith('.wav')) {
				return json({ error: `File ${file.name} must be an audio file (MP3, M4A, OGG, WAV)` }, { status: 400 });
			}

			// Validate file size (max 100MB for audio)
			if (file.size > 100 * 1024 * 1024) {
				return json({ error: `File ${file.name} is too large (max 100MB)` }, { status: 400 });
			}
		}

		const uploadPath = ensureUploadDir();
		const results = [];
		let totalSize = 0;
		const errors = [];

		// Process each file sequentially (one at a time)
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			try {
				console.log(`Processing file ${i + 1}/${files.length}: ${file.name}`);
				
				// Preserve original filename (sanitize for filesystem safety)
				const originalFilename = file.name;
				// Remove any path components and sanitize
				const sanitizedFilename = originalFilename.split('/').pop().split('\\').pop();
				// Replace any potentially dangerous characters
				const safeFilename = sanitizedFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
				
				const filePath = join(uploadPath, safeFilename);

				// Check if file already exists (before writing)
				const fileExists = existsSync(filePath);

				// Save file - process one at a time to avoid memory issues
				console.log(`Reading file ${i + 1}/${files.length}: ${file.name} (${formatBytes(file.size)})`);
				const arrayBuffer = await file.arrayBuffer();
				const buffer = Buffer.from(arrayBuffer);
				
				console.log(`Writing file ${i + 1}/${files.length} to: ${filePath}`);
				writeFileSync(filePath, buffer);
				
				// Verify file was written
				if (!existsSync(filePath)) {
					throw new Error('File was not created after write');
				}

				const audioUrl = `/audio/uploaded/${safeFilename}`;

				results.push({
					success: true,
					filename: safeFilename,
					originalName: originalFilename,
					audioUrl,
					size: file.size,
					sizeFormatted: formatBytes(file.size),
					overwritten: fileExists
				});

				totalSize += file.size;
				console.log(`✅ Successfully uploaded file ${i + 1}/${files.length}: ${safeFilename}`);
			} catch (error) {
				console.error(`❌ Error uploading file ${i + 1}/${files.length} (${file.name}):`, error);
				errors.push({
					filename: file.name,
					error: error.message || 'Unknown error'
				});
			}
		}

		return json({
			success: true,
			uploaded: results.length,
			failed: errors.length,
			totalSize,
			totalSizeFormatted: formatBytes(totalSize),
			files: results,
			errors: errors.length > 0 ? errors : undefined
		});
	} catch (error) {
		console.error('Bulk upload error:', error);
		return json({ 
			error: 'Failed to upload files: ' + error.message 
		}, { status: 500 });
	}
};

