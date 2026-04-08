import { useEffect, useState } from 'react';
import { Users, ShieldCheck, Plus, X, Pencil, Trash2, Search, KeyRound, UserCog } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import ValidationModal from '../components/ValidationModal';
import { useListPagination } from '../hooks/useListPagination';
import ListPaginationBar from '../components/ListPaginationBar';

// ─── Types ────────────────────────────────────────────────────────────────────

interface StaffUser {
  userId: string;
  email: string;
  displayName: string | null;
  roles: string[];
  isLockedOut: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roleBadge(roles: string[]) {
  const isAdmin = roles.includes('Admin');
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      isAdmin ? 'bg-navy/10 text-navy' : 'bg-teal/10 text-teal-dark'
    }`}>
      {isAdmin ? 'Admin' : 'Staff'}
    </span>
  );
}

// ─── Add User Modal ───────────────────────────────────────────────────────────

function AddUserModal({ onClose, onSaved }: { onClose: () => void; onSaved: (u: StaffUser) => void }) {
  const [saving, setSaving] = useState(false);
  const [validationMsg, setValidationMsg] = useState('');
  const [form, setForm] = useState({ email: '', password: '', displayName: '', role: 'Staff' });
  const [showPassword, setShowPassword] = useState(false);

  function set(key: string, value: string) { setForm(prev => ({ ...prev, [key]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 14) {
      setValidationMsg('Password must be at least 14 characters.');
      return;
    }
    setSaving(true);
    const res = await apiFetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const { userId } = await res.json();
      onSaved({ userId, email: form.email, displayName: form.displayName || form.email, roles: [form.role], isLockedOut: false });
      onClose();
    } else {
      const err = await res.json();
      setValidationMsg(err.message ?? 'Failed to create account.');
    }
    setSaving(false);
  }

  return (
    <>
      {validationMsg && <ValidationModal message={validationMsg} onClose={() => setValidationMsg('')} />}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md animate-fade-in">
          <div className="sticky top-0 bg-white rounded-t-3xl px-6 py-5 border-b border-dark/8 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-navy">Add Staff Account</h2>
            <button onClick={onClose} className="text-dark/35 hover:text-dark hover:bg-dark/6 rounded-lg p-1.5 transition-colors">
              <X size={18} />
            </button>
          </div>
          <form className="p-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Display Name</label>
              <input
                type="text" value={form.displayName} onChange={e => set('displayName', e.target.value)}
                placeholder="e.g. Maria Santos"
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Email *</label>
              <input
                type="email" required value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="staff@sureanchor.org"
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Password * (min. 14 characters)</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} required value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="••••••••••••••"
                  className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25"
                />
                <button type="button" onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/30 hover:text-dark/60 text-xs font-semibold">
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Role *</label>
              <select value={form.role} onChange={e => set('role', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                <option value="Staff">Staff</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-dark/15 text-dark/60 text-sm font-semibold hover:bg-cream transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 btn-primary text-sm disabled:opacity-60">
                {saving ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ─── Edit User Modal ──────────────────────────────────────────────────────────

function EditUserModal({
  user: staffUser, currentUserId, onClose, onSaved,
}: {
  user: StaffUser; currentUserId: string; onClose: () => void; onSaved: (u: StaffUser) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [validationMsg, setValidationMsg] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    displayName: staffUser.displayName ?? '',
    role: staffUser.roles.includes('Admin') ? 'Admin' : 'Staff',
  });

  function set(key: string, value: string) { setForm(prev => ({ ...prev, [key]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch(`/api/users/${staffUser.userId}`, {
      method: 'PUT',
      body: JSON.stringify({ displayName: form.displayName, role: form.role }),
    });
    if (res.ok) {
      onSaved({ ...staffUser, displayName: form.displayName, roles: [form.role] });
      onClose();
    } else {
      const err = await res.json();
      setValidationMsg(err.message ?? 'Failed to update account.');
    }
    setSaving(false);
  }

  async function handlePasswordReset() {
    if (newPassword.length < 14) {
      setValidationMsg('Password must be at least 14 characters.');
      return;
    }
    setResetting(true);
    const res = await apiFetch(`/api/users/${staffUser.userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    });
    if (res.ok) {
      setShowPasswordReset(false);
      setNewPassword('');
      setValidationMsg('');
    } else {
      const err = await res.json();
      setValidationMsg(err.message ?? 'Failed to reset password.');
    }
    setResetting(false);
  }

  const isSelf = staffUser.email === currentUserId;

  return (
    <>
      {validationMsg && <ValidationModal message={validationMsg} onClose={() => setValidationMsg('')} />}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md animate-fade-in">
          <div className="sticky top-0 bg-white rounded-t-3xl px-6 py-5 border-b border-dark/8 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-navy">Edit Account</h2>
              <p className="text-xs text-dark/40 mt-0.5">{staffUser.email}</p>
            </div>
            <button onClick={onClose} className="text-dark/35 hover:text-dark hover:bg-dark/6 rounded-lg p-1.5 transition-colors">
              <X size={18} />
            </button>
          </div>
          <form className="p-6 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Display Name</label>
              <input
                type="text" value={form.displayName} onChange={e => set('displayName', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Role</label>
              <select value={form.role} onChange={e => set('role', e.target.value)}
                disabled={isSelf}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 disabled:opacity-50">
                <option value="Staff">Staff</option>
                <option value="Admin">Admin</option>
              </select>
              {isSelf && <p className="text-xs text-dark/40 mt-1">You cannot change your own role.</p>}
            </div>

            {/* Password reset section */}
            <div className="border border-dark/10 rounded-2xl p-4">
              <button type="button" onClick={() => setShowPasswordReset(s => !s)}
                className="flex items-center gap-2 text-sm font-semibold text-navy hover:text-teal transition-colors">
                <KeyRound size={15} />
                {showPasswordReset ? 'Cancel password reset' : 'Reset password'}
              </button>
              {showPasswordReset && (
                <div className="mt-3 space-y-3">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      placeholder="New password (min. 14 characters)"
                      className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25"
                    />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/30 hover:text-dark/60 text-xs font-semibold">
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <button type="button" onClick={handlePasswordReset} disabled={resetting}
                    className="w-full py-2.5 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-navy-light transition-colors disabled:opacity-60">
                    {resetting ? 'Resetting...' : 'Set new password'}
                  </button>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-dark/15 text-dark/60 text-sm font-semibold hover:bg-cream transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="flex-1 btn-primary text-sm disabled:opacity-60">
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StaffAccountsPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    apiFetch('/api/users')
      .then(r => r.ok ? r.json() : [])
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await apiFetch(`/api/users/${deleteTarget.userId}`, { method: 'DELETE' });
    setUsers(prev => prev.filter(u => u.userId !== deleteTarget.userId));
    setDeleteTarget(null);
    setDeleteLoading(false);
  }

  const filtered = users.filter(u =>
    !search ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.displayName ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const pag = useListPagination(filtered, [search]);
  const adminCount = users.filter(u => u.roles.includes('Admin')).length;
  const staffCount = users.filter(u => !u.roles.includes('Admin')).length;

  return (
    <AdminLayout>
      <div className="space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-navy">Staff Accounts</h1>
            <p className="text-dark/50 text-sm mt-1">Manage admin and staff access</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2 text-sm self-start sm:self-auto"
          >
            <Plus size={16} /> Add Account
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Users,      label: 'Total Accounts', value: users.length, color: 'text-navy',  bg: 'bg-navy/8' },
            { icon: ShieldCheck, label: 'Admins',         value: adminCount,   color: 'text-gold',  bg: 'bg-gold/10' },
            { icon: UserCog,    label: 'Staff',           value: staffCount,   color: 'text-teal',  bg: 'bg-teal/10' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="card flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon size={22} className={color} strokeWidth={1.8} />
              </div>
              <div>
                <div className={`font-display text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-sm text-dark/55 font-medium">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="card py-3.5">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/30" />
            <input
              type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-dark/10 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/25 focus:border-teal placeholder-dark/30"
            />
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 rounded-full border-4 border-teal border-t-transparent animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-dark/40 text-sm">No accounts found.</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark/8 bg-cream/70">
                      {['Name', 'Email', 'Role', 'Status', ''].map(h => (
                        <th key={h} className="text-left text-xs font-semibold text-dark/40 uppercase tracking-wide px-5 py-3.5 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pag.pageItems.map((u, i) => {
                      const isSelf = u.email === currentUser?.email;
                      return (
                        <tr
                          key={u.userId}
                          className={`border-b border-dark/5 transition-colors last:border-0 ${(pag.startIndex + i) % 2 !== 0 ? 'bg-cream/30' : ''}`}
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-navy/8 flex items-center justify-center text-navy text-xs font-bold flex-shrink-0">
                                {(u.displayName ?? u.email).slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-dark">
                                  {u.displayName ?? '—'}
                                  {u.email === currentUser?.email && (
                                    <span className="ml-2 text-xs text-teal font-normal">(you)</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-dark/60">{u.email}</td>
                          <td className="px-5 py-3.5">{roleBadge(u.roles)}</td>
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${u.isLockedOut ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                              {u.isLockedOut ? 'Locked out' : 'Active'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setEditTarget(u)}
                                className="p-1.5 rounded-lg text-dark/25 hover:text-teal hover:bg-teal/10 transition-colors"
                                title="Edit account"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => !isSelf && setDeleteTarget(u)}
                                disabled={isSelf}
                                className="p-1.5 rounded-lg text-dark/25 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                title={isSelf ? "You can't delete your own account" : "Delete account"}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <ListPaginationBar
                page={pag.page}
                pageCount={pag.pageCount}
                pageSize={pag.pageSize}
                setPage={pag.setPage}
                setPageSize={pag.setPageSize}
                total={pag.total}
                startIndex={pag.startIndex}
                endIndex={pag.endIndex}
              />
            </>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSaved={u => setUsers(prev => [...prev, u])}
        />
      )}

      {editTarget && currentUser && (
        <EditUserModal
          user={editTarget}
          currentUserId={currentUser.email}
          onClose={() => setEditTarget(null)}
          onSaved={updated => {
            setUsers(prev => prev.map(u => u.userId === updated.userId ? updated : u));
            setEditTarget(null);
          }}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal
          title="Delete Account"
          description={`Are you sure you want to permanently delete the account for "${deleteTarget.displayName ?? deleteTarget.email}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}
    </AdminLayout>
  );
}