import type { Option } from '@/types/data-table';

export const STATUS_OPTIONS: Option[] = [
  { label: 'Active', value: 'active' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Banned', value: 'banned' },
  { label: 'Deleted', value: 'deleted' }
];

export const TIER_OPTIONS: Option[] = [
  { label: 'Free', value: 'free' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' }
];

export const VISIBILITY_OPTIONS = [
  { label: 'Public', value: 'public' },
  { label: 'Activities only', value: 'activities_only' },
  { label: 'Private (ghost mode)', value: 'private' }
];

/** Offered in the suspend menu; a permanent ban is a separate action. */
export const SUSPEND_DURATIONS = [1, 7, 30] as const;
