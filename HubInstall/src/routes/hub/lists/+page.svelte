<script>
	import { page } from '$app/stores';
	import Table from '$lib/crm/components/Table.svelte';
	import Pager from '$lib/crm/components/Pager.svelte';
	import { goto } from '$app/navigation';
	import { formatDateUK } from '$lib/crm/utils/dateFormat.js';

	$: data = $page.data || {};
	$: lists = data.lists || [];
	$: currentPage = data.currentPage || 1;
	$: totalPages = data.totalPages || 1;
	$: search = data.search || '';

	let searchInput = search;

	function handleSearch() {
		const params = new URLSearchParams();
		if (searchInput) {
			params.set('search', searchInput);
		}
		params.set('page', '1');
		goto(`/hub/lists?${params.toString()}`);
	}

	function handlePageChange(page) {
		const params = new URLSearchParams();
		if (search) {
			params.set('search', search);
		}
		params.set('page', page.toString());
		goto(`/hub/lists?${params.toString()}`);
	}

	const columns = [
		{ key: 'name', label: 'Name' },
		{ 
			key: 'description', 
			label: 'Description',
			render: (val) => val ? (val.length > 50 ? val.substring(0, 50) + '...' : val) : ''
		},
		{ 
			key: 'createdAt', 
			label: 'Created',
			render: (val) => val ? formatDateUK(val) : ''
		}
	];
</script>

<div class="mb-4 flex justify-between items-center">
	<h2 class="text-2xl font-bold text-gray-900">Lists</h2>
	<a href="/hub/lists/new" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
		Add List
	</a>
</div>

<div class="mb-4">
	<form on:submit|preventDefault={handleSearch} class="flex gap-2">
		<input
			type="text"
			bind:value={searchInput}
			placeholder="Search lists..."
			class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-4 py-2"
		/>
		<button type="submit" class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
			Search
		</button>
	</form>
</div>

<Table {columns} rows={lists} onRowClick={(row) => goto(`/hub/lists/${row.id}`)} />

<Pager {currentPage} {totalPages} onPageChange={handlePageChange} />

