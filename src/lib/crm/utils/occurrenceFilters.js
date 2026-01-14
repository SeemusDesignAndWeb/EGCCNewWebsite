/**
 * Determine if an occurrence is today or in the future (local time, date-only).
 * @param {{ startsAt: string }} occ
 * @param {Date} [now] - Optional reference time (defaults to current time)
 * @returns {boolean}
 */
export function isUpcomingOccurrence(occ, now = new Date()) {
	if (!occ || !occ.startsAt) return false;

	const occDate = new Date(occ.startsAt);
	if (Number.isNaN(occDate.getTime())) return false;

	// Normalize both to start-of-day (local) to ignore time-of-day differences
	const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	return occDate >= todayStart;
}

/**
 * Filter a list of occurrences to only those that are today or future.
 * @param {Array<{ startsAt: string }>} occurrences
 * @param {Date} [now]
 * @returns {Array}
 */
export function filterUpcomingOccurrences(occurrences = [], now = new Date()) {
	return occurrences.filter(occ => isUpcomingOccurrence(occ, now));
}
