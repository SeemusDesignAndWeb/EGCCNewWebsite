import { json } from '@sveltejs/kit';
import { findById } from '$lib/crm/server/fileStore.js';
import { getAdminFromCookies } from '$lib/crm/server/auth.js';
import { canAccessSafeguarding, canAccessForms } from '$lib/crm/server/permissions.js';

/**
 * Export a single form structure (without submissions/data)
 * GET /hub/forms/[id]/export
 */
export async function GET({ params, cookies }) {
	const admin = await getAdminFromCookies(cookies);
	if (!admin) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const form = await findById('forms', params.id);
	if (!form) {
		return json({ error: 'Form not found' }, { status: 404 });
	}

	// Check permissions
	if (form.isSafeguarding || form.requiresEncryption) {
		if (!canAccessSafeguarding(admin)) {
			return json({ error: 'Access denied' }, { status: 403 });
		}
	} else {
		if (!canAccessForms(admin)) {
			return json({ error: 'Access denied' }, { status: 403 });
		}
	}

	// Export only the form structure (no id, createdAt, updatedAt, or submission data)
	const exportData = {
		name: form.name,
		description: form.description || '',
		fields: form.fields || [],
		isSafeguarding: form.isSafeguarding || false,
		meta: form.meta || {}
	};

	// Return as JSON with appropriate headers for download
	return json(exportData, {
		headers: {
			'Content-Type': 'application/json',
			'Content-Disposition': `attachment; filename="form-${form.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json"`
		}
	});
}
