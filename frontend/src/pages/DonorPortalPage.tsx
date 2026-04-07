import { useEffect, useState } from 'react';
import { HeartHandshake, TrendingUp, MapPin, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AnchorLogo from '../components/AnchorLogo';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';

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

export default function DonorPortalPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [impact, setImpact] = useState<ImpactAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/donations').then(r => r.ok ? r.json() : []),
      apiFetch('/api/donations/my-impact').then(r => r.ok ? r.json() : []),
    ])
      .then(([d, i]) => { setDonations(d); setImpact(i); })
      .finally(() => setLoading(false));
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const totalGiven = donations.reduce((sum, d) => sum + (d.amount ?? d.estimatedValue ?? 0), 0);
  const totalAllocated = impact.reduce((sum, i) => sum + i.amountAllocated, 0);

  const programTotals = impact.reduce<Record<string, number>>((acc, a) => {
    acc[a.programArea] = (acc[a.programArea] ?? 0) + a.amountAllocated;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-cream font-sans">
      {/* Nav */}
      <nav className="bg-navy text-white px-6 py-4 flex items-center justify-between shadow-md">
        <AnchorLogo size="sm" variant="light" />
        <div className="flex items-center gap-4">
          <span className="text-white/60 text-sm">
            {user?.displayName ?? user?.email}
          </span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-white/60 hover:text-red-300 transition-colors text-sm"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome header */}
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">
            Welcome back{user?.displayName ? `, ${user.displayName}` : ''}
          </h1>
          <p className="text-dark/50 mt-1">Your contribution is making a real difference.</p>
        </div>

        {/* Summary cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Given', value: `₱${totalGiven.toLocaleString()}`, icon: HeartHandshake, color: 'text-gold', bg: 'bg-gold/10' },
            { label: 'Donations Made', value: donations.length.toString(), icon: TrendingUp, color: 'text-teal', bg: 'bg-teal/10' },
            { label: 'Safehouses Supported', value: new Set(impact.map(i => i.name)).size.toString(), icon: MapPin, color: 'text-navy', bg: 'bg-navy/8' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl shadow-sm border border-dark/6 p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon size={22} className={color} strokeWidth={1.8} />
              </div>
              <div>
                <div className={`font-display text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-sm text-dark/55 font-medium">{label}</div>
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
            {/* Your donation history */}
            <div className="bg-white rounded-2xl shadow-sm border border-dark/6 overflow-hidden">
              <div className="px-6 py-5 border-b border-dark/8">
                <h2 className="font-display text-xl font-semibold text-navy">Your Donation History</h2>
              </div>
              {donations.length === 0 ? (
                <div className="px-6 py-12 text-center text-dark/40 text-sm">No donations recorded yet.</div>
              ) : (
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
                      {donations.map((d, i) => (
                        <tr key={d.donationId} className={`border-b border-dark/5 last:border-0 ${i % 2 !== 0 ? 'bg-cream/30' : ''}`}>
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
              )}
            </div>

            {/* Impact allocations */}
            {impact.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-dark/6 overflow-hidden">
                <div className="px-6 py-5 border-b border-dark/8 flex items-center justify-between">
                  <h2 className="font-display text-xl font-semibold text-navy">Where Your Giving Goes</h2>
                  <span className="text-sm text-dark/40 font-medium">₱{totalAllocated.toLocaleString()} allocated</span>
                </div>

                {/* Program breakdown */}
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
                          <div
                            className="bg-teal h-1.5 rounded-full transition-all"
                            style={{ width: `${(amt / totalAllocated) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Allocation table */}
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
                      {impact.map((a, i) => (
                        <tr key={a.allocationId} className={`border-b border-dark/5 last:border-0 ${i % 2 !== 0 ? 'bg-cream/30' : ''}`}>
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
              </div>
            )}
          </>
        )}

        <footer className="text-center text-xs text-dark/30 pb-4">
          © 2024 SureAnchor · "We have this hope as an anchor for the soul." — Hebrews 6:19
        </footer>
      </div>
    </div>
  );
}
