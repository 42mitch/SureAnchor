import { useEffect, useState } from 'react';
import { Plus, X, Home, AlertTriangle, CheckCircle, Clock, ChevronRight, Search, Trash2, Calendar, BookOpen } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import ValidationModal from '../components/ValidationModal';
import { useListPagination } from '../hooks/useListPagination';
import ListPaginationBar from '../components/ListPaginationBar';

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface VisitationDetail extends Visitation {
  purpose?: string;
  observations?: string;
  locationVisited?: string;
  familyMembersPresent?: string;
  followUpNotes?: string;
}

interface Resident { residentId: number; internalCode: string; }

interface InterventionPlan {
  planId: number;
  residentId: number;
  planCategory: string;
  planDescription?: string;
  status: string;
  caseConferenceDate?: string;
  targetDate?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  Safety:           'bg-red-100 text-red-700',
  Psychosocial:     'bg-purple-100 text-purple-700',
  Education:        'bg-blue-100 text-blue-700',
  'Physical Health':'bg-green-100 text-green-700',
  Legal:            'bg-orange-100 text-orange-700',
  Reintegration:    'bg-teal/15 text-teal',
};

const STATUS_COLORS: Record<string, string> = {
  'Open':        'bg-blue-50 text-blue-600',
  'In Progress': 'bg-amber-50 text-amber-700',
  'Achieved':    'bg-green-100 text-green-700',
  'On Hold':     'bg-slate-100 text-slate-600',
  'Closed':      'bg-dark/8 text-dark/50',
};

function daysDiff(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatConferenceDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'long' }),
    day:       d.getDate(),
    month:     d.toLocaleDateString('en-US', { month: 'short' }),
    year:      d.getFullYear(),
  };
}

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
    Favorable:          { cls: 'bg-green-100 text-green-700',   icon: CheckCircle },
    Inconclusive:       { cls: 'bg-blue-100 text-blue-700',     icon: Clock },
    'Needs Improvement':{ cls: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
    Unfavorable:        { cls: 'bg-red-100 text-red-700',       icon: AlertTriangle },
  };
  const item = map[outcome] || { cls: 'bg-gray-100 text-gray-600', icon: Clock };
  const Icon = item.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.cls}`}>
      <Icon size={11} />{outcome}
    </span>
  );
};

// ─── Visit Detail Modal ───────────────────────────────────────────────────────

function VisitDetailModal({ visitId, onClose, onDelete, isAdmin }: {
  visitId: number; onClose: () => void; onDelete: () => void; isAdmin: boolean;
}) {
  const [visit, setVisit] = useState<VisitationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/api/home-visitations/${visitId}`)
      .then(r => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setVisit({
            visitationId: data.visitationId,
            residentId: data.residentId,
            residentCode: data.residentCode,
            visitDate: data.visitDate,
            socialWorker: data.socialWorker,
            visitType: data.visitType,
            familyCooperation: data.familyCooperationLevel || '',
            safetyConcern: data.safetyConcernsNoted,
            followUpNeeded: data.followUpNeeded,
            outcome: data.visitOutcome || '',
            purpose: data.purpose,
            observations: data.observations,
            locationVisited: data.locationVisited,
            familyMembersPresent: data.familyMembersPresent,
            followUpNotes: data.followUpNotes,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [visitId]);

  if (loading || !visit) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-12 flex justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-teal border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
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
              {visit.followUpNeeded && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-blue-100 text-blue-600 px-2.5 py-1 rounded-lg">
                  <Clock size={11} />Follow-Up Needed
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
              <p className="text-xs font-semibold text-dark/40 uppercase tracking-widests mb-2">Family Cooperation</p>
              {cooperationBadge(visit.familyCooperation)}
            </div>
            <div className="bg-cream rounded-2xl px-4 py-4">
              <p className="text-xs font-semibold text-dark/40 uppercase tracking-widests mb-2">Outcome</p>
              {outcomeBadge(visit.outcome)}
            </div>
          </div>
          {visit.locationVisited && (
            <div className="bg-cream rounded-2xl px-4 py-4">
              <p className="text-xs font-semibold text-dark/40 uppercase tracking-widests mb-2">Location Visited</p>
              <p className="text-sm text-dark">{visit.locationVisited}</p>
            </div>
          )}
          {visit.familyMembersPresent && (
            <div className="bg-cream rounded-2xl px-4 py-4">
              <p className="text-xs font-semibold text-dark/40 uppercase tracking-widests mb-2">Family Members Present</p>
              <p className="text-sm text-dark">{visit.familyMembersPresent}</p>
            </div>
          )}
          {visit.purpose && (
            <div className="bg-cream rounded-2xl px-4 py-4">
              <p className="text-xs font-semibold text-dark/40 uppercase tracking-widests mb-2">Purpose of Visit</p>
              <p className="text-sm text-dark leading-relaxed">{visit.purpose}</p>
            </div>
          )}
          {visit.observations && (
            <div className="bg-cream rounded-2xl px-4 py-4">
              <p className="text-xs font-semibold text-dark/40 uppercase tracking-widests mb-2">Observations</p>
              <p className="text-sm text-dark leading-relaxed">{visit.observations}</p>
            </div>
          )}
          {visit.safetyConcern && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-4">
              <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 mb-0.5">Safety Concern Flagged</p>
                <p className="text-xs text-red-500">This visit has been flagged for supervisor review.</p>
              </div>
            </div>
          )}
          {visit.followUpNeeded && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-4">
              <p className="text-xs font-semibold text-blue-600 uppercase tracking-widests mb-2">Follow-Up Actions Required</p>
              <p className="text-sm text-dark leading-relaxed">{visit.followUpNotes || 'Follow-up needed (no notes provided)'}</p>
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

// ─── Log Visit Modal ──────────────────────────────────────────────────────────

function LogVisitModal({ residents, onClose, onSaved }: {
  residents: Resident[]; onClose: () => void; onSaved: (v: Visitation) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [validationMsg, setValidationMsg] = useState('');
  const [form, setForm] = useState({
    residentId: '', visitDate: new Date().toISOString().split('T')[0],
    socialWorker: '', visitType: 'Initial Assessment',
    locationVisited: '', familyMembersPresent: '',
    familyCooperationLevel: 'Cooperative', visitOutcome: 'Favorable',
    safetyConcernsNoted: false, followUpNeeded: false,
    purpose: '', observations: '', followUpNotes: '',
  });
  function set(key: string, value: string | boolean) { setForm(prev => ({ ...prev, [key]: value })); }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formEl = e.currentTarget as HTMLFormElement;
    if (!formEl.checkValidity()) { formEl.reportValidity(); return; }
    const today = new Date().toISOString().slice(0, 10);
    if (form.visitDate > today) { setValidationMsg('Visit date cannot be in the future.'); return; }
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
    <>
    {validationMsg && <ValidationModal message={validationMsg} onClose={() => setValidationMsg('')} />}
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
              <input type="date" required value={form.visitDate} onChange={e => set('visitDate', e.target.value)}
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
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widests mb-2">Location Visited</label>
              <input type="text" placeholder="Address or location" value={form.locationVisited} onChange={e => set('locationVisited', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widests mb-2">Family Members Present</label>
              <input type="text" placeholder="e.g., Mother and aunt" value={form.familyMembersPresent} onChange={e => set('familyMembersPresent', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widests mb-2">Purpose of Visit</label>
            <textarea rows={2} placeholder="Describe the purpose of this visit..." value={form.purpose} onChange={e => set('purpose', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none placeholder-dark/25" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widests mb-2">Observations</label>
            <textarea rows={3} placeholder="Describe observations about home environment and family..." value={form.observations} onChange={e => set('observations', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none placeholder-dark/25" />
          </div>
          <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
            <input type="checkbox" id="followUpNeeded" checked={form.followUpNeeded} onChange={e => set('followUpNeeded', e.target.checked)} className="w-4 h-4 accent-blue-500" />
            <label htmlFor="followUpNeeded" className="text-sm font-medium text-blue-700">Follow-up action needed</label>
          </div>
          {form.followUpNeeded && (
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widests mb-2">Follow-Up Notes</label>
              <textarea rows={2} placeholder="Describe required follow-up actions..." value={form.followUpNotes} onChange={e => set('followUpNotes', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none placeholder-dark/25" />
            </div>
          )}
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
    </>
  );
}

// ─── Case Conferences Panel ───────────────────────────────────────────────────

function CaseConferencesPanel({
  plans, residents, loading,
}: {
  plans: InterventionPlan[];
  residents: Resident[];
  loading: boolean;
}) {
  const [categoryFilter, setCategoryFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');

  const residentMap = Object.fromEntries(residents.map(r => [r.residentId, r.internalCode]));

  // Only plans with a conference date
  const withDate = plans.filter(p => p.caseConferenceDate);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = withDate
    .filter(p => daysDiff(p.caseConferenceDate!) >= 0)
    .sort((a, b) => a.caseConferenceDate!.localeCompare(b.caseConferenceDate!));

  const past = withDate
    .filter(p => daysDiff(p.caseConferenceDate!) < 0)
    .sort((a, b) => b.caseConferenceDate!.localeCompare(a.caseConferenceDate!));

  const upcomingThisWeek  = upcoming.filter(p => daysDiff(p.caseConferenceDate!) <= 7).length;
  const upcomingThisMonth = upcoming.filter(p => daysDiff(p.caseConferenceDate!) <= 30).length;

  const display = (timeFilter === 'upcoming' ? upcoming : timeFilter === 'past' ? past : [...upcoming, ...past])
    .filter(p => !categoryFilter || p.planCategory === categoryFilter);

  const categories = [...new Set(withDate.map(p => p.planCategory))].sort();

  if (loading) {
    return (
      <div className="card py-16 flex justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-teal border-t-transparent animate-spin" />
      </div>
    );
  }

  if (withDate.length === 0) {
    return (
      <div className="card py-16 text-center">
        <Calendar size={36} className="text-dark/20 mx-auto mb-3" />
        <p className="text-dark/40 font-medium">No case conference dates scheduled.</p>
        <p className="text-xs text-dark/30 mt-1">Conference dates are set on individual intervention plans.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Summary tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Scheduled',  value: withDate.length,        color: 'bg-navy/8 text-navy' },
          { label: 'Upcoming',         value: upcoming.length,        color: 'bg-teal/10 text-teal' },
          { label: 'This Week',        value: upcomingThisWeek,       color: upcomingThisWeek > 0 ? 'bg-amber-50 text-amber-700' : 'bg-dark/5 text-dark/40' },
          { label: 'This Month',       value: upcomingThisMonth,      color: 'bg-dark/5 text-dark/50' },
        ].map(t => (
          <div key={t.label} className={`rounded-2xl p-4 text-center ${t.color}`}>
            <p className="text-2xl font-bold font-display">{t.value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{t.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card py-3">
        <div className="flex flex-wrap gap-3">
          <div className="flex rounded-xl overflow-hidden border border-dark/12 text-sm">
            {(['upcoming', 'past', 'all'] as const).map(v => (
              <button key={v} onClick={() => setTimeFilter(v)}
                className={`px-4 py-2 font-medium capitalize transition-colors ${timeFilter === v ? 'bg-navy text-white' : 'text-dark/50 hover:bg-cream'}`}>
                {v}
              </button>
            ))}
          </div>
          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-dark/12 bg-cream text-sm text-dark/60 focus:outline-none focus:ring-2 focus:ring-teal/30">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <span className="text-xs text-dark/40 self-center ml-auto">{display.length} conference{display.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Conference list */}
      {display.length === 0 ? (
        <div className="card py-10 text-center text-dark/40 text-sm">No conferences match the current filters.</div>
      ) : (
        <div className="space-y-3">
          {display.map(plan => {
            const diff   = daysDiff(plan.caseConferenceDate!);
            const dt     = formatConferenceDate(plan.caseConferenceDate!);
            const isToday    = diff === 0;
            const isTomorrow = diff === 1;
            const isPast     = diff < 0;
            const isSoon     = diff > 0 && diff <= 7;

            const urgencyBorder = isToday    ? 'border-amber-300 bg-amber-50/40'
                                : isTomorrow ? 'border-amber-200 bg-amber-50/20'
                                : isSoon     ? 'border-teal/30 bg-teal/4'
                                : isPast     ? 'border-dark/8 bg-white opacity-70'
                                : 'border-dark/8 bg-white';

            const countdownBadge = isToday    ? 'bg-amber-100 text-amber-700'
                                 : isTomorrow ? 'bg-amber-50 text-amber-600'
                                 : isSoon     ? 'bg-teal/10 text-teal'
                                 : isPast     ? 'bg-dark/8 text-dark/50'
                                 : 'bg-navy/8 text-navy/70';

            const countdownText = isToday     ? 'Today'
                                : isTomorrow  ? 'Tomorrow'
                                : diff > 0    ? `In ${diff} days`
                                : `${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''} ago`;

            return (
              <div key={plan.planId} className={`rounded-2xl border p-4 flex gap-4 items-start transition-all ${urgencyBorder}`}>
                {/* Date block */}
                <div className="flex-shrink-0 w-14 text-center bg-white rounded-xl border border-dark/10 py-2 shadow-sm">
                  <p className="text-xs font-semibold text-dark/40 uppercase">{dt.month}</p>
                  <p className="text-2xl font-bold text-navy leading-none">{dt.day}</p>
                  <p className="text-xs text-dark/40 mt-0.5">{dt.year}</p>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${countdownBadge}`}>
                      {countdownText}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${CATEGORY_COLORS[plan.planCategory] ?? 'bg-dark/8 text-dark/60'}`}>
                      {plan.planCategory}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[plan.status] ?? 'bg-dark/8 text-dark/50'}`}>
                      {plan.status}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-navy">
                    Resident {residentMap[plan.residentId] ?? `#${plan.residentId}`}
                  </p>
                  <p className="text-xs text-dark/50 mt-0.5">{dt.dayOfWeek} · {plan.planCategory} Plan</p>

                  {plan.planDescription && (
                    <p className="text-xs text-dark/45 mt-1.5 line-clamp-2 leading-relaxed">{plan.planDescription}</p>
                  )}
                </div>

                {/* Target date if set */}
                {plan.targetDate && (
                  <div className="flex-shrink-0 text-right hidden sm:block">
                    <p className="text-xs text-dark/35 font-medium">Target Date</p>
                    <p className="text-xs font-semibold text-dark/60">{plan.targetDate}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function VisitationsPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('Admin') ?? false;

  const [activeTab, setActiveTab] = useState<'visits' | 'conferences'>('visits');

  const [visitations, setVisitations]   = useState<Visitation[]>([]);
  const [residents, setResidents]       = useState<Resident[]>([]);
  const [plans, setPlans]               = useState<InterventionPlan[]>([]);
  const [loading, setLoading]           = useState(true);
  const [plansLoading, setPlansLoading] = useState(true);

  const [search, setSearch]                       = useState('');
  const [visitTypeFilter, setVisitTypeFilter]     = useState('');
  const [safetyConcernFilter, setSafetyConcernFilter] = useState('');
  const [followUpFilter, setFollowUpFilter]       = useState('');
  const [selectedVisitId, setSelectedVisitId]     = useState<number | null>(null);
  const [showLogModal, setShowLogModal]           = useState(false);
  const [deleteTarget, setDeleteTarget]           = useState<Visitation | null>(null);
  const [deleteLoading, setDeleteLoading]         = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/home-visitations').then(r => r.ok ? r.json() : []),
      apiFetch('/api/residents').then(r => r.ok ? r.json() : []),
    ]).then(([v, res]) => {
      setVisitations(v);
      setResidents(res);
    }).finally(() => setLoading(false));

    apiFetch('/api/intervention-plans')
      .then(r => r.ok ? r.json() : [])
      .then(setPlans)
      .finally(() => setPlansLoading(false));
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await apiFetch(`/api/home-visitations/${deleteTarget.visitationId}`, { method: 'DELETE' });
    setVisitations(prev => prev.filter(v => v.visitationId !== deleteTarget.visitationId));
    setDeleteTarget(null);
    setSelectedVisitId(null);
    setDeleteLoading(false);
  }

  const filtered = visitations.filter(v => {
    const matchSearch   = !search || v.residentCode.toLowerCase().includes(search.toLowerCase()) || v.socialWorker.toLowerCase().includes(search.toLowerCase()) || v.visitType.toLowerCase().includes(search.toLowerCase());
    const matchType     = !visitTypeFilter || v.visitType === visitTypeFilter;
    const matchSafety   = !safetyConcernFilter || (safetyConcernFilter === 'Yes' ? v.safetyConcern : !v.safetyConcern);
    const matchFollowUp = !followUpFilter || (followUpFilter === 'Yes' ? v.followUpNeeded : !v.followUpNeeded);
    return matchSearch && matchType && matchSafety && matchFollowUp;
  });

  const visitTypeOptions = [...new Set(visitations.map(v => v.visitType).filter(Boolean))].sort();
  const visitsPag        = useListPagination(filtered, [search, visitTypeFilter, safetyConcernFilter, followUpFilter]);
  const upcomingCount    = plans.filter(p => p.caseConferenceDate && daysDiff(p.caseConferenceDate) >= 0).length;

  return (
    <AdminLayout>
      <div className="space-y-5 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-navy">Home Visitations</h1>
            <p className="text-dark/50 text-sm mt-1">{visitations.length} visits recorded</p>
          </div>
          {activeTab === 'visits' && (
            <button onClick={() => setShowLogModal(true)} className="btn-primary flex items-center gap-2 text-sm self-start sm:self-auto">
              <Plus size={16} /> Log New Visit
            </button>
          )}
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-dark/5 rounded-2xl p-1 w-fit">
          <button
            onClick={() => setActiveTab('visits')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'visits' ? 'bg-white text-navy shadow-sm' : 'text-dark/50 hover:text-navy'
            }`}
          >
            <Home size={15} />
            Home Visits
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === 'visits' ? 'bg-teal/10 text-teal' : 'bg-dark/10 text-dark/50'}`}>
              {visitations.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('conferences')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'conferences' ? 'bg-white text-navy shadow-sm' : 'text-dark/50 hover:text-navy'
            }`}
          >
            <BookOpen size={15} />
            Case Conferences
            {upcomingCount > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${activeTab === 'conferences' ? 'bg-amber-100 text-amber-700' : 'bg-amber-100 text-amber-600'}`}>
                {upcomingCount} upcoming
              </span>
            )}
          </button>
        </div>

        {/* ── Home Visits Tab ──────────────────────────────────────────────── */}
        {activeTab === 'visits' && (
          <>
            <div className="card py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/30" />
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by resident, worker, or type..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal placeholder-dark/30" />
                </div>
                <select value={visitTypeFilter} onChange={e => setVisitTypeFilter(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm text-dark/60 focus:outline-none focus:ring-2 focus:ring-teal/30">
                  <option value="">Visit Type</option>
                  {visitTypeOptions.map(o => <option key={o}>{o}</option>)}
                </select>
                <select value={safetyConcernFilter} onChange={e => setSafetyConcernFilter(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm text-dark/60 focus:outline-none focus:ring-2 focus:ring-teal/30">
                  <option value="">Safety Concern</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
                <select value={followUpFilter} onChange={e => setFollowUpFilter(e.target.value)}
                  className="px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm text-dark/60 focus:outline-none focus:ring-2 focus:ring-teal/30">
                  <option value="">Follow-up Needed</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>

            <div className="card overflow-hidden p-0">
              {loading ? (
                <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full border-4 border-teal border-t-transparent animate-spin" /></div>
              ) : filtered.length === 0 ? (
                <>
                  <div className="py-16 text-center text-dark/40 text-sm">No visitations found.</div>
                  <div className="px-5 py-3 border-t border-dark/6 bg-cream/40">
                    <span className="text-xs text-dark/40 font-medium">
                      {visitations.filter(v => v.safetyConcern).length} safety concern(s) across all visitations
                    </span>
                  </div>
                </>
              ) : (
                <>
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
                      {visitsPag.pageItems.map((visit, i) => (
                        <tr key={visit.visitationId} onClick={() => setSelectedVisitId(visit.visitationId)}
                          className={`border-b border-dark/5 last:border-0 cursor-pointer hover:bg-teal/4 transition-colors group ${(visitsPag.startIndex + i) % 2 !== 0 ? 'bg-cream/30' : ''}`}>
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
                <ListPaginationBar
                  page={visitsPag.page}
                  pageCount={visitsPag.pageCount}
                  pageSize={visitsPag.pageSize}
                  setPage={visitsPag.setPage}
                  setPageSize={visitsPag.setPageSize}
                  total={visitsPag.total}
                  startIndex={visitsPag.startIndex}
                  endIndex={visitsPag.endIndex}
                  trailing={
                    <span className="text-xs text-dark/30 shrink-0">
                      {visitations.filter(v => v.safetyConcern).length} safety concern(s) flagged (all)
                    </span>
                  }
                />
                </>
              )}
            </div>
          </>
        )}

        {/* ── Case Conferences Tab ─────────────────────────────────────────── */}
        {activeTab === 'conferences' && (
          <CaseConferencesPanel
            plans={plans}
            residents={residents}
            loading={plansLoading}
          />
        )}

      </div>

      {selectedVisitId && (
        <VisitDetailModal visitId={selectedVisitId} onClose={() => setSelectedVisitId(null)}
          onDelete={() => {
            const visit = visitations.find(v => v.visitationId === selectedVisitId);
            if (visit) setDeleteTarget(visit);
            setSelectedVisitId(null);
          }} isAdmin={isAdmin} />
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
