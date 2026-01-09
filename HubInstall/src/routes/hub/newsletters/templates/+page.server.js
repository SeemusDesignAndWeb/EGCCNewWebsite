import { readCollection } from '$lib/crm/server/fileStore.js';
import { getCsrfToken } from '$lib/crm/server/auth.js';

export async function load({ cookies }) {
	const templates = await readCollection('newsletter_templates');
	const csrfToken = getCsrfToken(cookies) || '';
	return { templates, csrfToken };
}

