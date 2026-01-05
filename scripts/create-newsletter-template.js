import { create } from '../src/lib/hub/server/fileStore.js';
import { validateNewsletterTemplate } from '../src/lib/hub/server/validators.js';

/**
 * Create a newsletter template
 * Usage: node scripts/create-newsletter-template.js
 */

const basicTemplateHtml = `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Newsletter</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
	<div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
		<!-- Header -->
		<div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2d7a32; padding-bottom: 20px;">
			<h1 style="color: #2d7a32; margin: 0; font-size: 28px;">Newsletter</h1>
			<p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Eltham Green Community Church</p>
		</div>

		<!-- Greeting -->
		<div style="margin-bottom: 30px;">
			<p style="font-size: 16px; color: #333;">Hello {{firstName}},</p>
			<p style="font-size: 16px; color: #333;">Welcome to our newsletter!</p>
		</div>

		<!-- Content Area -->
		<div style="margin-bottom: 30px;">
			<p style="font-size: 16px; color: #333; line-height: 1.8;">
				Add your newsletter content here. You can use placeholders like {{firstName}}, {{name}}, {{email}}, etc.
			</p>
		</div>

		<!-- Optional: Upcoming Events Section -->
		<div style="margin-bottom: 30px;">
			<h2 style="color: #2d7a32; font-size: 22px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">📅 What's Coming Up</h2>
			{{upcomingEvents}}
		</div>

		<!-- Optional: Rotas Section -->
		<div style="margin-bottom: 30px;">
			<h2 style="color: #2d7a32; font-size: 22px; margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">👥 Your Rotas</h2>
			{{rotaLinks}}
		</div>

		<!-- Footer -->
		<div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #666; font-size: 14px;">
			<p style="margin: 0 0 10px 0;">Blessings,</p>
			<p style="margin: 0; font-weight: bold;">Eltham Green Community Church</p>
			<p style="margin: 10px 0 0 0;">542 Westhorne Avenue, Eltham, London, SE9 6RR</p>
		</div>
	</div>
</body>
</html>`;

const basicTemplateText = `NEWSLETTER
Eltham Green Community Church

Hello {{firstName}},

Welcome to our newsletter!

Add your newsletter content here. You can use placeholders like {{firstName}}, {{name}}, {{email}}, etc.

WHAT'S COMING UP
{{upcomingEvents}}

YOUR ROTAS
{{rotaLinks}}

Blessings,
Eltham Green Community Church
542 Westhorne Avenue, Eltham, London, SE9 6RR`;

async function createTemplate() {
	try {
		const templateData = {
			name: 'Basic Newsletter Template',
			subject: 'Newsletter - Eltham Green Community Church',
			htmlContent: basicTemplateHtml,
			textContent: basicTemplateText,
			description: 'A basic newsletter template with placeholders for personalization, events, and rotas'
		};

		const validated = validateNewsletterTemplate(templateData);
		const template = await create('newsletter_templates', validated);

		console.log('✅ Newsletter template created successfully!');
		console.log(`   Template ID: ${template.id}`);
		console.log(`   Template Name: ${template.name}`);
		console.log(`   View at: /hub/newsletters/templates/${template.id}`);
	} catch (error) {
		console.error('❌ Error creating template:', error.message);
		process.exit(1);
	}
}

createTemplate();


