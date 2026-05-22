import { useState, useEffect, useCallback } from 'react';
import { Prediction, SpendTrend } from '../lib/types';

export function useRiskPolling(userId: string, intervalMs = 30000) {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [trends, setTrends] = useState<SpendTrend[]>([]);
  const [alerts, setAlerts] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      // 1. Fetch latest prediction
      const resRisk = await fetch(`/api/risk?userId=${userId}`);
      if (resRisk.ok) {
        const data = await resRisk.json();
        setPrediction(data);
      } else {
        setPrediction(null);
      }

      // 2. Fetch spend trends
      const resTrends = await fetch(`/api/trends?userId=${userId}`);
      if (resTrends.ok) {
        const data = await resTrends.json();
        setTrends(data);
      }

      // 3. Fetch alerts timeline history
      const resAlerts = await fetch(`/api/alerts?userId=${userId}`);
      if (resAlerts.ok) {
        const data = await resAlerts.json();
        setAlerts(data);
      }
    } catch (err: any) {
      console.error('[Dashboard Polling Hook] Error:', err.message || err);
      setError(err.message || 'Failed to sync platform metrics');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Periodic polling trigger
  useEffect(() => {
    fetchDashboardData(true);
    const id = setInterval(() => fetchDashboardData(false), intervalMs);
    return () => clearInterval(id);
  }, [userId, intervalMs, fetchDashboardData]);

  // Manual Trigger Run Prediction
  const runPredictionTrigger = async (emiAmount: number, emiDueDate: string) => {
    setTriggering(true);
    setError(null);
    try {
      console.log(`[useRiskPolling] Triggering prediction for ${userId}, EMI: ₹${emiAmount}`);
      const res = await fetch('/api/risk/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          emiAmount,
          emiDueDate,
        }),
      });

      if (!res.ok) {
        const errPayload = await res.json();
        throw new Error(errPayload.error || 'Prediction process failed');
      }

      // Re-fetch everything immediately on success
      await fetchDashboardData(false);
      return true;
    } catch (err: any) {
      console.error('[useRiskPolling] Trigger failed:', err.message || err);
      setError(err.message || 'Trigger prediction failed');
      return false;
    } finally {
      setTriggering(false);
    }
  };

  return {
    prediction,
    trends,
    alerts,
    loading,
    triggering,
    error,
    refresh: () => fetchDashboardData(true),
    trigger: runPredictionTrigger,
  };
}
