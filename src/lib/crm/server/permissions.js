/**
 * Personalized permissions system
 * 
 * Each admin can have personalized access to different areas of the hub.
 * Super Admin (john.watson@egcc.co.uk) always has full access to everything.
 */

// Hub area permission constants
export const HUB_AREAS = {
	CONTACTS: 'contacts',
	LISTS: 'lists',
	ROTAS: 'rotas',
	EVENTS: 'events',
	MEETING_PLANNERS: 'meeting_planners',
	NEWSLETTERS: 'newsletters',
	FORMS: 'forms',
	SAFEGUARDING_FORMS: 'safeguarding_forms',
	MEMBERS: 'members',
	USERS: 'users' // Admin management - only super admin
};

// Route to hub area mapping
const ROUTE_TO_AREA = {
	'/hub/contacts': HUB_AREAS.CONTACTS,
	'/hub/lists': HUB_AREAS.LISTS,
	'/hub/rotas': HUB_AREAS.ROTAS,
	'/hub/events': HUB_AREAS.EVENTS,
	'/hub/meeting-planners': HUB_AREAS.MEETING_PLANNERS,
	'/hub/newsletters': HUB_AREAS.NEWSLETTERS,
	'/hub/forms': HUB_AREAS.FORMS,
	'/hub/members': HUB_AREAS.MEMBERS,
	'/hub/users': HUB_AREAS.USERS
};

// Legacy admin level constants (for backward compatibility during migration)
export const ADMIN_LEVELS = {
	SUPER_ADMIN: 'super_admin',
	LEVEL_2: 'level_2',
	LEVEL_2B: 'level_2b',
	LEVEL_3: 'level_3',
	LEVEL_4: 'level_4'
};

/**
 * Check if admin is super admin
 * @param {object} admin - Admin user object
 * @returns {boolean} True if admin is super admin
 */
export function isSuperAdmin(admin) {
	if (!admin) return false;
	
	// Check if email is john.watson@egcc.co.uk for super admin
	if (admin.email && admin.email.toLowerCase() === 'john.watson@egcc.co.uk') {
		return true;
	}
	
	// Check if adminLevel is super_admin (for backward compatibility)
	if (admin.adminLevel === ADMIN_LEVELS.SUPER_ADMIN) {
		return true;
	}
	
	return false;
}

/**
 * Get admin permissions array from admin object
 * Handles both new permissions array and legacy adminLevel
 * @param {object} admin - Admin user object
 * @returns {string[]} Array of permission area strings
 */
export function getAdminPermissions(admin) {
	if (!admin) return [];
	
	// Super admin has all permissions
	if (isSuperAdmin(admin)) {
		return Object.values(HUB_AREAS);
	}
	
	// If admin has permissions array, use it
	if (admin.permissions && Array.isArray(admin.permissions)) {
		return admin.permissions;
	}
	
	// Legacy: Convert adminLevel to permissions array for backward compatibility
	if (admin.adminLevel) {
		return convertAdminLevelToPermissions(admin.adminLevel);
	}
	
	// Default: no permissions (shouldn't happen, but safe fallback)
	return [];
}

/**
 * Convert legacy adminLevel to permissions array
 * @param {string} adminLevel - Legacy admin level
 * @returns {string[]} Array of permission area strings
 */
function convertAdminLevelToPermissions(adminLevel) {
	switch (adminLevel) {
		case ADMIN_LEVELS.SUPER_ADMIN:
			return Object.values(HUB_AREAS);
		case ADMIN_LEVELS.LEVEL_2:
			return [HUB_AREAS.CONTACTS, HUB_AREAS.LISTS, HUB_AREAS.ROTAS, HUB_AREAS.EVENTS, HUB_AREAS.MEETING_PLANNERS];
		case ADMIN_LEVELS.LEVEL_2B:
			return [HUB_AREAS.CONTACTS, HUB_AREAS.LISTS, HUB_AREAS.ROTAS, HUB_AREAS.EVENTS, HUB_AREAS.MEETING_PLANNERS, HUB_AREAS.NEWSLETTERS];
		case ADMIN_LEVELS.LEVEL_3:
			return [HUB_AREAS.CONTACTS, HUB_AREAS.LISTS, HUB_AREAS.ROTAS, HUB_AREAS.EVENTS, HUB_AREAS.MEETING_PLANNERS, HUB_AREAS.NEWSLETTERS, HUB_AREAS.SAFEGUARDING_FORMS];
		case ADMIN_LEVELS.LEVEL_4:
			return [HUB_AREAS.CONTACTS, HUB_AREAS.LISTS, HUB_AREAS.ROTAS, HUB_AREAS.EVENTS, HUB_AREAS.MEETING_PLANNERS, HUB_AREAS.NEWSLETTERS, HUB_AREAS.FORMS];
		default:
			return [];
	}
}

/**
 * Get admin level from admin object (for backward compatibility)
 * @param {object} admin - Admin user object
 * @returns {string} Admin level or 'level_2' as default
 * @deprecated Use getAdminPermissions instead
 */
export function getAdminLevel(admin) {
	if (!admin) return null;
	
	if (isSuperAdmin(admin)) {
		return ADMIN_LEVELS.SUPER_ADMIN;
	}
	
	// Return adminLevel from admin object, default to level_2
	return admin.adminLevel || ADMIN_LEVELS.LEVEL_2;
}

/**
 * Get the hub area for a given route
 * @param {string} pathname - Route pathname
 * @returns {string|null} Hub area or null if not mapped
 */
function getAreaForRoute(pathname) {
	// Check exact route match first
	if (ROUTE_TO_AREA[pathname]) {
		return ROUTE_TO_AREA[pathname];
	}
	
	// Check route prefixes
	for (const [route, area] of Object.entries(ROUTE_TO_AREA)) {
		if (pathname.startsWith(route)) {
			return area;
		}
	}
	
	return null;
}

/**
 * Check if admin has access to a route
 * @param {object} admin - Admin user object
 * @param {string} pathname - Route pathname
 * @returns {boolean} True if admin has access
 */
export function hasRouteAccess(admin, pathname) {
	if (!admin) return false;
	
	// Super admin has access to everything
	if (isSuperAdmin(admin)) {
		return true;
	}
	
	// Dashboard, Profile, Help, and Video Tutorials (viewing) are accessible to all authenticated admins
	if (pathname === '/hub' || pathname === '/hub/profile' || pathname === '/hub/help' || pathname === '/hub/video-tutorials') {
		return true;
	}
	
	// Video management pages (/hub/videos) are only for super admin
	if (pathname.startsWith('/hub/videos')) {
		return isSuperAdmin(admin);
	}
	
	// Get the hub area for this route
	const area = getAreaForRoute(pathname);
	if (!area) {
		// Unknown route - deny access
		return false;
	}
	
	// Users area is only for super admin (already checked above)
	if (area === HUB_AREAS.USERS) {
		return false;
	}
	
	// Check if admin has permission for this area
	const permissions = getAdminPermissions(admin);
	return permissions.includes(area);
}

/**
 * Check if admin can access safeguarding forms
 * @param {object} admin - Admin user object
 * @returns {boolean} True if admin can access safeguarding forms
 */
export function canAccessSafeguarding(admin) {
	if (!admin) return false;
	
	// Super admin has access to everything
	if (isSuperAdmin(admin)) {
		return true;
	}
	
	const permissions = getAdminPermissions(admin);
	return permissions.includes(HUB_AREAS.SAFEGUARDING_FORMS);
}

/**
 * Check if admin can access non-safeguarding forms
 * @param {object} admin - Admin user object
 * @returns {boolean} True if admin can access non-safeguarding forms
 */
export function canAccessForms(admin) {
	if (!admin) return false;
	
	// Super admin has access to everything
	if (isSuperAdmin(admin)) {
		return true;
	}
	
	const permissions = getAdminPermissions(admin);
	return permissions.includes(HUB_AREAS.FORMS);
}

/**
 * Check if admin can access newsletters
 * @param {object} admin - Admin user object
 * @returns {boolean} True if admin can access newsletters
 */
export function canAccessNewsletters(admin) {
	if (!admin) return false;
	
	// Super admin has access to everything
	if (isSuperAdmin(admin)) {
		return true;
	}
	
	const permissions = getAdminPermissions(admin);
	return permissions.includes(HUB_AREAS.NEWSLETTERS);
}

/**
 * Get all available hub areas for permission selection
 * @returns {Array} Array of hub area objects
 */
export function getAvailableHubAreas() {
	return [
		{ 
			value: HUB_AREAS.CONTACTS, 
			label: 'Contacts',
			description: 'Manage contact database'
		},
		{ 
			value: HUB_AREAS.LISTS, 
			label: 'Lists',
			description: 'Manage contact lists'
		},
		{ 
			value: HUB_AREAS.ROTAS, 
			label: 'Rotas',
			description: 'Manage volunteer rotas'
		},
		{ 
			value: HUB_AREAS.EVENTS, 
			label: 'Events',
			description: 'Manage events and calendar'
		},
		{ 
			value: HUB_AREAS.MEETING_PLANNERS, 
			label: 'Meeting Planners',
			description: 'Plan and manage meetings'
		},
		{ 
			value: HUB_AREAS.NEWSLETTERS, 
			label: 'Newsletters',
			description: 'Create and send newsletters'
		},
		{ 
			value: HUB_AREAS.FORMS, 
			label: 'Forms (Non-Safeguarding)',
			description: 'Manage general forms and submissions'
		},
		{ 
			value: HUB_AREAS.SAFEGUARDING_FORMS, 
			label: 'Safeguarding Forms',
			description: 'Access safeguarding forms and submissions'
		},
		{ 
			value: HUB_AREAS.MEMBERS, 
			label: 'Members',
			description: 'Manage church members and membership information'
		}
	];
}

/**
 * Check if admin can create another admin
 * @param {object} admin - Admin user object
 * @returns {boolean} True if admin can create other admins
 */
export function canCreateAdmin(admin) {
	if (!admin) return false;
	return isSuperAdmin(admin);
}
