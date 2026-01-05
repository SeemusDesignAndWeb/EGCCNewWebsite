import { redirect } from '@sveltejs/kit';
import { findById, findMany } from '$lib/crm/server/fileStore.js';
import { env } from '$env/dynamic/private';

/**
 * Generate ICS (iCalendar) content for an event and its occurrences
 */
function generateICS(event, occurrences) {
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//TheHUB//Event Calendar//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH'
	];

	for (const occurrence of occurrences) {
		const start = formatICSDate(new Date(occurrence.startsAt));
		const end = formatICSDate(new Date(occurrence.endsAt));
		const now = formatICSDate(new Date());
		const uid = `${occurrence.id}@${env.APP_BASE_URL?.replace(/https?:\/\//, '') || 'localhost'}`;
		
		// Escape text for ICS format
		const summary = escapeICS(event.title || 'Untitled Event');
		const description = escapeICS(event.description || '');
		const location = escapeICS(occurrence.location || event.location || '');

		lines.push(
			'BEGIN:VEVENT',
			`UID:${uid}`,
			`DTSTAMP:${now}`,
			`DTSTART:${start}`,
			`DTEND:${end}`,
			`SUMMARY:${summary}`,
			description ? `DESCRIPTION:${description}` : '',
			location ? `LOCATION:${location}` : '',
			'STATUS:CONFIRMED',
			'SEQUENCE:0',
			'END:VEVENT'
		);
	}

	lines.push('END:VCALENDAR');
	return lines.filter(line => line !== '').join('\r\n');
}

/**
 * Format date for ICS (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date) {
	const year = date.getUTCFullYear();
	const month = String(date.getUTCMonth() + 1).padStart(2, '0');
	const day = String(date.getUTCDate()).padStart(2, '0');
	const hours = String(date.getUTCHours()).padStart(2, '0');
	const minutes = String(date.getUTCMinutes()).padStart(2, '0');
	const seconds = String(date.getUTCSeconds()).padStart(2, '0');
	return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escape text for ICS format
 */
function escapeICS(text) {
	if (!text) return '';
	// Remove HTML tags
	const plain = text.replace(/<[^>]*>/g, '');
	// Escape special characters
	return plain
		.replace(/\\/g, '\\\\')
		.replace(/;/g, '\\;')
		.replace(/,/g, '\\,')
		.replace(/\n/g, '\\n')
		.replace(/\r/g, '');
}

export async function GET({ params }) {
	const event = await findById('events', params.id);
	if (!event) {
		throw redirect(302, '/hub/events');
	}

	const occurrences = await findMany('occurrences', o => o.eventId === params.id);
	
	if (occurrences.length === 0) {
		return new Response('No occurrences found for this event', { status: 404 });
	}

	const icsContent = generateICS(event, occurrences);
	const filename = `${(event.title || 'event').replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;

	return new Response(icsContent, {
		headers: {
			'Content-Type': 'text/calendar; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
}

