import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Plus, X, ChevronRight, User, Trash2 } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { useListPagination } from '../hooks/useListPagination';
import ListPaginationBar from '../components/ListPaginationBar';
import AddResidentModal from '../components/AddResidentModal';

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

const riskBadge = (risk: string) => {
  const map: Record<string, string> = {
    Low: 'badge-low', Medium: 'badge-medium', High: 'badge-high', Critical: 'badge-critical',
  };
  return <span className={map[risk] || 'badge-medium'}>{risk}</span>;
};

const RISK_LEVELS = ['Low', 'Medium', 'High', 'Critical'] as const;
const STATUS_LEVELS = ['Active', 'Closed', 'Transferred'] as const;

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    Active: 'bg-blue-100 text-blue-700',
    Closed: 'bg-gray-100 text-gray-500',
    Transferred: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};

export default function CaseloadPage() {
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('Admin') ?? false;
  const [searchParams, setSearchParams] = useSearchParams();

  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [safehouseFilter, setSafehouseFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [reintegrationFilter, setReintegrationFilter] = useState('');
  const [disabilityFilter, setDisabilityFilter] = useState('');
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Resident | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    apiFetch('/api/residents')
      .then(r => r.ok ? r.json() : [])
      .then(setResidents)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const r = searchParams.get('risk');
    if (r && RISK_LEVELS.includes(r as (typeof RISK_LEVELS)[number])) {
      setRiskFilter(r);
    } else {
      setRiskFilter('');
    }
    const s = searchParams.get('status');
    if (s && STATUS_LEVELS.includes(s as (typeof STATUS_LEVELS)[number])) {
      setStatusFilter(s);
    } else {
      setStatusFilter('');
    }
  }, [searchParams]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await apiFetch(`/api/residents/${deleteTarget.residentId}`, { method: 'DELETE' });
    setResidents(prev => prev.filter(r => r.residentId !== deleteTarget.residentId));
    setDeleteTarget(null);
    setSelectedResident(null);
    setDeleteLoading(false);
  }

  const filtered = residents.filter(r => {
    const matchSearch = !search ||
      r.caseNo.toLowerCase().includes(search.toLowerCase()) ||
      r.internalCode.toLowerCase().includes(search.toLowerCase()) ||
      r.worker.toLowerCase().includes(search.toLowerCase()) ||
      r.safehouse.toLowerCase().includes(search.toLowerCase()) ||
      (r.referralSource ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || r.status === statusFilter;
    const matchRisk = !riskFilter || r.risk === riskFilter;
    const matchSafehouse = !safehouseFilter || r.safehouse === safehouseFilter;
    const matchCategory = !categoryFilter || r.category === categoryFilter;
    const matchReintegration = !reintegrationFilter || (r.reintegrationStatus ?? '') === reintegrationFilter;
    const matchDisability =
      !disabilityFilter ||
      (disabilityFilter === 'PWD' && r.isPwd) ||
      (disabilityFilter === 'SpecialNeeds' && r.hasSpecialNeeds);
    return matchSearch && matchStatus && matchRisk && matchSafehouse && matchCategory && matchReintegration && matchDisability;
  });

  const caseloadPag = useListPagination(filtered, [search, statusFilter, riskFilter, safehouseFilter, categoryFilter, reintegrationFilter, disabilityFilter]);
  const safehouseOptions = [...new Set(residents.map(r => r.safehouse).filter(Boolean))].sort();
  const categoryOptions = [...new Set(residents.map(r => r.category).filter(Boolean))].sort();
  const reintegrationOptions = [...new Set(residents.map(r => r.reintegrationStatus).filter(Boolean))].sort();

  return (
    <AdminLayout>
      <div className="space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-navy">Caseload Inventory</h1>
            <p className="text-dark/50 text-sm mt-1">{residents.length} residents in system</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2 text-sm self-start sm:self-auto"
          >
            <Plus size={16} />
            Add Resident
          </button>
        </div>

        {/* Filter bar */}
        <div className="card py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/30" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by case no., worker, or safehouse..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal placeholder-dark/30"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => {
                const v = e.target.value;
                setStatusFilter(v);
                setSearchParams(
                  (prev) => {
                    const p = new URLSearchParams(prev);
                    if (v) p.set('status', v);
                    else p.delete('status');
                    return p;
                  },
                  { replace: true }
                );
              }}
              className="px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm text-dark/60 focus:outline-none focus:ring-2 focus:ring-teal/30"
            >
              <option value="">Status</option>
              {STATUS_LEVELS.map(o => <option key={o}>{o}</option>)}
            </select>
            <select
              value={riskFilter}
              onChange={e => {
                const v = e.target.value;
                setRiskFilter(v);
                setSearchParams(
                  (prev) => {
                    const p = new URLSearchParams(prev);
                    if (v) p.set('risk', v);
                    else p.delete('risk');
                    return p;
                  },
                  { replace: true }
                );
              }}
              className="px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm text-dark/60 focus:outline-none focus:ring-2 focus:ring-teal/30"
            >
              <option value="">Risk Level</option>
              {RISK_LEVELS.map(o => <option key={o}>{o}</option>)}
            </select>
            <select
              value={safehouseFilter}
              onChange={e => setSafehouseFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm text-dark/60 focus:outline-none focus:ring-2 focus:ring-teal/30"
            >
              <option value="">Safehouse</option>
              {safehouseOptions.map(o => <option key={o}>{o}</option>)}
            </select>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm text-dark/60 focus:outline-none focus:ring-2 focus:ring-teal/30"
            >
              <option value="">Case Category</option>
              {categoryOptions.map(o => <option key={o}>{o}</option>)}
            </select>
            <select
              value={reintegrationFilter}
              onChange={e => setReintegrationFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm text-dark/60 focus:outline-none focus:ring-2 focus:ring-teal/30"
            >
              <option value="">Reintegration</option>
              {reintegrationOptions.map(o => <option key={o}>{o}</option>)}
            </select>
            <select
              value={disabilityFilter}
              onChange={e => setDisabilityFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm text-dark/60 focus:outline-none focus:ring-2 focus:ring-teal/30"
            >
              <option value="">Disability</option>
              <option value="PWD">PWD</option>
              <option value="SpecialNeeds">Special Needs</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 rounded-full border-4 border-teal border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-dark/40 text-sm">No residents found.</div>
          ) : (
            <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark/8 bg-cream/70">
                    {['Case No.', 'Safehouse', 'Age', 'Category', 'Risk Level', 'Status', 'Social Worker', ''].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-dark/40 uppercase tracking-wide px-5 py-3.5 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {caseloadPag.pageItems.map((r, i) => (
                    <tr
                      key={r.residentId}
                      onClick={() => setSelectedResident(r)}
                      className={`border-b border-dark/5 cursor-pointer hover:bg-teal/4 transition-colors last:border-0 ${(caseloadPag.startIndex + i) % 2 !== 0 ? 'bg-cream/30' : ''}`}
                    >
                      <td className="px-5 py-3.5"><span className="font-mono text-sm font-semibold text-navy">{r.caseNo}</span></td>
                      <td className="px-5 py-3.5"><span className="text-sm font-medium text-dark/70 bg-navy/6 px-2 py-0.5 rounded-md">{r.safehouse}</span></td>
                      <td className="px-5 py-3.5 text-sm text-dark/70">{r.age}</td>
                      <td className="px-5 py-3.5 text-sm text-dark/70 whitespace-nowrap">{r.category || '—'}</td>
                      <td className="px-5 py-3.5">{riskBadge(r.risk)}</td>
                      <td className="px-5 py-3.5">{statusBadge(r.status)}</td>
                      <td className="px-5 py-3.5 text-sm text-dark/70 whitespace-nowrap">{r.worker || '—'}</td>
                      <td className="px-5 py-3.5 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        {isAdmin && (
                          <button
                            onClick={() => setDeleteTarget(r)}
                            className="p-1.5 rounded-lg text-dark/25 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Delete resident"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                        <ChevronRight size={16} className="text-dark/25" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ListPaginationBar
              page={caseloadPag.page}
              pageCount={caseloadPag.pageCount}
              pageSize={caseloadPag.pageSize}
              setPage={caseloadPag.setPage}
              setPageSize={caseloadPag.setPageSize}
              total={caseloadPag.total}
              startIndex={caseloadPag.startIndex}
              endIndex={caseloadPag.endIndex}
            />
            </>
          )}
        </div>
      </div>

      {/* Side panel */}
      {selectedResident && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedResident(null)} />
          <div className="relative bg-white w-full max-w-md shadow-2xl overflow-y-auto animate-slide-in flex flex-col">
            <div className="bg-navy px-6 py-5 flex items-start justify-between flex-shrink-0">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                  <User size={18} className="text-white" />
                </div>
                <div>
                  <p className="font-mono text-sm text-white/60">{selectedResident.caseNo}</p>
                  <p className="text-white font-semibold">Resident {selectedResident.internalCode}</p>
                </div>
              </div>
              <button onClick={() => setSelectedResident(null)} className="text-white/50 hover:text-white mt-1">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-5 flex-1">
              <div className="flex gap-2 flex-wrap">
                {riskBadge(selectedResident.risk)}
                {statusBadge(selectedResident.status)}
                <span className="bg-navy/8 text-navy px-2.5 py-0.5 rounded-full text-xs font-semibold">{selectedResident.safehouse}</span>
              </div>
              <div className="card bg-cream p-5">
                <h3 className="font-semibold text-sm text-navy mb-3 uppercase tracking-wide">Details</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Age', selectedResident.age],
                    ['Category', selectedResident.category || '—'],
                    ['Religion', selectedResident.religion || '—'],
                    ['Date Admitted', selectedResident.dateAdmitted ?? '—'],
                    ['Social Worker', selectedResident.worker || '—'],
                    ['Status', selectedResident.status],
                    ['Disability (PWD)', selectedResident.isPwd ? `Yes${selectedResident.pwdType ? ` — ${selectedResident.pwdType}` : ''}` : 'No'],
                    ['Special Needs', selectedResident.hasSpecialNeeds ? `Yes${selectedResident.specialNeedsDiagnosis ? ` — ${selectedResident.specialNeedsDiagnosis}` : ''}` : 'No'],
                    ['4Ps Beneficiary', selectedResident.familyIs4Ps ? 'Yes' : 'No'],
                    ['Solo Parent Family', selectedResident.familySoloParent ? 'Yes' : 'No'],
                    ['Indigenous Group', selectedResident.familyIndigenous ? 'Yes' : 'No'],
                    ['Informal Settler', selectedResident.familyInformalSettler ? 'Yes' : 'No'],
                    ['Referral Source', selectedResident.referralSource || '—'],
                    ['Referring Agency/Person', selectedResident.referringAgencyPerson || '—'],
                    ['Reintegration Type', selectedResident.reintegrationType || '—'],
                    ['Reintegration Status', selectedResident.reintegrationStatus || '—'],
                  ].map(([label, value]) => (
                    <div key={String(label)}>
                      <p className="text-xs text-dark/40 font-medium mb-0.5">{label}</p>
                      <p className="text-sm font-semibold text-dark">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  to={`/admin/resident/${selectedResident.residentId}`}
                  className="w-full btn-primary text-sm flex items-center justify-center gap-2"
                >
                  View Full Case Profile
                  <ChevronRight size={15} />
                </Link>
                {isAdmin && (
                  <button
                    onClick={() => setDeleteTarget(selectedResident)}
                    className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 size={15} />
                    Delete Resident
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add modal (placeholder — full form can be expanded) */}
      {showAddModal && (
        <AddResidentModal
          onClose={() => setShowAddModal(false)}
          onSaved={(r) => { setResidents(prev => [...prev, r]); setShowAddModal(false); }}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDeleteModal
          title="Delete Resident"
          description={`Are you sure you want to permanently delete resident ${deleteTarget.caseNo}? All associated records will also be removed.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </AdminLayout>
  );
}
