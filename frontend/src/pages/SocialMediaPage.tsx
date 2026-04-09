import { useState, useEffect } from 'react';
import {
  AlertTriangle, CheckCircle, Clock,
  Megaphone, Heart, Users, Calendar, Star,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import AdminLayout from '../layouts/AdminLayout';
import { apiFetch } from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PostingAdvisor {
  daysSinceLastPost: number;
  recommendedFrequencyDays: number;
  daysUntilRecommended: number;
  status: 'OnTrack' | 'DueSoon' | 'Overdue';
  bestDayToPost: string;
  bestTimeBucket: string;
  bestPostType: string;
  bestPlatform: string;
  lastPostDate: string;
}

interface DayEngagement {
  day: string;
  avgEngagementRate: number;
  postCount: number;
}

interface TimeEngagement {
  timeBucket: string;
  hourRange: string;
  sortOrder: number;
  avgEngagementRate: number;
  postCount: number;
}

interface PlatformStats {
  platform: string;
  postCount: number;
  avgEngagementRate: number;
  totalReach: number;
  totalDonationReferrals: number;
  estimatedDonationValuePhp: number;
  avgLikes: number;
  avgShares: number;
}

interface ContentTypeStats {
  postType: string;
  postCount: number;
  avgEngagementRate: number;
  totalDonationReferrals: number;
  donationConversionRate: number;
}

interface MediaTypeStats {
  mediaType: string;
  postCount: number;
  avgEngagementRate: number;
  totalDonationReferrals: number;
}

interface RecentPost {
  postId: number;
  platform: string;
  postType: string;
  createdAt: string;
  dayOfWeek: string;
  postHour: number;
  likes: number;
  shares: number;
  comments: number;
  engagementRate: number;
  donationReferrals: number;
  estimatedDonationValuePhp: number;
  caption: string;
}

interface DonationDrivers {
  avgReferralsWithStory: number;
  avgReferralsWithoutStory: number;
  avgReferralsWithCta: number;
  avgReferralsWithoutCta: number;
  bestPlatformForDonations: string;
  bestPostTypeForDonations: string;
  pctPostsWithStory: number;
  pctPostsWithCta: number;
}

interface SocialAnalytics {
  available: boolean;
  reason?: string;
  postingAdvisor?: PostingAdvisor;
  byDayOfWeek?: DayEngagement[];
  byTimeOfDay?: TimeEngagement[];
  byPlatform?: PlatformStats[];
  byContentType?: ContentTypeStats[];
  byMediaType?: MediaTypeStats[];
  recentPosts?: RecentPost[];
  donationDrivers?: DonationDrivers;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  Facebook:  '#1877F2',
  Instagram: '#E1306C',
  TikTok:    '#010101',
  YouTube:   '#FF0000',
  Twitter:   '#1DA1F2',
  LinkedIn:  '#0A66C2',
  WhatsApp:  '#25D366',
};

const TEAL_SHADES = ['#0d9488', '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4', '#ccfbf1'];

function formatPostType(raw: string): string {
  return raw.replace(/([A-Z])/g, ' $1').trim();
}

function formatHour(hour: number): string {
  if (hour === 0)  return '12 AM';
  if (hour === 12) return '12 PM';
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, sub, accent = 'teal',
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: 'teal' | 'gold' | 'navy';
}) {
  const bg    = accent === 'teal' ? 'bg-teal/8 border-teal/20'
              : accent === 'gold' ? 'bg-amber-50 border-amber-200'
              : 'bg-navy/8 border-navy/20';
  const icClr = accent === 'teal' ? 'text-teal'
              : accent === 'gold' ? 'text-amber-500'
              : 'text-navy';
  return (
    <div className={`rounded-2xl border p-4 flex gap-3 items-start ${bg}`}>
      <div className={`mt-0.5 ${icClr}`}><Icon size={20} strokeWidth={1.8} /></div>
      <div>
        <p className="text-xs text-dark/50 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-lg font-bold text-navy leading-tight">{value}</p>
        {sub && <p className="text-xs text-dark/50 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ComparisonBar({
  labelA, valueA, labelB, valueB, colorA = '#0d9488', colorB = '#94a3b8',
}: {
  labelA: string; valueA: number;
  labelB: string; valueB: number;
  colorA?: string; colorB?: string;
}) {
  const max  = Math.max(valueA, valueB, 0.01);
  const pctA = (valueA / max) * 100;
  const pctB = (valueB / max) * 100;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="text-xs text-dark/60 w-36 shrink-0">{labelA}</span>
        <div className="flex-1 bg-dark/8 rounded-full h-3">
          <div className="h-3 rounded-full transition-all" style={{ width: `${pctA}%`, background: colorA }} />
        </div>
        <span className="text-xs font-semibold text-navy w-8 text-right">{valueA.toFixed(1)}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-dark/60 w-36 shrink-0">{labelB}</span>
        <div className="flex-1 bg-dark/8 rounded-full h-3">
          <div className="h-3 rounded-full transition-all" style={{ width: `${pctB}%`, background: colorB }} />
        </div>
        <span className="text-xs font-semibold text-navy w-8 text-right">{valueB.toFixed(1)}</span>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SocialMediaPage() {
  const [data,    setData]    = useState<SocialAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/social-analytics')
      .then(r => r.json())
      .then((d: SocialAnalytics) => setData(d))
      .catch(() => setData({ available: false, reason: 'Could not load analytics.' }))
      .finally(() => setLoading(false));
  }, []);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AdminLayout>
        <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
          <div className="h-10 bg-dark/8 rounded-xl w-64" />
          <div className="h-32 bg-dark/8 rounded-2xl" />
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-dark/8 rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1,2].map(i => <div key={i} className="h-56 bg-dark/8 rounded-2xl" />)}
          </div>
        </div>
      </AdminLayout>
    );
  }

  // ── Unavailable ──────────────────────────────────────────────────────────
  if (!data?.available) {
    return (
      <AdminLayout>
        <div className="max-w-6xl mx-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4 items-start">
            <AlertTriangle size={22} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">Analytics Unavailable</p>
              <p className="text-sm text-amber-700 mt-1">
                {data?.reason ?? 'No social media post data has been recorded yet. Once posts are logged, strategy insights will appear here.'}
              </p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const { postingAdvisor, byDayOfWeek, byTimeOfDay, byPlatform, byContentType, byMediaType, recentPosts, donationDrivers } = data;

  // Advisor banner config
  const advisorConfig = {
    OnTrack: {
      bg: 'bg-emerald-50 border-emerald-200',
      icon: <CheckCircle size={28} className="text-emerald-500 shrink-0 mt-0.5" />,
      badge: 'bg-emerald-100 text-emerald-700',
      badgeText: 'On Track',
      headline: `You're on track — next post in ${postingAdvisor!.daysUntilRecommended} day${postingAdvisor!.daysUntilRecommended !== 1 ? 's' : ''}.`,
      sub: `Your last post was ${postingAdvisor!.daysSinceLastPost} day${postingAdvisor!.daysSinceLastPost !== 1 ? 's' : ''} ago. Your audience is engaged — keep the momentum going.`,
    },
    DueSoon: {
      bg: 'bg-amber-50 border-amber-200',
      icon: <Clock size={28} className="text-amber-500 shrink-0 mt-0.5" />,
      badge: 'bg-amber-100 text-amber-700',
      badgeText: 'Post Soon',
      headline: `Your next post is due in ${postingAdvisor!.daysUntilRecommended} day${postingAdvisor!.daysUntilRecommended !== 1 ? 's' : ''}.`,
      sub: `Your last post was ${postingAdvisor!.daysSinceLastPost} day${postingAdvisor!.daysSinceLastPost !== 1 ? 's' : ''} ago. Start preparing your content now to stay consistent.`,
    },
    Overdue: {
      bg: 'bg-red-50 border-red-200',
      icon: <AlertTriangle size={28} className="text-red-500 shrink-0 mt-0.5" />,
      badge: 'bg-red-100 text-red-700',
      badgeText: 'Overdue',
      headline: `You're ${Math.abs(postingAdvisor!.daysUntilRecommended)} day${Math.abs(postingAdvisor!.daysUntilRecommended) !== 1 ? 's' : ''} overdue for a post.`,
      sub: `Your last post was ${postingAdvisor!.daysSinceLastPost} day${postingAdvisor!.daysSinceLastPost !== 1 ? 's' : ''} ago. Posting today will help you stay visible to donors and supporters.`,
    },
  }[postingAdvisor!.status];

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-navy">Social Media Strategy</h1>
          <p className="text-sm text-dark/50 mt-1">
            Data-driven guidance on what to post, when to post, and what actually brings in donations.
          </p>
        </div>

        {/* ── Posting Advisor Banner ───────────────────────────────────────── */}
        <div className={`rounded-2xl border p-5 flex gap-4 items-start ${advisorConfig.bg}`}>
          {advisorConfig.icon}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${advisorConfig.badge}`}>
                {advisorConfig.badgeText}
              </span>
              <span className="text-xs text-dark/40">
                Based on your average posting frequency of every {postingAdvisor!.recommendedFrequencyDays} days
              </span>
            </div>
            <p className="font-semibold text-navy text-base">{advisorConfig.headline}</p>
            <p className="text-sm text-dark/60 mt-0.5">{advisorConfig.sub}</p>

            {/* Quick recommendation pills */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="bg-white/80 border border-dark/10 text-dark/70 text-xs px-3 py-1 rounded-full font-medium">
                Post on {postingAdvisor!.bestDayToPost}
              </span>
              <span className="bg-white/80 border border-dark/10 text-dark/70 text-xs px-3 py-1 rounded-full font-medium">
                Best time: {postingAdvisor!.bestTimeBucket}
              </span>
              <span className="bg-white/80 border border-dark/10 text-dark/70 text-xs px-3 py-1 rounded-full font-medium">
                Try: {formatPostType(postingAdvisor!.bestPostType)}
              </span>
              <span className="bg-white/80 border border-dark/10 text-dark/70 text-xs px-3 py-1 rounded-full font-medium">
                Platform: {postingAdvisor!.bestPlatform}
              </span>
            </div>
          </div>
        </div>

        {/* ── Quick Wins ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={Calendar}
            label="Best Day to Post"
            value={postingAdvisor!.bestDayToPost}
            sub="Highest avg. engagement"
            accent="teal"
          />
          <StatCard
            icon={Clock}
            label="Best Time"
            value={postingAdvisor!.bestTimeBucket}
            sub="Peak audience activity"
            accent="teal"
          />
          <StatCard
            icon={Megaphone}
            label="Top Platform"
            value={postingAdvisor!.bestPlatform}
            sub="Most donation referrals"
            accent="gold"
          />
          <StatCard
            icon={Star}
            label="Best Content Type"
            value={formatPostType(postingAdvisor!.bestPostType)}
            sub="Drives most donations"
            accent="navy"
          />
        </div>

        {/* ── Timing Charts ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Day of Week */}
          <div className="bg-white rounded-2xl border border-dark/8 shadow-sm p-5">
            <h2 className="text-base font-semibold text-navy mb-1">Best Day of the Week</h2>
            <p className="text-xs text-dark/50 mb-4">Average engagement rate (%) by day</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byDayOfWeek} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(0, 3)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: unknown) => [`${Number(val ?? 0)}%`, 'Engagement Rate']}
                  labelFormatter={l => `${l}`}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="avgEngagementRate" radius={[4, 4, 0, 0]}>
                  {byDayOfWeek?.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.day === postingAdvisor!.bestDayToPost ? '#0d9488' : '#cbd5e1'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Time of Day */}
          <div className="bg-white rounded-2xl border border-dark/8 shadow-sm p-5">
            <h2 className="text-base font-semibold text-navy mb-1">Best Time of Day</h2>
            <p className="text-xs text-dark/50 mb-4">Average engagement rate (%) by time block</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byTimeOfDay} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="timeBucket" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: unknown) => [`${Number(val ?? 0)}%`, 'Engagement Rate']}
                  labelFormatter={(l, p) => `${l} (${p[0]?.payload?.hourRange ?? ''})`}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="avgEngagementRate" radius={[4, 4, 0, 0]}>
                  {byTimeOfDay?.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.timeBucket === postingAdvisor!.bestTimeBucket ? '#0d9488' : '#cbd5e1'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Platform Performance ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-dark/8 shadow-sm p-5">
          <h2 className="text-base font-semibold text-navy mb-1">Platform Performance</h2>
          <p className="text-xs text-dark/50 mb-5">Which platforms actually bring in donations vs. just likes</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-dark/8">
                  <th className="pb-2 font-semibold text-dark/60 text-xs uppercase tracking-wide">Platform</th>
                  <th className="pb-2 font-semibold text-dark/60 text-xs uppercase tracking-wide text-right">Posts</th>
                  <th className="pb-2 font-semibold text-dark/60 text-xs uppercase tracking-wide text-right">Avg Engagement</th>
                  <th className="pb-2 font-semibold text-dark/60 text-xs uppercase tracking-wide text-right">Total Reach</th>
                  <th className="pb-2 font-semibold text-dark/60 text-xs uppercase tracking-wide text-right">Donation Referrals</th>
                  <th className="pb-2 font-semibold text-dark/60 text-xs uppercase tracking-wide text-right">Est. Value (PHP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark/5">
                {byPlatform?.map((p, i) => (
                  <tr key={p.platform} className={i === 0 ? 'bg-teal/4' : ''}>
                    <td className="py-3 flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ background: PLATFORM_COLORS[p.platform] ?? '#94a3b8' }}
                      />
                      <span className="font-medium text-navy">{p.platform}</span>
                      {i === 0 && (
                        <span className="text-xs bg-teal/10 text-teal px-2 py-0.5 rounded-full font-medium">Top</span>
                      )}
                    </td>
                    <td className="py-3 text-right text-dark/60">{p.postCount}</td>
                    <td className="py-3 text-right text-dark/60">{p.avgEngagementRate}%</td>
                    <td className="py-3 text-right text-dark/60">{p.totalReach.toLocaleString()}</td>
                    <td className="py-3 text-right font-semibold text-teal">{p.totalDonationReferrals}</td>
                    <td className="py-3 text-right text-dark/70">
                      {p.estimatedDonationValuePhp > 0 ? `₱${p.estimatedDonationValuePhp.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── What Drives Donations ────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-dark/8 shadow-sm p-5">
          <div className="flex items-start gap-3 mb-5">
            <div className="bg-teal/10 p-2 rounded-xl">
              <Heart size={18} className="text-teal" strokeWidth={1.8} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-navy">What Actually Drives Donations</h2>
              <p className="text-xs text-dark/50 mt-0.5">
                Average donation referrals per post — not just likes, but real conversions
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Resident Story Impact */}
            <div>
              <p className="text-sm font-semibold text-navy mb-3 flex items-center gap-2">
                <Users size={15} className="text-teal" />
                Resident Story Posts
                <span className="text-xs font-normal text-dark/40">
                  ({donationDrivers!.pctPostsWithStory}% of your posts include a story)
                </span>
              </p>
              <ComparisonBar
                labelA="With resident story"
                valueA={donationDrivers!.avgReferralsWithStory}
                labelB="Without resident story"
                valueB={donationDrivers!.avgReferralsWithoutStory}
              />
              {donationDrivers!.avgReferralsWithStory > donationDrivers!.avgReferralsWithoutStory && (
                <p className="text-xs text-teal mt-2 font-medium">
                  Posts featuring a resident story generate{' '}
                  {donationDrivers!.avgReferralsWithoutStory > 0
                    ? `${((donationDrivers!.avgReferralsWithStory / donationDrivers!.avgReferralsWithoutStory - 1) * 100).toFixed(0)}% more`
                    : 'more'}{' '}
                  donation referrals.
                </p>
              )}
            </div>

            {/* CTA Impact */}
            <div>
              <p className="text-sm font-semibold text-navy mb-3 flex items-center gap-2">
                <Megaphone size={15} className="text-teal" />
                Call-to-Action Posts
                <span className="text-xs font-normal text-dark/40">
                  ({donationDrivers!.pctPostsWithCta}% of your posts have a CTA)
                </span>
              </p>
              <ComparisonBar
                labelA="With call-to-action"
                valueA={donationDrivers!.avgReferralsWithCta}
                labelB="Without call-to-action"
                valueB={donationDrivers!.avgReferralsWithoutCta}
              />
              {donationDrivers!.avgReferralsWithCta > donationDrivers!.avgReferralsWithoutCta && (
                <p className="text-xs text-teal mt-2 font-medium">
                  Adding a "Donate Now" or "Learn More" button makes a measurable difference.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Content Type Breakdown ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Content type chart */}
          <div className="bg-white rounded-2xl border border-dark/8 shadow-sm p-5">
            <h2 className="text-base font-semibold text-navy mb-1">Content Type Performance</h2>
            <p className="text-xs text-dark/50 mb-4">Average engagement rate (%) by content type</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={byContentType?.map(c => ({ ...c, label: formatPostType(c.postType) }))}
                layout="vertical"
                margin={{ top: 0, right: 10, bottom: 0, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="label" type="category" tick={{ fontSize: 11 }} width={110} />
                <Tooltip
                  formatter={(val: unknown) => [`${Number(val ?? 0)}%`, 'Engagement Rate']}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="avgEngagementRate" radius={[0, 4, 4, 0]}>
                  {byContentType?.map((_, i) => (
                    <Cell key={i} fill={TEAL_SHADES[i % TEAL_SHADES.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Media type chart */}
          <div className="bg-white rounded-2xl border border-dark/8 shadow-sm p-5">
            <h2 className="text-base font-semibold text-navy mb-1">Media Format Performance</h2>
            <p className="text-xs text-dark/50 mb-4">Photo vs. Video vs. Reel — which format works best</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={byMediaType}
                layout="vertical"
                margin={{ top: 0, right: 10, bottom: 0, left: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="mediaType" type="category" tick={{ fontSize: 11 }} width={70} />
                <Tooltip
                  formatter={(val: unknown) => [`${Number(val ?? 0)}%`, 'Engagement Rate']}
                  contentStyle={{ borderRadius: 12, fontSize: 12 }}
                />
                <Bar dataKey="avgEngagementRate" radius={[0, 4, 4, 0]}>
                  {byMediaType?.map((_, i) => (
                    <Cell key={i} fill={TEAL_SHADES[i % TEAL_SHADES.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Content Type Donation Table ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-dark/8 shadow-sm p-5">
          <h2 className="text-base font-semibold text-navy mb-1">Content Type — Donation Impact</h2>
          <p className="text-xs text-dark/50 mb-4">Which post types convert to actual donations</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-dark/8">
                  <th className="pb-2 font-semibold text-dark/60 text-xs uppercase tracking-wide">Content Type</th>
                  <th className="pb-2 font-semibold text-dark/60 text-xs uppercase tracking-wide text-right">Posts</th>
                  <th className="pb-2 font-semibold text-dark/60 text-xs uppercase tracking-wide text-right">Avg Engagement</th>
                  <th className="pb-2 font-semibold text-dark/60 text-xs uppercase tracking-wide text-right">Total Donations</th>
                  <th className="pb-2 font-semibold text-dark/60 text-xs uppercase tracking-wide text-right">Conversion Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark/5">
                {byContentType?.map((c, i) => (
                  <tr key={c.postType} className={i === 0 ? 'bg-teal/4' : ''}>
                    <td className="py-3 font-medium text-navy">
                      {formatPostType(c.postType)}
                      {i === 0 && (
                        <span className="ml-2 text-xs bg-teal/10 text-teal px-2 py-0.5 rounded-full">Best</span>
                      )}
                    </td>
                    <td className="py-3 text-right text-dark/60">{c.postCount}</td>
                    <td className="py-3 text-right text-dark/60">{c.avgEngagementRate}%</td>
                    <td className="py-3 text-right font-semibold text-teal">{c.totalDonationReferrals}</td>
                    <td className="py-3 text-right">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        c.donationConversionRate >= 30 ? 'bg-emerald-100 text-emerald-700' :
                        c.donationConversionRate >= 15 ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {c.donationConversionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Recent Posts ─────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-dark/8 shadow-sm p-5">
          <h2 className="text-base font-semibold text-navy mb-1">Recent Posts</h2>
          <p className="text-xs text-dark/50 mb-4">Your last 15 posts and how they performed</p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-dark/8">
                  <th className="pb-2 font-semibold text-dark/60 text-xs uppercase tracking-wide">Date</th>
                  <th className="pb-2 font-semibold text-dark/60 text-xs uppercase tracking-wide">Platform</th>
                  <th className="pb-2 font-semibold text-dark/60 text-xs uppercase tracking-wide">Type</th>
                  <th className="pb-2 font-semibold text-dark/60 text-xs uppercase tracking-wide text-right">Likes</th>
                  <th className="pb-2 font-semibold text-dark/60 text-xs uppercase tracking-wide text-right">Shares</th>
                  <th className="pb-2 font-semibold text-dark/60 text-xs uppercase tracking-wide text-right">Engagement</th>
                  <th className="pb-2 font-semibold text-dark/60 text-xs uppercase tracking-wide text-right">Donations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark/5">
                {recentPosts?.map(p => (
                  <tr key={p.postId} className="hover:bg-cream/50 transition-colors">
                    <td className="py-3 text-dark/60 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {p.postHour != null && (
                        <span className="ml-1 text-dark/40">{formatHour(p.postHour)}</span>
                      )}
                    </td>
                    <td className="py-3">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: PLATFORM_COLORS[p.platform] ?? '#94a3b8' }}
                        />
                        <span className="text-dark/70">{p.platform}</span>
                      </span>
                    </td>
                    <td className="py-3 text-dark/60">{formatPostType(p.postType ?? '')}</td>
                    <td className="py-3 text-right text-dark/60">{p.likes.toLocaleString()}</td>
                    <td className="py-3 text-right text-dark/60">{p.shares.toLocaleString()}</td>
                    <td className="py-3 text-right">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        p.engagementRate >= 5 ? 'bg-emerald-100 text-emerald-700' :
                        p.engagementRate >= 2 ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {p.engagementRate}%
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {p.donationReferrals > 0 ? (
                        <span className="font-semibold text-teal">{p.donationReferrals}</span>
                      ) : (
                        <span className="text-dark/30">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
