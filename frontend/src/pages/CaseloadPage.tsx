import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, X, ChevronRight, User } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { residents } from '../data/mockData';

const riskBadge = (risk: string) => {
  const map: Record<string, string> = {
    Low: 'badge-low',
    Medium: 'badge-medium',
    High: 'badge-high',
    Critical: 'badge-critical',
  };
  return <span className={map[risk] || 'badge-medium'}>{risk}</span>;
};

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    Active: 'bg-blue-100 text-blue-700',
    Reintegrating: 'bg-teal/10 text-teal-dark',
    Aftercare: 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};

export default function CaseloadPage() {
  const [selectedResident, setSelectedResident] = useState<typeof residents[0] | null>(null);

  return (
    <AdminLayout>
      <div className="space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-navy">Caseload Inventory</h1>
            <p className="text-dark/50 text-sm mt-1">47 active residents across 8 safe houses</p>
          </div>
          <button className="btn-primary flex items-center gap-2 text-sm self-start sm:self-auto">
            <Plus size={16} />
            Add Resident
          </button>
        </div>

        {/* Filter bar */}
        <div className="card py-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/30" />
              <input
                type="text"
                placeholder="Search by case no., worker, or safehouse..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal placeholder-dark/30"
              />
            </div>
            {['Status', 'Safehouse', 'Risk Level'].map(filter => (
              <select
                key={filter}
                className="px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm text-dark/60 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
              >
                <option>{filter}</option>
                {filter === 'Status' && ['Active', 'Reintegrating', 'Aftercare'].map(o => <option key={o}>{o}</option>)}
                {filter === 'Safehouse' && ['SH-01', 'SH-02', 'SH-03', 'SH-04'].map(o => <option key={o}>{o}</option>)}
                {filter === 'Risk Level' && ['Low', 'Medium', 'High', 'Critical'].map(o => <option key={o}>{o}</option>)}
              </select>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark/8 bg-cream/70">
                  {['Case No.', 'Safehouse', 'Age', 'Category', 'Risk Level', 'Status', 'Social Worker'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-dark/40 uppercase tracking-wide px-5 py-3.5 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {residents.map((r, i) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedResident(r)}
                    className={`border-b border-dark/5 cursor-pointer hover:bg-teal/4 transition-colors last:border-0 ${i % 2 === 0 ? '' : 'bg-cream/30'}`}
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-sm font-semibold text-navy">{r.caseNo}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-dark/70 bg-navy/6 px-2 py-0.5 rounded-md">{r.safehouse}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-dark/70">{r.age}</td>
                    <td className="px-5 py-3.5 text-sm text-dark/70 whitespace-nowrap">{r.category}</td>
                    <td className="px-5 py-3.5">{riskBadge(r.risk)}</td>
                    <td className="px-5 py-3.5">{statusBadge(r.status)}</td>
                    <td className="px-5 py-3.5 text-sm text-dark/70 whitespace-nowrap">{r.worker}</td>
                    <td className="px-5 py-3.5">
                      <ChevronRight size={16} className="text-dark/25" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Side panel */}
      {selectedResident && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedResident(null)} />
          <div className="relative bg-white w-full max-w-md shadow-2xl overflow-y-auto animate-slide-in flex flex-col">
            {/* Panel header */}
            <div className="bg-navy px-6 py-5 flex items-start justify-between flex-shrink-0">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                    <User size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-mono text-sm text-white/60">{selectedResident.caseNo}</p>
                    <p className="text-white font-semibold">Resident {selectedResident.id}</p>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedResident(null)} className="text-white/50 hover:text-white mt-1">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5 flex-1">
              {/* Badges */}
              <div className="flex gap-2 flex-wrap">
                {riskBadge(selectedResident.risk)}
                {statusBadge(selectedResident.status)}
                <span className="bg-navy/8 text-navy px-2.5 py-0.5 rounded-full text-xs font-semibold">{selectedResident.safehouse}</span>
              </div>

              {/* Demographics */}
              <div className="card bg-cream p-5">
                <h3 className="font-semibold text-sm text-navy mb-3 uppercase tracking-wide">Demographics</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Age', selectedResident.age],
                    ['Category', selectedResident.category],
                    ['Civil Status', selectedResident.demographics.civilStatus],
                    ['Religion', selectedResident.demographics.religion],
                    ['Education', selectedResident.demographics.educationLevel],
                    ['Date Admitted', selectedResident.demographics.dateAdmitted],
                  ].map(([label, value]) => (
                    <div key={String(label)}>
                      <p className="text-xs text-dark/40 font-medium mb-0.5">{label}</p>
                      <p className="text-sm font-semibold text-dark">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Assigned worker */}
              <div>
                <p className="text-xs text-dark/40 font-semibold uppercase tracking-wide mb-2">Assigned Social Worker</p>
                <div className="flex items-center gap-3 bg-teal/6 rounded-xl px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center text-white text-xs font-bold">
                    {selectedResident.worker.split(' ').map(n => n[0]).join('')}
                  </div>
                  <span className="text-sm font-semibold text-navy">{selectedResident.worker}</span>
                </div>
              </div>

              {/* Recent note */}
              <div>
                <p className="text-xs text-dark/40 font-semibold uppercase tracking-wide mb-2">Most Recent Session Note</p>
                <div className="bg-cream rounded-xl px-4 py-4 border-l-4 border-teal">
                  <p className="text-sm text-dark/70 leading-relaxed">{selectedResident.recentNote}</p>
                </div>
              </div>

              <Link
                to={`/admin/resident/${selectedResident.id}`}
                className="w-full btn-primary text-sm flex items-center justify-center gap-2"
              >
                View Full Case Profile
                <ChevronRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
