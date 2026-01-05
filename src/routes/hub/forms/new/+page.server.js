import { fail, redirect } from '@sveltejs/kit';
import { create } from '$lib/crm/server/fileStore.js';
import { validateForm } from '$lib/crm/server/validators.js';
import { getCsrfToken, verifyCsrfToken } from '$lib/crm/server/auth.js';

export async function load({ cookies }) {
	const csrfToken = getCsrfToken(cookies) || '';
	return { csrfToken };
}

export const actions = {
	create: async ({ request, cookies }) => {
		const data = await request.formData();
		const csrfToken = data.get('_csrf');

		if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
			return fail(403, { error: 'CSRF token validation failed' });
		}

		try {
			const fieldsJson = data.get('fields');
			if (!fieldsJson) {
				return fail(400, { error: 'Form fields are required' });
			}

			const fields = JSON.parse(fieldsJson);
			const formData = {
				name: data.get('name'),
				description: data.get('description'),
				fields: fields,
				isSafeguarding: data.get('isSafeguarding') === 'true'
			};

			const validated = validateForm(formData);
			const form = await create('forms', validated);

			throw redirect(302, `/hub/forms/${form.id}`);
		} catch (error) {
			if (error.status === 302) throw error; // Re-throw redirects
			return fail(400, { error: error.message });
		}
	}
};

