<script lang="js">
	import { onMount } from 'svelte';

	let menuOpen = false;
	let scrolled = false;
	let mounted = false;

	onMount(() => {
		mounted = true;
		const handleScroll = () => {
			scrolled = window.scrollY > 50;
		};
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	});

	function smoothScroll(e, targetId) {
		e.preventDefault();
		menuOpen = false;
		const element = document.getElementById(targetId);
		if (element) {
			const offset = 49;
			const elementPosition = element.getBoundingClientRect().top;
			const offsetPosition = elementPosition + window.pageYOffset - offset;
			window.scrollTo({
				top: offsetPosition,
				behavior: 'smooth'
			});
		}
	}
</script>

<nav
	class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
	class:bg-black={scrolled}
	class:bg-opacity-30={!scrolled}
	class:bg-opacity-100={scrolled}
	class:shadow-md={scrolled}
>
	<div class="container mx-auto px-4">
		<div class="flex items-center justify-between py-4">
			<!-- Logo -->
			<a href="/" class="flex items-center">
				<img
					src="/images/egcc-logo-text.png"
					alt="Eltham Green Community Church"
					class="h-12 w-auto"
				/>
			</a>

			<!-- Mobile menu button -->
			<button
				class="md:hidden flex flex-col gap-1.5 p-2"
				on:click={() => (menuOpen = !menuOpen)}
				aria-label="Toggle menu"
			>
				<span
					class="block w-6 h-0.5 bg-white transition-all duration-300"
					class:rotate-45={menuOpen}
					class:translate-y-2={menuOpen}
				></span>
				<span
					class="block w-6 h-0.5 bg-white transition-all duration-300"
					class:opacity-0={menuOpen}
				></span>
				<span
					class="block w-6 h-0.5 bg-white transition-all duration-300"
					class:-rotate-45={menuOpen}
					class:-translate-y-2={menuOpen}
				></span>
			</button>

			<!-- Desktop menu -->
			<div class="hidden md:flex items-center gap-8">
				<ul class="flex items-center gap-6">
					<li>
						<a
							href="/im-new"
							on:click={() => (menuOpen = false)}
							class="text-white hover:text-primary transition-colors"
						>
							I'm New
						</a>
					</li>
					<li>
						<a
							href="/church"
							on:click={() => (menuOpen = false)}
							class="text-white hover:text-primary transition-colors"
						>
							Church
						</a>
					</li>
					<li>
						<a
							href="/team"
							on:click={() => (menuOpen = false)}
							class="text-white hover:text-primary transition-colors"
						>
							Team
						</a>
					</li>
					<li>
						<a
							href="/community-groups"
							on:click={() => (menuOpen = false)}
							class="text-white hover:text-primary transition-colors"
						>
							Community Groups
						</a>
					</li>
					<li>
						<a
							href="/activities"
							on:click={() => (menuOpen = false)}
							class="text-white hover:text-primary transition-colors"
						>
							Activities
						</a>
					</li>
					<li>
						<a
							href="/audio"
							on:click={() => (menuOpen = false)}
							class="text-white hover:text-primary transition-colors"
						>
							Audio
						</a>
					</li>
					<li>
						<a
							href="/media"
							on:click={() => (menuOpen = false)}
							class="text-white hover:text-primary transition-colors"
						>
							Media
						</a>
					</li>
				</ul>
			</div>
		</div>

		<!-- Mobile menu -->
		{#if menuOpen}
			<div class="md:hidden pb-4">
				<ul class="flex flex-col gap-4">
					<li>
						<a
							href="/im-new"
							on:click={() => (menuOpen = false)}
							class="block text-white hover:text-primary transition-colors"
						>
							I'm New
						</a>
					</li>
					<li>
						<a
							href="/church"
							on:click={() => (menuOpen = false)}
							class="block text-white hover:text-primary transition-colors"
						>
							Church
						</a>
					</li>
					<li>
						<a
							href="/team"
							on:click={() => (menuOpen = false)}
							class="block text-white hover:text-primary transition-colors"
						>
							Team
						</a>
					</li>
					<li>
						<a
							href="/community-groups"
							on:click={() => (menuOpen = false)}
							class="block text-white hover:text-primary transition-colors"
						>
							Community Groups
						</a>
					</li>
					<li>
						<a
							href="/activities"
							on:click={() => (menuOpen = false)}
							class="block text-white hover:text-primary transition-colors"
						>
							Activities
						</a>
					</li>
					<li>
						<a
							href="/audio"
							on:click={() => (menuOpen = false)}
							class="block text-white hover:text-primary transition-colors"
						>
							Audio
						</a>
					</li>
					<li>
						<a
							href="/media"
							on:click={() => (menuOpen = false)}
							class="block text-white hover:text-primary transition-colors"
						>
							Media
						</a>
					</li>
				</ul>
			</div>
		{/if}
	</div>
</nav>

