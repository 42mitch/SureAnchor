import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight } from 'lucide-react';
import AnchorLogo from '../components/AnchorLogo';
import { COUNTRIES } from '../utils/countries';

const API_BASE = import.meta.env.VITE_API_URL ?? '';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail]             = useState('');
  const [country, setCountry]         = useState('');
  const [password, setPassword]       = useState('');
  const [confirm, setConfirm]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  const personNameRe = /^[A-Za-z\s'\-]+$/;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!personNameRe.test(displayName.trim())) {
      setError('Full name can only include letters, spaces, apostrophes, and hyphens.');
      return;
    }
    if (password.length < 14) {
      setError('Password must be at least 14 characters long.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/auth/register`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, displayName, country: country || null }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? 'Registration failed. Please try again.');
        return;
      }
      navigate('/donor', { replace: true });
    } catch {
      setError('Unable to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy-light to-teal-dark flex items-center justify-center p-4">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-teal/10 blur-3xl" />
        <div className="absolute bottom-20 left-10 w-80 h-80 rounded-full bg-gold/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 animate-fade-in">
          <div className="flex justify-center mb-8">
            <div className="flex flex-col items-center gap-3">
              <AnchorLogo size="lg" variant="dark" />
              <p className="text-dark/40 text-xs text-center font-sans max-w-xs leading-relaxed">
                Create your donor account
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 h-px bg-dark/10" />
            <span className="text-xs font-medium text-dark/40 uppercase tracking-widest">Create Account</span>
            <div className="flex-1 h-px bg-dark/10" />
          </div>

          {/* Google sign-in */}
          <a
            href={`${API_BASE}/api/auth/google/signin`}
            className="flex items-center justify-center gap-3 w-full border border-dark/15 bg-white hover:bg-gray-50 text-dark font-semibold py-3 rounded-xl transition-all duration-200 shadow-sm text-sm mb-6"
          >
            <GoogleIcon />
            Continue with Google
          </a>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-dark/10" />
            <span className="text-xs font-medium text-dark/40 uppercase tracking-widest">or create with email</span>
            <div className="flex-1 h-px bg-dark/10" />
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Display Name */}
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">Full Name</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark/30">
                  <User size={18} />
                </div>
                <input
                  type="text" value={displayName}
                  onChange={e => setDisplayName(e.target.value)} required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-dark/15 bg-cream focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal text-dark text-sm placeholder-dark/30 transition-all"
                  placeholder="Maria Santos"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark/30">
                  <Mail size={18} />
                </div>
                <input
                  type="email" value={email}
                  onChange={e => setEmail(e.target.value)} required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-dark/15 bg-cream focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal text-dark text-sm placeholder-dark/30 transition-all"
                  placeholder="you@email.com"
                />
              </div>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">Country</label>
              <select
                value={country} onChange={e => setCountry(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-dark/15 bg-cream focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal text-dark text-sm transition-all"
              >
                <option value="">Select your country…</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">Password</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark/30">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)} required
                  className="w-full pl-11 pr-12 py-3 rounded-xl border border-dark/15 bg-cream focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal text-dark text-sm placeholder-dark/30 transition-all"
                  placeholder="At least 14 characters"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark/30 hover:text-dark/60 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-dark/35 mt-1.5 ml-1">Minimum 14 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">Confirm Password</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark/30">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'} value={confirm}
                  onChange={e => setConfirm(e.target.value)} required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-dark/15 bg-cream focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal text-dark text-sm placeholder-dark/30 transition-all"
                  placeholder="Re-enter your password"
                />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="flex items-center justify-center gap-2 w-full bg-teal text-white font-semibold py-3.5 rounded-xl hover:bg-teal-dark transition-all duration-200 shadow-sm hover:shadow-md text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (
                <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <> Create Account <ArrowRight size={17} /> </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-dark/40 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-teal font-semibold hover:underline">Sign in</Link>
          </p>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-white/50 text-sm hover:text-white/80 transition-colors">
            ← Back to SureAnchor.org
          </Link>
        </div>
      </div>
    </div>
  );
}