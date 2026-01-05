<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import FormField from '$lib/crm/components/FormField.svelte';
	import { formatDateTimeUK } from '$lib/crm/utils/dateFormat.js';
	import { notifications } from '$lib/crm/stores/notifications.js';
	import { dialog } from '$lib/crm/stores/notifications.js';

	$: event = $page.data?.event;
	$: occurrence = $page.data?.occurrence;
	$: rotas = $page.data?.rotas || [];
	$: csrfToken = $page.data?.csrfToken || '';
	$: formResult = $page.form;
	
	// Show notifications from form results
	$: if (formResult?.success) {
		notifications.success('Occurrence updated successfully');
	}
	$: if (formResult?.error) {
		notifications.error(formResult.error);
	}

	let editing = false;
	let formData = {
		startsAt: '',
		endsAt: '',
		location: ''
	};

	$: if (occurrence) {
		// Convert ISO dates to datetime-local format
		const startDate = occurrence.startsAt ? new Date(occurrence.startsAt).toISOString().slice(0, 16) : '';
		const endDate = occurrence.endsAt ? new Date(occurrence.endsAt).toISOString().slice(0, 16) : '';
		
		formData = {
			startsAt: startDate,
			endsAt: endDate,
			location: occurrence.location || ''
		};
	}

	async function handleDelete() {
		const confirmed = await dialog.confirm('Are you sure you want to delete this occurrence?', 'Delete Occurrence');
		if (confirmed) {
			const form = document.createElement('form');
			form.method = 'POST';
			form.action = '?/delete';
			
			const csrfInput = document.createElement('input');
			csrfInput.type = 'hidden';
			csrfInput.name = '_csrf';
			csrfInput.value = csrfToken;
			form.appendChild(csrfInput);
			
			document.body.appendChild(form);
			form.submit();
		}
	}
</script>

{#if event && occurrence}
	<div class="bg-white shadow rounded-lg p-6">
		<div class="flex justify-between items-center mb-6">
			<div>
				<h2 class="text-2xl font-bold text-gray-900">Occurrence Details</h2>
				<p class="text-gray-600 mt-1">Event: {event.title}</p>
			</div>
			<div class="flex gap-2">
				{#if editing}
					<button
						on:click={() => editing = false}
						class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
					>
						Cancel
					</button>
				{:else}
					<button
						on:click={() => editing = true}
						class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
					>
						Edit
					</button>
					<button
						on:click={handleDelete}
						class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
					>
						Delete
					</button>
				{/if}
			</div>
		</div>

		{#if editing}
			<form method="POST" action="?/update" use:enhance>
				<input type="hidden" name="_csrf" value={csrfToken} />
				
				<FormField 
					label="Start Date & Time" 
					name="startsAt" 
					type="datetime-local" 
					bind:value={formData.startsAt} 
					required 
				/>
				<FormField 
					label="End Date & Time" 
					name="endsAt" 
					type="datetime-local" 
					bind:value={formData.endsAt} 
					required 
				/>
				<FormField 
					label="Location" 
					name="location" 
					bind:value={formData.location} 
				/>

				<button type="submit" class="mt-6 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
					Save Changes
				</button>
			</form>
		{:else}
			<dl class="grid grid-cols-1 gap-4">
				<div>
					<dt class="text-sm font-medium text-gray-500">Start</dt>
					<dd class="mt-1 text-sm text-gray-900">
						{occurrence.startsAt ? formatDateTimeUK(occurrence.startsAt) : '-'}
					</dd>
				</div>
				<div>
					<dt class="text-sm font-medium text-gray-500">End</dt>
					<dd class="mt-1 text-sm text-gray-900">
						{occurrence.endsAt ? formatDateTimeUK(occurrence.endsAt) : '-'}
					</dd>
				</div>
				{#if occurrence.location}
					<div>
						<dt class="text-sm font-medium text-gray-500">Location</dt>
						<dd class="mt-1 text-sm text-gray-900">{occurrence.location}</dd>
					</div>
				{/if}
			</dl>
		{/if}

	</div>

	<!-- Rotas Section -->
	<div class="bg-white shadow rounded-lg p-6 mt-6">
		<h3 class="text-xl font-bold text-gray-900 mb-4">Rotas for this Occurrence</h3>
		
		{#if rotas.length === 0}
			<p class="text-gray-500">No rotas assigned to this occurrence.</p>
		{:else}
			<div class="space-y-6">
				{#each rotas as rota}
					<div class="border border-gray-200 rounded-lg p-4">
						<div class="flex justify-between items-start mb-3">
							<div>
								<h4 class="text-lg font-semibold text-gray-900">{rota.role}</h4>
								{#if rota.description}
									<p class="text-sm text-gray-600 mt-1">{rota.description}</p>
								{/if}
							</div>
							<div class="text-right">
								<div class="text-sm text-gray-600">
									<span class="font-medium text-brand-blue">{rota.assignedCount}</span> / <span class="text-gray-500">{rota.capacity || '∞'}</span>
								</div>
								<div class="text-xs text-gray-500 mt-1">
									{#if rota.spotsRemaining > 0}
										<span class="text-green-600">{rota.spotsRemaining} spots remaining</span>
									{:else if rota.spotsRemaining === 0}
										<span class="text-red-600">Full</span>
									{/if}
								</div>
							</div>
						</div>

						{#if rota.assigneesForOcc && rota.assigneesForOcc.length > 0}
							<div class="mt-4">
								<h5 class="text-sm font-medium text-gray-700 mb-2">Signed Up:</h5>
								<ul class="space-y-1">
									{#each rota.assigneesForOcc as assignee}
										<li class="text-sm text-gray-600 flex items-center gap-2">
											<span class="w-2 h-2 bg-brand-green rounded-full"></span>
											<span>{assignee.name}</span>
											{#if assignee.email}
												<span class="text-gray-400">({assignee.email})</span>
											{/if}
										</li>
									{/each}
								</ul>
							</div>
						{:else}
							<p class="text-sm text-gray-500 mt-2">No one signed up yet.</p>
						{/if}

						<div class="mt-3">
							<a 
								href="/hub/rotas/{rota.id}" 
								class="text-sm text-brand-blue hover:text-brand-blue/80 underline"
							>
								View rota details →
							</a>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}

