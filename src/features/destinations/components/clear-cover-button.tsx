'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { clearDestinationCoverAction } from '@/app/dashboard/destinations/actions';

export function ClearCoverButton({ destinationKey }: { destinationKey: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size='sm'
      variant='outline'
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await clearDestinationCoverAction(destinationKey);
            toast.success('Cover cleared — the next trip photo will claim it');
          } catch (error) {
            toast.error((error as Error).message);
          }
        })
      }
    >
      <Icons.eyeOff className='mr-2 h-4 w-4' /> Clear cover
    </Button>
  );
}
