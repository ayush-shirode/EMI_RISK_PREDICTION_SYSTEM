'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Printer, Brain, BarChart3,
  ShieldAlert, Zap,
} from 'lucide-react';

import { useCustomer } from '@/context/CustomerContext';
import { CUSTOMERS } from '@/lib/customers';
import { computeShap } from '@/lib/shap';
import { AlertTimeline } from '@/components/AlertTimeline';
import { ShapWaterfallChart } from '@/components/ShapWaterfallChart';
import { FeatureDetailTable } from '@/components/FeatureDetailTable';
import { ModelMetaCard } from '@/components/ModelMetaCard';
import { AiReasoningCard } from '@/components/AiReasoningCard';

import styles from './prediction.module.css';

/* ---------- severity helpers ---------- */
const SEV_TEXT: Record<string, string> = {
  critical: '#f87171', high: '#fb923c', medium: '#fbbf24', low: '#34d399',
};
const SEV_BG: Record<string, string> = {
  critical: 'rgba(127,29,29,0.3)', high: 'rgba(124,45,18,0.3)',
  medium:   'rgba(113,63,18,0.3)', low:  'rgba(20,83,45,0.3)',
};

function getMissProbColor(p: number) {
  if (p >= 0.7) return '#f87171';
  if (p >= 0.4) return '#fb923c';
  if (p >= 0.2) return '#fbbf24';
  return '#34d399';
}

/* ---------- inner page content (uses hooks that need Suspense) ---------- */
function PredictionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { selectedCustomer, setSelectedCustomer, allCustomers } = useCustomer();

  // resolve customer from query param, fallback to context
  const paramId = searchParams.get('customerId');
  const customer = useMemo(() => {
    if (paramId) return CUSTOMERS.find(c => c.id === paramId) ?? selectedCustomer;
    return selectedCustomer;
  }, [paramId, selectedCustomer]);

  const shap = useMemo(() => computeShap(customer), [customer]);

  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  // savings coverage
  const savingsCoverage = Math.min(100, Math.round((customer.assessedSavings / customer.emiAmount) * 100));
  const savingsColor = savingsCoverage >= 100 ? '#34d399' : savingsCoverage >= 60 ? '#fbbf24' : '#f87171';

  const missPercent = Math.round(customer.missProbability * 100);
  const missColor = getMissProbColor(customer.missProbability);
  const sevColor = SEV_TEXT[customer.severity] ?? '#34d399';
  const sevBg = SEV_BG[customer.severity] ?? 'rgba(20,83,45,0.3)';

  const handleCustomerChange = (id: string) => {
    const found = allCustomers.find(c => c.id === id);
    if (found) {
      setSelectedCustomer(found);
      router.replace(`/prediction?customerId=${id}`);
    }
  };

  const predMeta = new Date(customer.lastPredictionAt).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });

  return (
    <div id="printable" className={styles.page}>

      {/* ===== PAGE HEADER ===== */}
      <div className={`${styles.pageHeader} no-print`}>
        <div className={styles.headerRow}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>

          <div>
            <h1 className={styles.headerTitle}>
              AI Prediction Explainability — {customer.name}
            </h1>
            <p className={styles.headerMeta}>
              Prediction generated on: {predMeta} · Model: Mistral 7B · Context: 90-day window
            </p>
          </div>

          <div className={styles.headerActions}>
            <select
              value={customer.id}
              onChange={e => handleCustomerChange(e.target.value)}
              className={styles.headerCustomerSelect}
            >
              {allCustomers.map(c => (
                <option key={c.id} value={c.id}>{c.name} — {c.city}</option>
              ))}
            </select>

            <button className={styles.printBtn} onClick={() => window.print()}>
              <Printer size={13} /> Download PDF
            </button>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <main className={styles.main}>

        {/* ===== ZONE 2: STAT CARDS ===== */}
        <div className={styles.statRow}>

          {/* Card 1 — Miss Probability */}
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Miss Probability</span>
            <span className={styles.statValue} style={{ color: missColor }}>
              {missPercent}%
            </span>
            <span className={styles.statSub}>
              Likelihood of EMI miss this cycle
            </span>
          </div>

          {/* Card 2 — Risk Score */}
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Risk Score</span>
            <span className={styles.statValue} style={{ color: sevColor }}>
              {shap.finalScore}
              <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 400 }}>/100</span>
            </span>
            <span className={styles.statSub} style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: sevBg, color: sevColor,
              padding: '2px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '10px',
              textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              {customer.severity}
            </span>
            <div>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                Model confidence: {shap.modelConfidence}%
              </p>
              <div className={styles.confBar}>
                <div className={styles.confFill} style={{ width: `${shap.modelConfidence}%` }} />
              </div>
            </div>
          </div>

          {/* Card 3 — EMI Context */}
          <div className={styles.statCard}>
            <span className={styles.statLabel}>EMI Context</span>
            <span className={styles.statValue} style={{ fontSize: '20px', color: 'var(--text-primary)' }}>
              ₹{customer.emiAmount.toLocaleString('en-IN')}
            </span>
            <span className={styles.statSub}>
              Due on the {customer.emiDueDate}th · Savings: ₹{customer.assessedSavings.toLocaleString('en-IN')}
            </span>
            <div>
              <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px' }}>
                Savings coverage: {savingsCoverage}%
              </p>
              <div className={styles.savingsBar}>
                <div
                  className={styles.savingsFill}
                  style={{ width: `${savingsCoverage}%`, background: savingsColor }}
                />
              </div>
            </div>
          </div>

          {/* Card 4 — Prediction Delta */}
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Prediction Delta</span>
            <span
              className={styles.statValue}
              style={{ fontSize: '22px', color: shap.finalScore > customer.riskScore ? '#f87171' : '#34d399' }}
            >
              {shap.finalScore > customer.riskScore ? '↑' : '↓'}{' '}
              {Math.abs(shap.finalScore - customer.riskScore)} pts
            </span>
            <span className={styles.statSub}>
              vs last score ({customer.riskScore}) · {new Date(customer.lastPredictionAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>

        {/* ===== ZONE 3: MAIN TWO-COLUMN GRID ===== */}
        <div className={styles.contentGrid}>

          {/* LEFT — SHAP Waterfall Chart */}
          <div className={styles.sectionCard}>
            <h2 className={styles.sectionTitle}>
              <BarChart3 size={15} className="text-cyan-400" style={{ color: '#22d3ee' }} />
              SHAP Waterfall — Feature Contributions
            </h2>
            <ShapWaterfallChart
              features={shap.features}
              baselineScore={shap.baselineScore}
              finalScore={shap.finalScore}
              severity={customer.severity}
              activeFeature={activeFeature}
              onFeatureHover={setActiveFeature}
            />
          </div>

          {/* RIGHT — Detail Table + Meta + Reasoning */}
          <div className={styles.rightCol}>

            {/* Feature Detail Table */}
            <div className={styles.sectionCard}>
              <h2 className={styles.sectionTitle}>
                <Zap size={15} style={{ color: '#fbbf24' }} />
                Feature Detail Table
              </h2>
              <FeatureDetailTable
                features={shap.features}
                activeFeature={activeFeature}
                onFeatureClick={setActiveFeature}
              />
            </div>

            {/* Model Metadata */}
            <ModelMetaCard shap={shap} />

            {/* AI Reasoning */}
            <AiReasoningCard shap={shap} customer={customer} />
          </div>
        </div>

        {/* ===== ZONE 4: ALERT TIMELINE ===== */}
        <div className={styles.timelineSection}>
          <h2 className={styles.sectionTitle} style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={15} style={{ color: '#60a5fa' }} />
            Historical Prediction Log — {customer.name}
          </h2>
          <AlertTimeline history={[]} />
        </div>

      </main>
    </div>
  );
}

/* ---------- page export with Suspense (needed for useSearchParams in App Router) ---------- */
export default function PredictionPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#0d1117', color: '#8b949e',
        fontSize: '14px', gap: '10px',
      }}>
        <div style={{
          width: '20px', height: '20px', border: '3px solid #1d9e7544',
          borderTopColor: '#1d9e75', borderRadius: '50%', animation: 'spin 0.8s linear infinite',
        }} />
        Loading analysis…
      </div>
    }>
      <PredictionContent />
    </Suspense>
  );
}
