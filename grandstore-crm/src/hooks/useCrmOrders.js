import { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../services/crmApi';

export function useCrmOrders() {
  const [lanes, setLanes] = useState({
    newOrders: { count: 0, items: [] },
    vendorProcessing: { count: 0, items: [] },
    shipmentIssues: { count: 0, items: [] },
    completed: { count: 0, items: [] }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBoard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crmApi.getOrderBoard();
      if (res.data?.success) {
        setLanes(res.data.lanes);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch order board:', err);
      setError(err.response?.data?.message || 'Error loading order board');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  const updateOrderStage = async (orderId, stageData) => {
    try {
      const res = await crmApi.updateOrderStage(orderId, stageData);
      if (res.data?.success) {
        await fetchBoard();
        return res.data;
      }
    } catch (err) {
      console.error('Failed to advance order stage:', err);
      throw err;
    }
  };

  const resolveException = async (shipmentId, updateData) => {
    try {
      const res = await crmApi.updateLogisticsException(shipmentId, updateData);
      if (res.data?.success) {
        await fetchBoard();
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to update exception' };
    }
  };

  return {
    lanes,
    loading,
    error,
    refresh: fetchBoard,
    updateOrderStage,
    resolveException
  };
}
