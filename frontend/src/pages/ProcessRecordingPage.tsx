import { useState } from 'react';
import { Plus, X, FileText, ChevronRight, Search } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { sessionNotes, residents } from '../data/mockData';

type SessionNote = typeof sessionNotes[0];

// ─── Badge helpers ──────────────────────────────────────────────────────────────
const emotionBadge = (state: string) => {
  const map: Record<string, string> = {
    Hopeful:    'bg-green-100 text-green-700',
    Calm:       'bg-blue-100 text-blue-700',
    Anxious:    'bg-yellow-100 text-yellow-700',
    Distressed: 'bg-red-100 text-red-700',
    Reflective: 'bg-purple-100 text-purple-700',
    Withdrawn:  'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[state] || 'bg-gray-100 text-gray-600'}`}>
      {state}
    </span>
  );
};

const typeBadge = (type: string) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
    type === 'Individual' ? 'bg-navy/8 text-navy' : 'bg-teal/10 text-teal-dark'
  }`}>
    {type}
  </span>
);

// ─── Session Detail Modal ───────────────────────────────────────────────────────
function SessionDetailModal({ note, onClose }: { note: SessionNote; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">

        {/* Modal header */}
        <div className="sticky top-0 bg-white rounded-t-3xl px-6 py-5 border-b border-dark/8 flex items-start justify-between z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold bg-navy/8 text-navy px-2.5 py-1 rounded-lg">
                Resident {note.resident}
              </span>
              {typeBadge(note.type)}
              {emotionBadge(note.emotionalState)}
            </div>
            <p className="text-dark/40 text-xs font-medium mt-1">
              {note.date} · {note.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-dark/35 hover:text-dark hover:bg-dark/6 rounded-lg p-1.5 transition-colors flex-shrink-0 ml-3"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Worker */}
          <div className="flex items-center gap-3 bg-teal/6 rounded-2xl px-4 py-3.5">
            <div className="w-9 h-9 rounded-full bg-teal flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {note.worker.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <p className="text-xs text-dark/40 font-medium">Assigned Social Worker</p>
              <p className="text-sm font-semibold text-navy">{note.worker}</p>
            </div>
          </div>

          {/* Narrative */}
          <div>
            <p className="text-xs font-semibold text-dark/40 uppercase tracking-widest mb-3">Session Narrative</p>
            <div className="bg-cream rounded-2xl px-5 py-4 border-l-4 border-teal">
              <p className="text-sm text-dark/75 leading-relaxed">{note.narrative}</p>
            </div>
          </div>

          {/* Interventions */}
          <div>
            <p className="text-xs font-semibold text-dark/40 uppercase tracking-widest mb-2">Interventions Applied</p>
            <div className="flex flex-wrap gap-2">
              {note.interventions.split(',').map(i => (
                <span
                  key={i.trim()}
                  className="bg-navy/6 text-navy text-xs font-semibold px-3 py-1.5 rounded-lg"
                >
                  {i.trim()}
                </span>
              ))}
            </div>
          </div>

          {/* Follow-up */}
          <div>
            <p className="text-xs font-semibold text-dark/40 uppercase tracking-widest mb-2">Follow-up Actions</p>
            <div className="flex items-start gap-3 bg-gold/8 rounded-2xl px-4 py-3.5 border border-gold/20">
              <div className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 flex-shrink-0" />
              <p className="text-sm font-medium text-dark/70">{note.followUp}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl border border-dark/12 text-dark/60 text-sm font-semibold hover:bg-cream transition-colors mt-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── New Session Note Modal ─────────────────────────────────────────────────────
function NewSessionModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="sticky top-0 bg-white rounded-t-3xl px-6 py-5 border-b border-dark/8 flex items-center justify-between z-10">
          <div>
            <h2 className="font-display text-xl font-bold text-navy">New Session Note</h2>
            <p className="text-xs text-dark/40 mt-0.5">All entries are confidential and encrypted</p>
          </div>
          <button onClick={onClose} className="text-dark/35 hover:text-dark hover:bg-dark/6 rounded-lg p-1.5 transition-colors">
            <X size={18} />
          </button>
        </div>

        <form className="p-6 space-y-5" onSubmit={(e) => e.preventDefault()}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Resident</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                <option value="">Select resident...</option>
                {residents.map(r => (
                  <option key={r.id} value={r.id}>Resident {r.id} ({r.safehouse})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Session Date</label>
              <input type="date" defaultValue="2024-07-21"
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Session Type</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                <option>Individual</option>
                <option>Group</option>
                <option>Family</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Emotional State</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                <option>Calm</option>
                <option>Hopeful</option>
                <option>Anxious</option>
                <option>Distressed</option>
                <option>Reflective</option>
                <option>Withdrawn</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Session Narrative</label>
            <textarea rows={5} placeholder="Describe the session in detail — observations, interactions, themes discussed..."
              className="w-full px-4 py-3 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 resize-none placeholder-dark/25" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Interventions Applied</label>
            <input type="text" placeholder="e.g. CBT grounding, art therapy, safety planning..."
              className="w-full px-4 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Follow-up Actions</label>
            <input type="text" placeholder="e.g. Coordinate with legal team, schedule family meeting..."
              className="w-full px-4 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-dark/15 text-dark/60 text-sm font-semibold hover:bg-cream transition-colors">
              Cancel
            </button>
            <button type="submit" className="flex-1 btn-primary text-sm">
              Save Session Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────
export default function ProcessRecordingPage() {
  const [selectedNote, setSelectedNote] = useState<SessionNote | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  return (
    <AdminLayout>
      <div className="space-y-5 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-navy">Process Recording</h1>
            <p className="text-dark/50 text-sm mt-1">{sessionNotes.length} sessions recorded · click any entry to view full notes</p>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="btn-primary flex items-center gap-2 text-sm self-start sm:self-auto"
          >
            <Plus size={16} />
            New Session Note
          </button>
        </div>

        {/* Search bar */}
        <div className="card py-3.5">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/30" />
            <input
              type="text"
              placeholder="Search by resident ID, social worker, or session type..."
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
                  <th className="text-left text-xs font-semibold text-dark/40 uppercase tracking-wide px-5 py-3.5">Session ID</th>
                  <th className="text-left text-xs font-semibold text-dark/40 uppercase tracking-wide px-5 py-3.5">Resident</th>
                  <th className="text-left text-xs font-semibold text-dark/40 uppercase tracking-wide px-5 py-3.5">Date</th>
                  <th className="text-left text-xs font-semibold text-dark/40 uppercase tracking-wide px-5 py-3.5">Social Worker</th>
                  <th className="text-left text-xs font-semibold text-dark/40 uppercase tracking-wide px-5 py-3.5">Type</th>
                  <th className="text-left text-xs font-semibold text-dark/40 uppercase tracking-wide px-5 py-3.5">Emotional State</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {sessionNotes.map((note, i) => (
                  <tr
                    key={note.id}
                    onClick={() => setSelectedNote(note)}
                    className={`border-b border-dark/5 last:border-0 cursor-pointer hover:bg-teal/4 transition-colors group ${
                      i % 2 === 0 ? '' : 'bg-cream/30'
                    }`}
                  >
                    {/* Session ID */}
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-bold text-dark/40">{note.id}</span>
                    </td>

                    {/* Resident */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-navy/8 flex items-center justify-center flex-shrink-0">
                          <FileText size={14} className="text-navy/50" />
                        </div>
                        <span className="font-mono text-sm font-semibold text-navy">
                          Resident {note.resident}
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4">
                      <span className="text-sm text-dark/65 whitespace-nowrap">{note.date}</span>
                    </td>

                    {/* Social Worker */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-teal flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {note.worker.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="text-sm text-dark/70 font-medium whitespace-nowrap">{note.worker}</span>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="px-5 py-4">
                      {typeBadge(note.type)}
                    </td>

                    {/* Emotional state */}
                    <td className="px-5 py-4">
                      {emotionBadge(note.emotionalState)}
                    </td>

                    {/* Chevron */}
                    <td className="px-5 py-4">
                      <ChevronRight
                        size={16}
                        className="text-dark/20 group-hover:text-teal group-hover:translate-x-0.5 transition-all"
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
              Showing {sessionNotes.length} of {sessionNotes.length} entries
            </span>
            <span className="text-xs text-dark/30">All records encrypted · access logged</span>
          </div>
        </div>
      </div>

      {/* Session detail modal */}
      {selectedNote && (
        <SessionDetailModal note={selectedNote} onClose={() => setSelectedNote(null)} />
      )}

      {/* New session note modal */}
      {showNewModal && (
        <NewSessionModal onClose={() => setShowNewModal(false)} />
      )}
    </AdminLayout>
  );
}
