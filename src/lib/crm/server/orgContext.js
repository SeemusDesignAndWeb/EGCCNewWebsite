/**
 * Hub organisation context. All Hub content is scoped by current organisation ID.
 * Use getCurrentOrganisationId() and filter/set organisationId when reading/creating.
 */

import { getCurrentOrganisationId } from './settings.js';
import { ORG_SCOPED_COLLECTIONS } from './collections.js';

export { getCurrentOrganisationId } from './settings.js';

/**
 * Filter records to current organisation. Includes rows with matching organisationId
 * and rows with no organisationId (unassigned/legacy), so they show under the current org.
 * @param {Array<{ organisationId?: string | null }>} records
 * @param {string | null} organisationId - Current Hub organisation ID
 * @returns {Array}
 */
export function filterByOrganisation(records, organisationId) {
	if (!organisationId || !Array.isArray(records)) return records;
	return records.filter(
		(r) => r.organisationId === organisationId || r.organisationId == null || r.organisationId === ''
	);
}

/**
 * Check if a collection is org-scoped.
 * @param {string} collection
 * @returns {boolean}
 */
export function isOrgScopedCollection(collection) {
	return ORG_SCOPED_COLLECTIONS.includes(collection);
}

/**
 * Add organisationId to data for create. Use when creating a row in an org-scoped collection.
 * @param {object} data - Row data for create
 * @param {string | null} organisationId - Current Hub organisation ID
 * @returns {object} data with organisationId set
 */
export function withOrganisationId(data, organisationId) {
	if (!organisationId) return data;
	return { ...data, organisationId };
}
