import { getCsrfToken } from '$lib/crm/server/auth.js';
import { getSettings, getCurrentOrganisationId } from '$lib/crm/server/settings.js';
import { readCollection } from '$lib/crm/server/fileStore.js';

export async function load({ cookies, locals }) {
	const csrfToken = getCsrfToken(cookies);
	const settings = await getSettings();
	const organisationId = await getCurrentOrganisationId();
	const orgs = await readCollection('organisations');
	const org = organisationId ? orgs.find((o) => o.id === organisationId) || null : null;
	let showOnboarding = false;
	if (organisationId && locals.admin && org) {
		showOnboarding = !org.onboardingDismissedAt;
	}
	// MultiOrg: org's allowed areas (null = no restriction, [] = none)
	const organisationAreaPermissions = org && Array.isArray(org.areaPermissions) ? org.areaPermissions : null;
	return {
		csrfToken,
		admin: locals.admin || null,
		theme: settings?.theme || null,
		superAdminEmail: locals.superAdminEmail || null,
		hubOrganisationFromDomain: locals.hubOrganisationFromDomain || null,
		showOnboarding: !!showOnboarding,
		organisationId: organisationId || null,
		organisationAreaPermissions
	};
}

