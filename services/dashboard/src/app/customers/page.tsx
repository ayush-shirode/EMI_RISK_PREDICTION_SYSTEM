'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { useCustomer } from '@/context/CustomerContext';
import { CUSTOMERS, Customer, getSeverityColor } from '@/lib/customers';
import { ExternalLink, ChevronUp, ChevronDown } from 'lucide-react';

type SortKey = 'name' | 'riskScore' | 'creditScore' | 'emiAmount';
type SortDir = 'asc' | 'desc';

function SeverityBadge({ severity }: { severity: string }) {
  const styles: Record<string, string> = {
    critical: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  };
  return (
    <span className={`text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded border uppercase ${styles[severity] ?? styles.low}`}>
      {severity}
    </span>
  );
}

function RiskBar({ score, severity }: { score: number; severity: string }) {
  const color = getSeverityColor(severity);
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 bg-[#1f293d] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-mono text-gray-300">{score}</span>
    </div>
  );
}

export default function CustomersPage() {
  const { setSelectedCustomer } = useCustomer();
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>('riskScore');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = [...CUSTOMERS].sort((a, b) => {
    const va = a[sortKey] as number | string;
    const vb = b[sortKey] as number | string;
    const cmp = typeof va === 'number' && typeof vb === 'number'
      ? va - vb
      : String(va).localeCompare(String(vb));
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />
      : null;

  // Summary stats
  const criticalHigh = CUSTOMERS.filter(c => c.severity === 'critical' || c.severity === 'high').length;
  const avgRisk = Math.round(CUSTOMERS.reduce((a, c) => a + c.riskScore, 0) / CUSTOMERS.length);
  const today = new Date();
  const dueThisWeek = CUSTOMERS.filter(c => {
    const day = parseInt(c.emiDueDate);
    const due = new Date(today.getFullYear(), today.getMonth(), day);
    if (due < today) due.setMonth(due.getMonth() + 1);
    return (due.getTime() - today.getTime()) / 86400000 <= 7;
  }).length;

  return (
    <div className="min-h-screen bg-darkBg text-gray-100 flex flex-col">
      <Header />
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">

        {/* Page Title */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Customer Registry</h2>
            <p className="text-sm text-gray-400 mt-0.5">All monitored borrower profiles with live risk signals</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Customers', value: '5', color: 'cyan' },
            { label: 'Critical / High Risk', value: String(criticalHigh), color: 'red' },
            { label: 'Avg Risk Score', value: String(avgRisk), color: 'orange' },
            { label: 'EMIs Due This Week', value: String(dueThisWeek), color: 'yellow' },
          ].map(({ label, value, color }) => (
            <div key={label} className="glass-panel p-5">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{label}</p>
              <p className={`text-3xl font-black font-mono mt-1 ${
                color === 'cyan' ? 'text-cyan-400' :
                color === 'red' ? 'text-rose-400' :
                color === 'orange' ? 'text-orange-400' : 'text-yellow-400'
              }`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Customer Table */}
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f293d] text-[10px] uppercase tracking-widest text-gray-500">
                  <th className="px-5 py-3.5 text-left">#</th>
                  <th className="px-5 py-3.5 text-left cursor-pointer hover:text-gray-300" onClick={() => handleSort('name')}>
                    <span className="flex items-center gap-1">Customer <SortIcon k="name" /></span>
                  </th>
                  <th className="px-5 py-3.5 text-left">City</th>
                  <th className="px-5 py-3.5 text-left">Loan Type</th>
                  <th className="px-5 py-3.5 text-right cursor-pointer hover:text-gray-300" onClick={() => handleSort('emiAmount')}>
                    <span className="flex items-center justify-end gap-1">EMI Amount <SortIcon k="emiAmount" /></span>
                  </th>
                  <th className="px-5 py-3.5 text-center">EMI Due</th>
                  <th className="px-5 py-3.5 text-right cursor-pointer hover:text-gray-300" onClick={() => handleSort('creditScore')}>
                    <span className="flex items-center justify-end gap-1">Credit Score <SortIcon k="creditScore" /></span>
                  </th>
                  <th className="px-5 py-3.5 text-left cursor-pointer hover:text-gray-300" onClick={() => handleSort('riskScore')}>
                    <span className="flex items-center gap-1">Risk Score <SortIcon k="riskScore" /></span>
                  </th>
                  <th className="px-5 py-3.5 text-center">Severity</th>
                  <th className="px-5 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c, idx) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className="border-b border-[#1f293d]/50 hover:bg-[#1a2133]/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-4 text-gray-500 font-mono text-xs">{String(idx + 1).padStart(2, '0')}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0"
                          style={{ backgroundColor: getSeverityColor(c.severity) + '30', border: `1.5px solid ${getSeverityColor(c.severity)}50` }}
                        >
                          <span style={{ color: getSeverityColor(c.severity) }}>
                            {c.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-100">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-400">{c.city}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold bg-[#1f293d] px-2.5 py-1 rounded capitalize">
                        {c.loanType}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-mono font-semibold text-gray-200">
                      ₹{c.emiAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-4 text-center text-gray-400 font-mono text-xs">
                      {c.emiDueDate}{['st','nd','rd'][parseInt(c.emiDueDate)-1] ?? 'th'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`font-mono font-bold ${c.creditScore >= 700 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                        {c.creditScore}
                      </span>
                      <span className="text-[10px] text-gray-500 ml-1">{c.creditScore >= 700 ? '↑' : '↓'}</span>
                    </td>
                    <td className="px-5 py-4">
                      <RiskBar score={c.riskScore} severity={c.severity} />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <SeverityBadge severity={c.severity} />
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Link
                        href={`/customer/${c.id}`}
                        onClick={(e) => { e.stopPropagation(); setSelectedCustomer(c); }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/60 px-3 py-1.5 rounded-lg transition-all"
                      >
                        <ExternalLink size={11} />
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
