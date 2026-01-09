import { redirect } from '@sveltejs/kit';
import { findById, update, remove, readCollection } from '$lib/crm/server/fileStore.js';
import { validateList } from '$lib/crm/server/validators.js';
import { getCsrfToken, verifyCsrfToken } from '$lib/crm/server/auth.js';

export async function load({ params, cookies, url }) {
	const list = await findById('lists', params.id);
	if (!list) {
		throw redirect(302, '/hub/lists');
	}

	// Get contact IDs in this list
	const contacts = await readCollection('contacts');
	const listContacts = contacts.filter(c => list.contactIds?.includes(c.id));
	
	// Get all contacts for the add contacts search (excluding those already in list)
	const availableContacts = contacts.filter(c => !list.contactIds?.includes(c.id));
	
	// Search filter if provided
	const search = url.searchParams.get('search') || '';
	const filteredContacts = search 
		? availableContacts.filter(c => 
			(c.email || '').toLowerCase().includes(search.toLowerCase()) ||
			(c.firstName || '').toLowerCase().includes(search.toLowerCase()) ||
			(c.lastName || '').toLowerCase().includes(search.toLowerCase())
		)
		: availableContacts; // Show all available contacts

	const csrfToken = getCsrfToken(cookies) || '';
	return { list, contacts: listContacts, availableContacts: filteredContacts, csrfToken };
}

export const actions = {
	update: async ({ request, params, cookies }) => {
		const data = await request.formData();
		const csrfToken = data.get('_csrf');

		if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
			return { error: 'CSRF token validation failed' };
		}

		try {
			const existingList = await findById('lists', params.id);
			const listData = {
				name: data.get('name'),
				description: data.get('description'),
				contactIds: existingList?.contactIds || []
			};

			const validated = validateList(listData);
			await update('lists', params.id, validated);

			return { success: true };
		} catch (error) {
			return { error: error.message };
		}
	},

	delete: async ({ params, cookies, request }) => {
		const data = await request.formData();
		const csrfToken = data.get('_csrf');

		if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
			return { error: 'CSRF token validation failed' };
		}

		await remove('lists', params.id);
		throw redirect(302, '/hub/lists');
	},

	addContacts: async ({ request, params, cookies }) => {
		const data = await request.formData();
		const csrfToken = data.get('_csrf');

		if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
			return { error: 'CSRF token validation failed' };
		}

		try {
			const list = await findById('lists', params.id);
			if (!list) {
				return { error: 'List not found' };
			}

			const contactIdsJson = data.get('contactIds');
			if (!contactIdsJson) {
				return { error: 'No contacts provided' };
			}

			const newContactIds = JSON.parse(contactIdsJson);
			const existingContactIds = Array.isArray(list.contactIds) ? list.contactIds : [];
			
			// Merge and deduplicate
			const updatedContactIds = [...new Set([...existingContactIds, ...newContactIds])];

			await update('lists', params.id, { contactIds: updatedContactIds });

			return { success: true, type: 'addContacts' };
		} catch (error) {
			return { error: error.message };
		}
	},

	removeContact: async ({ request, params, cookies }) => {
		const data = await request.formData();
		const csrfToken = data.get('_csrf');

		if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
			return { error: 'CSRF token validation failed' };
		}

		try {
			const list = await findById('lists', params.id);
			if (!list) {
				return { error: 'List not found' };
			}

			const contactId = data.get('contactId');
			if (!contactId) {
				return { error: 'Contact ID required' };
			}

			const existingContactIds = Array.isArray(list.contactIds) ? list.contactIds : [];
			const updatedContactIds = existingContactIds.filter(id => id !== contactId);

			await update('lists', params.id, { contactIds: updatedContactIds });

			return { success: true, type: 'removeContact' };
		} catch (error) {
			return { error: error.message };
		}
	}
};

