'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { toIso } from '@/lib/format';
import type {
  BanjaroUser,
  PremiumTier,
  UserFilters,
  UserProfileEdit,
  UsersResponse,
  UserStatus
} from './types';

/**
 * ponytail: the whole collection is read and filtered in memory, capped at
 * this many docs. Firestore cannot search substrings or order by a derived
 * status, and an admin needs to find any account by a fragment of a name.
 * Swap for Algolia/Typesense (or a paid `startAfter` cursor) past ~20k users.
 */
const SCAN_LIMIT = 5000;

function accountStatus(data: Record<string, any>): UserStatus {
  if (data.deletedAt) return 'deleted';
  if (data.bannedAt) return 'banned';
  // An elapsed `suspendedUntil` still counts as suspended: nothing re-enables
  // the Auth user on its own, so the account really is still locked out and
  // has to stay findable under this filter until someone lifts it.
  if (data.suspendedUntil) return 'suspended';
  return 'active';
}

function mapUser(id: string, data: Record<string, any>): BanjaroUser {
  const premium = data.premium ?? {};
  const fun = data.fun ?? {};
  const geo = data.geo ?? {};
  return {
    id,
    displayName: (data.displayName as string)?.trim() || 'Someone',
    username: data.username ?? null,
    photoUrl: data.photoUrl ?? null,
    bio: data.bio ?? null,
    gender: data.gender ?? null,
    verified: data.verified === true,
    premiumTier: (premium.tier ?? 'free') as PremiumTier,
    premiumExpiresAt: toIso(premium.expiresAt),
    funVotes: Number(fun.votes ?? 0),
    funNotes: Number(fun.notes ?? 0),
    friendCount: (data.friendIds as string[] | undefined)?.length ?? 0,
    viewsCount: Number(data.viewsCount ?? 0),
    visibility: data.visibility ?? 'public',
    isBusiness: data.isBusiness === true,
    area: geo.area ?? (geo.geohash as string | undefined)?.slice(0, 4) ?? null,
    strikes: Number(data.strikes ?? 0),
    blockedCount: (data.blockedUsers as string[] | undefined)?.length ?? 0,
    status: accountStatus(data),
    bannedAt: toIso(data.bannedAt),
    banReason: data.banReason ?? null,
    suspendedUntil: toIso(data.suspendedUntil),
    deletedAt: toIso(data.deletedAt),
    createdAt: toIso(data.createdAt),
    lastActiveAt: toIso(data.lastActiveAt)
  };
}

const SORTABLE: Record<string, (u: BanjaroUser) => string | number> = {
  name: (u) => u.displayName.toLowerCase(),
  funVotes: (u) => u.funVotes,
  strikes: (u) => u.strikes,
  createdAt: (u) => u.createdAt ?? '',
  lastActiveAt: (u) => u.lastActiveAt ?? ''
};

export async function getUsers(filters: UserFilters): Promise<UsersResponse> {
  const limit = filters.limit || 10;
  const page = filters.page || 1;
  const offset = (page - 1) * limit;

  try {
    // Deliberately no `orderBy`: Firestore drops documents missing the field,
    // and `createdAt` is not guaranteed by the rules. A moderation list that
    // silently hides accounts is worse than one that sorts in memory.
    const snapshot = await adminDb.collection('users').limit(SCAN_LIMIT).get();
    let users = snapshot.docs.map((doc) => mapUser(doc.id, doc.data()));

    if (filters.search) {
      const q = filters.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.displayName.toLowerCase().includes(q) ||
          u.username?.toLowerCase().includes(q) ||
          u.id.toLowerCase() === q
      );
    }

    if (filters.status) {
      const wanted = filters.status.split(',');
      users = users.filter((u) => wanted.includes(u.status));
    }

    if (filters.tier) {
      const wanted = filters.tier.split(',');
      users = users.filter((u) => wanted.includes(u.premiumTier));
    }

    const [sortRule] = filters.sort ? (JSON.parse(filters.sort) as { id: string; desc: boolean }[]) : [];
    const key = sortRule && SORTABLE[sortRule.id];
    if (key) {
      users.sort((a, b) => (key(a) > key(b) ? 1 : key(a) < key(b) ? -1 : 0));
      if (sortRule.desc) users.reverse();
    } else {
      users.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
    }

    return { users: users.slice(offset, offset + limit), total: users.length, offset, limit };
  } catch (error) {
    console.error('getUsers failed', error);
    return { users: [], total: 0, offset: 0, limit, error: (error as Error).message };
  }
}

/** One account, plus the Auth-side facts the profile document does not hold. */
export async function getUser(id: string) {
  const [doc, authUser] = await Promise.all([
    adminDb.collection('users').doc(id).get(),
    adminAuth.getUser(id).catch(() => null)
  ]);

  if (!doc.exists) return null;

  return {
    ...mapUser(doc.id, doc.data()!),
    phone: authUser?.phoneNumber ?? null,
    authDisabled: authUser?.disabled ?? false,
    lastSignInAt: authUser?.metadata.lastSignInTime ?? null,
    authMissing: authUser === null
  };
}

export async function updateUserProfile(id: string, values: UserProfileEdit) {
  await adminDb
    .collection('users')
    .doc(id)
    .update({
      displayName: values.displayName,
      username: values.username || null,
      bio: values.bio || null,
      ...(values.visibility && { visibility: values.visibility }),
      updatedAt: FieldValue.serverTimestamp()
    });
  return { id };
}

/**
 * Bans or suspends an account.
 *
 * Disabling the Auth user is what actually enforces it — the security rules
 * know nothing about `bannedAt`, so a Firestore flag on its own would let the
 * account keep using its existing token. Revoking refresh tokens kills the
 * session already in flight.
 *
 * ponytail: a suspension does not lift itself; nothing re-enables the Auth
 * user when `suspendedUntil` passes. The list flags elapsed suspensions so an
 * admin can lift them. Add a scheduled function if that becomes a chore.
 */
export async function banUser(id: string, reason: string, days?: number) {
  const suspendedUntil =
    days && days > 0 ? new Date(Date.now() + days * 86400000) : null;

  await adminAuth.updateUser(id, { disabled: true });
  await adminAuth.revokeRefreshTokens(id);

  await adminDb
    .collection('users')
    .doc(id)
    .update({
      // Hidden from the map either way: a banned profile should not stay
      // discoverable while its owner is locked out and cannot hide it.
      visibility: 'private',
      isDiscoverable: false,
      strikes: FieldValue.increment(1),
      banReason: reason || null,
      ...(suspendedUntil
        ? { suspendedUntil, bannedAt: FieldValue.delete() }
        : { bannedAt: FieldValue.serverTimestamp(), suspendedUntil: FieldValue.delete() }),
      updatedAt: FieldValue.serverTimestamp()
    });

  return { id };
}

/** Lifts a ban or a suspension. Visibility stays private — the user re-opens it. */
export async function unbanUser(id: string) {
  await adminAuth.updateUser(id, { disabled: false });
  await adminDb.collection('users').doc(id).update({
    bannedAt: FieldValue.delete(),
    suspendedUntil: FieldValue.delete(),
    banReason: FieldValue.delete(),
    updatedAt: FieldValue.serverTimestamp()
  });
  return { id };
}

/**
 * Grants or revokes the selfie badge.
 *
 * Revoking also drops the face descriptor, matching `revokeVerification` in
 * functions/src/verification.ts — without that the duplicate-face defence
 * would recognise the person's own old selfie and block them from ever
 * verifying again.
 */
export async function setUserVerified(id: string, verified: boolean) {
  if (!verified) await adminDb.doc(`faceIndex/${id}`).delete().catch(() => undefined);

  await adminDb
    .collection('users')
    .doc(id)
    .update({
      verified,
      verifiedAt: verified ? FieldValue.serverTimestamp() : null,
      verificationLevel: verified ? 'selfie' : 'none',
      updatedAt: FieldValue.serverTimestamp()
    });
  return { id };
}

/**
 * Deletes an account the way the app's own `deleteAccount` callable does:
 * hosted activities are cancelled rather than removed, so participants are not
 * left holding a chat for an event that no longer exists, and the profile
 * document survives as a scrubbed tombstone that chats can still resolve.
 */
export async function deleteUser(id: string) {
  const hosted = await adminDb
    .collection('activities')
    .where('hostId', '==', id)
    .where('status', 'in', ['open', 'full'])
    .get();

  const batch = adminDb.batch();
  hosted.docs.forEach((doc) =>
    batch.update(doc.ref, {
      status: 'cancelled',
      cancelReason: 'The host’s account was removed.',
      cancelledAt: FieldValue.serverTimestamp()
    })
  );
  batch.delete(adminDb.doc(`faceIndex/${id}`));
  batch.update(adminDb.doc(`users/${id}`), {
    deletedAt: FieldValue.serverTimestamp(),
    displayName: 'Deleted user',
    bio: null,
    photoUrl: null,
    photos: [],
    fcmTokens: [],
    visibility: 'private',
    isDiscoverable: false,
    verified: false
  });
  await batch.commit();

  await adminAuth.deleteUser(id).catch(() => undefined);

  return { id, cancelledActivities: hosted.size };
}
