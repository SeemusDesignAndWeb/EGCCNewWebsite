<script>
	import { onMount } from 'svelte';

	let mounted = false;

	onMount(() => {
		mounted = true;
	});
</script>

<section id="about" class="py-20 bg-gradient-to-b from-white to-gray-50">
	<div class="container mx-auto px-4">
		<div class="max-w-6xl mx-auto">
			<div class="grid md:grid-cols-2 gap-12 items-center">
				<div>
					<div class="inline-block mb-4">
						<span class="text-primary text-sm font-semibold uppercase tracking-wider">Our Story</span>
					</div>
					<h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
						Welcome to Eltham Green Community Church
					</h2>

					<div class="space-y-4 text-gray-700 leading-relaxed">
						<p>
							Eltham Green Community Church is a vibrant, welcoming church family located in the
							heart of Eltham, London. We are a community of believers committed to following
							Jesus Christ and sharing His love with our neighbors.
						</p>
						<p>
							Our mission is to build a community where everyone can experience God's love, grow
							in faith, and serve others. We believe in creating a space where people from all
							walks of life can come together to worship, learn, and support one another on their
							spiritual journey.
						</p>
						<p>
							Whether you're exploring faith for the first time or looking for a church home,
							we'd love to welcome you. Join us for worship, connect with our community, and
							discover how you can be part of what God is doing here in Eltham.
						</p>
					</div>
				</div>

				<div class="flex justify-center md:justify-end">
					<div class="relative w-full max-w-lg">
						<div class="absolute -inset-4 bg-primary/20 rounded-2xl transform rotate-3"></div>
						<img
							src="https://res.cloudinary.com/dl8kjhwjs/image/upload/v1763066390/egcc/egcc/img-church-bg.jpg"
							alt="About us"
							class="relative rounded-2xl shadow-2xl w-full h-auto"
						/>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

