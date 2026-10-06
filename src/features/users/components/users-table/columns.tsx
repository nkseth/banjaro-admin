'use client';

import type { Column, ColumnDef } from '@tanstack/react-table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import { formatDate, formatRelative } from '@/lib/format';
import type { BanjaroUser } from '../../api/types';
import { CellAction } from './cell-action';
import { STATUS_OPTIONS, TIER_OPTIONS } from './options';

const STATUS_VARIANT = {
  active: 'default',
  suspended: 'secondary',
  banned: 'destructive',
  deleted: 'outline'
} as const;

export const columns: ColumnDef<BanjaroUser>[] = [
  {
    id: 'name',
    accessorFn: (row) => row.displayName,
    header: ({ column }: { column: Column<BanjaroUser, unknown> }) => (
      <DataTableColumnHeader column={column} title='Person' />
    ),
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className='flex items-center gap-3'>
          <Avatar className='size-8'>
            <AvatarImage src={user.photoUrl ?? undefined} alt='' />
            <AvatarFallback>{user.displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className='flex flex-col'>
            <span className='flex items-center gap-1 font-medium'>
              {user.displayName}
              {user.verified && (
                <Icons.badgeCheck
                  className='text-primary size-4'
                  aria-label='Selfie verified'
                />
              )}
              {user.isBusiness && (
                <Badge variant='outline' className='px-1 py-0 text-[10px]'>
                  Business
                </Badge>
              )}
            </span>
            <span className='text-muted-foreground font-mono text-xs'>
              {user.username ? `@${user.username}` : user.id}
            </span>
          </div>
        </div>
      );
    },
    meta: {
      label: 'Person',
      placeholder: 'Name, @handle or uid...',
      variant: 'text' as const,
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    id: 'status',
    accessorKey: 'status',
    enableSorting: false,
    header: ({ column }: { column: Column<BanjaroUser, unknown> }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const { status, suspendedUntil, banReason } = row.original;
      const elapsed = suspendedUntil && new Date(suspendedUntil) <= new Date();
      return (
        <div className='flex flex-col gap-0.5'>
          <Badge variant={STATUS_VARIANT[status]} className='w-fit capitalize'>
            {status}
          </Badge>
          {status === 'suspended' && (
            <span className='text-muted-foreground text-xs'>
              {elapsed ? 'term served — lift it' : `until ${formatDate(suspendedUntil!)}`}
            </span>
          )}
          {status === 'banned' && banReason && (
            <span className='text-muted-foreground max-w-40 truncate text-xs'>
              {banReason}
            </span>
          )}
        </div>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: 'Status',
      variant: 'multiSelect' as const,
      options: STATUS_OPTIONS
    }
  },
  {
    id: 'tier',
    accessorKey: 'premiumTier',
    enableSorting: false,
    header: ({ column }: { column: Column<BanjaroUser, unknown> }) => (
      <DataTableColumnHeader column={column} title='Premium' />
    ),
    cell: ({ row }) => {
      const { premiumTier, premiumExpiresAt } = row.original;
      if (premiumTier === 'free') return <span className='text-muted-foreground'>—</span>;
      const lapsed = premiumExpiresAt && new Date(premiumExpiresAt) <= new Date();
      return (
        <Badge variant={lapsed ? 'outline' : 'default'} className='capitalize'>
          {premiumTier}
          {lapsed && ' (lapsed)'}
        </Badge>
      );
    },
    enableColumnFilter: true,
    meta: {
      label: 'Premium',
      variant: 'multiSelect' as const,
      options: TIER_OPTIONS
    }
  },
  {
    id: 'funVotes',
    accessorKey: 'funVotes',
    header: ({ column }: { column: Column<BanjaroUser, unknown> }) => (
      <DataTableColumnHeader column={column} title='Fun votes' />
    ),
    cell: ({ row }) => <span className='tabular-nums'>{row.original.funVotes}</span>
  },
  {
    id: 'strikes',
    accessorKey: 'strikes',
    header: ({ column }: { column: Column<BanjaroUser, unknown> }) => (
      <DataTableColumnHeader column={column} title='Strikes' />
    ),
    cell: ({ row }) => {
      const { strikes, blockedCount } = row.original;
      return (
        <div className='flex flex-col'>
          <span className={strikes > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
            {strikes}
          </span>
          {blockedCount > 0 && (
            <span className='text-muted-foreground text-xs'>blocks {blockedCount}</span>
          )}
        </div>
      );
    }
  },
  {
    id: 'lastActiveAt',
    accessorKey: 'lastActiveAt',
    header: ({ column }: { column: Column<BanjaroUser, unknown> }) => (
      <DataTableColumnHeader column={column} title='Last active' />
    ),
    cell: ({ row }) => (
      <span className='text-muted-foreground text-sm'>
        {formatRelative(row.original.lastActiveAt) || '—'}
      </span>
    )
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: ({ column }: { column: Column<BanjaroUser, unknown> }) => (
      <DataTableColumnHeader column={column} title='Joined' />
    ),
    cell: ({ row }) => (
      <span className='text-muted-foreground text-sm'>
        {formatDate(row.original.createdAt ?? undefined) || '—'}
      </span>
    )
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction user={row.original} />
  }
];
