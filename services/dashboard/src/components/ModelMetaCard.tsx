'use client';
import { ShapResult } from '@/lib/shap';
import { Cpu, Clock, Layers, BarChart3, Target, Hash } from 'lucide-react';
import styles from '@/app/prediction/prediction.module.css';

interface Props {
  shap: ShapResult;
}

export function ModelMetaCard({ shap }: Props) {
  const chips = [
    { label: 'Model', value: 'Mistral 7B', icon: Cpu },
    { label: 'Version', value: 'v0.1-Q4_0', icon: Hash },
    { label: 'Computed', value: new Date(shap.computedAt).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }), icon: Clock },
    { label: 'Context', value: `${shap.contextWindowDays}-day window`, icon: Layers },
    { label: 'Baseline score', value: String(shap.baselineScore), icon: Target },
    { label: 'Features evaluated', value: String(shap.features.length), icon: BarChart3 },
  ];

  return (
    <div className={styles.metaCard}>
      <h3 className={styles.metaTitle}>Model Metadata</h3>
      <div className={styles.metaGrid}>
        {chips.map(({ label, value, icon: Icon }) => (
          <div key={label} className={styles.metaChip}>
            <Icon size={13} className={styles.metaChipIcon} />
            <div>
              <p className={styles.metaChipLabel}>{label}</p>
              <p className={styles.metaChipValue}>{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
