/**
 * Get the full image URL, handling both Cloudinary URLs and local paths
 * @param {string} path - Image path (Cloudinary URL or local path)
 * @returns {string} Full image URL
 */
export function getImageUrl(path) {
	if (!path) return '';

	// If it's already a full Cloudinary URL, return it
	if (path.startsWith('http')) {
		return path;
	}

	// If it's a local path starting with /images/, return as is
	// (This will work during transition period)
	if (path.startsWith('/images/')) {
		return path;
	}

	// If it's a Cloudinary public ID (without folder), construct URL
	if (!path.includes('/') && !path.includes('.')) {
		return `https://res.cloudinary.com/dl8kjhwjs/image/upload/${path}`;
	}

	// Default: return as is
	return path;
}

/**
 * Get optimized Cloudinary image URL with transformations
 * @param {string} path - Cloudinary URL or public ID
 * @param {object} options - Transformation options (width, height, quality, format, etc.)
 * @returns {string} Optimized Cloudinary URL
 */
export function getOptimizedImageUrl(path, options = {}) {
	if (!path) return '';

	// If it's already a Cloudinary URL, extract public ID
	let publicId = path;
	if (path.includes('cloudinary.com')) {
		// Extract public ID from Cloudinary URL
		const parts = path.split('/upload/');
		if (parts.length > 1) {
			publicId = parts[1].split('.')[0];
		}
	}

	// Build transformation string
	const transformations = [];
	if (options.width) transformations.push(`w_${options.width}`);
	if (options.height) transformations.push(`h_${options.height}`);
	if (options.quality) transformations.push(`q_${options.quality}`);
	if (options.format) transformations.push(`f_${options.format}`);
	if (options.crop) transformations.push(`c_${options.crop}`);
	if (options.gravity) transformations.push(`g_${options.gravity}`);

	const transformStr = transformations.length > 0 ? `${transformations.join(',')}/` : '';

	return `https://res.cloudinary.com/dl8kjhwjs/image/upload/${transformStr}${publicId}`;
}

/**
 * Check if an image URL is from Cloudinary
 * @param {string} url - Image URL
 * @returns {boolean}
 */
export function isCloudinaryUrl(url) {
	return url && (url.includes('cloudinary.com') || url.includes('res.cloudinary.com'));
}

