# AGENTS.md — Banjaro Admin

The moderation and operations console for **Banjaro** (`com.banjaro.banjaro`),
the location-based activities app. This is a Next.js dashboard that talks to
Banjaro's Firebase project with the Admin SDK — it is not part of the mobile
app and has no code in common with it.

The app itself lives in a separate repository (Flutter + Cloud Functions).
Everything this console reads and writes belongs to that project's Firestore,
so **field names here are a contract with the Dart models**: rename a field in
`app/lib/data/models/*.dart` and the matching `api/types.ts` has to follow.

```
src/app/dashboard/   One route per page; server components by default
src/features/        One folder per domain: api/ (types, service) + components/
src/components/ui/   shadcn primitives — not Banjaro-specific, leave alone
src/lib/             firebase-admin init, formatting, table/search plumbing
```

## What the console can do

| Page | Reads | Can change |
|---|---|---|
| Overview | counts across `users`, `activities`, `reports`, `trips` | nothing |
| Accounts | `users` | ban, suspend, lift, verify, revoke, edit profile text, delete |
| Reports | `reports` (no client can read these at all) | resolve, dismiss, reopen, and ban/take down from the row |
| Activities | `activities` | cancel (with a chat notice), hard delete with its chat |
| Destinations | `destinations` + `trips` counts | clear a traveller-uploaded cover photo |

## How a ban actually works

`banUser` in [service.ts](src/features/users/api/service.ts) disables the
**Firebase Auth** user and revokes its refresh tokens. That is the enforcement:
Banjaro's `firestore.rules` know nothing about a `bannedAt` field, so a
Firestore flag alone would leave the account working until its token expired.
The Firestore fields (`bannedAt`, `suspendedUntil`, `banReason`, `strikes`) are
the record, not the mechanism.

A suspension therefore **does not lift itself** — nothing re-enables the Auth
user when `suspendedUntil` passes. The Accounts list marks served terms so they
can be lifted by hand; a scheduled Cloud Function is the upgrade path.

## Firestore shape this console relies on

- `users/{uid}` — profile. Server-owned fields the mobile client may never
  write: `verified`, `premium`, `role`, `strikes`, `suspendedUntil`, `fun`,
  `friendIds`, `viewsCount`. This console writes them with the Admin SDK, which
  bypasses the rules.
- `activities/{id}` — with a `participants` subcollection and a `chatId`.
- `chats/{id}/messages` — `type: 'system'` messages come from the Admin SDK.
- `reports/{id}` — `reporterId`, `targetType`, `targetId`, `reason`, `status`.
  Reported *messages* carry only a message id with no chat id, so they cannot be
  resolved to their text; add the chat id in the app's `submitReport` if message
  moderation becomes routine.
- `faceIndex/{uid}` — face descriptor, never client-readable. Deleted when a
  verification is revoked so the person can verify again.
- `destinations/{key}` — `coverUrl` is set by the first traveller to upload a
  photo and the rules only allow it while it is null; clearing it is both the
  takedown and the way to let the next photo claim the slot.

## Conventions

- **Firebase access only through `@/lib/firebase-admin`.** It refuses a service
  account whose `project_id` is not `BANJARO_PROJECT_ID` — this console bans and
  deletes real accounts, so pointing it at the wrong project is not a mistake
  worth allowing.
- **A feature's `api/service.ts` is `'use server'`** and may export *only async
  functions* — a plain `export const` collapses every export in the module.
  Types live in `api/types.ts`, constants stay un-exported.
- **Firestore `Timestamp` never leaves a service.** Map it with `toIso` from
  `@/lib/format` so components deal in ISO strings.
- **Avoid `orderBy` on optional fields** in moderation queries: Firestore drops
  documents that lack the field, and an account or report that silently fails to
  appear is the one failure mode that matters here. Sort in memory instead.
- **Accounts uses the React Query + nuqs data-table stack** (`useDataTable`,
  `searchParamsCache`, filter ids matching column ids). The other pages are
  plain server components with `actions.ts` + `revalidatePath`, which is less
  machinery for a table that needs no client-side filtering. Client mutations on
  a server-rendered page need `router.refresh()`, not just cache invalidation.
- **Icons only from `@/components/icons`**, never `@tabler/icons-react` directly.
- **Forms** use `useAppForm` + `useFormFields<T>()` from
  `@/components/ui/tanstack-form`.
- **Page headers** come from `PageContainer` props (`pageTitle`,
  `pageDescription`, `pageHeaderAction`, `infoContent`), never a manual
  `<Heading>`.
- Formatting: single quotes, JSX single quotes, no trailing comma, 2-space
  indent (`pnpm format`).

## Commands

```bash
pnpm install
pnpm dev            # http://localhost:3000
pnpm build
pnpm lint           # oxlint
pnpm test           # node:test — currently the admin password gate
pnpm format

node scripts/make-admin-hash.mjs '<password>'   # value for admins/*.passwordHash
```

## Setup

1. `cp .env.example .env.local` and fill in `NEXTAUTH_SECRET`.
2. Put the **Banjaro** service account key at `service-account.json` in the
   project root (Firebase console → Project settings → Service accounts), or
   point `GOOGLE_APPLICATION_CREDENTIALS` at it. A key for any other project is
   refused at startup.
3. Sign in once with `ADMIN_EMAIL` / `ADMIN_PASSWORD`, then create real admins
   as `admins/{id}` documents with `email`, `name` and a scrypt `passwordHash`,
   and clear the env pair. With neither set there is no fallback account — by
   design, there is no built-in default credential.
