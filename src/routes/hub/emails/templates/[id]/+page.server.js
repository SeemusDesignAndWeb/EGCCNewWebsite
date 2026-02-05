import { fail, redirect } from '@sveltejs/kit';
import { findById, update, remove } from '$lib/crm/server/fileStore.js';
import { validateNewsletterTemplate } from '$lib/crm/server/validators.js';
import { getCsrfToken, verifyCsrfToken } from '$lib/crm/server/auth.js';
import { sanitizeHtml } from '$lib/crm/server/sanitize.js';
import { getCurrentOrganisationId } from '$lib/crm/server/orgContext.js';

export async function load({ params, cookies }) {
	const organisationId = await getCurrentOrganisationId();
	const template = await findById('email_templates', params.id);
	if (!template) {
		throw redirect(302, '/hub/emails/templates');
	}
	if (template.organisationId != null && template.organisationId !== organisationId) {
		throw redirect(302, '/hub/emails/templates');
	}
	const csrfToken = getCsrfToken(cookies) || '';
	return { template, csrfToken };
}

export const actions = {
	update: async ({ request, params, cookies }) => {
		const data = await request.formData();
		const csrfToken = data.get('_csrf');

		if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
			return fail(403, { error: 'CSRF token validation failed' });
		}

		try {
			const organisationId = await getCurrentOrganisationId();
			const existing = await findById('email_templates', params.id);
			if (!existing || (existing.organisationId != null && existing.organisationId !== organisationId)) {
				return fail(404, { error: 'Template not found' });
			}
			const htmlContent = data.get('htmlContent') || '';
			const sanitizedHtml = await sanitizeHtml(htmlContent);

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
				name: (data.get('name') || '').toString().trim(),
				subject: (data.get('subject') || '').toString().trim(),
				htmlContent: sanitizedHtml,
				textContent: textContent,
				description: (data.get('description') || '').toString().trim()
			};

			const validated = validateNewsletterTemplate(templateData);
			await update('email_templates', params.id, validated);
			return { success: true };
		} catch (error) {
			return fail(400, { error: error.message });
		}
	},
	delete: async ({ params, cookies, request }) => {
		const data = await request.formData();
		const csrfToken = data.get('_csrf');

		if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
			return fail(403, { error: 'CSRF token validation failed' });
		}

		const organisationId = await getCurrentOrganisationId();
		const template = await findById('email_templates', params.id);
		if (template && template.organisationId != null && template.organisationId !== organisationId) {
			return fail(404, { error: 'Template not found' });
		}
		await remove('email_templates', params.id);
		throw redirect(302, '/hub/emails/templates');
	}
};

