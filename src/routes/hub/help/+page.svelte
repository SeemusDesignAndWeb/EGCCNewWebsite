<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let docs = [];
	let selectedDoc = null;
	let content = '';

	onMount(async () => {
		try {
			const response = await fetch('/docs/index.md');
			if (response.ok) {
				const text = await response.text();
				docs = [{ name: 'Index', path: 'index.md', content: text }];
				selectedDoc = docs[0];
				content = text;
			}
		} catch (error) {
			console.error('Error loading docs:', error);
		}
	});

	async function loadDoc(path) {
		try {
			const response = await fetch(`/docs/${path}`);
			if (response.ok) {
				content = await response.text();
			}
		} catch (error) {
			console.error('Error loading doc:', error);
		}
	}
</script>

<div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
	<div class="bg-white shadow rounded-lg p-6">
		<h3 class="text-lg font-bold text-gray-900 mb-4">Documentation</h3>
		<nav class="space-y-2">
			<a href="/docs/USER_GUIDE.md" on:click|preventDefault={() => loadDoc('USER_GUIDE.md')} class="block text-gray-600 hover:text-gray-900">User Guide</a>
			<a href="/docs/ADMIN_GUIDE.md" on:click|preventDefault={() => loadDoc('ADMIN_GUIDE.md')} class="block text-gray-600 hover:text-gray-900">Admin Guide</a>
			<a href="/docs/TECHNICAL.md" on:click|preventDefault={() => loadDoc('TECHNICAL.md')} class="block text-gray-600 hover:text-gray-900">Technical</a>
			<a href="/docs/SECURITY.md" on:click|preventDefault={() => loadDoc('SECURITY.md')} class="block text-gray-600 hover:text-gray-900">Security Guide</a>
			<a href="/docs/SECURITY_AUDIT.md" on:click|preventDefault={() => loadDoc('SECURITY_AUDIT.md')} class="block text-red-600 hover:text-red-900 font-semibold">Security Audit</a>
		</nav>
	</div>
	<div class="lg:col-span-3 bg-white shadow rounded-lg p-6">
		<div class="prose max-w-none h-full overflow-y-auto max-h-[calc(100vh-12rem)]">
			<pre class="whitespace-pre-wrap">{content || 'Select a document to view'}</pre>
		</div>
	</div>
</div>

