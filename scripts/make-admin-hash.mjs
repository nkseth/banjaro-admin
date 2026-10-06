#!/usr/bin/env node
// Prints the `passwordHash` value for an `admins` document.
//
//   node scripts/make-admin-hash.mjs 'the password'
//
// Then create the document in Firestore:
//   admins/<any id>  { email, name, passwordHash }

import { randomBytes, scryptSync } from 'crypto';

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/make-admin-hash.mjs '<password>'");
  process.exit(1);
}

const salt = randomBytes(16);
console.log(`scrypt:${salt.toString('hex')}:${scryptSync(password, salt, 64).toString('hex')}`);
