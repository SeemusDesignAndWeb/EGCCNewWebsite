import { redirect } from '@sveltejs/kit';
import { findById } from '$lib/crm/server/fileStore.js';

export async function load({ params }) {
	const newsletter = await findById('emails', params.id);
	if (!newsletter) {
		throw redirect(302, '/hub/emails');
	}
	return { newsletter };
}

