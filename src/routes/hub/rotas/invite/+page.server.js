import { readCollection } from '$lib/crm/server/fileStore.js';
import { getCsrfToken } from '$lib/crm/server/auth.js';

export async function load({ cookies }) {
	const events = await readCollection('events');
	const rotas = await readCollection('rotas');
	const occurrences = await readCollection('occurrences');
	const contactsRaw = await readCollection('contacts');
	const lists = await readCollection('lists');

	// Sort contacts alphabetically by last name, then first name
	const contacts = contactsRaw.sort((a, b) => {
		const aLastName = (a.lastName || '').toLowerCase();
		const bLastName = (b.lastName || '').toLowerCase();
		const aFirstName = (a.firstName || '').toLowerCase();
		const bFirstName = (b.firstName || '').toLowerCase();
		
		if (aLastName !== bLastName) {
			return aLastName.localeCompare(bLastName);
		}
		return aFirstName.localeCompare(bFirstName);
	});

	const csrfToken = getCsrfToken(cookies) || '';
	return { events, rotas, occurrences, contacts, lists, csrfToken };
}

