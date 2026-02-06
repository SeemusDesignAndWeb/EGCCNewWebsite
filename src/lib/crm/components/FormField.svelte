<script>
	export let label = '';
	export let name = '';
	export let type = 'text';
	export let value = '';
	export let error = '';
	export let required = false;
	export let placeholder = '';
	export let rows = 3;
	export let helpText = '';
	
	// Convert value to string for input binding
	$: stringValue = type === 'number' 
		? (value?.toString() || '') 
		: type === 'date' 
			? (value ? (value instanceof Date ? value.toISOString().split('T')[0] : value.split('T')[0]) : '')
			: type === 'datetime-local'
				? (value ? (value instanceof Date ? value.toISOString().slice(0, 16) : value.slice(0, 16)) : '')
				: (value || '');
	
	function handleInput(event) {
		if (type === 'number') {
			value = event.target.value ? Number(event.target.value) : 0;
		} else if (type === 'date' || type === 'datetime-local') {
			value = event.target.value || null;
		} else {
			value = event.target.value;
		}
	}
</script>

<div class="mb-4">
	<label for={name} class="block text-sm font-medium text-gray-700 mb-1">
		{label}
		{#if required}
			<span class="text-red-500">*</span>
		{/if}
	</label>
	{#if type === 'textarea'}
		<textarea
			id={name}
			name={name}
			rows={rows}
			placeholder={placeholder}
			required={required}
			value={stringValue}
			on:input={handleInput}
			class="mt-1 block w-full rounded-md border border-gray-500 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-3 px-4 {error ? 'border-red-500' : ''}"
		></textarea>
	{:else if type === 'select'}
		<slot />
	{:else}
		<input
			type={type}
			id={name}
			name={name}
			value={stringValue}
			on:input={handleInput}
			placeholder={placeholder}
			required={required}
			class="mt-1 block w-full rounded-md border border-gray-500 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm py-3 px-4 {error ? 'border-red-500' : ''}"
		/>
	{/if}
	{#if error}
		<p class="mt-1 text-sm text-red-600">{error}</p>
	{/if}
	{#if helpText && !error}
		<p class="mt-1 text-xs text-gray-500">{helpText}</p>
	{/if}
</div>

