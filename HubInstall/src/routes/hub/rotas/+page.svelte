<script>
	import { page } from '$app/stores';
	import Table from '$lib/crm/components/Table.svelte';
	import Pager from '$lib/crm/components/Pager.svelte';
	import { goto } from '$app/navigation';

	$: data = $page.data || {};
	$: rotas = data.rotas || [];
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
		goto(`/hub/rotas?${params.toString()}`);
	}

	function handlePageChange(page) {
		const params = new URLSearchParams();
		if (search) {
			params.set('search', search);
		}
		params.set('page', page.toString());
		goto(`/hub/rotas?${params.toString()}`);
	}

	const columns = [
		{ key: 'eventTitle', label: 'Event' },
		{ key: 'role', label: 'Role' },
		{ key: 'capacity', label: 'Capacity' },
		{ 
			key: 'assignees', 
			label: 'Assigned',
			render: (val) => Array.isArray(val) ? val.length : 0
		}
	];
</script>

<div class="mb-4 flex justify-between items-center">
	<h2 class="text-2xl font-bold text-gray-900">Rotas</h2>
	<div class="flex gap-2">
		<a href="/hub/rotas/invite" class="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
			Bulk Invite
		</a>
		<a href="/hub/rotas/new" class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700">
			New Rota
		</a>
	</div>
</div>

<div class="mb-4">
	<form on:submit|preventDefault={handleSearch} class="flex gap-2">
		<input
			type="text"
			bind:value={searchInput}
			placeholder="Search rotas..."
			class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 px-4 py-2"
		/>
		<button type="submit" class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
			Search
		</button>
	</form>
</div>

<Table {columns} rows={rotas} onRowClick={(row) => goto(`/hub/rotas/${row.id}`)} />

<Pager {currentPage} {totalPages} onPageChange={handlePageChange} />

