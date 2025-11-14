# Cloudinary Setup Guide

This project uses Cloudinary for image storage and delivery. All images are uploaded to and served from Cloudinary.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
CLOUDINARY_CLOUD_NAME=dl8kjhwjs
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

You can find your API credentials in your [Cloudinary Dashboard](https://console.cloudinary.com/settings/api-keys).

## Migration

To migrate existing images from local storage to Cloudinary, run:

```bash
npm run migrate-images
```

This script will:
1. Upload all images from `static/images/` to Cloudinary
2. Update the database with Cloudinary URLs
3. Migrate images referenced in pages, team members, and hero slides

## Image Upload

New images uploaded through the admin panel will automatically be uploaded to Cloudinary. The image metadata stored in the database includes:
- `path`: Cloudinary secure URL
- `cloudinaryPublicId`: Cloudinary public ID (for deletion)
- `width` and `height`: Image dimensions

## Image URLs

Images are stored in the `egcc` folder on Cloudinary. URLs follow this format:
```
https://res.cloudinary.com/dl8kjhwjs/image/upload/egcc/[public-id]
```

## Image Optimization

You can use Cloudinary's transformation features for optimized image delivery. The utility functions in `src/lib/utils/images.js` provide helpers for:
- Getting optimized image URLs with width/height/quality settings
- Checking if a URL is from Cloudinary
- Normalizing image URLs

Example:
```javascript
import { getOptimizedImageUrl } from '$lib/utils/images';

// Get optimized thumbnail
const thumbnailUrl = getOptimizedImageUrl(imageUrl, {
  width: 300,
  height: 300,
  crop: 'fill',
  quality: 80
});
```

