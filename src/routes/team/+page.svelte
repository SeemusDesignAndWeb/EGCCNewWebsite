<script lang="js">
	import Navbar from '$lib/components/Navbar.svelte';
	import Team from '$lib/components/Team.svelte';
	import Footer from '$lib/components/Footer.svelte';

	export let data;
</script>

<svelte:head>
	<title>Our Team - Eltham Green Community Church</title>
	<meta name="description" content="Meet the leadership team of Eltham Green Community Church" />
</svelte:head>

<Navbar />

<section
	id="home"
	class="relative h-[50vh] overflow-hidden"
	style="background-image: url('https://res.cloudinary.com/dl8kjhwjs/image/upload/v1763066390/egcc/egcc/img-church-bg.jpg'); background-size: cover; background-position: center;"
>
	<div class="absolute inset-0 bg-black bg-opacity-40"></div>
	<div class="relative h-full flex items-end pb-16">
		<div class="container mx-auto px-4">
			<div class="max-w-2xl">
				<h1 class="text-white text-4xl md:text-5xl font-bold animate-fade-in">
					{data.teamHeroTitle}
				</h1>
			</div>
		</div>
	</div>
</section>

<Team teamDescription={data.teamDescription} team={data.team} />
<Footer />

