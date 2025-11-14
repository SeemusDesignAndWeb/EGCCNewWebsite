import { getPage, getContactInfo } from '$lib/server/database';

export const load = async () => {
	const page = getPage('church');
	const contactInfo = getContactInfo();
	if (page) {
		return { page, contactInfo };
	}
	const fallbackPage = {
		id: 'church',
		title: 'About EGCC',
		heroTitle: 'about egcc',
		heroImage: '/images/church-bg.jpg',
		content: '',
		sections: [],
		published: true
	};
	return { page: fallbackPage, contactInfo };
};
