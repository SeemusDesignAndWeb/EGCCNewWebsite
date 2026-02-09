import { json } from '@sveltejs/kit';
import { findById } from '$lib/crm/server/fileStore.js';
import { getAdminFromCookies } from '$lib/crm/server/auth.js';
import { isSuperAdmin } from '$lib/crm/server/permissions.js';
import { sendHelpRequestReply } from '$lib/crm/server/email.js';

export async function POST({ request, cookies }) {
	const admin = await getAdminFromCookies(cookies);
	if (!admin || !isSuperAdmin(admin)) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	try {
		const data = await request.json();
		const { id, message } = data;

		if (!id || message == null || String(message).trim() === '') {
			return json({ error: 'Missing required fields: id and message' }, { status: 400 });
		}

		const req = await findById('help_requests', id);
		if (!req) {
			return json({ error: 'Request not found' }, { status: 404 });
		}

		const subject = `Re: ${req.type || 'Help'} - EGCC Hub`;
		await sendHelpRequestReply({
			toEmail: req.email,
			toName: req.name,
			fromName: admin.name || 'EGCC Hub',
			fromEmail: admin.email,
			subject,
			message: String(message).trim()
		});

		return json({ success: true });
	} catch (err) {
		console.error('Error sending help request reply:', err);
		return json({ error: err?.message || 'Failed to send reply' }, { status: 500 });
	}
}
