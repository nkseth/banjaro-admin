import { queryOptions } from '@tanstack/react-query';
import { getUser, getUsers } from './service';
import type { BanjaroUser, UserFilters } from './types';

export type { BanjaroUser };

export const userKeys = {
  all: ['users'] as const,
  list: (filters: UserFilters) => [...userKeys.all, 'list', filters] as const,
  detail: (id: string) => [...userKeys.all, 'detail', id] as const
};

export const usersQueryOptions = (filters: UserFilters) =>
  queryOptions({
    queryKey: userKeys.list(filters),
    queryFn: () => getUsers(filters)
  });

export const userQueryOptions = (id: string) =>
  queryOptions({
    queryKey: userKeys.detail(id),
    queryFn: () => getUser(id)
  });
