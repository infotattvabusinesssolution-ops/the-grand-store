import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import { 
  DollarSign, ArrowUpRight, ArrowDownRight, TrendingUp, History, Download, 
  FileSpreadsheet, Layers3, Scale, ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { downloadAccountingWorkbook, downloadCategoryAccountingWorkbook, downloadAuctionsWorkbook, downloadEventsWorkbook, downloadVendorWorkbook, downloadLedgerWorkbook } from '../../utils/accountingWorkbook';

export default function AdminFinancials({ hideHeader = false }) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [shopOrders, setShopOrders] = useState([]);
  const [auctionOrders, setAuctionOrders] = useState([]);
  const [eventBookings, setEventBookings] = useState([]);
  const [vendorPayments, setVendorPayments] = useState([]);
  const [activeTab, setActiveTab] = useState('admin_shop');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportError, setExportError] = useState('');
  const [exportingReport, setExportingReport] = useState('');

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);
  };

  useEffect(() => {
    const fetchFinanceData = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || '';
        const res = await api.get(`${API_URL}/api/admin/finance?limit=2000`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });

        if (res.data) {
          setMetrics(res.data.metrics);
          setTransactions(res.data.transactions);
          setShopOrders(res.data.shopOrders || []);
          setAuctionOrders(res.data.auctionOrders || []);
          setEventBookings(res.data.eventBookings || []);
          setVendorPayments(res.data.vendorPayments || []);
        }
      } catch (err) {
        setError('Failed to load finance data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceData();
  }, [user?.token]);

  // Helper to extract clean financial breakdown distinguishing Admin vs Vendor products
  const getOrderFinancialDetails = (order) => {
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
  };

  const adminShopOrders = React.useMemo(() => {
    return (shopOrders || []).filter(order => getOrderFinancialDetails(order).hasAdmin);
  }, [shopOrders]);

  const vendorShopOrders = React.useMemo(() => {
    return (shopOrders || []).filter(order => getOrderFinancialDetails(order).hasVendor);
  }, [shopOrders]);

  const managementSummary = React.useMemo(() => {
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
  }, [shopOrders]);

  const exportToExcel = async (reportType) => {
    try {
      setExportError('');
      setExportingReport(reportType);
      if (reportType === 'shop' || reportType === 'admin_shop' || reportType === 'vendor_shop') {
        const filteredShopOrders = reportType === 'admin_shop'
          ? adminShopOrders
          : reportType === 'vendor_shop'
            ? vendorShopOrders
            : shopOrders;
        await downloadCategoryAccountingWorkbook({ shopOrders: filteredShopOrders, auctionOrders, eventBookings });
      } else if (reportType === 'auctions') {
        await downloadAuctionsWorkbook({ auctionOrders });
      } else if (reportType === 'events') {
        await downloadEventsWorkbook({ eventBookings });
      } else if (reportType === 'vendor') {
        await downloadVendorWorkbook({ vendorPayments });
      } else if (reportType === 'transactions') {
        await downloadLedgerWorkbook({ transactions });
      } else {
        await downloadAccountingWorkbook({ metrics, transactions, shopOrders, auctionOrders, eventBookings, vendorPayments });
      }
    } catch (exportError) {
      console.error(exportError);
      setExportError('Could not create the Excel report. Please try again.');
    } finally {
      setExportingReport('');
    }
  };

  if (loading) return <div className="text-white p-8 text-center animate-pulse">Loading financial data...</div>;
  if (error) return <div className="text-red-500 p-8">{error}</div>;

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-serif text-white">Financial Control Centre</h2>
            <p className="text-gray-400 text-sm mt-1">Master overview of marketplace revenue and vendor payables based on immutable ledgers.</p>
          </div>
        </div>
      )}

      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#111] border border-[#b58b38]/30 rounded-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp size={64} className="text-[#b58b38]" />
          </div>
          <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-1">Total Processed (Sales)</p>
          <p className="text-3xl font-serif text-[#e6c97a]">{formatMoney(metrics?.totalProcessed)}</p>
          <p className="text-[#888] text-xs mt-2">Gross customer payments cleared</p>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <ArrowUpRight size={64} className="text-green-500" />
          </div>
          <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-1">GS Commission</p>
          <p className="text-3xl font-serif text-white">{formatMoney(metrics?.totalPlatformRevenue)}</p>
          <p className="text-[#888] text-xs mt-2">Earned marketplace commissions</p>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <DollarSign size={64} className="text-yellow-500" />
          </div>
          <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-1">VAT Collected</p>
          <p className="text-3xl font-serif text-white">{formatMoney(metrics?.totalVatCollected)}</p>
          <p className="text-[#888] text-xs mt-2">VAT securely withheld & tracked</p>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <ArrowDownRight size={64} className="text-red-500" />
          </div>
          <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-1">Owed to Vendors</p>
          <p className="text-3xl font-serif text-white">{formatMoney(metrics?.totalPendingPayables)}</p>
          <p className="text-[#888] text-xs mt-2">Pending payables to be disbursed</p>
        </div>
      </div>

      {/* SECTION 15 MANAGEMENT PROFITABILITY DASHBOARD */}
      <section className="bg-black/60 border border-[var(--color-gold)]/40 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-gold)]/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/10 pb-4 mb-6 gap-3">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-gold)] mb-1">
              <Scale size={18} />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase font-mono">Executive Accounting • Section 15</span>
            </div>
            <h3 className="text-white font-serif text-2xl">Management Profitability Dashboard</h3>
            <p className="text-gray-400 text-xs mt-1">
              True net contribution and margin health after vendor payouts, customer incentives, and "Who Pays?" cost absorption.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-mono rounded-full border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/10 text-[var(--color-gold)] flex items-center gap-1.5 shadow-sm">
              <ShieldCheck size={14} />
              <span>Standard 15% Platform Commission</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
          <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
            <div className="text-[10px] text-gray-400 uppercase font-mono mb-1">Total Sales</div>
            <div className="text-sm font-bold text-white font-mono">{formatMoney(managementSummary.totalSales)}</div>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
            <div className="text-[10px] text-gray-400 uppercase font-mono mb-1">Vendor Payouts</div>
            <div className="text-sm font-bold text-amber-300 font-mono">- {formatMoney(managementSummary.totalVendorPayouts)}</div>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
            <div className="text-[10px] text-gray-400 uppercase font-mono mb-1">Gross Margin</div>
            <div className="text-sm font-bold text-emerald-400 font-mono">{formatMoney(managementSummary.grossCommission)}</div>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
            <div className="text-[10px] text-gray-400 uppercase font-mono mb-1">Promos Absorbed</div>
            <div className="text-sm font-bold text-rose-300 font-mono">- {formatMoney(managementSummary.promosAbsorbed)}</div>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
            <div className="text-[10px] text-gray-400 uppercase font-mono mb-1">Refer &amp; Earn</div>
            <div className="text-sm font-bold text-rose-300 font-mono">- {formatMoney(managementSummary.referralAbsorbed)}</div>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
            <div className="text-[10px] text-gray-400 uppercase font-mono mb-1">Super Coins</div>
            <div className="text-sm font-bold text-rose-300 font-mono">- {formatMoney(managementSummary.coinsAbsorbed)}</div>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
            <div className="text-[10px] text-gray-400 uppercase font-mono mb-1">Gateway Fees</div>
            <div className="text-sm font-bold text-rose-300 font-mono">- {formatMoney(managementSummary.gatewayAbsorbed)}</div>
          </div>
          <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
            <div className="text-[10px] text-gray-400 uppercase font-mono mb-1">Courier Costs</div>
            <div className="text-sm font-bold text-rose-300 font-mono">- {formatMoney(managementSummary.courierAbsorbed)}</div>
          </div>
        </div>

        {/* Bottom Contribution Summary Banner */}
        <div className="p-4 bg-black/80 border border-[var(--color-gold)]/30 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-mono">Gross Contribution</span>
            <div className="text-xl font-serif text-white">{formatMoney(managementSummary.grossCommission)}</div>
            <p className="text-[10px] text-gray-400 mt-0.5">Platform commission before incentive absorption</p>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-mono">Net Grand Store Contribution</span>
            <div className="text-2xl font-serif font-bold text-emerald-400">{formatMoney(managementSummary.netContribution)}</div>
            <p className="text-[10px] text-gray-400 mt-0.5">Actual retained profit after all deductions</p>
          </div>
          <div className="flex items-center justify-between md:justify-end gap-3 border-t md:border-t-0 md:border-l border-white/10 pt-2 md:pt-0 md:pl-6">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[var(--color-gold)] font-mono font-semibold">True Net Margin</span>
              <div className="text-2xl font-mono font-bold text-white">{managementSummary.netMarginPct}%</div>
            </div>
            <div className="p-2.5 rounded-full border border-[var(--color-gold)]/30 text-[var(--color-gold)] bg-[var(--color-gold)]/10">
              <ShieldCheck size={24} />
            </div>
          </div>
        </div>
      </section>

      {/* REPORT EXPORTS */}
      <section className="bg-[#111] border border-white/10 rounded-sm px-6 py-5">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-[#c9a35b] mb-1.5">
              <FileSpreadsheet size={17} />
              <span className="text-[10px] font-bold tracking-[0.18em] uppercase">Reports &amp; exports</span>
            </div>
            <h3 className="text-white font-serif text-xl">Download financial reports</h3>
            <p className="text-[#888] text-xs mt-1">Choose the full accountant workbook or a retail sales report grouped by product category.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xl:min-w-[520px]">
            <button
              type="button"
              onClick={() => exportToExcel(activeTab)}
              disabled={Boolean(exportingReport)}
              className="min-h-12 px-4 py-3 border border-white/10 bg-white/[0.03] text-left hover:border-[#c9a35b]/60 hover:bg-[#c9a35b]/[0.06] disabled:opacity-50 transition-colors flex items-center gap-3"
              title={`Download ${activeTab} report`}
            >
              {exportingReport === activeTab ? <FileSpreadsheet size={18} className="text-[#c9a35b] animate-pulse shrink-0" /> : <Layers3 size={18} className="text-[#c9a35b] shrink-0" />}
              <span>
                <strong className="block text-white text-xs font-bold uppercase tracking-wider">
                  {activeTab === 'admin_shop' && 'Admin Products Excel'}
                  {activeTab === 'vendor_shop' && 'Vendor Products Excel'}
                  {activeTab === 'shop' && 'All Products Excel'}
                  {activeTab === 'events' && 'Event Tickets Excel'}
                  {activeTab === 'auctions' && 'Auctions Excel'}
                  {activeTab === 'vendor' && 'Vendor Reg. Excel'}
                  {activeTab === 'transactions' && 'Ledger Excel'}
                </strong>
                <small className="block text-[#777] text-[10px] mt-0.5">
                  {activeTab === 'admin_shop' && 'Store-owned inventory sales & retained revenue'}
                  {activeTab === 'vendor_shop' && 'Vendor sales, 15% commissions & vendor payables'}
                  {activeTab === 'shop' && 'Category summary + all product sales'}
                  {activeTab === 'events' && 'All event bookings & payouts'}
                  {activeTab === 'auctions' && 'All auction orders & payouts'}
                  {activeTab === 'vendor' && 'Vendor registration payments'}
                  {activeTab === 'transactions' && 'Master transaction ledger'}
                </small>
              </span>
            </button>
            <button
              type="button"
              onClick={() => exportToExcel('overall')}
              disabled={Boolean(exportingReport)}
              className="min-h-12 px-4 py-3 bg-[#c9a35b] text-black text-left hover:bg-[#e1bd70] disabled:opacity-50 transition-colors flex items-center gap-3"
              title="Download the complete accountant workbook"
            >
              {exportingReport === 'overall' ? <FileSpreadsheet size={18} className="animate-pulse shrink-0" /> : <Download size={18} className="shrink-0" />}
              <span>
                <strong className="block text-xs font-bold uppercase tracking-wider">Overall Excel report</strong>
                <small className="block text-black/60 text-[10px] mt-0.5">All financial modules and ledger</small>
              </span>
            </button>
          </div>
        </div>
        {exportError && <p className="text-red-400 text-xs mt-4" role="alert">{exportError}</p>}
      </section>

      {/* ORDER FINANCIAL BREAKDOWN */}
      <div className="bg-[#111] border border-white/10 rounded-sm overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-white/10 bg-black/40 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <h3 className="text-white font-serif text-xl">Revenue Breakdown</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('admin_shop')}
              className={`px-4 py-2 text-xs font-bold tracking-wider uppercase rounded-sm transition-colors flex items-center gap-2 ${
                activeTab === 'admin_shop' ? 'bg-[#b58b38] text-black' : 'bg-white/5 text-[#888] hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>Admin Products</span>
              <span className={`px-1.5 py-0.5 text-[10px] rounded-full leading-none ${activeTab === 'admin_shop' ? 'bg-black/20 text-black font-mono font-bold' : 'bg-white/10 text-gray-300'}`}>
                {adminShopOrders.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('vendor_shop')}
              className={`px-4 py-2 text-xs font-bold tracking-wider uppercase rounded-sm transition-colors flex items-center gap-2 ${
                activeTab === 'vendor_shop' ? 'bg-[#b58b38] text-black' : 'bg-white/5 text-[#888] hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>Vendor Products</span>
              <span className={`px-1.5 py-0.5 text-[10px] rounded-full leading-none ${activeTab === 'vendor_shop' ? 'bg-black/20 text-black font-mono font-bold' : 'bg-white/10 text-gray-300'}`}>
                {vendorShopOrders.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('shop')}
              className={`px-4 py-2 text-xs font-bold tracking-wider uppercase rounded-sm transition-colors flex items-center gap-2 ${
                activeTab === 'shop' ? 'bg-[#b58b38] text-black' : 'bg-white/5 text-[#888] hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>All Purchases</span>
              <span className={`px-1.5 py-0.5 text-[10px] rounded-full leading-none ${activeTab === 'shop' ? 'bg-black/20 text-black font-mono font-bold' : 'bg-white/10 text-gray-300'}`}>
                {shopOrders.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`px-4 py-2 text-xs font-bold tracking-wider uppercase rounded-sm transition-colors ${
                activeTab === 'events' ? 'bg-[#b58b38] text-black' : 'bg-white/5 text-[#888] hover:bg-white/10 hover:text-white'
              }`}
            >
              Event Tickets
            </button>
            <button
              onClick={() => setActiveTab('auctions')}
              className={`px-4 py-2 text-xs font-bold tracking-wider uppercase rounded-sm transition-colors ${
                activeTab === 'auctions' ? 'bg-[#b58b38] text-black' : 'bg-white/5 text-[#888] hover:bg-white/10 hover:text-white'
              }`}
            >
              Auctions
            </button>
            <button
              onClick={() => setActiveTab('vendor')}
              className={`px-4 py-2 text-xs font-bold tracking-wider uppercase rounded-sm transition-colors ${
                activeTab === 'vendor' ? 'bg-[#b58b38] text-black' : 'bg-white/5 text-[#888] hover:bg-white/10 hover:text-white'
              }`}
            >
              Vendor Reg.
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-2 text-xs font-bold tracking-wider uppercase rounded-sm transition-colors ${
                activeTab === 'transactions' ? 'bg-[#b58b38] text-black' : 'bg-white/5 text-[#888] hover:bg-white/10 hover:text-white'
              }`}
            >
              Ledger
            </button>
          </div>
        </div>
        
        {/* TAB 1: ADMIN PRODUCTS */}
        {activeTab === 'admin_shop' && (
          adminShopOrders.length === 0 ? (
            <div className="p-12 text-center text-[#666]">
              <History size={48} className="mx-auto mb-4 opacity-20" />
              <p>No admin product purchases recorded yet.</p>
            </div>
          ) : (
            <div>
              <div className="px-6 py-3 bg-emerald-950/20 border-b border-emerald-500/20 text-xs text-emerald-300/90 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span>Direct store inventory listed by The Grand Store. <strong>100% of product revenue is retained</strong> with R 0,00 vendor payout deductions.</span>
                <span className="font-mono text-emerald-400 font-bold shrink-0">{adminShopOrders.length} {adminShopOrders.length === 1 ? 'Order' : 'Orders'}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-black/60 text-[#888] text-[10px] uppercase tracking-wider">
                      <th className="p-4 font-medium">Order Ref</th>
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Cart Type</th>
                      <th className="p-4 font-medium text-right">Admin Products</th>
                      <th className="p-4 font-medium text-right">Shipping</th>
                      <th className="p-4 font-medium text-right text-blue-400">Ship Margin</th>
                      <th className="p-4 font-medium text-right text-yellow-500">VAT</th>
                      <th className="p-4 font-medium text-right font-bold text-white">Total Paid</th>
                      <th className="p-4 font-medium text-right text-emerald-400 font-bold">Store Retained</th>
                      <th className="p-4 font-medium text-right text-gray-500">Vendor Payout</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-300">
                    {adminShopOrders.map(order => {
                      const details = getOrderFinancialDetails(order);
                      const retainedAmount = details.adminSubtotal + details.shippingMargin;
                      return (
                        <tr key={order._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-4 font-mono text-xs text-[#b58b38]">{order.orderId || order.transactionId}</td>
                          <td className="p-4 text-xs">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="p-4 text-xs">
                            {details.isMixed ? (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                                Mixed Cart
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                                Store Direct
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right text-xs text-white font-medium">{formatMoney(details.adminSubtotal)}</td>
                          <td className="p-4 text-right text-xs">{formatMoney(details.customerShipping)}</td>
                          <td className="p-4 text-right text-xs text-blue-400/80">{formatMoney(details.shippingMargin)}</td>
                          <td className="p-4 text-right text-xs text-yellow-500/80">{formatMoney(order.vatAmount)}</td>
                          <td className="p-4 text-right font-bold text-white">{formatMoney(order.totalPrice)}</td>
                          <td className="p-4 text-right text-xs font-bold text-emerald-400">
                            {formatMoney(retainedAmount)}
                          </td>
                          <td className="p-4 text-right text-xs text-gray-500 font-mono">
                            R 0,00
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* TAB 2: VENDOR PRODUCTS */}
        {activeTab === 'vendor_shop' && (
          vendorShopOrders.length === 0 ? (
            <div className="p-12 text-center text-[#666]">
              <History size={48} className="mx-auto mb-4 opacity-20" />
              <p>No vendor product purchases recorded yet.</p>
            </div>
          ) : (
            <div>
              <div className="px-6 py-3 bg-purple-950/20 border-b border-purple-500/20 text-xs text-purple-300/90 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span>Third-party vendor inventory sales. <strong>15% marketplace commission</strong> is deducted and the remainder is scheduled for vendor payout.</span>
                <span className="font-mono text-purple-400 font-bold shrink-0">{vendorShopOrders.length} {vendorShopOrders.length === 1 ? 'Order' : 'Orders'}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-black/60 text-[#888] text-[10px] uppercase tracking-wider">
                      <th className="p-4 font-medium">Order Ref</th>
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Cart Type</th>
                      <th className="p-4 font-medium text-right">Vendor Products</th>
                      <th className="p-4 font-medium text-right">Shipping</th>
                      <th className="p-4 font-medium text-right text-blue-400">Ship Margin</th>
                      <th className="p-4 font-medium text-right text-yellow-500">VAT</th>
                      <th className="p-4 font-medium text-right font-bold text-white">Total Paid</th>
                      <th className="p-4 font-medium text-right text-green-500 font-bold">Commission (15%)</th>
                      <th className="p-4 font-medium text-right text-red-400 font-bold">Vendor Payout</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-300">
                    {vendorShopOrders.map(order => {
                      const details = getOrderFinancialDetails(order);
                      return (
                        <tr key={order._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-4 font-mono text-xs text-[#b58b38]">{order.orderId || order.transactionId}</td>
                          <td className="p-4 text-xs">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="p-4 text-xs">
                            {details.isMixed ? (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                                Mixed Cart
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                                Vendor Only
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right text-xs text-white font-medium">{formatMoney(details.vendorSubtotal)}</td>
                          <td className="p-4 text-right text-xs">{formatMoney(details.customerShipping)}</td>
                          <td className="p-4 text-right text-xs text-blue-400/80">{formatMoney(details.shippingMargin)}</td>
                          <td className="p-4 text-right text-xs text-yellow-500/80">{formatMoney(order.vatAmount)}</td>
                          <td className="p-4 text-right font-bold text-white">{formatMoney(order.totalPrice)}</td>
                          <td className="p-4 text-right text-green-500/80 font-bold">{formatMoney(details.actualCommission)}</td>
                          <td className="p-4 text-right text-red-400/80 font-bold">{formatMoney(details.totalVendorPayout)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {/* TAB 3: ALL PURCHASES */}
        {activeTab === 'shop' && (
          shopOrders.length === 0 ? (
            <div className="p-12 text-center text-[#666]">
              <History size={48} className="mx-auto mb-4 opacity-20" />
              <p>No shop orders yet.</p>
            </div>
          ) : (
            <div>
              <div className="px-6 py-3 bg-white/[0.02] border-b border-white/10 text-xs text-[#888] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span>Unified overview of all customer store purchases across direct store inventory and vendor listings.</span>
                <span className="font-mono text-[#b58b38] font-bold shrink-0">{shopOrders.length} {shopOrders.length === 1 ? 'Order' : 'Orders'}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-black/60 text-[#888] text-[10px] uppercase tracking-wider">
                      <th className="p-4 font-medium">Order Ref</th>
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Origin</th>
                      <th className="p-4 font-medium text-right">Products</th>
                      <th className="p-4 font-medium text-right">Shipping</th>
                      <th className="p-4 font-medium text-right text-blue-400">Ship Margin</th>
                      <th className="p-4 font-medium text-right text-yellow-500">VAT</th>
                      <th className="p-4 font-medium text-right font-bold text-white">Total Paid</th>
                      <th className="p-4 font-medium text-right text-green-500">Commission</th>
                      <th className="p-4 font-medium text-right">Vendor Payout</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-300">
                    {shopOrders.map(order => {
                      const details = getOrderFinancialDetails(order);

                      return (
                        <tr key={order._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-4 font-mono text-xs text-[#b58b38]">{order.orderId || order.transactionId}</td>
                          <td className="p-4 text-xs">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="p-4 text-xs">
                            {details.isMixed ? (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                                Mixed Cart
                              </span>
                            ) : details.hasVendor ? (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                                Vendor
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                                Store Direct
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right text-xs">{formatMoney(order.subTotal)}</td>
                          <td className="p-4 text-right text-xs">{formatMoney(details.customerShipping)}</td>
                          <td className="p-4 text-right text-xs text-blue-400/80">{formatMoney(details.shippingMargin)}</td>
                          <td className="p-4 text-right text-xs text-yellow-500/80">{formatMoney(order.vatAmount)}</td>
                          <td className="p-4 text-right font-bold text-white">{formatMoney(order.totalPrice)}</td>
                          <td className="p-4 text-right text-green-500/80">
                            {details.hasVendor ? formatMoney(details.actualCommission) : <span className="text-gray-500 font-mono text-[11px]">—</span>}
                          </td>
                          <td className="p-4 text-right text-xs font-mono">
                            {details.hasVendor ? (
                              <span className="text-red-400/90">{formatMoney(details.totalVendorPayout)}</span>
                            ) : (
                              <span className="text-emerald-400/80">R 0,00 (Store)</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

        {activeTab === 'events' && (
          eventBookings.length === 0 ? (
            <div className="p-12 text-center text-[#666]">
              <History size={48} className="mx-auto mb-4 opacity-20" />
              <p>No event bookings yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-black/60 text-[#888] text-[10px] uppercase tracking-wider">
                    <th className="p-4 font-medium">Ticket Ref</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium text-right">Subtotal</th>
                    <th className="p-4 font-medium text-right text-yellow-500">VAT</th>
                    <th className="p-4 font-medium text-right font-bold text-white">Customer Paid</th>
                    <th className="p-4 font-medium text-right text-green-500">Commission</th>
                    <th className="p-4 font-medium text-right text-red-400">Organizer Payout</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-300">
                  {eventBookings.map(booking => (
                    <tr key={booking._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono text-xs text-[#b58b38]">{booking.gsReference || booking.ticketId}</td>
                      <td className="p-4 text-xs">{new Date(booking.bookingDate || booking.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="p-4 text-right text-xs">{formatMoney(booking.subTotal)}</td>
                      <td className="p-4 text-right text-xs text-yellow-500/80">{formatMoney(booking.vatAmount)}</td>
                      <td className="p-4 text-right font-bold text-white">{formatMoney(booking.totalPrice)}</td>
                      <td className="p-4 text-right text-green-500/80">{formatMoney(booking.commissionAmount)}</td>
                      <td className="p-4 text-right text-red-400/80">{formatMoney(booking.organizerPayable)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeTab === 'auctions' && (
          auctionOrders.length === 0 ? (
            <div className="p-12 text-center text-[#666]">
              <History size={48} className="mx-auto mb-4 opacity-20" />
              <p>No auction payments yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-black/60 text-[#888] text-[10px] uppercase tracking-wider">
                    <th className="p-4 font-medium">Order Ref</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium text-right">Hammer Price</th>
                    <th className="p-4 font-medium text-right text-yellow-500">VAT</th>
                    <th className="p-4 font-medium text-right font-bold text-white">Buyer Paid</th>
                    <th className="p-4 font-medium text-right text-green-500">Commission</th>
                    <th className="p-4 font-medium text-right text-red-400">Vendor Payout</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-300">
                  {auctionOrders.map(order => {
                    const totalVendorPayout = order.vendorPayables?.reduce((sum, p) => sum + (p.netPayable || 0), 0) || 0;
                    return (
                      <tr key={order._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-4 font-mono text-xs text-[#b58b38]">{order.transactionId || order.orderId}</td>
                        <td className="p-4 text-xs">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td className="p-4 text-right text-xs">{formatMoney(order.subTotal)}</td>
                        <td className="p-4 text-right text-xs text-yellow-500/80">{formatMoney(order.vatAmount)}</td>
                        <td className="p-4 text-right font-bold text-white">{formatMoney(order.totalPrice)}</td>
                        <td className="p-4 text-right text-green-500/80">{formatMoney(order.commissionAmount)}</td>
                        <td className="p-4 text-right text-red-400/80">{formatMoney(totalVendorPayout)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeTab === 'vendor' && (
          vendorPayments.length === 0 ? (
            <div className="p-12 text-center text-[#666]">
              <History size={48} className="mx-auto mb-4 opacity-20" />
              <p>No vendor registration payments yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-black/60 text-[#888] text-[10px] uppercase tracking-wider">
                    <th className="p-4 font-medium">Ref ID</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Vendor</th>
                    <th className="p-4 font-medium text-right font-bold text-white">Amount Paid</th>
                    <th className="p-4 font-medium">Gateway</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-300">
                  {vendorPayments.map(txn => (
                    <tr key={txn._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono text-xs text-[#b58b38]">{txn.gsReference || txn.reference}</td>
                      <td className="p-4 text-xs">{new Date(txn.createdAt || txn.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="p-4 text-xs">{txn.customer?.name || txn.customer?.email || txn.user?.name || txn.user?.email || 'N/A'}</td>
                      <td className="p-4 text-right font-bold text-white">{formatMoney(txn.amount)}</td>
                      <td className="p-4 text-xs text-[#888]">{txn.gateway}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {activeTab === 'transactions' && (
          transactions.length === 0 ? (
            <div className="p-12 text-center text-[#666]">
              <History size={48} className="mx-auto mb-4 opacity-20" />
              <p>No ledger transactions yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-black/60 text-[#888] text-[10px] uppercase tracking-wider">
                    <th className="p-4 font-medium">GS Reference</th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Module</th>
                    <th className="p-4 font-medium">Type</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Gross</th>
                    <th className="p-4 font-medium text-right">Net</th>
                    <th className="p-4 font-medium">Gateway</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-300">
                  {transactions.map((transaction) => (
                    <tr key={transaction._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 font-mono text-xs text-[#b58b38]">{transaction.gsReference}</td>
                      <td className="p-4 text-xs">{new Date(transaction.createdAt).toLocaleDateString('en-ZA')}</td>
                      <td className="p-4 text-xs uppercase">{transaction.module}</td>
                      <td className="p-4 text-xs uppercase">{transaction.type}</td>
                      <td className="p-4 text-xs uppercase">{transaction.status}</td>
                      <td className="p-4 text-right">{formatMoney(transaction.amount)}</td>
                      <td className="p-4 text-right">{formatMoney(transaction.netAmount)}</td>
                      <td className="p-4 text-xs">{transaction.gateway}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
