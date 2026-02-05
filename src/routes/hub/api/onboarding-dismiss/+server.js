import { json } from '@sveltejs/kit';
import { getCurrentOrganisationId } from '$lib/crm/server/settings.js';
import { update } from '$lib/crm/server/fileStore.js';

/** POST: mark onboarding as dismissed for the current organisation. */
export async function POST() {
	const organisationId = await getCurrentOrganisationId();
	if (!organisationId) {
		return json({ ok: false, error: 'No organisation context' }, { status: 400 });
	}
	await update('organisations', organisationId, {
		onboardingDismissedAt: new Date().toISOString()
	});
	return json({ ok: true });
}
