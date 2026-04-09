import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Award, RefreshCw } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { apiFetch } from '../api';
import { useListPagination } from '../hooks/useListPagination';
import ListPaginationBar from '../components/ListPaginationBar';
import { formatCurrencyDetailed, formatCurrencyAxis } from '../utils/currency';

// ─── API shape ────────────────────────────────────────────────────────────────

interface DonationTrendPoint    { month: string; amount: number; }
interface SafehouseOutcomePoint { safehouse: string; health: number; education: number; }
interface SafehousePerformanceRow {
  name: string; residents: number;
  healthScore: number; educationProgress: number; incidents: number;
}
interface ReportsSummary {
  reintegrationSuccessRate: number;  // 0–100
  avgHealthScore: number;            // 0–5
  avgEducationProgress: number;      // 0–100
  donationTrend: DonationTrendPoint[];
  safehouseOutcomes: SafehouseOutcomePoint[];
  safehousePerformance: SafehousePerformanceRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a 0–100 health score to a 0–5 score (1 decimal). */
const healthToFive = (scoreOutOf100: number) =>
  Math.round((scoreOutOf100 / 20) * 10) / 10;

const CustomTooltipPeso = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white rounded-xl shadow-card px-4 py-3 border border-dark/8">
        <p className="text-xs text-dark/50 mb-1">{label}</p>
        <p className="text-sm font-semibold text-navy">{formatCurrencyDetailed(Number(payload[0].value))}</p>
      </div>
    );
  }
  return null;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [summary, setSummary]   = useState<ReportsSummary | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    apiFetch('/api/reports/summary')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setSummary)
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  const shPag = useListPagination(summary?.safehousePerformance ?? [], [summary]);

  const currentMonthLabel = new Date().toLocaleDateString('en-US', {
    month: 'long', year: 'numeric',
  });

  // ── Derived stat values ────────────────────────────────────────────────────
  const successRateDisplay = summary
    ? `${summary.reintegrationSuccessRate.toFixed(1)}%`
    : '—';

  const avgHealthDisplay = summary
    ? `${summary.avgHealthScore.toFixed(1)} / 5`
    : '—';

  const avgEduDisplay = summary
    ? `${summary.avgEducationProgress.toFixed(1)}%`
    : '—';

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 rounded-full border-4 border-teal border-t-transparent animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="card text-center py-20">
          <RefreshCw size={36} className="text-dark/20 mx-auto mb-3" />
          <p className="font-display text-lg font-semibold text-navy mb-1">Could not load report data</p>
          <p className="text-dark/45 text-sm">{error}</p>
          <button
            onClick={() => { setLoading(true); setError('');
              apiFetch('/api/reports/summary')
                .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
                .then(setSummary).catch(e => setError(String(e)))
                .finally(() => setLoading(false)); }}
            className="mt-5 btn-primary text-sm"
          >
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  if (!summary) return null;

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">Reports & Analytics</h1>
          <p className="text-dark/50 text-sm mt-1">
            {currentMonthLabel} · Comprehensive program performance overview
          </p>
        </div>

        {/* ── Top stat cards ───────────────────────────────────────────────── */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              label: 'Reintegration Success Rate',
              value: successRateDisplay,
              sub: 'Of residents with reintegration status',
              bg: 'from-teal to-teal-dark',
            },
            {
              label: 'Avg. Health Score',
              value: avgHealthDisplay,
              sub: 'Across all safe houses',
              bg: 'from-navy to-navy-light',
            },
            {
              label: 'Avg. Education Progress',
              value: avgEduDisplay,
              sub: 'Curriculum completion rate',
              bg: 'from-yellow-600 to-gold',
            },
          ].map(({ label, value, sub, bg }) => (
            <div key={label} className={`rounded-2xl bg-gradient-to-br ${bg} text-white p-6`}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <Award size={18} className="text-white" strokeWidth={1.8} />
                </div>
              </div>
              <div className="font-display text-4xl font-bold mb-1">{value}</div>
              <div className="font-medium text-sm mb-1">{label}</div>
              <div className="text-white/60 text-xs">{sub}</div>
            </div>
          ))}
        </div>

        {/* ── Donation trend ───────────────────────────────────────────────── */}
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <TrendingUp size={20} className="text-gold" />
            <div>
              <h2 className="font-display text-xl font-semibold text-navy">Donation Trends (12 Months)</h2>
              <p className="text-dark/45 text-sm">Monthly contributions</p>
            </div>
          </div>
          {summary.donationTrend.every(p => p.amount === 0) ? (
            <div className="py-12 text-center text-dark/40 text-sm">No donation data for this period.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={summary.donationTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => formatCurrencyAxis(v)}
                />
                <Tooltip content={<CustomTooltipPeso />} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#D4A843"
                  strokeWidth={2.5}
                  dot={{ fill: '#D4A843', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Health & Education charts ─────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-display text-lg font-semibold text-navy mb-1">
              Health Scores by Safehouse
            </h2>
            <p className="text-dark/45 text-sm mb-5">Average score out of 5</p>
            {summary.safehouseOutcomes.length === 0 ? (
              <div className="py-10 text-center text-dark/40 text-sm">No health data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={summary.safehouseOutcomes.map(r => ({
                    ...r,
                    healthOutOfFive: healthToFive(r.health),
                  }))}
                  barSize={28}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="safehouse" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} domain={[0, 5]} />
                  <Tooltip formatter={(v: any) => [`${v} / 5`, 'Health Score']} />
                  <Bar dataKey="healthOutOfFive" name="Health Score" fill="#2D8F8A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card">
            <h2 className="font-display text-lg font-semibold text-navy mb-1">
              Education Progress by Safehouse
            </h2>
            <p className="text-dark/45 text-sm mb-5">Average curriculum completion %</p>
            {summary.safehouseOutcomes.length === 0 ? (
              <div className="py-10 text-center text-dark/40 text-sm">No education data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={summary.safehouseOutcomes} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="safehouse" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                  <Tooltip formatter={(v: any) => [`${v}%`, 'Education Progress']} />
                  <Bar dataKey="education" name="Education Progress" fill="#1B3A5C" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── Safehouse performance table ───────────────────────────────────── */}
        <div className="card overflow-hidden p-0">
          <div className="px-6 py-5 border-b border-dark/8">
            <h2 className="font-display text-xl font-semibold text-navy">
              Safehouse Performance Comparison
            </h2>
            <p className="text-dark/45 text-sm mt-1">{currentMonthLabel} snapshot</p>
          </div>
          {summary.safehousePerformance.length === 0 ? (
            <div className="py-16 text-center text-dark/40 text-sm">No safehouse data available.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-cream/70 border-b border-dark/8">
                      {[
                        'Safehouse', 'Active Residents',
                        'Avg Health Score', 'Avg Education Progress',
                        'Incidents This Month',
                      ].map(h => (
                        <th key={h}
                          className="text-left text-xs font-semibold text-dark/40 uppercase tracking-wide px-5 py-3.5 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {shPag.pageItems.map((sh, i) => (
                      <tr
                        key={sh.name}
                        className={`border-b border-dark/5 last:border-0 ${(shPag.startIndex + i) % 2 === 0 ? '' : 'bg-cream/30'}`}
                      >
                        <td className="px-5 py-4 font-semibold text-sm text-navy">{sh.name}</td>
                        <td className="px-5 py-4 text-sm text-dark/70">{sh.residents}</td>

                        {/* Health */}
                        <td className="px-5 py-4">
                          {sh.healthScore > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-dark/8 rounded-full h-1.5">
                                <div className="bg-teal h-1.5 rounded-full"
                                  style={{ width: `${sh.healthScore}%` }} />
                              </div>
                              <span className="text-sm font-semibold text-dark">
                                {healthToFive(sh.healthScore)} / 5
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-dark/35">—</span>
                          )}
                        </td>

                        {/* Education */}
                        <td className="px-5 py-4">
                          {sh.educationProgress > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-dark/8 rounded-full h-1.5">
                                <div className="bg-navy h-1.5 rounded-full"
                                  style={{ width: `${sh.educationProgress}%` }} />
                              </div>
                              <span className="text-sm font-semibold text-dark">
                                {sh.educationProgress}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-dark/35">—</span>
                          )}
                        </td>

                        {/* Incidents */}
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold
                            ${sh.incidents === 0
                              ? 'bg-green-100 text-green-700'
                              : sh.incidents === 1
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'}`}>
                            {sh.incidents} {sh.incidents === 1 ? 'incident' : 'incidents'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ListPaginationBar
                page={shPag.page}
                pageCount={shPag.pageCount}
                pageSize={shPag.pageSize}
                setPage={shPag.setPage}
                setPageSize={shPag.setPageSize}
                total={shPag.total}
                startIndex={shPag.startIndex}
                endIndex={shPag.endIndex}
              />
            </>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}
