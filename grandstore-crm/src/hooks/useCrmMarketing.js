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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAudiencesAndCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [audiencesRes, campaignsRes] = await Promise.all([
        crmApi.getMarketingAudiences(),
        crmApi.getCampaigns()
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
    } catch (err) {
      console.error('Error fetching marketing data:', err);
      setError(err?.response?.data?.message || 'Failed to load marketing compliance data');
    } finally {
      setLoading(false);
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
    loading,
    error,
    refresh: fetchAudiencesAndCampaigns,
    previewSegment,
    createCampaign,
    updateCampaignStatus,
    bulkImportCustomers,
    createCategory,
    updateCategory,
    deleteCategory
  };
}
