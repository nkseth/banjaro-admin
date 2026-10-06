import type { InfobarContent } from '@/components/ui/infobar';

export const usersInfoContent: InfobarContent = {
  title: 'Accounts & moderation',
  sections: [
    {
      title: 'What a row is',
      description:
        'One document in the `users` collection — a phone sign-up from the app. There are no emails and no invited accounts: everyone here created themselves. Search matches display name, @handle, or an exact uid.'
    },
    {
      title: 'Banning and suspending',
      description:
        'Both disable the Firebase Auth account and revoke its refresh tokens, so the person is signed out of the app within seconds rather than at their next token refresh. The profile is also forced private so it leaves the map. A reason is required and is stored on the profile as `banReason`.'
    },
    {
      title: 'Suspensions do not expire on their own',
      description:
        'A suspension records `suspendedUntil` and nothing reads it back — no scheduled job re-enables the account. Filter by Suspended to find terms that have been served; the status column marks them "term served — lift it".'
    },
    {
      title: 'Verification',
      description:
        'Granting sets the selfie badge by hand, bypassing liveness — use it only to restore a badge the pipeline lost. Revoking also deletes the stored face descriptor, which is what lets the person verify again; without that the duplicate-face check would recognise their own old selfie and refuse.'
    },
    {
      title: 'Deleting an account',
      description:
        'Does what the in-app deletion does: cancels activities they were hosting, scrubs the profile down to a "Deleted user" tombstone so existing chats still resolve, drops the face descriptor, and deletes the Auth user. It is not reversible.'
    }
  ]
};
