import { readCollection } from '$lib/crm/server/fileStore.js';
import { getCsrfToken } from '$lib/crm/server/auth.js';
import { getCurrentOrganisationId, filterByOrganisation } from '$lib/crm/server/orgContext.js';

export async function load({ cookies }) {
	const organisationId = await getCurrentOrganisationId();
	const templates = filterByOrganisation(await readCollection('email_templates'), organisationId);
	const csrfToken = getCsrfToken(cookies) || '';
	return { templates, csrfToken };
}

