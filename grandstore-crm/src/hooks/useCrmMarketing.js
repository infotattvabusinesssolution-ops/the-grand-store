import { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../services/crmApi';

export function useCrmMarketing() {
  const [data, setData] = useState({
    stats: {
      totalUsers: 0,
      totalAgeVerified: 0,
      activeSubscribers: 0,
      unsubscribedCount: 0,
      complianceRatePct: 100
    },
    segments: [],
    recentSubscribers: []
  });
  const [campaigns, setCampaigns] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAudiencesAndCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [audiencesRes, campaignsRes, couponsRes] = await Promise.all([
        crmApi.getMarketingAudiences(),
        crmApi.getCampaigns(),
        crmApi.getProductCoupons().catch(() => ({ data: { coupons: [] } }))
      ]);

      if (audiencesRes.data && audiencesRes.data.success) {
        setData({
          stats: audiencesRes.data.stats || {},
          segments: audiencesRes.data.segments || [],
          recentSubscribers: audiencesRes.data.recentSubscribers || []
        });
      }

      if (campaignsRes.data && campaignsRes.data.success) {
        setCampaigns(campaignsRes.data.campaigns || []);
      }

      if (couponsRes.data && couponsRes.data.success) {
        setCoupons(couponsRes.data.coupons || []);
      }
    } catch (err) {
      console.error('Error fetching marketing data:', err);
      setError(err?.response?.data?.message || 'Failed to load marketing compliance data');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCoupons = useCallback(async () => {
    try {
      setCouponsLoading(true);
      const res = await crmApi.getProductCoupons();
      if (res.data && res.data.success) {
        setCoupons(res.data.coupons || []);
      }
    } catch (err) {
      console.error('Error fetching product coupons:', err);
    } finally {
      setCouponsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAudiencesAndCampaigns();
  }, [fetchAudiencesAndCampaigns]);

  const previewSegment = async (segmentId) => {
    try {
      const res = await crmApi.previewAudienceSegment(segmentId);
      return res.data;
    } catch (err) {
      console.error('Error previewing segment:', err);
      throw err;
    }
  };

  const createCampaign = async (campaignData) => {
    try {
      const res = await crmApi.createCampaign(campaignData);
      if (res.data && res.data.success) {
        await fetchAudiencesAndCampaigns();
        return res.data.campaign;
      }
    } catch (err) {
      console.error('Error creating campaign:', err);
      throw err;
    }
  };

  const updateCampaignStatus = async (id, status) => {
    try {
      const res = await crmApi.updateCampaignStatus(id, status);
      if (res.data && res.data.success) {
        await fetchAudiencesAndCampaigns();
        return res.data.campaign;
      }
    } catch (err) {
      console.error('Error updating campaign status:', err);
      throw err;
    }
  };

  const sendCampaignNow = async (id) => {
    try {
      const res = await crmApi.sendCampaignNow(id);
      if (res.data && res.data.success) {
        await fetchAudiencesAndCampaigns();
        return res.data;
      }
    } catch (err) {
      console.error('Error dispatching campaign:', err);
      throw err;
    }
  };

  const testSendCampaign = async (id, testEmail) => {
    try {
      const res = await crmApi.testSendCampaign(id, testEmail);
      return res.data;
    } catch (err) {
      console.error('Error dispatching test email:', err);
      throw err;
    }
  };

  const syncCampaignAttribution = async (id) => {
    try {
      const res = await crmApi.syncCampaignAttribution(id);
      if (res.data && res.data.success) {
        await fetchAudiencesAndCampaigns();
        return res.data;
      }
    } catch (err) {
      console.error('Error syncing campaign attribution:', err);
      throw err;
    }
  };

  const deleteCampaign = async (id) => {
    try {
      const res = await crmApi.deleteCampaign(id);
      if (res.data && res.data.success) {
        await fetchAudiencesAndCampaigns();
        return res.data;
      }
    } catch (err) {
      console.error('Error deleting campaign:', err);
      throw err;
    }
  };

  const getCampaignDetails = async (id) => {
    try {
      const res = await crmApi.getCampaignDetails(id);
      return res.data;
    } catch (err) {
      console.error('Error fetching campaign details:', err);
      throw err;
    }
  };

  const createProductCoupon = async (couponData) => {
    try {
      const res = await crmApi.createProductCoupon(couponData);
      if (res.data && res.data.success) {
        await fetchCoupons();
        return res.data;
      }
      return res.data;
    } catch (err) {
      console.error('Error creating product coupon:', err);
      throw err;
    }
  };

  const toggleProductCoupon = async (id) => {
    try {
      const res = await crmApi.toggleProductCoupon(id);
      if (res.data && res.data.success) {
        await fetchCoupons();
        return res.data;
      }
      return res.data;
    } catch (err) {
      console.error('Error toggling product coupon:', err);
      throw err;
    }
  };

  const deleteProductCoupon = async (id) => {
    try {
      const res = await crmApi.deleteProductCoupon(id);
      if (res.data && res.data.success) {
        await fetchCoupons();
        return res.data;
      }
      return res.data;
    } catch (err) {
      console.error('Error deleting product coupon:', err);
      throw err;
    }
  };

  const bulkImportCustomers = async (payload) => {
    try {
      const res = await crmApi.bulkImportCustomers(payload);
      if (res.data && res.data.success) {
        await fetchAudiencesAndCampaigns();
        return res.data;
      }
      return res.data;
    } catch (err) {
      console.error('Error importing customers via CSV:', err);
      throw err;
    }
  };

  const createCategory = async (categoryData) => {
    try {
      const res = await crmApi.createAudienceCategory(categoryData);
      if (res.data && res.data.success) {
        await fetchAudiencesAndCampaigns();
        return res.data;
      }
      return res.data;
    } catch (err) {
      console.error('Error creating audience category:', err);
      throw err;
    }
  };

  const updateCategory = async (id, categoryData) => {
    try {
      const res = await crmApi.updateAudienceCategory(id, categoryData);
      if (res.data && res.data.success) {
        await fetchAudiencesAndCampaigns();
        return res.data;
      }
      return res.data;
    } catch (err) {
      console.error('Error updating audience category:', err);
      throw err;
    }
  };

  const deleteCategory = async (id) => {
    try {
      const res = await crmApi.deleteAudienceCategory(id);
      if (res.data && res.data.success) {
        await fetchAudiencesAndCampaigns();
        return res.data;
      }
      return res.data;
    } catch (err) {
      console.error('Error deleting audience category:', err);
      throw err;
    }
  };

  return {
    ...data,
    campaigns,
    coupons,
    loading,
    couponsLoading,
    error,
    refresh: fetchAudiencesAndCampaigns,
    fetchCoupons,
    previewSegment,
    createCampaign,
    updateCampaignStatus,
    sendCampaignNow,
    testSendCampaign,
    syncCampaignAttribution,
    deleteCampaign,
    getCampaignDetails,
    createProductCoupon,
    toggleProductCoupon,
    deleteProductCoupon,
    bulkImportCustomers,
    createCategory,
    updateCategory,
    deleteCategory
  };
}
