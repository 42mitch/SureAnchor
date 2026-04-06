import { Link } from 'react-router-dom';
import {
  Users, HeartHandshake, CalendarClock, Home,
  UserPlus, Heart, FileText, Calendar, TrendingUp
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import AdminLayout from '../layouts/AdminLayout';
import { activityFeed, riskDistribution } from '../data/mockData';

const metricCards = [
  { label: 'Active Residents', value: '47', icon: Users, color: 'bg-teal/10 text-teal', trend: '+2 this month' },
  { label: 'Donations This Month', value: '₱284,500', icon: HeartHandshake, color: 'bg-gold/10 text-gold', trend: '+12% vs last month' },
  { label: 'Upcoming Conferences', value: '3', icon: CalendarClock, color: 'bg-navy/10 text-navy', trend: 'Next: July 22' },
  { label: 'Active Safehouses', value: '8', icon: Home, color: 'bg-teal/10 text-teal', trend: '4 locations' },
];

const quickLinks = [
  { label: 'Caseload Inventory', href: '/admin/caseload', icon: Users, desc: '47 active residents' },
  { label: 'Process Recording', href: '/admin/process-recording', icon: FileText, desc: '8 recent session notes' },
  { label: 'Home Visitations', href: '/admin/visitations', icon: Home, desc: '2 pending follow-ups' },
  { label: 'Donors', href: '/admin/donors', icon: HeartHandshake, desc: '38 active this month' },
  { label: 'Reports', href: '/admin/reports', icon: TrendingUp, desc: 'July analytics ready' },
];

const activityIcons: Record<string, any> = {
  'user-plus': UserPlus,
  'heart': Heart,
  'file-text': FileText,
  'calendar': Calendar,
  'home': Home,
};

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">Good morning, Admin</h1>
          <p className="text-dark/50 text-sm mt-1">Sunday, July 21, 2024 · SureAnchor Operations Overview</p>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {metricCards.map(({ label, value, icon: Icon, color, trend }) => (
            <div key={label} className="card hover:shadow-card-hover transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon size={20} strokeWidth={1.8} />
                </div>
              </div>
              <div className="font-display text-2xl lg:text-3xl font-bold text-navy mb-1">{value}</div>
              <div className="text-sm text-dark/60 font-medium mb-2">{label}</div>
              <div className="text-xs text-teal font-semibold">{trend}</div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Activity feed */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-semibold text-navy">Recent Activity</h2>
              <span className="text-xs text-dark/40 font-medium">Live feed</span>
            </div>
            <div className="space-y-4">
              {activityFeed.map(({ id, time, icon, text, sub }) => {
                const Icon = activityIcons[icon] || FileText;
                return (
                  <div key={id} className="flex gap-4 items-start group">
                    <div className="w-9 h-9 rounded-xl bg-navy/6 flex items-center justify-center flex-shrink-0 group-hover:bg-teal/10 transition-colors">
                      <Icon size={16} className="text-navy/50 group-hover:text-teal transition-colors" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-dark">{text}</p>
                      <p className="text-xs text-dark/50 mt-0.5 truncate">{sub}</p>
                    </div>
                    <span className="text-xs text-dark/30 flex-shrink-0 pt-0.5">{time}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Risk donut */}
          <div className="card">
            <h2 className="font-display text-lg font-semibold text-navy mb-1">Risk Overview</h2>
            <p className="text-xs text-dark/40 mb-4">Current resident distribution</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} residents`, n]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 mt-2">
              {riskDistribution.map(item => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-dark/60 text-xs font-medium">{item.name}</span>
                  </div>
                  <span className="font-semibold text-dark text-xs">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="card">
          <h2 className="font-display text-lg font-semibold text-navy mb-4">Quick Navigation</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {quickLinks.map(({ label, href, icon: Icon, desc }) => (
              <Link
                key={href}
                to={href}
                className="flex flex-col items-center text-center gap-2.5 p-4 rounded-2xl bg-cream hover:bg-navy hover:text-white group transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-white group-hover:bg-white/15 flex items-center justify-center shadow-sm transition-colors">
                  <Icon size={18} className="text-navy group-hover:text-white transition-colors" strokeWidth={1.8} />
                </div>
                <span className="text-xs font-semibold leading-tight">{label}</span>
                <span className="text-xs text-dark/40 group-hover:text-white/60 transition-colors leading-tight">{desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
