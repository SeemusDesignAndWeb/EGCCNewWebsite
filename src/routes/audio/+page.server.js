import { getPage, getPodcasts, getContactInfo } from '$lib/server/database';

export const load = async () => {
	const page = getPage('audio');
	const podcasts = getPodcasts();
	const contactInfo = getContactInfo();
	return {
		page: page || {
			id: 'audio',
			title: 'Audio',
			heroTitle: 'Sermons & Audio',
			heroImage: '/images/audio-bg.jpg',
			content: '',
			sections: []
		},
		podcasts,
		contactInfo
	};
};
