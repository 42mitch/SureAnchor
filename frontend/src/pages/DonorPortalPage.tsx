import { useEffect, useState } from 'react';
import { HeartHandshake, TrendingUp, Clock, CalendarCheck, Heart, X, Globe } from 'lucide-react';
import PublicLayout from '../layouts/PublicLayout';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import ValidationModal from '../components/ValidationModal';
import { useListPagination } from '../hooks/useListPagination';
import ListPaginationBar from '../components/ListPaginationBar';
import { CurrencyDisplay, CurrencyDisplayDetailed } from '../components/CurrencyDisplay';
import { COUNTRIES } from '../utils/countries';
import UnconfirmedEmailBanner from '../components/UnconfirmedEmailBanner';

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
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [impact, setImpact] = useState<ImpactAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  // Welcome modal for Google OAuth users with no country set
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeCountry, setWelcomeCountry] = useState('');
  const [savingCountry, setSavingCountry] = useState(false);

  const [showDonate, setShowDonate] = useState(false);
  const [donateAmount, setDonateAmount] = useState('');
  const [donateCampaign, setDonateCampaign] = useState('General Donation');
  const [donateNotes, setDonateNotes] = useState('');
  const [donateLoading, setDonateLoading] = useState(false);
  const [donateSuccess, setDonateSuccess] = useState(false);
  const [donateError, setDonateError] = useState('');
  const [validationMsg, setValidationMsg] = useState('');

  function loadData() {
    setLoading(true);
    Promise.all([
      apiFetch('/api/donations').then(r => r.ok ? r.json() : []),
      apiFetch('/api/donations/my-impact').then(r => r.ok ? r.json() : []),
    ])
      .then(([d, i]) => { setDonations(d); setImpact(i); })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadData();
    // Check if country is missing — show welcome modal if so
    apiFetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (!data?.country) setShowWelcome(true); })
      .catch(() => {});
  }, []);

  async function handleSaveCountry() {
    setSavingCountry(true);
    await apiFetch('/api/profile/country', {
      method: 'PATCH',
      body: JSON.stringify({ country: welcomeCountry || null }),
    });
    setSavingCountry(false);
    setShowWelcome(false);
  }

  async function handleDonate(e: React.FormEvent) {
    e.preventDefault();
    const formEl = e.currentTarget as HTMLFormElement;
    if (!formEl.checkValidity()) { formEl.reportValidity(); return; }
    setDonateError('');
    const amount = parseFloat(donateAmount);
    if (!amount || amount <= 0) {
      setValidationMsg('Please enter a donation amount greater than 0.');
      return;
    }
    setDonateLoading(true);
    try {
      const res = await apiFetch('/api/donations/give', {
        method: 'POST',
        body: JSON.stringify({ amount, campaignName: donateCampaign, notes: donateNotes || null }),
      });
      if (!res.ok) {
        const d = await res.json();
        setDonateError(d.error ?? d.message ?? 'Something went wrong.');
        return;
      }
      setDonateSuccess(true);
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

  const totalGiven    = donations.reduce((sum, d) => sum + (d.amount ?? d.estimatedValue ?? 0), 0);
  const totalAllocated = impact.reduce((sum, i) => sum + i.amountAllocated, 0);

  function formatDuration(fromDate: Date, toDate: Date = new Date()): string {
    const days = Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
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
  const lastDonationDate  = sortedDates[sortedDates.length - 1];
  const timeAsDonor   = firstDonationDate ? formatDuration(firstDonationDate) : '—';
  const timeSinceLast = lastDonationDate  ? formatDuration(lastDonationDate)  : '—';

  const programTotals = impact.reduce<Record<string, number>>((acc, a) => {
    acc[a.programArea] = (acc[a.programArea] ?? 0) + a.amountAllocated;
    return acc;
  }, {});

  const donPag    = useListPagination(donations, [donations.length]);
  const impactPag = useListPagination(impact,    [impact.length]);

  return (
    <PublicLayout>
      {user && !user.emailConfirmed && <UnconfirmedEmailBanner />}
      {validationMsg && <ValidationModal message={validationMsg} onClose={() => setValidationMsg('')} />}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">

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
            { label: 'Total Given',         value: totalGiven,           icon: HeartHandshake, color: 'text-gold',      bg: 'bg-gold/10',  isCurrency: true },
            { label: 'Donations Made',       value: donations.length,     icon: TrendingUp,     color: 'text-teal',      bg: 'bg-teal/10' },
            { label: 'Time as a Donor',      value: timeAsDonor,          icon: Clock,          color: 'text-navy',      bg: 'bg-navy/8' },
            { label: 'Since Last Donation',  value: timeSinceLast,        icon: CalendarCheck,  color: 'text-teal-dark', bg: 'bg-teal/8' },
          ].map(({ label, value, icon: Icon, color, bg, isCurrency }) => (
            <div key={label} className="card flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                <Icon size={22} className={color} strokeWidth={1.8} />
              </div>
              <div className="min-w-0">
                {isCurrency ? (
                  <CurrencyDisplay
                    php={value as number}
                    usdClassName={`font-display text-xl font-bold leading-tight ${color}`}
                    phpClassName="text-xs text-dark/30 font-normal"
                  />
                ) : (
                  <div className={`font-display text-xl font-bold leading-tight ${color}`}>{value}</div>
                )}
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
            <div className="card overflow-hidden p-0">
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
                                ? <CurrencyDisplayDetailed php={d.amount} />
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
                    page={donPag.page} pageCount={donPag.pageCount} pageSize={donPag.pageSize}
                    setPage={donPag.setPage} setPageSize={donPag.setPageSize}
                    total={donPag.total} startIndex={donPag.startIndex} endIndex={donPag.endIndex}
                  />
                </>
              )}
            </div>

            {/* Impact allocations */}
            {impact.length > 0 && (
              <div className="card overflow-hidden p-0">
                <div className="px-6 py-5 border-b border-dark/8 flex items-center justify-between">
                  <h2 className="font-display text-xl font-semibold text-navy">Where Your Giving Goes</h2>
                  <CurrencyDisplay
                    php={totalAllocated}
                    className="items-end"
                    usdClassName="text-sm font-semibold text-navy"
                    phpClassName="text-xs text-dark/25 font-normal"
                  />
                </div>
                <div className="px-6 py-5 border-b border-dark/6">
                  <p className="text-xs font-semibold text-dark/40 uppercase tracking-wide mb-4">By Program Area</p>
                  <div className="space-y-3">
                    {Object.entries(programTotals).map(([area, amt]) => (
                      <div key={area}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-dark/70">{area}</span>
                          <CurrencyDisplayDetailed php={amt} className="items-end" />
                        </div>
                        <div className="w-full bg-dark/6 rounded-full h-1.5">
                          <div className="bg-teal h-1.5 rounded-full transition-all"
                            style={{ width: `${(amt / totalAllocated) * 100}%` }} />
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
                          <td className="px-5 py-3.5">
                            <CurrencyDisplayDetailed php={a.amountAllocated} usdClassName="text-sm font-semibold text-teal" />
                          </td>
                          <td className="px-5 py-3.5 text-sm text-dark/50">{a.allocationDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <ListPaginationBar
                  page={impactPag.page} pageCount={impactPag.pageCount} pageSize={impactPag.pageSize}
                  setPage={impactPag.setPage} setPageSize={impactPag.setPageSize}
                  total={impactPag.total} startIndex={impactPag.startIndex} endIndex={impactPag.endIndex}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Welcome modal for Google OAuth users */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm animate-fade-in overflow-hidden">
            <div className="bg-gradient-to-r from-navy to-teal-dark px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">Welcome to SureAnchor!</h2>
                <button onClick={() => setShowWelcome(false)} className="text-white/60 hover:text-white">
                  <X size={18} />
                </button>
              </div>
              <p className="text-white/70 text-sm mt-1">
                {user?.displayName ? `Great to have you, ${user.displayName.split(' ')[0]}.` : 'Great to have you.'} One quick thing:
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark mb-2 flex items-center gap-2">
                  <Globe size={14} className="text-dark/40" /> Where are you joining us from?
                </label>
                <select
                  value={welcomeCountry} onChange={e => setWelcomeCountry(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
                >
                  <option value="">Select your country…</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowWelcome(false)}
                  className="flex-1 py-2.5 rounded-xl border border-dark/15 text-dark/60 text-sm font-semibold hover:bg-cream transition-colors">
                  Skip
                </button>
                <button onClick={handleSaveCountry} disabled={savingCountry || !welcomeCountry}
                  className="flex-1 py-2.5 rounded-xl bg-teal text-white text-sm font-semibold hover:bg-teal-dark transition-colors disabled:opacity-50">
                  {savingCountry ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Donate Modal */}
      {showDonate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => { if (!donateLoading) setShowDonate(false); }} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in overflow-hidden">
            <div className="bg-gradient-to-r from-navy to-teal-dark p-6 text-white">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Heart size={20} className="text-gold" fill="currentColor" />
                  <h2 className="font-display text-xl font-bold">Make a Donation</h2>
                </div>
                <button onClick={() => { if (!donateLoading) setShowDonate(false); }}
                  className="text-white/60 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <p className="text-white/60 text-sm">Every dollar helps protect and restore a child's life.</p>
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
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">Donation Amount (USD)</label>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { usd: 10, impact: 'Fund a trauma counseling session' },
                      { usd: 20, impact: 'Feed a child for a full week' },
                      { usd: 50, impact: 'Provide one month of education' },
                      { usd: 85, impact: 'Cover one month of shelter and food' },
                    ].map(({ usd, impact }) => {
                      const phpAmt = Math.round(usd * 58.5);
                      return (
                        <button key={usd} type="button"
                          onClick={() => setDonateAmount(phpAmt.toString())}
                          className={`p-3 rounded-xl text-left border-2 transition-all ${
                            donateAmount === phpAmt.toString()
                              ? 'bg-navy text-white border-navy'
                              : 'bg-white text-navy border-dark/20 hover:border-navy hover:shadow-sm'
                          }`}>
                          <div className="font-bold text-lg mb-0.5">${usd}</div>
                          <div className={`text-[11px] leading-tight ${
                            donateAmount === phpAmt.toString() ? 'text-white/80' : 'text-dark/60'
                          }`}>{impact}</div>
                          <div className={`text-[10px] mt-1 ${
                            donateAmount === phpAmt.toString() ? 'text-white/50' : 'text-dark/40'
                          }`}>₱{phpAmt.toLocaleString()}</div>
                        </button>
                      );
                    })}
                  </div>
                  <input type="number" min="1" step="1" value={donateAmount}
                    onChange={e => setDonateAmount(e.target.value)} required
                    className="w-full px-4 py-3 rounded-xl border border-dark/15 bg-cream focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal text-dark text-sm transition-all"
                    placeholder="Or enter a custom amount in PHP" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">Campaign</label>
                  <select value={donateCampaign} onChange={e => setDonateCampaign(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-dark/15 bg-cream focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal text-dark text-sm transition-all">
                    {CAMPAIGNS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark mb-2">
                    Message <span className="text-dark/35 font-normal">(optional)</span>
                  </label>
                  <textarea value={donateNotes} onChange={e => setDonateNotes(e.target.value)} rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-dark/15 bg-cream focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal text-dark text-sm transition-all resize-none"
                    placeholder="Leave a message with your donation..." />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowDonate(false)} disabled={donateLoading}
                    className="flex-1 py-3 rounded-xl border-2 border-dark/15 text-dark/60 font-semibold text-sm hover:border-dark/30 transition-all disabled:opacity-50">
                    Cancel
                  </button>
                  <button type="submit" disabled={donateLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-navy text-white font-semibold text-sm hover:bg-navy-light transition-all disabled:opacity-60 disabled:cursor-not-allowed">
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
    </PublicLayout>
  );
}