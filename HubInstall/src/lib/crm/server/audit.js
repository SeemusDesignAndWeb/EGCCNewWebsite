import { create } from './fileStore.js';
import { generateId } from './ids.js';

/**
 * Log an audit event
 * @param {string} adminId - Admin user ID
 * @param {string} action - Action performed (e.g., 'login', 'create_contact', 'update_newsletter')
 * @param {object} details - Additional details about the action
 * @param {object} event - Optional SvelteKit event for IP and user agent
 * @returns {Promise<object>} Created audit log entry
 */
export async function logAuditEvent(adminId, action, details = {}, event = null) {
	const auditLog = {
		id: generateId(),
		adminId,
		action,
		details,
		ipAddress: event?.getClientAddress?.() || 'unknown',
		userAgent: event?.request?.headers?.get('user-agent') || 'unknown',
		timestamp: new Date().toISOString()
	};

	await create('audit_logs', auditLog);
	return auditLog;
}


