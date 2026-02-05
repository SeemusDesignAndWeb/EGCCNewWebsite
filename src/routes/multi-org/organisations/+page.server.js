import { redirect } from '@sveltejs/kit';
import { readCollection } from '$lib/crm/server/fileStore.js';
import { setCurrentOrganisationId, getCurrentOrganisationId } from '$lib/crm/server/settings.js';
import { getMultiOrgPublicPath } from '$lib/crm/server/hubDomain.js';

export async function load({ locals }) {
	const multiOrgAdmin = locals.multiOrgAdmin;
	if (!multiOrgAdmin) {
		return { organisations: [], multiOrgAdmin: null, currentHubOrganisationId: null };
	}
	const organisations = await readCollection('organisations');
	organisations.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
	const currentHubOrganisationId = await getCurrentOrganisationId();
	return {
		organisations,
		multiOrgAdmin,
		currentHubOrganisationId
	};
}

export const actions = {
	setAsHub: async ({ request, locals }) => {
		if (!locals.multiOrgAdmin) {
			return { error: 'Not authorised' };
		}
		const form = await request.formData();
		const organisationId = form.get('organisationId')?.toString()?.trim();
		if (!organisationId) {
			return { error: 'Organisation ID required' };
		}
		await setCurrentOrganisationId(organisationId);
		throw redirect(302, getMultiOrgPublicPath('/multi-org/organisations?hub_set=1', !!locals.multiOrgAdminDomain));
	}
};
