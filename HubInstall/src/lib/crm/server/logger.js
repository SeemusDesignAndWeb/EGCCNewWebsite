/**
 * Safe logging utility that sanitizes sensitive data
 */

/**
 * Sanitize error object to remove sensitive information
 * @param {Error} error - Error object
 * @returns {object} Sanitized error
 */
function sanitizeError(error) {
	if (!error) return null;
	
	return {
		message: error.message || 'Error occurred',
		name: error.name || 'Error',
		stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
	};
}

/**
 * Safe error logging - filters sensitive information in production
 * @param {string} message - Log message
 * @param {Error|object} error - Error object or data
 */
export function safeLogError(message, error) {
	if (process.env.NODE_ENV === 'production') {
		// In production, only log safe error information
		const sanitized = sanitizeError(error);
		console.error(message, sanitized?.message || 'Error occurred');
	} else {
		// In development, log full error details
		console.error(message, error);
	}
}

/**
 * Safe info logging
 * @param {string} message - Log message
 * @param {object} data - Optional data (will be sanitized in production)
 */
export function safeLogInfo(message, data) {
	if (process.env.NODE_ENV === 'production') {
		// In production, don't log potentially sensitive data
		console.log(message);
	} else {
		console.log(message, data);
	}
}


