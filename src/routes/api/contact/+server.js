import { json } from '@sveltejs/kit';
import { getContactInfo } from '$lib/server/database';
import { sendContactEmail, sendConfirmationEmail } from '$lib/server/resend';
import { env } from '$env/dynamic/private';

export const POST = async ({ request }) => {
	try {
		const { name, email, phone, message } = await request.json();

		// Validation
		if (!name || !email || !message) {
			return json({ error: 'Name, email, and message are required' }, { status: 400 });
		}

		const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailPattern.test(email)) {
			return json({ error: 'Invalid email address' }, { status: 400 });
		}

		// Get contact email from database
		const contactInfo = getContactInfo();
		const recipientEmail = contactInfo.email || 'enquiries@egcc.co.uk';

		// Get sender email from environment or use default Resend domain
		// IMPORTANT: If using a custom domain email, the domain must be verified in Resend
		// For testing/development, use 'onboarding@resend.dev' which works without verification
		// For production, verify your domain in Resend Dashboard first
		let senderEmail = env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
		
		// If using a custom domain that might not be verified, fall back to onboarding@resend.dev
		// This ensures emails can still be sent during development/testing
		if (senderEmail !== 'onboarding@resend.dev' && !senderEmail.includes('resend.dev')) {
			console.warn(`Using custom sender email: ${senderEmail}. Make sure this domain is verified in Resend.`);
			console.warn('If emails fail, the domain may not be verified. Consider using onboarding@resend.dev for testing.');
		}
		
		// Log email configuration (without sensitive data)
		console.log('Email configuration:', {
			recipientEmail,
			senderEmail,
			hasApiKey: !!env.RESEND_API_KEY,
			apiKeyLength: env.RESEND_API_KEY ? env.RESEND_API_KEY.length : 0
		});

		// Send email to church
		try {
			await sendContactEmail({
				to: recipientEmail,
				from: senderEmail,
				name,
				email,
				phone,
				message,
				replyTo: email
			});

			// Send confirmation email to the submitter
			try {
				await sendConfirmationEmail({
					to: email,
					from: senderEmail,
					name
				});
			} catch (confirmationError) {
				// Log but don't fail the request if confirmation email fails
				console.error('Failed to send confirmation email:', confirmationError);
			}

			return json({
				success: true,
				message: 'Thank you for your message. We will get back to you soon!'
			});
		} catch (emailError) {
			console.error('Email sending error:', emailError);
			console.error('Error details:', {
				message: emailError.message,
				name: emailError.name,
				stack: emailError.stack,
				response: emailError.response || emailError.body
			});
			return json(
				{
					error: 'Failed to send email. Please try again or contact us directly.',
					details: process.env.NODE_ENV === 'development' ? emailError.message : undefined
				},
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error('Contact form error:', error);
		return json({ error: 'Failed to send message. Please try again.' }, { status: 500 });
	}
};
