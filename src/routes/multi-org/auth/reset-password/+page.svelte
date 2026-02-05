<script>
	import { enhance } from '$app/forms';

	export let data;
	export let form;

	$: base = data?.multiOrgBasePath ?? '/multi-org';
	$: token = form?.token ?? data?.token ?? '';
	$: email = form?.email ?? data?.email ?? '';
	$: error = form?.error ?? '';
	$: invalidLink = !data?.token || !data?.email;
</script>

<svelte:head>
	<title>Set new password – MultiOrg</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-cyan-50/40 px-4 py-12">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/25 mb-4">
				<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
				</svg>
			</div>
			<h1 class="text-2xl font-bold text-slate-800 tracking-tight">Set new password</h1>
			<p class="mt-2 text-sm text-slate-500">Choose a new password for your MultiOrg account</p>
		</div>

		<div class="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200/80 p-8">
			{#if invalidLink}
				<p class="text-slate-600 text-sm mb-4">
					This reset link is invalid or incomplete. Please use the link from your email or
					<a href="{base}/auth/forgot-password" class="text-cyan-600 font-medium hover:underline">request a new one</a>.
				</p>
				<a
					href="{base}/auth/login"
					class="block w-full text-center py-3 px-4 rounded-xl font-semibold text-cyan-600 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 transition-colors"
				>
					← Back to sign in
				</a>
			{:else}
				<form method="POST" action="?/default" use:enhance>
					<input type="hidden" name="token" value={token} />
					<input type="hidden" name="email" value={email} />
					{#if error}
						<div class="rounded-xl bg-red-50 border border-red-200 p-3 mb-4 text-red-700 text-sm">
							{error}
						</div>
					{/if}
					<div class="space-y-4">
						<div>
							<label for="password" class="block text-sm font-medium text-slate-700 mb-1">New password</label>
							<input
								id="password"
								name="password"
								type="password"
								autocomplete="new-password"
								required
								minlength="12"
								class="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-shadow sm:text-sm"
								placeholder="At least 12 characters, with upper, lower, number and special"
							/>
							<p class="mt-1 text-xs text-slate-500">At least 12 characters, with uppercase, lowercase, number and special character.</p>
						</div>
						<div>
							<label for="confirmPassword" class="block text-sm font-medium text-slate-700 mb-1">Confirm password</label>
							<input
								id="confirmPassword"
								name="confirmPassword"
								type="password"
								autocomplete="new-password"
								required
								minlength="12"
								class="block w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none transition-shadow sm:text-sm"
								placeholder="Repeat new password"
							/>
						</div>
					</div>
					<button
						type="submit"
						class="mt-6 w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 shadow-lg shadow-cyan-500/25 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
					>
						Reset password
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
