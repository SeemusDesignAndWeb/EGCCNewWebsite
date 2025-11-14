import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Configure Cloudinary
cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dl8kjhwjs',
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET
});

const DB_PATH = process.env.DATABASE_PATH || './data/database.json';

async function readDatabase() {
	const dbPath = join(process.cwd(), DB_PATH);
	const data = readFileSync(dbPath, 'utf-8');
	return JSON.parse(data);
}

async function writeDatabase(data) {
	const dbPath = join(process.cwd(), DB_PATH);
	writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}

async function uploadToCloudinary(filePath, publicId) {
	return new Promise((resolve, reject) => {
		cloudinary.uploader.upload(
			filePath,
			{
				public_id: publicId,
				folder: 'egcc',
				use_filename: false,
				unique_filename: false,
				overwrite: false
			},
			(error, result) => {
				if (error) {
					reject(error);
				} else {
					resolve(result);
				}
			}
		);
	});
}

async function migrateImages() {
	console.log('Starting Cloudinary migration...\n');

	const db = await readDatabase();
	const images = db.images || [];
	const staticDir = join(process.cwd(), 'static');

	let migrated = 0;
	let skipped = 0;
	let errors = 0;

	for (const image of images) {
		// Skip if already migrated (has cloudinaryPublicId or is already a Cloudinary URL)
		if (image.cloudinaryPublicId || (image.path && image.path.includes('cloudinary.com'))) {
			console.log(`⏭️  Skipping ${image.originalName} (already migrated)`);
			skipped++;
			continue;
		}

		// Get local file path
		const localPath = image.path.startsWith('/')
			? join(staticDir, image.path.substring(1))
			: join(staticDir, image.path);

		if (!existsSync(localPath)) {
			console.log(`❌ File not found: ${localPath}`);
			errors++;
			continue;
		}

		try {
			// Generate Cloudinary public ID
			const publicId = `egcc/${image.id}`;

			console.log(`📤 Uploading ${image.originalName}...`);

			// Upload to Cloudinary
			const result = await uploadToCloudinary(localPath, publicId);

			// Update image metadata
			image.path = result.secure_url;
			image.cloudinaryPublicId = result.public_id;
			image.width = result.width;
			image.height = result.height;

			// Update in database
			const index = db.images.findIndex((img) => img.id === image.id);
			if (index >= 0) {
				db.images[index] = image;
			}

			console.log(`✅ Migrated ${image.originalName} -> ${result.secure_url}`);
			migrated++;
		} catch (error) {
			console.error(`❌ Error migrating ${image.originalName}:`, error.message);
			errors++;
		}
	}

	// Also migrate images referenced in other parts of the database
	console.log('\n📋 Migrating images in pages, team, hero slides...\n');

	// Migrate hero slides
	if (db.heroSlides) {
		for (const slide of db.heroSlides) {
			if (slide.image && !slide.image.includes('cloudinary.com')) {
				const localPath = slide.image.startsWith('/')
					? join(staticDir, slide.image.substring(1))
					: join(staticDir, slide.image);

				if (existsSync(localPath)) {
					try {
						const publicId = `egcc/hero-slide-${slide.id}`;
						const result = await uploadToCloudinary(localPath, publicId);
						slide.image = result.secure_url;
						console.log(`✅ Migrated hero slide image: ${slide.title}`);
					} catch (error) {
						console.error(`❌ Error migrating hero slide:`, error.message);
					}
				}
			}
		}
	}

	// Migrate team member images
	if (db.team) {
		for (const member of db.team) {
			if (member.image && !member.image.includes('cloudinary.com')) {
				const localPath = member.image.startsWith('/')
					? join(staticDir, member.image.substring(1))
					: join(staticDir, member.image);

				if (existsSync(localPath)) {
					try {
						const publicId = `egcc/team-${member.id}`;
						const result = await uploadToCloudinary(localPath, publicId);
						member.image = result.secure_url;
						console.log(`✅ Migrated team member image: ${member.name}`);
					} catch (error) {
						console.error(`❌ Error migrating team member:`, error.message);
					}
				}
			}
		}
	}

	// Migrate page images
	if (db.pages) {
		for (const page of db.pages) {
			// Migrate hero image
			if (page.heroImage && !page.heroImage.includes('cloudinary.com')) {
				const localPath = page.heroImage.startsWith('/')
					? join(staticDir, page.heroImage.substring(1))
					: join(staticDir, page.heroImage);

				if (existsSync(localPath)) {
					try {
						const publicId = `egcc/page-hero-${page.id}`;
						const result = await uploadToCloudinary(localPath, publicId);
						page.heroImage = result.secure_url;
						console.log(`✅ Migrated page hero image: ${page.title}`);
					} catch (error) {
						console.error(`❌ Error migrating page hero:`, error.message);
					}
				}
			}

			// Migrate section images
			if (page.sections) {
				for (const section of page.sections) {
					if (section.image && !section.image.includes('cloudinary.com')) {
						const localPath = section.image.startsWith('/')
							? join(staticDir, section.image.substring(1))
							: join(staticDir, section.image);

						if (existsSync(localPath)) {
							try {
								const publicId = `egcc/page-section-${page.id}-${section.id || 'default'}`;
								const result = await uploadToCloudinary(localPath, publicId);
								section.image = result.secure_url;
								console.log(`✅ Migrated section image: ${page.title}`);
							} catch (error) {
								console.error(`❌ Error migrating section image:`, error.message);
							}
						}
					}
				}
			}
		}
	}

	// Save updated database
	await writeDatabase(db);

	console.log('\n📊 Migration Summary:');
	console.log(`✅ Migrated: ${migrated}`);
	console.log(`⏭️  Skipped: ${skipped}`);
	console.log(`❌ Errors: ${errors}`);
	console.log('\n✨ Migration complete!');
}

// Run migration
migrateImages().catch((error) => {
	console.error('Migration failed:', error);
	process.exit(1);
});

