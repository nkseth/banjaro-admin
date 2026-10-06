import * as z from 'zod';

/**
 * Admin-side profile edit. Deliberately narrow: this exists to scrub an
 * abusive display name, handle or bio, not to author profiles — people create
 * their own through the app, so there is no "new user" form.
 */
export const userProfileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(40),
  username: z.string().max(30).optional().or(z.literal('')),
  bio: z.string().max(300).optional().or(z.literal('')),
  visibility: z.enum(['public', 'activities_only', 'private']).optional()
});

export type UserProfileFormValues = z.infer<typeof userProfileSchema>;
