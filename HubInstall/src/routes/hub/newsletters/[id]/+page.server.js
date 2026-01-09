import { redirect, fail } from '@sveltejs/kit';
import { findById, update, create, readCollection, remove } from '$lib/crm/server/fileStore.js';
import { getCsrfToken, verifyCsrfToken } from '$lib/crm/server/auth.js';
import { sanitizeHtml } from '$lib/crm/server/sanitize.js';
import { validateNewsletterTemplate } from '$lib/crm/server/validators.js';

export async function load({ params, cookies }) {
	const newsletter = await findById('newsletters', params.id);
	if (!newsletter) {
		throw redirect(302, '/hub/newsletters');
	}

	const templates = await readCollection('newsletter_templates');
	const csrfToken = getCsrfToken(cookies) || '';
	return { newsletter, templates, csrfToken };
}

export const actions = {
	update: async ({ request, params, cookies }) => {
		const data = await request.formData();
		const csrfToken = data.get('_csrf');

		if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
			return fail(403, { error: 'CSRF token validation failed' });
		}

		try {
			// Get existing newsletter to preserve fields not being updated
			const existing = await findById('newsletters', params.id);
			if (!existing) {
				return fail(404, { error: 'Newsletter not found' });
			}

			const htmlContent = data.get('htmlContent') || '';
			const sanitizedHtml = await sanitizeHtml(htmlContent);
			
			// Get subject from form data - always preserve existing if form value is empty/missing
			const subjectValue = data.get('subject');
			// Convert to string and check if it has content after trimming
			const subjectStr = subjectValue ? String(subjectValue).trim() : '';
			// Only use form value if it's not empty, otherwise preserve existing subject
			const finalSubject = subjectStr.length > 0 ? subjectStr : (existing.subject || '');
			
			// Auto-generate text content from HTML
			const textContent = sanitizedHtml
				.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // Remove style tags
				.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Remove script tags
				.replace(/<[^>]+>/g, '') // Remove all HTML tags
				.replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
				.replace(/&amp;/g, '&') // Replace &amp; with &
				.replace(/&lt;/g, '<') // Replace &lt; with <
				.replace(/&gt;/g, '>') // Replace &gt; with >
				.replace(/&quot;/g, '"') // Replace &quot; with "
				.replace(/&#39;/g, "'") // Replace &#39; with '
				.replace(/\s+/g, ' ') // Replace multiple spaces with single space
				.trim();

			await update('newsletters', params.id, {
				subject: finalSubject,
				htmlContent: sanitizedHtml,
				textContent: textContent
			});

			return { success: true };
		} catch (error) {
			return fail(400, { error: error.message });
		}
	},
	saveAsTemplate: async ({ request, params, cookies }) => {
		const data = await request.formData();
		const csrfToken = data.get('_csrf');

		if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
			return fail(403, { error: 'CSRF token validation failed' });
		}

		try {
			const newsletter = await findById('newsletters', params.id);
			if (!newsletter) {
				return fail(404, { error: 'Newsletter not found' });
			}

			const templateName = data.get('templateName');
			if (!templateName) {
				return fail(400, { error: 'Template name is required' });
			}

			const templateData = {
				name: templateName,
				subject: newsletter.subject || '',
				htmlContent: newsletter.htmlContent || '',
				textContent: newsletter.textContent || '',
				description: data.get('templateDescription') || ''
			};

			const validated = validateNewsletterTemplate(templateData);
			const template = await create('newsletter_templates', validated);

			return { success: true, templateId: template.id };
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

		await remove('newsletters', params.id);
		throw redirect(302, '/hub/newsletters');
	}
};

