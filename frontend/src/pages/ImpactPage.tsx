import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Heart, ArrowRight, TrendingUp, Users, Shield, Home, HeartHandshake } from 'lucide-react';
import PublicLayout from '../layouts/PublicLayout';
import { apiFetch } from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImpactStats {
  currentlyInCare: number;
  totalServed: number;
  reintegrationSuccessRate: number;
  activeSafehouses: number;
  totalDonatedPhp: number;
}

interface MonthPoint   { month: string; served: number }
interface DonationPoint { month: string; amount: number }
interface ProgramSlice  { name: string; value: number }
interface CategoryBar   { name: string; count: number }

interface ImpactData {
  stats: ImpactStats;
  monthlyServed: MonthPoint[];
  donationTrend: DonationPoint[];
  programAllocation: ProgramSlice[];
  caseCategories: CategoryBar[];
}

// ─── Palette ──────────────────────────────────────────────────────────────────

const COLORS = {
  teal:  '#2D8F8A',
  navy:  '#1B3A5C',
  gold:  '#D4A843',
  teal2: '#4DADA8',
  navy2: '#2E5F8A',
};

const PIE_PALETTE = [
  COLORS.teal, COLORS.navy, COLORS.gold, COLORS.teal2, COLORS.navy2,
  '#7B61FF', '#E07B54', '#4CAF82',
];

// ─── Custom Tooltips ──────────────────────────────────────────────────────────

const TooltipPeso = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg px-4 py-3 border border-navy/8">
      <p className="text-xs text-dark/50 mb-1">{label}</p>
      <p className="text-sm font-semibold text-navy">₱{Number(payload[0].value).toLocaleString()}</p>
    </div>
  );
};

const TooltipCount = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg px-4 py-3 border border-navy/8">
      <p className="text-xs text-dark/50 mb-1">{label}</p>
      <p className="text-sm font-semibold text-navy">{payload[0].value} residents</p>
    </div>
  );
};

const TooltipCategory = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg px-4 py-3 border border-navy/8">
      <p className="text-xs text-dark/50 mb-1">{label}</p>
      <p className="text-sm font-semibold text-navy">{payload[0].value} cases</p>
    </div>
  );
};

const RADIAN = Math.PI / 180;
const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ─── Skeleton placeholder ─────────────────────────────────────────────────────

function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="animate-pulse bg-dark/6 rounded-xl w-full" style={{ height }} />
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ImpactPage() {
  const [data, setData] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/public/impact')
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const s = data?.stats;

  return (
    <PublicLayout>
      {/* Hero banner */}
      <div className="bg-gradient-to-br from-navy via-navy-light to-teal-dark py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-3">Transparency & Impact</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">Our Impact Dashboard</h1>
          <p className="text-white/60 max-w-xl text-lg font-light">
            Every data point represents a life touched. Your donations make this possible — see exactly where your support goes.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
          {[
            { icon: Shield,        value: s?.currentlyInCare,           label: 'Currently in Safe Homes',    color: 'text-teal' },
            { icon: Users,         value: s?.totalServed,               label: 'Served Since Founding',       color: 'text-navy' },
            { icon: TrendingUp,    value: s ? `${s.reintegrationSuccessRate}%` : undefined, label: 'Reintegration Success',  color: 'text-gold' },
            { icon: Home,          value: s?.activeSafehouses,          label: 'Active Safe Houses',           color: 'text-teal' },
            { icon: HeartHandshake,value: s ? `₱${Math.round(s.totalDonatedPhp / 1000)}K` : undefined, label: 'Total Donated (PHP)', color: 'text-gold' },
          ].map(({ icon: Icon, value, label, color }) => (
            <div key={label} className="card flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-navy/5 flex items-center justify-center">
                <Icon size={22} className={color} strokeWidth={1.8} />
              </div>
              {loading || value === undefined
                ? <div className="h-8 w-16 bg-dark/10 rounded-lg animate-pulse" />
                : <div className={`font-display text-3xl font-bold ${color}`}>{value}</div>
              }
              <div className="text-dark/60 text-sm leading-snug">{label}</div>
            </div>
          ))}
        </div>

        {/* Row 1: Monthly residents + Donation trends */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* Residents served bar chart */}
          <div className="card">
            <div className="mb-5">
              <h3 className="font-display text-xl font-semibold text-navy">Residents Served Monthly</h3>
              <p className="text-dark/50 text-sm mt-1">Rolling 12-month view — anonymised count</p>
            </div>
            {loading
              ? <ChartSkeleton />
              : data?.monthlyServed.length === 0
              ? <p className="text-center text-dark/40 text-sm py-12">No monthly data available yet.</p>
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data!.monthlyServed} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<TooltipCount />} />
                    <Bar dataKey="served" fill={COLORS.teal} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </div>

          {/* Donation trend line chart */}
          <div className="card">
            <div className="mb-5">
              <h3 className="font-display text-xl font-semibold text-navy">Donation Trends</h3>
              <p className="text-dark/50 text-sm mt-1">Monthly contributions — Philippine Pesos</p>
            </div>
            {loading
              ? <ChartSkeleton />
              : data?.donationTrend.length === 0
              ? <p className="text-center text-dark/40 text-sm py-12">No donation data available yet.</p>
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data!.donationTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                      tickFormatter={v => `₱${(v / 1000).toFixed(0)}K`} />
                    <Tooltip content={<TooltipPeso />} />
                    <Line type="monotone" dataKey="amount" stroke={COLORS.gold} strokeWidth={2.5}
                      dot={{ fill: COLORS.gold, strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: COLORS.gold }} />
                  </LineChart>
                </ResponsiveContainer>
              )
            }
          </div>
        </div>

        {/* Row 2: Program allocation pie + Case categories bar */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* Program allocation pie */}
          <div className="card">
            <div className="mb-5">
              <h3 className="font-display text-xl font-semibold text-navy">Program Allocation</h3>
              <p className="text-dark/50 text-sm mt-1">How donations are distributed across programs</p>
            </div>
            {loading
              ? <ChartSkeleton />
              : data?.programAllocation.length === 0
              ? <p className="text-center text-dark/40 text-sm py-12">No allocation data yet.</p>
              : (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={data!.programAllocation}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={PieLabel}
                        outerRadius={95}
                        dataKey="value"
                      >
                        {data!.programAllocation.map((_, i) => (
                          <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => `${v}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-2">
                    {data!.programAllocation.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: PIE_PALETTE[i % PIE_PALETTE.length] }} />
                        <span className="text-xs font-medium text-dark/60">{item.name} ({item.value}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }
          </div>

          {/* Case category bar */}
          <div className="card">
            <div className="mb-5">
              <h3 className="font-display text-xl font-semibold text-navy">Cases by Category</h3>
              <p className="text-dark/50 text-sm mt-1">Anonymised breakdown of case types served</p>
            </div>
            {loading
              ? <ChartSkeleton />
              : data?.caseCategories.length === 0
              ? <p className="text-center text-dark/40 text-sm py-12">No category data available yet.</p>
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data!.caseCategories} layout="vertical" barSize={16}
                    margin={{ left: 10, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip content={<TooltipCategory />} />
                    <Bar dataKey="count" fill={COLORS.navy} radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </div>
        </div>

        {/* CTA + Quote */}
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-3 card bg-gradient-to-br from-teal to-teal-dark text-white">
            <Heart size={28} className="text-white/80 mb-3" strokeWidth={1.5} />
            <h3 className="font-display text-2xl font-bold mb-3">Your donations make this possible</h3>
            <p className="text-white/75 text-sm leading-relaxed mb-6">
              ₱5,000 provides one month of counseling for a survivor. ₱15,000 covers educational materials for a safe house for a term. Every peso anchors a young woman's hope.
            </p>
            <a href="#" className="inline-flex items-center gap-2 bg-white text-teal font-semibold px-5 py-2.5 rounded-lg hover:bg-gold hover:text-navy transition-all text-sm">
              Support Our Mission
              <ArrowRight size={16} />
            </a>
          </div>

          <div className="md:col-span-2 card border-l-4 border-gold flex flex-col justify-center">
            <p className="font-display text-lg italic text-navy leading-relaxed mb-3">
              "I used to think I had no future. Now I'm studying to be a teacher. SureAnchor didn't just save me — they helped me find myself."
            </p>
            <p className="text-dark/40 text-sm">— Resident, now enrolled in a 4-year Education degree</p>
          </div>
        </div>

      </div>
    </PublicLayout>
  );
}
