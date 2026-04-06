import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, User, FileText, Home, Shield, Calendar,
  AlertTriangle, CheckCircle, Clock, ChevronRight, Activity,
  BookOpen, Heart, MapPin, Hash
} from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { residents, sessionNotes, visitations } from '../data/mockData';

// ─── Badge helpers ──────────────────────────────────────────────────────────────
const riskBadge = (risk: string) => {
  const map: Record<string, string> = {
    Low: 'bg-green-100 text-green-700 border border-green-200',
    Medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
    High: 'bg-orange-100 text-orange-700 border border-orange-200',
    Critical: 'bg-red-100 text-red-700 border border-red-200',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[risk] || ''}`}>{risk} Risk</span>;
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
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[state] || 'bg-gray-100 text-gray-600'}`}>{state}</span>;
};

const cooperationBadge = (level: string) => {
  const map: Record<string, string> = {
    High: 'bg-green-100 text-green-700',
    Moderate: 'bg-yellow-100 text-yellow-700',
    Low: 'bg-red-100 text-red-700',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[level] || 'bg-gray-100 text-gray-600'}`}>{level}</span>;
};

const outcomeBadge = (outcome: string) => {
  const map: Record<string, { cls: string; icon: any }> = {
    Positive: { cls: 'bg-green-100 text-green-700', icon: CheckCircle },
    Ongoing: { cls: 'bg-blue-100 text-blue-700', icon: Clock },
    'Concerns Raised': { cls: 'bg-orange-100 text-orange-700', icon: AlertTriangle },
    'Hold Recommended': { cls: 'bg-red-100 text-red-700', icon: AlertTriangle },
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

// ─── Tab definitions ────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'sessions', label: 'Counseling Sessions', icon: FileText },
  { id: 'visitations', label: 'Home Visitations', icon: Home },
];

export default function ResidentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('overview');

  const resident = residents.find(r => r.id === id);
  if (!resident) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Shield size={48} className="text-dark/20 mb-4" />
          <h2 className="font-display text-2xl font-bold text-navy mb-2">Resident Not Found</h2>
          <p className="text-dark/50 mb-6">Case ID "{id}" does not exist in the system.</p>
          <Link to="/admin/caseload" className="btn-primary text-sm flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to Caseload
          </Link>
        </div>
      </AdminLayout>
    );
  }

  // Filter sessions and visitations for this resident
  const residentSessions = sessionNotes.filter(n => n.resident === id);
  const residentVisitations = visitations.filter(v => v.resident === id);

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
          {/* Decorative background circle */}
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 right-20 w-32 h-32 rounded-full bg-teal/10" />

          <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
            {/* Avatar */}
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
                Resident {resident.id}
              </h1>
              <div className="flex flex-wrap gap-4 text-white/60 text-sm mt-2">
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} />
                  {resident.safehouse}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  Admitted {resident.demographics.dateAdmitted}
                </span>
                <span className="flex items-center gap-1.5">
                  <Hash size={13} />
                  {resident.category}
                </span>
              </div>
            </div>

            {/* Summary stats */}
            <div className="flex sm:flex-col gap-4 sm:gap-3 sm:items-end text-right flex-shrink-0">
              <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
                <div className="font-display text-2xl font-bold text-gold">{residentSessions.length}</div>
                <div className="text-xs text-white/60">Sessions</div>
              </div>
              <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
                <div className="font-display text-2xl font-bold text-teal-light">{residentVisitations.length}</div>
                <div className="text-xs text-white/60">Home Visits</div>
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

        {/* ── OVERVIEW TAB ─────────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Demographics card */}
            <div className="lg:col-span-2 card">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-navy/8 flex items-center justify-center">
                  <User size={16} className="text-navy" />
                </div>
                <h2 className="font-display text-lg font-semibold text-navy">Demographics</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">
                {[
                  { label: 'Age', value: `${resident.age} years old` },
                  { label: 'Civil Status', value: resident.demographics.civilStatus },
                  { label: 'Religion', value: resident.demographics.religion },
                  { label: 'Education Level', value: resident.demographics.educationLevel },
                  { label: 'Case Category', value: resident.category },
                  { label: 'Date Admitted', value: resident.demographics.dateAdmitted },
                  { label: 'Safe House', value: resident.safehouse },
                  { label: 'Current Status', value: resident.status },
                  { label: 'Risk Level', value: resident.risk },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-dark/40 font-semibold uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-sm font-semibold text-dark">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Social worker + case info */}
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
                    <span className="font-bold text-navy text-sm">{residentSessions.length}</span>
                  </div>
                  <div className="h-px bg-dark/6" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-dark/50 font-medium">Home Visitations</span>
                    <span className="font-bold text-navy text-sm">{residentVisitations.length}</span>
                  </div>
                  <div className="h-px bg-dark/6" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-dark/50 font-medium">Safety Concerns</span>
                    <span className={`font-bold text-sm ${residentVisitations.some(v => v.safetyConcern) ? 'text-red-600' : 'text-green-600'}`}>
                      {residentVisitations.some(v => v.safetyConcern) ? 'Yes' : 'None'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Most recent session note */}
            <div className="lg:col-span-3 card border-l-4 border-teal">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={16} className="text-teal" />
                <h2 className="font-semibold text-sm text-navy uppercase tracking-wide">Most Recent Case Note</h2>
              </div>
              <p className="text-sm text-dark/70 leading-relaxed">{resident.recentNote}</p>
              {residentSessions.length > 0 && (
                <button
                  onClick={() => setActiveTab('sessions')}
                  className="mt-4 text-sm text-teal font-semibold flex items-center gap-1 hover:text-teal-dark transition-colors"
                >
                  View all {residentSessions.length} session notes
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── SESSIONS TAB ─────────────────────────────────────────────────────── */}
        {activeTab === 'sessions' && (
          <div className="space-y-4">
            {residentSessions.length === 0 ? (
              <div className="card text-center py-16">
                <FileText size={40} className="text-dark/20 mx-auto mb-3" />
                <p className="font-display text-lg font-semibold text-navy mb-1">No Session Notes Yet</p>
                <p className="text-dark/45 text-sm">Session notes for this resident will appear here.</p>
              </div>
            ) : (
              residentSessions.map((note, i) => (
                <div key={note.id} className="card hover:shadow-card-hover transition-all duration-200">
                  {/* Session header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-navy/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-navy font-bold text-xs">#{i + 1}</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${note.type === 'Individual' ? 'bg-navy/8 text-navy' : 'bg-teal/10 text-teal-dark'}`}>
                            {note.type} Session
                          </span>
                          {emotionBadge(note.emotionalState)}
                        </div>
                        <p className="text-xs text-dark/40 font-medium">{note.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-shrink-0">
                      <div className="w-7 h-7 rounded-full bg-teal flex items-center justify-center text-white text-xs font-bold">
                        {note.worker.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-xs font-semibold text-dark/60">{note.worker}</span>
                    </div>
                  </div>

                  {/* Narrative */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-dark/40 uppercase tracking-wide mb-2">Session Narrative</p>
                    <p className="text-sm text-dark/75 leading-relaxed bg-cream rounded-xl px-4 py-3">
                      {note.narrative}
                    </p>
                  </div>

                  {/* Interventions + Follow-up */}
                  <div className="grid sm:grid-cols-2 gap-4 border-t border-dark/6 pt-4">
                    <div>
                      <p className="text-xs font-semibold text-dark/40 uppercase tracking-wide mb-1.5">Interventions Applied</p>
                      <p className="text-sm text-dark/65 leading-snug">{note.interventions}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-dark/40 uppercase tracking-wide mb-1.5">Follow-up Actions</p>
                      <p className="text-sm text-teal font-medium leading-snug">{note.followUp}</p>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Fallback note from resident if no formal notes */}
            {residentSessions.length === 0 && resident.recentNote && (
              <div className="card border-l-4 border-gold">
                <p className="text-xs font-semibold text-dark/40 uppercase tracking-wide mb-2">Most Recent Case Note (from file)</p>
                <p className="text-sm text-dark/70 leading-relaxed">{resident.recentNote}</p>
              </div>
            )}
          </div>
        )}

        {/* ── VISITATIONS TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'visitations' && (
          <div className="space-y-4">
            {residentVisitations.length === 0 ? (
              <div className="card text-center py-16">
                <Home size={40} className="text-dark/20 mx-auto mb-3" />
                <p className="font-display text-lg font-semibold text-navy mb-1">No Home Visits Recorded</p>
                <p className="text-dark/45 text-sm">Home visitation records for this resident will appear here.</p>
              </div>
            ) : (
              residentVisitations.map((visit) => (
                <div
                  key={visit.id}
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
                          <span className="font-mono text-xs font-bold text-navy/60 bg-navy/6 px-2 py-0.5 rounded-md">{visit.id}</span>
                          <span className="text-xs font-semibold text-dark/50 bg-dark/6 px-2 py-0.5 rounded-md">{visit.visitType}</span>
                        </div>
                        <p className="text-xs text-dark/40">{visit.date}</p>
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
                          {visit.worker.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm font-semibold text-dark">{visit.worker}</span>
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
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
