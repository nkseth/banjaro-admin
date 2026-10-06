import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

/**
 * Admin password hashing, on Node's own crypto — no dependency for what
 * scrypt already does.
 *
 * Stored as `scrypt:<saltHex>:<keyHex>`, so the format carries its own
 * algorithm label and can be migrated later without guessing.
 */
const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, KEY_LENGTH);
  return `scrypt:${salt.toString('hex')}:${key.toString('hex')}`;
}

/** Constant-time comparison; false for anything malformed rather than throwing. */
export function verifyPassword(password: string, stored: string | undefined): boolean {
  if (!stored) return false;
  const [scheme, saltHex, keyHex] = stored.split(':');
  if (scheme !== 'scrypt' || !saltHex || !keyHex) return false;

  const expected = Buffer.from(keyHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/** Same comparison for the bootstrap admin, whose password comes from the env. */
export function verifyPlain(password: string, expected: string | undefined): boolean {
  if (!expected) return false;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
