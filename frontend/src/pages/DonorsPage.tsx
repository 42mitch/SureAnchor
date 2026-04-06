import { HeartHandshake, Users, Sparkles } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import AdminLayout from '../layouts/AdminLayout';
import { donors } from '../data/mockData';

const typeBadge = (type: string) => {
  const map: Record<string, string> = {
    'Monetary Donor': 'bg-gold/15 text-yellow-700',
    'Volunteer': 'bg-teal/10 text-teal-dark',
    'In-Kind': 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[type] || 'bg-gray-100 text-gray-600'}`}>
      {type}
    </span>
  );
};

const Sparkline = ({ data }: { data: number[] }) => {
  const chartData = data.map((v, i) => ({ v, i }));
  const max = Math.max(...data);
  if (max === 0) return <span className="text-xs text-dark/30 italic">Volunteer</span>;
  return (
    <ResponsiveContainer width={80} height={32}>
      <LineChart data={chartData}>
        <Line type="monotone" dataKey="v" stroke="#2D8F8A" strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default function DonorsPage() {
  return (
    <AdminLayout>
      <div className="space-y-5 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">Donors & Contributions</h1>
          <p className="text-dark/50 text-sm mt-1">Supporters and partner organizations</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Users, label: 'Total Donors', value: '142', color: 'text-navy', bg: 'bg-navy/8' },
            { icon: Sparkles, label: 'Active This Month', value: '38', color: 'text-teal', bg: 'bg-teal/10' },
            { icon: HeartHandshake, label: 'Total Donated This Year', value: '₱1.2M', color: 'text-gold', bg: 'bg-gold/10' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="card flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon size={22} className={color} strokeWidth={1.8} />
              </div>
              <div>
                <div className={`font-display text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-sm text-dark/55 font-medium">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark/8 bg-cream/70">
                  {['Name', 'Type', 'Status', 'Total Contributed', 'Last Donation', 'Trend'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-dark/40 uppercase tracking-wide px-5 py-3.5 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {donors.map((donor, i) => (
                  <tr
                    key={donor.id}
                    className={`border-b border-dark/5 hover:bg-teal/3 transition-colors last:border-0 ${i % 2 === 0 ? '' : 'bg-cream/30'}`}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-navy/8 flex items-center justify-center text-navy text-xs font-bold flex-shrink-0">
                          {donor.name.charAt(0)}
                        </div>
                        <span className="text-sm font-semibold text-dark">{donor.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">{typeBadge(donor.type)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${donor.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {donor.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {donor.total > 0
                        ? <span className="text-sm font-semibold text-navy">₱{donor.total.toLocaleString()}</span>
                        : <span className="text-sm text-dark/30 italic">In-kind / Volunteer</span>
                      }
                    </td>
                    <td className="px-5 py-3.5 text-sm text-dark/60">{donor.lastDonation}</td>
                    <td className="px-5 py-3.5">
                      <Sparkline data={donor.trend} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
