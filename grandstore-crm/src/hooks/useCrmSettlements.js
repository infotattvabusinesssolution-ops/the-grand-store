import { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../services/crmApi';

export function useCrmSettlements() {
  const [data, setData] = useState({
    stats: {
      pendingCount: 0,
      dueCount: 0,
      settledCount: 0,
      disputedCount: 0,
      totalDueAmount: 0,
      totalSettledAmount: 0
    },
    settlements: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettlements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await crmApi.getSettlementsSummary();
      if (res.data && res.data.success) {
        setData({
          stats: res.data.stats || {},
          settlements: res.data.settlements || []
        });
      }
    } catch (err) {
      console.error('Error fetching settlements:', err);
      setError(err?.response?.data?.message || 'Failed to load vendor settlement milestones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  const processPayment = async (id, payload) => {
    try {
      const res = await crmApi.processSettlementPayment(id, payload);
      await fetchSettlements();
      return res.data;
    } catch (err) {
      console.error('Error processing settlement payment:', err);
      throw err;
    }
  };

  const disputeSettlement = async (id, reason) => {
    try {
      const res = await crmApi.disputeSettlement(id, { reason });
      await fetchSettlements();
      return res.data;
    } catch (err) {
      console.error('Error disputing settlement:', err);
      throw err;
    }
  };

  return {
    ...data,
    loading,
    error,
    refresh: fetchSettlements,
    processPayment,
    disputeSettlement
  };
}
