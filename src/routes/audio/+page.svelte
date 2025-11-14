<script>
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import PodcastPlayer from '$lib/components/PodcastPlayer.svelte';

	export let data;

	let selectedPodcast = null;
	let currentPage = 1;
	let itemsPerPage = 12;
	let startDate = '';
	let endDate = '';

	$: filteredPodcasts = data.podcasts.filter(podcast => {
		if (!startDate && !endDate) return true;
		const podcastDate = new Date(podcast.publishedAt);
		if (startDate && podcastDate < new Date(startDate)) return false;
		if (endDate && podcastDate > new Date(endDate + 'T23:59:59')) return false;
		return true;
	});

	$: totalPages = Math.ceil(filteredPodcasts.length / itemsPerPage);
	$: paginatedPodcasts = filteredPodcasts.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);

	function resetFilters() {
		startDate = '';
		endDate = '';
		currentPage = 1;
	}

	function goToPage(page) {
		currentPage = page;
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<svelte:head>
	<title>{data.page.title} - Eltham Green Community Church</title>
	<meta name="description" content={data.page.metaDescription || data.page.title} />
	<link rel="alternate" type="application/rss+xml" title="EGCC Podcast Feed" href="/api/podcast-feed" />
</svelte:head>

<Navbar />

<!-- Hero Section -->
{#if data.page?.heroImage}
	<section
		id="hero"
		class="relative h-[50vh] overflow-hidden"
		style="background-image: url('{data.page.heroImage}'); background-size: cover; background-position: center;"
	>
		<div
			class="absolute inset-0 bg-black"
			style="opacity: {(data.page.heroOverlay || 40) / 100};"
		></div>
		<div class="relative h-full flex items-end pb-16">
			<div class="container mx-auto px-4">
				<div class="max-w-2xl">
					{#if data.page.heroTitle}
						<h1 class="text-white text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
							{@html data.page.heroTitle}
						</h1>
					{/if}
					{#if data.page.heroSubtitle}
						<p class="text-white text-lg md:text-xl animate-fade-in">{data.page.heroSubtitle}</p>
					{/if}
				</div>
			</div>
		</div>
	</section>
{/if}

{#if data.podcasts && data.podcasts.length > 0}
	<section class="py-20 bg-gray-50">
		<div class="container mx-auto px-4">
			<div class="text-center mb-8">
				<p class="text-gray-600 mb-4">
					Listen to our latest sermons and messages. Subscribe to our podcast on
					<a href="/api/podcast-feed" class="text-primary hover:underline">Apple Podcasts</a> or
					<a href="/api/podcast-feed" class="text-primary hover:underline">Spotify</a>.
				</p>
			</div>

			<!-- Date Range Filter -->
			<div class="mb-8 bg-white p-4 rounded-lg shadow">
				<div class="flex flex-wrap gap-4 items-end">
					<div class="flex-1 min-w-[200px]">
						<label for="start-date" class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
						<input
							id="start-date"
							type="date"
							bind:value={startDate}
							on:change={() => currentPage = 1}
							class="w-full px-3 py-2 border rounded"
						/>
					</div>
					<div class="flex-1 min-w-[200px]">
						<label for="end-date" class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
						<input
							id="end-date"
							type="date"
							bind:value={endDate}
							on:change={() => currentPage = 1}
							class="w-full px-3 py-2 border rounded"
						/>
					</div>
					<div>
						<button
							on:click={resetFilters}
							class="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
						>
							Clear Filters
						</button>
					</div>
				</div>
				{#if startDate || endDate}
					<p class="text-sm text-gray-600 mt-2">
						Showing {filteredPodcasts.length} of {data.podcasts.length} podcasts
					</p>
				{/if}
			</div>

			{#if selectedPodcast}
				<div class="mb-8">
					<PodcastPlayer podcast={selectedPodcast} autoplay={false} />
				</div>
			{/if}

			<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each paginatedPodcasts as podcast}
					<div
						class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer"
						on:click={() => selectedPodcast = podcast}
						role="button"
						tabindex="0"
						on:keydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								selectedPodcast = podcast;
							}
						}}
					>
						<h3 class="text-xl font-bold mb-2">{podcast.title}</h3>
						{#if podcast.description}
							<p class="text-gray-700 text-sm mb-3 line-clamp-2">{podcast.description}</p>
						{:else}
							<p class="text-gray-600 text-sm mb-3">By {podcast.speaker}</p>
						{/if}
						<div class="flex items-center justify-between text-xs text-gray-500">
							<span>{new Date(podcast.publishedAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
							{#if podcast.duration}
								<span>{podcast.duration}</span>
							{/if}
						</div>
						{#if podcast.series}
							<span class="inline-block mt-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded">
								{podcast.series}
							</span>
						{/if}
					</div>
				{/each}
			</div>

			<!-- Pagination -->
			{#if totalPages > 1}
				<div class="mt-8 flex justify-center items-center gap-2">
					<button
						on:click={() => goToPage(currentPage - 1)}
						disabled={currentPage === 1}
						class="px-4 py-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Previous
					</button>
					{#each Array(totalPages) as _, i}
						{@const page = i + 1}
						{#if page === currentPage || page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)}
							<button
								on:click={() => goToPage(page)}
								class="px-4 py-2 {page === currentPage ? 'bg-primary text-white' : 'bg-white border'} rounded hover:bg-opacity-90"
							>
								{page}
							</button>
						{:else if page === currentPage - 3 || page === currentPage + 3}
							<span class="px-2">...</span>
						{/if}
					{/each}
					<button
						on:click={() => goToPage(currentPage + 1)}
						disabled={currentPage === totalPages}
						class="px-4 py-2 bg-white border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Next
					</button>
				</div>
			{/if}
		</div>
	</section>
{:else}
	<section class="py-20 bg-gray-50">
		<div class="container mx-auto px-4 text-center">
			<p class="text-gray-600">No sermons available yet. Check back soon!</p>
		</div>
	</section>
{/if}

<Footer />
