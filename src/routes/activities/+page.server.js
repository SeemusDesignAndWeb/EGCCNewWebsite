import { getPage, getContactInfo } from '$lib/server/database';

export const load = async () => {
	const page = getPage('activities');
	const contactInfo = getContactInfo();
	if (page) {
		return { page, contactInfo };
	}
	const fallbackPage = {
		id: 'activities',
		title: 'Activities',
		heroTitle: 'Serving our community',
		heroImage: '/images/activities-bg.jpg',
		content: '',
		sections: [],
		published: true
	};
	return { page: fallbackPage, contactInfo };
};
