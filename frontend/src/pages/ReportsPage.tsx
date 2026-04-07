import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingUp, Award } from 'lucide-react';
import AdminLayout from '../layouts/AdminLayout';
import { donationTrend, residentOutcomes, safehousePerformance } from '../data/mockData';
import { useListPagination } from '../hooks/useListPagination';
import ListPaginationBar from '../components/ListPaginationBar';

const CustomTooltipPeso = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white rounded-xl shadow-card px-4 py-3 border border-dark/8">
        <p className="text-xs text-dark/50 mb-1">{label}</p>
        <p className="text-sm font-semibold text-navy">₱{Number(payload[0].value).toLocaleString()}</p>
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const shPag = useListPagination(safehousePerformance, []);

  return (
    <AdminLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">Reports & Analytics</h1>
          <p className="text-dark/50 text-sm mt-1">July 2024 · Comprehensive program performance overview</p>
        </div>

        {/* Reintegration success stat */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: 'Reintegration Success Rate', value: '89%', sub: '+3% vs last year', color: 'text-teal', bg: 'from-teal to-teal-dark' },
            { label: 'Avg. Health Score', value: '75.5', sub: 'Across all safe houses', color: 'text-navy', bg: 'from-navy to-navy-light' },
            { label: 'Avg. Education Progress', value: '71.75%', sub: 'Curriculum completion rate', color: 'text-gold', bg: 'from-yellow-600 to-gold' },
          ].map(({ label, value, sub, bg }) => (
            <div key={label} className={`rounded-2xl bg-gradient-to-br ${bg} text-white p-6`}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <Award size={18} className="text-white" strokeWidth={1.8} />
                </div>
              </div>
              <div className="font-display text-4xl font-bold mb-1">{value}</div>
              <div className="font-medium text-sm mb-1">{label}</div>
              <div className="text-white/60 text-xs">{sub}</div>
            </div>
          ))}
        </div>

        {/* Donation trend */}
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <TrendingUp size={20} className="text-gold" />
            <div>
              <h2 className="font-display text-xl font-semibold text-navy">Donation Trends (12 Months)</h2>
              <p className="text-dark/45 text-sm">Monthly contributions in Philippine Pesos</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={donationTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<CustomTooltipPeso />} />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#D4A843"
                strokeWidth={2.5}
                dot={{ fill: '#D4A843', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Resident outcomes charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-display text-lg font-semibold text-navy mb-1">Health Scores by Safehouse</h2>
            <p className="text-dark/45 text-sm mb-5">Average score out of 100</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={residentOutcomes} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="safehouse" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="health" name="Health Score" fill="#2D8F8A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="font-display text-lg font-semibold text-navy mb-1">Education Progress by Safehouse</h2>
            <p className="text-dark/45 text-sm mb-5">Average curriculum completion %</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={residentOutcomes} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="safehouse" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="education" name="Education Progress" fill="#1B3A5C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Safehouse performance table */}
        <div className="card overflow-hidden p-0">
          <div className="px-6 py-5 border-b border-dark/8">
            <h2 className="font-display text-xl font-semibold text-navy">Safehouse Performance Comparison</h2>
            <p className="text-dark/45 text-sm mt-1">July 2024 snapshot</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-cream/70 border-b border-dark/8">
                  {['Safehouse', 'Active Residents', 'Avg Health Score', 'Avg Education Progress', 'Incidents This Month'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-dark/40 uppercase tracking-wide px-5 py-3.5 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shPag.pageItems.map((sh, i) => (
                  <tr key={sh.name} className={`border-b border-dark/5 last:border-0 ${(shPag.startIndex + i) % 2 === 0 ? '' : 'bg-cream/30'}`}>
                    <td className="px-5 py-4 font-semibold text-sm text-navy">{sh.name}</td>
                    <td className="px-5 py-4 text-sm text-dark/70">{sh.residents}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-dark/8 rounded-full h-1.5">
                          <div className="bg-teal h-1.5 rounded-full" style={{ width: `${sh.healthScore}%` }} />
                        </div>
                        <span className="text-sm font-semibold text-dark">{sh.healthScore}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-dark/8 rounded-full h-1.5">
                          <div className="bg-navy h-1.5 rounded-full" style={{ width: `${sh.educationProgress}%` }} />
                        </div>
                        <span className="text-sm font-semibold text-dark">{sh.educationProgress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${sh.incidents === 0 ? 'bg-green-100 text-green-700' : sh.incidents === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {sh.incidents} {sh.incidents === 1 ? 'incident' : 'incidents'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ListPaginationBar
            page={shPag.page}
            pageCount={shPag.pageCount}
            pageSize={shPag.pageSize}
            setPage={shPag.setPage}
            setPageSize={shPag.setPageSize}
            total={shPag.total}
            startIndex={shPag.startIndex}
            endIndex={shPag.endIndex}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
