import { useEffect, useState } from 'react';

export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50, 100] as const;

/**
 * Client-side pagination for in-memory lists. Resets to page 0 when `resetDeps` change
 * (e.g. search text). Clamps the current page when the list shrinks.
 */
export function useListPagination<T>(items: readonly T[], resetDeps: unknown[]) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSizeState] = useState(10);

  const total = items.length;
  const pageCount = total === 0 ? 1 : Math.ceil(total / pageSize);
  const maxPage = Math.max(0, pageCount - 1);

  useEffect(() => {
    setPage(0);
  }, resetDeps);

  useEffect(() => {
    setPage(p => Math.min(p, maxPage));
  }, [maxPage]);

  const safePage = Math.min(page, maxPage);
  const startIndex = safePage * pageSize;
  const pageItems = items.slice(startIndex, startIndex + pageSize);
  const endIndex = Math.min(startIndex + pageSize, total);

  function setPageSize(n: number) {
    setPageSizeState(n);
    setPage(0);
  }

  return {
    page: safePage,
    setPage,
    pageSize,
    setPageSize,
    pageItems,
    total,
    pageCount,
    startIndex,
    endIndex,
  };
}
