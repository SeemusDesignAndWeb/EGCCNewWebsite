import { json } from '@sveltejs/kit';
import { getPodcasts, getPodcast } from '$lib/server/database';

export const GET = async ({ url }) => {
	const id = url.searchParams.get('id');

	try {
		if (id) {
			const podcast = getPodcast(id);
			return podcast ? json(podcast) : json({ error: 'Podcast not found' }, { status: 404 });
		}
		return json(getPodcasts());
	} catch (error) {
		return json({ error: 'Failed to fetch podcasts' }, { status: 500 });
	}
};
