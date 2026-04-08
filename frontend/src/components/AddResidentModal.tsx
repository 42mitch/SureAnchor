import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { apiFetch } from '../api';
import ValidationModal from '../components/ValidationModal';

interface Safehouse {
  safehouseId: number;
  safehouseCode: string;
  name: string;
}

interface Resident {
  residentId: number;
  caseNo: string;
  internalCode: string;
  safehouse: string;
  age: number;
  category: string;
  risk: string;
  status: string;
  worker: string;
  religion: string | null;
  dateAdmitted: string | null;
  isPwd: boolean;
  pwdType: string | null;
  hasSpecialNeeds: boolean;
  specialNeedsDiagnosis: string | null;
  familyIs4Ps: boolean;
  familySoloParent: boolean;
  familyIndigenous: boolean;
  familyInformalSettler: boolean;
  referralSource: string | null;
  referringAgencyPerson: string | null;
  reintegrationType: string | null;
  reintegrationStatus: string | null;
}

export default function AddResidentModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (r: Resident) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [validationMsg, setValidationMsg] = useState('');
  const [safehouses, setSafehouses] = useState<Safehouse[]>([]);
  const [form, setForm] = useState({
    caseControlNo: '',
    internalCode: '',
    safehouseId: '',
    caseStatus: 'Active',
    caseCategory: '',
    currentRiskLevel: 'Medium',
    assignedSocialWorker: '',
    religion: '',
    dateOfBirth: '',
    dateOfAdmission: '',
  });

  useEffect(() => {
    apiFetch('/api/residents/safehouses')
      .then(r => r.ok ? r.json() : [])
      .then(setSafehouses);
  }, []);

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  const personNameRe = /^[A-Za-z\s'\-]*$/;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!personNameRe.test(form.assignedSocialWorker)) {
      setValidationMsg('Social worker name can only include letters, spaces, apostrophes, and hyphens.');
      return;
    }

    const safehouseIdInt = parseInt(form.safehouseId);
    if (!form.safehouseId || isNaN(safehouseIdInt)) {
      setValidationMsg('Please select a safehouse.');
      return;
    }

    const today = new Date().toISOString().slice(0, 10);
    if (form.dateOfBirth && form.dateOfBirth > today) {
      setValidationMsg('Date of birth cannot be in the future.');
      return;
    }
    if (form.dateOfAdmission && form.dateOfAdmission > today) {
      setValidationMsg('Date of admission cannot be in the future.');
      return;
    }

    setSaving(true);
    const res = await apiFetch('/api/residents', {
      method: 'POST',
      body: JSON.stringify({
        caseControlNo: form.caseControlNo,
        internalCode: form.internalCode,
        safehouseId: safehouseIdInt,
        caseStatus: form.caseStatus,
        caseCategory: form.caseCategory || null,
        currentRiskLevel: form.currentRiskLevel,
        assignedSocialWorker: form.assignedSocialWorker || null,
        religion: form.religion || null,
        dateOfBirth: form.dateOfBirth || null,
        dateOfAdmission: form.dateOfAdmission || null,
      }),
    });

    if (res.ok) {
      const { residentId } = await res.json();
      const selectedSafehouse = safehouses.find(s => s.safehouseId === safehouseIdInt);
      const newResident: Resident = {
        residentId,
        caseNo: form.caseControlNo,
        internalCode: form.internalCode,
        safehouse: selectedSafehouse?.safehouseCode ?? form.safehouseId,
        age: 0,
        category: form.caseCategory,
        risk: form.currentRiskLevel,
        status: form.caseStatus,
        worker: form.assignedSocialWorker,
        religion: form.religion || null,
        dateAdmitted: form.dateOfAdmission || null,
        isPwd: false,
        pwdType: null,
        hasSpecialNeeds: false,
        specialNeedsDiagnosis: null,
        familyIs4Ps: false,
        familySoloParent: false,
        familyIndigenous: false,
        familyInformalSettler: false,
        referralSource: null,
        referringAgencyPerson: null,
        reintegrationType: null,
        reintegrationStatus: null,
      };
      onSaved(newResident);
      onClose();
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
            <h2 className="font-display text-xl font-bold text-navy">Add Resident</h2>
            <button onClick={onClose} className="text-dark/35 hover:text-dark hover:bg-dark/6 rounded-lg p-1.5 transition-colors">
              <X size={18} />
            </button>
          </div>
          <form className="p-6 space-y-4" onSubmit={handleSubmit}>
            <div className="grid sm:grid-cols-2 gap-4">

              <div>
                <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Case Control No. *</label>
                <input
                  type="text" required value={form.caseControlNo}
                  onChange={e => set('caseControlNo', e.target.value)}
                  placeholder="C0001"
                  className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Internal Code *</label>
                <input
                  type="text" required value={form.internalCode}
                  onChange={e => set('internalCode', e.target.value)}
                  placeholder="LS-0001"
                  className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Safehouse *</label>
                <select
                  required value={form.safehouseId}
                  onChange={e => set('safehouseId', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
                >
                  <option value="">Select a safehouse...</option>
                  {safehouses.map(s => (
                    <option key={s.safehouseId} value={String(s.safehouseId)}>
                      {s.safehouseCode} — {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Social Worker</label>
                <input
                  type="text" value={form.assignedSocialWorker}
                  onChange={e => set('assignedSocialWorker', e.target.value)}
                  placeholder="Name"
                  className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Religion</label>
                <input
                  type="text" value={form.religion}
                  onChange={e => set('religion', e.target.value)}
                  placeholder="Optional"
                  className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Date of Birth *</label>
                <input
                  type="date" required value={form.dateOfBirth}
                  onChange={e => set('dateOfBirth', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Date of Admission *</label>
                <input
                  type="date" required value={form.dateOfAdmission}
                  onChange={e => set('dateOfAdmission', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Status *</label>
                <select value={form.caseStatus} onChange={e => set('caseStatus', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                  {['Active', 'Closed', 'Transferred'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Risk Level *</label>
                <select value={form.currentRiskLevel} onChange={e => set('currentRiskLevel', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                  {['Low', 'Medium', 'High', 'Critical'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Case Category</label>
                <select value={form.caseCategory} onChange={e => set('caseCategory', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                  <option value="">Select...</option>
                  {['Abandoned', 'Foundling', 'Surrendered', 'Neglected'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>

            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-dark/15 text-dark/60 text-sm font-semibold hover:bg-cream transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 btn-primary text-sm disabled:opacity-60">
                {saving ? 'Saving...' : 'Add Resident'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}