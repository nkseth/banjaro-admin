'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

type BreadcrumbItem = {
  title: string;
  link: string;
};

// Overrides for paths whose last segment is not the label we want — the
// fallback below just title-cases the URL. `/dashboard/users` is the one that
// matters: the page is called Accounts.
const routeMapping: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ title: 'Banjaro', link: '/dashboard/overview' }],
  '/dashboard/users': [
    { title: 'Banjaro', link: '/dashboard/overview' },
    { title: 'Accounts', link: '/dashboard/users' }
  ]
};

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    // Check if we have a custom mapping for this exact path
    if (routeMapping[pathname]) {
      return routeMapping[pathname];
    }

    // If no exact match, fall back to generating breadcrumbs from the path
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      return {
        title: segment.charAt(0).toUpperCase() + segment.slice(1),
        link: path
      };
    });
  }, [pathname]);

  return breadcrumbs;
}
