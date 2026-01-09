import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { env } from '$env/dynamic/private';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get the encryption key from environment
 * @returns {Buffer} 32-byte key
 */
function getKey() {
	const keyBase64 = env.CRM_SECRET_KEY;
	if (!keyBase64) {
		throw new Error('CRM_SECRET_KEY environment variable is required');
	}

	try {
		const key = Buffer.from(keyBase64, 'base64');
		if (key.length !== 32) {
			throw new Error('CRM_SECRET_KEY must be a base64-encoded 32-byte key');
		}
		return key;
	} catch (error) {
		throw new Error(`Invalid CRM_SECRET_KEY: ${error.message}`);
	}
}

/**
 * Encrypt sensitive data (for safeguarding)
 * @param {string} plaintext - Data to encrypt
 * @returns {string} Encrypted data (base64 encoded)
 */
export function encrypt(plaintext) {
	if (!plaintext) {
		return '';
	}

	const key = getKey();
	const iv = randomBytes(IV_LENGTH);
	const cipher = createCipheriv(ALGORITHM, key, iv);

	let encrypted = cipher.update(plaintext, 'utf8', 'base64');
	encrypted += cipher.final('base64');
	const authTag = cipher.getAuthTag();

	// Combine IV + authTag + encrypted data
	const combined = Buffer.concat([
		iv,
		authTag,
		Buffer.from(encrypted, 'base64')
	]);

	return combined.toString('base64');
}

/**
 * Decrypt sensitive data
 * @param {string} ciphertext - Encrypted data (base64 encoded)
 * @returns {string} Decrypted plaintext
 */
export function decrypt(ciphertext) {
	if (!ciphertext) {
		return '';
	}

	const key = getKey();
	const combined = Buffer.from(ciphertext, 'base64');

	if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
		throw new Error('Invalid ciphertext format');
	}

	const iv = combined.subarray(0, IV_LENGTH);
	const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
	const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

	const decipher = createDecipheriv(ALGORITHM, key, iv);
	decipher.setAuthTag(authTag);

	let decrypted = decipher.update(encrypted, null, 'utf8');
	decrypted += decipher.final('utf8');

	return decrypted;
}

