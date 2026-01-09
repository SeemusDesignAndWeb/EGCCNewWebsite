<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { notifications } from '$lib/crm/stores/notifications.js';

	$: csrfToken = $page.data?.csrfToken || '';
	$: formResult = $page.form;
	
	// Show notifications from form results
	$: if (formResult?.error) {
		notifications.error(formResult.error);
	}
</script>

<div class="bg-white shadow rounded-lg p-6">
	<h2 class="text-2xl font-bold text-gray-900 mb-6">Create Weekly Newsletter Template</h2>

	<div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
		<h3 class="text-lg font-semibold text-blue-900 mb-2">About This Template</h3>
		<p class="text-sm text-blue-800 mb-3">
			This will create a pre-configured weekly newsletter template that includes:
		</p>
		<ul class="text-sm text-blue-800 list-disc list-inside space-y-1 mb-3">
			<li>Upcoming events (public events in the next 7 days)</li>
			<li>Personal rotas (rotas assigned to the contact in the next 7 days)</li>
			<li>Professional styling and layout</li>
			<li>All personalization placeholders ({{firstName}}, {{name}}, etc.)</li>
		</ul>
		<p class="text-sm text-blue-800">
			The template uses <code class="bg-blue-100 px-1 rounded">{{upcomingEvents}}</code> and <code class="bg-blue-100 px-1 rounded">{{rotaLinks}}</code> placeholders that will be automatically populated when sending newsletters.
		</p>
	</div>

	<form method="POST" action="?/create" use:enhance>
		<input type="hidden" name="_csrf" value={csrfToken} />
		
		<div class="flex gap-2">
			<button type="submit" class="bg-brand-green text-white px-4 py-2 rounded-md hover:bg-primary-dark">
				Create Weekly Newsletter Template
			</button>
			<a href="/hub/newsletters/templates" class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
				Cancel
			</a>
		</div>
	</form>
</div>

