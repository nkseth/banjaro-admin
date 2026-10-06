import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { formatDate, formatRelative } from '@/lib/format';
import { getUser } from '@/features/users/api/service';
import { CellAction } from '@/features/users/components/users-table/cell-action';
import { getActivitiesHostedBy } from '@/features/activities/api/service';
import { getReportsAgainst } from '@/features/moderation/api/service';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Banjaro Admin: Account'
};

/** Label plus value, the shape most of this page is made of. */
function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='flex flex-col gap-0.5'>
      <span className='text-muted-foreground text-xs'>{label}</span>
      <span className='text-sm'>{children}</span>
    </div>
  );
}

export default async function UserDetailPage(props: { params: Promise<{ uid: string }> }) {
  const { uid } = await props.params;
  const [user, hosted, reports] = await Promise.all([
    getUser(uid),
    getActivitiesHostedBy(uid),
    getReportsAgainst(uid)
  ]);

  if (!user) notFound();

  const openReports = reports.filter((report) => report.status === 'open').length;

  return (
    <PageContainer
      pageTitle={user.displayName}
      pageDescription={user.username ? `@${user.username}` : uid}
      pageHeaderAction={<CellAction user={user} />}
    >
      <div className='grid gap-4 lg:grid-cols-3'>
        <Card className='lg:col-span-2'>
          <CardHeader>
            <div className='flex items-center gap-4'>
              <Avatar className='size-16'>
                <AvatarImage src={user.photoUrl ?? undefined} alt='' />
                <AvatarFallback>{user.displayName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className='flex flex-col gap-1'>
                <CardTitle className='flex items-center gap-2'>
                  {user.displayName}
                  {user.verified && <Icons.badgeCheck className='text-primary size-4' />}
                  <Badge
                    variant={user.status === 'active' ? 'default' : 'destructive'}
                    className='capitalize'
                  >
                    {user.status}
                  </Badge>
                </CardTitle>
                <CardDescription>{user.bio || 'No bio.'}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='grid grid-cols-2 gap-4 md:grid-cols-3'>
            <Fact label='uid'>
              <span className='font-mono text-xs'>{user.id}</span>
            </Fact>
            <Fact label='Phone'>{user.phone ?? '—'}</Fact>
            <Fact label='Gender'>{user.gender ?? '—'}</Fact>
            <Fact label='Joined'>{formatDate(user.createdAt ?? undefined) || '—'}</Fact>
            <Fact label='Last active'>{formatRelative(user.lastActiveAt) || '—'}</Fact>
            <Fact label='Last sign-in'>
              {user.lastSignInAt ? formatRelative(new Date(user.lastSignInAt).toISOString()) : '—'}
            </Fact>
            <Fact label='Visibility'>
              <span className='capitalize'>{user.visibility.replace('_', ' ')}</span>
            </Fact>
            <Fact label='Area'>{user.area ?? '—'}</Fact>
            <Fact label='Premium'>
              <span className='capitalize'>{user.premiumTier}</span>
              {user.premiumExpiresAt && ` until ${formatDate(user.premiumExpiresAt)}`}
            </Fact>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Standing</CardTitle>
            <CardDescription>What the community made of them.</CardDescription>
          </CardHeader>
          <CardContent className='grid grid-cols-2 gap-4'>
            <Fact label='Fun votes'>{user.funVotes}</Fact>
            <Fact label='Profile notes'>{user.funNotes}</Fact>
            <Fact label='Friends'>{user.friendCount}</Fact>
            <Fact label='Profile views'>{user.viewsCount}</Fact>
            <Fact label='Strikes'>
              <span className={user.strikes > 0 ? 'text-destructive font-medium' : undefined}>
                {user.strikes}
              </span>
            </Fact>
            <Fact label='People they blocked'>{user.blockedCount}</Fact>

            <Separator className='col-span-2' />

            <Fact label='Auth account'>
              {user.authMissing ? (
                <span className='text-destructive'>
                  Missing — Firestore profile with no Auth user
                </span>
              ) : user.authDisabled ? (
                <span className='text-destructive'>Disabled</span>
              ) : (
                'Enabled'
              )}
            </Fact>
            {user.banReason && <Fact label='Ban reason'>{user.banReason}</Fact>}
            {user.suspendedUntil && (
              <Fact label='Suspended until'>
                {formatDate(user.suspendedUntil)}
                {new Date(user.suspendedUntil) <= new Date() && ' (term served)'}
              </Fact>
            )}
          </CardContent>
        </Card>

        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>Hosted activities</CardTitle>
            <CardDescription>
              {hosted.length === 0 ? 'Never hosted anything.' : `${hosted.length} most recent.`}
            </CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-2'>
            {hosted.map((activity) => (
              <div
                key={activity.id}
                className='flex items-center justify-between gap-2 border-b pb-2 last:border-0'
              >
                <div className='flex flex-col'>
                  <span className='text-sm font-medium'>{activity.title}</span>
                  <span className='text-muted-foreground text-xs'>
                    {formatDate(activity.startAt ?? undefined)} · {activity.participantCount} joined
                  </span>
                </div>
                <Badge variant='outline' className='capitalize'>
                  {activity.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reports against them</CardTitle>
            <CardDescription>
              {reports.length === 0
                ? 'Never reported.'
                : `${openReports} open of ${reports.length}.`}
            </CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-2'>
            {reports.map((report) => (
              <div key={report.id} className='border-b pb-2 last:border-0'>
                <div className='flex items-center justify-between gap-2'>
                  <span className='text-sm capitalize'>{report.reason.replace(/_/g, ' ')}</span>
                  <Badge
                    variant={report.status === 'open' ? 'destructive' : 'outline'}
                    className='capitalize'
                  >
                    {report.status}
                  </Badge>
                </div>
                {report.details && (
                  <p className='text-muted-foreground mt-1 text-xs'>{report.details}</p>
                )}
                <span className='text-muted-foreground text-xs'>
                  {formatRelative(report.createdAt)}
                </span>
              </div>
            ))}
            {reports.length > 0 && (
              <Link
                href='/dashboard/reports'
                className='text-primary text-xs hover:underline'
              >
                Open the report queue
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
