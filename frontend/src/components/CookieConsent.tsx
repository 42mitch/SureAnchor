/**
 * CookieConsent — GDPR cookie consent banner.
 *
 * Functional behaviour:
 *  - "Accept All"   → stores { necessary: true, analytics: true }  in localStorage
 *  - "Necessary Only" → stores { necessary: true, analytics: false } in localStorage
 *  - Banner is suppressed once either choice is made (persists across sessions).
 *  - "Cookie Settings" link in the footer clears the stored preference and
 *    re-shows the banner (handled by exposing resetConsent() via CustomEvent).
 *
 * What this controls:
 *  - The banner itself is fully functional — preferences are stored and respected.
 *  - Analytics cookie blocking is COSMETIC in this build: no third-party analytics
 *    library is currently loaded, so the analytics flag has no live effect yet.
 *    When an analytics provider is added, it should read window.__cookieConsent
 *    before initialising.
 *  - Strictly necessary cookies (session auth, CSRF) are always set by the
 *    backend regardless of this banner, as permitted by GDPR Recital 25.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, X, ShieldCheck } from 'lucide-react';

const STORAGE_KEY = 'sa_cookie_consent';

export interface ConsentPrefs {
  necessary: boolean;
  analytics: boolean;
  decidedAt: string;
}

export function getConsent(): ConsentPrefs | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ConsentPrefs) : null;
  } catch {
    return null;
  }
}

function saveConsent(analytics: boolean): ConsentPrefs {
  const prefs: ConsentPrefs = {
    necessary: true,
    analytics,
    decidedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  // Expose on window so any future analytics lib can read it
  (window as any).__cookieConsent = prefs;
  return prefs;
}

export function resetConsent() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('sa:resetCookieConsent'));
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Show banner if no decision has been made yet
    if (!getConsent()) setVisible(true);

    // Re-show if user clicks "Cookie Settings" in the footer
    const handler = () => setVisible(true);
    window.addEventListener('sa:resetCookieConsent', handler);
    return () => window.removeEventListener('sa:resetCookieConsent', handler);
  }, []);

  if (!visible) return null;

  function accept() {
    saveConsent(true);
    setVisible(false);
  }

  function necessaryOnly() {
    saveConsent(false);
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6 flex justify-center"
    >
      {/* Backdrop blur strip */}
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-dark/10 overflow-hidden">
        {/* Coloured top stripe */}
        <div className="h-1 bg-gradient-to-r from-navy via-teal to-gold" />

        <div className="px-5 py-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-navy/8 flex items-center justify-center flex-shrink-0">
              <Cookie size={20} className="text-navy" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-navy">We value your privacy</h2>
              <p className="text-sm text-dark/60 mt-0.5 leading-relaxed">
                We use cookies to keep you securely logged in. With your consent we also use
                analytics cookies to understand how visitors use our site — no personal profiles
                are built and no data is sold.{' '}
                <Link to="/privacy#5" className="text-teal font-semibold hover:underline">
                  Learn more
                </Link>
              </p>
            </div>
          </div>

          {/* Expandable detail */}
          {showDetails && (
            <div className="mb-4 rounded-xl bg-cream/80 border border-dark/8 divide-y divide-dark/6 text-sm overflow-hidden">
              <div className="px-4 py-3 flex items-start gap-3">
                <ShieldCheck size={15} className="text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-dark">Strictly Necessary — Always On</p>
                  <p className="text-dark/55 text-xs mt-0.5">
                    Session authentication and CSRF security tokens. Required to log in and use
                    the platform. Cannot be disabled.
                  </p>
                </div>
              </div>
              <div className="px-4 py-3 flex items-start gap-3">
                <Cookie size={15} className="text-teal mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-dark">Analytics — Optional</p>
                  <p className="text-dark/55 text-xs mt-0.5">
                    Aggregated, anonymised data about page visits. Helps us improve the site.
                    No third-party ad networks. No cross-site tracking.
                    <br />
                    <em className="text-dark/40">
                      Note: analytics are not currently active in this build. This preference will
                      apply when an analytics provider is added.
                    </em>
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={accept}
              className="flex items-center gap-1.5 bg-navy text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-navy-light transition-colors shadow-sm"
            >
              Accept All
            </button>
            <button
              onClick={necessaryOnly}
              className="flex items-center gap-1.5 border-2 border-dark/15 text-dark/70 font-semibold text-sm px-5 py-2.5 rounded-xl hover:border-navy hover:text-navy transition-colors"
            >
              Necessary Only
            </button>
            <button
              onClick={() => setShowDetails(d => !d)}
              className="text-sm text-teal font-medium hover:underline ml-auto"
            >
              {showDetails ? 'Hide details' : 'Show details'}
            </button>
            <button
              onClick={necessaryOnly}
              aria-label="Dismiss — necessary only"
              className="p-1.5 rounded-lg text-dark/30 hover:text-dark/60 hover:bg-dark/6 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
