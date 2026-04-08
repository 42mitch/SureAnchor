import { useEffect, useState } from 'react';
import { HeartHandshake, TrendingUp, Clock, CalendarCheck, LogOut, Heart, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AnchorLogo from '../components/AnchorLogo';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import { useListPagination } from '../hooks/useListPagination';
import ListPaginationBar from '../components/ListPaginationBar';

interface Donation {
  donationId: number;
  donationType: string;
  donationDate: string;
  campaignName: string | null;
  channelSource: string | null;
  currencyCode: string;
  amount: number | null;
  estimatedValue: number | null;
  impactUnit: string | null;
  notes: string | null;
}

interface ImpactAllocation {
  allocationId: number;
  donationId: number;
  name: string;
  programArea: string;
  amountAllocated: number;
  allocationDate: string;
}

const CAMPAIGNS = [
  'Annual Giving Campaign',
  'Safehouse Operations Fund',
  'Education Support Program',
  'Child Welfare Campaign',
  'Nutrition Program',
  'General Donation',
];

export default function DonorPortalPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [impact, setImpact] = useState<ImpactAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  // Donate modal state
  const [showDonate, setShowDonate] = useState(false);
  const [donateAmount, setDonateAmount] = useState('');
  const [donateCampaign, setDonateCampaign] = useState('General Donation');
  const [donateNotes, setDonateNotes] = useState('');
  const [donateLoading, setDonateLoading] = useState(false);
  const [donateSuccess, setDonateSuccess] = useState(false);
  const [donateError, setDonateError] = useState('');

  function loadData() {
    setLoading(true);
    Promise.all([
      apiFetch('/api/donations').then(r => r.ok ? r.json() : []),
      apiFetch('/api/donations/my-impact').then(r => r.ok ? r.json() : []),
    ])
      .then(([d, i]) => { setDonations(d); setImpact(i); })
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadData(); }, []);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  async function handleDonate(e: React.FormEvent) {
    e.preventDefault();
    const formEl = e.currentTarget as HTMLFormElement;
    if (!formEl.checkValidity()) {
      formEl.reportValidity();
      window.alert('Please fix the highlighted fields before submitting.');
      return;
    }
    setDonateError('');
    const amount = parseFloat(donateAmount);
    if (!amount || amount <= 0) { setDonateError('Please enter a valid amount.'); window.alert('Donation amount must be greater than 0.'); return; }

    setDonateLoading(true);
    try {
      const res = await apiFetch('/api/donations/give', {
        method: 'POST',
        body: JSON.stringify({ amount, campaignName: donateCampaign, notes: donateNotes || null }),
      });
      if (!res.ok) { const d = await res.json(); setDonateError(d.message ?? 'Something went wrong.'); return; }
      setDonateSuccess(true);
      // Reload donation data after a moment
      setTimeout(() => {
        setShowDonate(false);
        setDonateSuccess(false);
        setDonateAmount('');
        setDonateNotes('');
        setDonateCampaign('General Donation');
        loadData();
      }, 2000);
    } catch {
      setDonateError('Unable to process donation. Please try again.');
    } finally {
      setDonateLoading(false);
    }
  }

  const totalGiven = donations.reduce((sum, d) => sum + (d.amount ?? d.estimatedValue ?? 0), 0);
  const totalAllocated = impact.reduce((sum, i) => sum + i.amountAllocated, 0);

  // Time helpers
  function formatDuration(fromDate: Date, toDate: Date = new Date()): string {
    const diffMs = toDate.getTime() - fromDate.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (days < 1) return 'Today';
    if (days === 1) return '1 day';
    if (days < 30) return `${days} days`;
    const months = Math.floor(days / 30.44);
    if (months < 12) return months === 1 ? '1 month' : `${months} months`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    if (rem === 0) return years === 1 ? '1 year' : `${years} years`;
    return `${years}y ${rem}m`;
  }

  const sortedDates = donations
    .map(d => new Date(d.donationDate))
    .filter(d => !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  const firstDonationDate = sortedDates[0];
  const lastDonationDate = sortedDates[sortedDates.length - 1];

  const timeAsDonor = firstDonationDate ? formatDuration(firstDonationDate) : '—';
  const timeSinceLast = lastDonationDate ? formatDuration(lastDonationDate) : '—';
  const programTotals = impact.reduce<Record<string, number>>((acc, a) => {
    acc[a.programArea] = (acc[a.programArea] ?? 0) + a.amountAllocated;
    return acc;
  }, {});

  const donPag = useListPagination(donations, [donations.length]);
  const impactPag = useListPagination(impact, [impact.length]);

  return (
    <div className="min-h-screen bg-cream font-sans">
      {/* Nav */}
      <nav className="bg-navy text-white px-6 py-4 flex items-center justify-between shadow-md">
        <AnchorLogo size="sm" variant="light" />
        <div className="flex items-center gap-4">
          <span className="text-white/60 text-sm hidden sm:block">
            {user?.displayName ?? user?.email}
          </span>
          <button
            onClick={() => setShowDonate(true)}
            className="flex items-center gap-2 bg-gold text-navy font-semibold px-4 py-2 rounded-xl text-sm hover:bg-gold/90 transition-colors shadow-sm"
          >
            <Heart size={15} strokeWidth={2.2} />
            Donate
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-white/60 hover:text-red-300 transition-colors text-sm"
          >
            <LogOut size={16} />
            <span className="hidden sm:block">Sign Out</span>
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-navy">
              Welcome back{user?.displayName ? `, ${user.displayName}` : ''}
            </h1>
            <p className="text-dark/50 mt-1">Your contribution is making a real difference.</p>
          </div>
          <button
            onClick={() => setShowDonate(true)}
            className="flex items-center gap-2 bg-navy text-white font-semibold px-6 py-3 rounded-xl text-sm hover:bg-navy-light transition-colors shadow-sm self-start sm:self-auto"
          >
            <Heart size={16} strokeWidth={2.2} />
            Make a Donation
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Given', value: `₱${totalGiven.toLocaleString()}`, icon: HeartHandshake, color: 'text-gold', bg: 'bg-gold/10' },
            { label: 'Donations Made', value: donations.length.toString(), icon: TrendingUp, color: 'text-teal', bg: 'bg-teal/10' },
            { label: 'Time as a Donor', value: timeAsDonor, icon: Clock, color: 'text-navy', bg: 'bg-navy/8' },
            { label: 'Since Last Donation', value: timeSinceLast, icon: CalendarCheck, color: 'text-teal-dark', bg: 'bg-teal/8' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm border border-dark/6 p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                <Icon size={22} className={color} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                <div className={`font-display text-xl font-bold leading-tight ${color}`}>{value}</div>
                <div className="text-xs text-dark/55 font-medium mt-0.5">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-4 border-teal border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {/* Donation history */}
            <div className="bg-white rounded-2xl shadow-sm border border-dark/6 overflow-hidden">
              <div className="px-6 py-5 border-b border-dark/8 flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold text-navy">Your Donation History</h2>
                <button
                  onClick={() => setShowDonate(true)}
                  className="flex items-center gap-1.5 text-sm text-teal font-semibold hover:text-teal-dark transition-colors"
                >
                  <Heart size={14} />
                  Give Again
                </button>
              </div>
              {donations.length === 0 ? (
                <div className="px-6 py-16 text-center">
                  <HeartHandshake size={40} className="text-dark/20 mx-auto mb-3" />
                  <p className="font-display text-lg font-semibold text-navy mb-1">No Donations Yet</p>
                  <p className="text-dark/45 text-sm mb-5">Be the first to make a difference.</p>
                  <button
                    onClick={() => setShowDonate(true)}
                    className="inline-flex items-center gap-2 bg-navy text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-navy-light transition-colors"
                  >
                    <Heart size={15} />
                    Make Your First Donation
                  </button>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-cream/60 border-b border-dark/8">
                          {['Date', 'Type', 'Campaign', 'Amount', 'Notes'].map(h => (
                            <th key={h} className="text-left text-xs font-semibold text-dark/40 uppercase tracking-wide px-5 py-3 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {donPag.pageItems.map((d, i) => (
                          <tr key={d.donationId} className={`border-b border-dark/5 last:border-0 ${(donPag.startIndex + i) % 2 !== 0 ? 'bg-cream/30' : ''}`}>
                            <td className="px-5 py-3.5 text-sm text-dark/70 whitespace-nowrap">{d.donationDate}</td>
                            <td className="px-5 py-3.5">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal/10 text-teal-dark">{d.donationType}</span>
                            </td>
                            <td className="px-5 py-3.5 text-sm text-dark/60">{d.campaignName ?? '—'}</td>
                            <td className="px-5 py-3.5">
                              {d.amount != null
                                ? <span className="text-sm font-semibold text-navy">₱{d.amount.toLocaleString()}</span>
                                : <span className="text-sm text-dark/40 italic">In-kind / Time</span>
                              }
                            </td>
                            <td className="px-5 py-3.5 text-sm text-dark/50">{d.notes ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <ListPaginationBar
                    page={donPag.page}
                    pageCount={donPag.pageCount}
                    pageSize={donPag.pageSize}
                    setPage={donPag.setPage}
                    setPageSize={donPag.setPageSize}
                    total={donPag.total}
                    startIndex={donPag.startIndex}
                    endIndex={donPag.endIndex}
                  />
                </>
              )}
            </div>

            {/* Impact allocations */}
            {impact.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-dark/6 overflow-hidden">
                <div className="px-6 py-5 border-b border-dark/8 flex items-center justify-between">
                  <h2 className="font-display text-xl font-semibold text-navy">Where Your Giving Goes</h2>
                  <span className="text-sm text-dark/40 font-medium">₱{totalAllocated.toLocaleString()} allocated</span>
                </div>
                <div className="px-6 py-5 border-b border-dark/6">
                  <p className="text-xs font-semibold text-dark/40 uppercase tracking-wide mb-4">By Program Area</p>
                  <div className="space-y-3">
                    {Object.entries(programTotals).map(([area, amt]) => (
                      <div key={area}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-dark/70">{area}</span>
                          <span className="font-semibold text-navy">₱{amt.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-dark/6 rounded-full h-1.5">
                          <div className="bg-teal h-1.5 rounded-full transition-all" style={{ width: `${(amt / totalAllocated) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-cream/60 border-b border-dark/8">
                        {['Safehouse', 'Program', 'Amount Allocated', 'Date'].map(h => (
                          <th key={h} className="text-left text-xs font-semibold text-dark/40 uppercase tracking-wide px-5 py-3 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {impactPag.pageItems.map((a, i) => (
                        <tr key={a.allocationId} className={`border-b border-dark/5 last:border-0 ${(impactPag.startIndex + i) % 2 !== 0 ? 'bg-cream/30' : ''}`}>
                          <td className="px-5 py-3.5 text-sm font-semibold text-navy">{a.name}</td>
                          <td className="px-5 py-3.5">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-navy/8 text-navy">{a.programArea}</span>
                          </td>
                          <td className="px-5 py-3.5 text-sm font-semibold text-teal">₱{a.amountAllocated.toLocaleString()}</td>
                          <td className="px-5 py-3.5 text-sm text-dark/50">{a.allocationDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ListPaginationBar
                  page={impactPag.page}
                  pageCount={impactPag.pageCount}
                  pageSize={impactPag.pageSize}
                  setPage={impactPag.setPage}
                  setPageSize={impactPag.setPageSize}
                  total={impactPag.total}
                  startIndex={impactPag.startIndex}
                  endIndex={impactPag.endIndex}
                />
              </div>
            )}
          </>
        )}

        <footer className="text-center text-xs text-dark/30 pb-4">
          © 2024 SureAnchor · "We have this hope as an anchor for the soul." — Hebrews 6:19
        </footer>
      </div>

      {/* ── Donate Modal ─────────────────────────────────────────────────────── */}
      {showDonate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { if (!donateLoading) setShowDonate(false); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-navy to-teal-dark p-6 text-white">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Heart size={20} className="text-gold" fill="currentColor" />
                  <h2 className="font-display text-xl font-bold">Make a Donation</h2>
                </div>
                <button onClick={() => { if (!donateLoading) setShowDonate(false); }} className="text-white/60 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <p className="text-white/60 text-sm">Every peso helps protect and restore a child's life.</p>
            </div>

            {donateSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart size={28} className="text-green-600" fill="currentColor" />
                </div>
                <h3 className="font-display text-xl font-bold text-navy mb-2">Thank You!</h3>
                <p className="text-dark/60 text-sm">Your donation has been recorded. Your generosity makes a real difference.</p>
              </div>
            ) : (
              <form onSubmit={handleDonate} className="p-6 space-y-5">
                {donateError && (
                  <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                    {donateError}
                  </div>
                )}

                {/* Quick amount buttons */}
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">Donation Amount (₱)</label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[500, 1000, 2500, 5000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDonateAmount(amt.toString())}
                        className={`py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                          donateAmount === amt.toString()
                            ? 'bg-navy text-white border-navy'
                            : 'bg-white text-navy border-dark/20 hover:border-navy'
                        }`}
                      >
                        ₱{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={donateAmount}
                    onChange={e => setDonateAmount(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-dark/15 bg-cream focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal text-dark text-sm transition-all"
                    placeholder="Or enter a custom amount"
                  />
                </div>

                {/* Campaign */}
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">Campaign</label>
                  <select
                    value={donateCampaign}
                    onChange={e => setDonateCampaign(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-dark/15 bg-cream focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal text-dark text-sm transition-all"
                  >
                    {CAMPAIGNS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">Message <span className="text-dark/35 font-normal">(optional)</span></label>
                  <textarea
                    value={donateNotes}
                    onChange={e => setDonateNotes(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-dark/15 bg-cream focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal text-dark text-sm transition-all resize-none"
                    placeholder="Leave a message with your donation..."
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDonate(false)}
                    disabled={donateLoading}
                    className="flex-1 py-3 rounded-xl border-2 border-dark/15 text-dark/60 font-semibold text-sm hover:border-dark/30 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={donateLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-navy text-white font-semibold text-sm hover:bg-navy-light transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {donateLoading
                      ? <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      : <><Heart size={15} fill="currentColor" /> Donate Now</>
                    }
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
