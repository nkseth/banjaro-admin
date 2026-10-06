'use server';

import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { countActivitiesByStatus } from '@/features/activities/api/service';
import { countOpenReports } from '@/features/moderation/api/service';

const DAY_MS = 86400000;

/**
 * How many days of sign-ups the chart covers. Not exported — a `'use server'`
 * module may only export async functions, and the page reads the window off
 * the length of the series instead.
 */
const SIGNUP_WINDOW_DAYS = 14;

async function countWhere(
  collection: string,
  build: (query: FirebaseFirestore.Query) => FirebaseFirestore.Query
) {
  const snapshot = await build(adminDb.collection(collection)).count().get();
  return snapshot.data().count;
}

export async function getOverviewStats() {
  const since = Timestamp.fromMillis(Date.now() - 7 * DAY_MS);

  const [
    users,
    verified,
    // `orderBy` on an optional field counts only the documents that have it,
    // which is exactly "accounts that were banned" — and it uses the automatic
    // single-field index rather than needing one built by hand.
    banned,
    suspended,
    newThisWeek,
    trips,
    destinations,
    activities,
    openReports
  ] = await Promise.all([
    countWhere('users', (q) => q),
    countWhere('users', (q) => q.where('verified', '==', true)),
    countWhere('users', (q) => q.orderBy('bannedAt')),
    countWhere('users', (q) => q.orderBy('suspendedUntil')),
    countWhere('users', (q) => q.where('createdAt', '>=', since)),
    countWhere('trips', (q) => q),
    countWhere('destinations', (q) => q),
    countActivitiesByStatus(),
    countOpenReports()
  ]);

  return {
    users,
    verified,
    banned,
    suspended,
    newThisWeek,
    trips,
    destinations,
    activities,
    openReports
  };
}

/** Sign-ups per day over the window, oldest first, with empty days kept. */
export async function getSignupsByDay() {
  const since = new Date(Date.now() - (SIGNUP_WINDOW_DAYS - 1) * DAY_MS);
  since.setHours(0, 0, 0, 0);

  // `select()` with no fields returns id-only documents — the timestamp still
  // has to come back, but nothing else does.
  const snapshot = await adminDb
    .collection('users')
    .where('createdAt', '>=', Timestamp.fromDate(since))
    .select('createdAt')
    .get();

  const counts = new Map<string, number>();
  for (let i = 0; i < SIGNUP_WINDOW_DAYS; i++) {
    counts.set(new Date(since.getTime() + i * DAY_MS).toISOString().slice(0, 10), 0);
  }

  snapshot.docs.forEach((doc) => {
    const day = doc.get('createdAt')?.toDate?.().toISOString().slice(0, 10);
    if (day && counts.has(day)) counts.set(day, counts.get(day)! + 1);
  });

  return [...counts].map(([day, signups]) => ({ day, signups }));
}
