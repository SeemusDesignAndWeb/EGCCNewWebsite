<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	export let data;
	$: organisation = data?.organisation;
	$: currentEmail = data?.currentHubSuperAdminEmail;
	$: currentName = data?.currentHubSuperAdminName;
	$: error = $page.form?.error;
	$: success = $page.url.searchParams.get('super_admin') === 'set';
</script>

<svelte:head>
	<title>Hub super admin – {organisation?.name ?? 'Organisation'}</title>
</svelte:head>

<div class="max-w-xl">
	<a href="/multi-org/organisations/{organisation?.id}" class="text-sm font-medium text-cyan-600 hover:text-cyan-700 mb-4 inline-flex items-center gap-1">← Back to organisation</a>
	<h1 class="text-2xl font-bold text-slate-800 mb-2">Hub super admin</h1>
	<p class="text-slate-500 mb-8">
		Set the super admin for the Hub organisation. This user will have full access to the Hub (all areas and user management).
	</p>

	{#if success}
		<div class="mb-6 p-5 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200">
			Hub super admin has been set successfully. They can now sign in to the Hub with full access.
		</div>
	{/if}

	{#if error}
		<div class="mb-6 p-5 rounded-2xl bg-red-50 text-red-700 border border-red-100">
			{error}
		</div>
	{/if}

	<form method="POST" action="?/set" use:enhance>
		<div class="space-y-5 bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
			<div>
				<label for="email" class="block text-sm font-medium text-slate-700 mb-1">Email address *</label>
				<input
					id="email"
					name="email"
					type="email"
					required
					value={currentEmail ?? ''}
					class="block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none sm:text-sm"
				/>
				<p class="mt-1.5 text-xs text-slate-500">If this email already has a Hub account, they will be updated to super admin. Otherwise a new account is created.</p>
			</div>
			<div>
				<label for="name" class="block text-sm font-medium text-slate-700 mb-1">Name *</label>
				<input
					id="name"
					name="name"
					type="text"
					required
					value={currentName ?? ''}
					placeholder="Display name"
					class="block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none sm:text-sm"
				/>
			</div>
			<div>
				<label for="password" class="block text-sm font-medium text-slate-700 mb-1">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					autocomplete="new-password"
					placeholder={currentEmail ? 'Leave blank to keep current password' : 'Required for new account'}
					class="block w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-900 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none sm:text-sm"
				/>
				<p class="mt-1.5 text-xs text-slate-500">At least 12 characters, with upper, lower, number and special character. Required when creating a new account.</p>
			</div>
		</div>
		<div class="mt-6 flex gap-3">
			<button
				type="submit"
				class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 transition-all"
			>
				Set Hub super admin
			</button>
			<a
				href="/multi-org/organisations/{organisation?.id}"
				class="inline-flex items-center px-5 py-2.5 rounded-xl font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
			>
				Back
			</a>
		</div>
	</form>
</div>
