<script>
	import { page } from '$app/stores';
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
			<p class="text-slate-600 text-sm mb-4">
				MultiOrg password reset is done from the command line. From your project root, run:
			</p>
			<pre class="p-4 rounded-xl bg-slate-100 text-slate-800 text-sm font-mono overflow-x-auto mb-4">node scripts/reset-multi-org-password.js <span class="text-cyan-600">your@email.com</span> <span class="text-cyan-600">"YourNewPassword123!"</span></pre>
			<p class="text-slate-600 text-sm mb-4">
				Replace <strong>your@email.com</strong> with your MultiOrg admin email and <strong>YourNewPassword123!</strong> with a new password. Password must be at least 12 characters with upper, lower, number and special character.
			</p>
			<p class="text-slate-500 text-xs">
				If you don’t have terminal access, ask another MultiOrg super admin to run this for you or to create a new admin for you.
			</p>
			<a
				href="/multi-org/auth/login"
				class="mt-6 block w-full text-center py-3 px-4 rounded-xl font-semibold text-cyan-600 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 transition-colors"
			>
				← Back to sign in
			</a>
		</div>
	</div>
</div>
