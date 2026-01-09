/**
 * Generate occurrences based on recurrence pattern
 * @param {object} options - Recurrence options
 * @param {string} options.repeatType - 'daily', 'weekly', 'monthly', 'yearly', 'none'
 * @param {number} options.repeatInterval - Interval (e.g., every 2 weeks)
 * @param {Date} options.startDate - First occurrence start date
 * @param {Date} options.endDate - First occurrence end date
 * @param {string} options.repeatEndType - 'never', 'date', 'count'
 * @param {Date} options.repeatEndDate - End date for recurrence
 * @param {number} options.repeatCount - Number of occurrences
 * @param {number} options.repeatDayOfMonth - Day of month (1-31) for monthly
 * @param {string} options.repeatDayOfWeek - Day of week for weekly/monthly
 * @param {string} options.repeatWeekOfMonth - 'first', 'second', 'third', 'fourth', 'last' for monthly
 * @param {string} options.location - Location for occurrences
 * @returns {Array} Array of occurrence objects
 */
export function generateOccurrences(options) {
	const {
		repeatType = 'none',
		repeatInterval = 1,
		startDate,
		endDate,
		repeatEndType = 'never',
		repeatEndDate = null,
		repeatCount = null,
		repeatDayOfMonth = null,
		repeatDayOfWeek = null,
		repeatWeekOfMonth = null,
		location = null
	} = options;

	if (!startDate || !endDate) {
		return [];
	}

	if (repeatType === 'none') {
		// Single occurrence
		return [{
			startsAt: startDate.toISOString(),
			endsAt: endDate.toISOString(),
			location
		}];
	}

	const occurrences = [];
	const start = new Date(startDate);
	const end = new Date(endDate);
	const duration = end - start; // Duration in milliseconds

	let currentDate = new Date(start);
	let count = 0;
	const maxDate = repeatEndType === 'date' && repeatEndDate 
		? new Date(repeatEndDate)
		: null;
	const maxCount = repeatEndType === 'count' && repeatCount 
		? repeatCount 
		: null;

	// Helper to check if we should stop
	function shouldStop() {
		if (maxCount && count >= maxCount) return true;
		if (maxDate && currentDate > maxDate) return true;
		return false;
	}

	// Helper to get next date based on repeat type
	function getNextDate(date) {
		const next = new Date(date);
		
		switch (repeatType) {
			case 'daily':
				next.setDate(next.getDate() + repeatInterval);
				break;
			
			case 'weekly':
				if (repeatDayOfWeek) {
					// Find next occurrence of specific day
					const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
					const targetDay = daysOfWeek.indexOf(repeatDayOfWeek.toLowerCase());
					if (targetDay === -1) {
						// Fallback to interval
						next.setDate(next.getDate() + (7 * repeatInterval));
					} else {
						let daysToAdd = (targetDay - next.getDay() + 7) % 7;
						if (daysToAdd === 0) {
							// Same day, move to next interval
							daysToAdd = 7 * repeatInterval;
						}
						next.setDate(next.getDate() + daysToAdd);
					}
				} else {
					next.setDate(next.getDate() + (7 * repeatInterval));
				}
				break;
			
			case 'monthly':
				if (repeatWeekOfMonth && repeatDayOfWeek) {
					// First Monday, last Friday, etc.
					next.setMonth(next.getMonth() + repeatInterval);
					const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
					const targetDay = daysOfWeek.indexOf(repeatDayOfWeek.toLowerCase());
					
					if (repeatWeekOfMonth === 'last') {
						// Last occurrence of day in month
						next.setMonth(next.getMonth() + 1, 0); // Last day of month
						while (next.getDay() !== targetDay) {
							next.setDate(next.getDate() - 1);
						}
					} else {
						// First, second, third, fourth
						next.setDate(1); // Start of month
						while (next.getDay() !== targetDay) {
							next.setDate(next.getDate() + 1);
						}
						const weekNum = ['first', 'second', 'third', 'fourth'].indexOf(repeatWeekOfMonth.toLowerCase());
						if (weekNum >= 0) {
							next.setDate(next.getDate() + (weekNum * 7));
						}
					}
				} else if (repeatDayOfMonth) {
					// Specific day of month (e.g., 15th)
					next.setMonth(next.getMonth() + repeatInterval);
					// Handle months with fewer days (e.g., Feb 30 -> Feb 28/29)
					const lastDayOfMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
					next.setDate(Math.min(repeatDayOfMonth, lastDayOfMonth));
				} else {
					// Same day of month
					next.setMonth(next.getMonth() + repeatInterval);
				}
				break;
			
			case 'yearly':
				next.setFullYear(next.getFullYear() + repeatInterval);
				break;
			
			default:
				return null;
		}
		
		return next;
	}

	// Generate first occurrence
	occurrences.push({
		startsAt: new Date(currentDate).toISOString(),
		endsAt: new Date(currentDate.getTime() + duration).toISOString(),
		location
	});
	count++;

	// Generate subsequent occurrences
	while (!shouldStop()) {
		const nextDate = getNextDate(currentDate);
		if (!nextDate) break;
		
		currentDate = nextDate;
		
		if (shouldStop()) break;
		
		occurrences.push({
			startsAt: new Date(currentDate).toISOString(),
			endsAt: new Date(currentDate.getTime() + duration).toISOString(),
			location
		});
		count++;
		
		// Safety limit
		if (count > 1000) break;
	}

	return occurrences;
}

