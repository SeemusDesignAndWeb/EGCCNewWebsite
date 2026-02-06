import { json, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { findById, readCollection, update } from '$lib/crm/server/fileStore.js';
import { prepareNewsletterEmail, sendNewsletterBatch } from '$lib/crm/server/email.js';
import { verifyCsrfToken } from '$lib/crm/server/auth.js';
import { getCurrentOrganisationId, filterByOrganisation } from '$lib/crm/server/orgContext.js';

export async function POST({ request, cookies, params, url }) {
	const data = await request.json();
	const csrfToken = data._csrf;

	if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
		throw error(403, 'CSRF token validation failed');
	}

	const organisationId = await getCurrentOrganisationId();
	const email = await findById('emails', params.id);
	if (!email) {
		throw error(404, 'Email not found');
	}
	if (email.organisationId != null && email.organisationId !== organisationId) {
		throw error(404, 'Email not found');
	}

	const listId = data.listId;
	const contactIds = Array.isArray(data.contactIds) ? data.contactIds : [];

	const contacts = filterByOrganisation(await readCollection('contacts'), organisationId);
	let listContacts;

	if (contactIds.length > 0) {
		// Manual selection: use only the provided contact IDs (must be in org and subscribed)
		listContacts = contacts.filter(c =>
			contactIds.includes(c.id) && c.subscribed !== false
		);
	} else if (listId) {
		// List selection
		const list = await findById('lists', listId);
		if (!list) {
			throw error(404, 'List not found');
		}
		if (list.organisationId != null && list.organisationId !== organisationId) {
			throw error(404, 'List not found');
		}
		listContacts = contacts.filter(c =>
			list.contactIds?.includes(c.id) && c.subscribed !== false
		);
	} else {
		throw error(400, 'Either select a contact list or manually select at least one contact.');
	}

	if (listContacts.length === 0) {
		throw error(400, 'No recipients. The list may be empty or selected contacts are not subscribed.');
	}

	// Prepare all emails first
	const emailDataPromises = listContacts.map(contact => 
		prepareNewsletterEmail(
			{
				newsletterId: email.id,
				to: contact.email,
				name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email,
				contact: contact
			},
			{ url }
		).catch(err => {
			// If preparation fails, return error result
			return { error: true, contactEmail: contact.email, errorMessage: err.message };
		})
	);

	const emailDataArray = await Promise.all(emailDataPromises);
	
	// Filter out errors and prepare valid emails
	const validEmails = [];
	const prepErrors = [];
	
	emailDataArray.forEach((data, index) => {
		if (data.error) {
			prepErrors.push({ 
				email: data.contactEmail || listContacts[index].email, 
				status: 'error', 
				error: data.errorMessage 
			});
		} else {
			validEmails.push(data);
		}
	});

	try {
		// Send emails in batches
		const batchResults = await sendNewsletterBatch(validEmails, email.id);

		// Combine preparation errors with batch results
		const results = [...prepErrors, ...batchResults];

		// Update email status
		await update('emails', email.id, {
			status: 'sent',
			sentAt: new Date().toISOString()
		});

		return json({ success: true, results });
	} catch (err) {
		const errMsg = err?.message || String(err);
		console.error('[Send email] Error:', errMsg, err);
		if (err?.stack) console.error('[Send email] stack:', err.stack);
		const showDetails = process.env.NODE_ENV === 'development' || env.SHOW_EMAIL_ERROR_DETAILS === 'true' || env.SHOW_EMAIL_ERROR_DETAILS === '1';
		return json(
			{
				error: errMsg,
				details: showDetails ? (err?.details ?? err?.body ?? err?.response) : undefined
			},
			{ status: 500 }
		);
	}
}

