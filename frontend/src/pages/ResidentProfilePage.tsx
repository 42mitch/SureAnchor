import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, User, FileText, Home, Shield, Calendar,
  AlertTriangle, CheckCircle, Clock, ChevronRight, Activity,
  BookOpen, Heart, MapPin, Hash, Pencil, Trash2, GraduationCap
} from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { useListPagination } from '../hooks/useListPagination';
import ListPaginationBar from '../components/ListPaginationBar';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  EditResidentModal,
  ResidentSessionEditModal,
  ResidentVisitEditModal,
  type SafehouseOption,
  type ResidentDetailForm,
  type SessionNoteRow,
  type HomeVisitationDetail,
} from '../components/resident/ResidentProfileAdminModals';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ResidentDetail {
  residentId: number;
  safehouseId: number;
  caseNo: string;
  internalCode: string;
  safehouse: string;
  age: number;
  category: string;
  risk: string;
  initialRisk: string;
  status: string;
  worker: string;
  religion: string | null;
  dateAdmitted: string | null;
  dateOfBirth: string | null;
  reintegrationType: string | null;
  reintegrationStatus: string | null;
  recentNote: string | null;
}

interface ProcessRecording {
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

interface HomeVisitation {
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

interface EducationRecord {
  educationRecordId: number;
  residentId: number;
  recordDate: string;
  educationLevel: string;
  schoolName: string;
  enrollmentStatus: string;
  attendanceRate: number | null;
  progressPercent: number | null;
  completionStatus: string;
  notes: string;
}

function parseRecordDate(d: string): Date | null {
  if (!d) return null;
  const parsed = new Date(d);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Group key: calendar month from record date (schoolName is legacy month label only). */
function yearMonthKey(recordDate: string): string {
  const dt = parseRecordDate(recordDate);
  if (!dt) return '0000-00';
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthYearLabel(recordDate: string): string {
  const dt = parseRecordDate(recordDate);
  if (!dt) return '—';
  return dt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

interface EducationMonthRow {
  /** Full label for tooltips / summary */
  monthLabel: string;
  /** Compact x-axis label */
  shortMonth: string;
  sortKey: string;
  attendance: number | null;
  progress: number | null;
  recordCount: number;
}

function buildEducationMonthSeries(records: EducationRecord[]): EducationMonthRow[] {
  const byKey = new Map<string, EducationRecord[]>();
  for (const r of records) {
    const key = yearMonthKey(r.recordDate);
    const list = byKey.get(key) ?? [];
    list.push(r);
    byKey.set(key, list);
  }
  const keys = [...byKey.keys()].filter(k => k !== '0000-00').sort();
  return keys.map((key) => {
    const group = byKey.get(key)!;
    group.sort(
      (a, b) =>
        (parseRecordDate(a.recordDate)?.getTime() ?? 0) -
        (parseRecordDate(b.recordDate)?.getTime() ?? 0)
    );
    const anchor = group[0];
    const dt = parseRecordDate(anchor.recordDate);
    const monthLabel = formatMonthYearLabel(anchor.recordDate);
    const shortMonth =
      dt?.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) ?? '—';
    const attVals = group.map((g) => g.attendanceRate).filter((x): x is number => x != null);
    const progVals = group.map((g) => g.progressPercent).filter((x): x is number => x != null);
    const round1 = (n: number) => Math.round(n * 10) / 10;
    return {
      monthLabel,
      shortMonth,
      sortKey: key,
      attendance: attVals.length ? round1(attVals.reduce((a, b) => a + b, 0) / attVals.length) : null,
      progress: progVals.length ? round1(progVals.reduce((a, b) => a + b, 0) / progVals.length) : null,
      recordCount: group.length,
    };
  });
}

// ─── Badge helpers ────────────────────────────────────────────────────────────

const riskBadge = (risk: string) => {
  const map: Record<string, string> = {
    Low: 'bg-green-100 text-green-700 border border-green-200',
    Medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    High: 'bg-orange-100 text-orange-700 border border-orange-200',
    Critical: 'bg-red-100 text-red-700 border border-red-200',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[risk] || 'bg-gray-100 text-gray-600'}`}>{risk} Risk</span>;
};

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    Active: 'bg-blue-100 text-blue-700 border border-blue-200',
    Reintegrating: 'bg-teal/10 text-teal-dark border border-teal/25',
    Aftercare: 'bg-purple-100 text-purple-700 border border-purple-200',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-600'}`}>{status}</span>;
};

const emotionBadge = (state: string) => {
  const map: Record<string, string> = {
    Hopeful: 'bg-green-100 text-green-700',
    Calm: 'bg-blue-100 text-blue-700',
    Anxious: 'bg-yellow-100 text-yellow-700',
    Distressed: 'bg-red-100 text-red-700',
    Reflective: 'bg-purple-100 text-purple-700',
    Withdrawn: 'bg-gray-100 text-gray-600',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[state] || 'bg-gray-100 text-gray-600'}`}>{state || '—'}</span>;
};

const cooperationBadge = (level: string) => {
  const map: Record<string, string> = {
    'Highly Cooperative': 'bg-green-100 text-green-700',
    'Cooperative': 'bg-teal/10 text-teal-dark',
    'Neutral': 'bg-yellow-100 text-yellow-700',
    'Uncooperative': 'bg-red-100 text-red-700',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[level] || 'bg-gray-100 text-gray-600'}`}>{level || '—'}</span>;
};

const outcomeBadge = (outcome: string) => {
  const map: Record<string, { cls: string; icon: any }> = {
    'Favorable': { cls: 'bg-green-100 text-green-700', icon: CheckCircle },
    'Needs Improvement': { cls: 'bg-yellow-100 text-yellow-700', icon: Clock },
    'Unfavorable': { cls: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
    'Inconclusive': { cls: 'bg-gray-100 text-gray-600', icon: Clock },
  };
  const item = map[outcome] || { cls: 'bg-gray-100 text-gray-600', icon: Clock };
  const Icon = item.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${item.cls}`}>
      <Icon size={11} />
      {outcome || '—'}
    </span>
  );
};

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'sessions', label: 'Counseling Sessions', icon: FileText },
  { id: 'visitations', label: 'Home Visitations', icon: Home },
  { id: 'education', label: 'Education', icon: GraduationCap },
];

function toSessionNoteRow(n: ProcessRecording): SessionNoteRow {
  return {
    recordingId: n.recordingId,
    residentId: n.residentId,
    residentCode: n.residentCode,
    sessionDate: n.sessionDate,
    socialWorker: n.socialWorker,
    sessionType: n.sessionType,
    emotionalState: n.emotionalState,
    narrative: n.narrative,
    interventions: n.interventions,
    followUp: n.followUp,
    progressNoted: n.progressNoted,
    concernsFlagged: n.concernsFlagged,
  };
}

export default function ResidentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const isAdmin = user?.roles.includes('Admin') ?? false;

  const [activeTab, setActiveTab] = useState('overview');

  const [resident, setResident] = useState<ResidentDetail | null>(null);
  const [sessions, setSessions] = useState<ProcessRecording[]>([]);
  const [visitations, setVisitations] = useState<HomeVisitation[]>([]);
  const [educationRecords, setEducationRecords] = useState<EducationRecord[]>([]);
  const [safehouses, setSafehouses] = useState<SafehouseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [showEditResident, setShowEditResident] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<SessionNoteRow | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<ProcessRecording | null>(null);
  const [sessionDeleteLoading, setSessionDeleteLoading] = useState(false);
  const [visitToEdit, setVisitToEdit] = useState<HomeVisitationDetail | null>(null);
  const [visitEditLoading, setVisitEditLoading] = useState(false);
  const [visitToDelete, setVisitToDelete] = useState<HomeVisitation | null>(null);
  const [visitDeleteLoading, setVisitDeleteLoading] = useState(false);

  const sessPag = useListPagination(sessions, [id, sessions.length]);
  const visitPag = useListPagination(visitations, [id, visitations.length]);

  const educationMonthSeries = useMemo(
    () => buildEducationMonthSeries(educationRecords),
    [educationRecords]
  );

  const educationSummary = useMemo(() => {
    if (educationRecords.length === 0) return null;
    const allAtt = educationRecords
      .map((r) => r.attendanceRate)
      .filter((x): x is number => x != null);
    const allProg = educationRecords
      .map((r) => r.progressPercent)
      .filter((x): x is number => x != null);
    const round1 = (n: number) => Math.round(n * 10) / 10;
    const latest = [...educationRecords].sort(
      (a, b) =>
        (parseRecordDate(b.recordDate)?.getTime() ?? 0) -
        (parseRecordDate(a.recordDate)?.getTime() ?? 0)
    )[0];
    const spanLabel =
      educationMonthSeries.length >= 1
        ? `${educationMonthSeries[0].monthLabel} → ${educationMonthSeries[educationMonthSeries.length - 1].monthLabel}`
        : '—';
    return {
      monthCount: educationMonthSeries.length,
      recordCount: educationRecords.length,
      avgAttendance: allAtt.length ? round1(allAtt.reduce((a, b) => a + b, 0) / allAtt.length) : null,
      avgProgress: allProg.length ? round1(allProg.reduce((a, b) => a + b, 0) / allProg.length) : null,
      latestLevel: latest?.educationLevel?.trim() || '—',
      latestEnrollment: latest?.enrollmentStatus?.trim() || '—',
      latestCompletion: latest?.completionStatus?.trim() || '—',
      spanLabel,
    };
  }, [educationRecords, educationMonthSeries]);

  function reloadResident() {
    if (!id) return;
    apiFetch(`/api/residents/${id}`).then(r => r.ok ? r.json() : null).then(res => {
      if (res) setResident(res);
    });
  }

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      apiFetch(`/api/residents/${id}`).then(r => r.ok ? r.json() : null),
      apiFetch(`/api/process-recordings?residentId=${id}`).then(r => r.ok ? r.json() : []),
      apiFetch(`/api/home-visitations?residentId=${id}`).then(r => r.ok ? r.json() : []),
      apiFetch(`/api/education-records?residentId=${id}`).then(r => r.ok ? r.json() : []),
    ]).then(([res, recs, visits, edu]) => {
      if (!res) { setNotFound(true); return; }
      setResident(res);
      setSessions(recs);
      setVisitations(visits);
      setEducationRecords(edu);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!isAdmin) return;
    apiFetch('/api/residents/safehouses').then(r => r.ok ? r.json() : []).then(setSafehouses);
  }, [isAdmin]);

  async function openVisitEdit(v: HomeVisitation) {
    setVisitEditLoading(true);
    const r = await apiFetch(`/api/home-visitations/${v.visitationId}`);
    if (r.ok) {
      const d: HomeVisitationDetail = await r.json();
      setVisitToEdit(d);
    }
    setVisitEditLoading(false);
  }

  async function handleDeleteSession() {
    if (!sessionToDelete) return;
    setSessionDeleteLoading(true);
    await apiFetch(`/api/process-recordings/${sessionToDelete.recordingId}`, { method: 'DELETE' });
    setSessions(prev => prev.filter(s => s.recordingId !== sessionToDelete.recordingId));
    setSessionToDelete(null);
    setSessionDeleteLoading(false);
    reloadResident();
  }

  async function handleDeleteVisit() {
    if (!visitToDelete) return;
    setVisitDeleteLoading(true);
    await apiFetch(`/api/home-visitations/${visitToDelete.visitationId}`, { method: 'DELETE' });
    setVisitations(prev => prev.filter(v => v.visitationId !== visitToDelete.visitationId));
    setVisitToDelete(null);
    setVisitDeleteLoading(false);
  }

  const residentFormProps: ResidentDetailForm | null = resident
    ? {
        residentId: resident.residentId,
        caseNo: resident.caseNo,
        internalCode: resident.internalCode,
        safehouseId: resident.safehouseId,
        category: resident.category,
        risk: resident.risk,
        status: resident.status,
        worker: resident.worker,
        religion: resident.religion,
        dateAdmitted: resident.dateAdmitted,
        dateOfBirth: resident.dateOfBirth,
        reintegrationType: resident.reintegrationType,
        reintegrationStatus: resident.reintegrationStatus,
      }
    : null;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 rounded-full border-4 border-teal border-t-transparent animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (notFound || !resident) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Shield size={48} className="text-dark/20 mb-4" />
          <h2 className="font-display text-2xl font-bold text-navy mb-2">Resident Not Found</h2>
          <p className="text-dark/50 mb-6">Resident #{id} does not exist in the system.</p>
          <Link to="/admin/caseload" className="btn-primary text-sm flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to Caseload
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Back link */}
        <Link
          to="/admin/caseload"
          className="inline-flex items-center gap-2 text-sm text-dark/50 hover:text-navy font-medium transition-colors group"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Caseload
        </Link>

        {/* Profile hero header */}
        <div className="bg-gradient-to-br from-navy via-navy-light to-teal-dark rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 right-20 w-32 h-32 rounded-full bg-teal/10" />

          <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0 border border-white/20">
              <User size={34} className="text-white/80" strokeWidth={1.5} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="font-mono text-white/50 text-sm">{resident.caseNo}</span>
                <span className="text-white/30">·</span>
                {riskBadge(resident.risk)}
                {statusBadge(resident.status)}
              </div>
              <h1 className="font-display text-2xl lg:text-3xl font-bold text-white mb-1">
                Resident {resident.internalCode}
              </h1>
              <div className="flex flex-wrap gap-4 text-white/60 text-sm mt-2">
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} />
                  {resident.safehouse}
                </span>
                {resident.dateAdmitted && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    Admitted {resident.dateAdmitted}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Hash size={13} />
                  {resident.category}
                </span>
              </div>
            </div>

            <div className="flex sm:flex-col gap-4 sm:gap-3 sm:items-end text-right flex-shrink-0">
              <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
                <div className="font-display text-2xl font-bold text-gold">{sessions.length}</div>
                <div className="text-xs text-white/60">Sessions</div>
              </div>
              <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
                <div className="font-display text-2xl font-bold text-teal-light">{visitations.length}</div>
                <div className="text-xs text-white/60">Home Visits</div>
              </div>
              <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
                <div className="font-display text-2xl font-bold text-white/90">{educationRecords.length}</div>
                <div className="text-xs text-white/60">Education</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-2xl shadow-card p-1.5">
          {TABS.map(({ id: tabId, label, icon: Icon }) => (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                activeTab === tabId
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-dark/50 hover:text-navy hover:bg-navy/5'
              }`}
            >
              <Icon size={15} strokeWidth={activeTab === tabId ? 2.2 : 1.8} />
              <span className="hidden sm:block">{label}</span>
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 card">
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-navy/8 flex items-center justify-center">
                    <User size={16} className="text-navy" />
                  </div>
                  <h2 className="font-display text-lg font-semibold text-navy">Demographics</h2>
                </div>
                {isAdmin && residentFormProps && (
                  <button
                    type="button"
                    onClick={() => setShowEditResident(true)}
                    disabled={safehouses.length === 0}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:text-teal-dark disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Pencil size={15} />
                    Edit
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">
                {[
                  { label: 'Age', value: `${resident.age} years old` },
                  { label: 'Date of Birth', value: resident.dateOfBirth?.slice(0, 10) ?? '—' },
                  { label: 'Religion', value: resident.religion ?? '—' },
                  { label: 'Case Category', value: resident.category },
                  { label: 'Date Admitted', value: resident.dateAdmitted ?? '—' },
                  { label: 'Safe House', value: resident.safehouse },
                  { label: 'Current Status', value: resident.status },
                  { label: 'Risk Level', value: resident.risk },
                  ...(resident.reintegrationType ? [{ label: 'Reintegration Type', value: resident.reintegrationType }] : []),
                  ...(resident.reintegrationStatus ? [{ label: 'Reintegration Status', value: resident.reintegrationStatus }] : []),
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-dark/40 font-semibold uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-sm font-semibold text-dark">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center">
                    <Heart size={16} className="text-teal" />
                  </div>
                  <h2 className="font-display text-lg font-semibold text-navy">Social Worker</h2>
                </div>
                <div className="flex items-center gap-3 bg-teal/6 rounded-xl px-4 py-3.5">
                  <div className="w-10 h-10 rounded-full bg-teal flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {resident.worker.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-navy">{resident.worker}</p>
                    <p className="text-xs text-dark/40">Licensed Social Worker</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center">
                    <Activity size={16} className="text-gold" />
                  </div>
                  <h2 className="font-display text-lg font-semibold text-navy">Case Activity</h2>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-dark/50 font-medium">Counseling Sessions</span>
                    <span className="font-bold text-navy text-sm">{sessions.length}</span>
                  </div>
                  <div className="h-px bg-dark/6" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-dark/50 font-medium">Home Visitations</span>
                    <span className="font-bold text-navy text-sm">{visitations.length}</span>
                  </div>
                  <div className="h-px bg-dark/6" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-dark/50 font-medium">Education Records</span>
                    <span className="font-bold text-navy text-sm">{educationRecords.length}</span>
                  </div>
                  <div className="h-px bg-dark/6" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-dark/50 font-medium">Safety Concerns</span>
                    <span className={`font-bold text-sm ${visitations.some(v => v.safetyConcern) ? 'text-red-600' : 'text-green-600'}`}>
                      {visitations.some(v => v.safetyConcern) ? 'Yes' : 'None'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {resident.recentNote && (
              <div className="lg:col-span-3 card border-l-4 border-teal">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen size={16} className="text-teal" />
                  <h2 className="font-semibold text-sm text-navy uppercase tracking-wide">Most Recent Case Note</h2>
                </div>
                <p className="text-sm text-dark/70 leading-relaxed">{resident.recentNote}</p>
                {sessions.length > 0 && (
                  <button
                    onClick={() => setActiveTab('sessions')}
                    className="mt-4 text-sm text-teal font-semibold flex items-center gap-1 hover:text-teal-dark transition-colors"
                  >
                    View all {sessions.length} session notes
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── SESSIONS TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <div className="card text-center py-16">
                <FileText size={40} className="text-dark/20 mx-auto mb-3" />
                <p className="font-display text-lg font-semibold text-navy mb-1">No Session Notes Yet</p>
                <p className="text-dark/45 text-sm">Session notes for this resident will appear here.</p>
              </div>
            ) : (
              <>
              {sessPag.pageItems.map((note, i) => (
                <div key={note.recordingId} className="card hover:shadow-card-hover transition-all duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-navy/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-navy font-bold text-xs">#{sessPag.startIndex + i + 1}</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${note.sessionType === 'Individual' ? 'bg-navy/8 text-navy' : 'bg-teal/10 text-teal-dark'}`}>
                            {note.sessionType} Session
                          </span>
                          {emotionBadge(note.emotionalState)}
                          {note.concernsFlagged && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                              <AlertTriangle size={10} /> Concern Flagged
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-dark/40 font-medium">{note.sessionDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-shrink-0">
                      <div className="w-7 h-7 rounded-full bg-teal flex items-center justify-center text-white text-xs font-bold">
                        {note.socialWorker.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-xs font-semibold text-dark/60">{note.socialWorker}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-semibold text-dark/40 uppercase tracking-wide mb-2">Session Narrative</p>
                    <p className="text-sm text-dark/75 leading-relaxed bg-cream rounded-xl px-4 py-3">
                      {note.narrative || '—'}
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 border-t border-dark/6 pt-4">
                    <div>
                      <p className="text-xs font-semibold text-dark/40 uppercase tracking-wide mb-1.5">Interventions Applied</p>
                      <p className="text-sm text-dark/65 leading-snug">{note.interventions || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-dark/40 uppercase tracking-wide mb-1.5">Follow-up Actions</p>
                      <p className="text-sm text-teal font-medium leading-snug">{note.followUp || '—'}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex justify-end gap-2 pt-4 border-t border-dark/6 mt-4">
                      <button
                        type="button"
                        onClick={() => setSessionToEdit(toSessionNoteRow(note))}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-navy/8 text-navy hover:bg-navy/12"
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setSessionToDelete(note)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <ListPaginationBar
                page={sessPag.page}
                pageCount={sessPag.pageCount}
                pageSize={sessPag.pageSize}
                setPage={sessPag.setPage}
                setPageSize={sessPag.setPageSize}
                total={sessPag.total}
                startIndex={sessPag.startIndex}
                endIndex={sessPag.endIndex}
              />
              </>
            )}
          </div>
        )}

        {/* ── VISITATIONS TAB ───────────────────────────────────────────────── */}
        {activeTab === 'visitations' && (
          <div className="space-y-4">
            {visitations.length === 0 ? (
              <div className="card text-center py-16">
                <Home size={40} className="text-dark/20 mx-auto mb-3" />
                <p className="font-display text-lg font-semibold text-navy mb-1">No Home Visits Recorded</p>
                <p className="text-dark/45 text-sm">Home visitation records for this resident will appear here.</p>
              </div>
            ) : (
              <>
              {visitPag.pageItems.map((visit) => (
                <div
                  key={visit.visitationId}
                  className={`card hover:shadow-card-hover transition-all duration-200 border-l-4 ${visit.safetyConcern ? 'border-red-400' : 'border-teal'}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${visit.safetyConcern ? 'bg-red-100' : 'bg-teal/10'}`}>
                        {visit.safetyConcern
                          ? <AlertTriangle size={18} className="text-red-500" />
                          : <Home size={18} className="text-teal" />
                        }
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-navy/60 bg-navy/6 px-2 py-0.5 rounded-md">#{visit.visitationId}</span>
                          <span className="text-xs font-semibold text-dark/50 bg-dark/6 px-2 py-0.5 rounded-md">{visit.visitType}</span>
                        </div>
                        <p className="text-xs text-dark/40">{visit.visitDate}</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end gap-2">
                      {outcomeBadge(visit.outcome)}
                      {visit.safetyConcern && (
                        <span className="inline-flex items-center gap-1.5 text-red-600 text-xs font-semibold">
                          <AlertTriangle size={12} />
                          Safety Concern Flagged
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-dark/6 grid sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-dark/35 font-semibold uppercase tracking-wide mb-1">Social Worker</p>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-teal flex items-center justify-center text-white text-xs font-bold">
                          {visit.socialWorker.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm font-semibold text-dark">{visit.socialWorker}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-dark/35 font-semibold uppercase tracking-wide mb-1">Family Cooperation</p>
                      {cooperationBadge(visit.familyCooperation)}
                    </div>
                    <div>
                      <p className="text-xs text-dark/35 font-semibold uppercase tracking-wide mb-1">Visit Outcome</p>
                      {outcomeBadge(visit.outcome)}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex justify-end gap-2 pt-4 border-t border-dark/6">
                      <button
                        type="button"
                        onClick={() => openVisitEdit(visit)}
                        disabled={visitEditLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-navy/8 text-navy hover:bg-navy/12 disabled:opacity-50"
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisitToDelete(visit)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
              <ListPaginationBar
                page={visitPag.page}
                pageCount={visitPag.pageCount}
                pageSize={visitPag.pageSize}
                setPage={visitPag.setPage}
                setPageSize={visitPag.setPageSize}
                total={visitPag.total}
                startIndex={visitPag.startIndex}
                endIndex={visitPag.endIndex}
              />
              </>
            )}
          </div>
        )}

        {/* ── EDUCATION TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'education' && (
          <div className="space-y-6">
            {educationRecords.length === 0 ? (
              <div className="card text-center py-16">
                <GraduationCap size={40} className="text-dark/20 mx-auto mb-3" />
                <p className="font-display text-lg font-semibold text-navy mb-1">No Education Records</p>
                <p className="text-dark/45 text-sm">Education records for this resident will appear here.</p>
              </div>
            ) : educationSummary && (
              <>
                <p className="text-dark/45 text-sm -mt-2">
                  Progress is shown by calendar month (from record dates). Multiple entries in the same month are averaged.
                </p>

                {/* Summary — general information */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      label: 'Months with data',
                      value: String(educationSummary.monthCount),
                      sub: `${educationSummary.recordCount} total entr${educationSummary.recordCount === 1 ? 'y' : 'ies'}`,
                      accent: 'from-navy to-navy-light',
                    },
                    {
                      label: 'Avg. attendance',
                      value:
                        educationSummary.avgAttendance != null
                          ? `${educationSummary.avgAttendance}%`
                          : '—',
                      sub: 'Across all records',
                      accent: 'from-teal to-teal-dark',
                    },
                    {
                      label: 'Avg. progress',
                      value:
                        educationSummary.avgProgress != null
                          ? `${educationSummary.avgProgress}%`
                          : '—',
                      sub: 'Curriculum / goals',
                      accent: 'from-yellow-600 to-gold',
                    },
                    {
                      label: 'Reporting span',
                      value:
                        educationSummary.monthCount > 0
                          ? `${educationSummary.monthCount} mo.`
                          : '—',
                      sub: educationSummary.spanLabel,
                      accent: 'from-slate-600 to-slate-700',
                    },
                  ].map(({ label, value, sub, accent }) => (
                    <div
                      key={label}
                      className={`rounded-2xl bg-gradient-to-br ${accent} text-white p-5 shadow-card`}
                    >
                      <p className="text-white/75 text-xs font-semibold uppercase tracking-wide mb-2">{label}</p>
                      <p className="font-display text-2xl font-bold mb-1">{value}</p>
                      <p className="text-white/65 text-xs leading-snug">{sub}</p>
                    </div>
                  ))}
                </div>

                <div className="card">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-navy/8 flex items-center justify-center">
                      <GraduationCap size={18} className="text-navy" />
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-semibold text-navy">Latest snapshot</h2>
                      <p className="text-dark/45 text-sm">From the most recent education record</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-6 text-sm">
                    <div>
                      <p className="text-xs font-semibold text-dark/40 uppercase tracking-wide mb-1">Education level</p>
                      <p className="font-semibold text-dark">{educationSummary.latestLevel}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-dark/40 uppercase tracking-wide mb-1">Enrollment</p>
                      <p className="font-semibold text-dark">{educationSummary.latestEnrollment}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-dark/40 uppercase tracking-wide mb-1">Completion status</p>
                      <p className="font-semibold text-dark">{educationSummary.latestCompletion}</p>
                    </div>
                  </div>
                </div>

                {/* Charts — by month */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <div className="card">
                    <h2 className="font-display text-lg font-semibold text-navy mb-1">Attendance by month</h2>
                    <p className="text-dark/45 text-sm mb-4">Average % where reported</p>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={educationMonthSeries} barSize={28}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis
                          dataKey="shortMonth"
                          tick={{ fontSize: 11, fill: '#9CA3AF' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#9CA3AF' }}
                          axisLine={false}
                          tickLine={false}
                          domain={[0, 100]}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                          formatter={(value: unknown) => {
                            const n = typeof value === 'number' ? value : Number(value);
                            return !Number.isNaN(n) && value != null && value !== ''
                              ? [`${n}%`, 'Attendance']
                              : ['—', 'Attendance'];
                          }}
                          labelFormatter={(_, payload) =>
                            (payload?.[0]?.payload as EducationMonthRow | undefined)?.monthLabel ?? ''
                          }
                          contentStyle={{
                            borderRadius: 12,
                            border: '1px solid rgba(0,0,0,0.06)',
                            fontSize: 13,
                          }}
                        />
                        <Bar dataKey="attendance" name="Attendance" fill="#2D8F8A" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="card">
                    <h2 className="font-display text-lg font-semibold text-navy mb-1">Progress by month</h2>
                    <p className="text-dark/45 text-sm mb-4">Average % toward goals</p>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={educationMonthSeries} barSize={28}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis
                          dataKey="shortMonth"
                          tick={{ fontSize: 11, fill: '#9CA3AF' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#9CA3AF' }}
                          axisLine={false}
                          tickLine={false}
                          domain={[0, 100]}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                          formatter={(value: unknown) => {
                            const n = typeof value === 'number' ? value : Number(value);
                            return !Number.isNaN(n) && value != null && value !== ''
                              ? [`${n}%`, 'Progress']
                              : ['—', 'Progress'];
                          }}
                          labelFormatter={(_, payload) =>
                            (payload?.[0]?.payload as EducationMonthRow | undefined)?.monthLabel ?? ''
                          }
                          contentStyle={{
                            borderRadius: 12,
                            border: '1px solid rgba(0,0,0,0.06)',
                            fontSize: 13,
                          }}
                        />
                        <Bar dataKey="progress" name="Progress" fill="#1B3A5C" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card">
                  <h2 className="font-display text-lg font-semibold text-navy mb-1">Trend over time</h2>
                  <p className="text-dark/45 text-sm mb-4">Attendance and progress together</p>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={educationMonthSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                      <XAxis
                        dataKey="shortMonth"
                        tick={{ fontSize: 11, fill: '#9CA3AF' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#9CA3AF' }}
                        axisLine={false}
                        tickLine={false}
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip
                        formatter={(value: unknown, name: unknown) => {
                          const n = typeof value === 'number' ? value : Number(value);
                          const label = String(name ?? '');
                          return !Number.isNaN(n) && value != null && value !== ''
                            ? [`${n}%`, label]
                            : ['—', label];
                        }}
                        labelFormatter={(_, payload) =>
                          (payload?.[0]?.payload as EducationMonthRow | undefined)?.monthLabel ?? ''
                        }
                        contentStyle={{
                          borderRadius: 12,
                          border: '1px solid rgba(0,0,0,0.06)',
                          fontSize: 13,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="attendance"
                        name="Attendance"
                        stroke="#2D8F8A"
                        strokeWidth={2.5}
                        dot={{ fill: '#2D8F8A', r: 4 }}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="progress"
                        name="Progress"
                        stroke="#1B3A5C"
                        strokeWidth={2.5}
                        dot={{ fill: '#1B3A5C', r: 4 }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {showEditResident && residentFormProps && safehouses.length > 0 && (
        <EditResidentModal
          resident={residentFormProps}
          safehouses={safehouses}
          onClose={() => setShowEditResident(false)}
          onSaved={() => {
            reloadResident();
          }}
        />
      )}
      {sessionToEdit && id && resident && (
        <ResidentSessionEditModal
          note={sessionToEdit}
          residentId={parseInt(id, 10)}
          residentCode={sessionToEdit.residentCode}
          onClose={() => setSessionToEdit(null)}
          onSaved={updated => {
            setSessions(prev =>
              prev.map(s =>
                s.recordingId === updated.recordingId
                  ? {
                      ...s,
                      sessionDate: updated.sessionDate,
                      socialWorker: updated.socialWorker,
                      sessionType: updated.sessionType,
                      emotionalState: updated.emotionalState,
                      narrative: updated.narrative,
                      interventions: updated.interventions,
                      followUp: updated.followUp,
                      progressNoted: updated.progressNoted,
                      concernsFlagged: updated.concernsFlagged,
                    }
                  : s
              )
            );
            reloadResident();
          }}
        />
      )}
      {visitToEdit && (
        <ResidentVisitEditModal
          initial={visitToEdit}
          onClose={() => setVisitToEdit(null)}
          onSaved={updated => {
            setVisitations(prev =>
              prev.map(v =>
                v.visitationId === updated.visitationId
                  ? {
                      ...v,
                      visitDate: updated.visitDate,
                      socialWorker: updated.socialWorker,
                      visitType: updated.visitType,
                      familyCooperation: updated.familyCooperationLevel || '',
                      safetyConcern: updated.safetyConcernsNoted,
                      followUpNeeded: updated.followUpNeeded,
                      outcome: updated.visitOutcome || '',
                    }
                  : v
              )
            );
          }}
        />
      )}
      {sessionToDelete && (
        <ConfirmDeleteModal
          title="Delete session note"
          description={`Permanently delete session note #${sessionToDelete.recordingId}? This cannot be undone.`}
          onConfirm={handleDeleteSession}
          onCancel={() => setSessionToDelete(null)}
          loading={sessionDeleteLoading}
        />
      )}
      {visitToDelete && (
        <ConfirmDeleteModal
          title="Delete home visitation"
          description={`Permanently delete home visit #${visitToDelete.visitationId}? This cannot be undone.`}
          onConfirm={handleDeleteVisit}
          onCancel={() => setVisitToDelete(null)}
          loading={visitDeleteLoading}
        />
      )}
    </AdminLayout>
  );
}
