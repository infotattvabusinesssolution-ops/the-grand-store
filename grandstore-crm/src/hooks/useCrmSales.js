import { useState, useEffect, useCallback, useMemo } from 'react';
import { crmApi } from '../services/crmApi';

export function useCrmSales(pollIntervalMs = 60000) {
  const [stats, setStats] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [shopOrders, setShopOrders] = useState([]);
  const [auctionOrders, setAuctionOrders] = useState([]);
  const [eventBookings, setEventBookings] = useState([]);
  const [vendorPayments, setVendorPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchSalesData = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [dashRes, finRes] = await Promise.all([
        crmApi.getSalesDashboard().catch((err) => {
          console.warn('Sales dashboard metrics endpoint warning:', err);
          return { data: null };
        }),
        crmApi.getSalesFinance({ limit: 2000 }).catch((err) => {
          console.warn('Sales finance ledger endpoint warning:', err);
          return { data: null };
        })
      ]);

      if (dashRes?.data) {
        setStats(dashRes.data);
      }

      if (finRes?.data) {
        const d = finRes.data;
        setMetrics(d.metrics || null);
        setTransactions(d.transactions || []);
        setShopOrders((d.shopOrders || []).filter(o => o.paymentStatus !== 'Cancelled' && o.paymentStatus !== 'Failed'));
        setAuctionOrders((d.auctionOrders || []).filter(o => o.paymentStatus !== 'Cancelled' && o.paymentStatus !== 'Failed'));
        setEventBookings((d.eventBookings || []).filter(b => b.paymentStatus !== 'Cancelled' && b.paymentStatus !== 'Failed'));
        setVendorPayments(d.vendorPayments || []);
      }

      setError(null);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Failed to load sales and finance telemetry:', err);
      setError(err.response?.data?.message || err.message || 'Error loading sales data');
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSalesData(false);
    if (pollIntervalMs > 0) {
      const interval = setInterval(() => fetchSalesData(true), pollIntervalMs);
      return () => clearInterval(interval);
    }
  }, [fetchSalesData, pollIntervalMs]);

  // Helper to extract clean financial breakdown distinguishing Admin vs Vendor products
  const getOrderFinancialDetails = useCallback((order) => {
    if (!order) {
      return {
        hasAdmin: false,
        hasVendor: false,
        isMixed: false,
        adminSubtotal: 0,
        vendorSubtotal: 0,
        totalVendorPayout: 0,
        actualCommission: 0,
        customerShipping: 0,
        shippingMargin: 0
      };
    }

    const items = order.orderItems || [];
    const adminItems = items.filter(it => !it.vendorId);
    const vendorItems = items.filter(it => Boolean(it.vendorId));

    const validVendorPayables = (order.vendorPayables || []).filter(p => Boolean(p.vendorId));
    const hasVendor = vendorItems.length > 0 || validVendorPayables.length > 0;
    const hasAdmin = adminItems.length > 0 || (!hasVendor && items.length > 0) || items.length === 0;

    const adminSubtotal = adminItems.length > 0 
      ? adminItems.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0)
      : (!hasVendor ? Number(order.subTotal || 0) : 0);

    const vendorSubtotal = vendorItems.length > 0
      ? vendorItems.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0)
      : (hasVendor ? Number(order.subTotal || 0) : 0);

    // Vendor Payout is strictly for actual third-party vendors
    const totalVendorPayout = validVendorPayables.reduce((sum, p) => sum + (Number(p.netPayable) || 0), 0);

    // Platform commission only applies to vendor sales
    const actualCommission = hasVendor ? Number(order.commissionAmount || 0) : 0;

    // Customer shipping & margin
    const customerShipping = Number(order.shippingCost || 0);
    let actualShipping = 0;
    if (order.shipments && order.shipments.length > 0) {
      actualShipping = order.shipments.reduce((sum, shp) => sum + (Number(shp.actualShippingCost) || 0), 0);
    }
    const shippingMargin = customerShipping - actualShipping;

    return {
      hasAdmin,
      hasVendor,
      isMixed: hasAdmin && hasVendor,
      adminSubtotal,
      vendorSubtotal,
      totalVendorPayout,
      actualCommission,
      customerShipping,
      shippingMargin
    };
  }, []);

  const adminShopOrders = useMemo(() => {
    return (shopOrders || []).filter(order => getOrderFinancialDetails(order).hasAdmin);
  }, [shopOrders, getOrderFinancialDetails]);

  const vendorShopOrders = useMemo(() => {
    return (shopOrders || []).filter(order => getOrderFinancialDetails(order).hasVendor);
  }, [shopOrders, getOrderFinancialDetails]);

  // Section 15 Executive Management Profitability Calculation
  const managementSummary = useMemo(() => {
    let totalSales = 0;
    let totalVendorPayouts = 0;
    let grossCommission = 0;
    let promosAbsorbed = 0;
    let referralAbsorbed = 0;
    let coinsAbsorbed = 0;
    let gatewayAbsorbed = 0;
    let courierAbsorbed = 0;
    let netContribution = 0;

    (shopOrders || []).forEach(order => {
      const details = getOrderFinancialDetails(order);

      if (order.financialSnapshot) {
        const snap = order.financialSnapshot;
        totalSales += Number(snap.subTotal || snap.totalPrice || 0);
        totalVendorPayouts += details.hasVendor ? Number(snap.totalVendorPayouts || details.totalVendorPayout) : 0;
        grossCommission += details.hasVendor ? Number(snap.grossPlatformCommission || 0) : 0;
        promosAbsorbed += Number(snap.promoDiscountAbsorbedByGS || 0);
        referralAbsorbed += Number(snap.referralAbsorbedByGS || 0);
        coinsAbsorbed += Number(snap.superCoinsAbsorbedByGS || 0);
        gatewayAbsorbed += Number(snap.gatewayFeeAbsorbedByGS || 0);
        courierAbsorbed += Number(snap.courierCostAbsorbedByGS || 0);
        if (!details.hasVendor) {
          const directRevenue = Number(snap.subTotal || snap.totalPrice || 0);
          netContribution += (directRevenue - Number(snap.promoDiscountAbsorbedByGS || 0) - Number(snap.referralAbsorbedByGS || 0) - Number(snap.superCoinsAbsorbedByGS || 0) - Number(snap.gatewayFeeAbsorbedByGS || 0));
        } else {
          netContribution += Number(snap.netPlatformContribution || 0);
        }
      } else {
        // Fallback calculation for orders prior to immutable snapshot engine
        const subtotal = Number(order.totalPrice || 0);
        const comm = details.hasVendor ? subtotal * 0.15 : 0;
        const vendor = details.hasVendor ? subtotal - comm : 0;
        const gw = subtotal * 0.025;
        const coins = Number(order.superCoinsDiscount || 0);
        const ref = Number(order.appliedWelcomeDiscount || 0);
        totalSales += subtotal;
        totalVendorPayouts += vendor;
        grossCommission += comm;
        coinsAbsorbed += coins;
        referralAbsorbed += ref;
        gatewayAbsorbed += gw;
        if (!details.hasVendor) {
          netContribution += (subtotal - (coins + ref + gw));
        } else {
          netContribution += (comm - (coins + ref + gw));
        }
      }
    });

    const netMarginPct = totalSales > 0 ? parseFloat(((netContribution / totalSales) * 100).toFixed(2)) : 0;

    return {
      totalSales: parseFloat(totalSales.toFixed(2)),
      totalVendorPayouts: parseFloat(totalVendorPayouts.toFixed(2)),
      grossCommission: parseFloat(grossCommission.toFixed(2)),
      promosAbsorbed: parseFloat(promosAbsorbed.toFixed(2)),
      referralAbsorbed: parseFloat(referralAbsorbed.toFixed(2)),
      coinsAbsorbed: parseFloat(coinsAbsorbed.toFixed(2)),
      gatewayAbsorbed: parseFloat(gatewayAbsorbed.toFixed(2)),
      courierAbsorbed: parseFloat(courierAbsorbed.toFixed(2)),
      netContribution: parseFloat(netContribution.toFixed(2)),
      netMarginPct
    };
  }, [shopOrders, getOrderFinancialDetails]);

  return {
    stats,
    metrics,
    transactions,
    shopOrders,
    adminShopOrders,
    vendorShopOrders,
    auctionOrders,
    eventBookings,
    vendorPayments,
    managementSummary,
    getOrderFinancialDetails,
    loading,
    error,
    lastRefreshed,
    refresh: () => fetchSalesData(false)
  };
}
