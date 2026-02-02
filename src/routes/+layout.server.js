import { getEvents, getSettings } from '$lib/server/database';
import { getSettings as getHubSettings } from '$lib/crm/server/settings.js';

export const load = async () => {
	const allEvents = getEvents();
	const settings = getSettings();
	const hubSettings = await getHubSettings();
	
	// Get highlighted event (for banner)
	const highlightedEvents = allEvents.filter(e => e.highlighted && e.published);
	
	const highlightedEvent = highlightedEvents
		.sort((a, b) => {
			const dateA = new Date(a.date || '9999-12-31');
			const dateB = new Date(b.date || '9999-12-31');
			return dateA.getTime() - dateB.getTime();
		})[0] || null;
	
	return {
		highlightedEvent,
		settings,
		theme: hubSettings.theme || null
	};
};












