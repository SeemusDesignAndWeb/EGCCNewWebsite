<script>
	import { createEventDispatcher, onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	
	export let options = [];
	export let selected = [];
	export let name = '';
	export let placeholder = 'Select options...';
	export let label = '';
	
	let isOpen = false;
	let dropdownRef;
	let containerRef;
	let buttonId = `multiselect-${Math.random().toString(36).substring(2, 11)}`;
	
	const dispatch = createEventDispatcher();
	
	function toggleDropdown() {
		isOpen = !isOpen;
	}
	
	function selectOption(optionId) {
		if (selected.includes(optionId)) {
			selected = selected.filter(id => id !== optionId);
		} else {
			selected = [...selected, optionId];
		}
		dispatch('change', selected);
	}
	
	function handleClickOutside(event) {
		if (containerRef && !containerRef.contains(event.target)) {
			isOpen = false;
		}
	}
	
	onMount(() => {
		if (browser) {
			document.addEventListener('click', handleClickOutside);
		}
	});
	
	onDestroy(() => {
		if (browser) {
			document.removeEventListener('click', handleClickOutside);
		}
	});
	
	$: selectedLabels = selected.map(id => {
		const option = options.find(opt => opt.id === id || opt.value === id);
		return option ? (option.name || option.label || option.id || option.value) : id;
	});
	
	$: displayText = selectedLabels.length > 0 
		? `${selectedLabels.length} selected` 
		: placeholder;
</script>

<div class="relative" bind:this={containerRef}>
	<label for={buttonId} class="block text-xs font-bold text-gray-700 mb-1">{label}</label>
	<button
		id={buttonId}
		type="button"
		on:click={toggleDropdown}
		aria-expanded={isOpen}
		aria-haspopup="listbox"
		class="mt-1 block w-full rounded-md border border-gray-500 shadow-sm focus:border-hub-green-500 focus:ring-hub-green-500 py-1.5 px-2 text-xs text-left bg-white flex items-center justify-between min-h-[38px]"
	>
		<span class="flex-1 truncate">
			{#if selectedLabels.length > 0}
				<span class="flex flex-wrap gap-1">
					{#each selectedLabels.slice(0, 2) as selectedLabel}
						<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-hub-blue-100 text-hub-blue-800">
							{selectedLabel}
						</span>
					{/each}
					{#if selectedLabels.length > 2}
						<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-hub-blue-100 text-hub-blue-800">
							+{selectedLabels.length - 2} more
						</span>
					{/if}
				</span>
			{:else}
				<span class="text-gray-500">{placeholder}</span>
			{/if}
		</span>
		<svg
			class="w-4 h-4 text-gray-400 flex-shrink-0 ml-2 transition-transform {isOpen ? 'rotate-180' : ''}"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>
	
	{#if isOpen}
		<div
			class="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
			bind:this={dropdownRef}
		>
			{#each options as option}
				{@const optionId = option.id || option.value}
				{@const isSelected = selected.includes(optionId)}
				<button
					type="button"
					on:click={() => selectOption(optionId)}
					class="w-full text-left px-3 py-2 text-xs hover:bg-gray-100 flex items-center {isSelected ? 'bg-hub-blue-50' : ''}"
				>
					<div class="flex items-center flex-1">
						<div class="w-4 h-4 border border-gray-300 rounded mr-2 flex items-center justify-center {isSelected ? 'bg-hub-green-600 border-hub-green-600' : ''}">
							{#if isSelected}
								<svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
							{/if}
						</div>
						<span>{option.name || option.label || optionId}</span>
					</div>
				</button>
			{:else}
				<div class="px-3 py-2 text-xs text-gray-500">No options available</div>
			{/each}
		</div>
	{/if}
	
	<!-- Hidden inputs for form submission -->
	{#each selected as selectedId}
		<input type="hidden" name={name} value={selectedId} />
	{/each}
</div>
