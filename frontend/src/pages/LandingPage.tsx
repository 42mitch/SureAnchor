import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Heart, Users, ArrowRight, Anchor, Star, ChevronDown } from 'lucide-react';
import PublicLayout from '../layouts/PublicLayout';
import { apiFetch } from '../api';

interface PublicImpactDto {
  stats: {
    currentlyInCare: number;
    totalServed: number;
    reintegrationSuccessRate: number;
    activeSafehouses: number;
  };
}

const pillars = [
  {
    icon: Shield,
    title: 'Protect',
    color: 'bg-navy',
    desc: 'We provide immediate refuge and safety for young women rescued from abuse and exploitation — a secure environment where healing can begin.',
    highlight: 'Emergency shelter, legal advocacy, medical care',
  },
  {
    icon: Heart,
    title: 'Rehabilitate',
    color: 'bg-teal',
    desc: 'Trauma-informed therapy, counseling, and wellbeing programs help each young woman rediscover her worth, strength, and identity.',
    highlight: 'Therapy, psychosocial support, arts & wellness',
  },
  {
    icon: Users,
    title: 'Reintegrate',
    color: 'bg-gold',
    desc: 'Through education, vocational training, and family restoration, we walk alongside each survivor as she rebuilds her life with dignity and hope.',
    highlight: 'Education, skills training, family reunification',
  },
];

export default function LandingPage() {
  const [impact, setImpact] = useState<PublicImpactDto | null>(null);

  useEffect(() => {
    apiFetch('/api/public/impact')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setImpact(data); })
      .catch(() => {}); // fail silently — page still renders with fallback dashes
  }, []);

  const stats = [
    {
      value: impact ? String(impact.stats.currentlyInCare) : '—',
      label: 'Girls Currently in Safe Homes',
      icon: Shield,
    },
    {
      value: impact ? String(impact.stats.totalServed) : '—',
      label: 'Girls Served Since Founding',
      icon: Users,
    },
    {
      value: impact ? `${impact.stats.reintegrationSuccessRate}%` : '—',
      label: 'Reintegration Success Rate',
      icon: Heart,
    },
    {
      value: impact ? String(impact.stats.activeSafehouses) : '—',
      label: 'Active Safe Houses',
      icon: Anchor,
    },
  ];

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-gradient-to-br from-navy via-navy-light to-teal-dark">
        <div className="absolute top-20 right-10 w-80 h-80 rounded-full bg-teal/10 blur-3xl" />
        <div className="absolute bottom-10 left-0 w-96 h-96 rounded-full bg-gold/8 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-4 py-2 rounded-full mb-8 border border-white/15 backdrop-blur-sm">
              <Star size={12} className="text-gold" fill="currentColor" />
              Serving survivors since 2016 · Philippines
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
              An anchor for
              <span className="block text-gold italic">the soul.</span>
            </h1>

            <p className="text-lg sm:text-xl text-white/70 leading-relaxed mb-4 max-w-2xl font-sans font-light">
              SureAnchor provides safe homes, healing, and hope for young women who are survivors of sexual abuse and sex trafficking.
            </p>
            <p className="text-sm text-white/40 italic mb-10 font-sans">
              "We have this hope as an anchor for the soul, firm and secure." — Hebrews 6:19
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#impact" className="btn-gold inline-flex items-center justify-center gap-2 text-base">
                Learn About Our Impact
                <ArrowRight size={18} />
              </a>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-all duration-200 text-base"
              >
                Support Our Mission
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 animate-bounce">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <ChevronDown size={16} />
        </div>
      </section>

      {/* Mission pillars */}
      <section id="mission" className="py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-teal text-sm font-semibold uppercase tracking-widest mb-3">Our Approach</p>
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-navy mb-4">
              Protect. Rehabilitate. Reintegrate.
            </h2>
            <p className="text-dark/60 max-w-xl mx-auto text-lg font-light">
              Every young woman deserves safety, healing, and a future. Our three-pillar approach walks with survivors every step of the way.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pillars.map(({ icon: Icon, title, color, desc, highlight }) => (
              <div key={title} className="bg-white rounded-3xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden group">
                <div className={`${color} p-8`}>
                  <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mb-4">
                    <Icon size={26} className="text-white" strokeWidth={1.8} />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-white">{title}</h3>
                </div>
                <div className="p-8">
                  <p className="text-dark/70 leading-relaxed mb-5">{desc}</p>
                  <div className="text-xs font-semibold text-teal uppercase tracking-wide bg-teal/8 rounded-lg px-3 py-2">
                    {highlight}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact stats */}
      <section id="impact" className="py-24 bg-navy">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-3">Impact</p>
            <h2 className="font-display text-4xl font-bold text-white mb-4">
              Every number is a life restored
            </h2>
            <p className="text-white/50 max-w-md mx-auto font-light">
              We measure success not just in statistics, but in dignity reclaimed and futures renewed.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map(({ value, label, icon: Icon }) => (
              <div key={label} className="bg-white/8 backdrop-blur rounded-2xl p-6 text-center border border-white/10 hover:bg-white/12 transition-all">
                <div className="w-12 h-12 rounded-xl bg-teal/20 flex items-center justify-center mx-auto mb-4">
                  <Icon size={22} className="text-teal-light" strokeWidth={1.8} />
                </div>
                <div className="font-display text-4xl font-bold text-gold mb-2">{value}</div>
                <div className="text-white/60 text-sm font-light leading-snug">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/impact" className="inline-flex items-center gap-2 text-gold hover:text-gold-light font-semibold transition-colors">
              See the full impact dashboard
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Success story */}
      <section className="py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-card p-10 lg:p-14 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal via-gold to-navy" />
            <div className="w-16 h-16 rounded-full bg-teal/10 flex items-center justify-center mx-auto mb-6">
              <Heart size={28} className="text-teal" strokeWidth={1.5} />
            </div>
            <p className="font-display text-xl sm:text-2xl text-navy italic leading-relaxed mb-6">
              "I came in broken, not knowing if I could ever feel safe again. SureAnchor gave me a home, sisters, and a reason to believe in tomorrow."
            </p>
            <div className="text-dark/40 text-sm font-medium">
              — Anonymous Survivor, Now Enrolled in College · Class of 2025
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-teal-dark to-teal">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
            Be an anchor for someone today
          </h2>
          <p className="text-white/70 text-lg mb-8 font-light">
            Your support provides safety, healing, and a future for young women who need it most.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="btn-gold text-base inline-flex items-center justify-center gap-2"
            >
              Support Our Mission
              <ArrowRight size={18} />
            </Link>
            <Link
              to="/impact"
              className="inline-flex items-center justify-center gap-2 border-2 border-white/40 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/10 transition-all text-base"
            >
              View Impact Report
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}