import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, AlertTriangle, CheckCircle, FileText, ChevronRight, User } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { apiFetch } from '../api';

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

// ── Risk badge ────────────────────────────────────────────────────────────────

const riskBadge = (risk: string) => {
  const map: Record<string, string> = {
    Low: 'bg-green-100 text-green-700 border border-green-200',
    Medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    High: 'bg-orange-100 text-orange-700 border border-orange-200',
    Critical: 'bg-red-100 text-red-700 border border-red-200',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[risk] || 'bg-gray-100 text-gray-600'}`}>
      {risk} Risk
    </span>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SafetyPage() {
  const navigate = useNavigate();
  const [flags, setFlags] = useState<Flag[]>([]);
  const [criticalResidents, setCriticalResidents] = useState<CriticalResident[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/process-recordings').then(r => r.ok ? r.json() : []),
      apiFetch('/api/residents').then(r => r.ok ? r.json() : []),
    ]).then(([recordings, residents]) => {
      setFlags((recordings as Flag[]).filter((r: Flag) => r.concernsFlagged));
      setCriticalResidents((residents as CriticalResident[]).filter((r: CriticalResident) => r.risk === 'Critical'));
    }).finally(() => setLoading(false));
  }, []);

  async function handleResolve(flag: Flag) {
    setResolving(flag.recordingId);
    const res = await apiFetch(`/api/process-recordings/${flag.recordingId}/resolve`, { method: 'PATCH' });
    if (res.ok) {
      setFlags(prev => prev.filter(f => f.recordingId !== flag.recordingId));
    }
    setResolving(null);
  }

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center">
            <ShieldAlert size={20} className="text-red-600" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-navy">Safety Overview</h1>
            <p className="text-dark/50 text-sm mt-0.5">Admin-only · {flags.length} active flag{flags.length !== 1 ? 's' : ''} · {criticalResidents.length} critical resident{criticalResidents.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-4 border-teal border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            {/* ── Safety Flags ───────────────────────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-red-500" />
                <h2 className="font-display text-lg font-bold text-navy">Safety Flags</h2>
                {flags.length > 0 && (
                  <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{flags.length}</span>
                )}
              </div>

              {flags.length === 0 ? (
                <div className="card flex flex-col items-center py-12 text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle size={22} className="text-green-600" />
                  </div>
                  <p className="font-semibold text-dark/60 text-sm">No active safety flags</p>
                  <p className="text-dark/35 text-xs">All concerns have been resolved.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {flags.map(flag => (
                    <div key={flag.recordingId} className="card border border-red-100 bg-white">
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
                          <button
                            onClick={() => navigate(`/admin/resident/${flag.residentId}`)}
                            className="text-xs text-navy/60 hover:text-navy font-semibold underline underline-offset-2 whitespace-nowrap"
                          >
                            View Profile
                          </button>
                          <button
                            onClick={() => handleResolve(flag)}
                            disabled={resolving === flag.recordingId}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-semibold hover:bg-green-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            <CheckCircle size={13} />
                            {resolving === flag.recordingId ? 'Resolving…' : 'Resolve'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ── Critical Residents ─────────────────────────────────────── */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert size={16} className="text-orange-500" />
                <h2 className="font-display text-lg font-bold text-navy">Critical Residents</h2>
                {criticalResidents.length > 0 && (
                  <span className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-0.5 rounded-full">{criticalResidents.length}</span>
                )}
              </div>

              {criticalResidents.length === 0 ? (
                <div className="card flex flex-col items-center py-12 text-center gap-3">
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
                        {criticalResidents.map((r, i) => (
                          <tr
                            key={r.residentId}
                            onClick={() => navigate(`/admin/resident/${r.residentId}`)}
                            className={`border-b border-dark/5 last:border-0 cursor-pointer hover:bg-red-50/40 transition-colors group ${i % 2 !== 0 ? 'bg-cream/30' : ''}`}
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                                  <User size={14} className="text-red-400" />
                                </div>
                                <span className="font-mono text-sm font-semibold text-navy">Resident {r.internalCode}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-sm text-dark/65">{r.safehouse}</td>
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
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
