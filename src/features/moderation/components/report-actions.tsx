'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
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
import { ReasonDialog } from '@/components/modal/reason-dialog';
import { SUSPEND_DURATIONS } from '@/features/users/components/users-table/options';
import type { Report } from '../api/types';
import {
  banFromReportAction,
  cancelFromReportAction,
  closeReportAction,
  reopenReportAction
} from '@/app/dashboard/reports/actions';

export function ReportActions({ report }: { report: Report }) {
  const [pending, startTransition] = useTransition();
  /** null = closed; 0 = permanent ban; > 0 = suspension of that many days. */
  const [banDays, setBanDays] = useState<number | null>(null);
  const [takedownOpen, setTakedownOpen] = useState(false);

  const run = (work: () => Promise<void>, message: string) =>
    startTransition(async () => {
      try {
        await work();
        toast.success(message);
        setBanDays(null);
        setTakedownOpen(false);
      } catch (error) {
        toast.error((error as Error).message);
      }
    });

  const label = report.targetLabel ?? report.targetId;

  return (
    <>
      <ReasonDialog
        open={banDays !== null}
        title={banDays ? `Suspend ${label} for ${banDays} days` : `Ban ${label}`}
        description='The account is disabled and signed out, the profile goes private, and this report is marked resolved.'
        confirmLabel={banDays ? 'Suspend account' : 'Ban account'}
        placeholder='Why this report was upheld.'
        loading={pending}
        onClose={() => setBanDays(null)}
        onConfirm={(reason) =>
          run(
            () => banFromReportAction(report.id, report.targetId, reason, banDays || undefined),
            banDays ? 'Account suspended, report resolved' : 'Account banned, report resolved'
          )
        }
      />

      <ReasonDialog
        open={takedownOpen}
        title={`Cancel "${label}"`}
        description='The activity is marked cancelled and everyone in its group chat gets a system message saying why.'
        confirmLabel='Cancel activity'
        placeholder='Why this activity is coming down.'
        loading={pending}
        onClose={() => setTakedownOpen(false)}
        onConfirm={(reason) =>
          run(
            () => cancelFromReportAction(report.id, report.targetId, reason),
            'Activity cancelled, report resolved'
          )
        }
      />

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0' disabled={pending}>
            <span className='sr-only'>Report actions</span>
            <Icons.ellipsis className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Decide</DropdownMenuLabel>

          {report.targetType === 'user' && !report.targetMissing && (
            <DropdownMenuItem asChild>
              <Link href={`/dashboard/users/${report.targetId}`}>
                <Icons.user className='mr-2 h-4 w-4' /> Open reported profile
              </Link>
            </DropdownMenuItem>
          )}

          {report.status === 'open' ? (
            <>
              <DropdownMenuItem
                onClick={() =>
                  run(
                    () => closeReportAction(report.id, 'dismissed'),
                    'Report dismissed'
                  )
                }
              >
                <Icons.close className='mr-2 h-4 w-4' /> Dismiss — nothing wrong
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  run(
                    () => closeReportAction(report.id, 'resolved', 'Handled without a sanction'),
                    'Report resolved'
                  )
                }
              >
                <Icons.check className='mr-2 h-4 w-4' /> Resolve — handled
              </DropdownMenuItem>

              {report.targetType === 'user' && !report.targetMissing && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Icons.clock className='mr-2 h-4 w-4' /> Suspend the account
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
                    <Icons.lock className='mr-2 h-4 w-4' /> Ban the account
                  </DropdownMenuItem>
                </>
              )}

              {report.targetType === 'activity' && !report.targetMissing && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant='destructive' onClick={() => setTakedownOpen(true)}>
                    <Icons.trash className='mr-2 h-4 w-4' /> Cancel the activity
                  </DropdownMenuItem>
                </>
              )}
            </>
          ) : (
            <DropdownMenuItem
              onClick={() => run(() => reopenReportAction(report.id), 'Report reopened')}
            >
              <Icons.arrowRight className='mr-2 h-4 w-4' /> Reopen
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
