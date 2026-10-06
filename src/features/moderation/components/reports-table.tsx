import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { formatRelative } from '@/lib/format';
import type { Report, ReportReason } from '../api/types';
import { ReportActions } from './report-actions';

const REASON_LABEL: Record<ReportReason, string> = {
  harassment: 'Harassment',
  spam: 'Spam',
  fake_profile: 'Fake profile',
  inappropriate_content: 'Inappropriate content',
  safety_concern: 'Safety concern',
  underage: 'Underage',
  other: 'Other'
};

/** The reasons that should never wait in a queue behind spam complaints. */
const URGENT: ReportReason[] = ['safety_concern', 'underage'];

export function ReportsTable({ reports }: { reports: Report[] }) {
  if (reports.length === 0) {
    return (
      <div className='bg-muted/20 flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center'>
        <div className='text-muted-foreground text-sm'>Nothing here.</div>
      </div>
    );
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reason</TableHead>
            <TableHead>Reported</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>By</TableHead>
            <TableHead>Filed</TableHead>
            <TableHead className='w-10' />
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell>
                <div className='flex flex-col gap-1'>
                  <Badge
                    variant={URGENT.includes(report.reason) ? 'destructive' : 'secondary'}
                    className='w-fit'
                  >
                    {REASON_LABEL[report.reason] ?? report.reason}
                  </Badge>
                  {report.status !== 'open' && (
                    <span className='text-muted-foreground text-xs capitalize'>
                      {report.status}
                      {report.resolutionNote ? ` — ${report.resolutionNote}` : ''}
                    </span>
                  )}
                </div>
              </TableCell>

              <TableCell>
                <div className='flex flex-col'>
                  <span className='flex items-center gap-2 font-medium'>
                    {report.targetType === 'user' && !report.targetMissing ? (
                      <Link
                        href={`/dashboard/users/${report.targetId}`}
                        className='hover:underline'
                      >
                        {report.targetLabel}
                      </Link>
                    ) : (
                      (report.targetLabel ?? <span className='font-mono text-xs'>{report.targetId}</span>)
                    )}
                    {report.targetReportCount > 1 && (
                      <Badge variant='destructive' className='px-1 py-0 text-[10px]'>
                        ×{report.targetReportCount}
                      </Badge>
                    )}
                  </span>
                  <span className='text-muted-foreground text-xs capitalize'>
                    {report.targetType}
                    {report.targetMissing && ' · already gone'}
                  </span>
                </div>
              </TableCell>

              <TableCell className='text-muted-foreground max-w-xs text-sm'>
                {report.details ?? '—'}
              </TableCell>

              <TableCell className='text-sm'>{report.reporterName}</TableCell>

              <TableCell className='text-muted-foreground text-sm'>
                {formatRelative(report.createdAt) || '—'}
              </TableCell>

              <TableCell>
                <ReportActions report={report} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
