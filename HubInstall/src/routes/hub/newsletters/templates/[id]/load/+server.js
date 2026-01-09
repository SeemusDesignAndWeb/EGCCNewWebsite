import { json } from '@sveltejs/kit';
import { findById } from '$lib/crm/server/fileStore.js';

export async function GET({ params }) {
	const template = await findById('newsletter_templates', params.id);
	if (!template) {
		return json({ error: 'Template not found' }, { status: 404 });
	}
	return json(template);
}

