'use client';
import { useState } from 'react';
import { Header } from '@/components/Header';
import { CUSTOMERS, getSeverityColor } from '@/lib/customers';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { ChevronUp, ChevronDown, ArrowRight } from 'lucide-react';

const CUSTOMER_COLORS: Record<string, string> = {
  'cust-001': '#6366f1',
  'cust-002': '#22c55e',
  'cust-003': '#f97316',
  'cust-004': '#ef4444',
  'cust-005': '#3b82f6',
};

type CompSortKey = 'name' | 'avgSpend' | 'currentSpend' | 'emiPct' | 'riskScore';
type SortDir = 'asc' | 'desc';

export default function ComparisonPage() {
  const [sortKey, setSortKey] = useState<CompSortKey>('riskScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Build chart data — merge all 6 months across customers
  const months = CUSTOMERS[0].spendTrend.map(t => t.month);
  const chartData = months.map((month, i) => {
    const row: Record<string, any> = { month };
    CUSTOMERS.forEach(c => {
      row[c.name] = c.spendTrend[i]?.amount ?? 0;
    });
    return row;
  });

  // Table data with derived stats
  const tableData = CUSTOMERS.map(c => {
    const amounts = c.spendTrend.map(t => t.amount);
    const avgSpend = Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length);
    const currentSpend = amounts[amounts.length - 1];
    const prevSpend = amounts[amounts.length - 2];
    const vsPrev = prevSpend ? ((currentSpend - prevSpend) / prevSpend) * 100 : 0;
    const emiPct = Math.round((c.emiAmount / c.monthlyIncome) * 100);
    return { ...c, avgSpend, currentSpend, vsPrev, emiPct };
  });

  const sorted = [...tableData].sort((a, b) => {
    const va = a[sortKey] as number | string;
    const vb = b[sortKey] as number | string;
    const cmp = typeof va === 'number' && typeof vb === 'number'
      ? va - vb : String(va).localeCompare(String(vb));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const handleSort = (key: CompSortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ k }: { k: CompSortKey }) =>
    sortKey === k
      ? sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />
      : null;

  const riskRanked = [...CUSTOMERS].sort((a, b) => b.riskScore - a.riskScore);

  return (
    <div className="min-h-screen bg-darkBg text-gray-100 flex flex-col">
      <Header />
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">

        <div>
          <h2 className="text-2xl font-bold text-white">Portfolio Comparison</h2>
          <p className="text-sm text-gray-400 mt-0.5">Side-by-side spend trends and risk analysis across all borrowers</p>
        </div>

        {/* Multi-line spend chart */}
        <div className="glass-panel p-6">
          <h3 className="text-sm font-bold tracking-wider text-gray-400 uppercase mb-2">6-Month Spend Trajectory — All Customers</h3>
          <p className="text-xs text-gray-500 mb-6">Hover to compare monthly outflows across all 5 borrower profiles</p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#131926', borderColor: '#1f293d', borderRadius: '12px', color: '#f3f4f6' }}
                  formatter={(v: number, name: string) => [`₹${v.toLocaleString('en-IN')}`, name]}
                />
                <Legend
                  wrapperStyle={{ paddingTop: '16px', fontSize: '12px', color: '#94a3b8' }}
                />
                {CUSTOMERS.map(c => (
                  <Line
                    key={c.id}
                    type="monotone"
                    dataKey={c.name}
                    stroke={CUSTOMER_COLORS[c.id]}
                    strokeWidth={2}
                    dot={{ r: 3, stroke: CUSTOMER_COLORS[c.id], fill: '#0c101b', strokeWidth: 2 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="glass-panel overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1f293d]">
            <h3 className="text-sm font-bold tracking-wider text-gray-400 uppercase">Spend & EMI Analysis</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f293d] text-[10px] uppercase tracking-widest text-gray-500">
                  <th className="px-5 py-3 text-left cursor-pointer hover:text-gray-300" onClick={() => handleSort('name')}>
                    <span className="flex items-center gap-1">Customer <SortIcon k="name" /></span>
                  </th>
                  <th className="px-5 py-3 text-right cursor-pointer hover:text-gray-300" onClick={() => handleSort('avgSpend')}>
                    <span className="flex items-center justify-end gap-1">Avg Monthly Spend <SortIcon k="avgSpend" /></span>
                  </th>
                  <th className="px-5 py-3 text-right cursor-pointer hover:text-gray-300" onClick={() => handleSort('currentSpend')}>
                    <span className="flex items-center justify-end gap-1">Current Month <SortIcon k="currentSpend" /></span>
                  </th>
                  <th className="px-5 py-3 text-center">vs Last Month</th>
                  <th className="px-5 py-3 text-right">EMI</th>
                  <th className="px-5 py-3 text-left cursor-pointer hover:text-gray-300" onClick={() => handleSort('emiPct')}>
                    <span className="flex items-center gap-1">EMI % of Income <SortIcon k="emiPct" /></span>
                  </th>
                  <th className="px-5 py-3 text-center cursor-pointer hover:text-gray-300" onClick={() => handleSort('riskScore')}>
                    <span className="flex items-center justify-center gap-1">Risk <SortIcon k="riskScore" /></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(c => {
                  const color = CUSTOMER_COLORS[c.id];
                  const vsPrevColor = c.vsPrev > 10 ? 'text-rose-400' : c.vsPrev < -5 ? 'text-emerald-400' : 'text-gray-400';
                  const vsPrevArrow = c.vsPrev > 10 ? '↑' : c.vsPrev < -5 ? '↓' : '→';
                  return (
                    <tr key={c.id} className="border-b border-[#1f293d]/50 hover:bg-[#1a2133]/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                          <span className="font-semibold text-gray-100">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-gray-300">₹{c.avgSpend.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4 text-right font-mono text-gray-200 font-semibold">₹{c.currentSpend.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4 text-center">
                        <span className={`font-semibold ${vsPrevColor}`}>
                          {vsPrevArrow} {Math.abs(c.vsPrev).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-mono text-gray-300">₹{c.emiAmount.toLocaleString('en-IN')}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-[#1f293d] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(c.emiPct, 100)}%`,
                                backgroundColor: c.emiPct > 40 ? '#ef4444' : '#22c55e'
                              }}
                            />
                          </div>
                          <span className={`text-xs font-mono ${c.emiPct > 40 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {c.emiPct}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="font-mono font-bold" style={{ color: getSeverityColor(c.severity) }}>
                          {c.riskScore}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk Ranking Card */}
        <div className="glass-panel p-6">
          <h3 className="text-sm font-bold tracking-wider text-gray-400 uppercase mb-4">Risk Ranking — Current Period</h3>
          <div className="space-y-2">
            {riskRanked.map((c, i) => {
              const color = getSeverityColor(c.severity);
              const badgeStyles: Record<string, string> = {
                critical: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
                high: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
                medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
                low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
              };
              return (
                <div key={c.id} className="flex items-center gap-4 p-3.5 rounded-xl bg-[#1a2133]/50 border border-[#1f293d]">
                  <span className="text-xl font-black font-mono text-gray-600 w-6 text-center">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
                    style={{ backgroundColor: color + '20', color, border: `1.5px solid ${color}40` }}>
                    {c.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-100">{c.name}</p>
                    <p className="text-xs text-gray-500">{c.city}</p>
                  </div>
                  <div className="w-32 h-2 bg-[#1f293d] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${c.riskScore}%`, backgroundColor: color }} />
                  </div>
                  <span className="font-mono font-bold text-sm w-8 text-right" style={{ color }}>{c.riskScore}</span>
                  <span className={`text-[10px] font-black tracking-widest px-2 py-0.5 rounded border uppercase ${badgeStyles[c.severity]}`}>
                    {c.severity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}
