import { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../services/crmApi';

/**
 * Custom React Hook: encapsulates Morning Screen summary data fetching,
 * loading state, error handling, and manual/background polling.
 */
export function useCrmDashboard(pollIntervalMs = 60000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchSummary = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const response = await crmApi.getDashboardSummary();
      setData(response.data);
      setError(null);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to fetch CRM dashboard summary:', err);
      setError(err.response?.data?.message || 'Error connecting to operations server');
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary(false);
    const interval = setInterval(() => fetchSummary(true), pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchSummary, pollIntervalMs]);

  return {
    data,
    loading,
    error,
    lastRefreshed,
    refresh: () => fetchSummary(false)
  };
}
