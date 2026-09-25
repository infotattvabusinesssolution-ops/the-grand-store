import { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../services/crmApi';

export function useCrmStaffKpis() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchKpis = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crmApi.getStaffKpis();
      if (res.data?.success) {
        setData(res.data);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch staff KPIs:', err);
      setError(err.response?.data?.message || 'Error loading staff telemetry');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKpis();
  }, [fetchKpis]);

  return {
    data,
    teamSummary: data?.teamSummary || {},
    staff: data?.staff || [],
    loading,
    error,
    refresh: fetchKpis
  };
}
