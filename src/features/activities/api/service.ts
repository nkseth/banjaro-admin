'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { toIso } from '@/lib/format';
import type { ActivityRow, ActivityStatus } from './types';

const LIST_LIMIT = 300;

function mapActivity(id: string, data: Record<string, any>): ActivityRow {
  const geo = data.geo ?? {};
  const point = geo.geopoint;
  return {
    id,
    title: data.title ?? 'Untitled',
    category: data.category ?? 'other',
    hostId: data.hostId ?? '',
    hostName: data.hostName ?? 'Someone',
    hostVerified: data.hostVerified === true,
    hostIsBusiness: data.hostIsBusiness === true,
    placeName: data.placeName ?? null,
    latitude: point?.latitude ?? null,
    longitude: point?.longitude ?? null,
    startAt: toIso(data.startAt),
    endAt: toIso(data.endAt),
    capacity: Number(data.capacity ?? 0),
    participantCount: Number(data.participantCount ?? 0),
    status: (data.status ?? 'open') as ActivityStatus,
    visibility: data.visibility ?? 'public',
    coverUrl: data.coverUrl ?? null,
    chatId: data.chatId ?? null,
    cancelReason: data.cancelReason ?? null,
    boostedUntil: toIso(data.boostedUntil),
    createdAt: toIso(data.createdAt)
  };
}

export async function getActivities(opts: { status?: ActivityStatus; search?: string } = {}) {
  let query = adminDb.collection('activities').limit(LIST_LIMIT) as FirebaseFirestore.Query;
  if (opts.status) query = query.where('status', '==', opts.status);

  const snapshot = await query.get();
  let rows = snapshot.docs.map((doc) => mapActivity(doc.id, doc.data()));

  if (opts.search) {
    const q = opts.search.toLowerCase();
    rows = rows.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.hostName.toLowerCase().includes(q) ||
        a.placeName?.toLowerCase().includes(q) ||
        a.id === opts.search
    );
  }

  // Latest start time first, so upcoming and just-happened activities sit at
  // the top and the long tail of finished ones sinks.
  return rows.sort((a, b) => (b.startAt ?? '').localeCompare(a.startAt ?? ''));
}

export async function getActivitiesHostedBy(hostId: string) {
  const snapshot = await adminDb
    .collection('activities')
    .where('hostId', '==', hostId)
    .limit(50)
    .get();
  return snapshot.docs
    .map((doc) => mapActivity(doc.id, doc.data()))
    .sort((a, b) => (b.startAt ?? '').localeCompare(a.startAt ?? ''));
}

/**
 * Takes an activity down the way its host would, including the system message
 * in the group chat — people who joined are already planning around it, so
 * silently flipping the status would leave them turning up to nothing.
 *
 * ponytail: no push notification goes out. The app's own `cancelActivity`
 * notifies each participant; replicating that needs the FCM token fan-out, so
 * the chat message is the notice for now.
 */
export async function cancelActivity(id: string, reason: string) {
  const ref = adminDb.collection('activities').doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('That activity no longer exists.');

  await ref.update({
    status: 'cancelled',
    cancelReason: reason,
    cancelledAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });

  const chatId = snap.get('chatId');
  if (chatId) {
    await adminDb.collection('chats').doc(chatId).collection('messages').add({
      type: 'system',
      senderId: 'system',
      text: `This activity was removed by Banjaro: ${reason}`,
      createdAt: FieldValue.serverTimestamp(),
      readBy: []
    });
  }

  return { id };
}

/**
 * Hard delete, mirroring the `deleteActivity` callable: participants, the
 * group chat and its messages go too, otherwise the chat survives pointing at
 * an activity that is not there.
 *
 * `recursiveDelete` handles the subcollections and the batching, so a chat
 * with thousands of messages does not run into the 500-write batch ceiling.
 *
 * ponytail: the cover image is left in Cloud Storage. Deleting it needs the
 * storage bucket wired up here; cancel-and-keep is the usual action anyway.
 */
export async function deleteActivity(id: string) {
  const ref = adminDb.collection('activities').doc(id);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('That activity no longer exists.');

  const chatId = snap.get('chatId');
  if (chatId) await adminDb.recursiveDelete(adminDb.collection('chats').doc(chatId));
  await adminDb.recursiveDelete(ref);

  return { id };
}

export async function countActivitiesByStatus() {
  const statuses: ActivityStatus[] = ['open', 'full', 'cancelled', 'ended'];
  const counts = await Promise.all(
    statuses.map((status) =>
      adminDb.collection('activities').where('status', '==', status).count().get()
    )
  );
  return Object.fromEntries(
    statuses.map((status, i) => [status, counts[i].data().count])
  ) as Record<ActivityStatus, number>;
}
