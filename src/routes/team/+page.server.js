import { getSettings, getTeam, getContactInfo } from '$lib/server/database';

export async function load() {
	const settings = getSettings();
	const team = getTeam();
	const contactInfo = getContactInfo();
	return {
		teamDescription: settings.teamDescription || '',
		teamHeroTitle: settings.teamHeroTitle || 'Developing leaders of tomorrow',
		teamHeroSubtitle: settings.teamHeroSubtitle || '',
		teamHeroButtons: settings.teamHeroButtons || [],
		teamHeroImage: settings.teamHeroImage || 'https://res.cloudinary.com/dl8kjhwjs/image/upload/v1763066390/egcc/egcc/img-church-bg.jpg',
		team: team || [],
		contactInfo
	};
}

