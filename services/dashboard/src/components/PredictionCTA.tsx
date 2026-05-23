'use client';
import Link from 'next/link';
import { Brain, ArrowRight } from 'lucide-react';
import { Customer } from '@/lib/customers';
import styles from '@/app/prediction/prediction.module.css';

interface Props {
  customer: Customer;
}

const SEV_COLORS: Record<string, string> = {
  critical: '#f87171',
  high: '#fb923c',
  medium: '#fbbf24',
  low: '#34d399',
};

export function PredictionCTA({ customer }: Props) {
  const missPercent = Math.round(customer.missProbability * 100);
  const sevColor = SEV_COLORS[customer.severity] ?? '#34d399';

  return (
    <div className={styles.ctaCard}>
      <div className={styles.ctaLeft}>
        <div className={styles.ctaIconWrap}>
          <Brain size={22} style={{ color: '#22d3ee' }} />
        </div>
        <div>
          <p className={styles.ctaTitle}>AI risk analysis ready</p>
          <p className={styles.ctaSub}>
            {customer.name} —{' '}
            <span style={{ color: sevColor, fontWeight: 700, textTransform: 'uppercase', fontSize: '11px' }}>
              {customer.severity}
            </span>{' '}
            severity ·{' '}
            <span style={{ color: sevColor, fontWeight: 700 }}>{missPercent}%</span>
            {' '}miss probability
          </p>
        </div>
      </div>
      <Link href={`/prediction?customerId=${customer.id}`} className={styles.ctaLink}>
        <button className={styles.ctaBtn}>
          View Full Analysis
          <ArrowRight size={15} />
        </button>
      </Link>
    </div>
  );
}
