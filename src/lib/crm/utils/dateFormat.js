/**
 * Format date in UK format (DD/MM/YYYY)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDateUK(date) {
	if (!date) return '';
	const d = date instanceof Date ? date : new Date(date);
	if (isNaN(d.getTime())) return '';
	return d.toLocaleDateString('en-GB', { 
		day: '2-digit', 
		month: '2-digit', 
		year: 'numeric' 
	});
}

/**
 * Format date and time in UK format (DD/MM/YYYY HH:MM)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date-time string
 */
export function formatDateTimeUK(date) {
	if (!date) return '';
	const d = date instanceof Date ? date : new Date(date);
	if (isNaN(d.getTime())) return '';
	return d.toLocaleDateString('en-GB', { 
		day: '2-digit', 
		month: '2-digit', 
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

/**
 * Format time in UK format (HH:MM)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted time string
 */
export function formatTimeUK(date) {
	if (!date) return '';
	const d = date instanceof Date ? date : new Date(date);
	if (isNaN(d.getTime())) return '';
	return d.toLocaleTimeString('en-GB', { 
		hour: '2-digit',
		minute: '2-digit'
	});
}

/**
 * Format date with month name in UK format (DD Month YYYY)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDateLongUK(date) {
	if (!date) return '';
	const d = date instanceof Date ? date : new Date(date);
	if (isNaN(d.getTime())) return '';
	return d.toLocaleDateString('en-GB', { 
		day: 'numeric', 
		month: 'long', 
		year: 'numeric' 
	});
}

/**
 * Format date with short month in UK format (DD MMM YYYY)
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDateShortUK(date) {
	if (!date) return '';
	const d = date instanceof Date ? date : new Date(date);
	if (isNaN(d.getTime())) return '';
	return d.toLocaleDateString('en-GB', { 
		day: 'numeric', 
		month: 'short', 
		year: 'numeric' 
	});
}

/**
 * Format weekday in UK format
 * @param {Date|string} date - Date to format
 * @returns {string} Weekday name
 */
export function formatWeekdayUK(date) {
	if (!date) return '';
	const d = date instanceof Date ? date : new Date(date);
	if (isNaN(d.getTime())) return '';
	return d.toLocaleDateString('en-GB', { weekday: 'short' });
}

/**
 * Format date for HTML datetime-local input (YYYY-MM-DDTHH:mm) in the user's local timezone.
 * Use this when populating datetime-local from a UTC ISO string so the displayed time matches
 * what the user sees elsewhere (e.g. 10:00 UK, not 10:00 UTC).
 * @param {Date|string} date - Date to format (ISO string or Date)
 * @returns {string} Value for datetime-local input
 */
export function toDateTimeLocalValue(date) {
	if (!date) return '';
	const d = date instanceof Date ? date : new Date(date);
	if (isNaN(d.getTime())) return '';
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	const h = String(d.getHours()).padStart(2, '0');
	const min = String(d.getMinutes()).padStart(2, '0');
	return `${y}-${m}-${day}T${h}:${min}`;
}


