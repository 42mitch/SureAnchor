import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Heart, ArrowRight, TrendingUp, Users, Shield, Home } from 'lucide-react';
import PublicLayout from '../layouts/PublicLayout';
import { monthlyServed, donationTrend, programBreakdown } from '../data/mockData';

const COLORS = { teal: '#2D8F8A', navy: '#1B3A5C', gold: '#D4A843' };

const CustomTooltipPeso = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white rounded-xl shadow-card-hover px-4 py-3 border border-navy/8">
        <p className="text-xs text-dark/50 mb-1">{label}</p>
        <p className="text-sm font-semibold text-navy">₱{Number(payload[0].value).toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

const CustomTooltipCount = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white rounded-xl shadow-card-hover px-4 py-3 border border-navy/8">
        <p className="text-xs text-dark/50 mb-1">{label}</p>
        <p className="text-sm font-semibold text-navy">{payload[0].value} residents</p>
      </div>
    );
  }
  return null;
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold" fontSize={12}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function ImpactPage() {
  return (
    <PublicLayout>
      {/* Hero banner */}
      <div className="bg-gradient-to-br from-navy via-navy-light to-teal-dark py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-gold text-sm font-semibold uppercase tracking-widest mb-3">Transparency & Impact</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">Our Impact Dashboard</h1>
          <p className="text-white/60 max-w-xl text-lg font-light">
            Every data point represents a life touched. Your donations make this possible — see exactly where your support goes.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { icon: Shield, value: '47', label: 'Currently in Safe Homes', color: 'text-teal' },
            { icon: Users, value: '312', label: 'Served Since Founding', color: 'text-navy' },
            { icon: TrendingUp, value: '89%', label: 'Reintegration Success', color: 'text-gold' },
            { icon: Home, value: '8', label: 'Active Safe Houses', color: 'text-teal' },
          ].map(({ icon: Icon, value, label, color }) => (
            <div key={label} className="card flex flex-col items-center text-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-navy/5 flex items-center justify-center`}>
                <Icon size={22} className={color} strokeWidth={1.8} />
              </div>
              <div className={`font-display text-3xl font-bold ${color}`}>{value}</div>
              <div className="text-dark/60 text-sm leading-snug">{label}</div>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Girls served bar chart */}
          <div className="card">
            <div className="mb-5">
              <h3 className="font-display text-xl font-semibold text-navy">Residents Served Monthly</h3>
              <p className="text-dark/50 text-sm mt-1">Rolling 12-month view — anonymized count</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyServed} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} domain={[30, 55]} />
                <Tooltip content={<CustomTooltipCount />} />
                <Bar dataKey="served" fill={COLORS.teal} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Donation trends line chart */}
          <div className="card">
            <div className="mb-5">
              <h3 className="font-display text-xl font-semibold text-navy">Donation Trends</h3>
              <p className="text-dark/50 text-sm mt-1">Monthly contributions — Philippine Pesos</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={donationTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}K`} />
                <Tooltip content={<CustomTooltipPeso />} />
                <Line type="monotone" dataKey="amount" stroke={COLORS.gold} strokeWidth={2.5}
                  dot={{ fill: COLORS.gold, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: COLORS.gold }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Program breakdown + success story */}
        <div className="grid md:grid-cols-5 gap-8">
          {/* Pie chart */}
          <div className="md:col-span-2 card">
            <div className="mb-5">
              <h3 className="font-display text-xl font-semibold text-navy">Program Allocation</h3>
              <p className="text-dark/50 text-sm mt-1">How your donations are used</p>
            </div>
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={programBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomLabel}
                    outerRadius={90}
                    dataKey="value"
                  >
                    {programBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {programBreakdown.map(item => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-medium text-dark/60">{item.name} ({item.value}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA card + story */}
          <div className="md:col-span-3 flex flex-col gap-6">
            <div className="card bg-gradient-to-br from-teal to-teal-dark text-white flex-1">
              <Heart size={28} className="text-white/80 mb-3" strokeWidth={1.5} />
              <h3 className="font-display text-2xl font-bold mb-3">Your donations make this possible</h3>
              <p className="text-white/75 text-sm leading-relaxed mb-6">
                ₱5,000 provides one month of counseling for a survivor. ₱15,000 covers educational materials for a safe house for a term. Every peso anchors a young woman's hope.
              </p>
              <a href="#" className="inline-flex items-center gap-2 bg-white text-teal font-semibold px-5 py-2.5 rounded-lg hover:bg-gold hover:text-navy transition-all text-sm">
                Support Our Mission
                <ArrowRight size={16} />
              </a>
            </div>

            <div className="card border-l-4 border-gold">
              <p className="font-display text-lg italic text-navy leading-relaxed mb-3">
                "I used to think I had no future. Now I'm studying to be a teacher. SureAnchor didn't just save me — they helped me find myself."
              </p>
              <p className="text-dark/40 text-sm">— Resident, now enrolled in a 4-year Education degree</p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
