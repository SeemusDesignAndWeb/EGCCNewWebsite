<script>
	import '$lib/crm/hub.css';
	import CrmShell from '$lib/crm/components/CrmShell.svelte';
	import { page } from '$app/stores';

	export let params = {};
	$: admin = $page.data?.admin || null;
	$: theme = $page.data?.theme || null;

	function getColor(val, fallback) {
		return typeof val === 'string' && val.trim() && /^#[0-9A-Fa-f]{6}$/.test(val.trim()) ? val.trim() : fallback;
	}

	// Hub theme: set CSS variables on document (client-side only; avoids PostCSS preprocessing issues)
	$: if (typeof document !== 'undefined' && theme) {
		const root = document.documentElement;
		root.style.setProperty('--color-primary', getColor(theme.primaryColor, '#4BB170'));
		root.style.setProperty('--color-brand', getColor(theme.brandColor, '#4A97D2'));
		const navbarBg = theme.navbarBackgroundColor;
		if (typeof navbarBg === 'string') {
			const t = navbarBg.trim();
			if (t && /^#[0-9A-Fa-f]{6}$/.test(t) && t !== '#FFFFFF' && t !== '#ffffff') {
				root.style.setProperty('--color-navbar-bg', t);
			} else {
				root.style.setProperty('--color-navbar-bg', '#4A97D2');
			}
		} else {
			root.style.setProperty('--color-navbar-bg', '#4A97D2');
		}
		root.style.setProperty('--color-button-1', getColor(theme.buttonColors?.[0], '#4A97D2'));
		root.style.setProperty('--color-button-2', getColor(theme.buttonColors?.[1], '#4BB170'));
		root.style.setProperty('--color-button-3', getColor(theme.buttonColors?.[2], '#3B79A8'));
		root.style.setProperty('--color-button-4', getColor(theme.buttonColors?.[3], '#3C8E5A'));
		root.style.setProperty('--color-button-5', getColor(theme.buttonColors?.[4], '#E6A324'));
		root.style.setProperty('--color-panel-head-1', getColor(theme.panelHeadColors?.[0], '#4A97D2'));
		root.style.setProperty('--color-panel-head-2', getColor(theme.panelHeadColors?.[1], '#3B79A8'));
		root.style.setProperty('--color-panel-head-3', getColor(theme.panelHeadColors?.[2], '#2C5B7E'));
		root.style.setProperty('--color-panel-bg', getColor(theme.panelBackgroundColor, '#E8F2F9'));
	}
</script>

<CrmShell {admin} {theme}>
	<slot />
</CrmShell>
