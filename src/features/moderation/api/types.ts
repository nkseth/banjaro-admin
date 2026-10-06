/** Mirrors the `reports` collection written by `submitReport`. */
export type ReportTargetType = 'user' | 'activity' | 'message' | 'note';

export type ReportReason =
  | 'harassment'
  | 'spam'
  | 'fake_profile'
  | 'inappropriate_content'
  | 'safety_concern'
  | 'underage'
  | 'other';

export type ReportStatus = 'open' | 'resolved' | 'dismissed';

export type Report = {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: ReportTargetType;
  targetId: string;
  /** Display name / activity title, or null when the target cannot be resolved. */
  targetLabel: string | null;
  /** True once the target document is gone — already deleted or never existed. */
  targetMissing: boolean;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  /** How many reports in total name this same target, this one included. */
  targetReportCount: number;
  createdAt: string | null;
  resolvedAt: string | null;
  resolutionNote: string | null;
};
