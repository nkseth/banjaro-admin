'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { getSortingStateParser } from '@/lib/parsers';
import { usersQueryOptions } from '../../api/queries';
import { columns } from './columns';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

export function UsersTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    status: parseAsArrayOf(parseAsString, ','),
    tier: parseAsArrayOf(parseAsString, ','),
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  const { data } = useSuspenseQuery(
    usersQueryOptions({
      page: params.page,
      limit: params.perPage,
      ...(params.name && { search: params.name }),
      ...(params.status?.length && { status: params.status.join(',') }),
      ...(params.tier?.length && { tier: params.tier.join(',') }),
      ...(params.sort.length > 0 && { sort: JSON.stringify(params.sort) })
    })
  );

  const { table } = useDataTable({
    data: data.users,
    columns,
    pageCount: Math.ceil(data.total / params.perPage),
    shallow: true,
    debounceMs: 500,
    initialState: {
      // Join date is useful but rarely the thing you are scanning for.
      columnVisibility: { createdAt: false },
      columnPinning: { right: ['actions'] }
    }
  });

  return (
    <div className='flex flex-1 flex-col gap-2'>
      {data.error && (
        <p className='text-destructive text-sm'>Could not read Firestore: {data.error}</p>
      )}
      <DataTable table={table}>
        <DataTableToolbar table={table} />
      </DataTable>
    </div>
  );
}

export function UsersTableSkeleton() {
  return (
    <div className='flex flex-1 animate-pulse flex-col gap-4'>
      <div className='bg-muted h-10 w-full rounded' />
      <div className='bg-muted h-96 w-full rounded-lg' />
      <div className='bg-muted h-10 w-full rounded' />
    </div>
  );
}
