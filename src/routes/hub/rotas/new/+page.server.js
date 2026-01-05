import { fail, redirect } from '@sveltejs/kit';
import { create, readCollection } from '$lib/crm/server/fileStore.js';
import { validateRota } from '$lib/crm/server/validators.js';
import { getCsrfToken, verifyCsrfToken } from '$lib/crm/server/auth.js';
import { sanitizeHtml } from '$lib/crm/server/sanitize.js';

export async function load({ url, cookies }) {
	const eventId = url.searchParams.get('eventId') || '';
	const events = await readCollection('events');
	const occurrences = await readCollection('occurrences');
	
	const csrfToken = getCsrfToken(cookies) || '';
	return { events, occurrences, eventId, csrfToken };
}

export const actions = {
	create: async ({ request, cookies }) => {
		const data = await request.formData();
		const csrfToken = data.get('_csrf');

		if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
			return fail(403, { error: 'CSRF token validation failed' });
		}

		try {
			const notes = data.get('notes') || '';
			const sanitized = await sanitizeHtml(notes);

			const rotaData = {
				eventId: data.get('eventId'),
				occurrenceId: data.get('occurrenceId') || null,
				role: data.get('role'),
				capacity: parseInt(data.get('capacity') || '1', 10),
				assignees: [],
				notes: sanitized
			};

			const validated = validateRota(rotaData);
			const rota = await create('rotas', validated);

			throw redirect(302, `/hub/rotas/${rota.id}`);
		} catch (error) {
			if (error.status === 302) throw error; // Re-throw redirects
			return fail(400, { error: error.message });
		}
	}
};

