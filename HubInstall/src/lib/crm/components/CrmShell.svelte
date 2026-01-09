<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import NotificationPopup from '$lib/crm/components/NotificationPopup.svelte';
	import ConfirmDialog from '$lib/crm/components/ConfirmDialog.svelte';
	
	export let title = 'TheHUB';
	export let admin = null;
	
	$: isAuthPage = $page.url.pathname.startsWith('/hub/auth/');
	
	let mobileMenuOpen = false;
	let settingsDropdownOpen = false;
	let settingsDropdownElement;
	
	$: isSettingsActive = $page.url.pathname.startsWith('/hub/users') || $page.url.pathname.startsWith('/hub/help') || $page.url.pathname.startsWith('/hub/profile');
	
	function handleClickOutside(event) {
		if (settingsDropdownElement && !settingsDropdownElement.contains(event.target)) {
			settingsDropdownOpen = false;
		}
	}
	
	onMount(() => {
		document.addEventListener('click', handleClickOutside);
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div class="min-h-screen bg-gray-50 flex flex-col">
	<!-- Header -->
	{#if !isAuthPage}
		<header class="bg-blue-500 shadow-lg border-b border-blue-600 flex-shrink-0">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex items-center justify-between h-16">
					<!-- Logo/Brand -->
					<div class="flex items-center gap-4">
						<a href="/hub" class="flex items-center gap-2">
							<img
								src="/images/egcc-logo.png"
								alt="EGCC"
								class="h-8 w-auto"
							/>
							<span class="text-xl font-bold text-white">TheHUB</span>
						</a>
						<nav class="ml-8 hidden md:flex space-x-1">
							<a href="/hub" class="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white hover:bg-blue-600 {($page.url.pathname === '/hub' || $page.url.pathname === '/hub/') ? 'bg-blue-600' : ''}">Dashboard</a>
							<a href="/hub/contacts" class="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white hover:bg-blue-600 {$page.url.pathname.startsWith('/hub/contacts') ? 'bg-blue-600' : ''}">Contacts</a>
							<a href="/hub/lists" class="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white hover:bg-blue-600 {$page.url.pathname.startsWith('/hub/lists') ? 'bg-blue-600' : ''}">Lists</a>
							<a href="/hub/newsletters" class="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white hover:bg-blue-600 {$page.url.pathname.startsWith('/hub/newsletters') ? 'bg-blue-600' : ''}">Newsletters</a>
							<a href="/hub/events/calendar" class="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white hover:bg-blue-600 {$page.url.pathname.startsWith('/hub/events') ? 'bg-blue-600' : ''}">Events</a>
							<a href="/hub/rotas" class="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white hover:bg-blue-600 {$page.url.pathname.startsWith('/hub/rotas') ? 'bg-blue-600' : ''}">Rotas</a>
							<a href="/hub/forms" class="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white hover:bg-blue-600 {$page.url.pathname.startsWith('/hub/forms') ? 'bg-blue-600' : ''}">Forms</a>
							<!-- Settings Dropdown -->
							<div class="relative" bind:this={settingsDropdownElement}>
								<button
									on:click|stopPropagation={() => settingsDropdownOpen = !settingsDropdownOpen}
									class="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white hover:bg-blue-600 {isSettingsActive ? 'bg-blue-600' : ''} flex items-center"
									aria-label="Settings"
									aria-expanded={settingsDropdownOpen}
									aria-haspopup="true"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
								</button>
								{#if settingsDropdownOpen}
									<div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200" role="menu" tabindex="-1">
										{#if admin}
											<a href="/hub/profile" on:click={() => settingsDropdownOpen = false} class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 {$page.url.pathname.startsWith('/hub/profile') ? 'bg-blue-50 text-blue-600' : ''}" role="menuitem">Profile</a>
										{/if}
										<a href="/hub/users" on:click={() => settingsDropdownOpen = false} class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 {$page.url.pathname.startsWith('/hub/users') ? 'bg-blue-50 text-blue-600' : ''}" role="menuitem">Users</a>
										<a href="/hub/help" on:click={() => settingsDropdownOpen = false} class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 {$page.url.pathname.startsWith('/hub/help') ? 'bg-blue-50 text-blue-600' : ''}" role="menuitem">Help</a>
									</div>
								{/if}
							</div>
						</nav>
					</div>
					<div class="flex items-center space-x-4">
						<a href="/hub/auth/logout" class="hidden md:block px-4 py-2 bg-white text-blue-500 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium">
							Logout
						</a>
						<!-- Mobile menu button -->
						<button
							on:click={() => mobileMenuOpen = !mobileMenuOpen}
							class="md:hidden p-2 text-white hover:bg-blue-600 rounded-lg"
							aria-label="Toggle menu"
						>
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
								></path>
							</svg>
						</button>
					</div>
				</div>
				
				<!-- Mobile menu -->
				{#if mobileMenuOpen}
					<div class="md:hidden pb-4 border-t border-blue-400 mt-4 pt-4">
						<nav class="flex flex-col space-y-2">
							<a href="/hub" on:click={() => mobileMenuOpen = false} class="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white hover:bg-blue-600 {($page.url.pathname === '/hub' || $page.url.pathname === '/hub/') ? 'bg-blue-600' : ''}">Dashboard</a>
							<a href="/hub/contacts" on:click={() => mobileMenuOpen = false} class="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white hover:bg-blue-600 {$page.url.pathname.startsWith('/hub/contacts') ? 'bg-blue-600' : ''}">Contacts</a>
							<a href="/hub/lists" on:click={() => mobileMenuOpen = false} class="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white hover:bg-blue-600 {$page.url.pathname.startsWith('/hub/lists') ? 'bg-blue-600' : ''}">Lists</a>
							<a href="/hub/newsletters" on:click={() => mobileMenuOpen = false} class="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white hover:bg-blue-600 {$page.url.pathname.startsWith('/hub/newsletters') ? 'bg-blue-600' : ''}">Newsletters</a>
							<a href="/hub/events/calendar" on:click={() => mobileMenuOpen = false} class="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white hover:bg-blue-600 {$page.url.pathname.startsWith('/hub/events') ? 'bg-blue-600' : ''}">Events</a>
							<a href="/hub/rotas" on:click={() => mobileMenuOpen = false} class="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white hover:bg-blue-600 {$page.url.pathname.startsWith('/hub/rotas') ? 'bg-blue-600' : ''}">Rotas</a>
							<a href="/hub/forms" on:click={() => mobileMenuOpen = false} class="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white hover:bg-blue-600 {$page.url.pathname.startsWith('/hub/forms') ? 'bg-blue-600' : ''}">Forms</a>
							<div class="px-4 py-2">
								<button
									on:click={() => settingsDropdownOpen = !settingsDropdownOpen}
									class="flex items-center gap-2 text-sm font-medium text-white hover:bg-blue-600 px-2 py-1 rounded-lg transition-colors w-full"
								>
									<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
									<span>Settings</span>
								</button>
								{#if settingsDropdownOpen}
									<div class="ml-6 mt-2 space-y-1">
										{#if admin}
											<a href="/hub/profile" on:click={() => { mobileMenuOpen = false; settingsDropdownOpen = false; }} class="block px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white hover:bg-blue-600 {$page.url.pathname.startsWith('/hub/profile') ? 'bg-blue-600' : ''}">Profile</a>
										{/if}
										<a href="/hub/users" on:click={() => { mobileMenuOpen = false; settingsDropdownOpen = false; }} class="block px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white hover:bg-blue-600 {$page.url.pathname.startsWith('/hub/users') ? 'bg-blue-600' : ''}">Users</a>
										<a href="/hub/help" on:click={() => { mobileMenuOpen = false; settingsDropdownOpen = false; }} class="block px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white hover:bg-blue-600 {$page.url.pathname.startsWith('/hub/help') ? 'bg-blue-600' : ''}">Help</a>
									</div>
								{/if}
							</div>
							<a href="/hub/auth/logout" on:click={() => mobileMenuOpen = false} class="px-4 py-2 rounded-lg text-sm font-medium transition-colors text-white hover:bg-blue-600 border-t border-blue-400 pt-2 mt-2">
								Logout
							</a>
						</nav>
					</div>
				{/if}
			</div>
		</header>
	{/if}

	<!-- Main Content -->
	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full box-border flex-grow">
		<slot />
	</main>

	<!-- Footer -->
	{#if !isAuthPage}
		<footer class="bg-white border-t border-gray-200 mt-12 flex-shrink-0">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
				<div class="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
					<div class="flex items-center space-x-3">
						<img
							src="/images/egcc-logo.png"
							alt="Eltham Green Community Church"
							class="h-8 w-auto"
						/>
						<div class="text-sm text-gray-600">
							<div class="font-semibold text-gray-900">Eltham Green Community Church</div>
							<div class="text-xs">542 Westhorne Avenue, Eltham, London, SE9 6RR</div>
						</div>
					</div>
					<div class="text-sm text-gray-500">
						<a href="/" class="text-brand-blue hover:text-brand-blue/80 transition-colors">Visit Website</a>
					</div>
				</div>
			</div>
		</footer>
	{/if}

	<!-- Global Notification Popups -->
	<NotificationPopup />
	
	<!-- Global Dialog/Confirm -->
	<ConfirmDialog />
</div>

<style>
	main {
		width: 100%;
		max-width: 80rem;
		margin-left: auto;
		margin-right: auto;
		box-sizing: border-box;
	}
</style>
