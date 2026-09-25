import { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../services/crmApi';

export function useCrmVendors() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crmApi.getVendorSummary();
      if (res.data?.success) {
        setSummary(res.data.data);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch vendor summary:', err);
      setError(err.response?.data?.message || 'Error loading vendor data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const updateStage = async (vendorId, newStage, notes) => {
    try {
      const res = await crmApi.updateVendorStage(vendorId, { newStage, notes });
      if (res.data?.success) {
        fetchSummary();
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to update stage' };
    }
  };

  return {
    summary,
    loading,
    error,
    refresh: fetchSummary,
    updateStage
  };
}
