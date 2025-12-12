import { getPage, getContactInfo, getEvents } from '$lib/server/database';

export const load = async () => {
	const page = getPage('events');
	const contactInfo = getContactInfo();
	
	// Get all published events, sorted by date (upcoming first)
	const allEvents = getEvents()
		.filter(e => e.published)
		.sort((a, b) => {
			const dateA = new Date(a.date || '9999-12-31');
			const dateB = new Date(b.date || '9999-12-31');
			return dateA.getTime() - dateB.getTime();
		});
	
	if (page) {
		return { page, contactInfo, events: allEvents };
	}
	
	const fallbackPage = {
		id: 'events',
		title: 'Events',
		heroTitle: 'Upcoming Events',
		heroImage: '/images/events-bg.jpg',
		content: '',
		sections: [],
		published: true
	};
	return { page: fallbackPage, contactInfo, events: allEvents };
};

