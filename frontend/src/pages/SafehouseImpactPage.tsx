import { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../layouts/AdminLayout';
import { apiFetch } from '../api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from 'recharts';
import {
  Brain, Building2, TrendingUp, TrendingDown, Minus,
  Play, RefreshCw, CheckCircle, AlertTriangle, Info,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SafehouseImpact {
  safehouseId: number;
  safehouseName: string;
  city: string;
  region: string;
  activeResidents: number;
  totalFunding: number;
  fundingPerResident: number;
  currentEducationProgress: number;
  currentHealthScore: number;
  pctEducation: number;
  pctWellbeing: number;
  pctOperations: number;
  pctTransport: number;
  pctMaintenance: number;
  pctOutreach: number;
  fundingEducation: number;
  fundingWellbeing: number;
  fundingOperations: number;
  predictedEducationProgress: number;
  delta: number;
  trend: 'Improving' | 'Declining' | 'Stable';
  narrative: string;
  mlAvailable: boolean;
}

interface ImpactSummary {
  totalFunding: number;
  avgCurrentProgress: number;
  avgPredictedProgress: number;
  activeSafehouses: number;
}

interface ImpactResult {
  available: boolean;
  mlAvailable?: boolean;
  safehouses?: SafehouseImpact[];
  summary?: ImpactSummary;
  reason?: string;
}

interface SimResult {
  available: boolean;
  safehouseId?: number;
  safehouseName?: string;
  currentEducationProgress?: number;
  projectedEducationProgress?: number;
  delta?: number;
  confidence?: 'High' | 'Medium' | 'Low';
  recommendation?: string;
  reason?: string;
}

type AllocKey = 'education' | 'wellbeing' | 'operations' | 'transport' | 'maintenance' | 'outreach';
type AllocState = Record<AllocKey, number>;

// ─── Constants ───────────────────────────────────────────────────────────────

const ALLOC_LABELS: Record<AllocKey, string> = {
  education:   'Education',
  wellbeing:   'Wellbeing & Health',
  operations:  'Operations & Shelter',
  transport:   'Transport',
  maintenance: 'Maintenance',
  outreach:    'Outreach',
};

const ALLOC_COLORS: Record<AllocKey, string> = {
  education:   '#0d9488',   // teal
  wellbeing:   '#6366f1',   // indigo
  operations:  '#f59e0b',   // amber
  transport:   '#10b981',   // green
  maintenance: '#8b5cf6',   // violet
  outreach:    '#ec4899',   // pink
};

const TEMPLATES: { id: string; label: string; subtitle: string; alloc: AllocState }[] = [
  {
    id: 'balanced',
    label: 'Balanced',
    subtitle: 'Equal emphasis across all areas',
    alloc: { education: 30, wellbeing: 30, operations: 25, transport: 5, maintenance: 5, outreach: 5 },
  },
  {
    id: 'education-focus',
    label: 'Education Focus',
    subtitle: 'Prioritise academic progress',
    alloc: { education: 50, wellbeing: 20, operations: 18, transport: 4, maintenance: 4, outreach: 4 },
  },
  {
    id: 'wellbeing-focus',
    label: 'Wellbeing Focus',
    subtitle: 'Prioritise health & psychosocial',
    alloc: { education: 22, wellbeing: 48, operations: 18, transport: 4, maintenance: 4, outreach: 4 },
  },
];

const DEFAULT_ALLOC: AllocState = { education: 35, wellbeing: 28, operations: 22, transport: 5, maintenance: 5, outreach: 5 };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function phpFormat(n: number): string {
  if (n >= 1_000_000) return `₱${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `₱${(n / 1_000).toFixed(0)}K`;
  return `₱${n.toFixed(0)}`;
}

function allocSum(a: AllocState): number {
  return Math.round((Object.values(a) as number[]).reduce((s, v) => s + v, 0) * 10) / 10;
}

function adjustAlloc(alloc: AllocState, field: AllocKey, newVal: number): AllocState {
  const clamped = Math.min(100, Math.max(0, newVal));
  const remaining = Math.round((100 - clamped) * 10) / 10;
  const others = (Object.keys(alloc) as AllocKey[]).filter(k => k !== field);
  const othersSum = others.reduce((s, k) => s + alloc[k], 0);

  const next: AllocState = { ...alloc, [field]: clamped };

  if (othersSum === 0) {
    const per = Math.round((remaining / others.length) * 10) / 10;
    others.forEach(k => { next[k] = per; });
  } else {
    const scale = remaining / othersSum;
    others.forEach(k => { next[k] = Math.round(alloc[k] * scale * 10) / 10; });
    // Fix rounding drift on the largest other field
    const drift = Math.round((100 - (Object.values(next) as number[]).reduce((s, v) => s + v, 0)) * 10) / 10;
    if (drift !== 0) {
      const largest = [...others].sort((a, b) => next[b] - next[a])[0];
      next[largest] = Math.round((next[largest] + drift) * 10) / 10;
    }
  }
  return next;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TrendBadge({ trend }: { trend: string }) {
  if (trend === 'Improving') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
      <TrendingUp size={11} /> Improving
    </span>
  );
  if (trend === 'Declining') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
      <TrendingDown size={11} /> Declining
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
      <Minus size={11} /> Stable
    </span>
  );
}

function DeltaBadge({ delta }: { delta: number }) {
  const color = delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-500' : 'text-gray-500';
  return <span className={`text-sm font-bold tabular-nums ${color}`}>{delta > 0 ? '+' : ''}{delta.toFixed(1)}%</span>;
}

function ConfidenceBadge({ level }: { level: string }) {
  const cfg: Record<string, string> = {
    High:   'bg-green-100 text-green-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    Low:    'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg[level] ?? cfg.Medium}`}>
      {level} Confidence
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SafehouseImpactPage() {
  const [impactData, setImpactData] = useState<ImpactResult | null>(null);
  const [loadingImpact, setLoadingImpact] = useState(true);

  // Simulator
  const [selectedId, setSelectedId]     = useState<number | ''>('');
  const [totalBudget, setTotalBudget]   = useState(500000);
  const [alloc, setAlloc]               = useState<AllocState>(DEFAULT_ALLOC);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [simResult, setSimResult]       = useState<SimResult | null>(null);
  const [simLoading, setSimLoading]     = useState(false);

  // ── Load impact data ────────────────────────────────────────────────────
  useEffect(() => {
    setLoadingImpact(true);
    apiFetch('/api/ml/safehouse-funding-impact')
      .then(r => r.ok ? r.json() : { available: false, reason: 'Request failed' })
      .then((data: ImpactResult) => {
        setImpactData(data);
        // Pre-select first safehouse in simulator
        if (data.safehouses && data.safehouses.length > 0) {
          setSelectedId(data.safehouses[0].safehouseId);
          // Pre-fill simulator from current allocation
          const sh = data.safehouses[0];
          setAlloc({
            education:   sh.pctEducation,
            wellbeing:   sh.pctWellbeing,
            operations:  sh.pctOperations,
            transport:   sh.pctTransport,
            maintenance: sh.pctMaintenance,
            outreach:    sh.pctOutreach,
          });
          setTotalBudget(sh.totalFunding || 500000);
        }
      })
      .catch(() => setImpactData({ available: false, reason: 'Failed to load' }))
      .finally(() => setLoadingImpact(false));
  }, []);

  // When safehouse selection changes, pre-fill with its current allocation
  function onSelectSafehouse(id: number) {
    setSelectedId(id);
    setSimResult(null);
    setActiveTemplate(null);
    const sh = impactData?.safehouses?.find(s => s.safehouseId === id);
    if (sh) {
      setAlloc({
        education:   sh.pctEducation,
        wellbeing:   sh.pctWellbeing,
        operations:  sh.pctOperations,
        transport:   sh.pctTransport,
        maintenance: sh.pctMaintenance,
        outreach:    sh.pctOutreach,
      });
      setTotalBudget(sh.totalFunding || 500000);
    }
  }

  function applyTemplate(t: typeof TEMPLATES[0]) {
    setAlloc(t.alloc);
    setActiveTemplate(t.id);
    setSimResult(null);
  }

  const runSimulation = useCallback(async () => {
    if (!selectedId) return;
    const sum = allocSum(alloc);
    if (Math.abs(sum - 100) > 0.5) return; // guard: must sum to 100
    setSimLoading(true);
    setSimResult(null);
    try {
      const res = await apiFetch('/api/ml/safehouse-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          safehouseId:    selectedId,
          totalBudget,
          pctEducation:   alloc.education,
          pctWellbeing:   alloc.wellbeing,
          pctOperations:  alloc.operations,
          pctTransport:   alloc.transport,
          pctMaintenance: alloc.maintenance,
          pctOutreach:    alloc.outreach,
        }),
      });
      const data: SimResult = res.ok ? await res.json() : { available: false, reason: 'Request failed' };
      setSimResult(data);
    } catch {
      setSimResult({ available: false, reason: 'ML service unavailable' });
    } finally {
      setSimLoading(false);
    }
  }, [selectedId, totalBudget, alloc]);

  // ── Derived data ────────────────────────────────────────────────────────
  const safehouses = impactData?.safehouses ?? [];
  const summary    = impactData?.summary;

  const chartData = safehouses.map(sh => ({
    name:      sh.safehouseName.length > 14 ? sh.safehouseName.slice(0, 14) + '…' : sh.safehouseName,
    current:   sh.currentEducationProgress,
    predicted: sh.predictedEducationProgress,
    delta:     sh.delta,
  }));

  // Public impact narrative
  const totalEduFunding  = safehouses.reduce((s, sh) => s + sh.fundingEducation,  0);
  const totalWellFunding = safehouses.reduce((s, sh) => s + sh.fundingWellbeing,  0);
  const totalOpsFunding  = safehouses.reduce((s, sh) => s + sh.fundingOperations, 0);
  const grandTotal       = safehouses.reduce((s, sh) => s + sh.totalFunding, 0);
  const totalResidents   = safehouses.reduce((s, sh) => s + sh.activeResidents, 0);

  const sum = allocSum(alloc);
  const sumOk = Math.abs(sum - 100) <= 0.5;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto space-y-7">

        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain size={18} className="text-teal" />
            <span className="text-xs font-bold uppercase tracking-widest text-dark/40">ML · Funding Impact</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-navy">Funding Impact &amp; Allocation Simulator</h1>
          <p className="text-dark/50 text-sm mt-1">
            Explore how different funding allocations affect resident education outcomes across safehouses.
          </p>
        </div>

        {/* ── Summary stats ──────────────────────────────────────────────── */}
        {loadingImpact ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-dark/6 rounded-2xl" />)}
          </div>
        ) : summary ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Funding',        value: phpFormat(summary.totalFunding),                    sub: 'across all active safehouses' },
              { label: 'Active Safehouses',    value: String(summary.activeSafehouses),                  sub: 'included in model' },
              { label: 'Avg Current Progress', value: `${summary.avgCurrentProgress.toFixed(1)}%`,       sub: 'education progress score' },
              { label: 'Avg Projected',        value: `${summary.avgPredictedProgress.toFixed(1)}%`,     sub: 'next-month prediction', highlight: true },
            ].map(({ label, value, sub, highlight }) => (
              <div key={label} className={`card p-5 ${highlight ? 'border-teal/20 bg-teal/4' : ''}`}>
                <p className="text-xs font-semibold text-dark/40 uppercase tracking-wide mb-1">{label}</p>
                <p className={`font-display text-2xl font-bold ${highlight ? 'text-teal' : 'text-navy'}`}>{value}</p>
                <p className="text-xs text-dark/40 mt-1">{sub}</p>
              </div>
            ))}
          </div>
        ) : null}

        {/* ── Funding Impact Summary Table ────────────────────────────────── */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 px-5 pt-5 pb-3 border-b border-dark/6">
            <Building2 size={16} className="text-navy" />
            <h2 className="font-display text-base font-semibold text-navy">Funding Impact Summary</h2>
            {impactData?.mlAvailable === false && (
              <span className="ml-auto flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                <AlertTriangle size={11} /> ML unavailable — showing funding breakdown only
              </span>
            )}
          </div>

          {loadingImpact ? (
            <div className="p-5 space-y-3 animate-pulse">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-dark/6 rounded-xl" />)}
            </div>
          ) : safehouses.length === 0 ? (
            <div className="p-8 text-center text-dark/40 text-sm">No active safehouses found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark/6 bg-cream/60">
                    <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wide text-dark/40">Safehouse</th>
                    <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide text-dark/40">Residents</th>
                    <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide text-dark/40">Total Funding</th>
                    <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide text-teal/70">Edu %</th>
                    <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide text-indigo-500/70">Wellbeing %</th>
                    <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide text-amber-500/70">Ops %</th>
                    <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide text-dark/40">Current</th>
                    <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide text-dark/40">Projected</th>
                    <th className="text-right px-4 py-3 text-xs font-bold uppercase tracking-wide text-dark/40">Delta</th>
                    <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-dark/40">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {safehouses.map((sh, i) => (
                    <tr key={sh.safehouseId} className={`border-b border-dark/4 hover:bg-cream/40 transition-colors ${i % 2 === 0 ? '' : 'bg-cream/20'}`}>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-navy">{sh.safehouseName}</p>
                        <p className="text-xs text-dark/40">{sh.city}, {sh.region}</p>
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-dark">{sh.activeResidents}</td>
                      <td className="px-4 py-3.5 text-right font-medium text-dark">{phpFormat(sh.totalFunding)}</td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="font-semibold text-teal">{sh.pctEducation.toFixed(1)}%</span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="font-semibold text-indigo-600">{sh.pctWellbeing.toFixed(1)}%</span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="font-semibold text-amber-600">{sh.pctOperations.toFixed(1)}%</span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-medium text-dark">{sh.currentEducationProgress.toFixed(1)}%</td>
                      <td className="px-4 py-3.5 text-right font-bold text-navy">{sh.predictedEducationProgress.toFixed(1)}%</td>
                      <td className="px-4 py-3.5 text-right"><DeltaBadge delta={sh.delta} /></td>
                      <td className="px-4 py-3.5"><TrendBadge trend={sh.trend} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Narrative interpretations */}
          {safehouses.length > 0 && (
            <div className="px-5 py-4 border-t border-dark/6 space-y-2">
              {safehouses.map(sh => (
                <div key={sh.safehouseId} className="flex items-start gap-2">
                  <Info size={13} className="text-dark/30 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-dark/55">
                    <span className="font-semibold text-dark/70">{sh.safehouseName}:</span> {sh.narrative}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Comparison Chart ────────────────────────────────────────────── */}
        {chartData.length > 0 && (
          <div className="card p-5">
            <h2 className="font-display text-base font-semibold text-navy mb-4">Safehouse Progress Comparison</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} barCategoryGap="30%" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[0, 100]}
                  tickFormatter={(v: unknown) => `${Number(v)}%`} />
                <Tooltip
                  formatter={(val: unknown, name: unknown) => [`${Number(val).toFixed(1)}%`, String(name)]}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="current"   name="Current Progress"   radius={[4,4,0,0]}>
                  {chartData.map((_entry, idx) => <Cell key={idx} fill="#94a3b8" />)}
                </Bar>
                <Bar dataKey="predicted" name="Projected Progress" radius={[4,4,0,0]}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.delta >= 0 ? '#0d9488' : '#f87171'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-dark/35 mt-2">
              Gray bars = current avg education progress. Teal/red bars = ML-projected next-month values.
            </p>
          </div>
        )}

        {/* ── Allocation Simulator ────────────────────────────────────────── */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-5">
            <Play size={16} className="text-teal" />
            <h2 className="font-display text-base font-semibold text-navy">Allocation Simulator</h2>
            <span className="ml-2 text-xs text-dark/40">Enter a budget split to project outcomes</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: inputs */}
            <div className="space-y-5">
              {/* Safehouse selector */}
              <div>
                <label className="block text-xs font-semibold text-dark/50 uppercase tracking-wide mb-1.5">
                  Safehouse
                </label>
                <select
                  value={selectedId}
                  onChange={e => onSelectSafehouse(Number(e.target.value))}
                  className="w-full rounded-xl border border-dark/15 bg-white px-3 py-2.5 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-teal/30"
                >
                  <option value="">— Select a safehouse —</option>
                  {safehouses.map(sh => (
                    <option key={sh.safehouseId} value={sh.safehouseId}>{sh.safehouseName}</option>
                  ))}
                </select>
              </div>

              {/* Total budget */}
              <div>
                <label className="block text-xs font-semibold text-dark/50 uppercase tracking-wide mb-1.5">
                  Total Monthly Budget (₱)
                </label>
                <input
                  type="number"
                  min={0}
                  step={10000}
                  value={totalBudget}
                  onChange={e => setTotalBudget(Number(e.target.value))}
                  className="w-full rounded-xl border border-dark/15 bg-white px-3 py-2.5 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-teal/30"
                />
                <p className="text-xs text-dark/35 mt-1">{phpFormat(totalBudget)} total</p>
              </div>

              {/* Allocation sliders */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-dark/50 uppercase tracking-wide">Program Area Allocation</span>
                  <span className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-full ${sumOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {sum.toFixed(1)}% {sumOk ? '✓' : '⚠ must equal 100%'}
                  </span>
                </div>
                <div className="space-y-3.5">
                  {(Object.keys(ALLOC_LABELS) as AllocKey[]).map(key => (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-medium text-dark/65">{ALLOC_LABELS[key]}</span>
                        <span className="text-xs font-bold tabular-nums" style={{ color: ALLOC_COLORS[key] }}>
                          {alloc[key].toFixed(1)}% &nbsp;
                          <span className="font-normal text-dark/40">{phpFormat(totalBudget * alloc[key] / 100)}</span>
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={0.5}
                        value={alloc[key]}
                        onChange={e => {
                          setAlloc(adjustAlloc(alloc, key, Number(e.target.value)));
                          setActiveTemplate(null);
                          setSimResult(null);
                        }}
                        style={{ accentColor: ALLOC_COLORS[key] }}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Run button */}
              <button
                onClick={runSimulation}
                disabled={!selectedId || !sumOk || simLoading}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {simLoading
                  ? <><RefreshCw size={15} className="animate-spin" /> Running simulation…</>
                  : <><Play size={15} /> Run Simulation</>}
              </button>
            </div>

            {/* Right: results */}
            <div>
              {simResult === null && !simLoading && (
                <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-12">
                  <Brain size={32} className="text-dark/15" />
                  <p className="text-sm text-dark/35 font-medium">Adjust the allocation and click Run Simulation to see projected outcomes.</p>
                </div>
              )}

              {simLoading && (
                <div className="h-full flex flex-col items-center justify-center gap-3 py-12 animate-pulse">
                  <Brain size={32} className="text-teal/40" />
                  <p className="text-sm text-dark/35">Running ML model…</p>
                </div>
              )}

              {simResult && !simLoading && (
                !simResult.available ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3">
                    <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-700">Simulation Unavailable</p>
                      <p className="text-xs text-amber-600 mt-1">{simResult.reason ?? 'ML service not connected.'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-teal/20 bg-teal/4 p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-widest text-dark/40">Simulation Result</span>
                      {simResult.confidence && <ConfidenceBadge level={simResult.confidence} />}
                    </div>

                    {/* Big projected number */}
                    <div className="flex items-end gap-4">
                      <div>
                        <p className="text-xs text-dark/40 font-semibold uppercase tracking-wide mb-1">Projected Education Progress</p>
                        <p className="font-display text-5xl font-bold text-teal tabular-nums">
                          {simResult.projectedEducationProgress?.toFixed(1)}<span className="text-2xl">%</span>
                        </p>
                      </div>
                      <div className="pb-1">
                        <p className="text-xs text-dark/40 mb-1">vs current</p>
                        <DeltaBadge delta={simResult.delta ?? 0} />
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div>
                      <div className="flex justify-between text-xs text-dark/40 mb-1.5">
                        <span>Current: {simResult.currentEducationProgress?.toFixed(1)}%</span>
                        <span>Projected: {simResult.projectedEducationProgress?.toFixed(1)}%</span>
                      </div>
                      <div className="relative h-3 bg-dark/8 rounded-full overflow-hidden">
                        <div className="absolute h-full bg-dark/15 rounded-full transition-all duration-500"
                          style={{ width: `${simResult.currentEducationProgress ?? 0}%` }} />
                        <div className={`absolute h-full rounded-full transition-all duration-700 ${(simResult.delta ?? 0) >= 0 ? 'bg-teal' : 'bg-red-400'}`}
                          style={{ width: `${simResult.projectedEducationProgress ?? 0}%` }} />
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className={`rounded-xl p-3.5 text-sm leading-relaxed ${(simResult.delta ?? 0) >= 1 ? 'bg-green-50 border border-green-200 text-green-800' : (simResult.delta ?? 0) >= -1 ? 'bg-blue-50 border border-blue-200 text-blue-800' : 'bg-orange-50 border border-orange-200 text-orange-800'}`}>
                      <CheckCircle size={14} className="inline mr-1.5 opacity-70" />
                      {simResult.recommendation}
                    </div>

                    {/* Allocation breakdown */}
                    <div>
                      <p className="text-xs font-semibold text-dark/40 uppercase tracking-wide mb-2">Simulated Allocation</p>
                      <div className="flex h-3 rounded-full overflow-hidden gap-px">
                        {(Object.keys(ALLOC_LABELS) as AllocKey[]).map(key => (
                          <div key={key} style={{ width: `${alloc[key]}%`, backgroundColor: ALLOC_COLORS[key] }} />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(Object.keys(ALLOC_LABELS) as AllocKey[]).filter(k => alloc[k] > 0).map(key => (
                          <span key={key} className="text-xs text-dark/55">
                            <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: ALLOC_COLORS[key] }} />
                            {ALLOC_LABELS[key]}: {alloc[key].toFixed(0)}%
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        {/* ── Recommended Templates ───────────────────────────────────────── */}
        <div>
          <h2 className="font-display text-base font-semibold text-navy mb-3">Recommended Allocation Templates</h2>
          <p className="text-xs text-dark/45 mb-4">
            Pre-defined budget splits based on common strategies. Click a template to load it into the simulator.
          </p>
          <div className="grid sm:grid-cols-3 gap-4">
            {TEMPLATES.map(t => (
              <button
                key={t.id}
                onClick={() => applyTemplate(t)}
                className={`card p-5 text-left transition-all hover:shadow-md ${activeTemplate === t.id ? 'ring-2 ring-teal border-teal/30' : 'hover:border-teal/20'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-navy text-sm">{t.label}</p>
                    <p className="text-xs text-dark/45 mt-0.5">{t.subtitle}</p>
                  </div>
                  {activeTemplate === t.id && <CheckCircle size={16} className="text-teal flex-shrink-0" />}
                </div>
                {/* Mini allocation bar */}
                <div className="flex h-2 rounded-full overflow-hidden gap-px mb-3">
                  {(Object.keys(ALLOC_LABELS) as AllocKey[]).map(key => (
                    <div key={key} style={{ width: `${t.alloc[key]}%`, backgroundColor: ALLOC_COLORS[key] }} />
                  ))}
                </div>
                <div className="space-y-1">
                  {(Object.entries(t.alloc) as [AllocKey, number][])
                    .sort(([,a],[,b]) => b - a)
                    .slice(0, 3)
                    .map(([key, pct]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-dark/55">{ALLOC_LABELS[key]}</span>
                        <span className="font-semibold" style={{ color: ALLOC_COLORS[key] }}>{pct}%</span>
                      </div>
                    ))}
                </div>
                <p className="text-xs text-teal font-semibold mt-3">Apply template →</p>
              </button>
            ))}
          </div>
        </div>

        {/* ── Donor-facing Impact Narrative ───────────────────────────────── */}
        {grandTotal > 0 && (
          <div className="card p-6 border-l-4 border-teal">
            <div className="flex items-center gap-2 mb-3">
              <Info size={15} className="text-teal" />
              <h2 className="font-display text-base font-semibold text-navy">Program Impact Narrative</h2>
              <span className="text-xs bg-teal/10 text-teal px-2 py-0.5 rounded-full font-semibold">Donor-facing summary</span>
            </div>
            <p className="text-sm text-dark/70 leading-relaxed">
              Across <strong>{safehouses.length} active safehouse{safehouses.length !== 1 ? 's' : ''}</strong>, SureAnchor currently supports{' '}
              <strong>{totalResidents} residents</strong> with a combined monthly funding base of{' '}
              <strong>{phpFormat(grandTotal)}</strong>.{' '}
              {grandTotal > 0 && <>
                Approximately <strong>{((totalEduFunding / grandTotal) * 100).toFixed(0)}% of funding</strong> goes directly toward education programs,{' '}
                <strong>{((totalWellFunding / grandTotal) * 100).toFixed(0)}%</strong> toward health and psychosocial wellbeing, and{' '}
                <strong>{((totalOpsFunding / grandTotal) * 100).toFixed(0)}%</strong> toward operations and shelter.{' '}
              </>}
              {summary && summary.avgPredictedProgress > summary.avgCurrentProgress && (
                <>Our ML model projects an average education progress improvement from{' '}
                <strong>{summary.avgCurrentProgress.toFixed(1)}%</strong> to{' '}
                <strong>{summary.avgPredictedProgress.toFixed(1)}%</strong> next month — a testament to the impact of consistent, well-allocated funding.</>
              )}
              {summary && summary.avgPredictedProgress <= summary.avgCurrentProgress && (
                <>Our model indicates that current allocations maintain an average education progress of{' '}
                <strong>{summary.avgCurrentProgress.toFixed(1)}%</strong>. Increased funding or reallocation toward education could drive further gains.</>
              )}
            </p>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}
