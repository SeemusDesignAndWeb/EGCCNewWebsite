import { redirect, fail } from '@sveltejs/kit';
import { findById, update, remove, readCollection, findMany, create } from '$lib/crm/server/fileStore.js';
import { validateEvent, validateOccurrence, getEventColors } from '$lib/crm/server/validators.js';
import { getCsrfToken, verifyCsrfToken } from '$lib/crm/server/auth.js';
import { sanitizeHtml } from '$lib/crm/server/sanitize.js';
import { ensureEventToken, ensureOccurrenceToken } from '$lib/crm/server/tokens.js';
import { env } from '$env/dynamic/private';
import { logDataChange } from '$lib/crm/server/audit.js';
import { filterUpcomingOccurrences } from '$lib/crm/utils/occurrenceFilters.js';
import { getCurrentOrganisationId, withOrganisationId } from '$lib/crm/server/orgContext.js';

export async function load({ params, cookies, url }) {
	const organisationId = await getCurrentOrganisationId();
	const event = await findById('events', params.id);
	if (!event) {
		throw redirect(302, '/hub/events');
	}
	if (event.organisationId != null && event.organisationId !== organisationId) {
		throw redirect(302, '/hub/events');
	}

	const eventOccurrences = await findMany('occurrences', o => o.eventId === params.id);
	const occurrences = filterUpcomingOccurrences(eventOccurrences);
	const rotas = await findMany('rotas', r => r.eventId === params.id);
	const eventSignups = await findMany('event_signups', s => s.eventId === params.id);
	const meetingPlanners = await findMany('meeting_planners', mp => mp.eventId === params.id);

	// Calculate rota statistics and signup statistics for each occurrence
	const occurrencesWithStats = occurrences.map(occ => {
		// Find rotas that apply to this occurrence
		// A rota applies if:
		// 1. It has no occurrenceId (applies to all occurrences)
		// 2. It has an occurrenceId matching this occurrence
		const applicableRotas = rotas.filter(rota => {
			return !rota.occurrenceId || rota.occurrenceId === occ.id;
		});

		// Calculate stats for this occurrence
		let totalCapacity = 0;
		let totalAssigned = 0;
		let rotaCount = applicableRotas.length;

		applicableRotas.forEach(rota => {
			totalCapacity += rota.capacity || 0;
			
			// Count assignees for this specific occurrence
			const assignees = rota.assignees || [];
			const assigneesForOcc = assignees.filter(a => {
				if (typeof a === 'string') {
					// Old format - if rota has occurrenceId, only count for that occurrence
					return rota.occurrenceId === occ.id;
				}
				if (a && typeof a === 'object') {
					const aOccId = a.occurrenceId || rota.occurrenceId;
					return aOccId === occ.id;
				}
				return false;
			});
			
			totalAssigned += assigneesForOcc.length;
		});

		const spotsRemaining = totalCapacity - totalAssigned;

		// Calculate event signup statistics for this occurrence
		const occSignups = eventSignups.filter(s => s.occurrenceId === occ.id);
		const totalAttendees = occSignups.reduce((sum, s) => sum + (s.guestCount || 0) + 1, 0); // +1 for the signup person
		// Use occurrence maxSpaces if set, otherwise use event maxSpaces
		const effectiveMaxSpaces = occ.maxSpaces !== null && occ.maxSpaces !== undefined ? occ.maxSpaces : event.maxSpaces;
		const availableSpots = effectiveMaxSpaces ? effectiveMaxSpaces - totalAttendees : null;
		const isFull = effectiveMaxSpaces ? totalAttendees >= effectiveMaxSpaces : false;

		return {
			...occ,
			rotaStats: {
				rotaCount,
				totalCapacity,
				totalAssigned,
				spotsRemaining
			},
			signupStats: {
				signupCount: occSignups.length,
				totalAttendees,
				availableSpots,
				isFull,
				signups: occSignups
			}
		};
	});

	// Ensure an event token exists and generate links
	let rotaSignupLink = '';
	let publicEventLink = '';
	const occurrenceLinks = [];
	
	try {
		const token = await ensureEventToken(params.id);
		const baseUrl = url.origin || env.APP_BASE_URL || 'http://localhost:5173';
		rotaSignupLink = `${baseUrl}/signup/event/${token.token}`;
		publicEventLink = `${baseUrl}/event/${token.token}`;
		
		// Generate occurrence-specific links
		for (const occ of occurrences) {
			try {
				const occToken = await ensureOccurrenceToken(params.id, occ.id);
				occurrenceLinks.push({
					occurrenceId: occ.id,
					link: `${baseUrl}/event/${occToken.token}`
				});
			} catch (error) {
				console.error(`Error generating token for occurrence ${occ.id}:`, error);
			}
		}
	} catch (error) {
		console.error('Error generating event token:', error);
		// Continue without links if token generation fails
	}

	const csrfToken = getCsrfToken(cookies) || '';
	const eventColors = await getEventColors();
	const { filterByOrganisation } = await import('$lib/crm/server/orgContext.js');
	const lists = filterByOrganisation(await readCollection('lists'), organisationId);

	// When opened from calendar with ?occurrenceId=, pass that occurrence so the bar can show even if it's past/filtered
	let requestedOccurrence = null;
	const occurrenceIdFromUrl = url.searchParams.get('occurrenceId');
	if (occurrenceIdFromUrl) {
		requestedOccurrence = eventOccurrences.find(o => String(o.id) === String(occurrenceIdFromUrl)) || null;
	}

	return { event, occurrences: occurrencesWithStats, rotas, meetingPlanners, rotaSignupLink, publicEventLink, occurrenceLinks, csrfToken, eventColors, lists, requestedOccurrence };
}

export const actions = {
	update: async ({ request, params, cookies, locals }) => {
		const data = await request.formData();
		const csrfToken = data.get('_csrf');

		if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
			return { error: 'CSRF token validation failed' };
		}

		try {
			// Get existing event to preserve fields not in the form
			const existingEvent = await findById('events', params.id);
			if (!existingEvent) {
				return { error: 'Event not found' };
			}

			const description = data.get('description') || '';
			const sanitized = await sanitizeHtml(description);

			// Handle listIds - can be multiple form values with the same name
			const listIds = data.getAll('listIds').filter(id => id && id.trim().length > 0);

			const eventData = {
				title: data.get('title'),
				description: sanitized,
				location: data.get('location'),
				image: data.get('image') ?? existingEvent.image ?? '',
				visibility: ['public', 'private', 'internal'].includes(data.get('visibility')) ? data.get('visibility') : 'private',
				enableSignup: data.get('enableSignup') === 'on' || data.get('enableSignup') === 'true',
				hideFromEmail: data.get('hideFromEmail') === 'on' || data.get('hideFromEmail') === 'true',
				showDietaryRequirements: data.get('showDietaryRequirements') === 'on' || data.get('showDietaryRequirements') === 'true',
				maxSpaces: data.get('maxSpaces') ? parseInt(data.get('maxSpaces')) : null,
				color: data.get('color') || existingEvent.color || '#9333ea',
				listIds: listIds,
				// Preserve recurrence fields if they exist
				repeatType: existingEvent.repeatType || 'none',
				repeatInterval: existingEvent.repeatInterval || 1,
				repeatEndType: existingEvent.repeatEndType || 'never',
				repeatEndDate: existingEvent.repeatEndDate || null,
				repeatCount: existingEvent.repeatCount || null,
				repeatDayOfMonth: existingEvent.repeatDayOfMonth || null,
				repeatDayOfWeek: existingEvent.repeatDayOfWeek || null,
				repeatWeekOfMonth: existingEvent.repeatWeekOfMonth || null,
				meta: existingEvent.meta || {}
			};

			const validated = await validateEvent(eventData);
			await update('events', params.id, validated);

			// Log audit event
			const adminId = locals?.admin?.id || null;
			const event = { getClientAddress: () => 'unknown', request };
			await logDataChange(adminId, 'update', 'event', params.id, {
				title: validated.title
			}, event);

			return { success: true };
		} catch (error) {
			console.error('[Update Event] Error:', error);
			return { error: error.message || 'Failed to update event' };
		}
	},

	delete: async ({ params, cookies, request, locals }) => {
		const data = await request.formData();
		const csrfToken = data.get('_csrf');

		if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
			return { error: 'CSRF token validation failed' };
		}

		// Get event data before deletion for audit log
		const event = await findById('events', params.id);
		
		await remove('events', params.id);

		// Log audit event
		const adminId = locals?.admin?.id || null;
		const eventObj = { getClientAddress: () => 'unknown', request };
		await logDataChange(adminId, 'delete', 'event', params.id, {
			title: event?.title || 'unknown'
		}, eventObj);

		throw redirect(302, '/hub/events');
	},

		deleteSignup: async ({ request, params, cookies }) => {
		const data = await request.formData();
		const csrfToken = data.get('_csrf');

		if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
			return fail(403, { error: 'CSRF token validation failed' });
		}

		try {
			const signupId = data.get('signupId');
			if (!signupId) {
				return fail(400, { error: 'Signup ID is required' });
			}

			// Verify the signup belongs to this event
			const signup = await findById('event_signups', signupId);
			if (!signup) {
				return fail(404, { error: 'Signup not found' });
			}

			if (signup.eventId !== params.id) {
				return fail(403, { error: 'Signup does not belong to this event' });
			}

			await remove('event_signups', signupId);
			return { success: true, type: 'deleteSignup' };
		} catch (error) {
			console.error('Error deleting signup:', error);
			return fail(400, { error: error.message || 'Failed to delete signup' });
		}
	},

	createEventEmail: async ({ request, params, cookies, url }) => {
		const data = await request.formData();
		const csrfToken = data.get('_csrf');

		if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
			return fail(403, { error: 'CSRF token validation failed' });
		}

		try {
			const organisationId = await getCurrentOrganisationId();
			const event = await findById('events', params.id);
			if (!event) {
				return fail(404, { error: 'Event not found' });
			}
			if (event.organisationId != null && event.organisationId !== organisationId) {
				return fail(404, { error: 'Event not found' });
			}

			const baseUrl = url.origin || env.APP_BASE_URL || 'http://localhost:5173';
			let publicEventLink = baseUrl;
			try {
				const token = await ensureEventToken(params.id);
				publicEventLink = `${baseUrl}/event/${token.token}`;
			} catch (e) {
				console.error('Error generating event token:', e);
			}

			const eventTitle = event.title || 'Event';
			const subject = `You're invited: ${eventTitle}`;

			// Build HTML: image (resizable in editor via ql-resizable-image), Hello {{firstName}}, event details, signup CTA if enabled
			const imageBlock = event.image
				? `<p style="margin:0 0 2.5em 0;"><img class="ql-resizable-image" src="${event.image}" alt="${(eventTitle || '').replace(/"/g, '&quot;')}" width="560" style="max-width:100%; height:auto; border-radius:8px;" /></p>`
				: '';

			const detailsParts = [];
			
			// Event Title - larger and with spacing
			if (event.title) {
				detailsParts.push(`<h2 style="font-size:24px; font-weight:bold; color:#111827; margin:1em 0 0.5em 0; line-height:1.3;">${event.title.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</h2>`);
			}
			
			// Location
			if (event.location) {
				detailsParts.push(`<p style="margin:0 0 1em 0; font-size:16px; color:#4b5563;"><strong>Location:</strong> ${event.location.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`);
			}
			
			// Description
			if (event.description) {
				detailsParts.push(`<div style="font-size:16px; line-height:1.6; color:#374151;">${event.description}</div>`);
			}

			const eventDetailsHtml = detailsParts.length
				? `<div style="margin-top:0.5em;">${detailsParts.join('')}</div>`
				: '';

			// Signup CTA: Simple button-style link in a paragraph (left-aligned) - better compatibility with editors
			const signupLine = event.enableSignup
				? `<p style="margin:2em 0;"><a href="${publicEventLink}" style="background-color:#059669; color:#ffffff; padding:12px 24px; border-radius:6px; text-decoration:none; display:inline-block; font-weight:bold; font-size:16px;">Sign up here</a></p>`
				: '';

			const htmlContent = `
<div style="font-family: sans-serif; max-width: 600px;">
${imageBlock}
<p>Hello {{firstName}},</p>
<p>I would love you to come to this event:</p>
${eventDetailsHtml}
${signupLine}
</div>`.trim();

			const textContent = [
				'Hello {{firstName}},',
				'',
				'I would love you to come to this event:',
				'',
				event.title || '',
				event.location ? `Location: ${event.location}` : '',
				'',
				event.enableSignup ? `You can sign up here: ${publicEventLink}` : ''
			].filter(Boolean).join('\n');

			const sanitizedHtml = await sanitizeHtml(htmlContent);

			const newsletter = await create('emails', withOrganisationId({
				subject,
				htmlContent: sanitizedHtml,
				textContent: textContent.trim(),
				status: 'draft',
				logs: [],
				metrics: {}
			}, organisationId));

			return { success: true, emailId: newsletter.id, type: 'createEventEmail' };
		} catch (error) {
			console.error('[Create event email] Error:', error);
			return fail(400, { error: error.message || 'Failed to create email' });
		}
	},

	moveOccurrence: async ({ request, params, cookies }) => {
		const data = await request.formData();
		const csrfToken = data.get('_csrf');

		if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
			return { error: 'CSRF token validation failed' };
		}

		try {
			const organisationId = await getCurrentOrganisationId();
			const eventId = params.id;
			const occurrenceId = data.get('occurrenceId');
			if (!occurrenceId) {
				return { error: 'Occurrence is required' };
			}

			const currentOcc = await findById('occurrences', occurrenceId);
			if (!currentOcc || currentOcc.eventId !== eventId || (currentOcc.organisationId != null && currentOcc.organisationId !== organisationId)) {
				return { error: 'Occurrence not found' };
			}

			const startsAt = data.get('startsAt');
			const endsAt = data.get('endsAt');
			const allDay = data.get('allDay') === 'true';

			if (!startsAt || !endsAt) {
				return { error: 'Date and time are required' };
			}

			const startISO = new Date(startsAt).toISOString();
			const endISO = new Date(endsAt).toISOString();

			const occurrenceData = {
				eventId,
				startsAt: startISO,
				endsAt: endISO,
				location: currentOcc.location || '',
				maxSpaces: currentOcc.maxSpaces,
				information: currentOcc.information || '',
				allDay
			};

			const validated = validateOccurrence(occurrenceData);
			await update('occurrences', occurrenceId, validated);

			return { success: true, type: 'moveOccurrence' };
		} catch (error) {
			console.error('[Move Occurrence] Error:', error);
			return { error: error.message || 'Failed to move occurrence' };
		}
	}
};

