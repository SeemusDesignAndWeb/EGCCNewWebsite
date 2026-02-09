import { error } from '@sveltejs/kit';
import { getAdminFromCookies } from '$lib/crm/server/auth.js';
import { isSuperAdmin } from '$lib/crm/server/permissions.js';
import { getSettings, getCurrentOrganisationId } from '$lib/crm/server/settings.js';
import { readCollection, getStoreMode, findById } from '$lib/crm/server/fileStore.js';
import { filterByOrganisation } from '$lib/crm/server/orgContext.js';

export async function load({ cookies }) {
	const admin = await getAdminFromCookies(cookies);

	if (!admin) {
		throw error(401, 'Unauthorized');
	}

	if (!isSuperAdmin(admin)) {
		throw error(403, 'Forbidden: Superadmin access required');
	}

	const settings = await getSettings();
	const storeMode = await getStoreMode();

	// Organisation context (for Multi-org): show current org so super admin can verify Hub recognises it
	const currentOrganisationId = await getCurrentOrganisationId();
	const currentOrganisation = currentOrganisationId
		? await findById('organisations', currentOrganisationId)
		: null;

	// Get unique rota roles for current org (for meeting planner defaults)
	const rotas = await readCollection('rotas');
	const rotasForOrg = currentOrganisationId ? filterByOrganisation(rotas, currentOrganisationId) : rotas;
	const uniqueRoles = [...new Set(rotasForOrg.map((r) => r.role))].sort();

	// Events for current org (for Sunday planner event setting) – unique by id so dropdown has no duplicates
	const allEvents = await readCollection('events');
	const eventsForOrg = currentOrganisationId ? filterByOrganisation(allEvents, currentOrganisationId) : allEvents;
	const eventsSorted = [...new Map(eventsForOrg.map((e) => [e.id, e])).values()].sort((a, b) =>
		(a.title || '').localeCompare(b.title || '')
	);

	const helpRequests = await readCollection('help_requests');

	return {
		admin,
		settings,
		availableRoles: uniqueRoles,
		events: eventsSorted,
		storeMode,
		currentOrganisationId,
		currentOrganisation,
		helpRequests: helpRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
	};
}
