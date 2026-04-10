import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserCircle, Mail, Heart, KeyRound, Eye, EyeOff, Check, ArrowLeft, Globe } from 'lucide-react';
import PublicLayout from '../layouts/PublicLayout';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import { COUNTRIES } from '../utils/countries';

export default function DonorMyAccountPage() {
  const { user, refreshUser } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [country, setCountry]         = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved]   = useState(false);
  const [profileError, setProfileError]   = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent]         = useState(false);
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [savingPassword, setSavingPassword]   = useState(false);
  const [passwordSaved, setPasswordSaved]     = useState(false);
  const [passwordError, setPasswordError]     = useState('');

  // Fetch current country on mount
  useEffect(() => {
    apiFetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.country) setCountry(data.country); })
      .catch(() => {});
  }, []);

  const nameParts = (user?.displayName ?? '').trim().split(/\s+/);
  const initials  = nameParts.length >= 2
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    : (user?.displayName ?? 'U').slice(0, 2).toUpperCase();

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) { setProfileError('Display name cannot be empty.'); return; }
    setProfileError('');
    setSavingProfile(true);

    const [nameRes, countryRes] = await Promise.all([
      apiFetch('/api/profile/display-name', {
        method: 'PATCH',
        body: JSON.stringify({ displayName: displayName.trim() }),
      }),
      apiFetch('/api/profile/country', {
        method: 'PATCH',
        body: JSON.stringify({ country: country || null }),
      }),
    ]);

    if (nameRes.ok && countryRes.ok) {
      await refreshUser();
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } else {
      const err = await (nameRes.ok ? countryRes : nameRes).json().catch(() => ({}));
      setProfileError(err.message ?? 'Failed to save profile.');
    }
    setSavingProfile(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 14) { setPasswordError('New password must be at least 14 characters.'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('New passwords do not match.'); return; }
    setPasswordError('');
    setSavingPassword(true);
    const res = await apiFetch('/api/profile/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (res.ok) {
      setPasswordSaved(true);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setTimeout(() => setPasswordSaved(false), 3000);
    } else {
      const err = await res.json().catch(() => ({}));
      setPasswordError(err.message ?? 'Failed to change password. Check your current password.');
    }
    setSavingPassword(false);
  }

  return (
    <PublicLayout>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-12 space-y-6">

        <div className="flex items-center gap-3">
          <Link to="/donor" className="text-dark/40 hover:text-navy transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold text-navy">My Account</h1>
            <p className="text-dark/50 text-sm mt-0.5">Manage your profile and password</p>
          </div>
        </div>

        {/* Profile card */}
        <div className="card">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-navy flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="font-display text-lg font-bold text-navy">{user?.displayName ?? '—'}</p>
              <p className="text-sm text-dark/50">{user?.email}</p>
              <span className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold/15 text-yellow-700">
                <Heart size={11} /> Donor
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-dark/40 flex items-center gap-2">
              <UserCircle size={14} /> Profile
            </h3>

            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Display Name</label>
              <input
                type="text" value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Email</label>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-dark/8 bg-dark/3">
                <Mail size={14} className="text-dark/30 flex-shrink-0" />
                <span className="text-sm text-dark/50">{user?.email}</span>
              </div>
              <p className="text-xs text-dark/30 mt-1">To change your email, contact us at hello@sureanchor.org.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Country</label>
              <div className="relative">
                <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/30 pointer-events-none" />
                <select
                  value={country} onChange={e => setCountry(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
                >
                  <option value="">Select your country…</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {profileError && <p className="text-xs text-red-500">{profileError}</p>}

            <button type="submit" disabled={savingProfile}
              className="btn-primary text-sm flex items-center gap-2 disabled:opacity-60">
              {profileSaved ? <><Check size={15} /> Saved</> : savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Change password card */}
        <div className="card">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-dark/40 flex items-center gap-2">
              <KeyRound size={14} /> Change Password
            </h3>
            <p className="text-xs text-dark/40">Minimum 14 characters.</p>

            {[
              { label: 'Current Password',     value: currentPassword, set: setCurrentPassword, show: showCurrent, toggle: () => setShowCurrent(s => !s) },
              { label: 'New Password',         value: newPassword,     set: setNewPassword,     show: showNew,     toggle: () => setShowNew(s => !s) },
              { label: 'Confirm New Password', value: confirmPassword, set: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm(s => !s) },
            ].map(({ label, value, set, show, toggle }) => (
              <div key={label}>
                <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">{label}</label>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'} required value={value}
                    onChange={e => set(e.target.value)}
                    className="w-full px-3 py-2.5 pr-12 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30"
                  />
                  <button type="button" onClick={toggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-dark/30 hover:text-dark/60">
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}

            {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}

            <button type="submit" disabled={savingPassword}
              className="btn-primary text-sm flex items-center gap-2 disabled:opacity-60">
              {passwordSaved ? <><Check size={15} /> Password Updated</> : savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </PublicLayout>
  );
}