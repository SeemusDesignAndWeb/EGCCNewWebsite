import { json } from '@sveltejs/kit';
import { create, readCollection } from '$lib/crm/server/fileStore.js';
import { validateForm } from '$lib/crm/server/validators.js';
import { getAdminFromCookies, verifyCsrfToken } from '$lib/crm/server/auth.js';
import { canAccessForms } from '$lib/crm/server/permissions.js';
import { logDataChange } from '$lib/crm/server/audit.js';

/**
 * Import form(s) structure
 * POST /hub/forms/import
 * Body: JSON array of form objects or single form object
 */
export async function POST({ request, cookies }) {
	const admin = await getAdminFromCookies(cookies);
	if (!admin) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (!canAccessForms(admin)) {
		return json({ error: 'You do not have permission to import forms' }, { status: 403 });
	}

	// Check CSRF token
	const data = await request.formData();
	const csrfToken = data.get('_csrf');
	if (!csrfToken || !verifyCsrfToken(cookies, csrfToken)) {
		return json({ error: 'CSRF token validation failed' }, { status: 403 });
	}

	const file = data.get('file');
	if (!file) {
		return json({ error: 'No file provided' }, { status: 400 });
	}

	try {
		// Read file content
		const fileContent = await file.text();
		let importData;
		
		try {
			importData = JSON.parse(fileContent);
		} catch (parseError) {
			return json({ error: 'Invalid JSON file. Please ensure the file is valid JSON.' }, { status: 400 });
		}

		// Handle both single form object and array of forms
		const formsToImport = Array.isArray(importData) ? importData : [importData];

		if (formsToImport.length === 0) {
			return json({ error: 'No forms found in file' }, { status: 400 });
		}

		const results = {
			success: [],
			errors: []
		};

		// Get existing forms to check for duplicates
		const existingForms = await readCollection('forms');
		const existingNames = new Set(existingForms.map(f => f.name.toLowerCase()));

		// Import each form
		for (let i = 0; i < formsToImport.length; i++) {
			const formData = formsToImport[i];
			
			try {
				// Validate the form data
				const validated = validateForm(formData);
				
				// Check for duplicate names (case-insensitive)
				if (existingNames.has(validated.name.toLowerCase())) {
					results.errors.push({
						index: i,
						name: validated.name,
						error: `A form with the name "${validated.name}" already exists`
					});
					continue;
				}

				// Create the form
				const createdForm = await create('forms', validated);
				existingNames.add(validated.name.toLowerCase());

				// Log the import
				const event = { getClientAddress: () => 'unknown', request };
				await logDataChange(admin.id, 'create', 'forms', createdForm.id, {
					name: createdForm.name,
					source: 'import'
				}, event);

				results.success.push({
					index: i,
					id: createdForm.id,
					name: createdForm.name
				});
			} catch (error) {
				results.errors.push({
					index: i,
					name: formData.name || `Form ${i + 1}`,
					error: error.message || 'Validation failed'
				});
			}
		}

		if (results.success.length === 0) {
			return json({ 
				error: 'No forms were imported. All forms failed validation or already exist.',
				details: results.errors
			}, { status: 400 });
		}

		return json({
			success: true,
			message: `Successfully imported ${results.success.length} form(s)`,
			imported: results.success.length,
			failed: results.errors.length,
			results
		});
	} catch (error) {
		console.error('Error importing forms:', error);
		return json({ error: error.message || 'Failed to import forms' }, { status: 500 });
	}
}
