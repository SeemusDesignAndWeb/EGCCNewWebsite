/**
 * Mailgun email client – single send helper used by contact form and CRM.
 * Replaces Resend. Requires MAILGUN_API_KEY, MAILGUN_DOMAIN, and optionally MAILGUN_FROM_EMAIL.
 */

import FormData from 'form-data';
import Mailgun from 'mailgun.js';
import { env } from '$env/dynamic/private';

let mgClient = null;

function getClient() {
	if (mgClient) return mgClient;
	const key = env.MAILGUN_API_KEY;
	const domain = env.MAILGUN_DOMAIN;
	if (!key || !domain) {
		throw new Error('Mailgun is not configured: set MAILGUN_API_KEY and MAILGUN_DOMAIN in your environment.');
	}
	const mailgun = new Mailgun(FormData);
	const options = {
		username: 'api',
		key
	};
	if (env.MAILGUN_EU === 'true' || env.MAILGUN_EU === '1') {
		options.url = 'https://api.eu.mailgun.net';
	}
	mgClient = mailgun.client(options);
	return mgClient;
}

/**
 * Send a single email via Mailgun. Returns a Resend-compatible shape { data: { id } } for callers that expect it.
 * @param {object} opts
 * @param {string} opts.from - Sender (e.g. "Name <email@domain>" or "email@domain")
 * @param {string|string[]} opts.to - Recipient(s)
 * @param {string} opts.subject
 * @param {string} [opts.html]
 * @param {string} [opts.text]
 * @param {string} [opts.replyTo]
 * @returns {Promise<{ data: { id: string } }>}
 */
export async function sendEmail({ from, to, subject, html, text, replyTo }) {
	const domain = env.MAILGUN_DOMAIN;
	if (!domain) throw new Error('MAILGUN_DOMAIN is not set.');
	const client = getClient();
	const toArr = Array.isArray(to) ? to : [to];
	const payload = {
		from,
		to: toArr,
		subject,
		...(text && { text }),
		...(html && { html }),
		...(replyTo && { 'h:Reply-To': replyTo })
	};
	const response = await client.messages.create(domain, payload);
	// Resend-compatible shape so existing code using result.data?.id still works
	return { data: { id: response?.id ?? response?.message ?? null } };
}

export { getClient };
