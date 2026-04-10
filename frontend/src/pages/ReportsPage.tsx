import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  TrendingUp, Award, Users, UserCheck, UserPlus, Heart,
  BookOpen, Stethoscope, Home, ClipboardList, RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { apiFetch } from '../api';
import { useListPagination } from '../hooks/useListPagination';
import ListPaginationBar from '../components/ListPaginationBar';
import { formatCurrencyDetailed, formatCurrencyAxis } from '../utils/currency';
import DonationAllocationsSection from '../components/DonationAllocationsSection';

// ─── API shape ────────────────────────────────────────────────────────────────

interface CategoryCount { label: string; count: number; }

interface DonationTrendPoint    { month: string; amount: number; }
interface SafehouseOutcomePoint { safehouse: string; health: number; education: number; }
interface SafehousePerformanceRow {
  name: string; residents: number;
  healthScore: number; educationProgress: number; incidents: number;
}

interface ReportsSummary {
  // Beneficiary summary
  totalBeneficiaries: number;
  activeCases: number;
  newAdmissionsThisYear: number;
  reintegratedCompleted: number;

  // Services rendered
  counselingSessionsTotal: number;
  homeVisitationsTotal: number;
  healthAssessmentsTotal: number;
  educationRecordsTotal: number;
  interventionPlansTotal: number;
  educationalPlansTotal: number;

  // Case composition
  casesByStatus: CategoryCount[];
  casesByRisk: CategoryCount[];
  subcategoryBreakdown: CategoryCount[];

  // Outcomes
  reintegrationSuccessRate: number;
  avgHealthScore: number;
  avgEducationProgress: number;

  // Charts
  donationTrend: DonationTrendPoint[];
  safehouseOutcomes: SafehouseOutcomePoint[];
  safehousePerformance: SafehousePerformanceRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const healthToFive = (v: number) => Math.round((v / 20) * 10) / 10;

/**
 * Standardize safehouse labels for reports.
 * Keeps report outputs in neutral code form (e.g. SH0-3),
 * even if source data includes named facilities.
 */
const toSafehouseCode = (raw: string) => {
  const text = (raw ?? '').toUpperCase();
  const match = text.match(/SH\D*(\d{1,2})/) ?? text.match(/(\d{1,2})/);
  if (!match) return raw || 'SH0-?';
  const n = Number(match[1]);
  if (!Number.isFinite(n)) return raw || 'SH0-?';
  return `SH0-${n}`;
};

const RISK_COLORS: Record<string, string> = {
  Critical: '#dc2626',
  High:     '#ea580c',
  Medium:   '#ca8a04',
  Low:      '#16a34a',
};

const STATUS_COLORS: Record<string, string> = {
  Active:        '#1B3A5C',
  Reintegrating: '#2D8F8A',
  Aftercare:     '#7c3aed',
  Closed:        '#6b7280',
};

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

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="border-l-4 border-teal pl-4 mb-5">
      <h2 className="font-display text-lg font-bold text-navy">{title}</h2>
      {sub && <p className="text-dark/45 text-sm mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  function load() {
    setLoading(true); setError('');
    apiFetch('/api/reports/summary')
      .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
      .then(setSummary)
      .catch(err => setError(String(err)))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const shPag = useListPagination(summary?.safehousePerformance ?? [], [summary]);
  const normalizedSafehouseOutcomes = (summary?.safehouseOutcomes ?? []).map(row => ({
    ...row,
    safehouse: toSafehouseCode(row.safehouse),
  }));
  const normalizedSafehousePerformance = (summary?.safehousePerformance ?? []).map(row => ({
    ...row,
    name: toSafehouseCode(row.name),
  }));

  const currentYear  = new Date().getFullYear();
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

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
          <button onClick={load} className="mt-5 btn-primary text-sm">Retry</button>
        </div>
      </AdminLayout>
    );
  }

  if (!summary) return null;

  return (
    <AdminLayout>
      <div className="space-y-8 animate-fade-in">

        {/* ── Page header ───────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-navy">
              Annual Accomplishment Report
            </h1>
            <p className="text-dark/50 text-sm mt-1">
              {currentMonth} · Philippine Social Welfare Reporting Format · Residential Child-Care Program
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* I. BENEFICIARY SUMMARY                                            */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader
            title="I. Beneficiary Summary"
            sub="Total children served through the residential care program"
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Users,
                label: 'Total Beneficiaries',
                value: summary.totalBeneficiaries,
                sub: 'All cases on record',
                color: 'bg-navy/8 text-navy',
                accent: 'border-navy/20',
              },
              {
                icon: UserCheck,
                label: 'Active Cases',
                value: summary.activeCases,
                sub: 'Currently in care',
                color: 'bg-teal/10 text-teal-dark',
                accent: 'border-teal/25',
              },
              {
                icon: UserPlus,
                label: `New Admissions ${currentYear}`,
                value: summary.newAdmissionsThisYear,
                sub: 'Year-to-date admissions',
                color: 'bg-blue-50 text-blue-700',
                accent: 'border-blue-200',
              },
              {
                icon: Award,
                label: 'Successfully Reintegrated',
                value: summary.reintegratedCompleted,
                sub: 'Reintegration completed',
                color: 'bg-green-50 text-green-700',
                accent: 'border-green-200',
              },
            ].map(({ icon: Icon, label, value, sub, color, accent }) => (
              <div key={label} className={`card border ${accent}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
                  <Icon size={18} />
                </div>
                <div className="font-display text-3xl font-bold text-navy mb-0.5">{value}</div>
                <div className="text-sm font-semibold text-dark/70">{label}</div>
                <div className="text-xs text-dark/40 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* II. SERVICES RENDERED                                             */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader
            title="II. Services Rendered"
            sub="Service delivery totals by domain: Caring, Healing, and Teaching"
          />
          <div className="grid md:grid-cols-3 gap-5">

            {/* CARING */}
            <div className="card border border-teal/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center">
                  <Home size={18} className="text-teal" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-navy text-base">Caring Services</h3>
                  <p className="text-xs text-dark/45">Shelter, safety & family monitoring</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-dark/6">
                  <span className="text-sm text-dark/65">Home Visitations Conducted</span>
                  <span className="font-display font-bold text-lg text-teal">
                    {summary.homeVisitationsTotal}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-dark/65">Intervention Plans (Total)</span>
                  <span className="font-display font-bold text-lg text-teal">
                    {summary.interventionPlansTotal}
                  </span>
                </div>
              </div>
            </div>

            {/* HEALING */}
            <div className="card border border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Heart size={18} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-navy text-base">Healing Services</h3>
                  <p className="text-xs text-dark/45">Psychosocial & health support</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-dark/6">
                  <span className="text-sm text-dark/65">Counseling Sessions</span>
                  <span className="font-display font-bold text-lg text-purple-600">
                    {summary.counselingSessionsTotal}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-dark/65">Health Assessments</span>
                  <span className="font-display font-bold text-lg text-purple-600">
                    {summary.healthAssessmentsTotal}
                  </span>
                </div>
              </div>
            </div>

            {/* TEACHING */}
            <div className="card border border-gold/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
                  <BookOpen size={18} className="text-gold" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-navy text-base">Teaching Services</h3>
                  <p className="text-xs text-dark/45">Education & skills development</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-dark/6">
                  <span className="text-sm text-dark/65">Education Records Filed</span>
                  <span className="font-display font-bold text-lg text-gold">
                    {summary.educationRecordsTotal}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-dark/65">Educational Intervention Plans</span>
                  <span className="font-display font-bold text-lg text-gold">
                    {summary.educationalPlansTotal}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* III. BENEFICIARY PROFILE                                          */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader
            title="III. Beneficiary Profile"
            sub="Case status distribution and current risk classification"
          />
          <div className="grid md:grid-cols-2 gap-6">

            {/* Case by status */}
            <div className="card">
              <h3 className="font-display text-base font-semibold text-navy mb-1">
                Cases by Status
              </h3>
              <p className="text-dark/45 text-sm mb-4">Current case disposition</p>
              {summary.casesByStatus.length === 0 ? (
                <div className="py-10 text-center text-dark/40 text-sm">No data.</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={summary.casesByStatus} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip formatter={(v: any, n: any, props: any) => [v, props.payload.label ?? n]} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {summary.casesByStatus.map(entry => (
                        <Cell
                          key={entry.label}
                          fill={STATUS_COLORS[entry.label] ?? '#94a3b8'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Case by risk */}
            <div className="card">
              <h3 className="font-display text-base font-semibold text-navy mb-1">
                Cases by Risk Level
              </h3>
              <p className="text-dark/45 text-sm mb-4">Current risk classification</p>
              {summary.casesByRisk.length === 0 ? (
                <div className="py-10 text-center text-dark/40 text-sm">No risk data recorded.</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={summary.casesByRisk} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip formatter={(v: any, n: any, props: any) => [v, props.payload.label ?? n]} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {summary.casesByRisk.map(entry => (
                        <Cell
                          key={entry.label}
                          fill={RISK_COLORS[entry.label] ?? '#94a3b8'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Sub-category breakdown */}
          {summary.subcategoryBreakdown.length > 0 && (
            <div className="card mt-5">
              <div className="flex items-center gap-3 mb-4">
                <ShieldAlert size={18} className="text-red-500" />
                <div>
                  <h3 className="font-display text-base font-semibold text-navy">
                    Case Sub-Category Breakdown
                  </h3>
                  <p className="text-dark/45 text-sm">
                    Types of abuse, neglect, or vulnerability — beneficiaries may have multiple sub-categories
                  </p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={summary.subcategoryBreakdown.length * 42 + 20}>
                <BarChart
                  layout="vertical"
                  data={summary.subcategoryBreakdown}
                  margin={{ left: 16, right: 32 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="label" width={120} tick={{ fontSize: 12, fill: '#374151' }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: any) => [v, 'Beneficiaries']} />
                  <Bar dataKey="count" name="Beneficiaries" fill="#1B3A5C" radius={[0, 6, 6, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* IV. PROGRAM OUTCOMES                                              */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader
            title="IV. Program Outcomes"
            sub="Program outcome indicators across safehouse units"
          />

          {/* Outcome stat cards */}
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            {[
              {
                label:  'Reintegration Success Rate',
                value:  `${summary.reintegrationSuccessRate.toFixed(1)}%`,
                sub:    'Of residents with reintegration status',
                bg:     'from-teal to-teal-dark',
              },
              {
                label:  'Avg. Health Score',
                value:  `${summary.avgHealthScore.toFixed(1)} / 5`,
                sub:    'Across all safehouses',
                bg:     'from-navy to-navy-light',
              },
              {
                label:  'Avg. Education Progress',
                value:  `${summary.avgEducationProgress.toFixed(1)}%`,
                sub:    'Curriculum completion rate',
                bg:     'from-yellow-600 to-gold',
              },
            ].map(({ label, value, sub, bg }) => (
              <div key={label} className={`rounded-2xl bg-gradient-to-br ${bg} text-white p-6`}>
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center mb-3">
                  <Award size={18} className="text-white" strokeWidth={1.8} />
                </div>
                <div className="font-display text-4xl font-bold mb-1">{value}</div>
                <div className="font-medium text-sm mb-1">{label}</div>
                <div className="text-white/60 text-xs">{sub}</div>
              </div>
            ))}
          </div>

          {/* Health & Education charts by safehouse */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <div className="flex items-center gap-2 mb-1">
                <Stethoscope size={16} className="text-teal" />
                <h3 className="font-display text-base font-semibold text-navy">
                  Health Scores by Safehouse
                </h3>
              </div>
              <p className="text-dark/45 text-sm mb-4 pl-6">Average score out of 5</p>
              {normalizedSafehouseOutcomes.length === 0 ? (
                <div className="py-10 text-center text-dark/40 text-sm">No health data.</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={normalizedSafehouseOutcomes.map(r => ({
                      ...r, healthOutOfFive: healthToFive(r.health),
                    }))}
                    barSize={28}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="safehouse" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} domain={[0, 5]} />
                    <Tooltip formatter={(v: any) => [`${v} / 5`, 'Health Score']} />
                    <Bar dataKey="healthOutOfFive" fill="#2D8F8A" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card">
              <div className="flex items-center gap-2 mb-1">
                <ClipboardList size={16} className="text-navy" />
                <h3 className="font-display text-base font-semibold text-navy">
                  Education Progress by Safehouse
                </h3>
              </div>
              <p className="text-dark/45 text-sm mb-4 pl-6">Average curriculum completion %</p>
              {normalizedSafehouseOutcomes.length === 0 ? (
                <div className="py-10 text-center text-dark/40 text-sm">No education data.</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={normalizedSafehouseOutcomes} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="safehouse" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip formatter={(v: any) => [`${v}%`, 'Education Progress']} />
                    <Bar dataKey="education" fill="#1B3A5C" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* V. SAFEHOUSE PERFORMANCE                                          */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader
            title="V. Safehouse Performance"
            sub={`${currentMonth} snapshot — active resident counts, scores, and safety incidents`}
          />
          <div className="card overflow-hidden p-0">
            {normalizedSafehousePerformance.length === 0 ? (
              <div className="py-16 text-center text-dark/40 text-sm">No safehouse data.</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-cream/70 border-b border-dark/8">
                        {['Safehouse', 'Active Residents', 'Avg Health Score', 'Avg Education Progress', 'Incidents This Month'].map(h => (
                          <th key={h} className="text-left text-xs font-semibold text-dark/40 uppercase tracking-wide px-5 py-3.5 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {shPag.pageItems.map((sh, i) => (
                        <tr key={sh.name} className={`border-b border-dark/5 last:border-0 ${(shPag.startIndex + i) % 2 === 0 ? '' : 'bg-cream/30'}`}>
                          <td className="px-5 py-4 font-semibold text-sm text-navy">{toSafehouseCode(sh.name)}</td>
                          <td className="px-5 py-4 text-sm text-dark/70">{sh.residents}</td>
                          <td className="px-5 py-4">
                            {sh.healthScore > 0 ? (
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-dark/8 rounded-full h-1.5">
                                  <div className="bg-teal h-1.5 rounded-full" style={{ width: `${sh.healthScore}%` }} />
                                </div>
                                <span className="text-sm font-semibold text-dark">{healthToFive(sh.healthScore)} / 5</span>
                              </div>
                            ) : <span className="text-sm text-dark/35">—</span>}
                          </td>
                          <td className="px-5 py-4">
                            {sh.educationProgress > 0 ? (
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-dark/8 rounded-full h-1.5">
                                  <div className="bg-navy h-1.5 rounded-full" style={{ width: `${sh.educationProgress}%` }} />
                                </div>
                                <span className="text-sm font-semibold text-dark">{sh.educationProgress}%</span>
                              </div>
                            ) : <span className="text-sm text-dark/35">—</span>}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${sh.incidents === 0 ? 'bg-green-100 text-green-700' : sh.incidents === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                              {sh.incidents} {sh.incidents === 1 ? 'incident' : 'incidents'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ListPaginationBar
                  page={shPag.page} pageCount={shPag.pageCount} pageSize={shPag.pageSize}
                  setPage={shPag.setPage} setPageSize={shPag.setPageSize}
                  total={shPag.total} startIndex={shPag.startIndex} endIndex={shPag.endIndex}
                />
              </>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* VI. FINANCIAL SUPPORT                                             */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader
            title="VI. Financial Support"
            sub="Donation contributions over the last 12 months"
          />
          <div className="card">
            <div className="flex items-center gap-3 mb-5">
              <TrendingUp size={20} className="text-gold" />
              <div>
                <h3 className="font-display text-base font-semibold text-navy">Donation Trend (12 Months)</h3>
                <p className="text-dark/45 text-sm">Monthly contributions — all types</p>
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
                    axisLine={false} tickLine={false}
                    tickFormatter={v => formatCurrencyAxis(v)}
                  />
                  <Tooltip content={<CustomTooltipPeso />} />
                  <Line
                    type="monotone" dataKey="amount" stroke="#D4A843"
                    strokeWidth={2.5} dot={{ fill: '#D4A843', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* VII. DONATION ALLOCATIONS                                         */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <section>
          <SectionHeader
            title="VII. Donation Allocations"
            sub="How donations are distributed across safehouses and program areas"
          />
          <DonationAllocationsSection />
        </section>

      </div>
    </AdminLayout>
  );
}
