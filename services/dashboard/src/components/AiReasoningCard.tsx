'use client';
import { ShapResult, getShapSummary } from '@/lib/shap';
import { Customer } from '@/lib/customers';
import { Brain, TrendingUp, Shield, Lightbulb } from 'lucide-react';
import styles from '@/app/prediction/prediction.module.css';

interface Props {
  shap: ShapResult;
  customer: Customer;
}

export function AiReasoningCard({ shap, customer }: Props) {
  const summary = getShapSummary(shap, customer);
  const topDriver = shap.features.find(f => f.shapValue > 0);
  const topMitigator = shap.features.find(f => f.shapValue < 0);
  const topSuggestion = customer.suggestions[0];

  return (
    <div className={styles.reasoningCard}>
      <div className={styles.reasoningHeader}>
        <Brain size={16} style={{ color: '#22d3ee' }} />
        <h3 className={styles.reasoningTitle}>AI Reasoning</h3>
      </div>

      <p className={styles.reasoningSummary}>{summary}</p>

      <div className={styles.reasoningBlocks}>
        {topDriver && (
          <div className={`${styles.reasoningBlock} ${styles.reasoningBlockRisk}`}>
            <div className={styles.reasoningBlockHeader}>
              <TrendingUp size={13} />
              <span>Primary Risk Driver</span>
            </div>
            <p className={styles.reasoningBlockName}>{topDriver.featureName}</p>
            <p className={styles.reasoningBlockText}>{topDriver.explanation}</p>
          </div>
        )}

        {topMitigator && (
          <div className={`${styles.reasoningBlock} ${styles.reasoningBlockSafe}`}>
            <div className={styles.reasoningBlockHeader}>
              <Shield size={13} />
              <span>Mitigating Factor</span>
            </div>
            <p className={styles.reasoningBlockName}>{topMitigator.featureName} — {topMitigator.rawValue}</p>
            <p className={styles.reasoningBlockText}>{topMitigator.explanation}</p>
          </div>
        )}

        {topSuggestion && (
          <div className={`${styles.reasoningBlock} ${styles.reasoningBlockAction}`}>
            <div className={styles.reasoningBlockHeader}>
              <Lightbulb size={13} />
              <span>Recommended Action</span>
            </div>
            <p className={styles.reasoningBlockText}>{topSuggestion}</p>
          </div>
        )}
      </div>
    </div>
  );
}
