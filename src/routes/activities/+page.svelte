<script lang="js">
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import Contact from '$lib/components/Contact.svelte';

	export let data;

	// Extract sections from page data
	$: sections = data.page?.sections || [];
	$: introSection = sections.find(s => s.type === 'text' && s.id === 'intro-section');
	$: freshGroundSection = sections.find(s => s.type === 'image' && s.id === 'freshground-section');
</script>

<svelte:head>
	<title>{data.page.title} - Eltham Green Community Church</title>
	<meta name="description" content={data.page.metaDescription || data.page.title} />
</svelte:head>

<Navbar />

<!-- Hero Section -->
{#if data.page?.heroImage}
	<section
		id="hero"
		class="relative h-[60vh] min-h-[500px] overflow-hidden"
		style="background-image: url('{data.page.heroImage}'); background-size: cover; background-position: center;"
	>
		<div
			class="absolute inset-0 bg-black"
			style="opacity: {(data.page.heroOverlay || 40) / 100};"
		></div>
		<div class="relative h-full flex items-center">
			<div class="container mx-auto px-4">
				<div class="max-w-3xl">
					{#if data.page.heroTitle}
						<h1 class="text-white text-5xl md:text-6xl font-bold mb-6 animate-fade-in leading-tight">
							{@html data.page.heroTitle}
						</h1>
					{/if}
				</div>
			</div>
		</div>
	</section>
{/if}

<!-- Intro Section -->
{#if introSection}
	<section class="py-20 bg-gradient-to-b from-white to-gray-50">
		<div class="container mx-auto px-4">
			<div class="max-w-4xl mx-auto text-center">
				<div class="inline-block mb-4">
					<span class="text-brand-blue text-sm font-semibold uppercase tracking-wider">Community</span>
				</div>
				{#if introSection.title}
					<h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
						{@html introSection.title}
					</h2>
				{/if}
				{#if introSection.content}
					<div class="prose prose-lg max-w-none text-gray-700 leading-relaxed">
						{@html introSection.content}
					</div>
				{/if}
			</div>
		</div>
	</section>
{/if}

<!-- Activities Grid -->
<section class="py-20 bg-white">
	<div class="container mx-auto px-4">
		<div class="max-w-6xl mx-auto">
			<div class="text-center mb-16">
				<span class="text-brand-blue text-sm font-semibold uppercase tracking-wider mb-2 block">What We Offer</span>
				<h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
					Our Activities
				</h2>
				<p class="text-xl text-gray-600 max-w-2xl mx-auto">
					Join us for community activities designed to serve and connect
				</p>
			</div>
			<div class="grid md:grid-cols-2 gap-8">
				<!-- Fresh Ground Coffee House -->
				{#if freshGroundSection}
					<div
						class="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden"
					>
						<div class="flex items-start gap-6 mb-6">
							<div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
								<svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
								</svg>
							</div>
							<div class="flex-1">
								{#if freshGroundSection.title}
									<h3 class="text-2xl font-bold text-gray-900 mb-3">
										{@html freshGroundSection.title}
									</h3>
								{/if}
								<div class="flex items-center gap-2 text-sm text-gray-600 mb-4">
									<svg class="w-5 h-5 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									<span class="font-medium">Wed-Sat: 9:30am - 2:00pm</span>
								</div>
							</div>
						</div>
						{#if freshGroundSection.image}
							<div class="relative h-48 rounded-lg overflow-hidden mb-6">
								<img
									src={freshGroundSection.image}
									alt={freshGroundSection.imageAlt || freshGroundSection.title || 'Fresh Ground Coffee House'}
									class="w-full h-full object-cover"
								/>
							</div>
						{/if}
						{#if freshGroundSection.content}
							<div class="prose prose-sm max-w-none text-gray-600 leading-relaxed mb-4">
								{@html freshGroundSection.content}
							</div>
						{/if}
					</div>
				{/if}

				<!-- Jumping Beans -->
				<div
					class="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden"
				>
					<div class="flex items-start gap-6 mb-6">
						<div class="w-16 h-16 bg-brand-yellow/10 rounded-full flex items-center justify-center flex-shrink-0">
							<svg class="w-8 h-8 text-brand-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
						<div class="flex-1">
							<h3 class="text-2xl font-bold text-gray-900 mb-3">
								Jumping Beans
							</h3>
							<div class="flex items-center gap-2 text-sm text-gray-600 mb-4">
								<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
								</svg>
								<span class="font-medium">For Children & Families</span>
							</div>
						</div>
					</div>
					<div class="relative h-48 rounded-lg overflow-hidden mb-6 bg-gradient-to-br from-primary/20 to-primary/10">
						<div class="absolute inset-0 flex items-center justify-center">
							<svg class="w-24 h-24 text-primary/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
						</div>
					</div>
					<p class="text-gray-600 leading-relaxed">
						Bring your child to Jumping Beans - a fun and safe space for children to play, learn, and make friends. A welcoming environment for families in our community.
					</p>
				</div>

				<!-- Songs of the Sixties -->
				<div
					class="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden"
				>
					<div class="flex items-start gap-6 mb-6">
						<div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
							<svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
							</svg>
						</div>
						<div class="flex-1">
							<h3 class="text-2xl font-bold text-gray-900 mb-3">
								Songs of the Sixties
							</h3>
							<div class="flex items-center gap-2 text-sm text-gray-600 mb-4">
								<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
								</svg>
								<span class="font-medium">For Older Adults</span>
							</div>
						</div>
					</div>
					<div class="relative h-48 rounded-lg overflow-hidden mb-6 bg-gradient-to-br from-brand-red/20 to-brand-red/10">
						<div class="absolute inset-0 flex items-center justify-center">
							<svg class="w-24 h-24 text-brand-red/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
							</svg>
						</div>
					</div>
					<p class="text-gray-600 leading-relaxed">
						If you are older, you will enjoy Songs of the Sixties - a nostalgic gathering where we celebrate the music and memories of a golden era together.
					</p>
				</div>

				<!-- Food Club -->
				<div
					class="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden"
				>
					<div class="flex items-start gap-6 mb-6">
						<div class="w-16 h-16 bg-brand-yellow/10 rounded-full flex items-center justify-center flex-shrink-0">
							<svg class="w-8 h-8 text-brand-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
							</svg>
						</div>
						<div class="flex-1">
							<h3 class="text-2xl font-bold text-gray-900 mb-3">
								Food Club
							</h3>
							<div class="flex items-center gap-2 text-sm text-gray-600 mb-4">
								<svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
								<span class="font-medium">Weekly</span>
							</div>
						</div>
					</div>
					<div class="relative h-48 rounded-lg overflow-hidden mb-6 bg-gradient-to-br from-brand-yellow/20 to-brand-yellow/10">
						<div class="absolute inset-0 flex items-center justify-center">
							<svg class="w-24 h-24 text-brand-yellow/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
							</svg>
						</div>
					</div>
					<p class="text-gray-600 leading-relaxed">
						Weekly food available through the Food Club - a great way to get fresh food at a very low cost. Supporting our community with affordable, quality groceries.
					</p>
				</div>
			</div>
		</div>
	</section>

<!-- Call to Action -->
<section class="py-20 bg-gradient-to-br from-brand-blue/5 via-white to-gray-50">
	<div class="container mx-auto px-4">
		<div class="max-w-4xl mx-auto text-center">
			<h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
				We Look Forward to Welcoming You!
			</h2>
			<p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
				All our activities are designed to serve and to share with our local community. Come and be part of what we're doing.
			</p>
			<a
				href="#contact"
				class="inline-block px-8 py-4 bg-brand-yellow text-white rounded-lg font-semibold hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-lg"
			>
				Get in Touch
			</a>
		</div>
	</div>
</section>

<!-- Contact Section -->
<section id="contact" class="py-20 bg-white">
	<div class="container mx-auto px-4">
		<Contact contactInfo={data.contactInfo} />
	</div>
</section>

<Footer />

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.6s ease-out;
	}
</style>
