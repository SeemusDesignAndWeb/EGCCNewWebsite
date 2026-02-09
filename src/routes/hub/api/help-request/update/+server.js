import { json } from '@sveltejs/kit';
import { update, findById } from '$lib/crm/server/fileStore.js';
import { getAdminFromCookies } from '$lib/crm/server/auth.js';
import { isSuperAdmin } from '$lib/crm/server/permissions.js';

export async function POST({ request, cookies }) {
	const admin = await getAdminFromCookies(cookies);
	if (!admin || !isSuperAdmin(admin)) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}

	try {
		const data = await request.json();
		const { id, status } = data;

		if (!id || !status) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		const existing = await findById('help_requests', id);
		if (!existing) {
			return json({ error: 'Request not found' }, { status: 404 });
		}

		const updated = await update('help_requests', id, { status });

		return json({ success: true, request: updated });
	} catch (err) {
		console.error('Error updating help request:', err);
		return json({ error: 'Failed to update help request' }, { status: 500 });
	}
}
