import { useEffect, useState } from 'react';
import { HeartHandshake, Users, Sparkles, Plus, X, Trash2, Search } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

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
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widests mb-2">Display Name *</label>
              <input type="text" required value={form.displayName} onChange={e => set('displayName', e.target.value)} placeholder="e.g. Marisol Foundation"
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widests mb-2">First Name</label>
              <input type="text" value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Optional"
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widests mb-2">Last Name</label>
              <input type="text" value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Optional"
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widests mb-2">Organization</label>
              <input type="text" value={form.organizationName} onChange={e => set('organizationName', e.target.value)} placeholder="Optional"
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widests mb-2">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="Optional"
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widests mb-2">Country</label>
              <input type="text" value={form.country} onChange={e => set('country', e.target.value)} placeholder="Philippines"
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widests mb-2">Supporter Type</label>
              <select value={form.supporterType} onChange={e => set('supporterType', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                {['MonetaryDonor','InKindDonor','Volunteer','SkillsContributor','SocialMediaAdvocate','PartnerOrganization'].map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widests mb-2">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                <option>Active</option><option>Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widests mb-2">Acquisition Channel</label>
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

export default function DonorsPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('Admin') ?? false;

  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
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
                  {filtered.map((s, i) => (
                    <tr key={s.supporterId} className={`border-b border-dark/5 hover:bg-teal/3 transition-colors last:border-0 ${i % 2 !== 0 ? 'bg-cream/30' : ''}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-navy/8 flex items-center justify-center text-navy text-xs font-bold flex-shrink-0">
                            {s.displayName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-dark">{s.displayName}</p>
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
                      <td className="px-5 py-3.5">
                        {isAdmin && (
                          <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded-lg text-dark/25 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddSupporterModal onClose={() => setShowAddModal(false)}
          onSaved={(s) => { setSupporters(prev => [...prev, s]); setShowAddModal(false); }} />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal
          title="Delete Supporter"
          description={`Are you sure you want to permanently delete "${deleteTarget.displayName}"? All associated donations will also be removed.`}
          onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />
      )}
    </AdminLayout>
  );
}
