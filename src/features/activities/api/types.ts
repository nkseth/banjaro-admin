/** Mirrors app/lib/data/models/activity.dart. */
export type ActivityStatus = 'open' | 'full' | 'cancelled' | 'ended';

export type ActivityVisibility = 'public' | 'verified_only' | 'women_only' | 'invite';

export type ActivityRow = {
  id: string;
  title: string;
  category: string;
  hostId: string;
  hostName: string;
  hostVerified: boolean;
  hostIsBusiness: boolean;
  placeName: string | null;
  latitude: number | null;
  longitude: number | null;
  startAt: string | null;
  endAt: string | null;
  capacity: number;
  participantCount: number;
  status: ActivityStatus;
  visibility: ActivityVisibility;
  coverUrl: string | null;
  chatId: string | null;
  cancelReason: string | null;
  boostedUntil: string | null;
  createdAt: string | null;
};
