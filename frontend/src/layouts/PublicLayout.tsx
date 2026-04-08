import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import AnchorLogo from '../components/AnchorLogo';
import { resetConsent } from '../components/CookieConsent';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: 'Our Mission', href: '/#mission' },
    { label: 'Our Impact', href: '/impact' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <div className="min-h-screen bg-cream font-sans">
      {/* Top Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-navy/8 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/">
              <AnchorLogo size="md" variant="dark" />
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map(link => (
                link.href.startsWith('/#') ? (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-sm font-medium text-dark/70 hover:text-navy transition-colors"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="text-sm font-medium text-dark/70 hover:text-navy transition-colors"
                  >
                    {link.label}
                  </Link>
                )
              ))}
              <Link to="/login" className="btn-primary text-sm px-4 py-2">
                Login
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-navy"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-navy/10 px-4 py-4 flex flex-col gap-4">
            {navLinks.map(link => (
              link.href.startsWith('/#') ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-dark/70 hover:text-navy"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-sm font-medium text-dark/70 hover:text-navy"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              )
            ))}
            <Link
              to="/login"
              className="btn-primary text-sm text-center"
              onClick={() => setMobileOpen(false)}
            >
              Login
            </Link>
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
            <AnchorLogo size="sm" variant="light" />
            <p className="text-sm text-center font-sans italic text-white/50">
              "We have this hope as an anchor for the soul, firm and secure." — Hebrews 6:19
            </p>
            <div className="flex flex-wrap justify-center gap-5 text-sm">
              <Link to="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link to="/contact" className="hover:text-white transition-colors">
                Contact
              </Link>
              <button
                onClick={() => { resetConsent(); }}
                className="hover:text-white transition-colors"
              >
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