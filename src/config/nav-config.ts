import { NavGroup } from '@/types';

/**
 * Sidebar and Cmd+K navigation for the Banjaro console.
 *
 * Items may carry an `access` block (`{ role, permission, plan, feature,
 * requireOrg }`) to hide themselves — see docs/nav-rbac.md. Nothing here uses
 * one yet: anyone who can sign in to this console is an admin.
 */
export const navGroups: NavGroup[] = [
  {
    label: 'Banjaro',
    items: [
      {
        title: 'Overview',
        url: '/dashboard/overview',
        icon: 'dashboard',
        shortcut: ['d', 'd'],
        isActive: false,
        items: []
      },
      {
        title: 'Accounts',
        url: '/dashboard/users',
        icon: 'user',
        shortcut: ['u', 'u'],
        isActive: false,
        items: []
      },
      {
        title: 'Reports',
        url: '/dashboard/reports',
        icon: 'warning',
        shortcut: ['r', 'r'],
        isActive: false,
        items: []
      },
      {
        title: 'Activities',
        url: '/dashboard/activities',
        icon: 'calendar',
        shortcut: ['a', 'a'],
        isActive: false,
        items: []
      },
      {
        title: 'Destinations',
        url: '/dashboard/destinations',
        icon: 'media',
        shortcut: ['t', 't'],
        isActive: false,
        items: []
      }
    ]
  }
];
