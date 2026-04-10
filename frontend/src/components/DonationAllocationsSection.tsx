import { useEffect, useState } from 'react';
import { Building2, Target, TrendingUp, X } from 'lucide-react';
import { apiFetch } from '../api';
import { useListPagination } from '../hooks/useListPagination';
import ListPaginationBar from './ListPaginationBar';
import { CurrencyDisplay, CurrencyDisplayDetailed } from './CurrencyDisplay';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Allocation {
  allocationId: number;
  donationId: number;
  donorName: string;
  safehouseId: number;
  safehouseName: string;
  programArea: string;
  amountAllocated: number;
  allocationDate: string;
  allocationNotes: string | null;
}

interface SafehouseSummary {
  safehouseId: number;
  safehouseName: string;
  totalAllocated: number;
  allocationCount: number;
}

interface ProgramAreaSummary {
  programArea: string;
  totalAllocated: number;
  allocationCount: number;
}

interface AllocationsSummary {
  bySafehouse: SafehouseSummary[];
  byProgramArea: ProgramAreaSummary[];
  totalAllocated: number;
  totalAllocations: number;
}

// ─── Program Area Badge ───────────────────────────────────────────────────────

const programBadge = (area: string) => {
  const colorMap: Record<string, string> = {
    Education: 'bg-blue-100 text-blue-700',
    Wellbeing: 'bg-green-100 text-green-700',
    Operations: 'bg-purple-100 text-purple-700',
    Transport: 'bg-orange-100 text-orange-700',
    Maintenance: 'bg-gray-100 text-gray-700',
    Outreach: 'bg-pink-100 text-pink-700',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${colorMap[area] || 'bg-gray-100 text-gray-600'}`}>
      {area}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DonationAllocationsSection() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [summary, setSummary] = useState<AllocationsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [safehouseFilter, setSafehouseFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiFetch('/api/donations/allocations').then(r => r.ok ? r.json() : []),
      apiFetch('/api/donations/allocations/summary').then(r => r.ok ? r.json() : null),
    ])
      .then(([allocs, summ]) => {
        setAllocations(allocs);
        setSummary(summ);
      })
      .finally(() => setLoading(false));
  }, []);

  // Apply filters
  const filtered = allocations.filter(a => {
    if (safehouseFilter && a.safehouseId.toString() !== safehouseFilter) return false;
    if (programFilter && a.programArea !== programFilter) return false;
    return true;
  });

  const pag = useListPagination(filtered, [safehouseFilter, programFilter]);

  // Get unique safehouses and programs for filters
  const safehouses = Array.from(new Set(allocations.map(a => JSON.stringify({ id: a.safehouseId, name: a.safehouseName }))))
    .map(s => JSON.parse(s))
    .sort((a, b) => a.name.localeCompare(b.name));

  const programs = Array.from(new Set(allocations.map(a => a.programArea))).sort();

  const hasFilters = safehouseFilter || programFilter;

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-teal/10">
              <TrendingUp size={22} className="text-teal" strokeWidth={1.8} />
            </div>
            <div>
              <CurrencyDisplay
                php={summary.totalAllocated}
                usdClassName="font-display text-2xl font-bold text-teal"
                phpClassName="text-xs text-dark/30 font-normal"
              />
              <div className="text-sm text-dark/55 font-medium">Total Allocated</div>
            </div>
          </div>

          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-navy/8">
              <Target size={22} className="text-navy" strokeWidth={1.8} />
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-navy">{summary.totalAllocations}</div>
              <div className="text-sm text-dark/55 font-medium">Allocations</div>
            </div>
          </div>

          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gold/10">
              <Building2 size={22} className="text-gold" strokeWidth={1.8} />
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-gold">{summary.bySafehouse.length}</div>
              <div className="text-sm text-dark/55 font-medium">Safehouses Funded</div>
            </div>
          </div>

          <div className="card flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-100">
              <Target size={22} className="text-purple-700" strokeWidth={1.8} />
            </div>
            <div>
              <div className="font-display text-2xl font-bold text-purple-700">{summary.byProgramArea.length}</div>
              <div className="text-sm text-dark/55 font-medium">Program Areas</div>
            </div>
          </div>
        </div>
      )}

      {/* Breakdown by Safehouse and Program Area */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* By Safehouse */}
          <div className="card">
            <h3 className="font-display text-lg font-semibold text-navy mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-teal" />
              By Safehouse
            </h3>
            <div className="space-y-2">
              {summary.bySafehouse.slice(0, 5).map((s) => (
                <div key={s.safehouseId} className="flex items-center justify-between py-2 border-b border-dark/5 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-dark">{s.safehouseName}</p>
                    <p className="text-xs text-dark/40">{s.allocationCount} allocations</p>
                  </div>
                  <CurrencyDisplay
                    php={s.totalAllocated}
                    className="text-right"
                    usdClassName="text-sm font-semibold text-navy"
                    phpClassName="text-xs text-dark/30"
                  />
                </div>
              ))}
              {summary.bySafehouse.length > 5 && (
                <p className="text-xs text-dark/40 italic pt-2">
                  + {summary.bySafehouse.length - 5} more safehouses
                </p>
              )}
            </div>
          </div>

          {/* By Program Area */}
          <div className="card">
            <h3 className="font-display text-lg font-semibold text-navy mb-4 flex items-center gap-2">
              <Target size={18} className="text-teal" />
              By Program Area
            </h3>
            <div className="space-y-2">
              {summary.byProgramArea.map((p) => (
                <div key={p.programArea} className="flex items-center justify-between py-2 border-b border-dark/5 last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {programBadge(p.programArea)}
                    </div>
                    <p className="text-xs text-dark/40 mt-1">{p.allocationCount} allocations</p>
                  </div>
                  <CurrencyDisplay
                    php={p.totalAllocated}
                    className="text-right"
                    usdClassName="text-sm font-semibold text-navy"
                    phpClassName="text-xs text-dark/30"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-base font-semibold text-navy">All Allocations</h3>
          {hasFilters && (
            <button
              onClick={() => {
                setSafehouseFilter('');
                setProgramFilter('');
              }}
              className="flex items-center gap-1.5 text-xs text-teal hover:text-teal-dark font-semibold"
            >
              <X size={14} /> Clear Filters
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={safehouseFilter}
            onChange={e => setSafehouseFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm text-dark/60 focus:outline-none focus:ring-2 focus:ring-teal/30"
          >
            <option value="">All Safehouses</option>
            {safehouses.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            value={programFilter}
            onChange={e => setProgramFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm text-dark/60 focus:outline-none focus:ring-2 focus:ring-teal/30"
          >
            <option value="">All Program Areas</option>
            {programs.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Allocations Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-4 border-teal border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-dark/40 text-sm">
            {hasFilters ? 'No allocations match your filters.' : 'No allocations found.'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark/8 bg-cream/70">
                    <th className="text-left text-xs font-semibold text-dark/40 uppercase tracking-wide px-5 py-3.5 whitespace-nowrap">
                      Date
                    </th>
                    <th className="text-left text-xs font-semibold text-dark/40 uppercase tracking-wide px-5 py-3.5 whitespace-nowrap">
                      Safehouse
                    </th>
                    <th className="text-left text-xs font-semibold text-dark/40 uppercase tracking-wide px-5 py-3.5 whitespace-nowrap">
                      Program Area
                    </th>
                    <th className="text-left text-xs font-semibold text-dark/40 uppercase tracking-wide px-5 py-3.5 whitespace-nowrap">
                      Donor
                    </th>
                    <th className="text-right text-xs font-semibold text-dark/40 uppercase tracking-wide px-5 py-3.5 whitespace-nowrap">
                      Amount
                    </th>
                    <th className="text-left text-xs font-semibold text-dark/40 uppercase tracking-wide px-5 py-3.5 whitespace-nowrap">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pag.pageItems.map((a, i) => (
                    <tr
                      key={a.allocationId}
                      className={`border-b border-dark/5 last:border-0 ${(pag.startIndex + i) % 2 !== 0 ? 'bg-cream/30' : ''}`}
                    >
                      <td className="px-5 py-3.5 text-sm text-dark/60">{a.allocationDate}</td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-semibold text-navy">{a.safehouseName}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        {programBadge(a.programArea)}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm text-dark/70">{a.donorName}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <CurrencyDisplayDetailed
                          php={a.amountAllocated}
                          className="justify-end"
                          usdClassName="text-sm font-semibold text-navy"
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        {a.allocationNotes ? (
                          <p className="text-xs text-dark/50 italic max-w-xs truncate">{a.allocationNotes}</p>
                        ) : (
                          <span className="text-xs text-dark/25">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ListPaginationBar
              page={pag.page}
              pageCount={pag.pageCount}
              pageSize={pag.pageSize}
              setPage={pag.setPage}
              setPageSize={pag.setPageSize}
              total={pag.total}
              startIndex={pag.startIndex}
              endIndex={pag.endIndex}
            />
          </>
        )}
      </div>
    </div>
  );
}
