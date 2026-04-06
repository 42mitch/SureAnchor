import { useState } from 'react';
import { Plus, X, Home, AlertTriangle, CheckCircle, Clock, ChevronRight, Search } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { visitations, residents } from '../data/mockData';

type Visitation = typeof visitations[0];

// ─── Badge helpers ──────────────────────────────────────────────────────────────
const cooperationBadge = (level: string) => {
  const map: Record<string, string> = {
    High:     'bg-green-100 text-green-700',
    Moderate: 'bg-yellow-100 text-yellow-700',
    Low:      'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[level] || 'bg-gray-100 text-gray-600'}`}>
      {level}
    </span>
  );
};

const outcomeBadge = (outcome: string) => {
  const map: Record<string, { cls: string; icon: any }> = {
    Positive:          { cls: 'bg-green-100 text-green-700',  icon: CheckCircle  },
    Ongoing:           { cls: 'bg-blue-100 text-blue-700',    icon: Clock        },
    'Concerns Raised': { cls: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
    'Hold Recommended':{ cls: 'bg-red-100 text-red-700',      icon: AlertTriangle },
  };
  const item = map[outcome] || { cls: 'bg-gray-100 text-gray-600', icon: Clock };
  const Icon = item.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.cls}`}>
      <Icon size={11} />
      {outcome}
    </span>
  );
};

// ─── Visit Detail Modal ─────────────────────────────────────────────────────────
function VisitDetailModal({ visit, onClose }: { visit: Visitation; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">

        {/* Modal header */}
        <div className={`rounded-t-3xl px-6 py-5 flex items-start justify-between border-b border-dark/8 ${visit.safetyConcern ? 'bg-red-50' : 'bg-cream'}`}>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold bg-white text-navy px-2.5 py-1 rounded-lg shadow-sm">
                {visit.id}
              </span>
              <span className="text-xs font-semibold bg-white text-dark/60 px-2.5 py-1 rounded-lg shadow-sm">
                {visit.visitType}
              </span>
              {visit.safetyConcern && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-red-100 text-red-600 px-2.5 py-1 rounded-lg">
                  <AlertTriangle size={11} />
                  Safety Concern
                </span>
              )}
            </div>
            <p className="text-dark/40 text-xs font-medium">
              Resident {visit.resident} · {visit.date}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-dark/35 hover:text-dark hover:bg-dark/8 rounded-lg p-1.5 transition-colors flex-shrink-0 ml-3"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Social Worker */}
          <div className="flex items-center gap-3 bg-teal/6 rounded-2xl px-4 py-3.5">
            <div className="w-9 h-9 rounded-full bg-teal flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {visit.worker.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="text-xs text-dark/40 font-medium">Social Worker</p>
              <p className="text-sm font-semibold text-navy">{visit.worker}</p>
            </div>
          </div>

          {/* Key details grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-cream rounded-2xl px-4 py-4">
              <p className="text-xs font-semibold text-dark/40 uppercase tracking-widest mb-2">Visit Type</p>
              <p className="text-sm font-semibold text-dark">{visit.visitType}</p>
            </div>
            <div className="bg-cream rounded-2xl px-4 py-4">
              <p className="text-xs font-semibold text-dark/40 uppercase tracking-widest mb-2">Visit Date</p>
              <p className="text-sm font-semibold text-dark">{visit.date}</p>
            </div>
            <div className="bg-cream rounded-2xl px-4 py-4">
              <p className="text-xs font-semibold text-dark/40 uppercase tracking-widest mb-2">Family Cooperation</p>
              {cooperationBadge(visit.familyCooperation)}
            </div>
            <div className="bg-cream rounded-2xl px-4 py-4">
              <p className="text-xs font-semibold text-dark/40 uppercase tracking-widest mb-2">Outcome</p>
              {outcomeBadge(visit.outcome)}
            </div>
          </div>

          {/* Safety concern callout */}
          {visit.safetyConcern && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-4">
              <AlertTriangle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700 mb-0.5">Safety Concern Flagged</p>
                <p className="text-xs text-red-500">This visit has been flagged for supervisor review. Follow-up action required.</p>
              </div>
            </div>
          )}

          {/* Outcome highlight */}
          <div className={`rounded-2xl px-4 py-4 border ${visit.outcome === 'Positive' ? 'bg-green-50 border-green-200' : visit.outcome === 'Hold Recommended' ? 'bg-red-50 border-red-200' : 'bg-cream border-dark/10'}`}>
            <p className="text-xs font-semibold text-dark/40 uppercase tracking-widest mb-2">Visit Summary</p>
            <p className="text-sm text-dark/70 leading-relaxed">
              {visit.outcome === 'Positive' && `The home visit for Resident ${visit.resident} was completed successfully. Family cooperation was rated ${visit.familyCooperation.toLowerCase()} and no immediate safety concerns were identified.`}
              {visit.outcome === 'Ongoing' && `The home visit for Resident ${visit.resident} is part of an ongoing assessment. Family cooperation level was ${visit.familyCooperation.toLowerCase()}. Follow-up visits are scheduled.`}
              {visit.outcome === 'Concerns Raised' && `Concerns were raised during this visit for Resident ${visit.resident}. Family cooperation was ${visit.familyCooperation.toLowerCase()}. Case supervisor has been notified for review.`}
              {visit.outcome === 'Hold Recommended' && `A hold on reintegration is recommended following this visit for Resident ${visit.resident}. Family cooperation was ${visit.familyCooperation.toLowerCase()}. Immediate case conference required.`}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl border border-dark/12 text-dark/60 text-sm font-semibold hover:bg-cream transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Log Visit Modal ────────────────────────────────────────────────────────────
function LogVisitModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="sticky top-0 bg-white rounded-t-3xl px-6 py-5 border-b border-dark/8 flex items-center justify-between z-10">
          <div>
            <h2 className="font-display text-xl font-bold text-navy">Log New Home Visit</h2>
            <p className="text-xs text-dark/40 mt-0.5">Field visit documentation</p>
          </div>
          <button onClick={onClose} className="text-dark/35 hover:text-dark hover:bg-dark/6 rounded-lg p-1.5 transition-colors">
            <X size={18} />
          </button>
        </div>
        <form className="p-6 space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Resident</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                <option>Select resident...</option>
                {residents.map(r => <option key={r.id}>Resident {r.id}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Visit Date</label>
              <input type="date" defaultValue="2024-07-21"
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Visit Type</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                <option>Safety Assessment</option>
                <option>Pre-Reintegration</option>
                <option>Trial Home Visit</option>
                <option>Family Counseling</option>
                <option>Aftercare Check-in</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Family Cooperation</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                <option>High</option>
                <option>Moderate</option>
                <option>Low</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Visit Notes</label>
            <textarea rows={4} placeholder="Describe the visit — observations, family dynamics, environment assessment..."
              className="w-full px-4 py-3 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none placeholder-dark/25" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Outcome</label>
            <select className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
              <option>Positive</option>
              <option>Ongoing</option>
              <option>Concerns Raised</option>
              <option>Hold Recommended</option>
            </select>
          </div>
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl p-3">
            <input type="checkbox" id="safetyConcern" className="w-4 h-4 accent-red-500" />
            <label htmlFor="safetyConcern" className="text-sm font-medium text-red-700">
              Flag safety concern (will alert case supervisor)
            </label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-dark/15 text-dark/60 text-sm font-semibold hover:bg-cream transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary text-sm">
              Save Visit Log
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function VisitationsPage() {
  const [selectedVisit, setSelectedVisit] = useState<Visitation | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);

  return (
    <AdminLayout>
      <div className="space-y-5 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-navy">Home Visitations</h1>
            <p className="text-dark/50 text-sm mt-1">{visitations.length} visits recorded · click any entry to view details</p>
          </div>
          <button
            onClick={() => setShowLogModal(true)}
            className="btn-primary flex items-center gap-2 text-sm self-start sm:self-auto"
          >
            <Plus size={16} />
            Log New Visit
          </button>
        </div>

        {/* Search */}
        <div className="card py-3.5">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/30" />
            <input
              type="text"
              placeholder="Search by resident ID, social worker, or visit type..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-dark/10 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/25 focus:border-teal placeholder-dark/30"
            />
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark/8 bg-cream/70">
                  <th className="text-left text-xs font-semibold text-dark/40 uppercase tracking-wide px-5 py-3.5">Visit ID</th>
                  <th className="text-left text-xs font-semibold text-dark/40 uppercase tracking-wide px-5 py-3.5">Resident</th>
                  <th className="text-left text-xs font-semibold text-dark/40 uppercase tracking-wide px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {visitations.map((visit, i) => (
                  <tr
                    key={visit.id}
                    onClick={() => setSelectedVisit(visit)}
                    className={`border-b border-dark/5 last:border-0 cursor-pointer hover:bg-teal/4 transition-colors group ${
                      i % 2 === 0 ? '' : 'bg-cream/30'
                    }`}
                  >
                    {/* Visit ID */}
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-bold text-dark/40">{visit.id}</span>
                    </td>

                    {/* Resident */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          visit.safetyConcern ? 'bg-red-100' : 'bg-teal/10'
                        }`}>
                          {visit.safetyConcern
                            ? <AlertTriangle size={14} className="text-red-500" />
                            : <Home size={14} className="text-teal" />
                          }
                        </div>
                        <div>
                          <span className="font-mono text-sm font-semibold text-navy">
                            Resident {visit.resident}
                          </span>
                          {visit.safetyConcern && (
                            <span className="ml-2 text-xs font-semibold text-red-500">· Safety Concern</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4">
                      <span className="text-sm text-dark/65">{visit.date}</span>
                    </td>

                    {/* Chevron */}
                    <td className="px-5 py-4 text-right">
                      <ChevronRight
                        size={16}
                        className="text-dark/20 group-hover:text-teal group-hover:translate-x-0.5 transition-all inline-block"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          <div className="px-5 py-3 border-t border-dark/6 bg-cream/40 flex items-center justify-between">
            <span className="text-xs text-dark/40 font-medium">
              Showing {visitations.length} of {visitations.length} entries
            </span>
            <span className="text-xs text-dark/30">
              {visitations.filter(v => v.safetyConcern).length} safety concern{visitations.filter(v => v.safetyConcern).length !== 1 ? 's' : ''} flagged
            </span>
          </div>
        </div>
      </div>

      {/* Visit detail modal */}
      {selectedVisit && (
        <VisitDetailModal visit={selectedVisit} onClose={() => setSelectedVisit(null)} />
      )}

      {/* Log visit modal */}
      {showLogModal && (
        <LogVisitModal onClose={() => setShowLogModal(false)} />
      )}
    </AdminLayout>
  );
}
