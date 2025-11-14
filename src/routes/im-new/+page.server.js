import { getPage, getContactInfo } from '$lib/server/database';

export const load = async () => {
	const page = getPage('im-new');
	const contactInfo = getContactInfo();
	if (page) {
		return { page, contactInfo };
	}
	// Return a properly typed fallback that matches PageContent interface
	const fallbackPage = {
		id: 'im-new',
		title: "I'm New",
		heroTitle: 'I am new here',
		heroImage: '/images/church-bg.jpg',
		content: '',
		sections: [],
		published: true
	};
	return { page: fallbackPage, contactInfo };
};
