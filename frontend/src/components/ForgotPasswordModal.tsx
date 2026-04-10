import { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { apiFetch } from '../api';

interface ForgotPasswordModalProps {
  onClose: () => void;
}

export default function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
  const [email, setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await apiFetch('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (res.ok) {
      setSent(true);
    } else {
      setError('Something went wrong. Please try again.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm animate-fade-in p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-navy">Reset Password</h2>
          <button onClick={onClose} className="text-dark/30 hover:text-dark/60">
            <X size={18} />
          </button>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
            <p className="text-sm text-dark/70 leading-relaxed">
              If an account with that email exists, we've sent a password reset link. Check your inbox.
            </p>
            <button onClick={onClose} className="btn-primary text-sm mt-4">Done</button>
          </div>
        ) : (
          <>
            <p className="text-sm text-dark/50 mb-4">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            {error && (
              <div className="mb-4 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full px-4 py-3 rounded-xl border border-dark/15 bg-cream focus:outline-none focus:ring-2 focus:ring-teal/40 text-sm"
              />
              <div className="flex gap-3">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-dark/15 text-dark/60 text-sm font-semibold hover:bg-cream transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 btn-primary text-sm disabled:opacity-60">
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}