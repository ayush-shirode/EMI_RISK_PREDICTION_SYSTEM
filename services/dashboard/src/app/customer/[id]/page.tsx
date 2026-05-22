'use client';
import { useState, useRef } from 'react';
import { notFound } from 'next/navigation';
import { Header } from '@/components/Header';
import { RiskGauge } from '@/components/RiskGauge';
import { SpendTrendChart } from '@/components/SpendTrendChart';
import { SuggestionCards } from '@/components/SuggestionCards';
import { useCustomer } from '@/context/CustomerContext';
import { CUSTOMERS, getSeverityColor } from '@/lib/customers';
import { FileText, Mail, Phone, MapPin, Briefcase, TrendingUp, Calendar, DollarSign, ShieldCheck } from 'lucide-react';

function InfoRow({ label, value, icon: Icon }: { label: string; value: string; icon?: React.FC<any> }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[#1f293d]/50 last:border-none">
      {Icon && <Icon size={14} className="text-gray-500 mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-sm text-gray-100 font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

function CreditRing({ score }: { score: number }) {
  const pct = Math.min(Math.max(score, 300), 900);
  const norm = (pct - 300) / 600;
  const color = norm > 0.7 ? '#22c55e' : norm > 0.45 ? '#eab308' : '#ef4444';
  const circumference = Math.PI * 60;
  const dash = norm * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="150" height="85" viewBox="0 0 150 85">
        <path d="M 15 75 A 60 60 0 0 1 135 75" fill="none" stroke="#1b2438" strokeWidth="10" strokeLinecap="round" />
        <path d="M 15 75 A 60 60 0 0 1 135 75" fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
        <text x="75" y="72" textAnchor="middle" fontSize="28" fontWeight="900" fill={color}>{score}</text>
        <text x="75" y="83" textAnchor="middle" fontSize="8" fontWeight="700" fill="#94a3b8">CREDIT SCORE</text>
      </svg>
      <span className="text-xs font-semibold" style={{ color }}>
        {score >= 750 ? 'Excellent' : score >= 650 ? 'Good' : 'Fair'}
      </span>
    </div>
  );
}

export default function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = CUSTOMERS.find(c => c.id === params.id);
  const { setSelectedCustomer } = useCustomer();
  const [showReport, setShowReport] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  if (!customer) return notFound();

  // Auto-select this customer in global context
  const handleSetCustomer = () => setSelectedCustomer(customer);

  const color = getSeverityColor(customer.severity);

  // Computed data
  const emiPct = Math.min(100, (customer.assessedSavings / customer.emiAmount) * 100);
  const today = new Date();
  const emiDay = parseInt(customer.emiDueDate);
  let dueDate = new Date(today.getFullYear(), today.getMonth(), emiDay);
  if (dueDate < today) dueDate = new Date(today.getFullYear(), today.getMonth() + 1, emiDay);
  const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / 86400000);

  const loanStartMs = new Date(customer.loanStartDate).getTime();
  const monthsElapsed = Math.floor((today.getTime() - loanStartMs) / (30.44 * 86400000));
  const monthsRemaining = Math.max(0, customer.loanTenureMonths - monthsElapsed);

  const handlePrint = () => {
    const el = reportRef.current;
    if (!el) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><title>Vigilance AI — Report: ${customer.name}</title>
      <style>
        body { font-family: Georgia, serif; color: #111; padding: 40px; max-width: 800px; margin: auto; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        .sub { color: #666; font-size: 13px; margin-bottom: 24px; }
        .brand { color: #1d4ed8; font-weight: 900; letter-spacing: 1px; }
        table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        th { background: #f3f4f6; text-align: left; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
        td { padding: 8px 12px; font-size: 13px; border-bottom: 1px solid #e5e7eb; }
        .badge { display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }
        .low { background: #dcfce7; color: #166534; }
        .medium { background: #fef9c3; color: #854d0e; }
        .high { background: #ffedd5; color: #9a3412; }
        .critical { background: #fee2e2; color: #991b1b; }
        .suggestion { padding: 10px; border-left: 3px solid #1d4ed8; margin: 8px 0; background: #eff6ff; font-size: 13px; }
        hr { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <p class="brand">VIGILANCE AI — EARLY WARNING CREDIT RISK SYSTEM</p>
      <h1>${customer.name}</h1>
      <p class="sub">Generated: ${new Date().toLocaleString('en-IN')} &nbsp;|&nbsp; Profile: ${customer.id}</p>
      <hr/>
      <table>
        <tr><th colspan="2">Customer Information</th></tr>
        <tr><td>Email</td><td>${customer.email}</td></tr>
        <tr><td>Phone</td><td>${customer.phone}</td></tr>
        <tr><td>City</td><td>${customer.city}</td></tr>
        <tr><td>Account Type</td><td>${customer.accountType}</td></tr>
        <tr><td>Monthly Income</td><td>₹${customer.monthlyIncome.toLocaleString('en-IN')}</td></tr>
      </table>
      <table>
        <tr><th colspan="2">Loan Details</th></tr>
        <tr><td>Loan Type</td><td>${customer.loanType}</td></tr>
        <tr><td>EMI Amount</td><td>₹${customer.emiAmount.toLocaleString('en-IN')}</td></tr>
        <tr><td>EMI Due Date</td><td>${customer.emiDueDate}th of every month</td></tr>
        <tr><td>Loan Tenure</td><td>${customer.loanTenureMonths} months</td></tr>
        <tr><td>Start Date</td><td>${customer.loanStartDate}</td></tr>
        <tr><td>Months Remaining</td><td>${monthsRemaining}</td></tr>
      </table>
      <table>
        <tr><th colspan="2">Risk Summary</th></tr>
        <tr><td>Risk Score</td><td>${customer.riskScore}/100</td></tr>
        <tr><td>Miss Probability</td><td>${(customer.missProbability * 100).toFixed(0)}%</td></tr>
        <tr><td>Severity</td><td><span class="badge ${customer.severity}">${customer.severity}</span></td></tr>
        <tr><td>Credit Score</td><td>${customer.creditScore}</td></tr>
        <tr><td>Assessed Savings</td><td>₹${customer.assessedSavings.toLocaleString('en-IN')}</td></tr>
      </table>
      <table>
        <tr><th>Month</th><th>Spend Amount</th></tr>
        ${customer.spendTrend.map(t => `<tr><td>${t.month}</td><td>₹${t.amount.toLocaleString('en-IN')}</td></tr>`).join('')}
      </table>
      <hr/>
      <h3>AI Recommendations</h3>
      ${customer.suggestions.map(s => `<div class="suggestion">${s}</div>`).join('')}
      </body></html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 500);
  };

  return (
    <div className="min-h-screen bg-darkBg text-gray-100 flex flex-col" onClick={handleSetCustomer}>
      <Header />
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black"
              style={{ backgroundColor: color + '20', border: `2px solid ${color}40`, color }}
            >
              {customer.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{customer.name}</h2>
              <p className="text-sm text-gray-400">{customer.city} · {customer.accountType} · {customer.loanType} loan</p>
            </div>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:from-blue-700 hover:to-cyan-600 transition-all"
          >
            <FileText size={15} />
            Generate Report
          </button>
        </div>

        {/* 3-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: Profile + Loan details */}
          <div className="space-y-4">
            <div className="glass-panel p-5 space-y-0">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Contact & Profile</h3>
              <InfoRow label="Email" value={customer.email} icon={Mail} />
              <InfoRow label="Phone" value={customer.phone} icon={Phone} />
              <InfoRow label="City" value={customer.city} icon={MapPin} />
              <InfoRow label="Account Type" value={customer.accountType} icon={Briefcase} />
              <InfoRow label="Monthly Income" value={`₹${customer.monthlyIncome.toLocaleString('en-IN')}`} icon={DollarSign} />
            </div>

            <div className="glass-panel p-5 space-y-0">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Loan Details</h3>
              <InfoRow label="Loan Type" value={customer.loanType.toUpperCase()} />
              <InfoRow label="EMI Amount" value={`₹${customer.emiAmount.toLocaleString('en-IN')} / month`} />
              <InfoRow label="Due Day" value={`${customer.emiDueDate}th of each month`} icon={Calendar} />
              <InfoRow label="Loan Tenure" value={`${customer.loanTenureMonths} months`} />
              <InfoRow label="Started" value={customer.loanStartDate} />
              <InfoRow label="Months Remaining" value={`${monthsRemaining} months`} />
            </div>

            <div className="glass-panel p-5 flex flex-col items-center">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 self-start">Credit Health</h3>
              <CreditRing score={customer.creditScore} />
            </div>
          </div>

          {/* CENTRE: Risk metrics */}
          <div className="space-y-4">
            <RiskGauge score={customer.riskScore} severity={customer.severity} />

            <div className="glass-panel p-5 space-y-4">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Miss Probability</h3>
              <div className="text-center">
                <p className="text-5xl font-black font-mono" style={{ color }}>
                  {(customer.missProbability * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  {customer.missProbability >= 0.7 ? 'Very likely to miss EMI this cycle' :
                   customer.missProbability >= 0.4 ? 'Moderate risk of EMI miss' :
                   'Low risk — buffer is adequate'}
                </p>
              </div>
            </div>

            <div className="glass-panel p-5 space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Savings vs EMI</h3>
              <div className="flex justify-between text-xs text-gray-400">
                <span>₹{customer.assessedSavings.toLocaleString('en-IN')} saved</span>
                <span>₹{customer.emiAmount.toLocaleString('en-IN')} needed</span>
              </div>
              <div className="h-3 bg-[#1f293d] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(emiPct, 100)}%`, backgroundColor: color }}
                />
              </div>
              <p className="text-xs text-gray-500 text-right">{emiPct.toFixed(0)}% of EMI covered</p>
            </div>

            <div className="glass-panel p-5 text-center">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">EMI Countdown</h3>
              <p className="text-4xl font-black font-mono" style={{ color: daysUntil <= 3 ? '#ef4444' : daysUntil <= 7 ? '#f97316' : '#22c55e' }}>
                {daysUntil}
              </p>
              <p className="text-sm text-gray-400 mt-1">days until EMI due ({dueDate.toLocaleDateString('en-IN')})</p>
            </div>
          </div>

          {/* RIGHT: Spend chart + suggestions */}
          <div className="space-y-4">
            <SpendTrendChart data={customer.spendTrend} emiAmount={customer.emiAmount} />
            <SuggestionCards suggestions={customer.suggestions} severity={customer.severity} />
          </div>

        </div>

      </main>
    </div>
  );
}
