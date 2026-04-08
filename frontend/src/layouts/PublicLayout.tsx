import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import AnchorLogo from '../components/AnchorLogo';
import { resetConsent } from '../components/CookieConsent';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PRIVACY_POLICY = `Privacy Policy — SureAnchor

Last updated: January 2026

1. Information We Collect
We collect information you voluntarily provide when creating an account, making a donation, or contacting us. This includes your name, email address, and payment information processed securely through our payment partners.

2. How We Use Your Information
Your information is used solely to process donations, communicate with you about your support, and improve our services. We do not sell or share your personal data with third parties for marketing purposes.

3. Resident Privacy
The identities and personal details of all residents in our care are strictly confidential. No identifying information about any resident is disclosed publicly under any circumstances.

4. Data Security
We use industry-standard encryption and security practices to protect your data. Our systems are hosted on Microsoft Azure with enterprise-grade security controls.

5. Your Rights
You may request access to, correction of, or deletion of your personal data at any time by contacting us at hello@sureanchor.org.

6. Cookies
We use essential cookies only to maintain your login session. We do not use tracking or advertising cookies.

7. Contact
For any privacy-related questions, contact us at hello@sureanchor.org or write to us at our Quezon City office.`;

const DATA_PROTECTION_POLICY = `Data Protection Policy — SureAnchor

Last updated: January 2026

1. Our Commitment
SureAnchor is committed to protecting the personal data of all users, donors, staff, and especially the vulnerable individuals in our care, in accordance with applicable Philippine data protection laws including the Data Privacy Act of 2012 (Republic Act No. 10173).

2. Data Controller
SureAnchor serves as the Data Controller for all personal information collected through this platform.

3. Lawful Basis for Processing
We process personal data on the following lawful bases: consent (for donors and supporters), contractual necessity (for staff accounts), and legitimate interest (for organizational operations).

4. Data Retention
Donor records are retained for seven years for financial compliance purposes. Staff records are retained for the duration of employment plus five years. Resident data is maintained in strict accordance with DSWD guidelines and relevant court orders.

5. Data Transfers
All data is stored within Microsoft Azure's Southeast Asia region. No data is transferred outside of this region without appropriate safeguards.

6. Breach Notification
In the event of a data breach affecting your personal information, we will notify you within 72 hours of becoming aware of the breach, in accordance with NPC requirements.

7. Your Rights Under RA 10173
You have the right to be informed, to access your data, to correct inaccuracies, to object to processing, to erasure or blocking, and to lodge a complaint with the National Privacy Commission.

8. Data Protection Officer
To reach our Data Protection Officer, email dpo@sureanchor.org.`;

function PolicyModal({
  title,
  content,
  onClose,
}: {
  title: string;
  content: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-dark/8">
          <h2 className="font-display text-lg font-bold text-navy">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-dark/8 flex items-center justify-center hover:bg-dark/15 transition-colors"
          >
            <X size={16} className="text-dark/60" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5 flex-1">
          <pre className="text-xs text-dark/60 whitespace-pre-wrap leading-relaxed font-sans">
            {content}
          </pre>
        </div>
        <div className="px-6 py-4 border-t border-dark/8">
          <button
            onClick={onClose}
            className="w-full bg-navy text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-navy-light transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'privacy' | 'data' | null>(null);

  const navLinks = [
    { label: 'Our Mission', href: '/#mission' },
    { label: 'Our Impact', href: '/impact' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <div className="min-h-screen bg-cream font-sans">
      {/* Policy modals */}
      {activeModal === 'privacy' && (
        <PolicyModal
          title="Privacy Policy"
          content={PRIVACY_POLICY}
          onClose={() => setActiveModal(null)}
        />
      )}
      {activeModal === 'data' && (
        <PolicyModal
          title="Data Protection Policy"
          content={DATA_PROTECTION_POLICY}
          onClose={() => setActiveModal(null)}
        />
      )}

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
                link.href.startsWith('/') ? (
                  <Link
                    key={link.label}
                    to={link.href}
                    className="text-sm font-medium text-dark/70 hover:text-navy transition-colors"
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-sm font-medium text-dark/70 hover:text-navy transition-colors"
                  >
                    {link.label}
                  </a>
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
              link.href.startsWith('/') ? (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-sm font-medium text-dark/70 hover:text-navy"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium text-dark/70 hover:text-navy"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
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
              <button
                onClick={() => setActiveModal('data')}
                className="hover:text-white transition-colors"
              >
                Data Protection
              </button>
              <button
                onClick={() => { resetConsent(); }}
                className="hover:text-white transition-colors"
              >
                Cookie Settings
              </button>
              <a href="mailto:hello@sureanchor.org" className="hover:text-white transition-colors">
                Contact
              </a>
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