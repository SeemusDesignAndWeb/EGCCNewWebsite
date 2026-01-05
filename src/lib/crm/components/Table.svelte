<script>
	export let columns = [];
	export let rows = [];
	export let onRowClick = null;
</script>

<div class="overflow-x-auto">
	<table class="min-w-full divide-y divide-gray-200 bg-white shadow rounded-lg">
		<thead class="bg-gray-50">
			<tr>
				{#each columns as col}
					<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						{col.label}
					</th>
				{/each}
			</tr>
		</thead>
		<tbody class="bg-white divide-y divide-gray-200">
			{#each rows as row, i}
				<tr 
					class="hover:bg-gray-50 {onRowClick ? 'cursor-pointer' : ''}"
					on:click={(e) => {
						// Don't trigger row click if clicking on a link
						if (e.target.tagName !== 'A' && onRowClick) {
							onRowClick(row);
						}
					}}
				>
					{#each columns as col}
						<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
							{@html col.render ? col.render(row[col.key], row) : (row[col.key] || '')}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
	{#if rows.length === 0}
		<div class="text-center py-8 text-gray-500">
			No records found
		</div>
	{/if}
</div>

