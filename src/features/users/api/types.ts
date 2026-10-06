/**
 * Banjaro accounts are phone-auth profiles in the `users` collection — there is
 * no email and no org. Field names mirror app/lib/data/models/app_user.dart;
 * anything renamed there has to be renamed here too.
 */
export type PremiumTier = 'free' | 'weekly' | 'monthly' | 'yearly';

/** Derived, not stored — see `accountStatus` in service.ts. */
export type UserStatus = 'active' | 'suspended' | 'banned' | 'deleted';

export type BanjaroUser = {
  id: string; // the Firebase Auth uid
  displayName: string;
  username: string | null;
  photoUrl: string | null;
  bio: string | null;
  gender: string | null;
  verified: boolean;
  premiumTier: PremiumTier;
  premiumExpiresAt: string | null;
  funVotes: number;
  funNotes: number;
  friendCount: number;
  viewsCount: number;
  visibility: 'public' | 'activities_only' | 'private';
  isBusiness: boolean;
  /** Four-character geohash bucket, ~20km — the leaderboard's `geo.area`. */
  area: string | null;
  strikes: number;
  blockedCount: number;
  status: UserStatus;
  bannedAt: string | null;
  banReason: string | null;
  suspendedUntil: string | null;
  deletedAt: string | null;
  createdAt: string | null;
  lastActiveAt: string | null;
};

export type UserFilters = {
  page?: number;
  limit?: number;
  /** Matches display name, username or uid. */
  search?: string;
  /** Comma-separated `UserStatus` values, as the data-table writes them. */
  status?: string;
  /** Comma-separated `PremiumTier` values. */
  tier?: string;
  /** JSON `[{ id, desc }]` from the table's sort param. */
  sort?: string;
};

export type UsersResponse = {
  users: BanjaroUser[];
  total: number;
  offset: number;
  limit: number;
  error?: string;
};

/** The only profile fields an admin edits — used to scrub abusive text. */
export type UserProfileEdit = {
  displayName: string;
  username?: string;
  bio?: string;
  visibility?: BanjaroUser['visibility'];
};
