import { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../services/crmApi';

export function useCrmAuctions() {
  const [data, setData] = useState({
    stats: {
      pendingKycCount: 0,
      unpaidLotsCount: 0,
      liveAuctionsCount: 0,
      upcomingEventsCount: 0
    },
    pendingBidders: [],
    unpaidLots: [],
    liveLots: [],
    events: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await crmApi.getAuctionSummary();
      if (res.data && res.data.success) {
        setData({
          stats: res.data.stats || {},
          pendingBidders: res.data.pendingBidders || [],
          unpaidLots: res.data.unpaidLots || [],
          liveLots: res.data.liveLots || [],
          events: res.data.events || []
        });
      }
    } catch (err) {
      console.error('Error fetching auction summary:', err);
      setError(err?.response?.data?.message || 'Failed to load auction and event operations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const updateBidderKyc = async (id, payload) => {
    try {
      const res = await crmApi.updateBidderKyc(id, payload);
      await fetchSummary();
      return res.data;
    } catch (err) {
      console.error('Error updating bidder KYC:', err);
      throw err;
    }
  };

  const recordHammerPayment = async (id, payload) => {
    try {
      const res = await crmApi.recordHammerPayment(id, payload);
      await fetchSummary();
      return res.data;
    } catch (err) {
      console.error('Error recording hammer payment:', err);
      throw err;
    }
  };

  const getEventGuests = async (eventId) => {
    try {
      const res = await crmApi.getEventGuests(eventId);
      return res.data;
    } catch (err) {
      console.error('Error fetching event guests:', err);
      throw err;
    }
  };

  const toggleGuestCheckIn = async (bookingId) => {
    try {
      const res = await crmApi.toggleGuestCheckIn(bookingId);
      return res.data;
    } catch (err) {
      console.error('Error updating guest check-in:', err);
      throw err;
    }
  };

  return {
    ...data,
    loading,
    error,
    refresh: fetchSummary,
    updateBidderKyc,
    recordHammerPayment,
    getEventGuests,
    toggleGuestCheckIn
  };
}
