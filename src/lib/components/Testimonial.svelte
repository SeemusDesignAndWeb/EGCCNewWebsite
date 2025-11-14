<script lang="js">
	import { onMount } from 'svelte';

	let currentTestimonial = 0;
	let autoplayInterval = null;

	const testimonials = [
		{
			text: 'Eltham Green Community Church has become a second home for our family. The welcoming atmosphere and genuine care from the congregation has been a blessing in our lives.',
			author: 'Emma Thompson',
			role: 'Church Member'
		},
		{
			text: 'I\'ve found a community here that truly supports one another. The teaching is practical and relevant, and I\'ve grown so much in my faith since joining.',
			author: 'David Williams',
			role: 'Church Member'
		},
		{
			text: 'The youth program has been amazing for my teenagers. They\'ve made great friends and are excited about coming to church. Thank you for creating such a positive environment.',
			author: 'Lisa Chen',
			role: 'Parent & Member'
		}
	];

	function nextTestimonial() {
		currentTestimonial = (currentTestimonial + 1) % testimonials.length;
	}

	function goToTestimonial(index) {
		currentTestimonial = index;
	}

	onMount(() => {
		autoplayInterval = window.setInterval(nextTestimonial, 5000);
		return () => {
			if (autoplayInterval) window.clearInterval(autoplayInterval);
		};
	});
</script>

<section
	id="testimonial"
	class="relative py-20 bg-cover bg-center bg-fixed"
	style="background-image: url('/images/testimonial-bg.jpg');"
>
	<div class="absolute inset-0 bg-black bg-opacity-60"></div>
	<div class="relative container mx-auto px-4">
		<div class="text-center mb-16">
			<div class="section-title inline-block">
				<h2 class="text-white">Testimonials</h2>
			</div>
		</div>

		<div class="max-w-4xl mx-auto">
			<div class="relative min-h-[200px]">
				{#each testimonials as testimonial, index}
					<div
						class="absolute inset-0 transition-opacity duration-1000 text-center"
						class:opacity-0={currentTestimonial !== index}
						class:opacity-100={currentTestimonial === index}
					>
						<p class="text-white text-lg md:text-xl mb-8 leading-relaxed">
							{testimonial.text}
						</p>
						<div class="text-white">
							<h4 class="text-xl font-bold mb-1">{testimonial.author}</h4>
							<span class="text-gray-300">{testimonial.role}</span>
						</div>
					</div>
				{/each}
			</div>

			<!-- Indicators -->
			<div class="flex justify-center gap-2 mt-8">
				{#each testimonials as _, index}
					<button
						on:click={() => goToTestimonial(index)}
						class="w-3 h-3 rounded-full transition-all {currentTestimonial === index ? 'bg-white' : 'bg-white/50'}"
						aria-label="Go to testimonial {index + 1}"
					></button>
				{/each}
			</div>
		</div>
	</div>
</section>

