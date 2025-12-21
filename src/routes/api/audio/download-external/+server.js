import { json } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/auth';
import { readFileSync, writeFileSync, existsSync, mkdirSync, createWriteStream, statSync } from 'fs';
import { join, dirname } from 'path';
import { randomUUID } from 'crypto';
import { getPodcasts, savePodcast } from '$lib/server/database';
import https from 'https';
import http from 'http';
import { URL } from 'url';

// Destination directory (Railway volume or configured path)
const DEST_DIR = process.env.AUDIO_UPLOAD_DIR || '/data/audio/uploaded';

function getDestPath() {
	if (DEST_DIR.startsWith('./') || DEST_DIR.startsWith('../')) {
		return join(process.cwd(), DEST_DIR);
	}
	return DEST_DIR;
}

function formatBytes(bytes) {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function downloadFile(url, destPath) {
	return new Promise((resolve, reject) => {
		const parsedUrl = new URL(url);
		const protocol = parsedUrl.protocol === 'https:' ? https : http;
		
		let fileStream;
		
		const request = protocol.get(url, (response) => {
			// Handle redirects
			if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307 || response.statusCode === 308) {
				const redirectUrl = response.headers.location;
				if (!redirectUrl) {
					reject(new Error('Redirect location not found'));
					return;
				}
				const absoluteUrl = redirectUrl.startsWith('http') ? redirectUrl : new URL(redirectUrl, url).href;
				return downloadFile(absoluteUrl, destPath).then(resolve).catch(reject);
			}
			
			if (response.statusCode !== 200) {
				reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
				return;
			}
			
			const contentLength = parseInt(response.headers['content-length'] || '0', 10);
			fileStream = createWriteStream(destPath);
			
			response.pipe(fileStream);
			
			fileStream.on('finish', () => {
				fileStream.close();
				try {
					const stats = statSync(destPath);
					resolve({
						size: stats.size,
						expectedSize: contentLength
					});
				} catch (error) {
					reject(new Error(`Failed to get file size: ${error.message}`));
				}
			});
			
			fileStream.on('error', (error) => {
				fileStream.destroy();
				reject(error);
			});
			
			response.on('error', (error) => {
				if (fileStream) {
					fileStream.destroy();
				}
				reject(error);
			});
		});
		
		request.on('error', (error) => {
			reject(error);
		});
		
		request.setTimeout(300000, () => {
			request.destroy();
			if (fileStream) {
				fileStream.destroy();
			}
			reject(new Error('Download timeout'));
		});
	});
}

function getFileExtension(url) {
	try {
		const urlObj = new URL(url);
		const pathname = urlObj.pathname;
		const ext = pathname.split('.').pop()?.toLowerCase();
		if (ext && ['mp3', 'm4a', 'ogg', 'wav', 'aac', 'flac', 'mp4'].includes(ext)) {
			return ext;
		}
	} catch (e) {
		// Invalid URL
	}
	return 'mp3';
}

export const POST = async ({ cookies }) => {
	requireAuth({ cookies });

	try {
		const destPath = getDestPath();

		// Create destination directory if it doesn't exist
		if (!existsSync(destPath)) {
			try {
				mkdirSync(destPath, { recursive: true });
			} catch (error) {
				return json({ 
					error: `Failed to create destination directory: ${error.message}`,
					destPath
				}, { status: 500 });
			}
		}

		// Read database
		const podcasts = getPodcasts();

		if (podcasts.length === 0) {
			return json({
				success: true,
				downloaded: 0,
				skipped: 0,
				errors: 0,
				message: 'No podcasts found in database'
			});
		}

		// Find podcasts with external URLs
		const externalPodcasts = podcasts.filter(p => {
			if (!p.audioUrl) return false;
			return p.audioUrl.startsWith('http://') || p.audioUrl.startsWith('https://');
		});

		if (externalPodcasts.length === 0) {
			return json({
				success: true,
				downloaded: 0,
				skipped: 0,
				errors: 0,
				message: 'No podcasts with external URLs found'
			});
		}

		let downloaded = 0;
		let skipped = 0;
		let errors = 0;
		let totalSize = 0;
		const errorDetails = [];

		for (const podcast of externalPodcasts) {
			const url = podcast.audioUrl;
			const podcastTitle = podcast.title || podcast.id;

			try {
				// Check if we already have this file
				const alreadyDownloaded = podcasts.find(p => 
					p.audioUrl === url && 
					!p.audioUrl.startsWith('http') && 
					p.audioUrl.startsWith('/audio/uploaded/')
				);

				if (alreadyDownloaded) {
					// Update this podcast to use the same local file
					const index = podcasts.findIndex(p => p.id === podcast.id);
					if (index >= 0) {
						podcasts[index].audioUrl = alreadyDownloaded.audioUrl;
						podcasts[index].filename = alreadyDownloaded.filename;
						if (alreadyDownloaded.size) {
							podcasts[index].size = alreadyDownloaded.size;
						}
						savePodcast(podcasts[index]);
					}
					skipped++;
					continue;
				}

				// Generate unique filename
				const ext = getFileExtension(url);
				const filename = `${randomUUID()}.${ext}`;
				const filePath = join(destPath, filename);

				// Download the file
				const result = await downloadFile(url, filePath);

				// Verify file exists and get size
				if (!existsSync(filePath)) {
					throw new Error('File was not created');
				}

				const stats = statSync(filePath);
				const fileSize = stats.size;

				if (fileSize === 0) {
					throw new Error('Downloaded file is empty');
				}

				// Update podcast in database
				const newAudioUrl = `/audio/uploaded/${filename}`;
				const index = podcasts.findIndex(p => p.id === podcast.id);
				if (index >= 0) {
					podcasts[index].audioUrl = newAudioUrl;
					podcasts[index].filename = filename;
					podcasts[index].size = fileSize;
					savePodcast(podcasts[index]);
				}

				downloaded++;
				totalSize += fileSize;
			} catch (error) {
				errors++;
				errorDetails.push(`${podcastTitle}: ${error.message}`);
			}
		}

		return json({
			success: true,
			downloaded,
			skipped,
			errors,
			totalSize,
			totalSizeFormatted: formatBytes(totalSize),
			errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
			destPath
		});
	} catch (error) {
		console.error('Download error:', error);
		return json({ 
			error: 'Download failed: ' + error.message 
		}, { status: 500 });
	}
};

