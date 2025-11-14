<script lang="js">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	function handleLogout() {
		fetch('/admin/logout', { method: 'POST' }).then(() => {
			goto('/admin/login');
		});
	}

	// Don't show navbar on login page
	$: showNavbar = $page.url.pathname !== '/admin/login';

	const navItems = [
		{ href: '/admin', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
		{ href: '/admin/pages', label: 'Pages', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
		{ href: '/admin/hero-slides', label: 'Hero Slides', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
		{ href: '/admin/team', label: 'Team', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
		{ href: '/admin/services', label: 'Services', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
		{ href: '/admin/podcasts', label: 'Podcasts', icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' },
		{ href: '/admin/images', label: 'Images', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
		{ href: '/admin/settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
	];

	function isActive(href) {
		if (href === '/admin') {
			return $page.url.pathname === '/admin';
		}
		return $page.url.pathname.startsWith(href);
	}
</script>

<div class="min-h-screen bg-gray-50">
	<!-- Admin Navbar -->
	{#if showNavbar}
		<nav class="bg-white shadow-lg border-b border-gray-200">
		<div class="container mx-auto px-4">
			<div class="flex items-center justify-between h-16">
				<!-- Logo/Brand -->
				<div class="flex items-center gap-4">
					<a href="/admin" class="flex items-center gap-2">
						<svg
							class="w-8 h-8 text-primary"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
							></path>
						</svg>
						<span class="text-xl font-bold text-gray-900">Admin</span>
					</a>
				</div>

				<!-- Navigation Links -->
				<div class="hidden md:flex items-center gap-1">
					{#each navItems as item}
						<a
							href={item.href}
							class="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 {isActive(item.href)
								? 'bg-primary text-white'
								: 'text-gray-700 hover:bg-gray-100'}"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d={item.icon}
								></path>
							</svg>
							{item.label}
						</a>
					{/each}
				</div>

				<!-- Logout Button -->
				<button
					on:click={handleLogout}
					class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium flex items-center gap-2"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
						></path>
					</svg>
					Logout
				</button>
			</div>

			<!-- Mobile Navigation -->
			<div class="md:hidden pb-4">
				<div class="flex flex-wrap gap-2">
					{#each navItems as item}
						<a
							href={item.href}
							class="px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 {isActive(item.href)
								? 'bg-primary text-white'
								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'}"
						>
							<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d={item.icon}
								></path>
							</svg>
							{item.label}
						</a>
					{/each}
				</div>
			</div>
		</div>
		</nav>
	{/if}

	<!-- Page Content -->
	<main>
		<slot />
	</main>
</div>

<style>
	:global(.admin-page) {
		min-height: calc(100vh - 4rem);
	}
</style>

