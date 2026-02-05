<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	export let data;
	$: base = data?.multiOrgBasePath ?? '/multi-org';
	let error = '';
	$: if ($page.form?.error) {
		error = $page.form.error;
	}
</script>

<svelte:head>
	<title>Sign in – MultiOrg</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-cyan-50/40 px-4 py-12">
	<div class="w-full max-w-md">
		<!-- Logo / brand -->
		<div class="text-center mb-8">
			<div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/25 mb-4">
				<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
				</svg>
			</div>
			<h1 class="text-2xl font-bold text-slate-800 tracking-tight">MultiOrg</h1>
			<p class="mt-2 text-sm text-slate-500">Sign in to manage organisations</p>
		</div>

		<div class="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 p-8">
			<form method="POST" action="?/login" use:enhance>
				<input type="hidden" name="_csrf" value={$page.data?.csrfToken || ''} />
				<div class="space-y-4">
					<div>
						<label for="email" class="block text-sm font-medium text-slate-700 mb-1">Email address</label>
						<input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							required
							class="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-shadow sm:text-sm"
							placeholder="you@example.com"
						/>
					</div>
					<div>
						<label for="password" class="block text-sm font-medium text-slate-700 mb-1">Password</label>
						<input
							id="password"
							name="password"
							type="password"
							autocomplete="current-password"
							required
							class="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-shadow sm:text-sm"
							placeholder="••••••••"
						/>
					</div>
				</div>
				{#if error}
					<div class="mt-4 p-4 rounded-xl bg-red-50 text-red-700 text-sm border border-red-100">
						{error}
					</div>
				{/if}
				<div class="mt-3 text-center">
					<a href="{base}/auth/forgot-password" class="text-sm font-medium text-cyan-600 hover:text-cyan-700">
						Forgot password?
					</a>
				</div>
					<button
						type="submit"
						class="mt-6 w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all"
					>
						Sign in
					</button>
				</form>
		</div>
	</div>
</div>
