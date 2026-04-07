import type { Dispatch, SetStateAction } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PAGE_SIZE_OPTIONS } from '../hooks/useListPagination';

type SetPage = Dispatch<SetStateAction<number>>;

export default function ListPaginationBar({
  page,
  pageCount,
  pageSize,
  setPage,
  setPageSize,
  total,
  startIndex,
  endIndex,
  className = '',
  trailing,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  setPage: SetPage;
  setPageSize: (n: number) => void;
  total: number;
  startIndex: number;
  endIndex: number;
  className?: string;
  trailing?: React.ReactNode;
}) {
  const rangeLabel =
    total === 0 ? '0' : `${startIndex + 1}–${endIndex}`;

  return (
    <div
      className={`flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3 px-5 py-3 border-t border-dark/6 bg-cream/40 ${className}`}
    >
      <p className="text-xs text-dark/50">
        Showing <span className="font-semibold text-dark/70">{rangeLabel}</span> of{' '}
        {total}
      </p>
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <label className="flex items-center gap-2 text-xs text-dark/50">
          <span className="whitespace-nowrap">Rows per page</span>
          <select
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            className="px-2 py-1.5 rounded-lg border border-dark/12 bg-white text-sm text-dark/70 focus:outline-none focus:ring-2 focus:ring-teal/25"
          >
            {PAGE_SIZE_OPTIONS.map(n => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous page"
            disabled={page <= 0}
            onClick={() => setPage(p => Math.max(0, p - 1))}
            className="inline-flex items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-dark/55 hover:bg-dark/6 disabled:opacity-35 disabled:pointer-events-none"
          >
            <ChevronLeft size={16} strokeWidth={2} />
            Prev
          </button>
          <span className="text-xs text-dark/55 px-2 min-w-[5.5rem] text-center tabular-nums">
            Page {page + 1} / {pageCount}
          </span>
          <button
            type="button"
            aria-label="Next page"
            disabled={page >= pageCount - 1}
            onClick={() => setPage(p => Math.min(p + 1, pageCount - 1))}
            className="inline-flex items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs font-semibold text-dark/55 hover:bg-dark/6 disabled:opacity-35 disabled:pointer-events-none"
          >
            Next
            <ChevronRight size={16} strokeWidth={2} />
          </button>
        </div>
        {trailing}
      </div>
    </div>
  );
}
