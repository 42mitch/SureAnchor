import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, LogOut, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SupportMissionButtonProps {
  className?: string;
  showArrow?: boolean;
}

export default function SupportMissionButton({ className = '', showArrow = true }: SupportMissionButtonProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isStaffOrAdmin = user?.roles.includes('Admin') || user?.roles.includes('Staff');
  const isDonor = user?.roles.includes('Donor');

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  }

  // Logged-in donor → go straight to donor portal
  if (isDonor && !isStaffOrAdmin) {
    return (
      <Link to="/donor" className={className}>
        Support Our Mission
        {showArrow && <ArrowRight size={18} />}
      </Link>
    );
  }

  // Logged-in staff/admin → show modal warning
  if (isStaffOrAdmin) {
    return (
      <>
        <button onClick={() => setShowModal(true)} className={className}>
          Support Our Mission
          {showArrow && <ArrowRight size={18} />}
        </button>

        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-fade-in">
              <div className="flex items-start justify-between mb-4">
                <h2 className="font-display text-lg font-bold text-navy">Want to Donate?</h2>
                <button onClick={() => setShowModal(false)}
                  className="text-dark/30 hover:text-dark/60 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm text-dark/60 leading-relaxed mb-6">
                Donations are made through a donor account. You're currently signed in as{' '}
                <span className="font-semibold text-navy">
                  {user?.roles.includes('Admin') ? 'Admin' : 'Staff'}
                </span>
                . To donate, please sign out and log in with a donor account.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-dark/15 text-dark/60 text-sm font-semibold hover:bg-cream transition-colors">
                  Cancel
                </button>
                <button onClick={handleLogout} disabled={loggingOut}
                  className="flex-1 py-2.5 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-navy-light transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                  <LogOut size={15} />
                  {loggingOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Not logged in → go to login
  return (
    <Link to="/login" className={className}>
      Support Our Mission
      {showArrow && <ArrowRight size={18} />}
    </Link>
  );
}