/**
 * Get panel head background color from theme
 * @param {object|null} theme - Theme object from Hub settings
 * @returns {string} Hex color string
 */
export function getPanelHeadColor(theme) {
	if (!theme || !theme.panelHeadColors || !Array.isArray(theme.panelHeadColors)) {
		return '#4A97D2';
	}
	const val = theme.panelHeadColors[0];
	if (typeof val === 'string' && val.trim() && /^#[0-9A-Fa-f]{6}$/.test(val.trim())) {
		return val.trim();
	}
	return '#4A97D2';
}
