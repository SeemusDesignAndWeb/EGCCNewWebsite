/**
 * Sanitize HTML content on the server side
 * Note: HTML is already sanitized on the client side with DOMPurify
 * This provides an additional layer of security by removing dangerous elements
 * @param {string} html - HTML content to sanitize
 * @returns {Promise<string>} Sanitized HTML
 */
export async function sanitizeHtml(html) {
	if (!html) return '';
	
	// Since HTML is already sanitized on the client side, we use a simpler approach
	// that doesn't require jsdom (which has ES module compatibility issues)
	// This removes dangerous elements as a defense-in-depth measure
	
	try {
		// Remove script tags and their content
		let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
		
		// Remove event handlers from attributes (onclick, onerror, etc.)
		sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
		sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
		
		// Remove javascript: and data: URLs from href and src attributes
		sanitized = sanitized.replace(/(href|src)\s*=\s*["']?\s*javascript:/gi, '$1="#');
		sanitized = sanitized.replace(/(href|src)\s*=\s*["']?\s*data:text\/html/gi, '$1="#');
		
		// Remove iframe, embed, object tags (can be used for XSS)
		sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
		sanitized = sanitized.replace(/<embed\b[^>]*>/gi, '');
		sanitized = sanitized.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
		
		return sanitized;
	} catch (error) {
		console.error('Error sanitizing HTML:', error);
		// Fallback: basic script tag removal
		return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
	}
}


