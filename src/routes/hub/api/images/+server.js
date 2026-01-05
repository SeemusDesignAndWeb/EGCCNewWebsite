import { json } from '@sveltejs/kit';
import { getImages } from '$lib/server/database.js';

/**
 * Get images from the database (accessible from The HUB)
 * This endpoint is for The HUB use only - auth is handled by The HUB hook
 */
export async function GET() {
	try {
		const images = getImages();
		return json(images);
	} catch (error) {
		console.error('Error fetching images:', error);
		return json({ error: 'Failed to fetch images' }, { status: 500 });
	}
}

