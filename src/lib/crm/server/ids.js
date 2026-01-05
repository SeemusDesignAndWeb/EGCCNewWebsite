import { ulid } from 'ulid';

/**
 * Generate a new ULID
 * @returns {string} ULID string
 */
export function generateId() {
	return ulid();
}

