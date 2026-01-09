#!/usr/bin/env node
/**
 * Script to create the events page in the site's page database
 * This should be run after Hub installation if the site uses a page database
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';

// Get database path (same logic as database.js)
const DB_PATH = process.env.DATABASE_PATH || './data/database.json';

function getDbPath() {
	let finalPath;
	if (DB_PATH.startsWith('./') || DB_PATH.startsWith('../')) {
		finalPath = join(process.cwd(), DB_PATH);
	} else {
		finalPath = DB_PATH;
	}
	return finalPath;
}

function readDatabase() {
	const dbPath = getDbPath();
	try {
		if (!existsSync(dbPath)) {
			console.log('⚠️  Database file does not exist:', dbPath);
			console.log('   The events page will be created when the database is initialized.');
			return null;
		}
		const data = readFileSync(dbPath, 'utf-8');
		return JSON.parse(data);
	} catch (error) {
		console.error('❌ Error reading database:', error.message);
		return null;
	}
}

function writeDatabase(db) {
	const dbPath = getDbPath();
	const dir = dirname(dbPath);
	
	// Ensure directory exists
	if (!existsSync(dir)) {
		try {
			mkdirSync(dir, { recursive: true });
		} catch (error) {
			console.error('❌ Error creating database directory:', error.message);
			return false;
		}
	}
	
	try {
		writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
		return true;
	} catch (error) {
		console.error('❌ Error writing database:', error.message);
		return false;
	}
}

function savePage(page) {
	const db = readDatabase();
	if (!db) {
		return false;
	}
	
	if (!db.pages) {
		db.pages = [];
	}
	
	const index = db.pages.findIndex((p) => p.id === page.id);
	
	if (index >= 0) {
		// Update existing page
		const existingPage = db.pages[index];
		db.pages[index] = {
			...existingPage,
			...page,
			// Preserve sections if not provided
			sections: page.sections !== undefined ? page.sections : (existingPage.sections || []),
			heroMessages: page.heroMessages !== undefined ? page.heroMessages : (existingPage.heroMessages || []),
			heroButtons: page.heroButtons !== undefined ? page.heroButtons : (existingPage.heroButtons || []),
		};
		console.log(`  ✓ Updated existing page: ${page.id}`);
	} else {
		// New page
		const newPage = {
			...page,
			sections: page.sections || [],
			heroMessages: page.heroMessages || [],
			heroButtons: page.heroButtons || [],
			showInNavigation: page.showInNavigation !== undefined ? page.showInNavigation : true,
			navigationLabel: page.navigationLabel || '',
			navigationOrder: page.navigationOrder !== undefined ? page.navigationOrder : 999,
		};
		db.pages.push(newPage);
		console.log(`  ✓ Created new page: ${page.id}`);
	}
	
	return writeDatabase(db);
}

function createEventsPages() {
	console.log('\n📄 Creating events pages in site database...\n');
	
	const db = readDatabase();
	if (!db) {
		console.log('⚠️  Could not read database. Events pages will be created when:');
		console.log('   1. The database is initialized, or');
		console.log('   2. Someone visits /admin/pages for the first time\n');
		return false;
	}
	
	let created = false;
	
	// Create main events page
	const eventsPageExists = db.pages?.some(p => p.id === 'events');
	if (!eventsPageExists) {
		const eventsPage = {
			id: 'events',
			title: 'Events',
			heroTitle: 'Upcoming Events',
			heroSubtitle: 'Join us for our upcoming events and activities',
			heroButtons: [],
			heroImage: '/images/events-bg.jpg', // Default - can be customized
			heroOverlay: 40,
			sections: [],
			metaDescription: 'View upcoming events and activities. Join us for worship, community groups, and special events.',
			showInNavigation: true,
			navigationLabel: 'Events',
			navigationOrder: 5
		};
		
		if (savePage(eventsPage)) {
			created = true;
		}
	} else {
		console.log('  ⚠  Events page already exists');
	}
	
	// Create events-calendar page
	const eventsCalendarPageExists = db.pages?.some(p => p.id === 'events-calendar');
	if (!eventsCalendarPageExists) {
		const eventsCalendarPage = {
			id: 'events-calendar',
			title: 'Event Calendar',
			heroTitle: 'Event Calendar',
			heroSubtitle: 'View our upcoming public events and activities',
			heroButtons: [],
			heroImage: '/images/events-bg.jpg', // Default - can be customized
			heroOverlay: 40,
			sections: [],
			metaDescription: 'View our upcoming public events and activities on the calendar',
			showInNavigation: false, // Usually accessed via /events page
			navigationLabel: '',
			navigationOrder: 999
		};
		
		if (savePage(eventsCalendarPage)) {
			created = true;
		}
	} else {
		console.log('  ⚠  Events calendar page already exists');
	}
	
	if (created) {
		console.log('\n✅ Events pages created successfully!');
		console.log('   - Main events page: /events');
		console.log('   - Calendar page: /events/calendar');
		console.log('   You can customize these pages in /admin/pages\n');
	} else {
		console.log('\n✅ Events pages already exist in database\n');
	}
	
	return created;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('create-events-page.js')) {
	try {
		createEventsPages();
	} catch (err) {
		console.error('Error:', err);
		process.exit(1);
	}
}

export { createEventsPages };
