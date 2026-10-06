import Link from 'next/link';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getActivities } from '@/features/activities/api/service';
import { ActivitiesTable } from '@/features/activities/components/activities-table';
import type { ActivityStatus } from '@/features/activities/api/types';

export const metadata = {
  title: 'Banjaro Admin: Activities'
};

export const dynamic = 'force-dynamic';

const TABS: { label: string; value?: ActivityStatus }[] = [
  { label: 'Open', value: 'open' },
  { label: 'Full', value: 'full' },
  { label: 'Ended', value: 'ended' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'All' }
];

export default async function ActivitiesPage(props: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await props.searchParams;
  const active = TABS.find((tab) => (tab.value ?? 'all') === (status ?? 'open')) ?? TABS[0];
  const activities = await getActivities({ status: active.value, search: q });

  return (
    <PageContainer
      pageTitle='Activities'
      pageDescription='Everything pinned on the map. Cancel or remove what should not be there.'
    >
      <div className='flex flex-col gap-4'>
        <div className='flex flex-wrap items-center gap-2'>
          {TABS.map((tab) => (
            <Button
              key={tab.label}
              asChild
              size='sm'
              variant={tab.label === active.label ? 'default' : 'outline'}
            >
              <Link
                href={{
                  pathname: '/dashboard/activities',
                  query: { status: tab.value ?? 'all', ...(q && { q }) }
                }}
              >
                {tab.label}
              </Link>
            </Button>
          ))}

          {/* A plain GET form — no client state to hold, and the result is
              shareable as a URL. */}
          <form className='ml-auto flex gap-2'>
            <input type='hidden' name='status' value={active.value ?? 'all'} />
            <Input
              name='q'
              defaultValue={q ?? ''}
              placeholder='Title, host, place or id...'
              className='w-56'
            />
            <Button type='submit' size='sm' variant='secondary'>
              Search
            </Button>
          </form>
        </div>

        <ActivitiesTable activities={activities} />
      </div>
    </PageContainer>
  );
}
