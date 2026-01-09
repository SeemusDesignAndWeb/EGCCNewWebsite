<script>
	import { notifications } from '$lib/crm/stores/notifications.js';
	
	$: notificationList = $notifications;
	
	function getIcon(type) {
		switch (type) {
			case 'success':
				return '✓';
			case 'error':
				return '✕';
			case 'warning':
				return '⚠';
			case 'info':
			default:
				return 'ℹ';
		}
	}
	
	function getBgColor(type) {
		switch (type) {
			case 'success':
				return 'bg-green-500';
			case 'error':
				return 'bg-red-500';
			case 'warning':
				return 'bg-yellow-500';
			case 'info':
			default:
				return 'bg-blue-500';
		}
	}
	
	function getTextColor(type) {
		switch (type) {
			case 'success':
				return 'text-green-800';
			case 'error':
				return 'text-red-800';
			case 'warning':
				return 'text-yellow-800';
			case 'info':
			default:
				return 'text-blue-800';
		}
	}
	
	function getBorderColor(type) {
		switch (type) {
			case 'success':
				return 'border-green-300';
			case 'error':
				return 'border-red-300';
			case 'warning':
				return 'border-yellow-300';
			case 'info':
			default:
				return 'border-blue-300';
		}
	}
</script>

<div class="fixed top-4 right-4 z-50 space-y-2 max-w-md w-full">
	{#each notificationList as notification (notification.id)}
		<div
			class="bg-white shadow-lg rounded-lg border-2 {getBorderColor(notification.type)} p-4 flex items-start gap-3 animate-slide-in-right"
			role="alert"
		>
			<div class="flex-shrink-0 w-8 h-8 rounded-full {getBgColor(notification.type)} flex items-center justify-center text-white font-bold text-sm">
				{getIcon(notification.type)}
			</div>
			<div class="flex-1 min-w-0">
				<p class="text-sm font-medium {getTextColor(notification.type)}">
					{@html notification.message}
				</p>
			</div>
			<button
				on:click={() => notifications.remove(notification.id)}
				class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
				aria-label="Close notification"
			>
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	{/each}
</div>

<style>
	@keyframes slide-in-right {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}
	
	.animate-slide-in-right {
		animation: slide-in-right 0.3s ease-out;
	}
</style>

