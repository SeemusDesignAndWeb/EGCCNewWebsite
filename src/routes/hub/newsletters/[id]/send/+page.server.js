import { redirect } from '@sveltejs/kit';
import { findById, readCollection } from '$lib/crm/server/fileStore.js';
import { getCsrfToken } from '$lib/crm/server/auth.js';

export async function load({ params, cookies }) {
	const newsletter = await findById('newsletters', params.id);
	if (!newsletter) {
		throw redirect(302, '/hub/newsletters');
	}

	const lists = await readCollection('lists');
	const csrfToken = getCsrfToken(cookies) || '';

	return { newsletter, lists, csrfToken };
}

