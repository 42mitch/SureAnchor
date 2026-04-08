import { useState } from 'react';
import { X } from 'lucide-react';
import { apiFetch } from '../../api';
import ValidationModal from '../ValidationModal';

export interface SafehouseOption {
  safehouseId: number;
  safehouseCode: string;
  name: string;
}

export interface ResidentDetailForm {
  residentId: number;
  caseNo: string;
  internalCode: string;
  safehouseId: number;
  category: string;
  risk: string;
  status: string;
  worker: string;
  religion: string | null;
  dateAdmitted: string | null;
  dateOfBirth: string | null;
  reintegrationType: string | null;
  reintegrationStatus: string | null;
}

interface EditResidentModalProps {
  resident: ResidentDetailForm;
  safehouses: SafehouseOption[];
  onClose: () => void;
  onSaved: () => void;
}

export function EditResidentModal({ resident, safehouses, onClose, onSaved }: EditResidentModalProps) {
  const [saving, setSaving] = useState(false);
  const [validationMsg, setValidationMsg] = useState('');
  const [form, setForm] = useState({
    caseControlNo: resident.caseNo,
    internalCode: resident.internalCode,
    safehouseId: String(resident.safehouseId),
    caseStatus: resident.status,
    caseCategory: resident.category || '',
    currentRiskLevel: resident.risk,
    assignedSocialWorker: resident.worker,
    religion: resident.religion || '',
    dateOfBirth: resident.dateOfBirth?.slice(0, 10) || '',
    dateOfAdmission: resident.dateAdmitted?.slice(0, 10) || '',
    reintegrationType: resident.reintegrationType || '',
    reintegrationStatus: resident.reintegrationStatus || '',
  });

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }
  const personNameRe = /^[A-Za-z\s'\-]*$/;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formEl = e.currentTarget as HTMLFormElement;
    if (!formEl.checkValidity()) {
      formEl.reportValidity();
      return;
    }
    if (!personNameRe.test(form.assignedSocialWorker)) {
      setValidationMsg('Assigned social worker name can only include letters, spaces, apostrophes, and hyphens.');
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    if ((form.dateOfBirth && form.dateOfBirth > today) || (form.dateOfAdmission && form.dateOfAdmission > today)) {
      setValidationMsg('Date of birth and date admitted cannot be in the future.');
      return;
    }
    setSaving(true);
    const res = await apiFetch(`/api/residents/${resident.residentId}`, {
      method: 'PUT',
      body: JSON.stringify({
        caseControlNo: form.caseControlNo,
        internalCode: form.internalCode,
        safehouseId: parseInt(form.safehouseId, 10),
        caseStatus: form.caseStatus,
        caseCategory: form.caseCategory || null,
        currentRiskLevel: form.currentRiskLevel,
        assignedSocialWorker: form.assignedSocialWorker || null,
        religion: form.religion || null,
        dateOfBirth: form.dateOfBirth || null,
        dateOfAdmission: form.dateOfAdmission || null,
        reintegrationType: form.reintegrationType || null,
        reintegrationStatus: form.reintegrationStatus || null,
      }),
    });
    if (res.ok) {
      onSaved();
      onClose();
    }
    setSaving(false);
  }

  return (
    <>
    {validationMsg && <ValidationModal message={validationMsg} onClose={() => setValidationMsg('')} />}
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="sticky top-0 bg-white rounded-t-3xl px-6 py-5 border-b border-dark/8 flex items-center justify-between z-10">
          <h2 className="font-display text-xl font-bold text-navy">Edit resident information</h2>
          <button type="button" onClick={onClose} className="text-dark/35 hover:text-dark hover:bg-dark/6 rounded-lg p-1.5 transition-colors">
            <X size={18} />
          </button>
        </div>
        <form className="p-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Case control no.</label>
              <input required value={form.caseControlNo} onChange={e => set('caseControlNo', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Internal code</label>
              <input required value={form.internalCode} onChange={e => set('internalCode', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Safe house</label>
              <select required value={form.safehouseId} onChange={e => set('safehouseId', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                {safehouses.map(s => (
                  <option key={s.safehouseId} value={s.safehouseId}>{s.safehouseCode} — {s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Status</label>
              <select value={form.caseStatus} onChange={e => set('caseStatus', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                {['Active', 'Closed', 'Transferred', 'Reintegrating', 'Aftercare'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Risk level</label>
              <select value={form.currentRiskLevel} onChange={e => set('currentRiskLevel', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                {['Low', 'Medium', 'High', 'Critical'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Case category</label>
              <input value={form.caseCategory} onChange={e => set('caseCategory', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Assigned social worker</label>
              <input pattern="[A-Za-z\s'\-]*" title="Letters, spaces, apostrophes, and hyphens only." value={form.assignedSocialWorker} onChange={e => set('assignedSocialWorker', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Religion</label>
              <input value={form.religion} onChange={e => set('religion', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Date of birth</label>
              <input type="date" value={form.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Date admitted</label>
              <input type="date" value={form.dateOfAdmission} onChange={e => set('dateOfAdmission', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Reintegration type</label>
              <input value={form.reintegrationType} onChange={e => set('reintegrationType', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Reintegration status</label>
              <input value={form.reintegrationStatus} onChange={e => set('reintegrationStatus', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-dark/15 text-dark/60 text-sm font-semibold hover:bg-cream transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary text-sm disabled:opacity-60">{saving ? 'Saving...' : 'Save changes'}</button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}

export interface SessionNoteRow {
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

export function ResidentSessionEditModal({
  note,
  residentId,
  residentCode,
  onClose,
  onSaved,
}: {
  note: SessionNoteRow;
  residentId: number;
  residentCode: string;
  onClose: () => void;
  onSaved: (n: SessionNoteRow) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [validationMsg, setValidationMsg] = useState('');
  const [form, setForm] = useState({
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formEl = e.currentTarget as HTMLFormElement;
    if (!formEl.checkValidity()) {
      formEl.reportValidity();
      return;
    }
    setSaving(true);
    const res = await apiFetch(`/api/process-recordings/${note.recordingId}`, {
      method: 'PUT',
      body: JSON.stringify({
        residentId,
        sessionDate: form.sessionDate,
        socialWorker: form.socialWorker,
        sessionType: form.sessionType,
        emotionalStateObserved: form.emotionalStateObserved,
        sessionNarrative: form.sessionNarrative,
        interventionsApplied: form.interventionsApplied,
        followUpActions: form.followUpActions,
        progressNoted: form.progressNoted,
        concernsFlagged: form.concernsFlagged,
      }),
    });
    if (res.ok) {
      onSaved({
        ...note,
        residentId,
        residentCode,
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
      onClose();
    }
    setSaving(false);
  }

  return (
    <>
    {validationMsg && <ValidationModal message={validationMsg} onClose={() => setValidationMsg('')} />}
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="sticky top-0 bg-white rounded-t-3xl px-6 py-5 border-b border-dark/8 flex items-center justify-between z-10">
          <div>
            <h2 className="font-display text-xl font-bold text-navy">Edit session note</h2>
            <p className="text-xs text-dark/40 mt-0.5">Resident {residentCode} · #{note.recordingId}</p>
          </div>
          <button type="button" onClick={onClose} className="text-dark/35 hover:text-dark hover:bg-dark/6 rounded-lg p-1.5 transition-colors"><X size={18} /></button>
        </div>
        <form className="p-6 space-y-5" onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Session date</label>
              <input type="date" required value={form.sessionDate} onChange={e => set('sessionDate', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Social worker</label>
              <input required value={form.socialWorker} onChange={e => set('socialWorker', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Session type</label>
              <select value={form.sessionType} onChange={e => set('sessionType', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                <option>Individual</option>
                <option>Group</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Emotional state</label>
              <select value={form.emotionalStateObserved} onChange={e => set('emotionalStateObserved', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                {['Calm', 'Hopeful', 'Anxious', 'Distressed', 'Reflective', 'Withdrawn', 'Happy', 'Angry', 'Sad'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Session narrative</label>
            <textarea rows={5} value={form.sessionNarrative} onChange={e => set('sessionNarrative', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Interventions applied</label>
            <input value={form.interventionsApplied} onChange={e => set('interventionsApplied', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Follow-up actions</label>
            <input value={form.followUpActions} onChange={e => set('followUpActions', e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
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
            <button type="submit" disabled={saving} className="flex-1 btn-primary text-sm disabled:opacity-60">{saving ? 'Saving...' : 'Save changes'}</button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}

export interface HomeVisitationDetail {
  visitationId: number;
  residentId: number;
  residentCode: string;
  visitDate: string;
  socialWorker: string;
  visitType: string;
  familyCooperationLevel: string | null;
  safetyConcernsNoted: boolean;
  followUpNeeded: boolean;
  followUpNotes: string | null;
  visitOutcome: string | null;
  purpose: string | null;
  observations: string | null;
  locationVisited: string | null;
  familyMembersPresent: string | null;
}

export function ResidentVisitEditModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: HomeVisitationDetail;
  onClose: () => void;
  onSaved: (v: HomeVisitationDetail) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [validationMsg, setValidationMsg] = useState('');
  const [form, setForm] = useState({
    visitDate: initial.visitDate,
    socialWorker: initial.socialWorker,
    visitType: initial.visitType,
    familyCooperationLevel: initial.familyCooperationLevel || '',
    safetyConcernsNoted: initial.safetyConcernsNoted,
    followUpNeeded: initial.followUpNeeded,
    followUpNotes: initial.followUpNotes || '',
    visitOutcome: initial.visitOutcome || '',
    purpose: initial.purpose || '',
    observations: initial.observations || '',
    locationVisited: initial.locationVisited || '',
    familyMembersPresent: initial.familyMembersPresent || '',
  });

  function set(key: string, value: string | boolean) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formEl = e.currentTarget as HTMLFormElement;
    if (!formEl.checkValidity()) {
      formEl.reportValidity();
      return;
    }
    setSaving(true);
    const res = await apiFetch(`/api/home-visitations/${initial.visitationId}`, {
      method: 'PUT',
      body: JSON.stringify({
        residentId: initial.residentId,
        visitDate: form.visitDate,
        socialWorker: form.socialWorker,
        visitType: form.visitType,
        familyCooperationLevel: form.familyCooperationLevel || null,
        safetyConcernsNoted: form.safetyConcernsNoted,
        followUpNeeded: form.followUpNeeded,
        followUpNotes: form.followUpNotes || null,
        visitOutcome: form.visitOutcome || null,
        purpose: form.purpose || null,
        observations: form.observations || null,
        locationVisited: form.locationVisited || null,
        familyMembersPresent: form.familyMembersPresent || null,
      }),
    });
    if (res.ok) {
      onSaved({
        ...initial,
        visitDate: form.visitDate,
        socialWorker: form.socialWorker,
        visitType: form.visitType,
        familyCooperationLevel: form.familyCooperationLevel || null,
        safetyConcernsNoted: form.safetyConcernsNoted,
        followUpNeeded: form.followUpNeeded,
        followUpNotes: form.followUpNotes || null,
        visitOutcome: form.visitOutcome || null,
        purpose: form.purpose || null,
        observations: form.observations || null,
        locationVisited: form.locationVisited || null,
        familyMembersPresent: form.familyMembersPresent || null,
      });
      onClose();
    }
    setSaving(false);
  }

  return (
    <>
    {validationMsg && <ValidationModal message={validationMsg} onClose={() => setValidationMsg('')} />}
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="sticky top-0 bg-white rounded-t-3xl px-6 py-5 border-b border-dark/8 flex items-center justify-between z-10">
          <div>
            <h2 className="font-display text-xl font-bold text-navy">Edit home visitation</h2>
            <p className="text-xs text-dark/40 mt-0.5">#{initial.visitationId} · Resident {initial.residentCode}</p>
          </div>
          <button type="button" onClick={onClose} className="text-dark/35 hover:text-dark hover:bg-dark/6 rounded-lg p-1.5 transition-colors"><X size={18} /></button>
        </div>
        <form className="p-6 space-y-4" onSubmit={handleSubmit}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Visit date</label>
              <input type="date" required value={form.visitDate} onChange={e => set('visitDate', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Social worker</label>
              <input required value={form.socialWorker} onChange={e => set('socialWorker', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Visit type</label>
              <input value={form.visitType} onChange={e => set('visitType', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Family cooperation</label>
              <select value={form.familyCooperationLevel} onChange={e => set('familyCooperationLevel', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                <option value="">—</option>
                {['Highly Cooperative', 'Cooperative', 'Neutral', 'Uncooperative'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Outcome</label>
              <select value={form.visitOutcome} onChange={e => set('visitOutcome', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                <option value="">—</option>
                {['Favorable', 'Needs Improvement', 'Unfavorable', 'Inconclusive'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Purpose</label>
            <textarea rows={2} value={form.purpose} onChange={e => set('purpose', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Observations</label>
            <textarea rows={3} value={form.observations} onChange={e => set('observations', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Follow-up notes</label>
            <textarea rows={2} value={form.followUpNotes} onChange={e => set('followUpNotes', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Location visited</label>
              <input value={form.locationVisited} onChange={e => set('locationVisited', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Family members present</label>
              <input value={form.familyMembersPresent} onChange={e => set('familyMembersPresent', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </div>
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-dark/60 cursor-pointer">
              <input type="checkbox" checked={form.safetyConcernsNoted} onChange={e => set('safetyConcernsNoted', e.target.checked)} className="w-4 h-4 accent-red-500" />
              Safety concerns noted
            </label>
            <label className="flex items-center gap-2 text-sm text-dark/60 cursor-pointer">
              <input type="checkbox" checked={form.followUpNeeded} onChange={e => set('followUpNeeded', e.target.checked)} className="w-4 h-4 accent-teal" />
              Follow-up needed
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-dark/15 text-dark/60 text-sm font-semibold hover:bg-cream transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 btn-primary text-sm disabled:opacity-60">{saving ? 'Saving...' : 'Save changes'}</button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}
