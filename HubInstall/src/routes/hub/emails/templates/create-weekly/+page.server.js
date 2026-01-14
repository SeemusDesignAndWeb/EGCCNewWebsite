import { redirect } from '@sveltejs/kit';
import { create } from '$lib/crm/server/fileStore.js';
import { validateNewsletterTemplate } from '$lib/crm/server/validators.js';
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
			return { error: 'CSRF token validation failed' };
		}

		try {
			const weeklyTemplateHtml = `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Weekly Newsletter</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
	<div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
		<!-- Header -->
		<div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2d7a32; padding-bottom: 20px;">
			<h1 style="color: #2d7a32; margin: 0; font-size: 28px;">Weekly Newsletter</h1>
			<p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Eltham Green Community Church</p>
		</div>

		<!-- Greeting -->
		<div style="margin-bottom: 30px;">
			<p style="font-size: 16px; color: #333;">Hello {{firstName}},</p>
			<p style="font-size: 16px; color: #333;">Here's what's happening this week at Eltham Green Community Church:</p>
		</div>

		<!-- Upcoming Events Section -->
		<div style="margin-bottom: 30px;">
			<h2 style="color: #2d7a32; font-size: 22px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">📅 What's Coming Up</h2>
			{{upcomingEvents}}
		</div>

		<!-- Rotas Section -->
		<div style="margin-bottom: 30px;">
			<h2 style="color: #2d7a32; font-size: 22px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">👥 Your Rotas</h2>
			{{rotaLinks}}
		</div>

		<!-- Footer -->
		<div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #666; font-size: 14px;">
			<p style="margin: 0 0 10px 0;">Blessings,</p>
			<p style="margin: 0; font-weight: bold;">Eltham Green Community Church</p>
			<p style="margin: 10px 0 0 0;">542 Westhorne Avenue, Eltham, London, SE9 6DH</p>
		</div>
	</div>
</body>
</html>`;

			const weeklyTemplateText = `WEEKLY NEWSLETTER
Eltham Green Community Church

Hello {{firstName}},

Here's what's happening this week at Eltham Green Community Church:

WHAT'S COMING UP
{{upcomingEvents}}

YOUR ROTAS
{{rotaLinks}}

Blessings,
Eltham Green Community Church
542 Westhorne Avenue, Eltham, London, SE9 6DH`;

			const templateData = {
				name: 'Weekly Newsletter',
				subject: 'Weekly Newsletter - Eltham Green Community Church',
				htmlContent: weeklyTemplateHtml,
				textContent: weeklyTemplateText,
				description: 'A weekly newsletter template showing upcoming events and rotas for the contact'
			};

			const validated = validateNewsletterTemplate(templateData);
			const template = await create('email_templates', validated);

			throw redirect(302, `/hub/emails/templates/${template.id}`);
		} catch (error) {
			if (error.status === 302) throw error;
			return { error: error.message };
		}
	}
};

