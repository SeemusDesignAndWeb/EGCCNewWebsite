/**
 * Hub domain resolution: map request Host to organisation.
 * Used so each organisation can have its own login URL (e.g. hub.egcc.co.uk).
 *
 * Security:
 * - Organisation is derived ONLY from the request Host, matched against
 *   organisation.hubDomain (server-side allowlist). We never trust query params
 *   or cookies to choose organisation when on a custom domain.
 * - When Host matches a hubDomain, that org is fixed for the request; no override.
 */

import { readCollection } from './fileStore.js';

/** Normalise host for comparison: lowercase, strip port. */
export function normaliseHost(host) {
	if (!host || typeof host !== 'string') return '';
	return host.toLowerCase().trim().split(':')[0];
}

/** Valid hostname: letters, digits, hyphens, dots; not too long. */
const HOSTNAME_REGEX = /^[a-z0-9]([a-z0-9.-]{0,251}[a-z0-9])?$/i;

export function isValidHubDomain(value) {
	if (!value || typeof value !== 'string') return false;
	const n = value.toLowerCase().trim();
	if (n.length > 253) return false;
	return HOSTNAME_REGEX.test(n);
}

let orgsCache = null;
let orgsCacheTime = 0;
const CACHE_TTL_MS = 30 * 1000; // 30 seconds

async function getOrganisationsWithHubDomain() {
	const now = Date.now();
	if (orgsCache && (now - orgsCacheTime) < CACHE_TTL_MS) {
		return orgsCache;
	}
	const orgs = await readCollection('organisations');
	orgsCache = orgs;
	orgsCacheTime = now;
	return orgs;
}

/**
 * Resolve organisation id from request host.
 * @param {string} host - Request Host header (e.g. "hub.egcc.co.uk" or "localhost:5173")
 * @returns {Promise<{ id: string, name: string } | null>} Organisation or null if no match
 */
export async function resolveOrganisationFromHost(host) {
	const normalised = normaliseHost(host);
	if (!normalised) return null;

	const orgs = await getOrganisationsWithHubDomain();
	for (const org of orgs) {
		const domain = org.hubDomain && normaliseHost(String(org.hubDomain).trim());
		if (domain && domain === normalised) {
			return { id: org.id, name: org.name || 'Hub' };
		}
	}
	return null;
}

/**
 * Invalidate cache (e.g. after organisation hubDomain is updated).
 */
export function invalidateHubDomainCache() {
	orgsCache = null;
	orgsCacheTime = 0;
}
