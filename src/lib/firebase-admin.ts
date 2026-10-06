import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import path from 'path';
import fs from 'fs';

/**
 * The Banjaro Firebase project this console may administer.
 *
 * Guarded rather than assumed: this console disables accounts and deletes
 * data, so a service account belonging to some other project is refused
 * outright instead of silently used. Override only deliberately.
 */
const EXPECTED_PROJECT_ID = process.env.BANJARO_PROJECT_ID ?? 'banjaro-44abb';

if (!getApps().length) {
  const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

    if (serviceAccount.project_id !== EXPECTED_PROJECT_ID) {
      throw new Error(
        `service-account.json belongs to "${serviceAccount.project_id}", not "${EXPECTED_PROJECT_ID}". ` +
          'Download the Banjaro service account key (Firebase console → Project settings → ' +
          'Service accounts), or set BANJARO_PROJECT_ID if you really mean to administer another project.'
      );
    }

    initializeApp({ credential: cert(serviceAccount) });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    initializeApp();
  } else {
    throw new Error(
      'No Firebase credentials found. Put the Banjaro service-account.json in the project root, ' +
        'or point GOOGLE_APPLICATION_CREDENTIALS at it.'
    );
  }
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
