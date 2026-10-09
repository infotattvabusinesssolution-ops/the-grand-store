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

  const sendPaymentReminder = async (id) => {
    try {
      const res = await crmApi.sendPaymentReminder(id);
      await fetchSummary();
      return res.data;
    } catch (err) {
      console.error('Error sending payment reminder:', err);
      throw err;
    }
  };

  const defaultLot = async (id) => {
    try {
      const res = await crmApi.defaultLot(id);
      await fetchSummary();
      return res.data;
    } catch (err) {
      console.error('Error defaulting lot:', err);
      throw err;
    }
  };

  const approveAuctionLot = async (id, payload) => {
    try {
      const res = await crmApi.approveAuctionLot(id, payload);
      await fetchSummary();
      return res.data;
    } catch (err) {
      console.error('Error approving auction lot:', err);
      throw err;
    }
  };

  const rejectAuctionLot = async (id, payload) => {
    try {
      const res = await crmApi.rejectAuctionLot(id, payload);
      await fetchSummary();
      return res.data;
    } catch (err) {
      console.error('Error rejecting auction lot:', err);
      throw err;
    }
  };

  const updateAuctionLot = async (id, payload) => {
    try {
      const res = await crmApi.updateAuctionLot(id, payload);
      await fetchSummary();
      return res.data;
    } catch (err) {
      console.error('Error updating auction lot:', err);
      throw err;
    }
  };

  const deleteAuctionLot = async (id) => {
    try {
      const res = await crmApi.deleteAuctionLot(id);
      await fetchSummary();
      return res.data;
    } catch (err) {
      console.error('Error deleting auction lot:', err);
      throw err;
    }
  };

  const placeFloorBid = async (id, payload) => {
    try {
      const res = await crmApi.placeFloorBid(id, payload);
      await fetchSummary();
      return res.data;
    } catch (err) {
      console.error('Error placing floor bid:', err);
      throw err;
    }
  };

  const declareHammerFall = async (id, payload) => {
    try {
      const res = await crmApi.declareHammerFall(id, payload);
      await fetchSummary();
      return res.data;
    } catch (err) {
      console.error('Error declaring hammer fall:', err);
      throw err;
    }
  };

  const approveTastingEvent = async (id, payload) => {
    try {
      const res = await crmApi.approveTastingEvent(id, payload);
      await fetchSummary();
      return res.data;
    } catch (err) {
      console.error('Error approving tasting event:', err);
      throw err;
    }
  };

  const rejectTastingEvent = async (id, payload) => {
    try {
      const res = await crmApi.rejectTastingEvent(id, payload);
      await fetchSummary();
      return res.data;
    } catch (err) {
      console.error('Error rejecting tasting event:', err);
      throw err;
    }
  };

  const updateTastingEvent = async (id, payload) => {
    try {
      const res = await crmApi.updateTastingEvent(id, payload);
      await fetchSummary();
      return res.data;
    } catch (err) {
      console.error('Error updating tasting event:', err);
      throw err;
    }
  };

  const deleteTastingEvent = async (id) => {
    try {
      const res = await crmApi.deleteTastingEvent(id);
      await fetchSummary();
      return res.data;
    } catch (err) {
      console.error('Error deleting tasting event:', err);
      throw err;
    }
  };

  const registerWalkInGuest = async (eventId, payload) => {
    try {
      const res = await crmApi.registerWalkInGuest(eventId, payload);
      await fetchSummary();
      return res.data;
    } catch (err) {
      console.error('Error registering walk-in guest:', err);
      throw err;
    }
  };

  const getAllBidders = async (params) => {
    try {
      const res = await crmApi.getAllBidders(params);
      return res.data;
    } catch (err) {
      console.error('Error fetching all bidders:', err);
      throw err;
    }
  };

  const getLotBids = async (id) => {
    try {
      const res = await crmApi.getLotBids(id);
      return res.data;
    } catch (err) {
      console.error('Error fetching lot bids:', err);
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
    sendPaymentReminder,
    defaultLot,
    approveAuctionLot,
    rejectAuctionLot,
    updateAuctionLot,
    deleteAuctionLot,
    placeFloorBid,
    declareHammerFall,
    getLotBids,
    getEventGuests,
    toggleGuestCheckIn,
    registerWalkInGuest,
    approveTastingEvent,
    rejectTastingEvent,
    updateTastingEvent,
    deleteTastingEvent,
    getAllBidders
  };
}

