'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { toIso } from '@/lib/format';

export type DestinationRow = {
  key: string;
  name: string;
  countryCode: string;
  coverUrl: string | null;
  tripCount: number;
  updatedAt: string | null;
};

const LIST_LIMIT = 200;

/**
 * Destinations with their live trip counts.
 *
 * The count is read per destination rather than stored, because `trips` has no
 * counter and a stale number here would send an admin looking at the wrong
 * place. Aggregation queries are cheap — they bill per batch of index entries
 * read, not per document.
 */
export async function getDestinations(): Promise<DestinationRow[]> {
  const snapshot = await adminDb.collection('destinations').limit(LIST_LIMIT).get();

  const rows = await Promise.all(
    snapshot.docs.map(async (doc) => {
      const data = doc.data();
      const trips = await adminDb
        .collection('trips')
        .where('destinationKey', '==', doc.id)
        .count()
        .get();

      return {
        key: doc.id,
        name: data.name ?? doc.id,
        countryCode: data.countryCode ?? '',
        coverUrl: data.coverUrl ?? null,
        tripCount: trips.data().count,
        updatedAt: toIso(data.updatedAt)
      };
    })
  );

  return rows.sort((a, b) => b.tripCount - a.tripCount);
}

/**
 * Clears a destination's cover photo.
 *
 * The cover is whatever the first traveller to post a trip photo there
 * uploaded, and the security rules only let it be set while it is null — so
 * clearing it is both the takedown for a bad cover and the only way to let the
 * next photo claim the slot.
 */
export async function clearDestinationCover(key: string) {
  await adminDb.collection('destinations').doc(key).update({
    coverUrl: null,
    updatedAt: FieldValue.serverTimestamp()
  });
  return { key };
}
