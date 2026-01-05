<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import FormField from '$lib/crm/components/FormField.svelte';
	import HtmlEditor from '$lib/crm/components/HtmlEditor.svelte';
	import Table from '$lib/crm/components/Table.svelte';
	import { formatDateTimeUK } from '$lib/crm/utils/dateFormat.js';
	import { notifications } from '$lib/crm/stores/notifications.js';
	import { dialog } from '$lib/crm/stores/notifications.js';

	$: event = $page.data?.event;
	$: occurrences = $page.data?.occurrences || [];
	$: rotas = $page.data?.rotas || [];
	$: signupLink = $page.data?.signupLink || '';
	$: csrfToken = $page.data?.csrfToken || '';
	$: formResult = $page.form;
	
	let linkCopied = false;

	async function copySignupLink() {
		if (!signupLink) return;
		try {
			await navigator.clipboard.writeText(signupLink);
			linkCopied = true;
			notifications.success('Signup link copied to clipboard!');
			setTimeout(() => {
				linkCopied = false;
			}, 2000);
		} catch (error) {
			notifications.error('Failed to copy link');
		}
	}
	
	// Show notifications from form results
	$: if (formResult?.success) {
		notifications.success('Event updated successfully');
	}
	$: if (formResult?.error) {
		notifications.error(formResult.error);
	}

	let editing = false;
	let description = event?.description || '';
	let formData = {
		title: event?.title || '',
		location: event?.location || '',
		visibility: event?.visibility || 'private'
	};

	$: if (event) {
		formData = {
			title: event.title || '',
			location: event.location || '',
			visibility: event.visibility || 'private'
		};
		description = event.description || '';
	}

	async function handleDelete() {
		const confirmed = await dialog.confirm('Are you sure you want to delete this event? This will also delete all occurrences and rotas.', 'Delete Event');
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

	const occurrenceColumns = [
		{ 
			key: 'startsAt', 
			label: 'Start',
			render: (val) => val ? formatDateTimeUK(val) : ''
		},
		{ 
			key: 'endsAt', 
			label: 'End',
			render: (val) => val ? formatDateTimeUK(val) : ''
		},
		{ key: 'location', label: 'Location' },
		{ 
			key: 'rotaStats', 
			label: 'Rotas',
			render: (stats) => {
				if (!stats) return '-';
				return `${stats.rotaCount} rota${stats.rotaCount !== 1 ? 's' : ''}`;
			}
		},
		{ 
			key: 'rotaStats', 
			label: 'Rota Spots',
			render: (stats) => {
				if (!stats) return '-';
				const { totalAssigned, totalCapacity, spotsRemaining } = stats;
				if (totalCapacity === 0) return '-';
				return `${totalAssigned}/${totalCapacity} (${spotsRemaining} remaining)`;
			}
		}
	];

	const rotaColumns = [
		{ key: 'role', label: 'Role' },
		{ key: 'capacity', label: 'Capacity' },
		{ 
			key: 'assignees', 
			label: 'Assigned',
			render: (val) => Array.isArray(val) ? val.length : 0
		}
	];
</script>

{#if event}
	<div class="bg-white shadow rounded-lg p-6 mb-6">
		<div class="flex justify-between items-center mb-6">
			<h2 class="text-2xl font-bold text-gray-900">Event Details</h2>
			<div class="flex gap-2">
				{#if editing}
					<button
						on:click={() => editing = false}
						class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
					>
						Cancel
					</button>
				{:else}
					<a
						href="/hub/events/{event.id}/ics"
						class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
						download
					>
						Download ICS
					</a>
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
				<input type="hidden" name="description" value={description} />
				<FormField label="Title" name="title" bind:value={formData.title} required />
				<div class="mb-4">
					<label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
					<HtmlEditor bind:value={description} name="description" />
				</div>
				<FormField label="Location" name="location" bind:value={formData.location} />
				<div class="mb-4">
					<label class="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
					<select name="visibility" bind:value={formData.visibility} class="mt-1 block w-full rounded-md border border-gray-500 shadow-sm focus:border-green-500 focus:ring-green-500 py-3 px-4">
						<option value="private">Private</option>
						<option value="public">Public</option>
					</select>
				</div>
				<button type="submit" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
					Save Changes
				</button>
			</form>
		{:else}
			<dl class="grid grid-cols-1 gap-4">
				<div>
					<dt class="text-sm font-medium text-gray-500">Title</dt>
					<dd class="mt-1 text-sm text-gray-900">{event.title}</dd>
				</div>
				{#if event.description}
					<div>
						<dt class="text-sm font-medium text-gray-500">Description</dt>
						<dd class="mt-1 text-sm text-gray-900">{@html event.description}</dd>
					</div>
				{/if}
				{#if event.location}
					<div>
						<dt class="text-sm font-medium text-gray-500">Location</dt>
						<dd class="mt-1 text-sm text-gray-900">{event.location}</dd>
					</div>
				{/if}
				<div>
					<dt class="text-sm font-medium text-gray-500">Visibility</dt>
					<dd class="mt-1 text-sm text-gray-900">{event.visibility || 'private'}</dd>
				</div>
			</dl>
		{/if}

		{#if signupLink}
			<div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
				<h3 class="text-lg font-semibold text-blue-900 mb-2">Link for Rota Signup</h3>
				<p class="text-sm text-blue-700 mb-3">Share this link to allow people to sign up for rotas at this event</p>
				<div class="flex items-center gap-2">
					<input
						type="text"
						readonly
						value={signupLink}
						class="flex-1 rounded-md border border-blue-300 bg-white px-4 py-2 text-sm text-gray-900"
					/>
					<button
						on:click={copySignupLink}
						class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2"
					>
						{#if linkCopied}
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
							</svg>
							Copied!
						{:else}
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
							</svg>
							Copy Link
						{/if}
					</button>
				</div>
				<a
					href={signupLink}
					target="_blank"
					rel="noopener noreferrer"
					class="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800 underline"
				>
					Open signup page in new tab
				</a>
			</div>
		{/if}

	</div>

	<div class="bg-white shadow rounded-lg p-6 mb-6">
		<div class="flex justify-between items-center mb-4">
			<h3 class="text-xl font-bold text-gray-900">Occurrences</h3>
			<a href="/hub/events/{event.id}/occurrences/new" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
				Add Occurrence
			</a>
		</div>
		<Table columns={occurrenceColumns} rows={occurrences} onRowClick={(row) => goto(`/hub/events/${event.id}/occurrences/${row.id}`)} />
	</div>

	<div class="bg-white shadow rounded-lg p-6">
		<div class="flex justify-between items-center mb-4">
			<h3 class="text-xl font-bold text-gray-900">Rotas</h3>
			<a href="/hub/rotas/new?eventId={event.id}" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
				Add Rota
			</a>
		</div>
		<Table columns={rotaColumns} rows={rotas} onRowClick={(row) => goto(`/hub/rotas/${row.id}`)} />
	</div>
{/if}

