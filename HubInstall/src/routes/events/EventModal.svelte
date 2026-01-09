<script>
	export let event = null;
	export let occurrences = [];
	export let eventLink = '';
	export let selectedOccurrence = null;
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
			class="bg-gray-50 rounded-lg shadow-2xl max-w-7xl w-full my-8 transform transition-all modal-container max-h-[90vh] overflow-hidden flex flex-col"
			on:click|stopPropagation
		>
			<!-- Close Button -->
			<div class="flex justify-end p-4 border-b border-gray-200 bg-white">
				<button
					on:click={closeModal}
					class="text-gray-500 hover:text-gray-700 transition-all hover:rotate-90 hover:scale-110 rounded-full p-2 hover:bg-gray-100"
					aria-label="Close modal"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Content - Scrollable -->
			<div class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
				<div class="max-w-4xl mx-auto">
					<!-- Event Details -->
					<div class="bg-white shadow rounded-lg p-6">
						<h1 id="event-modal-title" class="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
						
						<!-- Date and Time -->
						{#if selectedOccurrence}
							<div class="mb-4 pb-4 border-b border-gray-200">
								<div class="text-lg font-semibold text-gray-900 mb-1">
									{formatDate(selectedOccurrence.startsAt)}
								</div>
								<div class="text-sm text-gray-600">
									{formatTime(selectedOccurrence.startsAt)} - {formatTime(selectedOccurrence.endsAt)}
								</div>
								{#if selectedOccurrence.location}
									<div class="text-sm text-gray-600 mt-1">
										📍 {selectedOccurrence.location}
									</div>
								{/if}
							</div>
						{/if}
						
						{#if event.description}
							<div class="prose max-w-none mb-4">
								{@html event.description}
							</div>
						{/if}
						{#if event.location && (!selectedOccurrence || selectedOccurrence.location !== event.location)}
							<p class="text-gray-600">
								<strong>Location:</strong> {event.location}
							</p>
						{/if}
					</div>
				</div>
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
