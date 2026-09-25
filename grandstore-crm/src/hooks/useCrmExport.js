import { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../services/crmApi';

export function useCrmExport() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crmApi.getExportEnquiries();
      if (res.data?.success) {
        setEnquiries(res.data.enquiries);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch export enquiries:', err);
      setError(err.response?.data?.message || 'Error loading export enquiries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  const createEnquiry = async (data) => {
    try {
      const res = await crmApi.createExportEnquiry(data);
      if (res.data?.success) {
        setEnquiries((prev) => [res.data.enquiry, ...prev]);
        return { success: true, enquiry: res.data.enquiry };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to create export lead' };
    }
  };

  const updateDocumentation = async (id, documentKey, verified, fileUrl) => {
    try {
      const res = await crmApi.updateExportDocumentation(id, { documentKey, verified, fileUrl });
      if (res.data?.success) {
        setEnquiries((prev) => prev.map((e) => (e._id === id ? res.data.enquiry : e)));
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to update docs' };
    }
  };

  const updateStage = async (id, stage, notes) => {
    try {
      const res = await crmApi.updateExportStage(id, { stage, notes });
      if (res.data?.success) {
        setEnquiries((prev) => prev.map((e) => (e._id === id ? res.data.enquiry : e)));
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to update stage' };
    }
  };

  return {
    enquiries,
    loading,
    error,
    refresh: fetchEnquiries,
    createEnquiry,
    updateDocumentation,
    updateStage
  };
}
