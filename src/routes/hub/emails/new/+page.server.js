import { fail, redirect } from '@sveltejs/kit';
import { create, readCollection } from '$lib/crm/server/fileStore.js';
import { getCsrfToken, verifyCsrfToken } from '$lib/crm/server/auth.js';
import { sanitizeHtml } from '$lib/crm/server/sanitize.js';
import { getCurrentOrganisationId, filterByOrganisation, withOrganisationId } from '$lib/crm/server/orgContext.js';

export async function load({ cookies }) {
	const organisationId = await getCurrentOrganisationId();
	const templates = filterByOrganisation(await readCollection('email_templates'), organisationId);
	const csrfToken = getCsrfToken(cookies) || '';
	return { templates, csrfToken };
}

export const actions = {
	create: async ({ request, cookies }) => {
		const data = await request.formData();
		const csrfToken = data.get('_csrf');

		if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
			return fail(403, { error: 'CSRF token validation failed' });
		}

		const subject = data.get('subject') || '';
		if (!subject.trim()) {
			return fail(400, { error: 'Subject is required' });
		}

		const htmlContent = data.get('htmlContent') || '';
		const sanitizedHtml = await sanitizeHtml(htmlContent);
		
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

		try {
			const organisationId = await getCurrentOrganisationId();
			const newsletter = await create('emails', withOrganisationId({
				subject: subject.trim(),
				htmlContent: sanitizedHtml,
				textContent: textContent,
				status: 'draft',
				logs: [],
				metrics: {}
			}, organisationId));

			// Redirect after successful creation - don't wrap in try-catch
			throw redirect(302, `/hub/emails/${newsletter.id}?created=true`);
		} catch (error) {
			// Don't treat redirects as errors - check for redirect status code
			if (error?.status === 302 || error?.status === 301 || (error?.status >= 300 && error?.status < 400)) {
				throw error; // Re-throw redirects
			}
			// Also check if it's a redirect by looking for location header
			if (error?.location) {
				throw error;
			}
			console.error('Error creating newsletter:', error);
			return fail(400, { error: error.message || 'Failed to create newsletter' });
		}
	}
};

