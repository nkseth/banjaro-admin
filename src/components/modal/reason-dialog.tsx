'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Modal } from '@/components/ui/modal';
import { Textarea } from '@/components/ui/textarea';

/**
 * Confirm dialog for moderation actions, where a written reason is part of the
 * action rather than optional metadata: the reason is stored on the record and
 * is the only account of why something was taken down once whoever did it has
 * moved on. Hence no "skip" path — confirm stays disabled until it is typed.
 */
export function ReasonDialog({
  open,
  title,
  description,
  confirmLabel,
  placeholder,
  loading,
  onClose,
  onConfirm
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  placeholder?: string;
  loading: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');

  // Cleared on close so the next target does not inherit the last reason.
  useEffect(() => {
    if (!open) setReason('');
  }, [open]);

  return (
    <Modal title={title} description={description} isOpen={open} onClose={onClose}>
      <div className='space-y-2'>
        <Label htmlFor='moderation-reason'>Reason</Label>
        <Textarea
          id='moderation-reason'
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={placeholder}
          rows={3}
        />
      </div>
      <div className='flex w-full items-center justify-end gap-2 pt-6'>
        <Button variant='outline' disabled={loading} onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant='destructive'
          disabled={loading || reason.trim().length < 3}
          onClick={() => onConfirm(reason.trim())}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
