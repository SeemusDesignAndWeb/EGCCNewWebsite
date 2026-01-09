import { readCollection } from '$lib/crm/server/fileStore.js';
import { getCsrfToken } from '$lib/crm/server/auth.js';

export async function load({ cookies }) {
	const events = await readCollection('events');
	const rotas = await readCollection('rotas');
	const occurrences = await readCollection('occurrences');
	const contacts = await readCollection('contacts');
	const lists = await readCollection('lists');

	const csrfToken = getCsrfToken(cookies) || '';
	return { events, rotas, occurrences, contacts, lists, csrfToken };
}

