import { v2 as cloudinary } from 'cloudinary';
import { env } from '$env/dynamic/private';

// Configure Cloudinary
cloudinary.config({
	cloud_name: env.CLOUDINARY_CLOUD_NAME || 'dl8kjhwjs',
	api_key: env.CLOUDINARY_API_KEY,
	api_secret: env.CLOUDINARY_API_SECRET
});

/**
 * Upload an image to Cloudinary
 * @param {Buffer|string} file - File buffer or file path
 * @param {string} filename - Original filename
 * @param {object} options - Additional upload options
 * @returns {Promise<object>} Cloudinary upload result
 */
export async function uploadImage(file, filename, options = {}) {
	try {
		const uploadOptions = {
			folder: 'egcc', // Organize images in a folder
			use_filename: false, // Use Cloudinary's generated filename
			unique_filename: true,
			overwrite: false,
			resource_type: 'image',
			...options
		};

		// If file is a Buffer, upload from buffer
		if (Buffer.isBuffer(file)) {
			return new Promise((resolve, reject) => {
				const uploadStream = cloudinary.uploader.upload_stream(
					uploadOptions,
					(error, result) => {
						if (error) {
							reject(error);
						} else {
							resolve(result);
						}
					}
				);
				uploadStream.end(file);
			});
		}

		// Otherwise, upload from file path
		const result = await cloudinary.uploader.upload(file, uploadOptions);
		return result;
	} catch (error) {
		console.error('Cloudinary upload error:', error);
		throw error;
	}
}

/**
 * Delete an image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<object>} Deletion result
 */
export async function deleteImage(publicId) {
	try {
		// Extract public_id from URL if full URL is provided
		const id = publicId.includes('/') 
			? publicId.split('/').pop().split('.')[0] 
			: publicId;
		
		const result = await cloudinary.uploader.destroy(id);
		return result;
	} catch (error) {
		console.error('Cloudinary delete error:', error);
		throw error;
	}
}

/**
 * Get Cloudinary URL for an image
 * @param {string} publicId - Cloudinary public ID
 * @param {object} options - Transformation options
 * @returns {string} Cloudinary URL
 */
export function getImageUrl(publicId, options = {}) {
	if (!publicId) return '';
	
	// If it's already a full URL, return it
	if (publicId.startsWith('http')) {
		return publicId;
	}

	// Extract public_id from URL if full URL is provided
	const id = publicId.includes('/') 
		? publicId.split('/').pop().split('.')[0] 
		: publicId;

	const cloudName = env.CLOUDINARY_CLOUD_NAME || 'dl8kjhwjs';
	const transformations = Object.keys(options).length > 0 
		? `/${Object.entries(options).map(([k, v]) => `${k}_${v}`).join(',')}`
		: '';

	return `https://res.cloudinary.com/${cloudName}/image/upload${transformations}/${id}`;
}

/**
 * Check if a URL is a Cloudinary URL
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export function isCloudinaryUrl(url) {
	return url && (url.includes('cloudinary.com') || url.includes('res.cloudinary.com'));
}

/**
 * Convert local image path to Cloudinary URL if needed
 * @param {string} path - Local path or Cloudinary URL
 * @returns {string} Cloudinary URL or original path
 */
export function normalizeImageUrl(path) {
	if (!path) return '';
	
	// If already Cloudinary URL, return as is
	if (isCloudinaryUrl(path)) {
		return path;
	}

	// If it's a local path starting with /images/, we'll need to handle migration
	// For now, return as is - migration script will handle conversion
	return path;
}

