import { getPage, getSettings, getTeam, getContactInfo } from '$lib/server/database';

export async function load() {
	const page = getPage('team');
	const settings = getSettings();
	const team = getTeam();
	const contactInfo = getContactInfo();
	
	// Use page data if available, otherwise fall back to settings for backward compatibility
	const defaultPage = {
		id: 'team',
		title: 'Our Team',
		heroTitle: settings.teamHeroTitle || 'Developing leaders of tomorrow',
		heroSubtitle: settings.teamHeroSubtitle || '',
		heroButtons: settings.teamHeroButtons || [],
		heroImage: settings.teamHeroImage || 'https://res.cloudinary.com/dl8kjhwjs/image/upload/v1763066390/egcc/egcc/img-church-bg.jpg',
		heroOverlay: 40,
		teamDescription: settings.teamDescription || '',
		sections: []
	};
	
	// Merge page data with defaults
	const finalPage = page ? {
		...defaultPage,
		...page,
		// Preserve teamDescription from page if it exists, otherwise use settings
		teamDescription: page.teamDescription !== undefined ? page.teamDescription : defaultPage.teamDescription
	} : defaultPage;
	
	return {
		page: finalPage,
		team: team || [],
		contactInfo
	};
}

