import { useState } from 'react';
import { UserCircle, Mail, ShieldCheck, KeyRound, Eye, EyeOff, Check } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';

export default function MyAccountPage() {
  const { user, refreshUser } = useAuth();

  const [displayName, setDisplayName]     = useState(user?.displayName ?? '');
  const [savingName, setSavingName]       = useState(false);
  const [nameSaved, setNameSaved]         = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent]         = useState(false);
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [savingPassword, setSavingPassword]   = useState(false);
  const [passwordSaved, setPasswordSaved]     = useState(false);
  const [validationMsg, setValidationMsg]     = useState('');

  const roleLabel = user?.roles.includes('Admin') ? 'Admin'
    : user?.roles.includes('Staff') ? 'Staff'
    : 'User';

  const nameParts = (user?.displayName ?? '').trim().split(/\s+/);
  const initials  = nameParts.length >= 2
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    : (user?.displayName ?? 'U').slice(0, 2).toUpperCase();

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) { setValidationMsg('Display name cannot be empty.'); return; }
    setSavingName(true);
    // Update via the users endpoint — find self by email
    const res = await apiFetch('/api/profile/display-name', {
      method: 'PATCH',
      body: JSON.stringify({ displayName: displayName.trim() }),
    });
    if (res.ok) {
      await refreshUser();
      setNameSaved(true);
      setTimeout(() => setNameSaved(false), 3000);
    } else {
      const err = await res.json().catch(() => ({}));
      setValidationMsg(err.message ?? 'Failed to update display name.');
    }
    setSavingName(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 14) {
      setValidationMsg('New password must be at least 14 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setValidationMsg('New passwords do not match.');
      return;
    }
    setSavingPassword(true);
    const res = await apiFetch('/api/profile/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (res.ok) {
      setPasswordSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSaved(false), 3000);
    } else {
      const err = await res.json().catch(() => ({}));
      setValidationMsg(err.message ?? 'Failed to change password. Check your current password.');
    }
    setSavingPassword(false);
  }

  return (
    <AdminLayout>
      {validationMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <p className="text-sm text-dark/70 mb-4">{validationMsg}</p>
            <button onClick={() => setValidationMsg('')} className="w-full btn-primary text-sm">OK</button>
          </div>
        </div>
      )}

      <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">My Account</h1>
          <p className="text-dark/70 text-sm mt-1">Manage your profile and password</p>
        </div>

        {/* Profile card */}
        <div className="card">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-navy flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="font-display text-lg font-bold text-navy">{user?.displayName ?? '—'}</p>
              <p className="text-sm text-dark/70">{user?.email}</p>
              <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                roleLabel === 'Admin' ? 'bg-navy/10 text-navy' : 'bg-teal/10 text-teal-dark'
              }`}>
                {roleLabel}
              </span>
            </div>
          </div>

          {/* Display name form */}
          <form onSubmit={handleSaveName} className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-dark/70 flex items-center gap-2">
              <UserCircle size={14} aria-hidden="true" /> Profile
            </h2>
            <div>
              <label htmlFor="account-display-name" className="block text-xs font-semibold text-dark/70 uppercase tracking-widest mb-2">Display Name</label>
              <input
                id="account-display-name"
                type="text" value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/70 uppercase tracking-widest mb-2">Email</label>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-dark/8 bg-dark/3">
                <Mail size={14} className="text-dark/40 flex-shrink-0" />
                <span className="text-sm text-dark/70">{user?.email}</span>
              </div>
              <p className="text-xs text-dark/70 mt-1">Email changes must be made by an Admin.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-dark/70 uppercase tracking-widest mb-2">Role</label>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-dark/8 bg-dark/3">
                <ShieldCheck size={14} className="text-dark/40 flex-shrink-0" />
                <span className="text-sm text-dark/70">{roleLabel}</span>
              </div>
            </div>
            <button type="submit" disabled={savingName}
              className="btn-primary text-sm flex items-center gap-2 disabled:opacity-60">
              {nameSaved ? <><Check size={15} /> Saved</> : savingName ? 'Saving...' : 'Save Name'}
            </button>
          </form>
        </div>

        {/* Change password card */}
        <div className="card">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-dark/70 flex items-center gap-2">
              <KeyRound size={14} aria-hidden="true" /> Change Password
            </h2>
            <p className="text-xs text-dark/70">Minimum 14 characters.</p>

            {[
              { label: 'Current Password',    id: 'pwd-current', btnId: 'pwd-current-toggle', autoComplete: 'current-password', value: currentPassword, set: setCurrentPassword, show: showCurrent, toggle: () => setShowCurrent(s => !s) },
              { label: 'New Password',         id: 'pwd-new',     btnId: 'pwd-new-toggle',     autoComplete: 'new-password',     value: newPassword,     set: setNewPassword,     show: showNew,     toggle: () => setShowNew(s => !s) },
              { label: 'Confirm New Password', id: 'pwd-confirm', btnId: 'pwd-confirm-toggle', autoComplete: 'new-password',     value: confirmPassword, set: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm(s => !s) },
            ].map(({ label, id, btnId, autoComplete, value, set, show, toggle }) => (
              <div key={label}>
                <label htmlFor={id} className="block text-xs font-semibold text-dark/70 uppercase tracking-widest mb-2">{label}</label>
                <div className="relative">
                  <input
                    id={id}
                    type={show ? 'text' : 'password'} required value={value}
                    autoComplete={autoComplete}
                    aria-describedby={btnId}
                    onChange={e => set(e.target.value)}
                    className="w-full px-3 py-2.5 pr-16 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
                  />
                  <button id={btnId} type="button" onClick={toggle}
                    aria-label={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/30 hover:text-dark/60">
                    {show ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
                  </button>
                </div>
              </div>
            ))}

            <button type="submit" disabled={savingPassword}
              className="btn-primary text-sm flex items-center gap-2 disabled:opacity-60">
              {passwordSaved ? <><Check size={15} /> Password Updated</> : savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}