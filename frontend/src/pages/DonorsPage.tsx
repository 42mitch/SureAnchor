import { useEffect, useState } from 'react';
import {
  HeartHandshake, Users, Sparkles, Plus, X, Trash2, Search,
  Mail, Phone, MapPin, Globe, Calendar, TrendingUp, Tag, RefreshCw, Pencil
} from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { useListPagination } from '../hooks/useListPagination';
import ListPaginationBar from '../components/ListPaginationBar';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Supporter {
  supporterId: number;
  displayName: string;
  supporterType: string;
  status: string;
  totalDonated: number;
  lastDonationDate: string | null;
  country: string | null;
  email: string | null;
}

interface SupporterDetail {
  supporterId: number;
  displayName: string;
  supporterType: string;
  firstName: string | null;
  lastName: string | null;
  organizationName: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  region: string | null;
  relationshipType: string | null;
  acquisitionChannel: string | null;
  status: string;
  firstDonationDate: string | null;
  createdAt: string;
  donations: DonationRow[];
}

interface DonationRow {
  donationId: number;
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

// ─── Badges ───────────────────────────────────────────────────────────────────

const typeBadge = (type: string) => {
  const map: Record<string, string> = {
    MonetaryDonor: 'bg-gold/15 text-yellow-700',
    InKindDonor: 'bg-purple-100 text-purple-700',
    Volunteer: 'bg-teal/10 text-teal-dark',
    SkillsContributor: 'bg-blue-100 text-blue-700',
    SocialMediaAdvocate: 'bg-pink-100 text-pink-700',
    PartnerOrganization: 'bg-navy/8 text-navy',
  };
  const label: Record<string, string> = {
    MonetaryDonor: 'Monetary Donor', InKindDonor: 'In-Kind',
    Volunteer: 'Volunteer', SkillsContributor: 'Skills',
    SocialMediaAdvocate: 'Social Media', PartnerOrganization: 'Partner Org',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[type] || 'bg-gray-100 text-gray-600'}`}>
      {label[type] || type}
    </span>
  );
};

// ─── Edit Donation Modal (Admin) ──────────────────────────────────────────────

function EditDonationModal({
  donation,
  supporterId,
  onClose,
  onSaved,
}: {
  donation: DonationRow;
  supporterId: number;
  onClose: () => void;
  onSaved: (d: DonationRow) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    donationType: donation.donationType,
    donationDate: donation.donationDate,
    isRecurring: donation.isRecurring,
    campaignName: donation.campaignName ?? '',
    channelSource: donation.channelSource ?? '',
    currencyCode: donation.currencyCode || 'PHP',
    amount: donation.amount != null ? String(donation.amount) : '',
    estimatedValue: donation.estimatedValue != null ? String(donation.estimatedValue) : '',
    impactUnit: donation.impactUnit ?? '',
    notes: donation.notes ?? '',
  });

  function set(key: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const amount = form.amount.trim() === '' ? null : parseFloat(form.amount);
    const estimatedValue = form.estimatedValue.trim() === '' ? null : parseFloat(form.estimatedValue);
    const res = await apiFetch(`/api/donations/${donation.donationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        supporterId,
        donationType: form.donationType,
        donationDate: form.donationDate,
        isRecurring: form.isRecurring,
        campaignName: form.campaignName.trim() || null,
        channelSource: form.channelSource.trim() || null,
        currencyCode: form.currencyCode.trim() || 'PHP',
        amount: Number.isFinite(amount as number) ? amount : null,
        estimatedValue: Number.isFinite(estimatedValue as number) ? estimatedValue : null,
        impactUnit: form.impactUnit.trim() || null,
        notes: form.notes.trim() || null,
      }),
    });
    if (res.ok) {
      onSaved({
        ...donation,
        donationType: form.donationType,
        donationDate: form.donationDate,
        isRecurring: form.isRecurring,
        campaignName: form.campaignName.trim() || null,
        channelSource: form.channelSource.trim() || null,
        currencyCode: form.currencyCode.trim() || 'PHP',
        amount: Number.isFinite(amount as number) ? amount : null,
        estimatedValue: Number.isFinite(estimatedValue as number) ? estimatedValue : null,
        impactUnit: form.impactUnit.trim() || null,
        notes: form.notes.trim() || null,
      });
      onClose();
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="sticky top-0 bg-white rounded-t-3xl px-6 py-5 border-b border-dark/8 flex items-center justify-between z-10">
          <div>
            <h2 className="font-display text-xl font-bold text-navy">Edit donation</h2>
            <p className="text-xs text-dark/40 mt-0.5">Donation #{donation.donationId}</p>
          </div>
          <button type="button" onClick={onClose} className="text-dark/35 hover:text-dark hover:bg-dark/6 rounded-lg p-1.5 transition-colors">
            <X size={18} />
          </button>
        </div>
        <form className="p-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Type</label>
              <select value={form.donationType} onChange={e => set('donationType', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                {['Monetary', 'InKind', 'Time'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Date</label>
              <input type="date" required value={form.donationDate} onChange={e => set('donationDate', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-center gap-2 text-sm text-dark/70 cursor-pointer">
                <input type="checkbox" checked={form.isRecurring} onChange={e => set('isRecurring', e.target.checked)} className="w-4 h-4 accent-teal" />
                Recurring donation
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Campaign name</label>
              <input value={form.campaignName} onChange={e => set('campaignName', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Channel</label>
              <select value={form.channelSource} onChange={e => set('channelSource', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                <option value="">—</option>
                {['Website', 'SocialMedia', 'Event', 'Direct', 'WordOfMouth', 'PartnerReferral', 'Church'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Currency</label>
              <input value={form.currencyCode} onChange={e => set('currencyCode', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Amount</label>
              <input type="number" step="0.01" min="0" value={form.amount} onChange={e => set('amount', e.target.value)}
                placeholder="Leave empty for in-kind/time"
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Est. value (PHP)</label>
              <input type="number" step="0.01" min="0" value={form.estimatedValue} onChange={e => set('estimatedValue', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Impact unit</label>
              <input value={form.impactUnit} onChange={e => set('impactUnit', e.target.value)} placeholder="e.g. pesos, hours"
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/30" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Notes</label>
              <textarea rows={3} value={form.notes} onChange={e => set('notes', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-dark/15 text-dark/60 text-sm font-semibold hover:bg-cream transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary text-sm disabled:opacity-60">{saving ? 'Saving...' : 'Save changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Donor Detail Modal ───────────────────────────────────────────────────────

function DonorDetailModal({
  supporterId,
  isAdmin,
  onClose,
  onDonationsUpdated,
}: {
  supporterId: number;
  isAdmin: boolean;
  onClose: () => void;
  onDonationsUpdated?: () => void;
}) {
  const [detail, setDetail] = useState<SupporterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingDonation, setEditingDonation] = useState<DonationRow | null>(null);

  useEffect(() => {
    apiFetch(`/api/supporters/${supporterId}`)
      .then(r => r.ok ? r.json() : null)
      .then(setDetail)
      .finally(() => setLoading(false));
  }, [supporterId]);

  const donationList = detail?.donations ?? [];
  const donPag = useListPagination(donationList, [supporterId, donationList.length]);

  const totalGiven = detail?.donations.reduce((sum, d) => sum + (d.amount ?? d.estimatedValue ?? 0), 0) ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">

        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl border-b border-dark/8 z-10">
          <div className="bg-gradient-to-r from-navy to-teal-dark rounded-t-3xl px-6 py-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                  {detail?.displayName.charAt(0) ?? '?'}
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">
                    {loading ? 'Loading...' : detail?.displayName}
                  </h2>
                  {detail && (
                    <div className="flex items-center gap-2 mt-1">
                      {typeBadge(detail.supporterType)}
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${detail.status === 'Active' ? 'bg-green-400/20 text-green-200' : 'bg-white/20 text-white/60'}`}>
                        {detail.status}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="text-white/60 hover:text-white transition-colors mt-1">
                <X size={20} />
              </button>
            </div>

            {/* Summary stats */}
            {detail && (
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: 'Total Given', value: `₱${totalGiven.toLocaleString()}`, icon: HeartHandshake },
                  { label: 'Donations', value: detail.donations.length.toString(), icon: TrendingUp },
                  { label: 'Since', value: detail.firstDonationDate ?? '—', icon: Calendar },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-white/10 rounded-xl px-3 py-2.5 text-center">
                    <Icon size={14} className="text-white/60 mx-auto mb-1" />
                    <div className="font-display text-base font-bold text-white">{value}</div>
                    <div className="text-xs text-white/50">{label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-4 border-teal border-t-transparent animate-spin" />
          </div>
        ) : !detail ? (
          <div className="py-12 text-center text-dark/40 text-sm">Could not load donor details.</div>
        ) : (
          <div className="p-6 space-y-6">

            {/* Contact & Info */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                detail.email         && { icon: Mail,      label: 'Email',        value: detail.email },
                detail.phone         && { icon: Phone,     label: 'Phone',        value: detail.phone },
                detail.country       && { icon: Globe,     label: 'Country',      value: detail.country },
                detail.region        && { icon: MapPin,    label: 'Region',       value: detail.region },
                detail.organizationName && { icon: Users,  label: 'Organization', value: detail.organizationName },
                detail.relationshipType && { icon: Tag,    label: 'Relationship', value: detail.relationshipType },
                detail.acquisitionChannel && { icon: RefreshCw, label: 'How They Found Us', value: detail.acquisitionChannel },
                { icon: Calendar, label: 'Supporter Since', value: detail.createdAt },
              ].filter(Boolean).map((item: any) => (
                <div key={item.label} className="flex items-start gap-3 bg-cream/60 rounded-xl px-4 py-3">
                  <div className="w-7 h-7 rounded-lg bg-navy/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <item.icon size={13} className="text-navy" />
                  </div>
                  <div>
                    <p className="text-xs text-dark/40 font-semibold uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm font-semibold text-dark mt-0.5">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Donation History */}
            <div>
              <h3 className="font-display text-base font-semibold text-navy mb-3 flex items-center gap-2">
                <HeartHandshake size={16} className="text-gold" />
                Donation History
                <span className="text-xs font-normal text-dark/40 bg-dark/6 px-2 py-0.5 rounded-full ml-1">
                  {detail.donations.length} {detail.donations.length === 1 ? 'donation' : 'donations'}
                </span>
              </h3>

              {detail.donations.length === 0 ? (
                <div className="bg-cream/60 rounded-2xl py-8 text-center text-dark/40 text-sm">
                  No donations recorded yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {donPag.pageItems.map((d) => (
                    <div
                      key={d.donationId}
                      role={isAdmin ? 'button' : undefined}
                      tabIndex={isAdmin ? 0 : undefined}
                      onClick={() => isAdmin && setEditingDonation(d)}
                      onKeyDown={e => {
                        if (!isAdmin) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setEditingDonation(d);
                        }
                      }}
                      className={`bg-cream/60 rounded-xl px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                        isAdmin ? 'cursor-pointer hover:bg-cream hover:ring-2 hover:ring-teal/25 transition-all' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center flex-shrink-0">
                          <HeartHandshake size={14} className="text-gold" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-dark">{d.campaignName ?? 'General Donation'}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${d.donationType === 'Monetary' ? 'bg-gold/15 text-yellow-700' : 'bg-purple-100 text-purple-700'}`}>
                              {d.donationType}
                            </span>
                            {d.isRecurring && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-teal/10 text-teal-dark">
                                Recurring
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-xs text-dark/40">{d.donationDate}</span>
                            {d.channelSource && <span className="text-xs text-dark/30">via {d.channelSource}</span>}
                          </div>
                          {d.notes && <p className="text-xs text-dark/50 italic mt-1">"{d.notes}"</p>}
                          {isAdmin && (
                            <p className="text-xs text-teal font-semibold mt-1.5 flex items-center gap-1">
                              <Pencil size={12} /> Click to edit
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {d.amount != null ? (
                          <span className="font-display text-lg font-bold text-navy">
                            {d.currencyCode} {d.amount.toLocaleString()}
                          </span>
                        ) : d.estimatedValue != null ? (
                          <span className="text-sm font-semibold text-dark/60">
                            ~₱{d.estimatedValue.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-sm text-dark/30 italic">In-kind / Time</span>
                        )}
                      </div>
                    </div>
                  ))}
                  <ListPaginationBar
                    page={donPag.page}
                    pageCount={donPag.pageCount}
                    pageSize={donPag.pageSize}
                    setPage={donPag.setPage}
                    setPageSize={donPag.setPageSize}
                    total={donPag.total}
                    startIndex={donPag.startIndex}
                    endIndex={donPag.endIndex}
                    className="rounded-xl border border-dark/8 !bg-cream/50"
                  />

                  {/* Total row */}
                  {totalGiven > 0 && (
                    <div className="bg-navy/5 rounded-xl px-4 py-3 flex items-center justify-between border border-navy/10">
                      <span className="text-sm font-semibold text-navy">Total Contributed</span>
                      <span className="font-display text-xl font-bold text-navy">₱{totalGiven.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {editingDonation && detail && (
        <EditDonationModal
          donation={editingDonation}
          supporterId={detail.supporterId}
          onClose={() => setEditingDonation(null)}
          onSaved={updated => {
            setDetail(prev =>
              prev
                ? {
                    ...prev,
                    donations: prev.donations.map(x => (x.donationId === updated.donationId ? updated : x)),
                  }
                : null
            );
            onDonationsUpdated?.();
          }}
        />
      )}
    </div>
  );
}

// ─── Add Supporter Modal ──────────────────────────────────────────────────────

function AddSupporterModal({ onClose, onSaved }: { onClose: () => void; onSaved: (s: Supporter) => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: '', supporterType: 'MonetaryDonor', firstName: '', lastName: '',
    organizationName: '', email: '', phone: '', country: '', status: 'Active', acquisitionChannel: '',
  });
  function set(key: string, value: string) { setForm(prev => ({ ...prev, [key]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch('/api/supporters', { method: 'POST', body: JSON.stringify(form) });
    if (res.ok) {
      const { supporterId } = await res.json();
      onSaved({ supporterId, displayName: form.displayName, supporterType: form.supporterType,
        status: form.status, totalDonated: 0, lastDonationDate: null, country: form.country || null, email: form.email || null });
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="sticky top-0 bg-white rounded-t-3xl px-6 py-5 border-b border-dark/8 flex items-center justify-between z-10">
          <h2 className="font-display text-xl font-bold text-navy">Add Supporter</h2>
          <button onClick={onClose} className="text-dark/35 hover:text-dark hover:bg-dark/6 rounded-lg p-1.5 transition-colors"><X size={18} /></button>
        </div>
        <form className="p-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-wide mb-2">Display Name *</label>
              <input type="text" required value={form.displayName} onChange={e => set('displayName', e.target.value)} placeholder="e.g. Marisol Foundation"
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-wide mb-2">First Name</label>
              <input type="text" value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Optional"
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-wide mb-2">Last Name</label>
              <input type="text" value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Optional"
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-wide mb-2">Organization</label>
              <input type="text" value={form.organizationName} onChange={e => set('organizationName', e.target.value)} placeholder="Optional"
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-wide mb-2">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="Optional"
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-wide mb-2">Country</label>
              <input type="text" value={form.country} onChange={e => set('country', e.target.value)} placeholder="Philippines"
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-wide mb-2">Supporter Type</label>
              <select value={form.supporterType} onChange={e => set('supporterType', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                {['MonetaryDonor','InKindDonor','Volunteer','SkillsContributor','SocialMediaAdvocate','PartnerOrganization'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-wide mb-2">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                <option>Active</option><option>Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-wide mb-2">Acquisition Channel</label>
              <select value={form.acquisitionChannel} onChange={e => set('acquisitionChannel', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                <option value="">Select...</option>
                {['Website','SocialMedia','Event','WordOfMouth','PartnerReferral','Church'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-dark/15 text-dark/60 text-sm font-semibold hover:bg-cream transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary text-sm disabled:opacity-60">{saving ? 'Saving...' : 'Add Supporter'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DonorsPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('Admin') ?? false;

  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supporter | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    apiFetch('/api/supporters').then(r => r.ok ? r.json() : []).then(setSupporters).finally(() => setLoading(false));
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await apiFetch(`/api/supporters/${deleteTarget.supporterId}`, { method: 'DELETE' });
    setSupporters(prev => prev.filter(s => s.supporterId !== deleteTarget.supporterId));
    setDeleteTarget(null);
    setDeleteLoading(false);
  }

  const filtered = supporters.filter(s => !search ||
    s.displayName.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const donorsPag = useListPagination(filtered, [search]);

  const totalDonors = supporters.length;
  const activeDonors = supporters.filter(s => s.status === 'Active').length;
  const totalDonated = supporters.reduce((sum, s) => sum + s.totalDonated, 0);

  return (
    <AdminLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-navy">Donors & Contributions</h1>
            <p className="text-dark/50 text-sm mt-1">Supporters and partner organizations</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center gap-2 text-sm self-start sm:self-auto">
            <Plus size={16} /> Add Supporter
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Users, label: 'Total Supporters', value: totalDonors.toString(), color: 'text-navy', bg: 'bg-navy/8' },
            { icon: Sparkles, label: 'Active', value: activeDonors.toString(), color: 'text-teal', bg: 'bg-teal/10' },
            { icon: HeartHandshake, label: 'Total Donated', value: `₱${totalDonated.toLocaleString()}`, color: 'text-gold', bg: 'bg-gold/10' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="card flex items-center gap-4">
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

        {/* Search */}
        <div className="card py-3.5">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/30" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-dark/10 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/25 focus:border-teal placeholder-dark/30" />
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden p-0">
          {loading ? (
            <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full border-4 border-teal border-t-transparent animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-dark/40 text-sm">No supporters found.</div>
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark/8 bg-cream/70">
                    {['Name', 'Type', 'Status', 'Total Contributed', 'Last Donation', 'Country', ''].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-dark/40 uppercase tracking-wide px-5 py-3.5 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {donorsPag.pageItems.map((s, i) => (
                    <tr
                      key={s.supporterId}
                      onClick={() => setSelectedId(s.supporterId)}
                      className={`border-b border-dark/5 hover:bg-teal/5 transition-colors last:border-0 cursor-pointer ${(donorsPag.startIndex + i) % 2 !== 0 ? 'bg-cream/30' : ''}`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-navy/8 flex items-center justify-center text-navy text-xs font-bold flex-shrink-0">
                            {s.displayName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-dark hover:text-teal transition-colors">{s.displayName}</p>
                            {s.email && <p className="text-xs text-dark/40">{s.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">{typeBadge(s.supporterType)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {s.totalDonated > 0
                          ? <span className="text-sm font-semibold text-navy">₱{s.totalDonated.toLocaleString()}</span>
                          : <span className="text-sm text-dark/30 italic">In-kind / Volunteer</span>
                        }
                      </td>
                      <td className="px-5 py-3.5 text-sm text-dark/60">{s.lastDonationDate ?? '—'}</td>
                      <td className="px-5 py-3.5 text-sm text-dark/60">{s.country ?? '—'}</td>
                      <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteTarget(s)}
                            className="p-1.5 rounded-lg text-dark/25 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ListPaginationBar
              page={donorsPag.page}
              pageCount={donorsPag.pageCount}
              pageSize={donorsPag.pageSize}
              setPage={donorsPag.setPage}
              setPageSize={donorsPag.setPageSize}
              total={donorsPag.total}
              startIndex={donorsPag.startIndex}
              endIndex={donorsPag.endIndex}
              trailing={
                <p className="text-xs text-dark/30 max-w-xs text-right">
                  Click a row for profile & donation history
                </p>
              }
            />
            </>
          )}
        </div>
      </div>

      {/* Donor detail modal */}
      {selectedId !== null && (
        <DonorDetailModal
          supporterId={selectedId}
          isAdmin={isAdmin}
          onClose={() => setSelectedId(null)}
          onDonationsUpdated={() => {
            apiFetch('/api/supporters').then(r => (r.ok ? r.json() : [])).then(setSupporters);
          }}
        />
      )}

      {showAddModal && (
        <AddSupporterModal
          onClose={() => setShowAddModal(false)}
          onSaved={(s) => { setSupporters(prev => [...prev, s]); setShowAddModal(false); }}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          title="Delete Supporter"
          description={`Are you sure you want to permanently delete "${deleteTarget.displayName}"? All associated donations will also be removed.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </AdminLayout>
  );
}
