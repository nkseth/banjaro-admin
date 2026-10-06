import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { usersQueryOptions } from '../api/queries';
import { UsersTable } from './users-table';

export default function UserListingPage() {
  const filters = {
    page: searchParamsCache.get('page'),
    limit: searchParamsCache.get('perPage'),
    ...(searchParamsCache.get('name') && { search: searchParamsCache.get('name')! }),
    ...(searchParamsCache.get('status') && { status: searchParamsCache.get('status')! }),
    ...(searchParamsCache.get('tier') && { tier: searchParamsCache.get('tier')! }),
    ...(searchParamsCache.get('sort') && { sort: searchParamsCache.get('sort')! })
  };

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(usersQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersTable />
    </HydrationBoundary>
  );
}
