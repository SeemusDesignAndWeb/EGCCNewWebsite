<script>
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { formatDateUK } from '$lib/crm/utils/dateFormat.js';
	
	$: stats = $page.data?.stats || {};
	$: latestNewsletters = $page.data?.latestNewsletters || [];
	$: latestRotas = $page.data?.latestRotas || [];
</script>

<!-- Quick Actions -->
<div class="mb-8">
	<h2 class="text-xl font-bold text-gray-900 mb-3">Quick Actions</h2>
	<div class="grid grid-cols-3 md:grid-cols-6 gap-2">
		<a href="/hub/contacts/new" class="bg-blue-50 border-2 border-blue-200 rounded-md p-2 hover:border-blue-400 hover:bg-blue-100 transition-all text-center group flex items-center justify-center gap-1">
			<span class="text-lg font-bold text-blue-600 group-hover:scale-110 transition-transform">+</span>
			<span class="text-xs font-medium text-blue-700">Contact</span>
		</a>
		<a href="/hub/newsletters/new" class="bg-green-50 border-2 border-green-200 rounded-md p-2 hover:border-green-400 hover:bg-green-100 transition-all text-center group flex items-center justify-center gap-1">
			<span class="text-lg font-bold text-green-600 group-hover:scale-110 transition-transform">+</span>
			<span class="text-xs font-medium text-green-700">Newsletter</span>
		</a>
		<a href="/hub/events/new" class="bg-purple-50 border-2 border-purple-200 rounded-md p-2 hover:border-purple-400 hover:bg-purple-100 transition-all text-center group flex items-center justify-center gap-1">
			<span class="text-lg font-bold text-purple-600 group-hover:scale-110 transition-transform">+</span>
			<span class="text-xs font-medium text-purple-700">Event</span>
		</a>
		<a href="/hub/rotas/new" class="bg-orange-50 border-2 border-orange-200 rounded-md p-2 hover:border-orange-400 hover:bg-orange-100 transition-all text-center group flex items-center justify-center gap-1">
			<span class="text-lg font-bold text-orange-600 group-hover:scale-110 transition-transform">+</span>
			<span class="text-xs font-medium text-orange-700">Rota</span>
		</a>
		<a href="/hub/lists/new" class="bg-pink-50 border-2 border-pink-200 rounded-md p-2 hover:border-pink-400 hover:bg-pink-100 transition-all text-center group flex items-center justify-center gap-1">
			<span class="text-lg font-bold text-pink-600 group-hover:scale-110 transition-transform">+</span>
			<span class="text-xs font-medium text-pink-700">List</span>
		</a>
		<a href="/hub/forms/new" class="bg-indigo-50 border-2 border-indigo-200 rounded-md p-2 hover:border-indigo-400 hover:bg-indigo-100 transition-all text-center group flex items-center justify-center gap-1">
			<span class="text-lg font-bold text-indigo-600 group-hover:scale-110 transition-transform">+</span>
			<span class="text-xs font-medium text-indigo-700">Form</span>
		</a>
	</div>
</div>

<!-- Stats Grid -->
<h2 class="text-xl font-bold text-gray-900 mb-4">Overview</h2>
<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
	<div class="bg-white overflow-hidden shadow rounded-lg border-l-4 border-blue-500">
		<div class="p-5">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<svg class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
					</svg>
				</div>
				<div class="ml-5 w-0 flex-1">
					<dl>
						<dt class="text-sm font-medium text-gray-500 truncate">Contacts</dt>
						<dd class="text-lg font-medium text-gray-900">{stats.contacts || 0}</dd>
					</dl>
				</div>
			</div>
		</div>
		<div class="bg-gray-50 px-5 py-3">
			<div class="text-sm">
				<a href="/hub/contacts" class="font-medium text-blue-600 hover:text-blue-800">View all</a>
			</div>
		</div>
	</div>

	<div class="bg-white overflow-hidden shadow rounded-lg border-l-4 border-pink-500">
		<div class="p-5">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<svg class="h-6 w-6 text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
					</svg>
				</div>
				<div class="ml-5 w-0 flex-1">
					<dl>
						<dt class="text-sm font-medium text-gray-500 truncate">Lists</dt>
						<dd class="text-lg font-medium text-gray-900">{stats.lists || 0}</dd>
					</dl>
				</div>
			</div>
		</div>
		<div class="bg-gray-50 px-5 py-3">
			<div class="text-sm">
				<a href="/hub/lists" class="font-medium text-pink-600 hover:text-pink-800">View all</a>
			</div>
		</div>
	</div>

	<div class="bg-white overflow-hidden shadow rounded-lg border-l-4 border-green-500">
		<div class="p-5">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<svg class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
					</svg>
				</div>
				<div class="ml-5 w-0 flex-1">
					<dl>
						<dt class="text-sm font-medium text-gray-500 truncate">Newsletters</dt>
						<dd class="text-lg font-medium text-gray-900">{stats.newsletters || 0}</dd>
					</dl>
				</div>
			</div>
		</div>
		<div class="bg-gray-50 px-5 py-3">
			<div class="text-sm">
				<a href="/hub/newsletters" class="font-medium text-green-600 hover:text-green-800">View all</a>
			</div>
		</div>
	</div>

	<div class="bg-white overflow-hidden shadow rounded-lg border-l-4 border-purple-500">
		<div class="p-5">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<svg class="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
				</div>
				<div class="ml-5 w-0 flex-1">
					<dl>
						<dt class="text-sm font-medium text-gray-500 truncate">Events</dt>
						<dd class="text-lg font-medium text-gray-900">{stats.events || 0}</dd>
					</dl>
				</div>
			</div>
		</div>
		<div class="bg-gray-50 px-5 py-3">
			<div class="text-sm">
				<a href="/hub/events" class="font-medium text-purple-600 hover:text-purple-800">View all</a>
			</div>
		</div>
	</div>

	<div class="bg-white overflow-hidden shadow rounded-lg border-l-4 border-orange-500">
		<div class="p-5">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<svg class="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
					</svg>
				</div>
				<div class="ml-5 w-0 flex-1">
					<dl>
						<dt class="text-sm font-medium text-gray-500 truncate">Rotas</dt>
						<dd class="text-lg font-medium text-gray-900">{stats.rotas || 0}</dd>
					</dl>
				</div>
			</div>
		</div>
		<div class="bg-gray-50 px-5 py-3">
			<div class="text-sm">
				<a href="/hub/rotas" class="font-medium text-orange-600 hover:text-orange-800">View all</a>
			</div>
		</div>
	</div>

	<div class="bg-white overflow-hidden shadow rounded-lg border-l-4 border-indigo-500">
		<div class="p-5">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<svg class="h-6 w-6 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
				</div>
				<div class="ml-5 w-0 flex-1">
					<dl>
						<dt class="text-sm font-medium text-gray-500 truncate">Forms</dt>
						<dd class="text-lg font-medium text-gray-900">{stats.forms || 0}</dd>
					</dl>
				</div>
			</div>
		</div>
		<div class="bg-gray-50 px-5 py-3">
			<div class="text-sm">
				<a href="/hub/forms" class="font-medium text-indigo-600 hover:text-indigo-800">View all</a>
			</div>
		</div>
	</div>
</div>

<!-- Recent Items -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
	<!-- Latest Newsletters -->
	<div class="bg-white shadow rounded-lg p-6 border-t-4 border-green-500">
		<div class="flex justify-between items-center mb-4">
			<h3 class="text-lg font-semibold text-gray-900">Latest Newsletters</h3>
			<a href="/hub/newsletters" class="text-sm text-green-600 hover:text-green-800 font-medium">View all</a>
		</div>
		{#if latestNewsletters.length === 0}
			<p class="text-sm text-gray-500">No newsletters yet</p>
		{:else}
			<ul class="space-y-3">
				{#each latestNewsletters as newsletter}
					<li class="border-b border-gray-200 pb-3 last:border-0 last:pb-0">
						<a 
							href="/hub/newsletters/{newsletter.id}" 
							class="block hover:text-brand-green transition-colors"
						>
							<div class="flex justify-between items-start">
								<div class="flex-1">
									<div class="font-medium text-gray-900">{newsletter.subject || 'Untitled'}</div>
									<div class="text-xs text-gray-500 mt-1">
										{formatDateUK(newsletter.updatedAt || newsletter.createdAt || Date.now())}
									</div>
								</div>
								<span class="ml-2 text-xs px-2 py-1 rounded-full {newsletter.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
									{newsletter.status || 'draft'}
								</span>
							</div>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	<!-- Latest Rotas -->
	<div class="bg-white shadow rounded-lg p-6 border-t-4 border-orange-500">
		<div class="flex justify-between items-center mb-4">
			<h3 class="text-lg font-semibold text-gray-900">Recently Edited Rotas</h3>
			<a href="/hub/rotas" class="text-sm text-orange-600 hover:text-orange-800 font-medium">View all</a>
		</div>
		{#if latestRotas.length === 0}
			<p class="text-sm text-gray-500">No rotas yet</p>
		{:else}
			<ul class="space-y-3">
				{#each latestRotas as rota}
					<li class="border-b border-gray-200 pb-3 last:border-0 last:pb-0">
						<a 
							href="/hub/rotas/{rota.id}" 
							class="block hover:text-brand-green transition-colors"
						>
							<div class="flex justify-between items-start">
								<div class="flex-1">
									<div class="font-medium text-gray-900">{rota.role || 'Untitled'}</div>
									<div class="text-xs text-gray-500 mt-1">
										{rota.eventTitle || 'Unknown Event'} • {Array.isArray(rota.assignees) ? rota.assignees.length : 0} assigned
									</div>
									<div class="text-xs text-gray-400 mt-1">
										{formatDateUK(rota.updatedAt || rota.createdAt || Date.now())}
									</div>
								</div>
							</div>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
