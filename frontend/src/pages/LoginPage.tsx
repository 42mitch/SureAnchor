import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ArrowRight } from 'lucide-react';

import AnchorLogo from '../components/AnchorLogo';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  // Use the "from" location if present, otherwise decide by role
  const fromPath = (location.state as { from?: { pathname: string } })?.from?.pathname;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      // result.user is set in AuthContext after login; get it via the context
      // We redirect after login by reading the roles from the returned user
      // AuthContext.login returns {} on success so we need to read user from context
      // Use fromPath if available, otherwise use role-based default
      if (fromPath) {
        navigate(fromPath, { replace: true });
      } else {
        // Roles are in the auth context after login — navigate via result
        navigate(result.destination ?? '/admin', { replace: true });
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy-light to-teal-dark flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-teal/10 blur-3xl" />
        <div className="absolute bottom-20 left-10 w-80 h-80 rounded-full bg-gold/8 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 animate-fade-in">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="flex flex-col items-center gap-3">
              <AnchorLogo size="lg" variant="dark" />
              <p className="text-dark/40 text-xs text-center font-sans max-w-xs leading-relaxed">
                Login — authorized access only
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 h-px bg-dark/10" />
            <span className="text-xs font-medium text-dark/40 uppercase tracking-widest">Sign in</span>
            <div className="flex-1 h-px bg-dark/10" />
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark/30">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-dark/15 bg-cream focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal text-dark text-sm placeholder-dark/30 transition-all"
                  placeholder="you@sureanchor.org"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-dark mb-2">Password</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark/30">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-12 py-3 rounded-xl border border-dark/15 bg-cream focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal text-dark text-sm placeholder-dark/30 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark/30 hover:text-dark/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 w-full bg-navy text-white font-semibold py-3.5 rounded-xl hover:bg-navy-light transition-all duration-200 shadow-sm hover:shadow-md text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Privacy */}
          <div className="relative flex items-center gap-3 mt-6">
            <div className="flex-1 h-px bg-dark/10" />
            <span className="text-xs font-medium text-dark/30">or</span>
            <div className="flex-1 h-px bg-dark/10" />
          </div>

          <Link
            to="/register"
            className="flex items-center justify-center gap-2 w-full border-2 border-teal text-teal font-semibold py-3.5 rounded-xl hover:bg-teal/5 transition-all duration-200 text-sm mt-4"
          >
            Create Donor Account
          </Link>

          <p className="text-center text-xs text-dark/30 mt-6">
            By signing in you agree to our{' '}
            <a href="#" className="text-teal hover:underline">Privacy Policy</a>
            {' '}and{' '}
            <a href="#" className="text-teal hover:underline">Data Protection Policy</a>
          </p>
        </div>

        {/* Back to site link */}
        <div className="text-center mt-6">
          <Link to="/" className="text-white/50 text-sm hover:text-white/80 transition-colors">
            ← Back to SureAnchor.org
          </Link>
        </div>
      </div>
    </div>
  );
}
