# CLAUDE.md

Admin console for **Banjaro**, the nearby-activities app. Next.js 16 +
shadcn/ui on the front, Firebase Admin SDK against Banjaro's Firestore on the
back. The mobile app and Cloud Functions live in a separate repository.

Read **[AGENTS.md](./AGENTS.md)** first — it covers the data model, what each
page may change, and how a ban is actually enforced.

## The things most likely to bite

- **A ban is a Firebase Auth disable**, not a Firestore flag. The security
  rules never read `bannedAt`. Suspensions do not expire on their own.
- **Field names mirror the Flutter models** (`app/lib/data/models/*.dart` in the
  app repo). Check there before inventing one.
- **`'use server'` service files may export only async functions.** A stray
  `export const` silently empties the module's exports.
- **`@/lib/firebase-admin` refuses a service account from another project.** If
  startup throws about `project_id`, the key is for the wrong Firebase project —
  do not widen the check to get past it.
- **No `orderBy` on optional fields** in moderation lists: Firestore would hide
  the documents that lack the field.
