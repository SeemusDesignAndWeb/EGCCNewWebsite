#!/usr/bin/env node
/**
 * Print a strong random password (12+ chars, upper, lower, number, special).
 * Used by create-admin-railway.sh when ADMIN_PASSWORD is not set.
 */

import { randomInt } from 'crypto';

const lower = 'abcdefghjkmnpqrstuvwxyz';
const upper = 'ABCDEFGHJKMNPQRSTUVWXYZ';
const num = '23456789';
const special = '!@#$%&*';
const all = lower + upper + num + special;

const pick = (s) => s[randomInt(0, s.length)];
const shuffle = (arr) => {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = randomInt(0, i + 1);
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
};

const chars = [pick(lower), pick(upper), pick(num), pick(special)];
for (let i = 0; i < 8; i++) chars.push(pick(all));
console.log(shuffle(chars).join(''));
