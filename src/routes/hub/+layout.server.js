import { getCsrfToken } from '$lib/crm/server/auth.js';
import { getSettings } from '$lib/crm/server/settings.js';

export async function load({ cookies, locals }) {
	const csrfToken = getCsrfToken(cookies);
	const settings = await getSettings();
	return {
		csrfToken,
		admin: locals.admin || null,
		theme: settings?.theme || null
	};
}

