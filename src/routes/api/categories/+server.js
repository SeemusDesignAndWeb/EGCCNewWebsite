import { json } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/auth';
import { getCategories, saveCategory, deleteCategory } from '$lib/server/database';

export const GET = async ({ cookies }) => {
	// Categories can be read without auth for frontend filtering
	try {
		const categories = getCategories();
		return json(categories);
	} catch (error) {
		return json({ error: 'Failed to fetch categories' }, { status: 500 });
	}
};

export const POST = async ({ request, cookies }) => {
	requireAuth({ cookies });

	try {
		const { category } = await request.json();
		
		if (!category || typeof category !== 'string' || category.trim() === '') {
			return json({ error: 'Category name is required' }, { status: 400 });
		}

		const savedCategory = saveCategory(category.trim());
		return json({ success: true, category: savedCategory });
	} catch (error) {
		console.error('Category save error:', error);
		return json({ error: 'Failed to save category' }, { status: 500 });
	}
};

export const DELETE = async ({ request, cookies }) => {
	requireAuth({ cookies });

	try {
		const { category } = await request.json();
		
		if (!category || typeof category !== 'string') {
			return json({ error: 'Category name is required' }, { status: 400 });
		}

		deleteCategory(category);
		return json({ success: true });
	} catch (error) {
		console.error('Category delete error:', error);
		return json({ error: 'Failed to delete category' }, { status: 500 });
	}
};

