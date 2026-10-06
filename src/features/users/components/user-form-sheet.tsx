'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { updateUserProfileMutation } from '../api/mutations';
import type { BanjaroUser } from '../api/types';
import { userProfileSchema, type UserProfileFormValues } from '../schemas/user';
import { VISIBILITY_OPTIONS } from './users-table/options';

/**
 * Edits the free-text parts of a profile. There is no create counterpart —
 * accounts come from phone sign-up in the app, so the only reason an admin
 * touches a profile is to take down a name, handle or bio that broke the rules.
 */
export function UserFormSheet({
  user,
  open,
  onOpenChange
}: {
  user: BanjaroUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const update = useMutation({
    ...updateUserProfileMutation,
    onSuccess: () => {
      toast.success('Profile updated');
      onOpenChange(false);
      router.refresh();
    },
    onError: (error) => toast.error(error.message)
  });

  const form = useAppForm({
    defaultValues: {
      displayName: user.displayName,
      username: user.username ?? '',
      bio: user.bio ?? '',
      visibility: user.visibility
    } as UserProfileFormValues,
    validators: { onSubmit: userProfileSchema },
    onSubmit: async ({ value }) => {
      await update.mutateAsync({ id: user.id, values: value });
    }
  });

  const { FormTextField, FormTextareaField, FormSelectField } =
    useFormFields<UserProfileFormValues>();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>Edit profile</SheetTitle>
          <SheetDescription className='font-mono text-xs'>{user.id}</SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto px-4'>
          <form.AppForm>
            <form.Form id='user-profile-form' className='space-y-4'>
              <FormTextField
                name='displayName'
                label='Display name'
                required
                validators={{ onBlur: z.string().min(2, 'At least 2 characters').max(40) }}
              />
              <FormTextField
                name='username'
                label='Handle'
                placeholder='without the @'
                validators={{ onBlur: z.string().max(30).optional().or(z.literal('')) }}
              />
              <FormTextareaField
                name='bio'
                label='Bio'
                rows={4}
                validators={{ onBlur: z.string().max(300).optional().or(z.literal('')) }}
              />
              <FormSelectField
                name='visibility'
                label='Visibility'
                options={VISIBILITY_OPTIONS}
                placeholder='Select visibility'
              />
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type='submit' form='user-profile-form' isLoading={update.isPending}>
            <Icons.check /> Save
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
