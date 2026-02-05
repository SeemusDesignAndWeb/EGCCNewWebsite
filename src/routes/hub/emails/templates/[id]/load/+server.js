import { json } from '@sveltejs/kit';
import { findById } from '$lib/crm/server/fileStore.js';
import { getCurrentOrganisationId } from '$lib/crm/server/orgContext.js';

export async function GET({ params }) {
	const organisationId = await getCurrentOrganisationId();
	const template = await findById('email_templates', params.id);
	if (!template) {
		return json({ error: 'Template not found' }, { status: 404 });
	}
	if (template.organisationId != null && template.organisationId !== organisationId) {
		return json({ error: 'Template not found' }, { status: 404 });
	}
	return json(template);
}

