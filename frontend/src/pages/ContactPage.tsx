import { Mail, MapPin, Heart, Phone } from 'lucide-react';
import PublicLayout from '../layouts/PublicLayout';

export default function ContactPage() {
  return (
    <PublicLayout>
      {/* Hero */}
      <div className="bg-gradient-to-br from-navy via-navy-light to-teal-dark py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-3">Get in Touch</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">Contact Us</h1>
          <p className="text-white/60 max-w-xl text-lg font-light">
            Whether you want to volunteer, donate, partner with us, or simply learn more —
            we'd love to hear from you.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12">

          {/* Contact info */}
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-2xl font-bold text-navy mb-4">Reach Out</h2>
              <p className="text-dark/60 leading-relaxed">
                SureAnchor is a faith-based organization serving survivors of sexual abuse and
                sex trafficking across the Philippines. If you have questions about our work,
                want to support a safehouse, or are interested in partnering with us, we're here.
              </p>
            </div>

            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center flex-shrink-0">
                  <Mail size={18} className="text-teal" strokeWidth={1.8} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-navy mb-0.5">Email</div>
                  <a
                    href="mailto:hello@sureanchor.org"
                    className="text-dark/60 text-sm hover:text-teal transition-colors"
                  >
                    hello@sureanchor.org
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center flex-shrink-0">
                  <Phone size={18} className="text-teal" strokeWidth={1.8} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-navy mb-0.5">Phone</div>
                  <p className="text-dark/60 text-sm">+63 (2) 8XXX-XXXX</p>
                  <p className="text-dark/40 text-xs mt-0.5">Monday–Friday, 9 AM–5 PM PHT</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center flex-shrink-0">
                  <MapPin size={18} className="text-teal" strokeWidth={1.8} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-navy mb-0.5">Headquarters</div>
                  <p className="text-dark/60 text-sm">Quezon City, Metro Manila</p>
                  <p className="text-dark/40 text-xs mt-0.5">Philippines</p>
                </div>
              </div>
            </div>

            {/* Safehouse note */}
            <div className="rounded-2xl bg-gold/10 border border-gold/20 p-5">
              <div className="flex items-start gap-3">
                <Heart size={16} className="text-gold mt-0.5 flex-shrink-0" strokeWidth={1.8} />
                <div>
                  <p className="text-sm font-semibold text-navy mb-1">Safehouse Locations are Confidential</p>
                  <p className="text-xs text-dark/50 leading-relaxed">
                    To protect the safety and privacy of our residents, we do not publicly
                    disclose the locations of our safehouses. Thank you for understanding.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="card">
            <h2 className="font-display text-xl font-bold text-navy mb-5">Send a Message</h2>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5">First Name</label>
                  <input
                    type="text"
                    placeholder="Maria"
                    className="w-full px-4 py-3 rounded-xl border border-dark/15 bg-cream focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal text-dark text-sm placeholder-dark/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-dark mb-1.5">Last Name</label>
                  <input
                    type="text"
                    placeholder="Santos"
                    className="w-full px-4 py-3 rounded-xl border border-dark/15 bg-cream focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal text-dark text-sm placeholder-dark/30 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-dark/15 bg-cream focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal text-dark text-sm placeholder-dark/30 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">I'm interested in…</label>
                <select className="w-full px-4 py-3 rounded-xl border border-dark/15 bg-cream focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal text-dark text-sm transition-all">
                  <option value="">Select a topic</option>
                  <option>Making a donation</option>
                  <option>Volunteering</option>
                  <option>Partnering with SureAnchor</option>
                  <option>Learning more about our work</option>
                  <option>Media or press inquiry</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-dark mb-1.5">Message</label>
                <textarea
                  rows={4}
                  placeholder="Tell us how we can help or how you'd like to get involved…"
                  className="w-full px-4 py-3 rounded-xl border border-dark/15 bg-cream focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal text-dark text-sm placeholder-dark/30 transition-all resize-none"
                />
              </div>

              <button className="w-full bg-navy text-white font-semibold py-3.5 rounded-xl hover:bg-navy-light transition-all duration-200 text-sm flex items-center justify-center gap-2">
                <Mail size={16} />
                Send Message
              </button>

              <p className="text-xs text-dark/30 text-center leading-relaxed">
                We typically respond within 2–3 business days.
                Your information is never shared with third parties.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}