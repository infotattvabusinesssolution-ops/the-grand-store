import { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../services/crmApi';

export function useCrmComms() {
  const [comms, setComms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [channelFilter, setChannelFilter] = useState('all');

  const fetchComms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crmApi.getCommunications({ channel: channelFilter });
      if (res.data?.success) {
        setComms(res.data.comms);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch communications:', err);
      setError(err.response?.data?.message || 'Error loading communications');
    } finally {
      setLoading(false);
    }
  }, [channelFilter]);

  useEffect(() => {
    fetchComms();
  }, [fetchComms]);

  const logComm = async (data) => {
    try {
      const res = await crmApi.logCommunication(data);
      if (res.data?.success) {
        setComms((prev) => [res.data.communication, ...prev]);
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to log communication' };
    }
  };

  return {
    comms,
    loading,
    error,
    channelFilter,
    setChannelFilter,
    refresh: fetchComms,
    logComm
  };
}
