import { json } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/auth';
import { getImages, saveImage, deleteImage } from '$lib/server/database';
import { uploadImage, deleteImage as deleteCloudinaryImage, getImageUrl } from '$lib/server/cloudinary';
import { randomUUID } from 'crypto';

export const GET = async ({ url, cookies }) => {
	requireAuth({ cookies });

	const id = url.searchParams.get('id');

	try {
		if (id) {
			const image = getImages().find((img) => img.id === id);
			return image ? json(image) : json({ error: 'Image not found' }, { status: 404 });
		}
		return json(getImages());
	} catch (error) {
		return json({ error: 'Failed to fetch images' }, { status: 500 });
	}
};

export const POST = async ({ request, cookies }) => {
	requireAuth({ cookies });

	try {
		const formData = await request.formData();
		const file = formData.get('file');

		if (!file) {
			return json({ error: 'No file provided' }, { status: 400 });
		}

		// Validate file type
		if (!file.type.startsWith('image/')) {
			return json({ error: 'File must be an image' }, { status: 400 });
		}

		// Validate file size (max 10MB)
		if (file.size > 10 * 1024 * 1024) {
			return json({ error: 'File size must be less than 10MB' }, { status: 400 });
		}

		// Convert file to buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Upload to Cloudinary
		const uploadResult = await uploadImage(buffer, file.name, {
			public_id: `egcc/${randomUUID()}`,
			filename_override: file.name
		});

		// Create image metadata
		const imageMetadata = {
			id: randomUUID(),
			filename: uploadResult.public_id.split('/').pop(),
			originalName: file.name,
			path: uploadResult.secure_url, // Store Cloudinary URL
			cloudinaryPublicId: uploadResult.public_id, // Store Cloudinary public ID for deletion
			size: file.size,
			mimeType: file.type,
			width: uploadResult.width,
			height: uploadResult.height,
			uploadedAt: new Date().toISOString()
		};

		// Save metadata to database
		saveImage(imageMetadata);

		return json({ success: true, image: imageMetadata });
	} catch (error) {
		console.error('Image upload error:', error);
		return json({ error: 'Failed to upload image: ' + error.message }, { status: 500 });
	}
};

export const DELETE = async ({ url, cookies }) => {
	requireAuth({ cookies });

	const id = url.searchParams.get('id');

	if (!id) {
		return json({ error: 'ID required' }, { status: 400 });
	}

	try {
		const image = getImages().find((img) => img.id === id);
		if (!image) {
			return json({ error: 'Image not found' }, { status: 404 });
		}

		// Delete from Cloudinary if it has a Cloudinary public ID
		if (image.cloudinaryPublicId) {
			try {
				await deleteCloudinaryImage(image.cloudinaryPublicId);
			} catch (cloudinaryError) {
				console.error('Failed to delete from Cloudinary:', cloudinaryError);
				// Continue with database deletion even if Cloudinary deletion fails
			}
		}

		// Delete from database
		deleteImage(id);

		return json({ success: true });
	} catch (error) {
		console.error('Image delete error:', error);
		return json({ error: 'Failed to delete image' }, { status: 500 });
	}
};
