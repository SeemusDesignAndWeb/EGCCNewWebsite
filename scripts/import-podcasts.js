/**
 * Script to import podcasts from the existing RSS feed
 * Run with: node scripts/import-podcasts.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';

const RSS_FEED_URL = 'https://www.egcc.co.uk/feed.php?id=10001';
const DB_PATH = './data/database.json';

async function fetchRSSFeed() {
	try {
		const response = await fetch(RSS_FEED_URL);
		const xml = await response.text();
		return xml;
	} catch (error) {
		console.error('Failed to fetch RSS feed:', error);
		throw error;
	}
}

function parseRSSFeed(xml) {
	const podcasts = [];
	
	// Simple XML parsing (for production, consider using a proper XML parser)
	const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g);
	
	for (const match of itemMatches) {
		const itemXml = match[1];
		
		const title = extractTag(itemXml, 'title');
		const link = extractTag(itemXml, 'link');
		const speaker = extractTag(itemXml, 'itunes:author') || extractTag(itemXml, 'author');
		const speakerEmail = extractTag(itemXml, 'itunes:email') || extractTag(itemXml, 'author');
		const duration = extractTag(itemXml, 'duration');
		const description = extractTag(itemXml, 'description');
		const pubDate = extractTag(itemXml, 'pubDate');
		const category = extractTag(itemXml, 'category');
		const guid = extractTag(itemXml, 'guid');
		
		// Extract enclosure URL and size
		const enclosureMatch = itemXml.match(/<enclosure[^>]*url="([^"]*)"[^>]*length="([^"]*)"[^>]*>/);
		const audioUrl = enclosureMatch ? enclosureMatch[1] : link;
		const size = enclosureMatch ? parseInt(enclosureMatch[2]) : 0;
		
		if (title && audioUrl) {
			// Parse date
			let publishedAt = new Date().toISOString();
			if (pubDate) {
				try {
					publishedAt = new Date(pubDate).toISOString();
				} catch (e) {
					console.warn('Failed to parse date:', pubDate);
				}
			}
			
			// Extract filename from URL
			const urlParts = audioUrl.split('/');
			const filename = urlParts[urlParts.length - 1];
			
			podcasts.push({
				id: guid || randomUUID(),
				title: title.trim(),
				description: description ? description.trim() : `By ${speaker}`,
				speaker: speaker ? speaker.trim() : 'Various Speakers',
				speakerEmail: speakerEmail ? speakerEmail.trim() : 'johnawatson72@gmail.com',
				audioUrl: audioUrl, // Keep original URL from egcc.co.uk
				filename: filename,
				originalName: filename,
				size: size,
				duration: duration ? duration.trim() : '',
				publishedAt: publishedAt,
				category: category ? category.trim() : 'Talk',
				series: extractSeries(title),
				guid: guid || undefined
			});
		}
	}
	
	return podcasts;
}

function extractTag(xml, tagName) {
	const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i');
	const match = xml.match(regex);
	return match ? match[1].trim() : null;
}

function extractSeries(title) {
	// Try to extract series name from title
	// Look for patterns like "1. Building..." or series mentions in title
	if (title.includes('Nehemiah')) {
		return 'Nehemiah';
	}
	// Check for numbered series (e.g., "1. Building...", "2. Now is the time")
	const seriesMatch = title.match(/^(\d+)\.\s*(.+)/);
	if (seriesMatch) {
		// Check if the content suggests a series name
		const content = seriesMatch[2].toLowerCase();
		if (content.includes('nehemiah')) {
			return 'Nehemiah';
		}
		// For numbered series without explicit name, return null
		// You can manually set series in admin later
		return null;
	}
	return null;
}

async function importPodcasts() {
	try {
		console.log('Fetching RSS feed...');
		const xml = await fetchRSSFeed();
		
		console.log('Parsing RSS feed...');
		const podcasts = parseRSSFeed(xml);
		
		console.log(`Found ${podcasts.length} podcasts`);
		
		// Read existing database
		const dbPath = join(process.cwd(), DB_PATH);
		const db = JSON.parse(readFileSync(dbPath, 'utf-8'));
		
		// Add podcasts to database (merge with existing, avoiding duplicates by GUID)
		const existingGuids = new Set((db.podcasts || []).map(p => p.guid || p.id).filter(Boolean));
		const existingIds = new Set((db.podcasts || []).map(p => p.id));
		
		const newPodcasts = podcasts.filter(p => {
			const guid = p.guid || p.id;
			return !existingGuids.has(guid) && !existingIds.has(p.id);
		});
		
		if (newPodcasts.length > 0) {
			db.podcasts = [...(db.podcasts || []), ...newPodcasts];
			writeFileSync(dbPath, JSON.stringify(db, null, 2));
			console.log(`✅ Imported ${newPodcasts.length} new podcasts`);
			console.log(`📊 Total podcasts in database: ${db.podcasts.length}`);
		} else {
			console.log('ℹ️  No new podcasts to import (all podcasts already exist)');
			console.log(`📊 Total podcasts in database: ${(db.podcasts || []).length}`);
		}
		
		console.log('Import complete!');
	} catch (error) {
		console.error('Import failed:', error);
		process.exit(1);
	}
}

importPodcasts();


