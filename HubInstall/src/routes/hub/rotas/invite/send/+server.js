import { json, error } from '@sveltejs/kit';
import { findById, readCollection, findMany } from '$lib/crm/server/fileStore.js';
import { ensureRotaTokens } from '$lib/crm/server/tokens.js';
import { sendBulkRotaInvites } from '$lib/crm/server/email.js';
import { verifyCsrfToken } from '$lib/crm/server/auth.js';

export async function POST({ request, cookies, url }) {
	const data = await request.json();
	const csrfToken = data._csrf;

	if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
		throw error(403, 'CSRF token validation failed');
	}

	const { eventId, rotaIds, occurrenceIds, listId } = data;

	if (!eventId || !rotaIds || !Array.isArray(rotaIds) || rotaIds.length === 0 || !listId) {
		throw error(400, 'Invalid request data');
	}

	const list = await findById('lists', listId);
	if (!list) {
		throw error(404, 'List not found');
	}

	const contacts = await readCollection('contacts');
	const listContacts = contacts.filter(c => list.contactIds?.includes(c.id));

	const event = await findById('events', eventId);
	if (!event) {
		throw error(404, 'Event not found');
	}

	const rotas = await readCollection('rotas');
	const selectedRotas = rotas.filter(r => rotaIds.includes(r.id));

	const occurrences = occurrenceIds && occurrenceIds.length > 0
		? await findMany('occurrences', o => occurrenceIds.includes(o.id))
		: [null]; // null means recurring/all occurrences

	// Build rota occurrence combinations
	const rotaOccurrences = [];
	for (const rota of selectedRotas) {
		for (const occurrence of occurrences) {
			rotaOccurrences.push({
				eventId,
				rotaId: rota.id,
				occurrenceId: occurrence?.id || null
			});
		}
	}

	// Ensure tokens exist
	const tokens = await ensureRotaTokens(rotaOccurrences);

	// Build invites
	const invites = [];
	for (const contact of listContacts) {
		for (const tokenData of tokens) {
			const rota = selectedRotas.find(r => r.id === tokenData.rotaId);
			const occurrence = tokenData.occurrenceId
				? occurrences.find(o => o.id === tokenData.occurrenceId)
				: null;

			invites.push({
				to: contact.email,
				name: `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email,
				token: tokenData.token,
				contact: contact, // Pass contact for personalization
				rotaData: {
					rota,
					event,
					occurrence
				}
			});
		}
	}

	// Send invites
	const results = await sendBulkRotaInvites(invites, { url });

	return json({ success: true, results });
}

