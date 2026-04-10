import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import AnchorLogo from '../components/AnchorLogo';
import { apiFetch } from '../api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const email = searchParams.get('email') ?? '';
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword]     = useState('');
  const [confirm, setConfirm]             = useState('');
  const [showPassword, setShowPassword]   = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (newPassword.length < 14) {
      setError('Password must be at least 14 characters.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const res = await apiFetch('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, token, newPassword }),
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? 'Failed to reset password. The link may have expired.');
    }
    setLoading(false);
  }

  if (!email || !token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy via-navy-light to-teal-dark flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          <AnchorLogo size="lg" variant="dark" />
          <p className="text-dark/50 text-sm mt-6">Invalid password reset link.</p>
          <Link to="/login" className="btn-primary text-sm inline-flex mt-4">Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy-light to-teal-dark flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full animate-fade-in">
        <div className="flex justify-center mb-8">
          <AnchorLogo size="lg" variant="dark" />
        </div>

        {success ? (
          <div className="text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold text-navy mb-2">Password Reset!</h2>
            <p className="text-dark/50 text-sm">Redirecting you to login…</p>
          </div>
        ) : (
          <>
            <h2 className="font-display text-2xl font-bold text-navy mb-2 text-center">Reset Password</h2>
            <p className="text-dark/40 text-sm text-center mb-6">Choose a new password for <strong>{email}</strong></p>

            {error && (
              <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                    placeholder="At least 14 characters"
                    className="w-full px-4 py-3 rounded-xl border border-dark/15 bg-cream focus:outline-none focus:ring-2 focus:ring-teal/40 text-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark/30 hover:text-dark/60">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-dark mb-2">Confirm Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirm} onChange={e => setConfirm(e.target.value)} required
                  placeholder="Re-enter your password"
                  className="w-full px-4 py-3 rounded-xl border border-dark/15 bg-cream focus:outline-none focus:ring-2 focus:ring-teal/40 text-sm"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full btn-primary text-sm disabled:opacity-60">
                {loading ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>

            <p className="text-center text-sm text-dark/40 mt-4">
              <Link to="/login" className="text-teal font-semibold hover:underline">Back to Login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}