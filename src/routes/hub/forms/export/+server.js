import { json } from '@sveltejs/kit';
import { readCollection } from '$lib/crm/server/fileStore.js';
import { getAdminFromCookies } from '$lib/crm/server/auth.js';
import { canAccessSafeguarding, canAccessForms } from '$lib/crm/server/permissions.js';
import { getCurrentOrganisationId, filterByOrganisation } from '$lib/crm/server/orgContext.js';

/**
 * Export all forms structure (without submissions/data)
 * GET /hub/forms/export
 */
export async function GET({ cookies }) {
	const admin = await getAdminFromCookies(cookies);
	if (!admin) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const organisationId = await getCurrentOrganisationId();
	const forms = filterByOrganisation(await readCollection('forms'), organisationId);
	
	// Filter forms based on admin permissions
	const canAccessSafeguardingForms = canAccessSafeguarding(admin);
	const canAccessNonSafeguardingForms = canAccessForms(admin);
	
	const filtered = forms.filter(f => {
		if (f.isSafeguarding || f.requiresEncryption) {
			return canAccessSafeguardingForms;
		}
		return canAccessNonSafeguardingForms;
	});

	// Export only the form structures (no id, createdAt, updatedAt, or submission data)
	const exportData = filtered.map(form => ({
		name: form.name,
		description: form.description || '',
		fields: form.fields || [],
		isSafeguarding: form.isSafeguarding || false,
		meta: form.meta || {}
	}));

	// Return as JSON with appropriate headers for download
	return json(exportData, {
		headers: {
			'Content-Type': 'application/json',
			'Content-Disposition': 'attachment; filename="forms-export.json"'
		}
	});
}
