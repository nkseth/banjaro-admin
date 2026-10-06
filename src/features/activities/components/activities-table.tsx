import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons } from '@/components/icons';
import { formatDate, formatRelative } from '@/lib/format';
import type { ActivityRow, ActivityStatus } from '../api/types';
import { ActivityActions } from './activity-actions';

const STATUS_VARIANT: Record<ActivityStatus, 'default' | 'secondary' | 'destructive' | 'outline'> =
  {
    open: 'default',
    full: 'secondary',
    cancelled: 'destructive',
    ended: 'outline'
  };

const VISIBILITY_LABEL: Record<string, string> = {
  public: 'Anyone nearby',
  verified_only: 'Verified only',
  women_only: 'Women only',
  invite: 'Invite only'
};

export function ActivitiesTable({ activities }: { activities: ActivityRow[] }) {
  if (activities.length === 0) {
    return (
      <div className='bg-muted/20 flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center'>
        <div className='text-muted-foreground text-sm'>No activities match.</div>
      </div>
    );
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Activity</TableHead>
            <TableHead>Host</TableHead>
            <TableHead>Starts</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className='w-10' />
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity) => (
            <TableRow key={activity.id}>
              <TableCell>
                <div className='flex flex-col'>
                  <span className='flex items-center gap-1 font-medium'>
                    {activity.title}
                    {activity.boostedUntil &&
                      new Date(activity.boostedUntil) > new Date() && (
                        <Icons.sparkles
                          className='text-primary size-3.5'
                          aria-label='Boosted'
                        />
                      )}
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    {activity.category}
                    {activity.placeName && ` · ${activity.placeName}`}
                    {activity.visibility !== 'public' &&
                      ` · ${VISIBILITY_LABEL[activity.visibility] ?? activity.visibility}`}
                  </span>
                </div>
              </TableCell>

              <TableCell>
                <Link
                  href={`/dashboard/users/${activity.hostId}`}
                  className='flex items-center gap-1 text-sm hover:underline'
                >
                  {activity.hostName}
                  {activity.hostVerified && (
                    <Icons.badgeCheck className='text-primary size-3.5' aria-label='Verified' />
                  )}
                </Link>
              </TableCell>

              <TableCell className='text-sm'>
                <div className='flex flex-col'>
                  <span>{formatDate(activity.startAt ?? undefined) || '—'}</span>
                  <span className='text-muted-foreground text-xs'>
                    {formatRelative(activity.startAt)}
                  </span>
                </div>
              </TableCell>

              <TableCell className='tabular-nums'>
                {activity.participantCount}
                {activity.capacity > 0 && (
                  <span className='text-muted-foreground'> / {activity.capacity}</span>
                )}
              </TableCell>

              <TableCell>
                <div className='flex flex-col gap-0.5'>
                  <Badge variant={STATUS_VARIANT[activity.status]} className='w-fit capitalize'>
                    {activity.status}
                  </Badge>
                  {activity.cancelReason && (
                    <span className='text-muted-foreground max-w-40 truncate text-xs'>
                      {activity.cancelReason}
                    </span>
                  )}
                </div>
              </TableCell>

              <TableCell>
                <ActivityActions activity={activity} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
