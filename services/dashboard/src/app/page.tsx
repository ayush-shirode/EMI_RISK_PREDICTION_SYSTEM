'use client';
import { useState } from 'react';
import { Header } from '@/components/Header';
import { RiskGauge } from '@/components/RiskGauge';
import { SpendTrendChart } from '@/components/SpendTrendChart';
import { SuggestionCards } from '@/components/SuggestionCards';
import { AlertTimeline } from '@/components/AlertTimeline';
import { useRiskPolling } from '@/hooks/useRiskPolling';
import { useCustomer } from '@/context/CustomerContext';
import {
  DollarSign,
  AlertTriangle,
  Calendar,
  RefreshCw,
  Sliders,
  Play,
  Wallet
} from 'lucide-react';

export default function Dashboard() {
  const { selectedCustomer } = useCustomer();

  const [customEmi, setCustomEmi] = useState(String(selectedCustomer.emiAmount));
  const [customDate, setCustomDate] = useState('2026-06-01');

  const {
    prediction,
    trends,
    alerts,
    loading,
    triggering,
    error,
    refresh,
    trigger
  } = useRiskPolling(selectedCustomer.id, 30000);

  const handleTriggerPrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(customEmi);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;
    await trigger(parsedAmount, customDate);
  };

  const getSeverityRing = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]';
      case 'high': return 'border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.15)]';
      case 'medium': return 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.15)]';
      default: return 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]';
    }
  };

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-rose-500/10 text-rose-400 border border-rose-500/30';
      case 'high': return 'bg-orange-500/10 text-orange-400 border border-orange-500/30';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30';
      default: return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30';
    }
  };

  // Prefer live prediction data, fall back to seed customer data
  const activeSeverity = prediction?.severity ?? selectedCustomer.severity;
  const activeRiskScore = prediction?.risk_score ?? selectedCustomer.riskScore;
  const activeMissProb = prediction?.miss_probability ?? selectedCustomer.missProbability;
  const activeSavings = selectedCustomer.assessedSavings;
  const activeEmiAmount = prediction?.emi_amount ?? selectedCustomer.emiAmount;
  const activeEmiDueDate = prediction?.emi_due_date ?? `2026-06-${selectedCustomer.emiDueDate.padStart(2, '0')}`;
  const activeSuggestions = prediction?.suggestions?.length ? prediction.suggestions : selectedCustomer.suggestions;
  const activeSpendTrend = trends.length ? trends : selectedCustomer.spendTrend;

  return (
    <div className="min-h-screen bg-darkBg text-gray-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">

        {/* Top Info Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#101625]/60 border border-[#1f293d] rounded-2xl p-5 backdrop-blur-sm">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              {selectedCustomer.name} — Vigilance Analytics Terminal
            </h2>
            <p className="text-sm text-gray-400">
              {selectedCustomer.city} · {selectedCustomer.accountType.replace('-', ' ')} · {selectedCustomer.loanType} loan
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => refresh()}
              disabled={loading}
              className="flex items-center gap-2 bg-[#131926] border border-[#1f293d] hover:border-cyan-500/30 text-gray-200 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-cyan-400' : ''} />
              <span>Force Synchronise</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-950/40 border border-rose-800/40 text-rose-200 p-4 rounded-xl flex items-start gap-3.5 shadow-lg">
            <AlertTriangle className="text-rose-400 shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="text-sm font-bold">Platform Warning Indicator</h4>
              <p className="text-xs text-rose-300/80 mt-1 leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {loading && !prediction ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin"></div>
            <p className="text-xs text-gray-400 font-mono tracking-wider uppercase animate-pulse">Initializing Data Node...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* COLUMN 1: Risk gauge + interactive predictor */}
            <div className="space-y-6 lg:col-span-1">

              <RiskGauge score={activeRiskScore} severity={activeSeverity} />

              <div className="glass-panel p-6 relative overflow-hidden">
                <div className="absolute w-24 h-24 rounded-full bg-blue-600 blur-[80px] opacity-10 -bottom-8 -right-8 pointer-events-none" />

                <h3 className="text-sm font-bold tracking-wider text-gray-400 uppercase mb-4 flex items-center gap-2">
                  <Sliders size={16} className="text-cyan-400" />
                  <span>Interactive Predictor Config</span>
                </h3>

                <form onSubmit={handleTriggerPrediction} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                      Upcoming EMI Amount (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500 font-mono text-sm">₹</span>
                      <input
                        type="number"
                        value={customEmi}
                        onChange={(e) => setCustomEmi(e.target.value)}
                        placeholder={String(selectedCustomer.emiAmount)}
                        className="w-full bg-[#0c101b] border border-[#1f293d] rounded-xl pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                      EMI Due Date
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 text-gray-500" size={16} />
                      <input
                        type="date"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="w-full bg-[#0c101b] border border-[#1f293d] rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono transition-all"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={triggering}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold py-2.5 px-4 rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {triggering ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Invoking Ollama RAG...</span>
                      </>
                    ) : (
                      <>
                        <Play size={14} className="fill-current" />
                        <span>Evaluate Fresh EMI Risk</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Primary Diagnosis */}
              <div className={`p-5 rounded-2xl bg-[#131926]/50 border-2 ${getSeverityRing(activeSeverity)}`}>
                <h4 className="text-xs font-black tracking-widest text-gray-400 uppercase mb-2">Primary Diagnosis</h4>
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="text-lg">📈</span>
                  <span className="text-sm font-mono text-gray-200">
                    Miss Probability: <span className="font-bold text-white text-base">{(activeMissProb * 100).toFixed(0)}%</span>
                  </span>
                </div>
                {prediction && (
                  <p className="text-xs text-gray-400 leading-relaxed font-sans">{prediction.reasoning}</p>
                )}
              </div>
            </div>

            {/* COLUMN 2 & 3 */}
            <div className="lg:col-span-2 space-y-6">

              {/* Stat Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div className="glass-panel p-4 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Wallet size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Assessed Savings</span>
                    <span className="text-base font-bold font-mono text-white">₹{activeSavings.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="glass-panel p-4 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Stress Level</span>
                    <span className={`text-xs font-black px-2 py-0.5 rounded uppercase mt-0.5 inline-block ${getSeverityBadgeClass(activeSeverity)}`}>
                      {activeSeverity}
                    </span>
                  </div>
                </div>

                <div className="glass-panel p-4 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Upcoming Payment</span>
                    <span className="text-xs font-bold font-mono text-white mt-0.5 block">
                      ₹{activeEmiAmount.toLocaleString('en-IN')} — {activeEmiDueDate}
                    </span>
                  </div>
                </div>

              </div>

              <SpendTrendChart data={activeSpendTrend} emiAmount={activeEmiAmount} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SuggestionCards suggestions={activeSuggestions} severity={activeSeverity} />
                <AlertTimeline history={alerts} />
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}
