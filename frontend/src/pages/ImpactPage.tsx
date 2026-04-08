import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight, TrendingUp, Users, Shield, Home, HeartHandshake, Quote } from 'lucide-react';
import PublicLayout from '../layouts/PublicLayout';
import { apiFetch } from '../api';

interface ImpactStats {
  currentlyInCare: number;
  totalServed: number;
  reintegrationSuccessRate: number;
  activeSafehouses: number;
  totalDonatedPhp: number;
}

interface ImpactData {
  stats: ImpactStats;
}

/** Illustrative anonymised quotes for the public impact page (not tied to real individuals). */
const RESIDENT_QUOTES: { quote: string; attribution: string }[] = [
  {
    quote:
      "I used to think I had no future. Now I'm studying to be a teacher. SureAnchor didn't just save me — they helped me find myself.",
    attribution: 'Resident, now enrolled in a 4-year Education degree',
  },
  {
    quote:
      'For the first time in years I felt safe enough to sleep through the night. The staff listened without judging — that changed everything.',
    attribution: 'Resident, 16',
  },
  {
    quote:
      "They helped my family understand what I went through. We're not perfect, but we're talking again, and I have hope.",
    attribution: 'Resident, family reunification program',
  },
  {
    quote:
      "I learned that what happened to me wasn't my fault. The counseling sessions gave me words for my feelings and tools to cope.",
    attribution: 'Resident, 15',
  },
  {
    quote:
      'The girls here became my sisters. We cried together, laughed together, and celebrated small wins. I\'m not alone anymore.',
    attribution: 'Resident, peer support group',
  },
  {
    quote:
      'I want to study social work someday so I can help someone the way people here helped me. That dream didn\'t exist before I came.',
    attribution: 'Resident, 17',
  },
  {
    quote:
      'Leaving the safe house was scary, but they planned every step with me — school, housing, someone to call. I still check in.',
    attribution: 'Alumna, reintegrated resident',
  },
  {
    quote:
      "I was ashamed to ask for help. Here nobody rushed me. When I was ready, they were still there.",
    attribution: 'Resident, 14',
  },
];

export default function ImpactPage() {
  const [data, setData] = useState<ImpactData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/public/impact')
      .then(r => (r.ok ? r.json() : null))
      .then((d: ImpactData | null) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  const s = data?.stats;

  return (
    <PublicLayout>
      <div className="bg-gradient-to-br from-navy via-navy-light to-teal-dark py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-3">Transparency & Impact</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">Our Impact</h1>
          <p className="text-white/60 max-w-xl text-lg font-light">
            Numbers tell part of the story — below, young women share in their own words what hope and healing can look like.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
          {[
            { icon: Shield, value: s?.currentlyInCare, label: 'Currently in Safe Homes', color: 'text-teal' },
            { icon: Users, value: s?.totalServed, label: 'Served Since Founding', color: 'text-navy' },
            {
              icon: TrendingUp,
              value: s ? `${s.reintegrationSuccessRate}%` : undefined,
              label: 'Reintegration Success',
              color: 'text-gold',
            },
            { icon: Home, value: s?.activeSafehouses, label: 'Active Safe Houses', color: 'text-teal' },
            {
              icon: HeartHandshake,
              value: s ? `₱${Math.round(s.totalDonatedPhp / 1000)}K` : undefined,
              label: 'Total Donated (PHP)',
              color: 'text-gold',
            },
          ].map(({ icon: Icon, value, label, color }) => (
            <div key={label} className="card flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-navy/5 flex items-center justify-center">
                <Icon size={22} className={color} strokeWidth={1.8} />
              </div>
              {loading || value === undefined ? (
                <div className="h-8 w-16 bg-dark/10 rounded-lg animate-pulse" />
              ) : (
                <div className={`font-display text-3xl font-bold ${color}`}>{value}</div>
              )}
              <div className="text-dark/60 text-sm leading-snug">{label}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-teal/10 text-teal mb-4">
              <Quote size={24} strokeWidth={1.8} />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-navy mb-2">Voices from our community</h2>
            <p className="text-dark/50 text-sm">
              These are representative examples of what residents and alumni have shared — names and details are omitted to protect privacy.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {RESIDENT_QUOTES.map((item, i) => (
              <div
                key={i}
                className="card border-l-4 border-gold flex flex-col justify-between bg-white hover:shadow-card-hover transition-shadow"
              >
                <p className="font-display text-lg italic text-navy leading-relaxed mb-4">&ldquo;{item.quote}&rdquo;</p>
                <p className="text-dark/45 text-sm">— {item.attribution}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card bg-gradient-to-br from-teal to-teal-dark text-white max-w-4xl mx-auto">
          <Heart size={28} className="text-white/80 mb-3" strokeWidth={1.5} />
          <h3 className="font-display text-2xl font-bold mb-3">Your donations make this possible</h3>
          <p className="text-white/75 text-sm leading-relaxed mb-6">
            ₱5,000 provides one month of counseling for a survivor. ₱15,000 covers educational materials for a safe house for a term. Every peso anchors a young woman&apos;s hope.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-white text-teal font-semibold px-5 py-2.5 rounded-lg hover:bg-gold hover:text-navy transition-all text-sm"
          >
            Support Our Mission
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </PublicLayout>
  );
}