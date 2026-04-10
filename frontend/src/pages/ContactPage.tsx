import { useState } from 'react';
import { Mail, MapPin, Heart, Send, CheckCircle } from 'lucide-react';
import PublicLayout from '../layouts/PublicLayout';
import { apiFetch } from '../api';
import { useAuth } from '../context/AuthContext';

const TOPICS = [
  'General Inquiry',
  'Donation Questions',
  'Partnership Opportunities',
  'Volunteer',
  'Media & Press',
  'Other',
];

export default function ContactPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', email: user?.email ?? '', topic: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await apiFetch('/api/contact-messages', {
      method: 'POST',
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        topic: form.topic || null,
        message: form.message,
      }),
    });

    if (res.ok) {
      setSuccess(true);
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? 'Something went wrong. Please try again.');
    }
    setLoading(false);
  }

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="font-display text-4xl font-bold text-navy mb-4">Get in Touch</h1>
          <p className="text-dark/60 text-lg max-w-xl mx-auto">
            Whether you have questions, want to partner with us, or simply want to learn more —
            we'd love to hear from you.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Contact info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <h3 className="font-display text-lg font-bold text-navy mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-teal/10 flex items-center justify-center flex-shrink-0">
                    <Mail size={16} className="text-teal" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-dark/40 uppercase tracking-wide mb-0.5">Email</p>
                    <a href="mailto:sureanchor.admin@gmail.com"
                      className="text-sm text-navy font-medium hover:text-teal transition-colors">
                      sureanchor.admin@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center flex-shrink-0">
                    <MapPin size={16} className="text-gold" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-dark/40 uppercase tracking-wide mb-0.5">Location</p>
                    <p className="text-sm text-dark/70">Philippines</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-navy/8 flex items-center justify-center flex-shrink-0">
                    <Heart size={16} className="text-navy" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-dark/40 uppercase tracking-wide mb-0.5">Mission</p>
                    <p className="text-sm text-dark/70">Protecting and restoring young women</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-navy text-white">
              <p className="font-display text-lg font-bold mb-2">Want to donate?</p>
              <p className="text-white/60 text-sm leading-relaxed mb-4">
                Your support provides safety, healing, and hope for young women who need it most.
              </p>
              <a href="/donor" className="inline-flex items-center gap-2 bg-gold text-navy font-semibold px-4 py-2 rounded-xl text-sm hover:bg-gold/90 transition-colors">
                <Heart size={14} /> Support Our Mission
              </a>
            </div>
          </div>

          {/* Contact form */}
          <div className="lg:col-span-3">
            <div className="card">
              {success ? (
                <div className="text-center py-8">
                  <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                  <h3 className="font-display text-xl font-bold text-navy mb-2">Message Sent!</h3>
                  <p className="text-dark/50 text-sm mb-6">
                    Thank you for reaching out. We'll get back to you as soon as possible.
                  </p>
                  <button onClick={() => { setSuccess(false); setForm({ name: '', email: '', topic: '', message: '' }); }}
                    className="btn-primary text-sm">
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h3 className="font-display text-xl font-bold text-navy mb-2">Send us a Message</h3>

                  {error && (
                    <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Name *</label>
                      <input type="text" required value={form.name}
                        onChange={e => set('name', e.target.value)}
                        placeholder="Maria Santos"
                        className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Email *</label>
                      <input type="email" required value={form.email}
                        onChange={e => set('email', e.target.value)}
                        placeholder="you@email.com"
                        className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Topic</label>
                    <select value={form.topic} onChange={e => set('topic', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30">
                      <option value="">Select a topic…</option>
                      {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-dark/50 uppercase tracking-widest mb-2">Message *</label>
                    <textarea required value={form.message}
                      onChange={e => set('message', e.target.value)}
                      rows={5} placeholder="Tell us how we can help…"
                      className="w-full px-3 py-2.5 rounded-xl border border-dark/12 bg-cream text-sm focus:outline-none focus:ring-2 focus:ring-teal/30 placeholder-dark/25 resize-none" />
                  </div>

                  <button type="submit" disabled={loading}
                    className="btn-primary text-sm flex items-center gap-2 disabled:opacity-60">
                    <Send size={15} />
                    {loading ? 'Sending…' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}