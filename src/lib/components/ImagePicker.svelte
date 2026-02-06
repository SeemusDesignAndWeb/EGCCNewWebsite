<script lang="js">
	import { onMount, createEventDispatcher } from 'svelte';

	export let open = false;
	export let onSelect; // Legacy prop support for backward compatibility
	/** Use '/hub/api/images' when in Hub (event edit, etc.) so the library loads without admin auth */
	export let imagesApiUrl = '/api/images';

	const dispatch = createEventDispatcher();

	let images = [];
	let loading = false;
	let searchTerm = '';

	onMount(async () => {
		if (open) {
			await loadImages();
		}
	});

	$: if (open) {
		loadImages();
	}

	async function loadImages() {
		loading = true;
		try {
			const response = await fetch(imagesApiUrl);
			if (response.ok) {
				const data = await response.json();
				images = Array.isArray(data) ? data : [];
			}
		} catch (error) {
			console.error('Failed to load images:', error);
		} finally {
			loading = false;
		}
	}

	function handleSelect(image) {
		const imagePath = image.path;
		// Support both event dispatcher and legacy prop
		dispatch('select', imagePath);
		if (onSelect && typeof onSelect === 'function') {
			onSelect(imagePath);
		}
		open = false;
	}

	function handleClose() {
		dispatch('close');
		open = false;
	}

	$: filteredImages = searchTerm
		? images.filter(
				(img) =>
					img.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
					img.path.toLowerCase().includes(searchTerm.toLowerCase())
			)
		: images;
</script>

{#if open}
	<div
		class="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4 overflow-y-auto"
		on:click={handleClose}
		role="button"
		tabindex="0"
		on:keydown={(e) => e.key === 'Escape' && handleClose()}
	>
		<div
			class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] my-8 overflow-hidden flex flex-col relative"
			on:click|stopPropagation
		>
			<!-- Header -->
			<div class="p-6 border-b flex justify-between items-center">
				<h2 class="text-2xl font-bold">Select Image</h2>
				<button
					on:click={handleClose}
					class="text-gray-500 hover:text-gray-700 text-2xl leading-none"
					aria-label="Close"
				>
					×
				</button>
			</div>

			<!-- Search -->
			<div class="p-4 border-b">
				<input
					type="text"
					bind:value={searchTerm}
					placeholder="Search images..."
					class="w-full px-4 py-2 border rounded"
				/>
			</div>

			<!-- Images Grid -->
			<div class="flex-1 overflow-y-auto p-4">
				{#if loading}
					<div class="text-center py-8">Loading images...</div>
				{:else if filteredImages.length === 0}
					<div class="text-center py-8 text-gray-500">
						{searchTerm ? 'No images found matching your search.' : 'No images available.'}
					</div>
				{:else}
					<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
						{#each filteredImages as image}
							<div
								class="border rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-colors"
								on:click={() => handleSelect(image)}
								role="button"
								tabindex="0"
								on:keydown={(e) => e.key === 'Enter' && handleSelect(image)}
							>
								<div class="aspect-square bg-gray-100">
									<img
										src={image.path}
										alt={image.originalName}
										class="w-full h-full object-cover"
									/>
								</div>
								<div class="p-2">
									<p class="text-xs truncate" title={image.originalName}>
										{image.originalName}
									</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="p-4 border-t flex justify-end">
				<button
					on:click={handleClose}
					class="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	:global(body:has([class*="z-[9999]"])) {
		overflow: hidden;
	}
</style>

