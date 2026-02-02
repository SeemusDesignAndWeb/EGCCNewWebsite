/**
 * CRM collection names. Used for init scripts, migration, and ensure-db.
 * Admins, sessions, and audit_logs stay in file store so login and audit
 * work when the database is unreachable (e.g. postgres.railway.internal not resolvable).
 */

export const FILE_ONLY_COLLECTIONS = ['admins', 'sessions', 'audit_logs'];

export const ALL_COLLECTIONS = [
	'admins',
	'audit_logs',
	'contact_tokens',
	'contacts',
	'email_stats',
	'email_templates',
	'emails',
	'event_signups',
	'event_tokens',
	'events',
	'forms',
	'holidays',
	'hub_settings',
	'lists',
	'loom_videos',
	'meeting_planners',
	'members',
	'occurrence_tokens',
	'occurrences',
	'registers',
	'rota_tokens',
	'rotas',
	'sessions',
	'week_notes'
];

/** Collections that are migrated to DB (all except file-only). */
export const COLLECTIONS_FOR_DB = ALL_COLLECTIONS.filter(
	(c) => !FILE_ONLY_COLLECTIONS.includes(c)
);
