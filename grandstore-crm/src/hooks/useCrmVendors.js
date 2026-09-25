import { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../services/crmApi';

export function useCrmVendors() {
  const [summary, setSummary] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [activeVendor360, setActiveVendor360] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loading360, setLoading360] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    stage: 'all'
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, vendRes] = await Promise.all([
        crmApi.getVendorSummary().catch(() => ({ data: { success: false } })),
        crmApi.getVendors(filters).catch(() => ({ data: { success: false } }))
      ]);

      if (sumRes.data?.success) {
        setSummary(sumRes.data.data);
      }
      if (vendRes.data?.success) {
        setVendors(vendRes.data.data || []);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch vendor data:', err);
      setError(err.response?.data?.message || 'Error loading vendor directory');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fetchVendor360 = async (id) => {
    setLoading360(true);
    try {
      const res = await crmApi.getVendor360(id);
      if (res.data?.success) {
        setActiveVendor360(res.data.data);
        return { success: true, data: res.data.data };
      }
    } catch (err) {
      console.error('Failed to load vendor 360 dossier:', err);
      return { success: false, message: err.response?.data?.message || 'Failed to load vendor dossier' };
    } finally {
      setLoading360(false);
    }
  };

  const updateStage = async (vendorId, newStage, notes) => {
    try {
      const res = await crmApi.updateVendorStage(vendorId, { newStage, notes });
      if (res.data?.success) {
        fetchData();
        if (activeVendor360 && activeVendor360.vendorInfo?._id === vendorId) {
          fetchVendor360(vendorId);
        }
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to update stage' };
    }
  };

  const updateStatus = async (vendorId, status, reason) => {
    try {
      const res = await crmApi.updateVendorStatus(vendorId, { status, reason });
      if (res.data?.success) {
        fetchData();
        if (activeVendor360 && activeVendor360.vendorInfo?._id === vendorId) {
          fetchVendor360(vendorId);
        }
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to update status' };
    }
  };

  const pingVendor = async (vendorId, message, type) => {
    try {
      const res = await crmApi.pingVendor(vendorId, { message, type });
      if (res.data?.success) {
        return { success: true, message: res.data.message };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to ping vendor' };
    }
  };

  return {
    summary,
    vendors,
    activeVendor360,
    setActiveVendor360,
    loading,
    loading360,
    error,
    filters,
    setFilters,
    refresh: fetchData,
    fetchVendor360,
    updateStage,
    updateStatus,
    pingVendor
  };
}
