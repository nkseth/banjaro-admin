'use server';

import { revalidatePath } from 'next/cache';
import { closeReport, reopenReport } from '@/features/moderation/api/service';
import { banUser } from '@/features/users/api/service';
import { cancelActivity } from '@/features/activities/api/service';

/**
 * Thin wrappers so the page re-renders after a decision. The services
 * themselves stay route-agnostic.
 */
export async function closeReportAction(
  id: string,
  status: 'resolved' | 'dismissed',
  note?: string
) {
  await closeReport(id, status, note);
  revalidatePath('/dashboard/reports');
}

export async function reopenReportAction(id: string) {
  await reopenReport(id);
  revalidatePath('/dashboard/reports');
}

/** Bans the reported account and closes the report in one step. */
export async function banFromReportAction(
  reportId: string,
  userId: string,
  reason: string,
  days?: number
) {
  await banUser(userId, reason, days);
  await closeReport(reportId, 'resolved', days ? `Suspended ${days} days` : 'Banned');
  revalidatePath('/dashboard/reports');
  revalidatePath('/dashboard/users');
}

/** Takes the reported activity down and closes the report in one step. */
export async function cancelFromReportAction(
  reportId: string,
  activityId: string,
  reason: string
) {
  await cancelActivity(activityId, reason);
  await closeReport(reportId, 'resolved', 'Activity cancelled');
  revalidatePath('/dashboard/reports');
  revalidatePath('/dashboard/activities');
}
