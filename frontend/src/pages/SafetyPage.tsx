import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert, AlertTriangle, CheckCircle, FileText,
  ChevronRight, User, ClipboardX, X, Search,
} from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { apiFetch } from '../api';
import { formatSafehouseName } from '../utils/currency';
import { useListPagination } from '../hooks/useListPagination';
import ListPaginationBar from '../components/ListPaginationBar';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Flag {
  recordingId: number;
  residentId: number;
  residentCode: string;
  sessionDate: string;
  socialWorker: string;
  narrative: string;
  followUp: string;
  concernsFlagged: boolean;
}

interface Incident {
  incidentId: number;
  residentId: number;
  residentCode: string;
  incidentDate: string;
  incidentType: string;
  severity: string;
  description: string;
  responseTaken: string;
  reportedBy: string;
  resolved: boolean;
  followUpRequired: boolean;
}

interface CriticalResident {
  residentId: number;
  internalCode: string;
  safehouse: string;
  age: number;
  category: string;
  risk: string;
  status: string;
  worker: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const riskBadge = (risk: string) => {
  const map: Record<string, string> = {
    Low: 'bg-green-100 text-green-700 border border-green-200',
    Medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    High: 'bg-orange-100 text-orange-700 border border-orange-200',
    Critical: 'bg-red-100 text-red-700 border border-red-200',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[risk] || 'bg-gray-100 text-gray-600'}`}>{risk} Risk</span>;
};

const severityBadge = (severity: string) => {
  const map: Record<string, string> = {
    Low: 'bg-blue-50 text-blue-600 border border-blue-200',
    Medium: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    High: 'bg-red-50 text-red-600 border border-red-200',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[severity] || 'bg-gray-100 text-gray-600'}`}>{severity}</span>;
};

const incidentTypeLabel: Record<string, string> = {
  Behavioral: 'Behavioral',
  Medical: 'Medical',
  Security: 'Security',
  RunawayAttempt: 'Runaway Attempt',
  SelfHarm: 'Self-Harm',
  ConflictWithPeer: 'Conflict w/ Peer',
  PropertyDamage: 'Property Damage',
};

// ── CollapseCard ──────────────────────────────────────────────────────────────
// Uses direct DOM ref manipulation (no React state) so the browser sees a clean
// maxHeight value before any transition fires — avoids the re-render timing
// issue that breaks CSS transitions when using useState.

function CollapseCard({ removing, children }: { removing: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  // Pin max-height to the real content height synchronously before first paint.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.maxHeight = el.scrollHeight + 'px';
  }, []);

  // When removing flips true, push max-height → 0 directly on the DOM node.
  // No setState → no extra re-render → transition fires cleanly every time.
  useEffect(() => {
    const el = ref.current;
    if (!el || !removing) return;
    el.style.maxHeight = '0px';
    el.style.opacity = '0';
  }, [removing]);

  return (
    <div
      ref={ref}
      style={{ overflow: 'hidden', transition: 'max-height 0.38s ease, opacity 0.28s ease' }}
    >
      <div className="pb-3">{children}</div>
    </div>
  );
}

// ── Incident Detail Modal ─────────────────────────────────────────────────────

function IncidentDetailModal({ incident, onClose, onResolve, onViewProfile, resolving }: {
  incident: Incident;
  onClose: () => void;
  onResolve: () => void;
  onViewProfile: () => void;
  resolving: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">

        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-3xl px-6 py-5 border-b border-dark/8 flex items-start justify-between z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold bg-navy/8 text-navy px-2.5 py-1 rounded-lg">
                Resident {incident.residentCode}
              </span>
              {severityBadge(incident.severity)}
              {incident.followUpRequired && (
                <span className="bg-orange-50 border border-orange-200 text-orange-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  Follow-up required
                </span>
              )}
            </div>
            <p className="text-dark/40 text-xs font-medium mt-1">
              {incidentTypeLabel[incident.incidentType] ?? incident.incidentType} · {incident.incidentDate} · #{incident.incidentId}
            </p>
          </div>
          <button onClick={onClose} className="text-dark/35 hover:text-dark hover:bg-dark/6 rounded-lg p-1.5 transition-colors flex-shrink-0 ml-3">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {incident.reportedBy && (
            <div className="flex items-center gap-3 bg-orange-50/60 rounded-2xl px-4 py-3.5">
              <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-xs font-bold flex-shrink-0">
                {incident.reportedBy.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="text-xs text-dark/40 font-medium">Reported By</p>
                <p className="text-sm font-semibold text-navy">{incident.reportedBy}</p>
              </div>
            </div>
          )}

          {incident.description && (
            <div>
              <p className="text-xs font-semibold text-dark/40 uppercase tracking-widest mb-2">Description</p>
              <div className="bg-cream rounded-2xl px-5 py-4 border-l-4 border-orange-300">
                <p className="text-sm text-dark/75 leading-relaxed">{incident.description}</p>
              </div>
            </div>
          )}

          {incident.responseTaken && (
            <div>
              <p className="text-xs font-semibold text-dark/40 uppercase tracking-widest mb-2">Response Taken</p>
              <div className="flex items-start gap-3 bg-teal/6 rounded-2xl px-4 py-3.5 border border-teal/15">
                <div className="w-1.5 h-1.5 rounded-full bg-teal mt-1.5 flex-shrink-0" />
                <p className="text-sm font-medium text-dark/70">{incident.responseTaken}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button onClick={onViewProfile} className="flex-1 py-3 rounded-xl border border-dark/12 text-dark/60 text-sm font-semibold hover:bg-cream transition-colors">
              View Profile
            </button>
            <button
              onClick={() => { onResolve(); onClose(); }}
              disabled={resolving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-semibold hover:bg-green-100 transition-colors disabled:opacity-50"
            >
              <CheckCircle size={15} />
              {resolving ? 'Resolving…' : 'Resolve'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Flag Card ─────────────────────────────────────────────────────────────────

function FlagCard({ flag, resolving, removing, onResolve, onViewProfile }: {
  flag: Flag; resolving: boolean; removing: boolean;
  onResolve: () => void; onViewProfile: () => void;
}) {
  return (
    <CollapseCard removing={removing}>
      <div className="card border border-red-100 bg-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <FileText size={15} className="text-red-500" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold bg-navy/8 text-navy px-2 py-0.5 rounded-lg">
                  Resident {flag.residentCode}
                </span>
                <span className="text-xs text-dark/40 font-medium">Session #{flag.recordingId} · {flag.sessionDate}</span>
              </div>
              <p className="text-xs font-semibold text-dark/50 mb-1.5">
                Social Worker: <span className="text-dark/70">{flag.socialWorker}</span>
              </p>
              {flag.narrative && (
                <p className="text-sm text-dark/65 leading-relaxed line-clamp-2">{flag.narrative}</p>
              )}
              {flag.followUp && (
                <div className="mt-2 flex items-start gap-2 bg-gold/8 rounded-lg px-3 py-2 border border-gold/15">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 flex-shrink-0" />
                  <p className="text-xs text-dark/60 font-medium">{flag.followUp}</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <button onClick={onViewProfile} className="text-xs text-navy/60 hover:text-navy font-semibold underline underline-offset-2 whitespace-nowrap">
              View Profile
            </button>
            <button
              onClick={onResolve}
              disabled={resolving || removing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-semibold hover:bg-green-100 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <CheckCircle size={13} />
              {resolving ? 'Resolving…' : 'Resolve'}
            </button>
          </div>
        </div>
      </div>
    </CollapseCard>
  );
}

// ── Incident Card ─────────────────────────────────────────────────────────────

function IncidentCard({ incident, resolving, removing, onResolve, onViewProfile, onClick }: {
  incident: Incident; resolving: boolean; removing: boolean;
  onResolve: () => void; onViewProfile: () => void; onClick: () => void;
}) {
  return (
    <CollapseCard removing={removing}>
      <div
        className="card border border-orange-100 bg-white cursor-pointer hover:border-orange-200 hover:shadow-sm transition-all group"
        onClick={onClick}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <ClipboardX size={15} className="text-orange-500" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold bg-navy/8 text-navy px-2 py-0.5 rounded-lg">
                  Resident {incident.residentCode}
                </span>
                {severityBadge(incident.severity)}
              </div>
              <p className="text-xs font-semibold text-dark/50 mb-1">
                {incidentTypeLabel[incident.incidentType] ?? incident.incidentType}
                <span className="text-dark/35 font-normal ml-2">· {incident.incidentDate}</span>
              </p>
              {incident.description && (
                <p className="text-sm text-dark/65 leading-relaxed line-clamp-2">{incident.description}</p>
              )}
              {incident.followUpRequired && (
                <div className="mt-2 inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-lg px-2.5 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  <span className="text-xs font-semibold text-orange-600">Follow-up required</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <button
              onClick={e => { e.stopPropagation(); onViewProfile(); }}
              className="text-xs text-navy/60 hover:text-navy font-semibold underline underline-offset-2 whitespace-nowrap"
            >
              View Profile
            </button>
            <button
              onClick={e => { e.stopPropagation(); onResolve(); }}
              disabled={resolving || removing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-semibold hover:bg-green-100 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <CheckCircle size={13} />
              {resolving ? 'Resolving…' : 'Resolve'}
            </button>
            <ChevronRight size={14} className="text-dark/20 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all mt-1" />
          </div>
        </div>
      </div>
    </CollapseCard>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SafetyPage() {
  const navigate = useNavigate();
  const [flags, setFlags] = useState<Flag[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [criticalResidents, setCriticalResidents] = useState<CriticalResident[]>([]);
  const [loading, setLoading] = useState(true);

  const [removingFlags, setRemovingFlags] = useState<Set<number>>(new Set());
  const [removingIncidents, setRemovingIncidents] = useState<Set<number>>(new Set());
  const [resolvingFlags, setResolvingFlags] = useState<Set<number>>(new Set());
  const [resolvingIncidents, setResolvingIncidents] = useState<Set<number>>(new Set());

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // ── Filters ──────────────────────────────────────────────────────────────────
  const [criticalSearch, setCriticalSearch] = useState('');
  const [flagSearch, setFlagSearch] = useState('');
  const [incidentSearch, setIncidentSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [incidentTypeFilter, setIncidentTypeFilter] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch('/api/process-recordings').then(r => r.ok ? r.json() : []),
      apiFetch('/api/incident-reports?resolved=false').then(r => r.ok ? r.json() : []),
      apiFetch('/api/residents').then(r => r.ok ? r.json() : []),
    ]).then(([recordings, incidentData, residents]) => {
      setFlags((recordings as Flag[]).filter((r: Flag) => r.concernsFlagged));
      setIncidents(incidentData as Incident[]);
      setCriticalResidents((residents as CriticalResident[]).filter((r: CriticalResident) => r.risk === 'Critical'));
    }).finally(() => setLoading(false));
  }, []);

  function startRemoving<T>(
    id: number,
    setRemoving: React.Dispatch<React.SetStateAction<Set<number>>>,
    setResolving: React.Dispatch<React.SetStateAction<Set<number>>>,
    setItems: React.Dispatch<React.SetStateAction<T[]>>,
    idKey: keyof T,
  ) {
    setRemoving(s => new Set(s).add(id));
    setTimeout(() => {
      setItems(prev => prev.filter(item => (item[idKey] as unknown as number) !== id));
      setRemoving(s => { const n = new Set(s); n.delete(id); return n; });
      setResolving(s => { const n = new Set(s); n.delete(id); return n; });
    }, 380);
  }

  async function resolveFlag(flag: Flag) {
    setResolvingFlags(s => new Set(s).add(flag.recordingId));
    const res = await apiFetch(`/api/process-recordings/${flag.recordingId}/resolve`, { method: 'PATCH' });
    if (res.ok) {
      startRemoving(flag.recordingId, setRemovingFlags, setResolvingFlags, setFlags, 'recordingId');
    } else {
      setResolvingFlags(s => { const n = new Set(s); n.delete(flag.recordingId); return n; });
    }
  }

  async function resolveIncident(incident: Incident) {
    setResolvingIncidents(s => new Set(s).add(incident.incidentId));
    const res = await apiFetch(`/api/incident-reports/${incident.incidentId}/resolve`, { method: 'PATCH' });
    if (res.ok) {
      startRemoving(incident.incidentId, setRemovingIncidents, setResolvingIncidents, setIncidents, 'incidentId');
    } else {
      setResolvingIncidents(s => { const n = new Set(s); n.delete(incident.incidentId); return n; });
    }
  }

  const totalAlerts = flags.length + incidents.length;

  const filteredCritical = criticalResidents.filter(r =>
    !criticalSearch ||
    r.internalCode.toLowerCase().includes(criticalSearch.toLowerCase()) ||
    (r.worker ?? '').toLowerCase().includes(criticalSearch.toLowerCase()) ||
    (r.safehouse ?? '').toLowerCase().includes(criticalSearch.toLowerCase())
  );

  const filteredFlags = flags.filter(f =>
    !flagSearch ||
    f.residentCode.toLowerCase().includes(flagSearch.toLowerCase()) ||
    f.socialWorker.toLowerCase().includes(flagSearch.toLowerCase())
  );

  const filteredIncidents = incidents.filter(i => {
    const matchSearch = !incidentSearch ||
      i.residentCode.toLowerCase().includes(incidentSearch.toLowerCase()) ||
      i.incidentType.toLowerCase().includes(incidentSearch.toLowerCase()) ||
      (i.reportedBy ?? '').toLowerCase().includes(incidentSearch.toLowerCase());
    const matchSeverity = !severityFilter || i.severity === severityFilter;
    const matchType = !incidentTypeFilter || i.incidentType === incidentTypeFilter;
    return matchSearch && matchSeverity && matchType;
  });

  const incidentTypeOptions = [...new Set(incidents.map(i => i.incidentType).filter(Boolean))].sort();

  const criticalPag = useListPagination(filteredCritical, [criticalSearch]);
  const flagsPag = useListPagination(filteredFlags, [flagSearch]);
  const incidentsPag = useListPagination(filteredIncidents, [incidentSearch, severityFilter, incidentTypeFilter]);

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center">
            <ShieldAlert size={20} className="text-red-600" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-navy">Safety Monitor</h1>
            <p className="text-dark/50 text-sm mt-0.5">
              Admin-only ·{' '}
              <span className={totalAlerts > 0 ? 'text-red-500 font-semibold' : ''}>
                {totalAlerts} active alert{totalAlerts !== 1 ? 's' : ''}
              </span>
              {' '}· {criticalResidents.length} critical resident{criticalResidents.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-teal border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Critical Residents ─────────────────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert size={16} className="text-orange-500" />
                <h2 className="font-display text-lg font-bold text-navy">Critical Residents</h2>
                {criticalResidents.length > 0 && (
                  <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">{criticalResidents.length}</span>
                )}
              </div>
              {criticalResidents.length > 0 && (
                <div className="mb-3 relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/30" />
                  <input type="text" value={criticalSearch} onChange={e => setCriticalSearch(e.target.value)}
                    placeholder="Search by resident, worker, or safehouse..."
                    className="w-full sm:w-80 pl-8 pr-4 py-2 rounded-xl border border-dark/12 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/30" />
                </div>
              )}
              {filteredCritical.length === 0 ? (
                <div className="card flex flex-col items-center py-10 text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle size={22} className="text-green-600" />
                  </div>
                  <p className="font-semibold text-dark/60 text-sm">No residents at critical risk</p>
                  <p className="text-dark/35 text-xs">No residents are currently flagged as critical.</p>
                </div>
              ) : (
                <div className="card overflow-hidden p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-dark/8 bg-cream/70">
                          {['Resident', 'Safehouse', 'Age', 'Category', 'Risk', 'Social Worker', ''].map(h => (
                            <th key={h} className="text-left text-xs font-semibold text-dark/40 uppercase tracking-wide px-5 py-3.5">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {criticalPag.pageItems.map((r, i) => (
                          <tr key={r.residentId} onClick={() => navigate(`/admin/resident/${r.residentId}`)}
                            className={`border-b border-dark/5 last:border-0 cursor-pointer hover:bg-red-50/40 transition-colors group ${(criticalPag.startIndex + i) % 2 !== 0 ? 'bg-cream/30' : ''}`}>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                                  <User size={14} className="text-red-400" />
                                </div>
                                <span className="font-mono text-sm font-semibold text-navy">Resident {r.internalCode}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm text-dark/65">{formatSafehouseName(r.safehouse)}</td>
                            <td className="px-5 py-4 text-sm text-dark/65">{r.age}</td>
                            <td className="px-5 py-4 text-sm text-dark/65">{r.category || '—'}</td>
                            <td className="px-5 py-4">{riskBadge(r.risk)}</td>
                            <td className="px-5 py-4 text-sm text-dark/65">{r.worker || '—'}</td>
                            <td className="px-5 py-4">
                              <ChevronRight size={16} className="text-dark/20 group-hover:text-red-400 group-hover:translate-x-0.5 transition-all" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <ListPaginationBar
                    page={criticalPag.page}
                    pageCount={criticalPag.pageCount}
                    pageSize={criticalPag.pageSize}
                    setPage={criticalPag.setPage}
                    setPageSize={criticalPag.setPageSize}
                    total={criticalPag.total}
                    startIndex={criticalPag.startIndex}
                    endIndex={criticalPag.endIndex}
                  />
                </div>
              )}
            </section>

            {/* ── Two-column: Safety Flags | Incident Reports ────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Left: Safety Flags */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} className="text-red-500" />
                  <h2 className="font-display text-lg font-bold text-navy">Safety Flags</h2>
                  {flags.length > 0 && (
                    <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{flags.length}</span>
                  )}
                </div>
                {flags.length > 0 && (
                  <div className="mb-3 relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/30" />
                    <input type="text" value={flagSearch} onChange={e => setFlagSearch(e.target.value)}
                      placeholder="Search by resident or worker..."
                      className="w-full pl-8 pr-4 py-2 rounded-xl border border-dark/12 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/30" />
                  </div>
                )}
                {flags.length === 0 ? (
                  <div className="card flex flex-col items-center py-10 text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle size={22} className="text-green-600" />
                    </div>
                    <p className="font-semibold text-dark/60 text-sm">No active safety flags</p>
                    <p className="text-dark/35 text-xs">All concerns have been resolved.</p>
                  </div>
                ) : filteredFlags.length === 0 ? (
                  <div className="card py-8 text-center text-dark/40 text-sm">No flags match your search.</div>
                ) : (
                  <div>
                    {flagsPag.pageItems.map(flag => (
                      <FlagCard
                        key={flag.recordingId}
                        flag={flag}
                        resolving={resolvingFlags.has(flag.recordingId)}
                        removing={removingFlags.has(flag.recordingId)}
                        onResolve={() => resolveFlag(flag)}
                        onViewProfile={() => navigate(`/admin/resident/${flag.residentId}`)}
                      />
                    ))}
                    <ListPaginationBar
                      page={flagsPag.page}
                      pageCount={flagsPag.pageCount}
                      pageSize={flagsPag.pageSize}
                      setPage={flagsPag.setPage}
                      setPageSize={flagsPag.setPageSize}
                      total={flagsPag.total}
                      startIndex={flagsPag.startIndex}
                      endIndex={flagsPag.endIndex}
                      className="rounded-xl border border-dark/8 mt-2 !bg-cream/40"
                    />
                  </div>
                )}
              </section>

              {/* Right: Incident Reports */}
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <ClipboardX size={16} className="text-orange-500" />
                  <h2 className="font-display text-lg font-bold text-navy">Incident Reports</h2>
                  {incidents.length > 0 && (
                    <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">{incidents.length}</span>
                  )}
                </div>
                {incidents.length > 0 && (
                  <div className="mb-3 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/30" />
                        <input type="text" value={incidentSearch} onChange={e => setIncidentSearch(e.target.value)}
                          placeholder="Search incidents..."
                          className="w-full pl-8 pr-4 py-2 rounded-xl border border-dark/12 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/30" />
                      </div>
                      <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-dark/12 bg-white text-sm text-dark/60 focus:outline-none focus:ring-2 focus:ring-teal/30">
                        <option value="">Severity</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                      <select value={incidentTypeFilter} onChange={e => setIncidentTypeFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-dark/12 bg-white text-sm text-dark/60 focus:outline-none focus:ring-2 focus:ring-teal/30">
                        <option value="">Incident Type</option>
                        {incidentTypeOptions.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                )}
                {incidents.length === 0 ? (
                  <div className="card flex flex-col items-center py-10 text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle size={22} className="text-green-600" />
                    </div>
                    <p className="font-semibold text-dark/60 text-sm">No open incident reports</p>
                    <p className="text-dark/35 text-xs">All incidents have been resolved.</p>
                  </div>
                ) : filteredIncidents.length === 0 ? (
                  <div className="card py-8 text-center text-dark/40 text-sm">No incidents match your filters.</div>
                ) : (
                  <div>
                    {incidentsPag.pageItems.map(incident => (
                      <IncidentCard
                        key={incident.incidentId}
                        incident={incident}
                        resolving={resolvingIncidents.has(incident.incidentId)}
                        removing={removingIncidents.has(incident.incidentId)}
                        onResolve={() => resolveIncident(incident)}
                        onViewProfile={() => navigate(`/admin/resident/${incident.residentId}`)}
                        onClick={() => setSelectedIncident(incident)}
                      />
                    ))}
                    <ListPaginationBar
                      page={incidentsPag.page}
                      pageCount={incidentsPag.pageCount}
                      pageSize={incidentsPag.pageSize}
                      setPage={incidentsPag.setPage}
                      setPageSize={incidentsPag.setPageSize}
                      total={incidentsPag.total}
                      startIndex={incidentsPag.startIndex}
                      endIndex={incidentsPag.endIndex}
                      className="rounded-xl border border-dark/8 mt-2 !bg-cream/40"
                    />
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onResolve={() => resolveIncident(selectedIncident)}
          onViewProfile={() => { setSelectedIncident(null); navigate(`/admin/resident/${selectedIncident.residentId}`); }}
          resolving={resolvingIncidents.has(selectedIncident.incidentId)}
        />
      )}
    </AdminLayout>
  );
}
