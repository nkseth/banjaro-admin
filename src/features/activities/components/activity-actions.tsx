'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { AlertModal } from '@/components/modal/alert-modal';
import { ReasonDialog } from '@/components/modal/reason-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';
import type { ActivityRow } from '../api/types';
import {
  cancelActivityAction,
  deleteActivityAction
} from '@/app/dashboard/activities/actions';

export function ActivityActions({ activity }: { activity: ActivityRow }) {
  const [pending, startTransition] = useTransition();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const run = (work: () => Promise<void>, message: string) =>
    startTransition(async () => {
      try {
        await work();
        toast.success(message);
        setCancelOpen(false);
        setDeleteOpen(false);
      } catch (error) {
        toast.error((error as Error).message);
      }
    });

  const isLive = activity.status === 'open' || activity.status === 'full';

  return (
    <>
      <ReasonDialog
        open={cancelOpen}
        title={`Cancel "${activity.title}"`}
        description='Everyone in the group chat gets a system message with this reason. The activity and its chat stay readable.'
        confirmLabel='Cancel activity'
        placeholder='Why this activity is coming down.'
        loading={pending}
        onClose={() => setCancelOpen(false)}
        onConfirm={(reason) =>
          run(() => cancelActivityAction(activity.id, reason), 'Activity cancelled')
        }
      />

      <AlertModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => run(() => deleteActivityAction(activity.id), 'Activity deleted')}
        loading={pending}
      />

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0' disabled={pending}>
            <span className='sr-only'>Activity actions</span>
            <Icons.ellipsis className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel className='max-w-48 truncate'>{activity.title}</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/users/${activity.hostId}`}>
              <Icons.user className='mr-2 h-4 w-4' /> Open host
            </Link>
          </DropdownMenuItem>
          {activity.latitude !== null && (
            <DropdownMenuItem asChild>
              <Link
                href={`https://www.google.com/maps?q=${activity.latitude},${activity.longitude}`}
                target='_blank'
              >
                <Icons.externalLink className='mr-2 h-4 w-4' /> See the pin
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {isLive && (
            <DropdownMenuItem variant='destructive' onClick={() => setCancelOpen(true)}>
              <Icons.close className='mr-2 h-4 w-4' /> Cancel it
            </DropdownMenuItem>
          )}
          <DropdownMenuItem variant='destructive' onClick={() => setDeleteOpen(true)}>
            <Icons.trash className='mr-2 h-4 w-4' /> Delete it and its chat
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
