import { useEffect, useState } from 'react';
import { Plus, X, FileText, ChevronRight, Search, Trash2, Pencil } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { useListPagination } from '../hooks/useListPagination';
import ListPaginationBar from '../components/ListPaginationBar';

interface SessionNote {
  recordingId: number;
  residentId: number;
  residentCode: string;
  sessionDate: string;
  socialWorker: string;
  sessionType: string;
  emotionalState: string;
  narrative: string;
  interventions: string;
  followUp: string;
  progressNoted: boolean;
  concernsFlagged: boolean;
}

interface Resident { residentId: number; internalCode: string; safehouse: string; }

const emotionBadge = (state: string) => {
  const map: Record<string, string> = {
    Hopeful: 'bg-green-100 text-green-700', Calm: 'bg-blue-100 text-blue-700',
    Anxious: 'bg-yellow-100 text-yellow-700', Distressed: 'bg-red-100 text-red-700',
    Reflective: 'bg-purple-100 text-purple-700', Withdrawn: 'bg-gray-100 text-gray-600',
    Happy: 'bg-emerald-100 text-emerald-700', Angry: 'bg-orange-100 text-orange-700',
    Sad: 'bg-indigo-100 text-indigo-700',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[state] || 'bg-gray-100 text-gray-600'}`}>{state}</span>;
};

const typeBadge = (type: string) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${type === 'Individual' ? 'bg-navy/8 text-navy' : 'bg-teal/10 text-teal-dark'}`}>{type}</span>
);

// ── Session Detail Modal ────────────────────────────────────────────────────────

function SessionDetailModal({ note, onClose, onDelete, onEdit, isAdmin }: {
  note: SessionNote; onClose: () => void;
  onDelete: () => void; onEdit: () => void; isAdmin: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="sticky top-0 bg-white rounded-t-3xl px-6 py-5 border-b border-dark/8 flex items-start justify-between z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold bg-navy/8 text-navy px-2.5 py-1 rounded-lg">Resident {note.residentCode}</span>
              {typeBadge(note.sessionType)}
              {emotionBadge(note.emotionalState)}
            </div>
            <p className="text-dark/40 text-xs font-medium mt-1">{note.sessionDate} · #{note.recordingId}</p>
          </div>
          <button onClick={onClose} className="text-dark/35 hover:text-dark hover:bg-dark/6 rounded-lg p-1.5 transition-colors flex-shrink-0 ml-3"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3 bg-teal/6 rounded-2xl px-4 py-3.5">
            <div className="w-9 h-9 rounded-full bg-teal flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {note.socialWorker.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="text-xs text-dark/40 font-medium">Assigned Social Worker</p>
              <p className="text-sm font-semibold text-navy">{note.socialWorker}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-dark/40 uppercase tracking-widest mb-3">Session Narrative</p>
            <div className="bg-cream rounded-2xl px-5 py-4 border-l-4 border-teal">
              <p className="text-sm text-dark/75 leading-relaxed">{note.narrative}</p>
            </div>
          </div>
          {note.interventions && (
            <div>
              <p className="text-xs font-semibold text-dark/40 uppercase tracking-widest mb-2">Interventions Applied</p>
              <div className="flex flex-wrap gap-2">
                {note.interventions.split(',').map(i => (
                  <span key={i.trim()} className="bg-navy/6 text-navy text-xs font-semibold px-3 py-1.5 rounded-lg">{i.trim()}</span>
                ))}
              </div>
            </div>
          )}
          {note.followUp && (
            <div>
              <p className="text-xs font-semibold text-dark/40 uppercase tracking-widest mb-2">Follow-up Actions</p>
              <div className="flex items-start gap-3 bg-gold/8 rounded-2xl px-4 py-3.5 border border-gold/20">
                <div className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 flex-shrink-0" />
                <p className="text-sm font-medium text-dark/70">{note.followUp}</p>
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-3 pt-2">
            <button onClick={onClose} className="flex-1 min-w-[120px] py-3 rounded-xl border border-dark/12 text-dark/60 text-sm font-semibold hover:bg-cream transition-colors">Close</button>
            {isAdmin && (
              <>
                <button onClick={onEdit} className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-navy/8 border border-navy/15 text-navy text-sm font-semibold hover:bg-navy/12 transition-colors">
                  <Pencil size={15} /> Edit
                </button>
                <button onClick={onDelete} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors">
                  <Trash2 size={15} /> Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── New Session Note Modal ──────────────────────────────────────────────────────

function NewSessionModal({ residents, onClose, onSaved }: {
  residents: Resident[]; onClose: () => void; onSaved: (n: SessionNote) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    residentId: '', sessionDate: new Date().toISOString().split('T')[0],
    socialWorker: '', sessionType: 'Individual', emotionalStateObserved: 'Calm',
    sessionNarrative: '', interventionsApplied: '', followUpActions: '',
    progressNoted: false, concernsFlagged: false,
    riskLevel: '',
  });

  function set(key: string, value: string | boolean) { setForm(prev => ({ ...prev, [key]: value })); }
  const personNameRe = /^[A-Za-z\s'\-]+$/;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formEl = e.currentTarget as HTMLFormElement;
    if (!formEl.checkValidity()) {
      formEl.reportValidity();
      window.alert('Please fix the highlighted fields before saving.');
      return;
    }
    if (!personNameRe.test(form.socialWorker.trim())) {
      window.alert("Social Worker can only include letters, spaces, apostrophes, and hyphens.");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    if (form.sessionDate > today) {
      window.alert('Session date cannot be in the future.');
      return;
    }
    setSaving(true);
    const residentId = parseInt(form.residentId);
    const res = await apiFetch('/api/process-recordings', {
      method: 'POST',
      body: JSON.stringify({ ...form, residentId }),
    });
    if (res.ok) {
      const { recordingId } = await res.json();
      const resident = residents.find(r => r.residentId === residentId);

      // Update the resident's risk level if one was selected
      if (form.riskLevel) {
        await apiFetch(`/api/residents/${residentId}/risk-level`, {
          method: 'PATCH',
          body: JSON.stringify({ riskLevel: form.riskLevel }),
        });
      }

      onSaved({
        recordingId, residentId,
        residentCode: resident?.internalCode ?? form.residentId,
        sessionDate: form.sessionDate, socialWorker: form.socialWorker,
        sessionType: form.sessionType, emotionalState: form.emotionalStateObserved,
        narrative: form.sessionNarrative, interventions: form.interventionsApplied,
        followUp: form.followUpActions, progressNoted: form.progressNoted,
        concernsFlagged: form.concernsFlagged,
      });
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="sticky top-0 bg-white rounded-t-3xl px-6 py-5 border-b border-dark/8 flex items-center justify-between z-10">
          <div>
            <h2 className="font-display text-xl font-bold text-navy">New Session Note</h2>
            <p className="text-xs text-dark/40 mt-0.5">All entries are confidential and encrypted</p>
          </div>
          <button onClick={onClose} className="text-dark/35 hover:text-dark hover:bg-dark/6 rounded-lg p-1.5 transition-colors"><X size={18} /></button>
        </div>
        <form className="p-6 space-y-5" onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Resident</label>
              <select required value={form.residentId} onChange={e => set('residentId', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                <option value="">Select resident...</option>
                {residents.map(r => <option key={r.residentId} value={r.residentId}>Resident {r.internalCode} ({r.safehouse})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Session Date</label>
              <input type="date" required value={form.sessionDate} onChange={e => set('sessionDate', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Social Worker</label>
              <input type="text" placeholder="Full name" pattern="[A-Za-z\s'\-]+" title="Letters, spaces, apostrophes, and hyphens only." value={form.socialWorker} onChange={e => set('socialWorker', e.target.value)} required
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Session Type</label>
              <select value={form.sessionType} onChange={e => set('sessionType', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                <option>Individual</option><option>Group</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Emotional State</label>
              <select value={form.emotionalStateObserved} onChange={e => set('emotionalStateObserved', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                {['Calm', 'Hopeful', 'Anxious', 'Distressed', 'Reflective', 'Withdrawn', 'Happy', 'Angry', 'Sad'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Update Risk Level</label>
              <select value={form.riskLevel} onChange={e => set('riskLevel', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                <option value="">No change</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
              <p className="text-xs text-dark/35 mt-1.5">If selected, this will update the resident's current risk level in their profile.</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Session Narrative</label>
            <textarea rows={5} placeholder="Describe the session in detail..." value={form.sessionNarrative} onChange={e => set('sessionNarrative', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none placeholder-dark/25" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widests mb-2">Interventions Applied</label>
            <input type="text" placeholder="e.g. CBT grounding, art therapy..." value={form.interventionsApplied} onChange={e => set('interventionsApplied', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widests mb-2">Follow-up Actions</label>
            <input type="text" placeholder="e.g. Coordinate with legal team..." value={form.followUpActions} onChange={e => set('followUpActions', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25" />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-dark/60 cursor-pointer">
              <input type="checkbox" checked={form.progressNoted} onChange={e => set('progressNoted', e.target.checked)} className="w-4 h-4 accent-teal" />
              Progress noted
            </label>
            <label className="flex items-center gap-2 text-sm text-dark/60 cursor-pointer">
              <input type="checkbox" checked={form.concernsFlagged} onChange={e => set('concernsFlagged', e.target.checked)} className="w-4 h-4 accent-red-500" />
              Concerns flagged
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-dark/15 text-dark/60 text-sm font-semibold hover:bg-cream transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary text-sm disabled:opacity-60">{saving ? 'Saving...' : 'Save Session Note'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Session Note Modal (Admin) ─────────────────────────────────────────────

function EditSessionModal({ note, residents, onClose, onSaved }: {
  note: SessionNote;
  residents: Resident[];
  onClose: () => void;
  onSaved: (n: SessionNote) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    residentId: String(note.residentId),
    sessionDate: note.sessionDate,
    socialWorker: note.socialWorker,
    sessionType: note.sessionType,
    emotionalStateObserved: note.emotionalState,
    sessionNarrative: note.narrative,
    interventionsApplied: note.interventions,
    followUpActions: note.followUp,
    progressNoted: note.progressNoted,
    concernsFlagged: note.concernsFlagged,
  });

  function set(key: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [key]: value }));
  }
  const personNameRe = /^[A-Za-z\s'\-]+$/;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formEl = e.currentTarget as HTMLFormElement;
    if (!formEl.checkValidity()) {
      formEl.reportValidity();
      window.alert('Please fix the highlighted fields before saving.');
      return;
    }
    if (!personNameRe.test(form.socialWorker.trim())) {
      window.alert("Social Worker can only include letters, spaces, apostrophes, and hyphens.");
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    if (form.sessionDate > today) {
      window.alert('Session date cannot be in the future.');
      return;
    }
    setSaving(true);
    const res = await apiFetch(`/api/process-recordings/${note.recordingId}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...form,
        residentId: parseInt(form.residentId, 10),
      }),
    });
    if (res.ok) {
      const resident = residents.find(r => r.residentId === parseInt(form.residentId, 10));
      onSaved({
        ...note,
        residentId: parseInt(form.residentId, 10),
        residentCode: resident?.internalCode ?? note.residentCode,
        sessionDate: form.sessionDate,
        socialWorker: form.socialWorker,
        sessionType: form.sessionType,
        emotionalState: form.emotionalStateObserved,
        narrative: form.sessionNarrative,
        interventions: form.interventionsApplied,
        followUp: form.followUpActions,
        progressNoted: form.progressNoted,
        concernsFlagged: form.concernsFlagged,
      });
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="sticky top-0 bg-white rounded-t-3xl px-6 py-5 border-b border-dark/8 flex items-center justify-between z-10">
          <div>
            <h2 className="font-display text-xl font-bold text-navy">Edit Session Note</h2>
            <p className="text-xs text-dark/40 mt-0.5">#{note.recordingId} · changes are saved to the record</p>
          </div>
          <button type="button" onClick={onClose} className="text-dark/35 hover:text-dark hover:bg-dark/6 rounded-lg p-1.5 transition-colors"><X size={18} /></button>
        </div>
        <form className="p-6 space-y-5" onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Resident</label>
              <select required value={form.residentId} onChange={e => set('residentId', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                {residents.map(r => (
                  <option key={r.residentId} value={r.residentId}>
                    Resident {r.internalCode} ({r.safehouse})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Session Date</label>
              <input type="date" required value={form.sessionDate} onChange={e => set('sessionDate', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Social Worker</label>
              <input type="text" placeholder="Full name" pattern="[A-Za-z\s'\-]+" title="Letters, spaces, apostrophes, and hyphens only." value={form.socialWorker} onChange={e => set('socialWorker', e.target.value)} required
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Session Type</label>
              <select value={form.sessionType} onChange={e => set('sessionType', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                <option>Individual</option><option>Group</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Emotional State</label>
              <select value={form.emotionalStateObserved} onChange={e => set('emotionalStateObserved', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                {['Calm', 'Hopeful', 'Anxious', 'Distressed', 'Reflective', 'Withdrawn', 'Happy', 'Angry', 'Sad'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Session Narrative</label>
            <textarea rows={5} placeholder="Describe the session in detail..." value={form.sessionNarrative} onChange={e => set('sessionNarrative', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none placeholder-dark/25" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widests mb-2">Interventions Applied</label>
            <input type="text" placeholder="e.g. CBT grounding, art therapy..." value={form.interventionsApplied} onChange={e => set('interventionsApplied', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widests mb-2">Follow-up Actions</label>
            <input type="text" placeholder="e.g. Coordinate with legal team..." value={form.followUpActions} onChange={e => set('followUpActions', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25" />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-dark/60 cursor-pointer">
              <input type="checkbox" checked={form.progressNoted} onChange={e => set('progressNoted', e.target.checked)} className="w-4 h-4 accent-teal" />
              Progress noted
            </label>
            <label className="flex items-center gap-2 text-sm text-dark/60 cursor-pointer">
              <input type="checkbox" checked={form.concernsFlagged} onChange={e => set('concernsFlagged', e.target.checked)} className="w-4 h-4 accent-red-500" />
              Concerns flagged
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-dark/15 text-dark/60 text-sm font-semibold hover:bg-cream transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary text-sm disabled:opacity-60">{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────────

export default function ProcessRecordingPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('Admin') ?? false;

  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedNote, setSelectedNote] = useState<SessionNote | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingNote, setEditingNote] = useState<SessionNote | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SessionNote | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/process-recordings').then(r => r.ok ? r.json() : []),
      apiFetch('/api/residents').then(r => r.ok ? r.json() : []),
    ]).then(([n, res]) => { setNotes(n); setResidents(res); }).finally(() => setLoading(false));
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await apiFetch(`/api/process-recordings/${deleteTarget.recordingId}`, { method: 'DELETE' });
    setNotes(prev => prev.filter(n => n.recordingId !== deleteTarget.recordingId));
    setDeleteTarget(null);
    setSelectedNote(null);
    setDeleteLoading(false);
  }

  const filtered = notes.filter(n => !search ||
    n.residentCode.toLowerCase().includes(search.toLowerCase()) ||
    n.socialWorker.toLowerCase().includes(search.toLowerCase()) ||
    n.sessionType.toLowerCase().includes(search.toLowerCase())
  );

  const notesPag = useListPagination(filtered, [search]);

  return (
    <AdminLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-navy">Process Recording</h1>
            <p className="text-dark/50 text-sm mt-1">{notes.length} sessions recorded</p>
          </div>
          <button onClick={() => setShowNewModal(true)} className="btn-primary flex items-center gap-2 text-sm self-start sm:self-auto">
            <Plus size={16} /> New Session Note
          </button>
        </div>

        <div className="card py-3.5">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/30" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by resident ID, social worker, or session type..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-dark/10 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/25 focus:border-teal placeholder-dark/30" />
          </div>
        </div>

        <div className="card overflow-hidden p-0">
          {loading ? (
            <div className="flex justify-center py-16"><div className="w-8 h-8 rounded-full border-4 border-teal border-t-transparent animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <>
              <div className="py-16 text-center text-dark/40 text-sm">No session notes found.</div>
              <div className="px-5 py-3 border-t border-dark/6 bg-cream/40">
                <span className="text-xs text-dark/30">All records encrypted · access logged</span>
              </div>
            </>
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark/8 bg-cream/70">
                    {['#', 'Resident', 'Date', 'Social Worker', 'Type', 'Emotional State', ''].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-dark/40 uppercase tracking-wide px-5 py-3.5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {notesPag.pageItems.map((note, i) => (
                    <tr key={note.recordingId} onClick={() => setSelectedNote(note)}
                      className={`border-b border-dark/5 last:border-0 cursor-pointer hover:bg-teal/4 transition-colors group ${(notesPag.startIndex + i) % 2 !== 0 ? 'bg-cream/30' : ''}`}>
                      <td className="px-5 py-4"><span className="font-mono text-xs font-bold text-dark/40">#{note.recordingId}</span></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-navy/8 flex items-center justify-center flex-shrink-0"><FileText size={14} className="text-navy/50" /></div>
                          <span className="font-mono text-sm font-semibold text-navy">Resident {note.residentCode}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-dark/65 whitespace-nowrap">{note.sessionDate}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-teal flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {note.socialWorker.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-sm text-dark/70 font-medium whitespace-nowrap">{note.socialWorker}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">{typeBadge(note.sessionType)}</td>
                      <td className="px-5 py-4">{emotionBadge(note.emotionalState)}</td>
                      <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {isAdmin && (
                            <>
                              <button onClick={() => setEditingNote(note)} className="p-1.5 rounded-lg text-dark/25 hover:text-navy hover:bg-navy/8 transition-colors" title="Edit">
                                <Pencil size={14} />
                              </button>
                              <button onClick={() => setDeleteTarget(note)} className="p-1.5 rounded-lg text-dark/25 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                                <Trash2 size={14} />
                              </button>
                            </>
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
              page={notesPag.page}
              pageCount={notesPag.pageCount}
              pageSize={notesPag.pageSize}
              setPage={notesPag.setPage}
              setPageSize={notesPag.setPageSize}
              total={notesPag.total}
              startIndex={notesPag.startIndex}
              endIndex={notesPag.endIndex}
              trailing={<span className="text-xs text-dark/30 shrink-0">All records encrypted · access logged</span>}
            />
            </>
          )}
        </div>
      </div>

      {selectedNote && (
        <SessionDetailModal
          note={selectedNote}
          onClose={() => setSelectedNote(null)}
          onDelete={() => { setDeleteTarget(selectedNote); setSelectedNote(null); }}
          onEdit={() => {
            const n = selectedNote;
            setSelectedNote(null);
            setEditingNote(n);
          }}
          isAdmin={isAdmin}
        />
      )}
      {editingNote && (
        <EditSessionModal
          note={editingNote}
          residents={residents}
          onClose={() => setEditingNote(null)}
          onSaved={(n) => {
            setNotes(prev => prev.map(x => (x.recordingId === n.recordingId ? n : x)));
            setEditingNote(null);
          }}
        />
      )}
      {showNewModal && (
        <NewSessionModal residents={residents} onClose={() => setShowNewModal(false)}
          onSaved={(n) => { setNotes(prev => [n, ...prev]); setShowNewModal(false); }} />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal
          title="Delete Session Note"
          description={`Are you sure you want to permanently delete session note #${deleteTarget.recordingId} for Resident ${deleteTarget.residentCode}?`}
          onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleteLoading} />
      )}
    </AdminLayout>
  );
}
