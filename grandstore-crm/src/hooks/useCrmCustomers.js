import { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../services/crmApi';

export function useCrmCustomers(initialParams = {}) {
  const [customers, setCustomers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [params, setParams] = useState(initialParams);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crmApi.getCustomers(params);
      if (res.data?.success) {
        setCustomers(res.data.customers);
        setPagination(res.data.pagination);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setError(err.response?.data?.message || 'Error loading customers');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    customers,
    pagination,
    loading,
    error,
    params,
    setParams,
    refresh: fetchCustomers
  };
}

export function useCrmCustomer360(customerId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDossier = useCallback(async () => {
    if (!customerId) return;
    setLoading(true);
    try {
      const res = await crmApi.getCustomer360(customerId);
      if (res.data?.success) {
        setData(res.data);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch customer 360 dossier:', err);
      setError(err.response?.data?.message || 'Error loading customer 360');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchDossier();
  }, [fetchDossier]);

  const addNote = async (note) => {
    try {
      const res = await crmApi.addCustomerNote(customerId, note);
      if (res.data?.success) {
        setData((prev) => ({
          ...prev,
          history: {
            ...prev.history,
            internalNotes: res.data.internalNotes
          }
        }));
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to add note' };
    }
  };

  const updateTier = async (updateData) => {
    try {
      const res = await crmApi.updateCustomerTier(customerId, updateData);
      if (res.data?.success) {
        setData((prev) => ({
          ...prev,
          profile: {
            ...prev?.profile,
            ...res.data.user
          }
        }));
        return { success: true, user: res.data.user };
      }
      return { success: false, message: res.data?.message || 'Failed to update tier' };
    } catch (err) {
      console.error('Failed to update customer tier:', err);
      return { success: false, message: err.response?.data?.message || err.message || 'Failed to update tier' };
    }
  };

  return {
    data,
    loading,
    error,
    refresh: fetchDossier,
    addNote,
    updateTier
  };
}
