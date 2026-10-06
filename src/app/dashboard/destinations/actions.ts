'use server';

import { revalidatePath } from 'next/cache';
import { clearDestinationCover } from '@/features/destinations/api/service';

export async function clearDestinationCoverAction(key: string) {
  await clearDestinationCover(key);
  revalidatePath('/dashboard/destinations');
}
