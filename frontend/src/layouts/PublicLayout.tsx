import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, UserCircle, LogOut, LayoutDashboard, Heart } from 'lucide-react';
import AnchorLogo from '../components/AnchorLogo';
import { resetConsent } from '../components/CookieConsent';
import { useAuth } from '../context/AuthContext';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isAdmin  = user?.roles.includes('Admin') ?? false;
  const isStaff  = user?.roles.includes('Staff') ?? false;
  const isDonor  = user?.roles.includes('Donor') ?? false;
  const isLoggedIn = !!user;

  const portalLabel = isAdmin ? 'Admin Tools' : isStaff ? 'Staff Tools' : 'Donor Portal';
  const portalHref  = isAdmin || isStaff ? '/admin' : '/donor';

  const displayName = user?.displayName ?? user?.email ?? '';
  const nameParts   = displayName.trim().split(/\s+/);
  const initials    = nameParts.length >= 2
    ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
    : displayName.slice(0, 2).toUpperCase() || '?';

  async function handleLogout() {
    await logout();
    navigate('/', { replace: true });
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

  const navLinks = [
    { label: 'Our Mission', href: '/#mission' },
    { label: 'Our Impact',  href: '/impact' },
    { label: 'Contact',     href: '/contact' },
  ];

  const myAccountHref = isDonor && !isAdmin && !isStaff
    ? '/donor/my-account'
    : '/admin/my-account';

  return (
    <div className="min-h-screen bg-cream font-sans">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-navy/8 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo — always links to landing page */}
            <Link to="/">
              <AnchorLogo size="md" variant="dark" />
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map(link => (
                link.href.startsWith('/#') ? (
                  <a key={link.label} href={link.href}
                    className="text-sm font-medium text-dark/70 hover:text-navy transition-colors">
                    {link.label}
                  </a>
                ) : (
                  <Link key={link.label} to={link.href}
                    className="text-sm font-medium text-dark/70 hover:text-navy transition-colors">
                    {link.label}
                  </Link>
                )
              ))}

              {isLoggedIn ? (
                <div className="flex items-center gap-3">
                  {/* Portal button */}
                  <Link to={portalHref}
                    className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                    {isAdmin || isStaff
                      ? <LayoutDashboard size={15} />
                      : <Heart size={15} />}
                    {portalLabel}
                  </Link>

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
                          <Link to={myAccountHref}
                            onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark/70 hover:bg-teal/6 hover:text-navy transition-colors">
                            <UserCircle size={16} className="text-dark/40" strokeWidth={1.8} />
                            My Account
                          </Link>
                          {(isAdmin || isStaff) && (
                            <Link to="/admin"
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark/70 hover:bg-teal/6 hover:text-navy transition-colors">
                              <LayoutDashboard size={16} className="text-dark/40" strokeWidth={1.8} />
                              Admin Tools
                            </Link>
                          )}
                          {isDonor && !isAdmin && !isStaff && (
                            <Link to="/donor"
                              onClick={() => setProfileOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark/70 hover:bg-teal/6 hover:text-navy transition-colors">
                              <Heart size={16} className="text-dark/40" strokeWidth={1.8} />
                              Donor Portal
                            </Link>
                          )}
                        </div>
                        <div className="border-t border-dark/8 py-1.5">
                          <button onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                            <LogOut size={16} strokeWidth={1.8} />
                            Log Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <Link to="/login" className="btn-primary text-sm px-4 py-2">
                  Login
                </Link>
              )}
            </div>

            {/* Mobile hamburger */}
            <button className="md:hidden p-2 rounded-lg text-navy"
              onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-navy/10 px-4 py-4 flex flex-col gap-4">
            {navLinks.map(link => (
              link.href.startsWith('/#') ? (
                <a key={link.label} href={link.href}
                  className="text-sm font-medium text-dark/70 hover:text-navy"
                  onClick={() => setMobileOpen(false)}>
                  {link.label}
                </a>
              ) : (
                <Link key={link.label} to={link.href}
                  className="text-sm font-medium text-dark/70 hover:text-navy"
                  onClick={() => setMobileOpen(false)}>
                  {link.label}
                </Link>
              )
            ))}
            {isLoggedIn ? (
              <>
                <Link to={portalHref}
                  className="btn-primary text-sm text-center"
                  onClick={() => setMobileOpen(false)}>
                  {portalLabel}
                </Link>
                <Link to={myAccountHref}
                  className="text-sm font-medium text-dark/70 hover:text-navy"
                  onClick={() => setMobileOpen(false)}>
                  My Account
                </Link>
                <button onClick={() => { handleLogout(); setMobileOpen(false); }}
                  className="text-sm font-medium text-red-500 text-left">
                  Log Out
                </button>
              </>
            ) : (
              <Link to="/login" className="btn-primary text-sm text-center"
                onClick={() => setMobileOpen(false)}>
                Login
              </Link>
            )}
          </div>
        )}
      </nav>

      <div className="pt-16">
        {children}
      </div>

      {/* Footer */}
      <footer className="bg-navy text-white/70 py-10 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <Link to="/">
              <AnchorLogo size="sm" variant="light" />
            </Link>
            <p className="text-sm text-center font-sans italic text-white/50">
              "We have this hope as an anchor for the soul, firm and secure." — Hebrews 6:19
            </p>
            <div className="flex flex-wrap justify-center gap-5 text-sm">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
              <button onClick={() => { resetConsent(); }}
                className="hover:text-white transition-colors">
                Cookie Settings
              </button>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-white/10 text-center text-xs text-white/30">
            © {new Date().getFullYear()} SureAnchor. All rights reserved. Protecting and restoring young women.
          </div>
        </div>
      </footer>
    </div>
  );
}