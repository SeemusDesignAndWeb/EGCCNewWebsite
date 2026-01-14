import { redirect } from '@sveltejs/kit';
import { findById, readCollection } from '$lib/crm/server/fileStore.js';
import { getCsrfToken } from '$lib/crm/server/auth.js';

export async function load({ params, cookies }) {
	const newsletter = await findById('emails', params.id);
	if (!newsletter) {
		throw redirect(302, '/hub/emails');
	}

	const lists = await readCollection('lists');
	const contacts = await readCollection('contacts');
	
	// Enrich lists with actual contact counts (only count contacts that exist and are subscribed)
	const listsWithCounts = lists.map(list => {
		const validContacts = contacts.filter(c => 
			list.contactIds?.includes(c.id) && 
			c.subscribed !== false
		);
		return {
			...list,
			contactCount: validContacts.length
		};
	});
	
	const csrfToken = getCsrfToken(cookies) || '';

	return { newsletter, lists: listsWithCounts, csrfToken };
}

