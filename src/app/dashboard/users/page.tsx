import PageContainer from '@/components/layout/page-container';
import UserListingPage from '@/features/users/components/user-listing';
import { usersInfoContent } from '@/features/users/info-content';
import { searchParamsCache } from '@/lib/searchparams';
import type { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Banjaro Admin: Accounts'
};

export default async function UsersPage(props: { searchParams: Promise<SearchParams> }) {
  searchParamsCache.parse(await props.searchParams);

  return (
    <PageContainer
      pageTitle='Accounts'
      pageDescription='Everyone signed up to Banjaro. Ban, suspend, verify or remove an account.'
      infoContent={usersInfoContent}
    >
      <UserListingPage />
    </PageContainer>
  );
}
