import { readCollection } from '$lib/crm/server/fileStore.js';
import { getCsrfToken } from '$lib/crm/server/auth.js';
import { getCurrentOrganisationId, filterByOrganisation } from '$lib/crm/server/orgContext.js';

export async function load({ cookies }) {
	const organisationId = await getCurrentOrganisationId();
	const events = filterByOrganisation(await readCollection('events'), organisationId);
	const rotas = filterByOrganisation(await readCollection('rotas'), organisationId);
	const occurrences = filterByOrganisation(await readCollection('occurrences'), organisationId);
	const contactsRaw = filterByOrganisation(await readCollection('contacts'), organisationId);
	const lists = filterByOrganisation(await readCollection('lists'), organisationId);

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

