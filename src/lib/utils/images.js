/**
 * Optimise an existing Cloudinary URL by adding optimisation parameters
 * Adds w_1000/f_auto/q_auto if not already present
 * @param {string} url - Cloudinary URL
 * @returns {string} Optimised Cloudinary URL
 */
export function optimizeCloudinaryUrl(url) {
	if (!url || !isCloudinaryUrl(url)) return url;
	
	// Check if URL already has transformations
	const uploadIndex = url.indexOf('/upload/');
	if (uploadIndex === -1) return url;
	
	const baseUrl = url.substring(0, uploadIndex + '/upload/'.length);
	const rest = url.substring(uploadIndex + '/upload/'.length);
	
	// Split into transformations and public ID
	const parts = rest.split('/');
	const publicId = parts[parts.length - 1];
	const existingTransforms = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
	
	// Parse existing transformations
	const existing = existingTransforms ? existingTransforms.split(',').filter(t => t.trim()) : [];
	
	// Check what optimisation params already exist
	const hasWidth = existing.some(t => t.startsWith('w_'));
	const hasFormat = existing.some(t => t.startsWith('f_'));
	const hasQuality = existing.some(t => t.startsWith('q_'));

	// Build final transformations array
	const finalTransforms = [...existing];

	// Add missing optimisation params
	if (!hasWidth) finalTransforms.push('w_1000');
	if (!hasFormat) finalTransforms.push('f_auto');
	if (!hasQuality) finalTransforms.push('q_auto');
	
	// Construct optimized URL
	return `${baseUrl}${finalTransforms.join(',')}/${publicId}`;
}

/**
 * Get the full image URL, handling both Cloudinary URLs and local paths
 * Automatically applies Cloudinary optimisation parameters (w_1000/f_auto/q_auto)
 * @param {string} path - Image path (Cloudinary URL or local path)
 * @returns {string} Full image URL with optimisation
 */
export function getImageUrl(path) {
	if (!path) return '';

	// If it's already a full Cloudinary URL, optimise it
	if (path.startsWith('http') && isCloudinaryUrl(path)) {
		return optimizeCloudinaryUrl(path);
	}

	// If it's a local path starting with /images/, return as is
	// (This will work during transition period)
	if (path.startsWith('/images/')) {
		return path;
	}

	// If it's a Cloudinary public ID (without folder), construct optimised URL
	if (!path.includes('/') && !path.includes('.')) {
		return `https://res.cloudinary.com/dl8kjhwjs/image/upload/w_1000,f_auto,q_auto/${path}`;
	}

	// Default: return as is
	return path;
}

/**
 * Get optimised Cloudinary image URL with transformations
 * Automatically includes default optimisation parameters (w_1000/f_auto/q_auto) unless overridden
 * @param {string} path - Cloudinary URL or public ID
 * @param {object} options - Transformation options (width, height, quality, format, etc.)
 * @returns {string} Optimised Cloudinary URL
 */
export function getOptimizedImageUrl(path, options = {}) {
	if (!path) return '';

	// If it's already a Cloudinary URL, extract public ID
	let publicId = path;
	if (path.includes('cloudinary.com')) {
		// Extract public ID from Cloudinary URL
		const parts = path.split('/upload/');
		if (parts.length > 1) {
			// Get everything after /upload/ and extract public ID (remove file extension)
			const afterUpload = parts[1];
			const publicIdParts = afterUpload.split('/');
			publicId = publicIdParts[publicIdParts.length - 1].split('.')[0];
		}
	}

	// Build transformation string with defaults
	const transformations = [];
	
	// Default optimisations (unless overridden)
	if (!options.width) transformations.push('w_1000');
	else transformations.push(`w_${options.width}`);
	
	if (!options.format) transformations.push('f_auto');
	else transformations.push(`f_${options.format}`);
	
	if (!options.quality) transformations.push('q_auto');
	else transformations.push(`q_${options.quality}`);
	
	// Additional transformations
	if (options.height) transformations.push(`h_${options.height}`);
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

