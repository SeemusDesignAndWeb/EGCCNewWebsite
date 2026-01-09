import { redirect } from '@sveltejs/kit';
import { findById } from '$lib/crm/server/fileStore.js';
import { decrypt } from '$lib/crm/server/crypto.js';

export async function load({ params }) {
	const form = await findById('forms', params.id);
	if (!form) {
		throw redirect(302, '/hub/forms');
	}

	const register = await findById('registers', params.submissionId);
	if (!register || register.formId !== params.id) {
		throw redirect(302, `/hub/forms/${params.id}`);
	}

	// Decrypt if safeguarding
	let data = register.data;
	if (form.requiresEncryption && register.encryptedData) {
		try {
			const decrypted = decrypt(register.encryptedData);
			data = JSON.parse(decrypted);
		} catch (error) {
			console.error('Error decrypting register:', error);
			data = { error: 'Unable to decrypt data' };
		}
	}

	return { form, register, data };
}

