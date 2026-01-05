<script>
	export let currentPage = 1;
	export let totalPages = 1;
	export let onPageChange = null;
</script>

{#if totalPages > 1}
	<div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
		<div class="flex flex-1 justify-between sm:hidden">
			<button
				on:click={() => onPageChange && onPageChange(currentPage - 1)}
				disabled={currentPage === 1}
				class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				Previous
			</button>
			<button
				on:click={() => onPageChange && onPageChange(currentPage + 1)}
				disabled={currentPage === totalPages}
				class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
			>
				Next
			</button>
		</div>
		<div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
			<div>
				<p class="text-sm text-gray-700">
					Page <span class="font-medium">{currentPage}</span> of <span class="font-medium">{totalPages}</span>
				</p>
			</div>
			<div>
				<nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
					<button
						on:click={() => onPageChange && onPageChange(currentPage - 1)}
						disabled={currentPage === 1}
						class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Previous
					</button>
					{#each Array(totalPages) as _, i}
						{@const page = i + 1}
						<button
							on:click={() => onPageChange && onPageChange(page)}
							class="relative inline-flex items-center px-4 py-2 text-sm font-semibold {page === currentPage ? 'z-10 bg-green-600 text-white focus:z-20' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'}"
						>
							{page}
						</button>
					{/each}
					<button
						on:click={() => onPageChange && onPageChange(currentPage + 1)}
						disabled={currentPage === totalPages}
						class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Next
					</button>
				</nav>
			</div>
		</div>
	</div>
{/if}

