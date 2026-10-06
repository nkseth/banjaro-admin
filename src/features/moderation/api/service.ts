'use server';

import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { toIso } from '@/lib/format';
import type { Report, ReportStatus } from './types';

const LIST_LIMIT = 300;

/**
 * Resolves a batch of document ids to a human label in one round trip.
 * `getAll` rejects an empty argument list, hence the guard.
 */
async function labelsFor(collection: string, ids: string[], field: string) {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map<string, string | null>();

  const docs = await adminDb.getAll(
    ...unique.map((id) => adminDb.collection(collection).doc(id))
  );
  // null is reserved for "the document is gone" — a document that exists but
  // has no value for the field gets a placeholder, not a missing-target flag.
  return new Map<string, string | null>(
    docs.map((doc) => [doc.id, doc.exists ? (doc.get(field) || '(untitled)') : null])
  );
}

export async function getReports(status?: ReportStatus): Promise<Report[]> {
  // No `orderBy` in the query: a report missing `createdAt` would vanish from
  // the queue entirely, and an unseen report is the one failure mode that
  // matters here. Sorted in memory below instead.
  let query = adminDb.collection('reports').limit(LIST_LIMIT) as FirebaseFirestore.Query;
  if (status) query = query.where('status', '==', status);

  const snapshot = await query.get();
  const raw = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Record<string, any>);

  const [reporterNames, userTargets, activityTargets] = await Promise.all([
    labelsFor('users', raw.map((r) => r.reporterId).filter(Boolean), 'displayName'),
    labelsFor(
      'users',
      raw.filter((r) => r.targetType === 'user').map((r) => r.targetId),
      'displayName'
    ),
    labelsFor(
      'activities',
      raw.filter((r) => r.targetType === 'activity').map((r) => r.targetId),
      'title'
    )
  ]);

  // A target named by several people is the strongest signal in the queue, so
  // the count is surfaced on every row rather than left to be eyeballed.
  const perTarget = new Map<string, number>();
  raw.forEach((r) => perTarget.set(r.targetId, (perTarget.get(r.targetId) ?? 0) + 1));

  const reports: Report[] = raw.map((r) => {
    const resolved =
      r.targetType === 'user'
        ? userTargets.get(r.targetId)
        : r.targetType === 'activity'
          ? activityTargets.get(r.targetId)
          : undefined;

    return {
      id: r.id,
      reporterId: r.reporterId ?? '',
      reporterName: reporterNames.get(r.reporterId) ?? 'Unknown',
      targetType: r.targetType,
      targetId: r.targetId,
      targetLabel: resolved ?? null,
      // `undefined` means "not a resolvable type", null means "looked and gone".
      targetMissing: resolved === null,
      reason: r.reason,
      details: r.details ?? null,
      status: r.status ?? 'open',
      targetReportCount: perTarget.get(r.targetId) ?? 1,
      createdAt: toIso(r.createdAt),
      resolvedAt: toIso(r.resolvedAt),
      resolutionNote: r.resolutionNote ?? null
    };
  });

  return reports.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

/** Reports naming one target, for the account detail page. */
export async function getReportsAgainst(targetId: string) {
  const snapshot = await adminDb
    .collection('reports')
    .where('targetId', '==', targetId)
    .limit(50)
    .get();

  return snapshot.docs
    .map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        reason: data.reason as string,
        details: (data.details ?? null) as string | null,
        status: (data.status ?? 'open') as ReportStatus,
        targetType: data.targetType as string,
        createdAt: toIso(data.createdAt)
      };
    })
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
}

export async function countOpenReports() {
  const snapshot = await adminDb
    .collection('reports')
    .where('status', '==', 'open')
    .count()
    .get();
  return snapshot.data().count;
}

/**
 * Closes a report. `resolved` means action was taken, `dismissed` means the
 * report did not hold up — the distinction is the only way to tell later
 * whether a quiet account was actually cleared or merely never looked at.
 */
export async function closeReport(
  id: string,
  status: Extract<ReportStatus, 'resolved' | 'dismissed'>,
  note?: string
) {
  await adminDb.collection('reports').doc(id).update({
    status,
    resolutionNote: note || null,
    resolvedAt: FieldValue.serverTimestamp()
  });
  return { id };
}

/** Reopens a report that was closed by mistake. */
export async function reopenReport(id: string) {
  await adminDb.collection('reports').doc(id).update({
    status: 'open',
    resolvedAt: FieldValue.delete(),
    resolutionNote: FieldValue.delete()
  });
  return { id };
}
