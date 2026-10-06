export function formatDate(
  date: Date | string | number | undefined,
  opts: Intl.DateTimeFormatOptions = {}
) {
  if (!date) return '';

  try {
    return new Intl.DateTimeFormat('en-US', {
      month: opts.month ?? 'long',
      day: opts.day ?? 'numeric',
      year: opts.year ?? 'numeric',
      ...opts
    }).format(new Date(date));
  } catch {
    return '';
  }
}

/** Firestore `Timestamp` (or a plain Date) → ISO string, or null if absent. */
export function toIso(value: unknown): string | null {
  const date =
    (value as { toDate?: () => Date } | null)?.toDate?.() ??
    (value instanceof Date ? value : null);
  return date ? date.toISOString() : null;
}

/** "3 days ago" / "in 2 hours" — relative, for last-active and expiry columns. */
export function formatRelative(date: string | null | undefined) {
  if (!date) return '';
  const diffMs = new Date(date).getTime() - Date.now();
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000000],
    ['month', 2592000000],
    ['day', 86400000],
    ['hour', 3600000],
    ['minute', 60000]
  ];
  const fmt = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });
  for (const [unit, ms] of units) {
    if (Math.abs(diffMs) >= ms) return fmt.format(Math.round(diffMs / ms), unit);
  }
  return 'just now';
}
