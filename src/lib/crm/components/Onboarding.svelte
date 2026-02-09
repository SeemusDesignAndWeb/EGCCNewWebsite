<script>
	import { hasRouteAccess } from '$lib/crm/permissions.js';
	import { invalidateAll } from '$app/navigation';

	export let showOnboarding = false;
	export let admin = null;
	export let superAdminEmail = null;
	/** Org's allowed areas from organisation record (null = no restriction) */
	export let organisationAreaPermissions = null;

	// Steps in the order we want to show: Settings, Contacts, Lists, Events, Rotas, Email, Forms.
	// Each: { id, title, description, href, route }
	const STEP_DEFS = [
		{ id: 'settings', title: 'Settings', description: 'Set your organisation name, logo and colours.', href: '/hub/settings', route: '/hub/users' },
		{ id: 'contacts', title: 'Contacts', description: 'Add and manage your contacts.', href: '/hub/contacts', route: '/hub/contacts' },
		{ id: 'lists', title: 'Lists', description: 'Create lists to group contacts for emails and events.', href: '/hub/lists', route: '/hub/lists' },
		{ id: 'events', title: 'Events', description: 'Create events and manage dates on the calendar.', href: '/hub/events/calendar', route: '/hub/events' },
		{ id: 'rotas', title: 'Rotas', description: 'Assign rotas to events and invite volunteers.', href: '/hub/rotas', route: '/hub/rotas' },
		{ id: 'emails', title: 'Emails', description: 'Send newsletters and one-off emails to contacts and lists.', href: '/hub/emails', route: '/hub/emails' },
		{ id: 'forms', title: 'Forms', description: 'Create forms and collect submissions.', href: '/hub/forms', route: '/hub/forms' }
	];

	$: steps = STEP_DEFS.filter((step) => admin && hasRouteAccess(admin, step.route, superAdminEmail, organisationAreaPermissions));

	let dismissing = false;
	let dismissed = false;

	$: visible = showOnboarding && !dismissed && steps.length > 0;

	async function dismiss(gotoFirst = false) {
		if (dismissing) return;
		dismissing = true;
		try {
			const res = await fetch('/hub/api/onboarding-dismiss', { method: 'POST' });
			if (res.ok) {
				dismissed = true;
				await invalidateAll();
				if (gotoFirst && steps[0]) {
					window.location.href = steps[0].href;
				}
			}
		} finally {
			dismissing = false;
		}
	}
</script>

{#if visible}
	<div class="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 p-4" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
		<div class="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
			<div class="p-6 border-b border-gray-200">
				<h2 id="onboarding-title" class="text-xl font-bold text-gray-900">Welcome to TheHUB</h2>
				<p class="mt-1 text-sm text-gray-600">Here’s where to start. Follow these steps to get the most out of your site.</p>
			</div>
			<div class="p-6 overflow-y-auto flex-1">
				<ol class="space-y-4">
					{#each steps as step, i}
						<li class="flex gap-4">
							<span class="flex-shrink-0 w-8 h-8 rounded-full bg-theme-button-1 text-white flex items-center justify-center text-sm font-medium">
								{i + 1}
							</span>
							<div>
								<a href={step.href} class="font-medium text-theme-button-1 hover:underline">{step.title}</a>
								<p class="text-sm text-gray-600 mt-0.5">{step.description}</p>
							</div>
						</li>
					{/each}
				</ol>
			</div>
			<div class="p-6 border-t border-gray-200 flex flex-wrap gap-3 justify-end">
				<button
					type="button"
					class="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
					on:click={() => dismiss(false)}
					disabled={dismissing}
				>
					Skip for now
				</button>
				<button
					type="button"
					class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors bg-theme-button-1 hover:opacity-90"
					on:click={() => dismiss(true)}
					disabled={dismissing}
				>
					{steps[0] ? 'Start with ' + steps[0].title : 'Get started'}
				</button>
			</div>
		</div>
	</div>
{/if}
