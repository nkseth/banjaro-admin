import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger,
  parseAsString
} from 'nuqs/server';

/**
 * Keys must match the data-table column ids they filter — `useDataTable`
 * writes each column filter to the query string under the column's own id.
 */
export const searchParams = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  name: parseAsString,
  status: parseAsString,
  tier: parseAsString,
  sort: parseAsString
};

export const searchParamsCache = createSearchParamsCache(searchParams);
export const serialize = createSerializer(searchParams);
