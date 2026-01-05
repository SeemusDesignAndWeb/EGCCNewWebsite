<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { formatDateTimeUK } from '$lib/crm/utils/dateFormat.js';

	$: data = $page.data || {};
	$: events = data.events || [];
	$: rotas = data.rotas || [];
	$: occurrences = data.occurrences || [];
	$: contacts = data.contacts || [];
	$: lists = data.lists || [];
	$: csrfToken = data.csrfToken || '';

	let selectedEventId = '';
	let selectedRotaIds = [];
	let selectedOccurrenceIds = [];
	let selectedListId = '';
	let sending = false;
	let results = null;

	$: filteredRotas = selectedEventId 
		? rotas.filter(r => r.eventId === selectedEventId)
		: [];

	$: filteredOccurrences = selectedEventId
		? occurrences.filter(o => o.eventId === selectedEventId)
		: [];

	async function sendInvites() {
		if (!selectedEventId || selectedRotaIds.length === 0 || !selectedListId) {
			await dialog.alert('Please select an event, at least one rota, and a contact list', 'Validation Error');
			return;
		}

		sending = true;
		results = null;

		try {
			const response = await fetch('/hub/rotas/invite/send', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					_csrf: csrfToken,
					eventId: selectedEventId,
					rotaIds: selectedRotaIds,
					occurrenceIds: selectedOccurrenceIds,
					listId: selectedListId
				})
			});

			const data = await response.json();
			results = data;
		} catch (error) {
			results = { error: error.message };
		} finally {
			sending = false;
		}
	}
</script>

<div class="bg-white shadow rounded-lg p-6">
	<h2 class="text-2xl font-bold text-gray-900 mb-6">Bulk Rota Invitations</h2>

	<div class="space-y-4">
		<div>
			<label class="block text-sm font-medium text-gray-700 mb-1">Event</label>
			<select bind:value={selectedEventId} class="w-full rounded-md border border-gray-500 shadow-sm focus:border-green-500 focus:ring-green-500 py-3 px-4">
				<option value="">Select an event</option>
				{#each events as event}
					<option value={event.id}>{event.title}</option>
				{/each}
			</select>
		</div>

		{#if filteredRotas.length > 0}
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Rotas</label>
				<div class="space-y-2">
					{#each filteredRotas as rota}
						<label class="flex items-center">
							<input type="checkbox" bind:group={selectedRotaIds} value={rota.id} class="mr-2" />
							<span>{rota.role} (Capacity: {rota.capacity})</span>
						</label>
					{/each}
				</div>
			</div>
		{/if}

		{#if filteredOccurrences.length > 0}
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Occurrences (optional)</label>
				<div class="space-y-2">
					{#each filteredOccurrences as occurrence}
						<label class="flex items-center">
							<input type="checkbox" bind:group={selectedOccurrenceIds} value={occurrence.id} class="mr-2" />
							<span>{formatDateTimeUK(occurrence.startsAt)}</span>
						</label>
					{/each}
				</div>
			</div>
		{/if}

		<div>
			<label class="block text-sm font-medium text-gray-700 mb-1">Contact List</label>
			<select bind:value={selectedListId} class="w-full rounded-md border border-gray-500 shadow-sm focus:border-green-500 focus:ring-green-500 py-3 px-4">
				<option value="">Select a list</option>
				{#each lists as list}
					<option value={list.id}>{list.name}</option>
				{/each}
			</select>
		</div>

		<button
			on:click={sendInvites}
			disabled={sending}
			class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
		>
			{sending ? 'Sending...' : 'Send Invitations'}
		</button>
	</div>

	{#if results}
		<div class="mt-6 p-4 bg-gray-50 rounded-md">
			<h3 class="font-bold mb-2">Results</h3>
			{#if results.error}
				<p class="text-red-600">{results.error}</p>
			{:else if results.results}
				<p class="text-green-600">Sent {results.results.filter(r => r.status === 'sent').length} invitations</p>
				{#if results.results.some(r => r.status === 'error')}
					<p class="text-red-600">Some errors occurred. Check console for details.</p>
				{/if}
			{/if}
		</div>
	{/if}
</div>

