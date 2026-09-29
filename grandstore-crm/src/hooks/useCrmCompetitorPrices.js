import { useState, useEffect, useCallback } from 'react';
import { crmApi } from '../services/crmApi';
import { useToast } from '../context/ToastContext';

export function useCrmCompetitorPrices() {
  const toast = useToast();

  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    totalTracked: 0,
    gsCheaperCount: 0,
    gsExpensiveCount: 0,
    priceMatchedCount: 0,
    competitorOosCount: 0,
    onSaleCount: 0,
    matchedCount: 0,
    notListedCount: 0,
    lastScrapedAt: null
  });

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  // Filters & Pagination for Live Comparison
  const [positionFilter, setPositionFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Monthly Summary State
  const [monthlyItems, setMonthlyItems] = useState([]);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [availableMonths, setAvailableMonths] = useState([new Date().toISOString().slice(0, 7)]);
  const [monthlySearch, setMonthlySearch] = useState('');

  // Fetch KPI Summary
  const fetchSummary = useCallback(async () => {
    try {
      const res = await crmApi.getCompetitorPriceSummary();
      if (res.data?.success) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.warn('Failed to load competitor price summary:', err.message);
    }
  }, []);

  // Fetch Live Comparison Products
  const fetchPrices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await crmApi.getCompetitorPrices({
        position: positionFilter,
        search: searchQuery,
        page,
        limit: 40
      });
      if (res.data?.success) {
        setItems(res.data.items);
        setTotalPages(res.data.totalPages || 1);
        setTotalCount(res.data.total || 0);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch competitor prices:', err);
      setError(err.response?.data?.message || 'Error loading competitor prices');
    } finally {
      setLoading(false);
    }
  }, [positionFilter, searchQuery, page]);

  // Fetch Monthly Price Summary
  const fetchMonthly = useCallback(async () => {
    setMonthlyLoading(true);
    try {
      const res = await crmApi.getMonthlyPriceSummary({
        month: selectedMonth,
        search: monthlySearch,
        limit: 100
      });
      if (res.data?.success) {
        setMonthlyItems(res.data.items);
        if (res.data.availableMonths && res.data.availableMonths.length > 0) {
          setAvailableMonths(res.data.availableMonths);
        }
      }
    } catch (err) {
      console.warn('Failed to load monthly price summary:', err.message);
    } finally {
      setMonthlyLoading(false);
    }
  }, [selectedMonth, monthlySearch]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  useEffect(() => {
    fetchMonthly();
  }, [fetchMonthly]);

  // Trigger On-Demand Sync
  const triggerSync = async (maxProducts = 1000) => {
    setSyncing(true);
    try {
      toast.info(`Initiating live synchronization of ${maxProducts} products from Norman Goodfellows...`);
      const res = await crmApi.syncCompetitorPricesNow({ maxProducts });
      if (res.data?.success) {
        toast.success(res.data.message || 'Competitor prices synced successfully!');
        await Promise.all([fetchPrices(), fetchSummary(), fetchMonthly()]);
        return { success: true, result: res.data.result };
      } else {
        toast.error(res.data?.message || 'Sync encountered an issue');
        return { success: false };
      }
    } catch (err) {
      console.error('Competitor sync failed:', err);
      toast.error('Sync failed: ' + (err.response?.data?.message || err.message));
      return { success: false };
    } finally {
      setSyncing(false);
    }
  };

  // Link / Override Match to an Admin Product
  const linkProduct = async (trackId, productId) => {
    try {
      const res = await crmApi.matchCompetitorProduct(trackId, { productId });
      if (res.data?.success) {
        toast.success(res.data.message || 'Product linked successfully');
        await Promise.all([fetchPrices(), fetchSummary()]);
        return { success: true };
      }
    } catch (err) {
      toast.error('Failed to link product: ' + (err.response?.data?.message || err.message));
      return { success: false };
    }
  };

  return {
    items,
    summary,
    loading,
    syncing,
    error,
    positionFilter,
    setPositionFilter,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    totalPages,
    totalCount,
    monthlyItems,
    monthlyLoading,
    selectedMonth,
    setSelectedMonth,
    availableMonths,
    monthlySearch,
    setMonthlySearch,
    refreshPrices: fetchPrices,
    refreshSummary: fetchSummary,
    refreshMonthly: fetchMonthly,
    triggerSync,
    linkProduct
  };
}
