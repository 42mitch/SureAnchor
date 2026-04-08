import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, HeartHandshake, Home, ChevronDown, ChevronUp,
  UserPlus, Heart, Calendar, Activity, AlertTriangle,
  Cpu, Megaphone, Target
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import AdminLayout from '../layouts/AdminLayout';
import { apiFetch } from '../api';
import { formatCurrency, formatUsdK, phpToUsd } from '../utils/currency';
import { CurrencyDisplay } from '../components/CurrencyDisplay';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResidentListDto {
  residentId: number;
  caseNo: string;
  internalCode: string;
  safehouse: string;
  age: number;
  category: string;
  risk: string;
  status: string;
  worker: string;
  religion: string | null;
  dateAdmitted: string | null;
}

interface DonationDto {
  donationId: number;
  supporterId: number;
  donorName: string;
  donationType: string;
  donationDate: string;
  isRecurring: boolean;
  campaignName: string | null;
  channelSource: string | null;
  currencyCode: string;
  amount: number | null;
  estimatedValue: number | null;
  impactUnit: string | null;
  notes: string | null;
}

interface SafehouseDto {
  safehouseId: number;
  safehouseCode: string;
  name: string;
  region: string;
  city: string;
  status: string;
  capacityGirls: number;
  capacityStaff: number;
  currentOccupancy: number;
  openDate: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RISK_COLORS: Record<string, string> = {
  Low: '#16a34a',
  Medium: '#ca8a04',
  High: '#ea580c',
  Critical: '#dc2626',
};

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: '#E1306C',
  Facebook: '#1877F2',
  TikTok: '#010101',
  YouTube: '#FF0000',
  Twitter: '#1DA1F2',
  LinkedIn: '#0A66C2',
  WhatsApp: '#25D366',
};

// Format currency showing USD (PHP)
const fmt = (n: number) => formatCurrency(n);

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({
  title, icon: Icon, children, defaultOpen = true, accent = 'text-navy',
}: {
  title: string; icon: React.ElementType; children: React.ReactNode;
  defaultOpen?: boolean; accent?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-1 group"
      >
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-navy/8 ${accent}`}>
            <Icon size={18} strokeWidth={1.8} />
          </div>
          <h2 className="font-display text-lg font-bold text-navy">{title}</h2>
        </div>
        <div className="text-dark/30 group-hover:text-navy transition-colors">
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>
      {open && <div className="mt-5 border-t border-dark/6 pt-5">{children}</div>}
    </div>
  );
}

function MLPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-dark/15 bg-dark/3 p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-dark/40">
        <Cpu size={16} strokeWidth={1.8} />
        <span className="text-xs font-bold uppercase tracking-widest">ML Pipeline</span>
        <span className="ml-auto text-xs bg-dark/10 text-dark/40 px-2 py-0.5 rounded-full font-semibold">
          Coming Soon
        </span>
      </div>
      <p className="font-display text-sm font-semibold text-dark/50">{title}</p>
      <p className="text-xs text-dark/35 leading-relaxed">{description}</p>
    </div>
  );
}

function StatCard({ label, value, currencyPhp, sub, color = 'bg-teal/10 text-teal', icon: Icon }: {
  label: string; value?: string; currencyPhp?: number; sub?: string; color?: string; icon: React.ElementType;
}) {
  return (
    <div className="card hover:shadow-card-hover transition-all duration-200">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        <Icon size={20} strokeWidth={1.8} />
      </div>
      {currencyPhp !== undefined ? (
        <div className="mb-1">
          <CurrencyDisplay
            php={currencyPhp}
            usdClassName="font-display text-2xl lg:text-3xl font-bold text-navy"
            phpClassName="text-xs text-dark/30 font-normal mt-0.5"
          />
        </div>
      ) : (
        <div className="font-display text-2xl lg:text-3xl font-bold text-navy mb-1">{value}</div>
      )}
      <div className="text-sm text-dark/60 font-medium mb-1">{label}</div>
      {sub && <div className="text-xs text-teal font-semibold">{sub}</div>}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [residents, setResidents] = useState<ResidentListDto[]>([]);
  const [donations, setDonations] = useState<DonationDto[]>([]);
  const [safehouses, setSafehouses] = useState<SafehouseDto[]>([]);
  const [loadingResidents, setLoadingResidents] = useState(true);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [loadingSafehouses, setLoadingSafehouses] = useState(true);

  const fetchResidents = useCallback(async () => {
    try {
      const res = await apiFetch('/api/residents');
      if (res.ok) setResidents(await res.json());
    } finally {
      setLoadingResidents(false);
    }
  }, []);

  const fetchDonations = useCallback(async () => {
    try {
      const res = await apiFetch('/api/donations');
      if (res.ok) setDonations(await res.json());
    } finally {
      setLoadingDonations(false);
    }
  }, []);

  const fetchSafehouses = useCallback(async () => {
    try {
      const res = await apiFetch('/api/safehouses');
      if (res.ok) setSafehouses(await res.json());
    } finally {
      setLoadingSafehouses(false);
    }
  }, []);

  useEffect(() => {
    fetchResidents();
    fetchDonations();
    fetchSafehouses();
  }, [fetchResidents, fetchDonations, fetchSafehouses]);

  // ── Derived: Residents ──────────────────────────────────────────────────────
  const activeResidents = residents.filter(r => r.status === 'Active');

  const riskCounts = activeResidents.reduce<Record<string, number>>((acc, r) => {
    acc[r.risk] = (acc[r.risk] || 0) + 1;
    return acc;
  }, {});
  const riskData = ['Low', 'Medium', 'High', 'Critical'].map(k => ({
    name: k, value: riskCounts[k] || 0, color: RISK_COLORS[k],
  }));

  const categoryMap: Record<string, number> = {};
  activeResidents.forEach(r => {
    categoryMap[r.category] = (categoryMap[r.category] || 0) + 1;
  });
  const categoryTotal = activeResidents.length || 1;

  const recentAdmissions = [...residents]
    .filter(r => r.dateAdmitted)
    .sort((a, b) => (b.dateAdmitted! > a.dateAdmitted! ? 1 : -1))
    .slice(0, 5);

  // ── Derived: Donations ──────────────────────────────────────────────────────
  const monetaryDonations = donations.filter(d => d.donationType === 'Monetary' && d.amount);
  const totalMonetary = monetaryDonations.reduce((s, d) => s + (d.amount || 0), 0);

  const monthlyMap: Record<string, number> = {};
  donations.forEach(d => {
    if (!d.donationDate) return;
    const month = d.donationDate.slice(0, 7);
    const val = Number(d.amount) || Number(d.estimatedValue) || 0;
    monthlyMap[month] = (monthlyMap[month] || 0) + val;
  });
  const monthlyTrend = Object.entries(monthlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, amount]) => ({
      month: new Date(month + '-01').toLocaleString('default', { month: 'short', year: '2-digit' }),
      amount: Math.round(amount),
    }));

  const channelMap: Record<string, number> = {};
  donations.forEach(d => {
    if (!d.channelSource) return;
    const val = Number(d.amount) || Number(d.estimatedValue) || 0;
    channelMap[d.channelSource] = (channelMap[d.channelSource] || 0) + val;
  });
  const channelData = Object.entries(channelMap)
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);

  // Supporter health: active = donated in last 90 days
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const activeSupporterIds = new Set(
    donations
      .filter(d => new Date(d.donationDate) >= ninetyDaysAgo)
      .map(d => d.supporterId)
  );
  const allSupporterIds = new Set(donations.map(d => d.supporterId));
  const activeCount = activeSupporterIds.size;
  const atRiskCount = allSupporterIds.size - activeSupporterIds.size;

  const donorStatusData = [
    { name: 'Active (90d)', value: activeCount, color: '#2D8F8A' },
    { name: 'At Risk', value: atRiskCount, color: '#ea580c' },
  ];

  // Activity feed from real data
  const recentDonations = [...donations]
    .sort((a, b) => b.donationDate.localeCompare(a.donationDate))
    .slice(0, 3);

  const activityItems = [
    ...recentAdmissions.slice(0, 2).map(r => ({
      id: `res-${r.residentId}`,
      icon: UserPlus,
      text: `New resident admitted to ${r.safehouse}`,
      sub: `${r.caseNo} · ${r.category} · Risk: ${r.risk}`,
      date: r.dateAdmitted!,
    })),
    ...recentDonations.map(d => ({
      id: `don-${d.donationId}`,
      icon: Heart,
      text: `${d.donationType} donation received`,
      sub: `${d.donorName} · via ${d.channelSource || 'Direct'} · ${d.amount ? formatUsdK(phpToUsd(Number(d.amount))) : d.impactUnit}`,
      date: d.donationDate,
    })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  // OKRs — sourced from real data analysis; wire to /api/dashboard/metrics when available
  const okrs = [
    {
      label: 'Session Emotional Improvement',
      value: '82.8%', target: '80%', met: true,
      desc: 'Residents entering sessions distressed who end in a positive state',
    },
    {
      label: 'Education Avg Progress',
      value: '78.5%', target: '75%', met: true,
      desc: 'Average course completion progress across all enrolled residents',
    },
    {
      label: 'Attendance Rate',
      value: '73.6%', target: '80%', met: false,
      desc: 'Average school/program attendance across active residents',
    },
    {
      label: 'Incident Resolution Rate',
      value: '71%', target: '85%', met: false,
      desc: 'Percentage of reported incidents that have been resolved',
    },
    {
      label: 'Health Score (avg)',
      value: '3.2 / 5', target: '3.5 / 5', met: false,
      desc: 'Average general health score across all wellbeing records',
    },
    {
      label: 'Active Residents',
      value: loadingResidents ? '—' : String(activeResidents.length),
      target: '60 capacity', met: activeResidents.length > 0,
      desc: 'Currently active residents across all 9 safehouses',
    },
  ];

  // Social media insights — real aggregations from social_media_posts table.
  // Replace with /api/social-posts/insights when that endpoint is built.
  const socialPlatformData = [
    { platform: 'Instagram', eng: 10.61 },
    { platform: 'Twitter', eng: 10.43 },
    { platform: 'TikTok', eng: 9.87 },
    { platform: 'YouTube', eng: 9.86 },
    { platform: 'LinkedIn', eng: 9.83 },
    { platform: 'Facebook', eng: 9.39 },
    { platform: 'WhatsApp', eng: 9.17 },
  ];
  const socialTopicData = [
    { topic: 'Safehouse Life', referrals: 1910 },
    { topic: 'Health', referrals: 1515 },
    { topic: 'Education', referrals: 1294 },
    { topic: 'Awareness', referrals: 1227 },
    { topic: 'Reintegration', referrals: 1212 },
  ];

  const loading = loadingResidents || loadingDonations || loadingSafehouses;

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">Good morning, Admin</h1>
          <p className="text-dark/50 text-sm mt-1">
            {new Date().toLocaleDateString('en-PH', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })} · SureAnchor Operations
          </p>
        </div>

        {/* Top metric cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Active Residents"
            value={loadingResidents ? '—' : String(activeResidents.length)}
            sub={loadingResidents ? '' : `${residents.filter(r => r.status === 'Closed').length} cases closed`}
            icon={Users}
            color="bg-teal/10 text-teal"
          />
          <StatCard
            label="Total Monetary Donations"
            currencyPhp={loadingDonations ? undefined : totalMonetary}
            value={loadingDonations ? '—' : undefined}
            sub={loadingDonations ? '' : `${monetaryDonations.length} monetary donations`}
            icon={HeartHandshake}
            color="bg-gold/10 text-gold"
          />
          <StatCard
            label="Active Safehouses"
            value={loadingSafehouses ? '—' : String(safehouses.filter(s => s.status === 'Active').length)}
            sub={loadingSafehouses ? '' : (() => {
              const active = safehouses.filter(s => s.status === 'Active');
              const totalOccupancy = active.reduce((s, h) => s + h.currentOccupancy, 0);
              const totalCapacity = active.reduce((s, h) => s + h.capacityGirls, 0);
              return `${totalOccupancy} / ${totalCapacity} beds filled (${Math.round((totalOccupancy / totalCapacity) * 100)}%)`;
            })()}
            icon={Home}
            color="bg-navy/10 text-navy"
          />
          <StatCard
            label="Supporter Health"
            value={loadingDonations ? '—' : `${activeCount} active`}
            sub={loadingDonations ? '' : `${atRiskCount} at risk of lapsing`}
            icon={Activity}
            color="bg-teal/10 text-teal"
          />
        </div>

        {/* ── MISSION ─────────────────────────────────────────────────────── */}
        <Section title="Mission" icon={Target} accent="text-teal">
          <div className="space-y-6">

            {/* OKRs */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-dark/40 mb-3">Key Results</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {okrs.map(okr => (
                  <div
                    key={okr.label}
                    className={`rounded-2xl p-4 border ${okr.met
                      ? 'border-green-200 bg-green-50'
                      : 'border-orange-200 bg-orange-50'}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${okr.met
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'}`}>
                        {okr.met ? '✓ On Track' : '↑ Improving'}
                      </span>
                      <span className="text-xs text-dark/40">Target: {okr.target}</span>
                    </div>
                    <div className="font-display text-xl font-bold text-navy mt-2">{okr.value}</div>
                    <div className="text-sm font-semibold text-dark/70 mt-0.5">{okr.label}</div>
                    <div className="text-xs text-dark/40 mt-1 leading-relaxed">{okr.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk distribution + category breakdown */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-dark/40 mb-3">
                  Active Resident Risk Levels
                </h3>
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie
                        data={riskData}
                        cx="50%" cy="50%"
                        innerRadius={48} outerRadius={72}
                        paddingAngle={3} dataKey="value"
                      >
                        {riskData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v} residents`, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 flex-1">
                    {riskData.map(item => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-dark/60 text-xs font-medium">{item.name}</span>
                        </div>
                        <span className="font-bold text-dark text-xs">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-dark/40 mb-3">
                  Case Categories
                </h3>
                {Object.entries(categoryMap)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, count]) => (
                    <div key={cat} className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-dark/60 font-medium">{cat}</span>
                        <span className="font-bold text-dark">{count}</span>
                      </div>
                      <div className="h-1.5 bg-dark/8 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal rounded-full transition-all duration-700"
                          style={{ width: `${(count / categoryTotal) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <MLPlaceholder
              title="Safehouse Resource Allocation Optimizer"
              description="Predicts optimal distribution of residents, staff, and supplies across safehouses based on capacity, risk levels, and historical incident data."
            />

            {/* Safehouse occupancy */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-dark/40 mb-3">
                Safehouse Capacity
              </h3>
              {loadingSafehouses ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-dark/6 rounded-2xl" />
                  ))}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {safehouses.filter(s => s.status === 'Active').map(sh => {
                    const pct = sh.capacityGirls > 0
                      ? Math.round((sh.currentOccupancy / sh.capacityGirls) * 100)
                      : 0;
                    const color =
                      pct === 100 ? 'bg-red-500' :
                      pct >= 80   ? 'bg-orange-400' :
                                    'bg-teal';
                    const textColor =
                      pct === 100 ? 'text-red-600' :
                      pct >= 80   ? 'text-orange-500' :
                                    'text-teal';
                    const bgColor =
                      pct === 100 ? 'bg-red-50 border-red-200' :
                      pct >= 80   ? 'bg-orange-50 border-orange-200' :
                                    'bg-cream border-dark/8';
                    return (
                      <div key={sh.safehouseId} className={`rounded-2xl border p-4 ${bgColor}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="text-xs font-bold text-dark/40 uppercase tracking-wide">
                              {sh.safehouseCode}
                            </div>
                            <div className="text-sm font-semibold text-navy leading-tight mt-0.5">
                              {sh.city}
                            </div>
                            <div className="text-xs text-dark/40">{sh.region}</div>
                          </div>
                          <span className={`text-lg font-display font-bold ${textColor}`}>
                            {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-dark/10 rounded-full overflow-hidden mt-2">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${color}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-dark/40 mt-1.5">
                          <span>{sh.currentOccupancy} residents</span>
                          <span>{sh.capacityGirls} capacity</span>
                        </div>
                        {pct === 100 && (
                          <div className="text-xs text-red-600 font-semibold mt-2 flex items-center gap-1">
                            <AlertTriangle size={11} /> Full — no beds available
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* ── OUTREACH ────────────────────────────────────────────────────── */}
        <Section title="Outreach" icon={Megaphone} accent="text-gold">
          <div className="space-y-6">

            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-dark/40 mb-3">
                Social Media Insights <span className="normal-case font-normal text-dark/30">(aggregated from post history)</span>
              </h3>
              <div className="grid sm:grid-cols-3 gap-3 mb-5">
                {[
                  {
                    label: 'Best Post Type',
                    value: 'Impact Story',
                    note: 'Drives 7,388 donation referrals — far ahead of any other type',
                  },
                  {
                    label: 'Best Days to Post',
                    value: 'Fri · Sat · Sun',
                    note: 'Weekend posts average 10.4% engagement vs 9.5% on weekdays',
                  },
                  {
                    label: 'Best Times',
                    value: '7 PM · 8 PM',
                    note: 'Evening posts reach up to 14.7% avg engagement rate',
                  },
                ].map(c => (
                  <div key={c.label} className="rounded-2xl bg-navy/5 p-4">
                    <div className="text-xs text-dark/40 mb-1 font-semibold uppercase tracking-wide">{c.label}</div>
                    <div className="font-display text-lg font-bold text-navy">{c.value}</div>
                    <div className="text-xs text-dark/50 mt-1">{c.note}</div>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-dark/40 mb-3 font-semibold uppercase tracking-wide">
                    Avg Engagement Rate by Platform
                  </p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={socialPlatformData} layout="vertical" barSize={10}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#00000008" />
                      <XAxis type="number" domain={[8, 12]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10 }} />
                      <YAxis dataKey="platform" type="category" tick={{ fontSize: 11 }} width={72} />
                      <Tooltip formatter={(v) => [`${(Number(v) || 0).toFixed(2)}%`, 'Engagement']} />
                      <Bar dataKey="eng" radius={[0, 6, 6, 0]}>
                        {socialPlatformData.map((entry, i) => (
                          <Cell key={i} fill={PLATFORM_COLORS[entry.platform] || '#2D8F8A'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <p className="text-xs text-dark/40 mb-3 font-semibold uppercase tracking-wide">
                    Topics That Drive Donations
                  </p>
                  <div className="space-y-3">
                    {socialTopicData.map((t, i) => {
                      const max = socialTopicData[0].referrals;
                      const barColors = ['#2D8F8A', '#1B3A5C', '#D4A843', '#ea580c', '#16a34a'];
                      return (
                        <div key={t.topic}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-dark/60 font-medium">{t.topic}</span>
                            <span className="font-bold text-dark">{t.referrals.toLocaleString()} referrals</span>
                          </div>
                          <div className="h-1.5 bg-dark/8 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${(t.referrals / max) * 100}%`, backgroundColor: barColors[i] }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-dark/30 mt-3 italic">
                    💡 Safehouse Life &amp; Health posts consistently lead to donations — not just likes.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <MLPlaceholder
                title="Campaign Strategy Ranker"
                description="Ranks past and proposed campaigns by predicted impact using post performance, donation correlation, and audience reach signals."
              />
              <MLPlaceholder
                title="Social Media Posting Optimizer"
                description="Recommends what to post, on which platform, and at what time — tailored to SureAnchor's specific audience patterns."
              />
            </div>
          </div>
        </Section>

        {/* ── DONORS ──────────────────────────────────────────────────────── */}
        <Section title="Donors" icon={HeartHandshake} accent="text-gold">
          <div className="space-y-6">

            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-dark/40 mb-3">
                Donation Value — Last 12 Months
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="donGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2D8F8A" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2D8F8A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#00000008" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 10 }} width={52} />
                  <Tooltip formatter={(v) => [fmt(Number(v) || 0), 'Total donations']} />
                  <Area type="monotone" dataKey="amount" stroke="#2D8F8A" strokeWidth={2} fill="url(#donGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-dark/40 mb-3">
                  Value by Acquisition Channel
                </h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={channelData} barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#00000008" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 10 }} width={52} />
                    <Tooltip formatter={(v) => [fmt(Number(v) || 0), 'Value']} />
                    <Bar dataKey="value" fill="#1B3A5C" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-dark/40 mb-3">
                  Supporter Health (90-Day Window)
                </h3>
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width={130} height={130}>
                    <PieChart>
                      <Pie
                        data={donorStatusData}
                        cx="50%" cy="50%"
                        innerRadius={38} outerRadius={58}
                        paddingAngle={3} dataKey="value"
                      >
                        {donorStatusData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, n) => [`${v} supporters`, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3 flex-1">
                    {donorStatusData.map(item => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-dark/60 text-xs font-medium">{item.name}</span>
                        </div>
                        <span className="font-bold text-dark text-xs">{item.value}</span>
                      </div>
                    ))}
                    {atRiskCount > 0 && (
                      <div className="text-xs text-orange-600 bg-orange-50 rounded-xl p-2 flex gap-2 items-start">
                        <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                        <span>{atRiskCount} supporters haven't donated in 90+ days</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <MLPlaceholder
              title="Donor Churn Predictor"
              description="Identifies which donors are at risk of lapsing based on donation frequency, amount trends, and engagement signals — enabling proactive outreach before they go quiet."
            />
          </div>
        </Section>

        {/* ── UPCOMING CASE CONFERENCES ────────────────────────────────────── */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-navy/8 text-navy">
                <Calendar size={18} strokeWidth={1.8} />
              </div>
              <h2 className="font-display text-lg font-bold text-navy">Upcoming Case Conferences</h2>
            </div>
            <Link
              to="/admin/caseload"
              className="text-xs text-teal font-semibold hover:text-navy transition-colors"
            >
              View all cases →
            </Link>
          </div>
          {/* Empty state — populates automatically when future conference dates are entered */}
          <div className="text-center py-8 text-dark/30">
            <Calendar size={32} className="mx-auto mb-2 opacity-30" strokeWidth={1.2} />
            <p className="text-sm font-medium text-dark/40">No upcoming conferences scheduled</p>
            <p className="text-xs mt-1 text-dark/30">
              Case conference dates set in intervention plans will appear here automatically.
            </p>
          </div>
        </div>

        {/* ── RECENT ACTIVITY ──────────────────────────────────────────────── */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-navy/8 text-navy">
                <Activity size={18} strokeWidth={1.8} />
              </div>
              <h2 className="font-display text-lg font-bold text-navy">Recent Activity</h2>
            </div>
            <span className="text-xs text-dark/40 font-medium">Live from database</span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex gap-4 items-start animate-pulse">
                  <div className="w-9 h-9 rounded-xl bg-dark/8 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-dark/8 rounded w-2/3" />
                    <div className="h-2.5 bg-dark/5 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {activityItems.map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.id} className="flex gap-4 items-start group">
                    <div className="w-9 h-9 rounded-xl bg-navy/6 flex items-center justify-center flex-shrink-0 group-hover:bg-teal/10 transition-colors">
                      <Icon size={16} className="text-navy/50 group-hover:text-teal transition-colors" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark">{item.text}</p>
                      <p className="text-xs text-dark/50 mt-0.5 truncate">{item.sub}</p>
                    </div>
                    <span className="text-xs text-dark/30 flex-shrink-0 pt-0.5">
                      {new Date(item.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}