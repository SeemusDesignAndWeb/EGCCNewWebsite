import { json } from '@sveltejs/kit';
import { create } from '$lib/crm/server/fileStore.js';
import { getAdminFromCookies } from '$lib/crm/server/auth.js';

export async function POST({ request, cookies }) {
	const admin = await getAdminFromCookies(cookies);
	if (!admin) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();
		const { name, email, type, message } = data;

		if (!name || !email || !type || !message) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		const helpRequest = {
			name,
			email,
			type,
			message,
			status: 'open',
			submittedBy: admin.id,
			createdAt: new Date().toISOString()
		};

		const result = await create('help_requests', helpRequest);

		return json({ success: true, request: result });
	} catch (err) {
		console.error('Error creating help request:', err);
		return json({ error: 'Failed to create help request' }, { status: 500 });
	}
}
