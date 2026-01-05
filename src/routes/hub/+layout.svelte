<script>
	import CrmShell from '$lib/crm/components/CrmShell.svelte';
	import { page } from '$app/stores';
	
	$: admin = $page.data?.admin || null;
</script>

<CrmShell {admin}>
	<slot />
</CrmShell>

