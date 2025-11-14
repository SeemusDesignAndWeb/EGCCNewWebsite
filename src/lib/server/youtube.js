import { env } from '$env/dynamic/private';

const YOUTUBE_API_KEY = env.YOUTUBE_API_KEY || 'AIzaSyCeW5aaS1eeY5P5gMxkxWUJ9IVmQN4kfQg';
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Fetch videos from a YouTube channel
 * @param {string} channelId - YouTube channel ID
 * @param {number} maxResults - Maximum number of videos to fetch (default: 50)
 * @returns {Promise<Array>} Array of video objects
 */
export async function getChannelVideos(channelId, maxResults = 50) {
	if (!channelId) {
		throw new Error('Channel ID is required');
	}

	try {
		// Get uploads playlist ID from channel
		const channelUrl = `${YOUTUBE_API_BASE}/channels?part=contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`;
		console.log('Fetching channel info from:', channelUrl.replace(YOUTUBE_API_KEY, 'API_KEY_HIDDEN'));
		
		const channelResponse = await fetch(channelUrl);
		if (!channelResponse.ok) {
			const error = await channelResponse.json();
			console.error('YouTube API error:', error);
			throw new Error(error.error?.message || `Failed to fetch channel: ${channelResponse.status} ${channelResponse.statusText}`);
		}

		const channelData = await channelResponse.json();
		
		if (!channelData.items || channelData.items.length === 0) {
			throw new Error('Channel not found');
		}

		const uploadsPlaylistId = channelData.items[0].contentDetails?.relatedPlaylists?.uploads;
		
		if (!uploadsPlaylistId) {
			throw new Error('Could not find uploads playlist for channel');
		}

		// Use the playlist function to get videos
		return await getPlaylistVideos(uploadsPlaylistId, maxResults);
	} catch (error) {
		console.error('YouTube channel API error:', error);
		throw error;
	}
}

/**
 * Get channel information
 * @param {string} channelId - YouTube channel ID
 * @returns {Promise<object>} Channel information
 */
export async function getChannelInfo(channelId) {
	if (!channelId) {
		throw new Error('Channel ID is required');
	}

	try {
		const url = `${YOUTUBE_API_BASE}/channels?part=snippet,contentDetails,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`;
		
		const response = await fetch(url);
		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error?.message || 'Failed to fetch channel info');
		}

		const data = await response.json();
		
		if (!data.items || data.items.length === 0) {
			return null;
		}

		const channel = data.items[0];
		return {
			id: channel.id,
			title: channel.snippet.title,
			description: channel.snippet.description,
			thumbnail: channel.snippet.thumbnails?.high?.url || channel.snippet.thumbnails?.medium?.url,
			videoCount: parseInt(channel.statistics?.videoCount || 0)
		};
	} catch (error) {
		console.error('YouTube API error:', error);
		throw error;
	}
}

/**
 * Fetch videos from a YouTube playlist
 * @param {string} playlistId - YouTube playlist ID
 * @param {number} maxResults - Maximum number of videos to fetch (default: 50)
 * @returns {Promise<Array>} Array of video objects
 */
export async function getPlaylistVideos(playlistId, maxResults = 50) {
	if (!playlistId) {
		throw new Error('Playlist ID is required');
	}

	try {
		// First, get playlist items
		const playlistItemsUrl = `${YOUTUBE_API_BASE}/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`;
		
		console.log('Fetching playlist items from:', playlistItemsUrl.replace(YOUTUBE_API_KEY, 'API_KEY_HIDDEN'));
		const playlistResponse = await fetch(playlistItemsUrl);
		if (!playlistResponse.ok) {
			const error = await playlistResponse.json();
			console.error('YouTube API error:', error);
			throw new Error(error.error?.message || `Failed to fetch playlist: ${playlistResponse.status} ${playlistResponse.statusText}`);
		}

		const playlistData = await playlistResponse.json();
		
		if (!playlistData.items || playlistData.items.length === 0) {
			return [];
		}

		// Extract video IDs
		const videoIds = playlistData.items
			.map(item => item.contentDetails?.videoId)
			.filter(Boolean);

		if (videoIds.length === 0) {
			return [];
		}

		// Get video details
		const videosUrl = `${YOUTUBE_API_BASE}/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`;
		
		const videosResponse = await fetch(videosUrl);
		if (!videosResponse.ok) {
			const error = await videosResponse.json();
			throw new Error(error.error?.message || 'Failed to fetch video details');
		}

		const videosData = await videosResponse.json();

		// Map to our format
		const videos = videosData.items.map(video => {
			const snippet = video.snippet;
			const contentDetails = video.contentDetails;
			const statistics = video.statistics || {};

			// Parse duration (ISO 8601 format like PT33M12S)
			const duration = parseDuration(contentDetails.duration);

			return {
				id: video.id,
				title: snippet.title,
				description: snippet.description,
				thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
				publishedAt: snippet.publishedAt,
				channelTitle: snippet.channelTitle,
				duration: duration,
				viewCount: parseInt(statistics.viewCount || 0),
				url: `https://www.youtube.com/watch?v=${video.id}`,
				embedUrl: `https://www.youtube.com/embed/${video.id}`
			};
		});

		// Sort by published date (newest first)
		videos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

		return videos;
	} catch (error) {
		console.error('YouTube API error:', error);
		throw error;
	}
}

/**
 * Parse ISO 8601 duration to MM:SS or HH:MM:SS format
 * @param {string} isoDuration - ISO 8601 duration (e.g., PT33M12S)
 * @returns {string} Formatted duration (e.g., 33:12)
 */
function parseDuration(isoDuration) {
	if (!isoDuration) return '';

	const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
	if (!match) return '';

	const hours = parseInt(match[1] || 0);
	const minutes = parseInt(match[2] || 0);
	const seconds = parseInt(match[3] || 0);

	if (hours > 0) {
		return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
	}
	return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Get playlist information
 * @param {string} playlistId - YouTube playlist ID
 * @returns {Promise<object>} Playlist information
 */
export async function getPlaylistInfo(playlistId) {
	if (!playlistId) {
		throw new Error('Playlist ID is required');
	}

	try {
		const url = `${YOUTUBE_API_BASE}/playlists?part=snippet,contentDetails&id=${playlistId}&key=${YOUTUBE_API_KEY}`;
		
		const response = await fetch(url);
		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error?.message || 'Failed to fetch playlist info');
		}

		const data = await response.json();
		
		if (!data.items || data.items.length === 0) {
			return null;
		}

		const playlist = data.items[0];
		return {
			id: playlist.id,
			title: playlist.snippet.title,
			description: playlist.snippet.description,
			thumbnail: playlist.snippet.thumbnails?.high?.url || playlist.snippet.thumbnails?.medium?.url,
			videoCount: playlist.contentDetails.itemCount
		};
	} catch (error) {
		console.error('YouTube API error:', error);
		throw error;
	}
}

