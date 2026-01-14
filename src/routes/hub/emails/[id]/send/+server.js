import { json, error } from '@sveltejs/kit';
import { findById, readCollection, update } from '$lib/crm/server/fileStore.js';
import { sendNewsletterEmail } from '$lib/crm/server/email.js';
import { verifyCsrfToken } from '$lib/crm/server/auth.js';

export async function POST({ request, cookies, params, url }) {
	const data = await request.json();
	const csrfToken = data._csrf;

	if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
		throw error(403, 'CSRF token validation failed');
	}

	const email = await findById('emails', params.id);
	if (!email) {
		throw error(404, 'Email not found');
	}

	const listId = data.listId;
	if (!listId) {
		throw error(400, 'List ID is required');
	}

	const list = await findById('lists', listId);
	if (!list) {
		throw error(404, 'List not found');
	}

	const contacts = await readCollection('contacts');
	// Filter to only subscribed contacts (subscribed !== false)
	const listContacts = contacts.filter(c => 
		list.contactIds?.includes(c.id) && 
		c.subscribed !== false
	);

	const results = [];
	for (const contact of listContacts) {
		try {
			await sendNewsletterEmail(
				{
					newsletterId: email.id,
					to: contact.email,
					name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email,
					contact: contact
				},
				{ url }
			);
			results.push({ email: contact.email, status: 'sent' });
		} catch (err) {
			results.push({ email: contact.email, status: 'error', error: err.message });
		}
	}

	// Update email status
	await update('emails', email.id, {
		status: 'sent',
		sentAt: new Date().toISOString()
	});

	return json({ success: true, results });
}

