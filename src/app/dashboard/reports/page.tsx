import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { getReports } from '@/features/moderation/api/service';
import { reportsInfoContent } from '@/features/moderation/info-content';
import { ReportsTable } from '@/features/moderation/components/reports-table';
import type { ReportStatus } from '@/features/moderation/api/types';

export const metadata = {
  title: 'Banjaro Admin: Reports'
};

export const dynamic = 'force-dynamic';

const TABS: { label: string; value?: ReportStatus }[] = [
  { label: 'Open', value: 'open' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Dismissed', value: 'dismissed' },
  { label: 'All' }
];

export default async function ReportsPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await props.searchParams;
  // The "All" tab carries no status of its own, so it travels as `status=all`
  // and maps back to an undefined filter.
  const active = TABS.find((tab) => (tab.value ?? 'all') === (status ?? 'open')) ?? TABS[0];
  const reports = await getReports(active.value);

  return (
    <PageContainer
      pageTitle='Reports'
      pageDescription='What people reported in the app. Decide, then close the report.'
      infoContent={reportsInfoContent}
    >
      <div className='flex flex-col gap-4'>
        <div className='flex gap-2'>
          {TABS.map((tab) => (
            <Button
              key={tab.label}
              asChild
              size='sm'
              variant={tab.label === active.label ? 'default' : 'outline'}
            >
              <Link href={tab.value ? `/dashboard/reports?status=${tab.value}` : '/dashboard/reports?status=all'}>
                {tab.label}
              </Link>
            </Button>
          ))}
        </div>

        <ReportsTable reports={reports} />
      </div>
    </PageContainer>
  );
}
