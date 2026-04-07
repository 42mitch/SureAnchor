import { useEffect, useState } from 'react';
import { Plus, X, Home, AlertTriangle, CheckCircle, Clock, ChevronRight, Search, Trash2 } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

interface Visitation {
  visitationId: number;
  residentId: number;
  residentCode: string;
  visitDate: string;
  socialWorker: string;
  visitType: string;
  familyCooperation: string;
  safetyConcern: boolean;
  followUpNeeded: boolean;
  outcome: string;
}

interface Resident { residentId: number; internalCode: string; }

const cooperationBadge = (level: string) => {
  const map: Record<string, string> = {
    'Highly Cooperative': 'bg-green-100 text-green-700',
    Cooperative: 'bg-green-100 text-green-700',
    Neutral: 'bg-yellow-100 text-yellow-700',
    Uncooperative: 'bg-red-100 text-red-700',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[level] || 'bg-gray-100 text-gray-600'}`}>{level}</span>;
};

const outcomeBadge = (outcome: string) => {
  const map: Record<string, { cls: string; icon: any }> = {
    Favorable: { cls: 'bg-green-100 text-green-700', icon: CheckCircle },
    Inconclusive: { cls: 'bg-blue-100 text-blue-700', icon: Clock },
    'Needs Improvement': { cls: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
    Unfavorable: { cls: 'bg-red-100 text-red-700', icon: AlertTriangle },
  };
  const item = map[outcome] || { cls: 'bg-gray-100 text-gray-600', icon: Clock };
  const Icon = item.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.cls}`}>
      <Icon size={11} />{outcome}
    </span>
  );
};

function VisitDetailModal({ visit, onClose, onDelete, isAdmin }: {
  visit: Visitation; onClose: () => void; onDelete: () => void; isAdmin: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className={`rounded-t-3xl px-6 py-5 flex items-start justify-between border-b border-dark/8 ${visit.safetyConcern ? 'bg-red-50' : 'bg-cream'}`}>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold bg-white text-navy px-2.5 py-1 rounded-lg shadow-sm">#{visit.visitationId}</span>
              <span className="text-xs font-semibold bg-white text-dark/60 px-2.5 py-1 rounded-lg shadow-sm">{visit.visitType}</span>
              {visit.safetyConcern && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-red-100 text-red-600 px-2.5 py-1 rounded-lg">
                  <AlertTriangle size={11} />Safety Concern
                </span>
              )}
            </div>
            <p className="text-dark/40 text-xs font-medium">Resident {visit.residentCode} · {visit.visitDate}</p>
          </div>
          <button onClick={onClose} className="text-dark/35 hover:text-dark hover:bg-dark/8 rounded-lg p-1.5 transition-colors flex-shrink-0 ml-3"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3 bg-teal/6 rounded-2xl px-4 py-3.5">
            <div className="w-9 h-9 rounded-full bg-teal flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {visit.socialWorker.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="text-xs text-dark/40 font-medium">Social Worker</p>
              <p className="text-sm font-semibold text-navy">{visit.socialWorker}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-cream rounded-2xl px-4 py-4">
              <p className="text-xs font-semibold text-dark/40 uppercase tracking-widest mb-2">Visit Type</p>
              <p className="text-sm font-semibold text-dark">{visit.visitType}</p>
            </div>
            <div className="bg-cream rounded-2xl px-4 py-4">
              <p className="text-xs font-semibold text-dark/40 uppercase tracking-widest mb-2">Visit Date</p>
              <p className="text-sm font-semibold text-dark">{visit.visitDate}</p>
            </div>
            <div className="bg-cream rounded-2xl px-4 py-4">
              <p className="text-xs font-semibold text-dark/40 uppercase tracking-widest mb-2">Family Cooperation</p>
              {cooperationBadge(visit.familyCooperation)}
            </div>
            <div className="bg-cream rounded-2xl px-4 py-4">
              <p className="text-xs font-semibold text-dark/40 uppercase tracking-widests mb-2">Outcome</p>
              {outcomeBadge(visit.outcome)}
            </div>
          </div>
          {visit.safetyConcern && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-4">
              <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 mb-0.5">Safety Concern Flagged</p>
                <p className="text-xs text-red-500">This visit has been flagged for supervisor review.</p>
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-dark/12 text-dark/60 text-sm font-semibold hover:bg-cream transition-colors">Close</button>
            {isAdmin && (
              <button onClick={onDelete} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors">
                <Trash2 size={15} /> Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LogVisitModal({ residents, onClose, onSaved }: {
  residents: Resident[]; onClose: () => void; onSaved: (v: Visitation) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    residentId: '', visitDate: new Date().toISOString().split('T')[0],
    socialWorker: '', visitType: 'Initial Assessment',
    familyCooperationLevel: 'Cooperative', visitOutcome: 'Favorable',
    safetyConcernsNoted: false, followUpNeeded: false,
    purpose: '', observations: '', followUpNotes: '',
  });
  function set(key: string, value: string | boolean) { setForm(prev => ({ ...prev, [key]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch('/api/home-visitations', {
      method: 'POST',
      body: JSON.stringify({ ...form, residentId: parseInt(form.residentId) }),
    });
    if (res.ok) {
      const { visitationId } = await res.json();
      const resident = residents.find(r => r.residentId === parseInt(form.residentId));
      onSaved({
        visitationId, residentId: parseInt(form.residentId),
        residentCode: resident?.internalCode ?? form.residentId,
        visitDate: form.visitDate, socialWorker: form.socialWorker,
        visitType: form.visitType, familyCooperation: form.familyCooperationLevel,
        safetyConcern: form.safetyConcernsNoted, followUpNeeded: form.followUpNeeded,
        outcome: form.visitOutcome,
      });
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="sticky top-0 bg-white rounded-t-3xl px-6 py-5 border-b border-dark/8 flex items-center justify-between z-10">
          <h2 className="font-display text-xl font-bold text-navy">Log New Home Visit</h2>
          <button onClick={onClose} className="text-dark/35 hover:text-dark hover:bg-dark/6 rounded-lg p-1.5 transition-colors"><X size={18} /></button>
        </div>
        <form className="p-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widests mb-2">Resident</label>
              <select required value={form.residentId} onChange={e => set('residentId', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                <option value="">Select resident...</option>
                {residents.map(r => <option key={r.residentId} value={r.residentId}>Resident {r.internalCode}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widests mb-2">Visit Date</label>
              <input type="date" value={form.visitDate} onChange={e => set('visitDate', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widests mb-2">Social Worker</label>
              <input type="text" placeholder="Full name" required value={form.socialWorker} onChange={e => set('socialWorker', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widests mb-2">Visit Type</label>
              <select value={form.visitType} onChange={e => set('visitType', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                {['Initial Assessment','Routine Follow-Up','Reintegration Assessment','Post-Placement Monitoring','Emergency'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widests mb-2">Family Cooperation</label>
              <select value={form.familyCooperationLevel} onChange={e => set('familyCooperationLevel', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                {['Highly Cooperative','Cooperative','Neutral','Uncooperative'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widests mb-2">Outcome</label>
              <select value={form.visitOutcome} onChange={e => set('visitOutcome', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                {['Favorable','Needs Improvement','Unfavorable','Inconclusive'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widests mb-2">Observations</label>
            <textarea rows={3} placeholder="Describe observations..." value={form.observations} onChange={e => set('observations', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none placeholder-dark/25" />
          </div>
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl p-3">
            <input type="checkbox" id="safetyConcern" checked={form.safetyConcernsNoted} onChange={e => set('safetyConcernsNoted', e.target.checked)} className="w-4 h-4 accent-red-500" />
            <label htmlFor="safetyConcern" className="text-sm font-medium text-red-700">Flag safety concern (will alert case supervisor)</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-dark/15 text-dark/60 text-sm font-semibold hover:bg-cream transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary text-sm disabled:opacity-60">{saving ? 'Saving...' : 'Save Visit Log'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function VisitationsPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('Admin') ?? false;

  const [visitations, setVisitations] = useState<Visitation[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVisit, setSelectedVisit] = useState<Visitation | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Visitation | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/home-visitations').then(r => r.ok ? r.json() : []),
      apiFetch('/api/residents').then(r => r.ok ? r.json() : []),
    ]).then(([v, res]) => { setVisitations(v); setResidents(res); }).finally(() => setLoading(false));
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await apiFetch(`/api/home-visitations/${deleteTarget.visitationId}`, { method: 'DELETE' });
    setVisitations(prev => prev.filter(v => v.visitationId !== deleteTarget.visitationId));
    setDeleteTarget(null);
    setSelectedVisit(null);
    setDeleteLoading(false);
  }

  const filtered = visitations.filter(v => !search ||
    v.residentCode.toLowerCase().includes(search.toLowerCase()) ||
    v.socialWorker.toLowerCase().includes(search.toLowerCase()) ||
    v.visitType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-navy">Home Visitations</h1>
            <p className="text-dark/50 text-sm mt-1">{visitations.length} visits recorded</p>
          </div>
          <button onClick={() => setShowLogModal(true)} className="btn-primary flex items-center gap-2 text-sm self-start sm:self-auto">
            <Plus size={16} /> Log New Visit
          </button>
        </div>

        <div className="card py-3.5">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/30" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by resident ID, social worker, or visit type..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-dark/10 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/25 focus:border-teal placeholder-dark/30" />
          </div>
        </div>

        <div className="card overflow-hidden p-0">
          {loading ? (
            <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full border-4 border-teal border-t-transparent animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-dark/40 text-sm">No visitations found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark/8 bg-cream/70">
                    {['#', 'Resident', 'Date', 'Worker', 'Type', 'Outcome', ''].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-dark/40 uppercase tracking-wide px-5 py-3.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((visit, i) => (
                    <tr key={visit.visitationId} onClick={() => setSelectedVisit(visit)}
                      className={`border-b border-dark/5 last:border-0 cursor-pointer hover:bg-teal/4 transition-colors group ${i % 2 !== 0 ? 'bg-cream/30' : ''}`}>
                      <td className="px-5 py-4"><span className="font-mono text-xs font-bold text-dark/40">#{visit.visitationId}</span></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${visit.safetyConcern ? 'bg-red-100' : 'bg-teal/10'}`}>
                            {visit.safetyConcern ? <AlertTriangle size={14} className="text-red-500" /> : <Home size={14} className="text-teal" />}
                          </div>
                          <div>
                            <span className="font-mono text-sm font-semibold text-navy">Resident {visit.residentCode}</span>
                            {visit.safetyConcern && <span className="ml-2 text-xs font-semibold text-red-500">· Safety Concern</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-dark/65">{visit.visitDate}</td>
                      <td className="px-5 py-4 text-sm text-dark/70 whitespace-nowrap">{visit.socialWorker}</td>
                      <td className="px-5 py-4 text-sm text-dark/60 whitespace-nowrap">{visit.visitType}</td>
                      <td className="px-5 py-4">{outcomeBadge(visit.outcome)}</td>
                      <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {isAdmin && (
                            <button onClick={() => setDeleteTarget(visit)} className="p-1.5 rounded-lg text-dark/25 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                              <Trash2 size={14} />
                            </button>
                          )}
                          <ChevronRight size={16} className="text-dark/20 group-hover:text-teal group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="px-5 py-3 border-t border-dark/6 bg-cream/40 flex items-center justify-between">
            <span className="text-xs text-dark/40 font-medium">Showing {filtered.length} of {visitations.length} entries</span>
            <span className="text-xs text-dark/30">{visitations.filter(v => v.safetyConcern).length} safety concern(s) flagged</span>
          </div>
        </div>
      </div>

      {selectedVisit && (
        <VisitDetailModal visit={selectedVisit} onClose={() => setSelectedVisit(null)}
          onDelete={() => { setDeleteTarget(selectedVisit); setSelectedVisit(null); }} isAdmin={isAdmin} />
      )}
      {showLogModal && (
        <LogVisitModal residents={residents} onClose={() => setShowLogModal(false)}
          onSaved={(v) => { setVisitations(prev => [v, ...prev]); setShowLogModal(false); }} />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal
          title="Delete Home Visitation"
          description={`Are you sure you want to permanently delete visitation #${deleteTarget.visitationId} for Resident ${deleteTarget.residentCode}?`}
          onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />
      )}
    </AdminLayout>
  );
}
