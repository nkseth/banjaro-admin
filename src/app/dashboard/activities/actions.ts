'use server';

import { revalidatePath } from 'next/cache';
import { cancelActivity, deleteActivity } from '@/features/activities/api/service';

export async function cancelActivityAction(id: string, reason: string) {
  await cancelActivity(id, reason);
  revalidatePath('/dashboard/activities');
}

export async function deleteActivityAction(id: string) {
  await deleteActivity(id);
  revalidatePath('/dashboard/activities');
}
