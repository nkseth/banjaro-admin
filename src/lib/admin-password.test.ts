// Run: node --test src/lib/admin-password.test.ts
//
// This is the sign-in gate for a console that can ban and delete real
// accounts, so the hash comparison gets its own check — a verify() that
// returns true too readily is the one bug here with no visible symptom.

import assert from 'node:assert/strict';
import test from 'node:test';
import { hashPassword, verifyPassword, verifyPlain } from './admin-password.ts';

test('the right password verifies', () => {
  assert.equal(verifyPassword('correct horse', hashPassword('correct horse')), true);
});

test('the wrong password does not', () => {
  const stored = hashPassword('correct horse');
  assert.equal(verifyPassword('correct horse ', stored), false);
  assert.equal(verifyPassword('', stored), false);
  assert.equal(verifyPassword('Correct horse', stored), false);
});

test('the same password hashes differently every time', () => {
  assert.notEqual(hashPassword('same'), hashPassword('same'));
});

test('a missing or malformed hash is a failure, never a pass', () => {
  for (const stored of [undefined, '', 'plaintext', 'scrypt:', 'scrypt::', 'bcrypt:aa:bb']) {
    assert.equal(verifyPassword('anything', stored), false, `accepted ${JSON.stringify(stored)}`);
  }
});

test('an unset bootstrap password cannot be matched', () => {
  assert.equal(verifyPlain('', undefined), false);
  assert.equal(verifyPlain('', ''), false);
  assert.equal(verifyPlain('secret', 'secret'), true);
  assert.equal(verifyPlain('secret', 'secrets'), false);
});
