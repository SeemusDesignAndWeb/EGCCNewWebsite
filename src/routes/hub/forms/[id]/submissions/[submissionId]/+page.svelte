<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { formatDateTimeUK } from '$lib/crm/utils/dateFormat.js';

	$: form = $page.data?.form;
	$: register = $page.data?.register;
	$: data = $page.data?.data || {};
</script>

{#if form && register}
	<div class="bg-white shadow rounded-lg p-6">
		<div class="flex justify-between items-center mb-6">
			<h2 class="text-2xl font-bold text-gray-900">Form Submission</h2>
			<a href="/hub/forms/{form.id}" class="text-hub-green-600 hover:text-hub-green-800">
				← Back to Form
			</a>
		</div>

		<div class="mb-6">
			<dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<dt class="text-sm font-medium text-gray-500">Form</dt>
					<dd class="mt-1 text-sm text-gray-900">{form.name}</dd>
				</div>
				<div>
					<dt class="text-sm font-medium text-gray-500">Submitted</dt>
					<dd class="mt-1 text-sm text-gray-900">
						{register.submittedAt ? formatDateTimeUK(register.submittedAt) : '-'}
					</dd>
				</div>
				{#if form.isSafeguarding}
					<div class="sm:col-span-2">
						<div class="bg-hub-yellow-50 border border-hub-yellow-200 rounded-md p-3">
							<p class="text-sm text-hub-yellow-800">
								<strong>⚠️ Safeguarding Form:</strong> This submission is encrypted for security.
							</p>
						</div>
					</div>
				{/if}
			</dl>
		</div>

		<div>
			<h3 class="text-lg font-semibold text-gray-900 mb-4">Submission Data</h3>
			<dl class="grid grid-cols-1 gap-4">
				{#each form.fields as field}
					<div>
						<dt class="text-sm font-medium text-gray-500">{field.label}</dt>
						<dd class="mt-1 text-sm text-gray-900">
							{#if data[field.name] !== undefined && data[field.name] !== null && data[field.name] !== ''}
								{#if Array.isArray(data[field.name])}
									{data[field.name].join(', ')}
								{:else}
									{String(data[field.name])}
								{/if}
							{:else}
								<span class="text-gray-400">-</span>
							{/if}
						</dd>
					</div>
				{/each}
			</dl>
		</div>
	</div>
{/if}

