<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import FormField from '$lib/crm/components/FormField.svelte';
	import HtmlEditor from '$lib/crm/components/HtmlEditor.svelte';
	import { notifications } from '$lib/crm/stores/notifications.js';

	$: csrfToken = $page.data?.csrfToken || '';
	$: formResult = $page.form;
	
	// Show notifications from form results
	$: if (formResult?.error) {
		notifications.error(formResult.error);
	}

	let htmlContent = '';
	let formData = {
		name: '',
		subject: '',
		description: ''
	};
</script>

<div class="bg-white shadow rounded-lg p-6">
	<h2 class="text-2xl font-bold text-gray-900 mb-6">New Newsletter Template</h2>

	<form method="POST" action="?/create" use:enhance>
		<input type="hidden" name="_csrf" value={csrfToken} />
		<FormField label="Template Name" name="name" bind:value={formData.name} required />
		<FormField label="Description" name="description" bind:value={formData.description} />
		<FormField label="Subject" name="subject" bind:value={formData.subject} />
		<div class="mb-4">
			<label class="block text-sm font-medium text-gray-700 mb-1">HTML Content</label>
			<div class="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
				<p class="text-sm text-blue-800 font-medium mb-2">Available Placeholders:</p>
				<ul class="text-xs text-blue-700 space-y-1 list-disc list-inside">
					<li><code>{'{{firstName}}'}</code> - Contact's first name</li>
					<li><code>{'{{lastName}}'}</code> - Contact's last name</li>
					<li><code>{'{{name}}'}</code> - Full name (first + last)</li>
					<li><code>{'{{email}}'}</code> - Contact's email address</li>
					<li><code>{'{{phone}}'}</code> - Contact's phone number</li>
					<li><code>{'{{rotaLinks}}'}</code> - Upcoming rotas section (next 7 days) with links</li>
					<li><code>{'{{upcomingEvents}}'}</code> - Upcoming public events section (next 7 days)</li>
				</ul>
			</div>
			<HtmlEditor bind:value={htmlContent} name="htmlContent" showPlaceholders={true} showImagePicker={true} />
		</div>
		<div class="flex gap-2">
			<button type="submit" class="bg-brand-green text-white px-4 py-2 rounded-md hover:bg-primary-dark">
				Create Template
			</button>
			<a href="/hub/newsletters/templates" class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
				Cancel
			</a>
		</div>
	</form>

</div>

