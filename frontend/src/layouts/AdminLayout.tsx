import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Home, HeartHandshake,
  BarChart2, Settings, LogOut, Menu, ChevronRight, ShieldAlert,
  UserCog, UserCircle, Share2
} from 'lucide-react';
import AnchorLogo from '../components/AnchorLogo';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen]             = useState(false);
  const [profileOpen, setProfileOpen]             = useState(false);
  const [activeAlertsCount, setActiveAlertsCount] = useState<number>(0);
  const profileRef = useRef<HTMLDivElement>(null);
  const location   = useLocation();
  const navigate   = useNavigate();
  const { user, logout } = useAuth();

  const isAdmin = user?.roles.includes('Admin') ?? false;

  const navItems = isAdmin
    ? [
        { label: 'Dashboard',         href: '/admin',                   icon: LayoutDashboard },
        { label: 'Caseload',          href: '/admin/caseload',          icon: Users },
        { label: 'Process Recording', href: '/admin/process-recording', icon: FileText },
        { label: 'Home Visitations',  href: '/admin/visitations',       icon: Home },
        { label: 'Donors',            href: '/admin/donors',            icon: HeartHandshake },
        { label: 'Reports',           href: '/admin/reports',           icon: BarChart2 },
        { label: 'Social Media',      href: '/admin/social-media',      icon: Share2 },
      ]
    : [
        { label: 'Caseload',          href: '/admin/caseload',          icon: Users },
        { label: 'Process Recording', href: '/admin/process-recording', icon: FileText },
        { label: 'Home Visitations',  href: '/admin/visitations',       icon: Home },
      ];

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => { setProfileOpen(false); }, [location.pathname]);

  // Fetch active alerts count for Safety Monitor badge
  useEffect(() => {
    async function fetchAlertsCount() {
      try {
        const [recordingsRes, incidentsRes] = await Promise.all([
          apiFetch('/api/process-recordings'),
          apiFetch('/api/incident-reports?resolved=false'),
        ]);
        if (recordingsRes.ok && incidentsRes.ok) {
          const recordings = await recordingsRes.json();
          const incidents  = await incidentsRes.json();
          const flagged    = recordings.filter((r: any) => r.concernsFlagged);
          setActiveAlertsCount(flagged.length + incidents.length);
        }
      } catch (error) {
        console.error('Failed to fetch alerts count:', error);
      }
    }
    if (isAdmin) {
      fetchAlertsCount();
      const interval = setInterval(fetchAlertsCount, 60000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const displayName = user?.displayName ?? user?.email ?? 'User';
  const nameParts   = displayName.trim().split(/\s+/);
  const initials    = nameParts.length >= 2
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    : displayName.slice(0, 2).toUpperCase();
  const roleLabel   = isAdmin ? 'Admin'
    : user?.roles.includes('Staff') ? 'Staff'
    : user?.roles.includes('Donor') ? 'Donor'
    : 'User';

  const isActive = (href: string) => {
    if (href === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo — links to public landing page */}
      <div className="px-5 py-5 border-b border-white/10">
        <Link to="/" onClick={() => setSidebarOpen(false)}>
          <AnchorLogo size="sm" variant="light" />
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            to={href}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
              isActive(href)
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/60 hover:text-white hover:bg-white/8'
            }`}
          >
            <Icon size={18} strokeWidth={isActive(href) ? 2.2 : 1.8} />
            <span className="flex-1">{label}</span>
            {isActive(href) && <ChevronRight size={14} className="text-gold/70" />}
          </Link>
        ))}

        {/* Admin-only links */}
        {isAdmin && (
          <>
            <Link
              to="/admin/safety"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive('/admin/safety')
                  ? 'bg-red-500/20 text-red-200 shadow-sm'
                  : 'text-red-300/70 hover:text-red-200 hover:bg-red-500/10'
              }`}
            >
              <ShieldAlert size={18} strokeWidth={isActive('/admin/safety') ? 2.2 : 1.8} />
              <span className="flex-1">Safety Monitor</span>
              {activeAlertsCount > 0 && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {activeAlertsCount}
                </span>
              )}
              {isActive('/admin/safety') && <ChevronRight size={14} className="text-red-300/70" />}
            </Link>
            <Link
              to="/admin/staff-accounts"
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group ${
                isActive('/admin/staff-accounts')
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/8'
              }`}
            >
              <UserCog size={18} strokeWidth={isActive('/admin/staff-accounts') ? 2.2 : 1.8} />
              <span className="flex-1">Staff Accounts</span>
              {isActive('/admin/staff-accounts') && <ChevronRight size={14} className="text-gold/70" />}
            </Link>
          </>
        )}
      </nav>

      <div className="px-3 pb-4 border-t border-white/10 pt-4 space-y-0.5">
        <Link
          to="/admin/my-account"
          onClick={() => setSidebarOpen(false)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/8 transition-all"
        >
          <Settings size={18} strokeWidth={1.8} />
          My Account
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-red-300 hover:bg-red-500/10 transition-all"
        >
          <LogOut size={18} strokeWidth={1.8} />
          Log Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-cream overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-navy flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-64 bg-navy z-10 animate-fade-in">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-navy/8 px-4 lg:px-6 h-14 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 rounded-lg text-navy hover:bg-navy/8"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="text-sm font-medium text-dark/50">
              {isActive('/admin/safety')          ? 'Safety Monitor'
                : isActive('/admin/staff-accounts') ? 'Staff Accounts'
                : isActive('/admin/my-account')     ? 'My Account'
                : isActive('/admin/social-media')   ? 'Social Media'
                : navItems.find(n => isActive(n.href))?.label || 'Admin'}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-teal/10 text-teal text-xs font-semibold px-3 py-1.5 rounded-full border border-teal/20">
              {roleLabel}
            </div>

            {/* Profile avatar + dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(o => !o)}
                className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-white text-xs font-bold hover:bg-navy-light transition-colors focus:outline-none focus:ring-2 focus:ring-teal/40"
              >
                {initials}
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-10 w-56 bg-white rounded-2xl shadow-card-hover border border-dark/8 z-50 overflow-hidden animate-fade-in">
                  <div className="px-4 py-3 border-b border-dark/8 bg-cream/60">
                    <p className="text-sm font-semibold text-navy truncate">{displayName}</p>
                    <p className="text-xs text-dark/40 truncate">{user?.email}</p>
                  </div>
                  <div className="py-1.5">
                    <Link
                      to="/admin/my-account"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark/70 hover:bg-teal/6 hover:text-navy transition-colors"
                    >
                      <UserCircle size={16} className="text-dark/40" strokeWidth={1.8} />
                      My Account
                    </Link>
                    <Link
                      to="/"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark/70 hover:bg-teal/6 hover:text-navy transition-colors"
                    >
                      <LayoutDashboard size={16} className="text-dark/40" strokeWidth={1.8} />
                      Public Site
                    </Link>
                  </div>
                  <div className="border-t border-dark/8 py-1.5">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} strokeWidth={1.8} />
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}