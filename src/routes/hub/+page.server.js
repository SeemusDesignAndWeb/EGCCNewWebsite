import { env } from '$env/dynamic/private';
import { readCollection, getStoreMode } from '$lib/crm/server/fileStore.js';
import * as fileStoreImpl from '$lib/crm/server/fileStoreImpl.js';
import { getCurrentOrganisationId, filterByOrganisation } from '$lib/crm/server/orgContext.js';

/**
 * If store is database but has no data, load from file store (ndjson) for display only.
 * READ-ONLY: must never write to the database or to files. Only fileStoreImpl.readCollection.
 */
async function loadFromFileStoreWhenDatabaseEmpty(storeMode, dbCollections) {
	const hasNoData = dbCollections.every((arr) => !Array.isArray(arr) || arr.length === 0);
	if (storeMode !== 'database' || !hasNoData) return null;

	const collections = ['contacts', 'lists', 'emails', 'events', 'rotas', 'forms', 'email_stats', 'organisations'];
	const fromFile = {};
	for (const name of collections) {
		try {
			const records = await fileStoreImpl.readCollection(name);
			if (records.length > 0) fromFile[name] = records;
		} catch {
			// ignore missing or invalid file
		}
	}
	return Object.keys(fromFile).length > 0 ? fromFile : null;
}

export async function load({ locals }) {
	const emailModuleEnabled = !!(env.MAILGUN_API_KEY && env.MAILGUN_DOMAIN);
	const organisationId = await getCurrentOrganisationId();
	const storeMode = await getStoreMode();

	let [contactsRaw, listsRaw, emailsRaw, eventsRaw, rotasRaw, formsRaw, emailStatsRaw] = await Promise.all([
		readCollection('contacts'),
		readCollection('lists'),
		readCollection('emails'),
		readCollection('events'),
		readCollection('rotas'),
		readCollection('forms'),
		readCollection('email_stats')
	]);

	// If database is empty, show what's in file store (display only; never overwrite DB or files)
	const fileData = await loadFromFileStoreWhenDatabaseEmpty(storeMode, [
		contactsRaw,
		listsRaw,
		emailsRaw,
		eventsRaw,
		rotasRaw,
		formsRaw
	]);
	if (fileData) {
		// Use file data in memory only for this response; no writeCollection, no file writes
		contactsRaw = fileData.contacts ?? contactsRaw;
		listsRaw = fileData.lists ?? listsRaw;
		emailsRaw = fileData.emails ?? emailsRaw;
		eventsRaw = fileData.events ?? eventsRaw;
		rotasRaw = fileData.rotas ?? rotasRaw;
		formsRaw = fileData.forms ?? formsRaw;
		if (fileData.email_stats?.length) emailStatsRaw = fileData.email_stats;
	}

	const contacts = organisationId ? filterByOrganisation(contactsRaw, organisationId) : contactsRaw;
	const lists = organisationId ? filterByOrganisation(listsRaw, organisationId) : listsRaw;
	const emails = organisationId ? filterByOrganisation(emailsRaw, organisationId) : emailsRaw;
	const events = organisationId ? filterByOrganisation(eventsRaw, organisationId) : eventsRaw;
	const rotas = organisationId ? filterByOrganisation(rotasRaw, organisationId) : rotasRaw;
	const forms = organisationId ? filterByOrganisation(formsRaw, organisationId) : formsRaw;
	const emailStats = organisationId ? filterByOrganisation(emailStatsRaw, organisationId) : emailStatsRaw;

	// Filter out any null/undefined entries from collections (e.g. malformed data on Railway)
	const validEmails = emails.filter(Boolean);
	const validRotas = rotas.filter(Boolean);
	const validEvents = events.filter(Boolean);

	// Get latest 3 emails (sorted by updatedAt or createdAt, most recent first)
	const latestNewsletters = [...validEmails]
		.sort((a, b) => {
			const dateA = new Date(a.updatedAt || a.createdAt || 0);
			const dateB = new Date(b.updatedAt || b.createdAt || 0);
			return dateB - dateA;
		})
		.slice(0, 3);

	// Get latest 5 rotas (sorted by updatedAt or createdAt, most recent first)
	const latestRotas = [...validRotas]
		.sort((a, b) => {
			const dateA = new Date(a.updatedAt || a.createdAt || 0);
			const dateB = new Date(b.updatedAt || b.createdAt || 0);
			return dateB - dateA;
		})
		.slice(0, 5);

	// Get latest 5 events (sorted by updatedAt or createdAt, most recent first)
	const latestEvents = [...validEvents]
		.sort((a, b) => {
			const dateA = new Date(a.updatedAt || a.createdAt || 0);
			const dateB = new Date(b.updatedAt || b.createdAt || 0);
			return dateB - dateA;
		})
		.slice(0, 5);

	// Enrich rotas with event titles
	const eventsMap = new Map(validEvents.map(e => [e.id, e]));
	const enrichedRotas = latestRotas.map(rota => ({
		...rota,
		eventTitle: eventsMap.get(rota.eventId)?.title || 'Unknown Event'
	}));

	// Calculate emails sent today
	const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
	const todayStat = emailStats.find(s => s.date === today);
	const emailsSentToday = todayStat?.count || 0;

	// Build organisation ID + contact count for all records (for dashboard footer / debugging)
	const orgContactCount = new Map();
	for (const c of contactsRaw) {
		const oid = c?.organisationId ?? null;
		if (oid) {
			orgContactCount.set(oid, (orgContactCount.get(oid) || 0) + 1);
		}
	}
	const organisations = fileData?.organisations?.length
		? fileData.organisations
		: await readCollection('organisations');
	const orgById = new Map((organisations || []).map((o) => [o.id, o]));
	const organisationIdsWithData = Array.from(orgContactCount.entries())
		.map(([organisationId, contactCount]) => ({
			organisationId,
			contactCount,
			name: orgById.get(organisationId)?.name ?? null
		}))
		.sort((a, b) => b.contactCount - a.contactCount);

	return {
		admin: locals.admin || null,
		emailModuleEnabled,
		stats: {
			contacts: contacts.length,
			lists: lists.length,
			newsletters: emails.length,
			events: events.length,
			rotas: rotas.length,
			forms: forms.length,
			emailsSentToday
		},
		latestNewsletters,
		latestRotas: enrichedRotas,
		latestEvents,
		organisationIdsWithData,
		storeMode,
		currentOrganisationId: organisationId ?? null,
		totalContactsInStore: contactsRaw.length,
		dataFromFileStore: !!fileData
	};
}

