import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, HeartHandshake, Home, ChevronDown, ChevronUp,
  UserPlus, Heart, Calendar, Activity, AlertTriangle,
  Cpu, Megaphone, Target, Brain, TrendingDown,
  Trophy, BarChart2, Play, RefreshCw, CheckCircle
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import AdminLayout from '../layouts/AdminLayout';
import { apiFetch } from '../api';
import { formatCurrency, formatUsdK, phpToUsd, formatSafehouseName } from '../utils/currency';
import { CurrencyDisplay } from '../components/CurrencyDisplay';
import { useAuth } from '../context/AuthContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChurnPrediction {
  supporter_id: number;
  display_name: string;
  email?: string;
  churn_probability: number;
  risk_tier: 'Critical' | 'High' | 'Medium' | 'Low';
  recommended_action: string;
}
interface ChurnResult { available: boolean; predictions?: ChurnPrediction[]; reason?: string; }

interface CampaignScore {
  campaign_name: string;
  month_label: string;
  high_performance_probability: number;
  /** Model output + deterministic scenario jitter; preferred for dashboard display */
  simulated_month_success_probability?: number;
  is_high_performing: boolean;
  total_value_php: number;
  total_donations: number;
  rank: number;
}

function campaignMonthSuccessProb(c: CampaignScore): number {
  return c.simulated_month_success_probability ?? c.high_performance_probability;
}
interface CampaignResult { available: boolean; scorecard?: CampaignScore[]; reason?: string; }

interface SafehouseImpactItem {
  safehouseId: number;
  safehouseName: string;
  city: string;
  activeResidents: number;
  totalFunding: number;
  currentEducationProgress: number;
  predictedEducationProgress: number;
  delta: number;
  trend: string;
  pctEducation: number;
  pctWellbeing: number;
  pctOperations: number;
  pctTransport: number;
  pctMaintenance: number;
  pctOutreach: number;
}
interface SafehouseResult {
  available: boolean;
  mlAvailable?: boolean;
  safehouses?: SafehouseImpactItem[];
  reason?: string;
}
interface SafehouseSimResult {
  available: boolean;
  projectedEducationProgress?: number;
  currentEducationProgress?: number;
  delta?: number;
  confidence?: string;
  recommendation?: string;
  reason?: string;
}

type AllocKey = 'education' | 'wellbeing' | 'operations' | 'transport' | 'maintenance' | 'outreach';
type AllocState = Record<AllocKey, number>;

interface SocialPlatformStat {
  platform: string;
  postCount: number;
  avgEngagementRate: number;
  totalReach: number;
  totalDonationReferrals: number;
  estimatedDonationValuePhp: number;
}
interface SocialContentStat {
  postType: string;
  postCount: number;
  avgEngagementRate: number;
  totalDonationReferrals: number;
}
interface SocialOverview {
  available: boolean;
  reason?: string;
  byPlatform?: SocialPlatformStat[];
  byContentType?: SocialContentStat[];
}

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

// ─── Safehouse simulator constants ────────────────────────────────────────────

const ALLOC_LABELS: Record<AllocKey, string> = {
  education:   'Education',
  wellbeing:   'Wellbeing & Health',
  operations:  'Operations & Shelter',
  transport:   'Transport',
  maintenance: 'Maintenance',
  outreach:    'Outreach',
};

const ALLOC_COLORS: Record<AllocKey, string> = {
  education:   '#0d9488',
  wellbeing:   '#6366f1',
  operations:  '#f59e0b',
  transport:   '#10b981',
  maintenance: '#8b5cf6',
  outreach:    '#ec4899',
};

const SIM_TEMPLATES = [
  {
    id: 'balanced',
    label: 'Balanced',
    alloc: { education: 30, wellbeing: 30, operations: 25, transport: 5, maintenance: 5, outreach: 5 } as AllocState,
  },
  {
    id: 'education',
    label: 'Education Focus',
    alloc: { education: 50, wellbeing: 20, operations: 18, transport: 4, maintenance: 4, outreach: 4 } as AllocState,
  },
  {
    id: 'wellbeing',
    label: 'Wellbeing Focus',
    alloc: { education: 22, wellbeing: 48, operations: 18, transport: 4, maintenance: 4, outreach: 4 } as AllocState,
  },
];

const DEFAULT_ALLOC: AllocState = { education: 35, wellbeing: 28, operations: 22, transport: 5, maintenance: 5, outreach: 5 };

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
    const drift = Math.round((100 - (Object.values(next) as number[]).reduce((s, v) => s + v, 0)) * 10) / 10;
    if (drift !== 0) {
      const largest = [...others].sort((a, b) => next[b] - next[a])[0];
      next[largest] = Math.round((next[largest] + drift) * 10) / 10;
    }
  }
  return next;
}

function allocSum(a: AllocState): number {
  return Math.round((Object.values(a) as number[]).reduce((s, v) => s + v, 0) * 10) / 10;
}


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
  const [churnResult, setChurnResult] = useState<ChurnResult | null>(null);
  const [campaignResult, setCampaignResult] = useState<CampaignResult | null>(null);
  const [safehouseResult, setSafehouseResult] = useState<SafehouseResult | null>(null);
  const [socialOverview, setSocialOverview] = useState<SocialOverview | null>(null);
  const [safehouses, setSafehouses] = useState<SafehouseDto[]>([]);
  const [loadingResidents, setLoadingResidents] = useState(true);
  const [loadingDonations, setLoadingDonations] = useState(true);
  const [loadingSafehouses, setLoadingSafehouses] = useState(true);

  // Allocation simulator state
  const [simSelectedId, setSimSelectedId]         = useState<number | ''>('');
  const [simBudget, setSimBudget]                 = useState(500000);
  const [simAlloc, setSimAlloc]                   = useState<AllocState>(DEFAULT_ALLOC);
  const [simResult, setSimResult]                 = useState<SafehouseSimResult | null>(null);
  const [simLoading, setSimLoading]               = useState(false);
  const [simActiveTemplate, setSimActiveTemplate] = useState<string | null>(null);

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

  // ML predictions — fire once on mount, graceful on failure
  useEffect(() => {
    apiFetch('/api/ml/donor-churn')
      .then(r => r.ok ? r.json() : { available: false, reason: 'Request failed' })
      .then(setChurnResult)
      .catch(() => setChurnResult({ available: false, reason: 'ML service unavailable' }));

    apiFetch('/api/ml/campaign-effectiveness')
      .then(r => r.ok ? r.json() : { available: false, reason: 'Request failed' })
      .then(setCampaignResult)
      .catch(() => setCampaignResult({ available: false, reason: 'ML service unavailable' }));

    apiFetch('/api/ml/safehouse-funding-impact')
      .then(r => r.ok ? r.json() : { available: false, reason: 'Request failed' })
      .then((data: SafehouseResult) => {
        setSafehouseResult(data);
        // Pre-select the first safehouse in the simulator
        if (data.safehouses && data.safehouses.length > 0) {
          const sh = data.safehouses[0];
          setSimSelectedId(sh.safehouseId);
          setSimBudget(sh.totalFunding || 500000);
          setSimAlloc({
            education:   sh.pctEducation,
            wellbeing:   sh.pctWellbeing,
            operations:  sh.pctOperations,
            transport:   sh.pctTransport,
            maintenance: sh.pctMaintenance,
            outreach:    sh.pctOutreach,
          });
        }
      })
      .catch(() => setSafehouseResult({ available: false, reason: 'ML service unavailable' }));

    apiFetch('/api/social-analytics')
      .then(r => r.ok ? r.json() : { available: false, reason: 'Request failed' })
      .then(setSocialOverview)
      .catch(() => setSocialOverview({ available: false, reason: 'Could not load social data' }));
  }, []);

  // ── Simulator helpers ───────────────────────────────────────────────────────

  function onSelectSimSafehouse(id: number) {
    setSimSelectedId(id);
    setSimResult(null);
    setSimActiveTemplate(null);
    const sh = safehouseResult?.safehouses?.find(s => s.safehouseId === id);
    if (sh) {
      setSimBudget(sh.totalFunding || 500000);
      setSimAlloc({
        education:   sh.pctEducation,
        wellbeing:   sh.pctWellbeing,
        operations:  sh.pctOperations,
        transport:   sh.pctTransport,
        maintenance: sh.pctMaintenance,
        outreach:    sh.pctOutreach,
      });
    }
  }

  function applySimTemplate(t: typeof SIM_TEMPLATES[0]) {
    setSimAlloc(t.alloc);
    setSimActiveTemplate(t.id);
    setSimResult(null);
  }

  const runSimulation = useCallback(async () => {
    if (!simSelectedId) return;
    if (Math.abs(allocSum(simAlloc) - 100) > 0.5) return;
    setSimLoading(true);
    setSimResult(null);
    try {
      const res = await apiFetch('/api/ml/safehouse-simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          safehouseId:    simSelectedId,
          totalBudget:    simBudget,
          pctEducation:   simAlloc.education,
          pctWellbeing:   simAlloc.wellbeing,
          pctOperations:  simAlloc.operations,
          pctTransport:   simAlloc.transport,
          pctMaintenance: simAlloc.maintenance,
          pctOutreach:    simAlloc.outreach,
        }),
      });
      setSimResult(res.ok ? await res.json() : { available: false, reason: 'Request failed' });
    } catch {
      setSimResult({ available: false, reason: 'ML service unavailable' });
    } finally {
      setSimLoading(false);
    }
  }, [simSelectedId, simBudget, simAlloc]);

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
      text: `New resident admitted to ${formatSafehouseName(r.safehouse)}`,
      sub: `${r.caseNo} · ${r.category} · Risk: ${r.risk}`,
      date: r.dateAdmitted!,
      linkTo: `/admin/resident/${r.residentId}`,
    })),
    ...recentDonations.map(d => ({
      id: `don-${d.donationId}`,
      icon: Heart,
      text: `${d.donationType} donation received`,
      sub: `${d.donorName} · via ${d.channelSource || 'Direct'} · ${d.amount ? formatUsdK(phpToUsd(Number(d.amount))) : d.impactUnit}`,
      date: d.donationDate,
      linkTo: `/admin/donors?supporterId=${d.supporterId}`,
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

  // Social overview — derived from live socialOverview state
  const socialPlatformChart = (socialOverview?.byPlatform ?? [])
    .slice(0, 6)
    .map(p => ({ platform: p.platform, referrals: p.totalDonationReferrals, eng: p.avgEngagementRate }));

  const socialContentChart = (socialOverview?.byContentType ?? [])
    .slice(0, 5)
    .map(c => ({
      topic: c.postType.replace(/([A-Z])/g, ' $1').trim(),
      referrals: c.totalDonationReferrals,
    }));

  const socialTotals = (socialOverview?.byPlatform ?? []).reduce(
    (acc, p) => ({
      posts: acc.posts + p.postCount,
      reach: acc.reach + p.totalReach,
      referrals: acc.referrals + p.totalDonationReferrals,
      value: acc.value + p.estimatedDonationValuePhp,
    }),
    { posts: 0, reach: 0, referrals: 0, value: 0 },
  );

  const loading = loadingResidents || loadingDonations || loadingSafehouses;

  const { user } = useAuth();

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div>
        <h1 className="font-display text-2xl font-bold text-navy">
          Good morning, {user?.displayName?.split(' ')[0] ?? 'Admin'}
        </h1>
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
            sub={loadingDonations ? '' : (() => {
              if (churnResult?.available) {
                const preds = churnResult.predictions ?? [];
                const atRisk = preds.filter(p => p.risk_tier === 'Critical' || p.risk_tier === 'High').length;
                return `${atRisk} critical/high risk (ML)`;
              }
              return `${atRiskCount} at risk of lapsing`;
            })()}
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

            {/* ML: Funding Impact & Allocation Simulator */}
            {safehouseResult === null ? (
              <div className="rounded-2xl border-2 border-dashed border-dark/15 bg-dark/3 p-5 flex items-center gap-3 animate-pulse">
                <Brain size={16} className="text-dark/30" />
                <span className="text-xs text-dark/35 font-medium">Loading safehouse predictions…</span>
              </div>
            ) : !safehouseResult.available ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
                <Brain size={15} className="text-amber-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-amber-700">ML · Funding Impact — Unavailable</p>
                  <p className="text-xs text-amber-600 mt-0.5 truncate">{safehouseResult.reason ?? 'ML service not connected.'}</p>
                </div>
              </div>
            ) : (() => {
              const shList = safehouseResult.safehouses ?? [];
              const simSumOk = Math.abs(allocSum(simAlloc) - 100) <= 0.5;
              return (
                <div className="rounded-2xl border border-navy/12 bg-navy/3 p-5 space-y-5">

                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <Brain size={14} className="text-navy" />
                    <span className="text-xs font-bold uppercase tracking-widest text-dark/40">ML · Funding Impact &amp; Simulator</span>
                  </div>

                  {/* Template presets */}
                  <div>
                    <p className="text-xs font-semibold text-dark/40 uppercase tracking-wide mb-2">Quick Templates</p>
                    <div className="flex gap-2">
                      {SIM_TEMPLATES.map(t => (
                        <button
                          key={t.id}
                          onClick={() => applySimTemplate(t)}
                          className={`flex-1 text-xs py-1.5 px-2 rounded-lg border font-medium transition-all ${
                            simActiveTemplate === t.id
                              ? 'bg-teal/10 border-teal/30 text-teal'
                              : 'border-dark/12 text-dark/55 hover:border-teal/25 hover:text-navy bg-white/60'
                          }`}
                        >
                          {simActiveTemplate === t.id && <CheckCircle size={10} className="inline mr-1" />}
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Simulator */}
                  <div>
                    <p className="text-xs font-semibold text-dark/40 uppercase tracking-wide mb-3">Allocation Simulator</p>
                    <div className="grid sm:grid-cols-2 gap-4">

                      {/* Left: controls */}
                      <div className="space-y-3">
                        <select
                          aria-label="Select safehouse"
                          value={simSelectedId}
                          onChange={e => onSelectSimSafehouse(Number(e.target.value))}
                          className="w-full rounded-xl border border-dark/15 bg-white px-3 py-2 text-xs text-dark focus:outline-none focus:ring-2 focus:ring-teal/30"
                        >
                          <option value="">— Select safehouse —</option>
                          {shList.map(sh => (
                            <option key={sh.safehouseId} value={sh.safehouseId}>
                              {formatSafehouseName(sh.safehouseName)}
                            </option>
                          ))}
                        </select>

                        <div className="flex items-center gap-2">
                          <span className="text-xs text-dark/45 whitespace-nowrap">Budget ₱</span>
                          <input
                            aria-label="Budget in Philippine Pesos"
                            type="number" min={0} step={10000} value={simBudget}
                            onChange={e => setSimBudget(Number(e.target.value))}
                            className="w-full rounded-xl border border-dark/15 bg-white px-3 py-2 text-xs text-dark focus:outline-none focus:ring-2 focus:ring-teal/30"
                          />
                        </div>

                        <div className="space-y-2">
                          {(Object.keys(ALLOC_LABELS) as AllocKey[]).map(key => (
                            <div key={key}>
                              <div className="flex justify-between mb-0.5">
                                <span className="text-xs text-dark/50">{ALLOC_LABELS[key]}</span>
                                <span className="text-xs font-bold tabular-nums" style={{ color: ALLOC_COLORS[key] }}>
                                  {simAlloc[key].toFixed(0)}%
                                </span>
                              </div>
                              <input
                                aria-label={`${ALLOC_LABELS[key]} allocation percentage`}
                                type="range" min={0} max={100} step={1} value={simAlloc[key]}
                                onChange={e => {
                                  setSimAlloc(adjustAlloc(simAlloc, key, Number(e.target.value)));
                                  setSimActiveTemplate(null);
                                  setSimResult(null);
                                }}
                                style={{ accentColor: ALLOC_COLORS[key] }}
                                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                              />
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${simSumOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {allocSum(simAlloc).toFixed(0)}% {simSumOk ? '✓' : '⚠'}
                          </span>
                          <button
                            onClick={runSimulation}
                            disabled={!simSelectedId || !simSumOk || simLoading}
                            className="flex-1 btn-primary flex items-center justify-center gap-1.5 text-xs py-2 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {simLoading
                              ? <><RefreshCw size={12} className="animate-spin" /> Running…</>
                              : <><Play size={12} /> Run Simulation</>}
                          </button>
                        </div>
                      </div>

                      {/* Right: result */}
                      <div>
                        {simResult === null && !simLoading && (
                          <div className="h-full flex flex-col items-center justify-center text-center gap-2 py-6">
                            <Brain size={24} className="text-dark/15" />
                            <p className="text-xs text-dark/35">Adjust sliders and run to see projected outcomes</p>
                          </div>
                        )}
                        {simLoading && (
                          <div className="h-full flex flex-col items-center justify-center gap-2 py-6 animate-pulse">
                            <Brain size={24} className="text-teal/40" />
                            <p className="text-xs text-dark/35">Running model…</p>
                          </div>
                        )}
                        {simResult && !simLoading && (
                          !simResult.available ? (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                              <p className="text-xs font-semibold text-amber-700">Unavailable</p>
                              <p className="text-xs text-amber-600 mt-1">{simResult.reason}</p>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-teal/20 bg-white p-4 space-y-3 h-full">
                              <div>
                                <p className="text-xs text-dark/40 font-semibold uppercase tracking-wide mb-1">Projected Progress</p>
                                <div className="flex items-end gap-2">
                                  <span className="font-display text-3xl font-bold text-teal tabular-nums">
                                    {simResult.projectedEducationProgress?.toFixed(1)}<span className="text-lg">%</span>
                                  </span>
                                  <span className={`text-sm font-bold pb-0.5 ${(simResult.delta ?? 0) >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                    {(simResult.delta ?? 0) >= 0 ? '+' : ''}{simResult.delta?.toFixed(1)}%
                                  </span>
                                </div>
                                <p className="text-xs text-dark/35 mt-0.5">vs current {simResult.currentEducationProgress?.toFixed(1)}%</p>
                              </div>
                              <div className="h-2 bg-dark/8 rounded-full overflow-hidden relative">
                                <div className="absolute h-full bg-dark/15 rounded-full"
                                  style={{ width: `${simResult.currentEducationProgress ?? 0}%` }} />
                                <div className={`absolute h-full rounded-full transition-all duration-700 ${(simResult.delta ?? 0) >= 0 ? 'bg-teal' : 'bg-red-400'}`}
                                  style={{ width: `${simResult.projectedEducationProgress ?? 0}%` }} />
                              </div>
                              {simResult.confidence && (
                                <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-semibold ${
                                  simResult.confidence === 'High'   ? 'bg-green-100 text-green-700' :
                                  simResult.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                                      'bg-red-100 text-red-700'
                                }`}>
                                  {simResult.confidence} Confidence
                                </span>
                              )}
                              <p className="text-xs text-dark/60 leading-relaxed">{simResult.recommendation}</p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              );
            })()}

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

            {/* Social Media Overview */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-dark/40">
                  Social Media Overview
                </h3>
                <Link
                  to="/admin/social-media"
                  className="text-xs text-teal font-semibold hover:underline flex items-center gap-1"
                >
                  Full strategy &amp; guidance →
                </Link>
              </div>

              {/* Aggregate stat tiles */}
              {socialOverview === null ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 animate-pulse">
                  {[1,2,3,4].map(i => <div key={i} className="h-16 bg-dark/8 rounded-2xl" />)}
                </div>
              ) : !socialOverview.available ? (
                <p className="text-xs text-dark/40 mb-5">{socialOverview.reason}</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  {[
                    { label: 'Total Posts', value: socialTotals.posts.toLocaleString() },
                    { label: 'Total Reach', value: socialTotals.reach >= 1000
                        ? `${(socialTotals.reach / 1000).toFixed(1)}K`
                        : socialTotals.reach.toLocaleString() },
                    { label: 'Donation Referrals', value: socialTotals.referrals.toLocaleString() },
                    { label: 'Est. Value from Social', value: socialTotals.value > 0
                        ? `₱${socialTotals.value >= 1000
                            ? `${(socialTotals.value / 1000).toFixed(1)}K`
                            : socialTotals.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                        : '—' },
                  ].map(t => (
                    <div key={t.label} className="rounded-2xl bg-navy/5 p-3 text-center">
                      <div className="font-display text-xl font-bold text-navy">{t.value}</div>
                      <div className="text-xs text-dark/45 mt-0.5 font-medium">{t.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Charts */}
              {socialOverview?.available && (
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Donation referrals by platform */}
                  <div>
                    <p className="text-xs text-dark/40 mb-3 font-semibold uppercase tracking-wide">
                      Donation Referrals by Platform
                    </p>
                    <ResponsiveContainer width="100%" height={190}>
                      <BarChart data={socialPlatformChart} layout="vertical" barSize={10}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#00000008" />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="platform" type="category" tick={{ fontSize: 11 }} width={72} />
                        <Tooltip formatter={(v) => [`${(Number(v) || 0).toLocaleString()}`, 'Referrals']} />
                        <Bar dataKey="referrals" radius={[0, 6, 6, 0]}>
                          {socialPlatformChart.map((entry, i) => (
                            <Cell key={i} fill={PLATFORM_COLORS[entry.platform] || '#2D8F8A'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Donation referrals by content type */}
                  <div>
                    <p className="text-xs text-dark/40 mb-3 font-semibold uppercase tracking-wide">
                      Donation Referrals by Content Type
                    </p>
                    <div className="space-y-2.5 mt-1">
                      {socialContentChart.map((t, i) => {
                        const max = socialContentChart[0]?.referrals || 1;
                        const barColors = ['#2D8F8A', '#1B3A5C', '#D4A843', '#ea580c', '#16a34a'];
                        return (
                          <div key={t.topic}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-dark/60 font-medium">{t.topic}</span>
                              <span className="font-bold text-dark">{t.referrals.toLocaleString()}</span>
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
                  </div>
                </div>
              )}
            </div>

            {/* ML · Best month to run campaigns */}
            <div className="grid sm:grid-cols-2 gap-4">
              {campaignResult === null ? (
                <div className="rounded-2xl border-2 border-dashed border-dark/15 bg-dark/3 p-5 flex items-center gap-3 animate-pulse">
                  <Brain size={16} className="text-dark/30" />
                  <span className="text-xs text-dark/35 font-medium">Loading campaign month analysis…</span>
                </div>
              ) : !campaignResult.available ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-center gap-3">
                  <Brain size={15} className="text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-700">ML · Best Month to Launch — Unavailable</p>
                    <p className="text-xs text-amber-600 mt-0.5">{campaignResult.reason ?? 'ML service not connected.'}</p>
                  </div>
                </div>
              ) : (() => {
                const MONTH_ABBREVS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                const byMonth: Record<number, number[]> = {};
                for (let m = 1; m <= 12; m++) byMonth[m] = [];
                (campaignResult.scorecard ?? []).forEach(c => {
                  const m = parseInt(c.month_label.split('-')[1], 10);
                  if (m >= 1 && m <= 12) byMonth[m].push(campaignMonthSuccessProb(c));
                });
                const monthData = Array.from({ length: 12 }, (_, i) => {
                  const probs = byMonth[i + 1];
                  const avg = probs.length > 0 ? probs.reduce((a, b) => a + b, 0) / probs.length : null;
                  return { label: MONTH_ABBREVS[i], avg, count: probs.length };
                });
                const maxAvg = Math.max(...monthData.map(m => m.avg ?? 0));
                function cellStyle(avg: number | null): React.CSSProperties {
                  if (avg === null) return { backgroundColor: 'rgba(0,0,0,0.04)', color: 'rgba(0,0,0,0.2)' };
                  const t = maxAvg > 0 ? avg / maxAvg : 0;
                  const r = Math.round(254 + (217 - 254) * t);
                  const g = Math.round(243 + (119 - 243) * t);
                  const b = Math.round(199 + (6   - 199) * t);
                  return {
                    backgroundColor: `rgb(${r},${g},${b})`,
                    color: t > 0.55 ? '#78350f' : '#92400e',
                  };
                }
                const bestMonth = monthData.reduce((best, m) =>
                  (m.avg ?? 0) > (best.avg ?? 0) ? m : best, monthData[0]);
                return (
                  <div className="rounded-2xl border border-gold/20 bg-gold/4 p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <Trophy size={15} className="text-gold" />
                      <span className="text-xs font-bold uppercase tracking-widest text-dark/40">ML · Best Month to Launch</span>
                    </div>
                    <p className="text-xs text-dark/45 mb-4 leading-relaxed">
                      Average predicted success probability per calendar month across all campaigns. Darker = historically stronger.
                    </p>
                    {(campaignResult.scorecard ?? []).length === 0 ? (
                      <p className="text-xs text-dark/40">No campaign data available yet.</p>
                    ) : (
                      <>
                        <div className="grid grid-cols-6 gap-1.5 mb-3">
                          {monthData.map(({ label, avg, count }) => (
                            <div
                              key={label}
                              title={avg !== null ? `${label}: ${Math.round(avg * 100)}% avg across ${count} campaign-month${count !== 1 ? 's' : ''}` : `${label}: no data`}
                              className="rounded-xl py-2 px-1 flex flex-col items-center gap-0.5 cursor-default transition-transform hover:scale-105"
                              style={cellStyle(avg)}
                            >
                              <span className="text-[10px] font-bold">{label}</span>
                              <span className="text-[11px] font-extrabold tabular-nums leading-none">
                                {avg !== null ? `${Math.round(avg * 100)}%` : '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[10px] text-dark/35">Lower</span>
                          <div className="flex-1 h-1.5 rounded-full" style={{ background: 'linear-gradient(to right, rgb(254,243,199), rgb(217,119,6))' }} />
                          <span className="text-[10px] text-dark/35">Higher</span>
                        </div>
                        {bestMonth.avg !== null && (
                          <p className="text-xs text-dark/50 leading-relaxed">
                            <span className="font-semibold text-amber-700">{bestMonth.label}</span> is historically your strongest launch month ({Math.round(bestMonth.avg * 100)}% avg).
                          </p>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}

              {/* ML · Campaign comparison bar chart */}
              {campaignResult === null ? (
                <div className="rounded-2xl border-2 border-dashed border-dark/15 bg-dark/3 p-5 flex items-center gap-3 animate-pulse">
                  <Brain size={16} className="text-dark/30" />
                  <span className="text-xs text-dark/35 font-medium">Loading campaign comparison…</span>
                </div>
              ) : !campaignResult.available ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-center gap-3">
                  <Brain size={15} className="text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-amber-700">ML · Campaign Comparison — Unavailable</p>
                    <p className="text-xs text-amber-600 mt-0.5">{campaignResult.reason ?? 'ML service not connected.'}</p>
                  </div>
                </div>
              ) : (() => {
                // Roll up each campaign to a single average score
                const campaignMap: Record<string, number[]> = {};
                (campaignResult.scorecard ?? []).forEach(c => {
                  if (!campaignMap[c.campaign_name]) campaignMap[c.campaign_name] = [];
                  campaignMap[c.campaign_name].push(campaignMonthSuccessProb(c));
                });
                const campaigns = Object.entries(campaignMap)
                  .map(([name, probs]) => ({
                    name,
                    avg: probs.reduce((a, b) => a + b, 0) / probs.length,
                    months: probs.length,
                  }))
                  .sort((a, b) => b.avg - a.avg);
                const maxAvg = campaigns[0]?.avg ?? 1;
                function tierColor(avg: number) {
                  if (avg >= 0.65) return { bar: '#d97706', label: 'text-amber-700', badge: 'bg-amber-100 text-amber-700' };
                  if (avg >= 0.45) return { bar: '#eab308', label: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700' };
                  return { bar: '#94a3b8', label: 'text-slate-500', badge: 'bg-slate-100 text-slate-500' };
                }
                return (
                  <div className="rounded-2xl border border-gold/20 bg-gold/4 p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <BarChart2 size={15} className="text-gold" />
                      <span className="text-xs font-bold uppercase tracking-widest text-dark/40">ML · Campaign Comparison</span>
                    </div>
                    <p className="text-xs text-dark/45 mb-4 leading-relaxed">
                      Average ML effectiveness score per campaign across all months run.
                    </p>
                    {campaigns.length === 0 ? (
                      <p className="text-xs text-dark/40">No campaign data available yet.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {campaigns.map(({ name, avg, months }) => {
                          const { bar, label, badge } = tierColor(avg);
                          const pct = maxAvg > 0 ? (avg / maxAvg) * 100 : 0;
                          return (
                            <div key={name}>
                              <div className="flex items-center justify-between mb-1 gap-2">
                                <span className="text-xs font-semibold text-dark truncate flex-1">{name}</span>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badge}`}>
                                    {months}mo
                                  </span>
                                  <span className={`text-xs font-extrabold tabular-nums ${label}`}>
                                    {Math.round(avg * 100)}%
                                  </span>
                                </div>
                              </div>
                              <div className="h-2 bg-dark/8 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%`, backgroundColor: bar }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
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
                  {churnResult?.available ? 'Supporter Churn Risk (ML)' : 'Supporter Health (90-Day Window)'}
                </h3>
                {churnResult?.available ? (() => {
                  const preds = churnResult.predictions ?? [];
                  const mlTierData = [
                    { name: 'Critical', value: preds.filter(p => p.risk_tier === 'Critical').length, color: '#dc2626' },
                    { name: 'High',     value: preds.filter(p => p.risk_tier === 'High').length,     color: '#ea580c' },
                    { name: 'Medium',   value: preds.filter(p => p.risk_tier === 'Medium').length,   color: '#eab308' },
                    { name: 'Low',      value: preds.filter(p => p.risk_tier === 'Low').length,      color: '#22c55e' },
                  ].filter(d => d.value > 0);
                  return (
                    <div className="flex items-center gap-6">
                      <ResponsiveContainer width={130} height={130}>
                        <PieChart>
                          <Pie data={mlTierData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value">
                            {mlTierData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip formatter={(v, n) => [`${v} supporters`, n]} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2 flex-1">
                        {mlTierData.map(item => (
                          <div key={item.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                              <span className="text-dark/60 text-xs font-medium">{item.name}</span>
                            </div>
                            <span className="font-bold text-dark text-xs">{item.value}</span>
                          </div>
                        ))}
                        <div className="text-xs text-dark/40 pt-0.5">{preds.length} supporters scored</div>
                      </div>
                    </div>
                  );
                })() : (
                  <div className="flex items-center gap-6">
                    <ResponsiveContainer width={130} height={130}>
                      <PieChart>
                        <Pie data={donorStatusData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} paddingAngle={3} dataKey="value">
                          {donorStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
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
                )}
              </div>
            </div>

            {/* ML: Donor Churn Predictor */}
            {churnResult === null ? (
              <div className="rounded-2xl border-2 border-dashed border-dark/15 bg-dark/3 p-5 flex items-center gap-3 animate-pulse">
                <Brain size={16} className="text-dark/30" />
                <span className="text-xs text-dark/35 font-medium">Loading churn predictions…</span>
              </div>
            ) : !churnResult.available ? (
              <div className="rounded-2xl border-2 border-dashed border-dark/15 bg-dark/3 p-5 flex items-center gap-2 text-dark/40">
                <Cpu size={16} strokeWidth={1.8} />
                <span className="text-xs font-bold uppercase tracking-widest">ML · Donor Churn Predictor</span>
                <span className="ml-auto text-xs bg-dark/10 text-dark/40 px-2 py-0.5 rounded-full font-semibold">Unavailable</span>
              </div>
            ) : (() => {
              const preds = churnResult.predictions ?? [];
              const critical = preds.filter(p => p.risk_tier === 'Critical');
              const high     = preds.filter(p => p.risk_tier === 'High');
              const atRisk   = [...critical, ...high].slice(0, 6);
              return (
                <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown size={15} className="text-orange-500" />
                    <span className="text-xs font-bold uppercase tracking-widest text-dark/40">ML · Donor Churn Predictor</span>
                  </div>
                  <div className="flex gap-3 mb-4 mt-2">
                    <div className="rounded-xl bg-red-100 px-3 py-2 text-center">
                      <div className="font-display text-xl font-bold text-red-700">{critical.length}</div>
                      <div className="text-xs text-red-600">Critical</div>
                    </div>
                    <div className="rounded-xl bg-orange-100 px-3 py-2 text-center">
                      <div className="font-display text-xl font-bold text-orange-700">{high.length}</div>
                      <div className="text-xs text-orange-600">High Risk</div>
                    </div>
                    <div className="rounded-xl bg-white px-3 py-2 text-center">
                      <div className="font-display text-xl font-bold text-dark">{preds.length}</div>
                      <div className="text-xs text-dark/50">Total scored</div>
                    </div>
                  </div>
                  {atRisk.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-dark/40 uppercase tracking-wide mb-2">Priority outreach list</p>
                      {atRisk.map(p => {
                        const tierColor = p.risk_tier === 'Critical'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-orange-100 text-orange-700';
                        return (
                          <div key={p.supporter_id} className="flex items-center justify-between gap-3 bg-white rounded-xl px-3 py-2 border border-dark/6">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-dark truncate">{p.display_name}</p>
                              <p className="text-xs text-dark/40 truncate">{p.recommended_action.split(':')[0]}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tierColor}`}>{p.risk_tier}</span>
                              <span className="text-xs font-bold text-dark/60">{Math.round(p.churn_probability * 100)}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
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
                  <Link
                    key={item.id}
                    to={item.linkTo}
                    className="flex gap-4 items-start group rounded-xl -mx-2 px-2 py-1 -my-1 hover:bg-navy/5 transition-colors cursor-pointer text-left"
                  >
                    <div className="w-9 h-9 rounded-xl bg-navy/6 flex items-center justify-center flex-shrink-0 group-hover:bg-teal/10 transition-colors">
                      <Icon size={16} className="text-navy/50 group-hover:text-teal transition-colors" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark group-hover:text-teal transition-colors">{item.text}</p>
                      <p className="text-xs text-dark/50 mt-0.5 truncate">{item.sub}</p>
                    </div>
                    <span className="text-xs text-dark/30 flex-shrink-0 pt-0.5">
                      {new Date(item.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
}