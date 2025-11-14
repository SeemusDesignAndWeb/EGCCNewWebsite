import { getSettings, getTeam } from '$lib/server/database';

export async function load() {
	const settings = getSettings();
	const team = getTeam();
	return {
		teamDescription: settings.teamDescription || '',
		teamHeroTitle: settings.teamHeroTitle || 'Developing leaders of tomorrow',
		team: team || []
	};
}

