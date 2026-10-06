'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import type { BanjaroUser } from '../../api/types';
import {
  banUserMutation,
  deleteUserMutation,
  setUserVerifiedMutation,
  unbanUserMutation
} from '../../api/mutations';
import { ReasonDialog } from '@/components/modal/reason-dialog';
import { UserFormSheet } from '../user-form-sheet';
import { SUSPEND_DURATIONS } from './options';

export function CellAction({ user }: { user: BanjaroUser }) {
  // The account detail page is server-rendered, so invalidating the React
  // Query cache alone would leave it showing pre-action state.
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  /** null = closed; a number = that many days; 0 = permanent ban. */
  const [banDays, setBanDays] = useState<number | null>(null);

  const ban = useMutation({
    ...banUserMutation,
    onSuccess: (_, { days }) => {
      toast.success(
        days ? `${user.displayName} suspended for ${days} days` : `${user.displayName} banned`
      );
      setBanDays(null);
      router.refresh();
    },
    onError: (error) => toast.error(error.message)
  });

  const unban = useMutation({
    ...unbanUserMutation,
    onSuccess: () => {
      toast.success(`${user.displayName} can sign in again`);
      router.refresh();
    },
    onError: (error) => toast.error(error.message)
  });

  const verify = useMutation({
    ...setUserVerifiedMutation,
    onSuccess: (_, { verified }) => {
      toast.success(verified ? 'Verified badge granted' : 'Verification revoked');
      router.refresh();
    },
    onError: (error) => toast.error(error.message)
  });

  const remove = useMutation({
    ...deleteUserMutation,
    onSuccess: (result) => {
      toast.success(
        result.cancelledActivities
          ? `Account deleted, ${result.cancelledActivities} hosted activities cancelled`
          : 'Account deleted'
      );
      setDeleteOpen(false);
      router.refresh();
    },
    onError: (error) => toast.error(error.message)
  });

  const isSanctioned = user.status === 'banned' || user.status === 'suspended';

  return (
    <>
      <UserFormSheet user={user} open={editOpen} onOpenChange={setEditOpen} />

      <ReasonDialog
        open={banDays !== null}
        title={
          banDays
            ? `Suspend ${user.displayName} for ${banDays} days`
            : `Ban ${user.displayName}`
        }
        description={
          banDays
            ? 'Their account is disabled and the profile goes private. Nothing lifts it automatically — come back and lift the ban when the term is served.'
            : 'Their account is disabled, every session is signed out, and the profile goes private. Activities they are hosting stay up — cancel those separately.'
        }
        confirmLabel={banDays ? 'Suspend account' : 'Ban account'}
        placeholder='Harassment in the chat for activity abc123, 3 reports upheld.'
        loading={ban.isPending}
        onClose={() => setBanDays(null)}
        onConfirm={(reason) =>
          ban.mutate({ id: user.id, reason, days: banDays || undefined })
        }
      />

      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => remove.mutate(user.id)}
        loading={remove.isPending}
      />

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <Icons.ellipsis className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>{user.displayName}</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/users/${user.id}`}>
              <Icons.user className='mr-2 h-4 w-4' /> Open profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Icons.edit className='mr-2 h-4 w-4' /> Edit profile text
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => verify.mutate({ id: user.id, verified: !user.verified })}
          >
            <Icons.badgeCheck className='mr-2 h-4 w-4' />
            {user.verified ? 'Revoke verification' : 'Grant verification'}
          </DropdownMenuItem>

          {isSanctioned ? (
            <DropdownMenuItem onClick={() => unban.mutate(user.id)}>
              <Icons.check className='mr-2 h-4 w-4' /> Lift ban
            </DropdownMenuItem>
          ) : (
            <>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Icons.clock className='mr-2 h-4 w-4' /> Suspend
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {SUSPEND_DURATIONS.map((days) => (
                    <DropdownMenuItem key={days} onClick={() => setBanDays(days)}>
                      {days} {days === 1 ? 'day' : 'days'}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem variant='destructive' onClick={() => setBanDays(0)}>
                <Icons.lock className='mr-2 h-4 w-4' /> Ban permanently
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem variant='destructive' onClick={() => setDeleteOpen(true)}>
            <Icons.trash className='mr-2 h-4 w-4' /> Delete account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
