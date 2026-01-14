import { fail, redirect } from '@sveltejs/kit';
import { create } from '$lib/crm/server/fileStore.js';
import { validateNewsletterTemplate } from '$lib/crm/server/validators.js';
import { getCsrfToken, verifyCsrfToken } from '$lib/crm/server/auth.js';
import { sanitizeHtml } from '$lib/crm/server/sanitize.js';

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
			const htmlContent = data.get('htmlContent') || '';
			const sanitizedHtml = await sanitizeHtml(htmlContent);

			// Auto-generate text content if not provided
			const textContent = data.get('textContent') || sanitizedHtml
				.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
				.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
				.replace(/<[^>]+>/g, '')
				.replace(/&nbsp;/g, ' ')
				.replace(/&amp;/g, '&')
				.replace(/&lt;/g, '<')
				.replace(/&gt;/g, '>')
				.replace(/&quot;/g, '"')
				.replace(/&#39;/g, "'")
				.replace(/\s+/g, ' ')
				.trim();

			const templateData = {
				name: data.get('name'),
				subject: data.get('subject') || '',
				htmlContent: sanitizedHtml,
				textContent: textContent,
				description: data.get('description') || ''
			};

			const validated = validateNewsletterTemplate(templateData);
			const template = await create('email_templates', validated);

			throw redirect(302, `/hub/emails/templates/${template.id}`);
		} catch (error) {
			if (error.status === 302) throw error;
			return fail(400, { error: error.message });
		}
	}
};

