<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	export let data;
	export let form;

	$: base = data?.multiOrgBasePath ?? '/multi-org';
	$: error = form?.error ?? '';
	$: success = form?.success ?? false;
	$: message = form?.message ?? (success ? 'If an account exists for that email, we\'ve sent a password reset link. Check your inbox and spam folder.' : '');
</script>

<svelte:head>
	<title>Forgot password – MultiOrg</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-cyan-50/40 px-4 py-12">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/25 mb-4">
				<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
				</svg>
			</div>
			<h1 class="text-2xl font-bold text-slate-800 tracking-tight">Forgot password</h1>
			<p class="mt-2 text-sm text-slate-500">Reset your MultiOrg admin password</p>
		</div>

		<div class="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 p-8">
			{#if success}
				<div class="rounded-xl bg-cyan-50 border border-cyan-200 p-4 mb-4">
					<p class="text-cyan-800 text-sm">{message}</p>
				</div>
				<a
					href="{base}/auth/login"
					class="block w-full text-center py-3 px-4 rounded-xl font-semibold text-cyan-600 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 transition-colors"
				>
					← Back to sign in
				</a>
			{:else}
				<form method="POST" action="?/default" use:enhance={() => ({ result: (r) => r })}>
					{#if error}
						<div class="rounded-xl bg-red-50 border border-red-200 p-3 mb-4 text-red-700 text-sm">
							{error}
						</div>
					{/if}
					{#if message && !error}
						<div class="rounded-xl bg-cyan-50 border border-cyan-200 p-3 mb-4 text-cyan-800 text-sm">
							{message}
						</div>
					{/if}
					<div class="mb-4">
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
					<button
						type="submit"
						class="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 shadow-lg shadow-cyan-500/25 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
					>
						Send reset link
					</button>
				</form>
				<a
					href="{base}/auth/login"
					class="mt-6 block w-full text-center py-3 px-4 rounded-xl font-semibold text-cyan-600 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 transition-colors"
				>
					← Back to sign in
				</a>
			{/if}
		</div>
	</div>
</div>
