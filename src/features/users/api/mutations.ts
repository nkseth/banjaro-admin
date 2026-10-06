import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  banUser,
  deleteUser,
  setUserVerified,
  unbanUser,
  updateUserProfile
} from './service';
import { userKeys } from './queries';
import type { UserProfileEdit } from './types';

const invalidate = () => {
  getQueryClient().invalidateQueries({ queryKey: userKeys.all });
};

export const updateUserProfileMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: string; values: UserProfileEdit }) =>
    updateUserProfile(id, values),
  onSuccess: invalidate
});

/** `days` omitted = a permanent ban; set it for a timed suspension. */
export const banUserMutation = mutationOptions({
  mutationFn: ({ id, reason, days }: { id: string; reason: string; days?: number }) =>
    banUser(id, reason, days),
  onSuccess: invalidate
});

export const unbanUserMutation = mutationOptions({
  mutationFn: (id: string) => unbanUser(id),
  onSuccess: invalidate
});

export const setUserVerifiedMutation = mutationOptions({
  mutationFn: ({ id, verified }: { id: string; verified: boolean }) =>
    setUserVerified(id, verified),
  onSuccess: invalidate
});

export const deleteUserMutation = mutationOptions({
  mutationFn: (id: string) => deleteUser(id),
  onSuccess: invalidate
});
