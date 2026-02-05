import { error } from '@sveltejs/kit';
import { getAdminFromCookies } from '$lib/crm/server/auth.js';
import { isSuperAdmin } from '$lib/crm/server/permissions.js';
import { getSettings, getCurrentOrganisationId } from '$lib/crm/server/settings.js';
import { readCollection, writeCollection, getStoreMode, findById } from '$lib/crm/server/fileStore.js';
import { filterByOrganisation } from '$lib/crm/server/orgContext.js';
import { ORG_SCOPED_COLLECTIONS } from '$lib/crm/server/collections.js';

export const actions = {
	/** Assign all records with null organisationId to the current Hub organisation (so existing data shows for that org). */
	assignUnassignedData: async ({ cookies }) => {
		const admin = await getAdminFromCookies(cookies);
		if (!admin || !isSuperAdmin(admin)) {
			return { assignUnassignedData: { error: 'Unauthorized' } };
		}
		const organisationId = await getCurrentOrganisationId();
		if (!organisationId) {
			return { assignUnassignedData: { error: 'No organisation selected. Set one in Multi-org → Organisations → Set as Hub.' } };
		}
		const now = new Date().toISOString();
		let totalAssigned = 0;
		const byCollection = {};
		for (const collection of ORG_SCOPED_COLLECTIONS) {
			let records;
			try {
				records = await readCollection(collection);
			} catch {
				continue;
			}
			const needsUpdate = records.filter((r) => r.organisationId == null);
			if (needsUpdate.length === 0) continue;
			const updated = records.map((r) => {
				if (r.organisationId == null) {
					return { ...r, organisationId, updatedAt: r.updatedAt || now };
				}
				return r;
			});
			await writeCollection(collection, updated);
			totalAssigned += needsUpdate.length;
			byCollection[collection] = needsUpdate.length;
		}
		return {
			assignUnassignedData: {
				success: true,
				totalAssigned,
				organisationId,
				byCollection
			}
		};
	}
};

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

	// Diagnostic: count contacts in DB for current org (proves DB is queried by organisationId)
	let contactsCountForCurrentOrg = null;
	if (currentOrganisationId) {
		const allContacts = await readCollection('contacts');
		const scoped = filterByOrganisation(allContacts, currentOrganisationId);
		contactsCountForCurrentOrg = scoped.length;
	}

	// Get unique rota roles for current org (for meeting planner defaults)
	const rotas = await readCollection('rotas');
	const rotasForOrg = currentOrganisationId ? filterByOrganisation(rotas, currentOrganisationId) : rotas;
	const uniqueRoles = [...new Set(rotasForOrg.map((r) => r.role))].sort();

	return {
		admin,
		settings,
		availableRoles: uniqueRoles,
		storeMode,
		currentOrganisationId,
		currentOrganisation,
		contactsCountForCurrentOrg
	};
}
