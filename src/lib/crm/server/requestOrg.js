/**
 * Request-scoped organisation ID for Hub.
 * When the request is for a custom hub domain (e.g. hub.egcc.co.uk), we bind the
 * org to that domain and run the rest of the request in this context so
 * getCurrentOrganisationId() returns the domain's org without trusting client input.
 */

import { AsyncLocalStorage } from 'async_hooks';

export const hubRequestOrg = new AsyncLocalStorage();

/**
 * Run a handler with the given organisation ID as the current request org.
 * Used in the hook when Host matches an organisation's hubDomain.
 * @param {string} organisationId
 * @param {() => Promise<Response>} fn
 * @returns {Promise<Response>}
 */
export function runWithOrganisation(organisationId, fn) {
	return hubRequestOrg.run({ organisationId }, fn);
}

/**
 * Get the request-scoped organisation ID if set (from custom domain).
 * @returns {string | undefined}
 */
export function getRequestOrganisationId() {
	const store = hubRequestOrg.getStore();
	return store?.organisationId;
}
