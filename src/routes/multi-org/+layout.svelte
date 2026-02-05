<script>
	import { page } from '$app/stores';

	export let data;
	$: multiOrgAdmin = data?.multiOrgAdmin || null;
	$: base = data?.multiOrgBasePath ?? '/multi-org';
	$: pathname = $page.url.pathname;
	$: isOrganisations = pathname.startsWith('/multi-org/organisations');
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 flex flex-col">
	{#if multiOrgAdmin}
		<!-- MultiOrg banner: bright tech strip -->
		<div class="bg-gradient-to-r from-cyan-500 via-cyan-600 to-teal-500 text-white shadow-lg">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="flex items-center justify-center w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm">
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
							</svg>
						</div>
						<div>
							<h1 class="text-lg font-bold tracking-tight">The Hub - MultiOrg</h1>
							<p class="text-xs text-cyan-100">Organisation management</p>
						</div>
					</div>
					<div class="flex items-center gap-2 text-sm text-cyan-100">
						<span class="hidden sm:inline">{multiOrgAdmin.name || multiOrgAdmin.email}</span>
						<a
							href="{base}/auth/logout"
							class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 font-medium transition-colors"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
							Sign out
						</a>
					</div>
				</div>
			</div>
		</div>
		<!-- Navbar -->
		<nav class="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex gap-1 h-12">
					<a
						href="{base}/organisations"
						class="inline-flex items-center px-4 text-sm font-medium rounded-lg transition-colors {isOrganisations ? 'bg-cyan-50 text-cyan-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}"
					>
						<svg class="w-4 h-4 mr-2 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
						Organisations
					</a>
				</div>
			</div>
		</nav>
	{/if}
	<main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
		<slot />
	</main>
</div>
