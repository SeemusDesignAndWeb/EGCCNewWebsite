<script>
	export let event = null;
	export let occurrences = [];
	export let eventLink = '';
	export let open = false;

	function formatDate(dateString) {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-GB', { 
			weekday: 'long',
			day: 'numeric', 
			month: 'long', 
			year: 'numeric' 
		});
	}

	function formatTime(dateString) {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleTimeString('en-GB', { 
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatDateTime(dateString) {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-GB', { 
			day: 'numeric', 
			month: 'short', 
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function handleClickOutside(e) {
		if (e.target === e.currentTarget) {
			open = false;
		}
	}

	function handleEscape(e) {
		if (e.key === 'Escape') {
			open = false;
		}
	}
	
	function closeModal() {
		open = false;
	}
</script>

<svelte:window on:keydown={handleEscape} />

{#if open && event}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4 backdrop-blur-sm overflow-y-auto"
		on:click={handleClickOutside}
		role="dialog"
		aria-modal="true"
		aria-labelledby="event-modal-title"
	>
		<div
			class="bg-white rounded-lg shadow-2xl max-w-2xl w-full my-8 transform transition-all modal-container"
			on:click|stopPropagation
		>
			<!-- Header -->
			<div class="bg-gradient-to-r from-brand-blue to-primary text-white p-6 rounded-t-lg">
				<div class="flex justify-between items-start">
					<div class="flex-1">
						<h2 id="event-modal-title" class="text-2xl md:text-3xl font-bold mb-2">
							{event.title}
						</h2>
						{#if event.location}
							<p class="text-white/90 text-sm flex items-center gap-2 mt-2">
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
								{event.location}
							</p>
						{/if}
					</div>
					<button
						on:click={closeModal}
						class="text-white hover:text-gray-200 transition-all hover:rotate-90 hover:scale-110 bg-white/10 backdrop-blur-sm rounded-full p-2 flex-shrink-0 ml-4"
						aria-label="Close modal"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>

			<!-- Content -->
			<div class="p-6 max-h-[70vh] overflow-y-auto">
				{#if event.description}
					<div class="prose max-w-none mb-6">
						{@html event.description}
					</div>
				{/if}

				<!-- Occurrences -->
				{#if occurrences.length > 0}
					<div class="mb-6">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">Upcoming Dates</h3>
						<div class="space-y-3">
							{#each occurrences.slice(0, 5) as occ}
								<div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
									<div class="flex items-start gap-3">
										<div class="flex-shrink-0">
											<div class="bg-brand-blue/10 rounded-lg p-2">
												<svg class="w-5 h-5 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
												</svg>
											</div>
										</div>
										<div class="flex-1 min-w-0">
											<div class="font-medium text-gray-900">
												{formatDate(occ.startsAt)}
											</div>
											<div class="text-sm text-gray-600 mt-1">
												{formatTime(occ.startsAt)} - {formatTime(occ.endsAt)}
											</div>
											{#if occ.location}
												<div class="text-sm text-gray-500 mt-1">
													📍 {occ.location}
												</div>
											{/if}
										</div>
									</div>
								</div>
							{/each}
							{#if occurrences.length > 5}
								<p class="text-sm text-gray-500 text-center pt-2">
									+{occurrences.length - 5} more occurrence{occurrences.length - 5 === 1 ? '' : 's'}
								</p>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Action Buttons -->
				{#if eventLink}
					<div class="flex gap-3 pt-4 border-t border-gray-200">
						<a
							href={eventLink}
							target="_blank"
							rel="noopener noreferrer"
							class="flex-1 bg-brand-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all text-center"
						>
							View Full Details
						</a>
						<button
							on:click={closeModal}
							class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
						>
							Close
						</button>
					</div>
				{:else}
					<div class="flex justify-end pt-4 border-t border-gray-200">
						<button
							on:click={closeModal}
							class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
						>
							Close
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-container {
		animation: slideInScale 0.3s ease-out;
	}
	
	@keyframes slideInScale {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(-20px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}
</style>

