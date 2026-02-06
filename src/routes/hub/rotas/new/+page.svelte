<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import FormField from '$lib/crm/components/FormField.svelte';
	import { formatDateTimeUK } from '$lib/crm/utils/dateFormat.js';
	import HtmlEditor from '$lib/crm/components/HtmlEditor.svelte';
	import { notifications } from '$lib/crm/stores/notifications.js';

	$: data = $page.data || {};
	$: events = data.events || [];
	$: occurrences = data.occurrences || [];
	$: contacts = data.contacts || [];
	$: formResult = $page.form;
	$: csrfToken = data.csrfToken || '';
	
	// Show notifications from form results
	$: if (formResult?.error) {
		notifications.error(formResult.error);
	}

	let notes = '';
	let ownerSearchTerm = '';
	let filteredOwnerContacts = [];
	let formData = {
		eventId: '',
		occurrenceId: '',
		role: '',
		capacity: 1,
		ownerId: '',
		visibility: 'public'
	};
	
	// Initialize formData.eventId from URL parameter only once, not reactively
	let initialized = false;
	$: if (data.eventId && !initialized) {
		formData.eventId = data.eventId;
		initialized = true;
	}

	$: filteredOccurrences = formData.eventId
		? occurrences.filter(o => o.eventId === formData.eventId)
		: [];

	$: filteredOwnerContacts = (() => {
		if (!contacts || contacts.length === 0) {
			return [];
		}
		
		// Start with all contacts or filtered by search term
		let filtered = ownerSearchTerm
			? contacts.filter(c => 
				(c.email || '').toLowerCase().includes(ownerSearchTerm.toLowerCase()) ||
				(c.firstName || '').toLowerCase().includes(ownerSearchTerm.toLowerCase()) ||
				(c.lastName || '').toLowerCase().includes(ownerSearchTerm.toLowerCase())
			)
			: [...contacts]; // Create a copy to avoid mutation issues
		
		// Always include the currently selected owner if they exist, even if they don't match the search
		if (formData.ownerId) {
			const selectedOwner = contacts.find(c => c.id === formData.ownerId);
			if (selectedOwner) {
				// Check if selected owner is already in the filtered list
				const isInFiltered = filtered.some(c => c.id === selectedOwner.id);
				if (!isInFiltered) {
					// Add selected owner at the beginning
					filtered = [selectedOwner, ...filtered];
				}
			}
		}
		
		return filtered;
	})();
	
	// Log when ownerId changes
	$: if (formData.ownerId) {
		console.log('[Rota New] formData.ownerId changed to:', formData.ownerId);
	}

	// Help Files
	let helpFiles = [];
	let showAddHelpFile = false;
	let helpFileType = 'link'; // 'link' or 'file'
	let helpFileUrl = '';
	let helpFileTitle = '';

	function handleAddHelpFile() {
		if (helpFileType === 'link') {
			if (!helpFileUrl || !helpFileTitle) {
				notifications.error('Please provide both URL and title');
				return;
			}
			helpFiles = [...helpFiles, { type: 'link', url: helpFileUrl, title: helpFileTitle }];
			showAddHelpFile = false;
			helpFileUrl = '';
			helpFileTitle = '';
		}
	}

	function handleRemoveHelpFile(index) {
		helpFiles = helpFiles.filter((_, i) => i !== index);
	}

	function handleEnhance() {
		return async ({ update, result }) => {
			if (result.type === 'redirect') {
				notifications.success('Rota created successfully');
			} else if (result.type === 'failure') {
				notifications.error(result.data?.error || 'Failed to create rota');
			}
			await update();
		};
	}
</script>

<div class="bg-white shadow rounded-lg p-6">
	<div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
		<h2 class="text-xl sm:text-2xl font-bold text-gray-900">New Rota</h2>
		<div class="flex flex-wrap gap-2">
			<a href="/hub/rotas" class="bg-theme-button-3 text-white px-2.5 py-1.5 rounded-md hover:opacity-90 text-xs">
				Cancel
			</a>
			<button type="submit" form="rota-create-form" class="bg-theme-button-2 text-white px-2.5 py-1.5 rounded-md hover:opacity-90 text-xs">
				<span class="hidden sm:inline">Create Rota</span>
				<span class="sm:hidden">Create</span>
			</button>
		</div>
	</div>

	<form id="rota-create-form" method="POST" action="?/create" use:enhance={handleEnhance}>
		<input type="hidden" name="_csrf" value={csrfToken} />
		<input type="hidden" name="notes" bind:value={notes} />
		<input type="hidden" name="helpFiles" value={JSON.stringify(helpFiles)} />
		
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
			<!-- Basic Information Panel -->
			<div class="border border-gray-200 rounded-lg p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Event</label>
						<select name="eventId" bind:value={formData.eventId} required class="w-full rounded-md border border-gray-500 shadow-sm focus:border-theme-button-2 focus:ring-theme-button-2 py-3 px-4">
							<option value="">Select an event</option>
							{#each events as event}
								<option value={event.id}>{event.title}</option>
							{/each}
						</select>
						<p class="mt-1 text-xs text-gray-500">Select the event that this rota belongs to</p>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
						<select name="visibility" bind:value={formData.visibility} class="w-full rounded-md border border-gray-500 shadow-sm focus:border-theme-button-2 focus:ring-theme-button-2 py-3 px-4">
							<option value="public">Public</option>
							<option value="internal">Internal</option>
						</select>
						<p class="mt-1 text-xs text-gray-500">Public rotas can be accessed via signup links. Internal rotas are only visible to admins.</p>
					</div>
					{#if filteredOccurrences.length > 0}
						<div class="md:col-span-2">
							<label class="block text-sm font-medium text-gray-700 mb-1">Occurrence (optional)</label>
							<select name="occurrenceId" bind:value={formData.occurrenceId} class="w-full rounded-md border border-gray-500 shadow-sm focus:border-theme-button-2 focus:ring-theme-button-2 py-3 px-4">
								<option value="">All occurrences (recurring)</option>
								{#each filteredOccurrences as occurrence}
									<option value={occurrence.id}>{formatDateTimeUK(occurrence.startsAt)}</option>
								{/each}
							</select>
							<p class="mt-1 text-xs text-gray-500">Optionally link this rota to a specific occurrence of the event</p>
						</div>
					{/if}
					<FormField label="Rota name" name="role" bind:value={formData.role} required helpText="The name of the rota (e.g. 'Worship Team', 'Welcome Team')" />
					<FormField label="Number of people needed" name="capacity" type="number" bind:value={formData.capacity} required helpText="The number of people needed for this rota" />
				</div>
			</div>

			<!-- Owner Panel -->
			<div class="border border-gray-200 rounded-lg p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Owner</h3>
				<div class="space-y-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Search Owner (optional)</label>
						<p class="text-xs text-gray-500 mb-2">Use the search box to find a person, then select them from the list below</p>
						<input
							type="text"
							bind:value={ownerSearchTerm}
							placeholder="Search by name or email..."
							class="w-full rounded-md border border-gray-500 shadow-sm focus:border-theme-button-2 focus:ring-theme-button-2 py-3 px-4"
						/>
					</div>
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Select Owner</label>
						<select 
							name="ownerId" 
							value={formData.ownerId || ''}
							on:change={(e) => {
								formData.ownerId = e.target.value || '';
							}}
							class="w-full rounded-md border border-gray-500 shadow-sm focus:border-theme-button-2 focus:ring-theme-button-2 py-3 px-4"
						>
							<option value="">No owner</option>
							{#each filteredOwnerContacts as contact (contact.id)}
								{@const contactId = String(contact.id || '')}
								<option value={contactId} selected={formData.ownerId === contactId}>
								{`${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email} {contact.email ? `(${contact.email})` : ''}
								</option>
							{/each}
						</select>
						<p class="mt-1 text-xs text-gray-500">The owner will be notified when this rota is updated</p>
					</div>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
			<!-- Notes Panel -->
			<div class="border border-gray-200 rounded-lg p-6 h-full">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
				<div>
					<HtmlEditor bind:value={notes} name="notes" />
				</div>
			</div>

			<!-- Help Files Panel -->
			<div class="border border-gray-200 rounded-lg p-6 h-full">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Help Files</h3>
				<p class="text-sm text-gray-600 mb-4">Add documents or links that people can download when signing up for this rota.</p>
				
				<!-- Existing Help Files -->
				{#if helpFiles.length > 0}
					<div class="space-y-2 mb-4">
						{#each helpFiles as helpFile, index}
							<div class="flex items-center justify-between p-3 bg-gray-50 rounded-md">
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2">
										<svg class="w-5 h-5 text-hub-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
										</svg>
										<div class="min-w-0 flex-1">
											<div class="font-medium text-sm text-gray-900 truncate">{helpFile.title}</div>
											<div class="text-xs text-gray-500 truncate">{helpFile.url}</div>
										</div>
									</div>
								</div>
								<button
									type="button"
									on:click={() => handleRemoveHelpFile(index)}
									class="text-hub-red-600 hover:text-hub-red-800 px-2 py-1 rounded text-sm ml-2 flex-shrink-0"
									title="Remove help file"
								>
									×
								</button>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Add Help File Form -->
				<div class="border-t border-gray-200 pt-4">
					<div class="mb-3">
						<div class="block text-sm font-medium text-gray-700 mb-2">Choose to add a link to a file or upload a file</div>
						<div class="flex gap-2 mb-2">
							<button
								type="button"
								on:click={() => { showAddHelpFile = true; helpFileType = 'link'; }}
								class="flex-1 bg-theme-button-1 text-white px-3 py-2 rounded-md hover:opacity-90 text-sm"
							>
								Add Link
							</button>
							<div class="flex-1 relative group">
								<button
									type="button"
									disabled
									class="w-full bg-theme-button-2 text-white px-3 py-2 rounded-md opacity-50 cursor-not-allowed text-sm"
								>
									Upload PDF
								</button>
								<div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity text-center pointer-events-none z-10">
									Save rota first to upload files
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</form>

	<!-- Add Help File Modal -->
	{#if showAddHelpFile}
		<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="button" tabindex="0" on:click={() => { showAddHelpFile = false; helpFileUrl = ''; helpFileTitle = ''; }} on:keydown={(e) => e.key === 'Escape' && (showAddHelpFile = false)} aria-label="Close modal">
			<div class="bg-white rounded-lg max-w-md w-full p-6" on:click|stopPropagation role="dialog" aria-modal="true">
				<h3 class="text-lg font-bold text-gray-900 mb-4">Add Link</h3>
				
				<div class="space-y-4">
					<div>
						<label for="help-file-url" class="block text-sm font-medium text-gray-700 mb-1">URL <span class="text-hub-red-500">*</span></label>
						<input
							id="help-file-url"
							type="url"
							bind:value={helpFileUrl}
							placeholder="https://example.com/document.pdf"
							class="w-full rounded-md border border-gray-500 shadow-sm focus:border-theme-button-2 focus:ring-theme-button-2 py-2 px-3 text-sm"
						/>
					</div>
					<div>
						<label for="help-file-title" class="block text-sm font-medium text-gray-700 mb-1">Title <span class="text-hub-red-500">*</span></label>
						<input
							id="help-file-title"
							type="text"
							bind:value={helpFileTitle}
							placeholder="Document Title"
							class="w-full rounded-md border border-gray-500 shadow-sm focus:border-theme-button-2 focus:ring-theme-button-2 py-2 px-3 text-sm"
						/>
					</div>
				</div>

				<div class="mt-6 flex gap-2 justify-end">
					<button
						type="button"
						on:click={() => { showAddHelpFile = false; helpFileUrl = ''; helpFileTitle = ''; }}
						class="bg-theme-button-3 text-white px-4 py-2 rounded-md hover:opacity-90 text-sm"
					>
						Cancel
					</button>
					<button
						type="button"
						on:click={handleAddHelpFile}
						disabled={!helpFileUrl || !helpFileTitle}
						class="bg-theme-button-2 text-white px-4 py-2 rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
					>
						Add
					</button>
				</div>
			</div>
		</div>
	{/if}

</div>

