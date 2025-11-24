import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		// Increase body size limit to 150MB for audio file uploads
		// This is the maximum size for request bodies in SvelteKit
		bodyParserLimit: 150 * 1024 * 1024
	}
};

export default config;

