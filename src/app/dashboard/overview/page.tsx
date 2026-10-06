import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { getOverviewStats, getSignupsByDay } from '@/features/overview/api/service';
import { SignupsChart } from '@/features/overview/components/signups-chart';
import { getReports } from '@/features/moderation/api/service';

export const metadata = {
  title: 'Banjaro Admin: Overview'
};

export const dynamic = 'force-dynamic';

function Stat({
  label,
  value,
  note,
  href
}: {
  label: string;
  value: number | string;
  note: string;
  href?: string;
}) {
  const card = (
    <Card className='@container/card h-full'>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
          {value}
        </CardTitle>
      </CardHeader>
      <CardFooter>
        <div className='text-muted-foreground text-sm'>{note}</div>
      </CardFooter>
    </Card>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}

export default async function OverviewPage() {
  const [stats, signups, openReports] = await Promise.all([
    getOverviewStats(),
    getSignupsByDay(),
    getReports('open')
  ]);

  const live = stats.activities.open + stats.activities.full;
  const verifiedShare = stats.users > 0 ? Math.round((stats.verified / stats.users) * 100) : 0;

  return (
    <PageContainer
      pageTitle='Banjaro'
      pageDescription='Who signed up, what is happening, and what needs a decision.'
    >
      <div className='flex flex-col gap-4'>
        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
          <Stat
            label='Accounts'
            value={stats.users}
            note={`${stats.newThisWeek} joined in the last 7 days`}
            href='/dashboard/users'
          />
          <Stat
            label='Verified'
            value={`${verifiedShare}%`}
            note={`${stats.verified} passed selfie verification`}
            href='/dashboard/users'
          />
          <Stat
            label='Open reports'
            value={stats.openReports}
            note={stats.openReports > 0 ? 'Waiting on a decision' : 'Queue is clear'}
            href='/dashboard/reports'
          />
          <Stat
            label='Live activities'
            value={live}
            note={`${stats.activities.ended} ended, ${stats.activities.cancelled} cancelled`}
            href='/dashboard/activities'
          />
        </div>

        <div className='grid grid-cols-1 gap-4 lg:grid-cols-3'>
          <Card className='lg:col-span-2'>
            <CardHeader>
              <CardTitle>Sign-ups</CardTitle>
              <CardDescription>New accounts per day, last {signups.length} days.</CardDescription>
            </CardHeader>
            <CardContent>
              <SignupsChart data={signups} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Needs a decision</CardTitle>
              <CardDescription>
                {openReports.length === 0
                  ? 'Nothing open.'
                  : `${openReports.length} open report${openReports.length === 1 ? '' : 's'}.`}
              </CardDescription>
            </CardHeader>
            <CardContent className='flex flex-col gap-2'>
              {openReports.slice(0, 6).map((report) => (
                <Link
                  key={report.id}
                  href='/dashboard/reports'
                  className='hover:bg-muted/50 flex items-center justify-between gap-2 rounded border-b px-1 pb-2 last:border-0'
                >
                  <div className='flex flex-col'>
                    <span className='text-sm capitalize'>
                      {report.reason.replace(/_/g, ' ')}
                    </span>
                    <span className='text-muted-foreground text-xs'>
                      {report.targetLabel ?? report.targetId} · {report.targetType}
                    </span>
                  </div>
                  {report.targetReportCount > 1 && (
                    <Badge variant='destructive'>×{report.targetReportCount}</Badge>
                  )}
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          <Stat
            label='Locked out'
            value={stats.banned + stats.suspended}
            note={`${stats.banned} banned, ${stats.suspended} suspended`}
            href='/dashboard/users?status=banned,suspended'
          />
          <Stat
            label='Trips planned'
            value={stats.trips}
            note={`across ${stats.destinations} destinations`}
            href='/dashboard/destinations'
          />
          <Stat
            label='Activities all time'
            value={
              stats.activities.open +
              stats.activities.full +
              stats.activities.ended +
              stats.activities.cancelled
            }
            note={`${stats.activities.open} open right now`}
            href='/dashboard/activities?status=all'
          />
        </div>
      </div>
    </PageContainer>
  );
}
