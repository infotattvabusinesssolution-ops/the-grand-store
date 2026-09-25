import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, DollarSign, Users, Building2, Activity, Scale, ShieldCheck, 
  FileSpreadsheet, Download, Layers3, History, Search, ArrowUpRight, 
  ArrowDownRight, RefreshCw, CheckCircle2, ShoppingBag, Gavel, Calendar,
  ExternalLink, ChevronRight
} from 'lucide-react';
import { useCrmSales } from '../hooks/useCrmSales';
import { useToast } from '../context/ToastContext';
import { 
  downloadAccountingWorkbook, 
  downloadCategoryAccountingWorkbook, 
  downloadAuctionsWorkbook, 
  downloadEventsWorkbook, 
  downloadVendorWorkbook, 
  downloadLedgerWorkbook 
} from '../utils/accountingWorkbook';

export default function CrmSalesPage({ overrideSales }) {
  const toast = useToast();
  const salesHook = useCrmSales();
  const {
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
    refresh
  } = overrideSales || salesHook;

  const [activeTab, setActiveTab] = useState('admin_shop');
  const [searchTerm, setSearchTerm] = useState('');
  const [exportingReport, setExportingReport] = useState('');
  const [exportError, setExportError] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 25;

  const formatR = (v) => `R ${Number(v || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const formatMoney = (v) => `R ${Number(v || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleExport = async (reportType) => {
    try {
      setExportError('');
      setExportingReport(reportType);
      toast.info(`Preparing ${reportType.replace('_', ' ')} Excel report...`);

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
      toast.success('Excel workbook generated and downloaded successfully!');
    } catch (err) {
      console.error(err);
      setExportError('Could not create the Excel report. Please try again.');
      toast.error('Export failed: ' + (err.message || 'Error'));
    } finally {
      setExportingReport('');
    }
  };

  // Filtered dataset per active tab based on search
  const filteredData = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (activeTab === 'admin_shop') {
      return adminShopOrders.filter(o => 
        !q ||
        (o.orderId || o.transactionId || '').toLowerCase().includes(q) ||
        (o.user?.name || '').toLowerCase().includes(q) ||
        (o.user?.email || '').toLowerCase().includes(q)
      );
    }
    if (activeTab === 'vendor_shop') {
      return vendorShopOrders.filter(o => 
        !q ||
        (o.orderId || o.transactionId || '').toLowerCase().includes(q) ||
        (o.user?.name || '').toLowerCase().includes(q) ||
        (o.user?.email || '').toLowerCase().includes(q)
      );
    }
    if (activeTab === 'shop') {
      return shopOrders.filter(o => 
        !q ||
        (o.orderId || o.transactionId || '').toLowerCase().includes(q) ||
        (o.user?.name || '').toLowerCase().includes(q) ||
        (o.user?.email || '').toLowerCase().includes(q)
      );
    }
    if (activeTab === 'events') {
      return eventBookings.filter(b => 
        !q ||
        (b.gsReference || b.ticketId || '').toLowerCase().includes(q) ||
        (b.user?.name || '').toLowerCase().includes(q) ||
        (b.user?.email || '').toLowerCase().includes(q)
      );
    }
    if (activeTab === 'auctions') {
      return auctionOrders.filter(a => 
        !q ||
        (a.transactionId || a.orderId || '').toLowerCase().includes(q) ||
        (a.user?.name || '').toLowerCase().includes(q) ||
        (a.user?.email || '').toLowerCase().includes(q)
      );
    }
    if (activeTab === 'vendor') {
      return vendorPayments.filter(v => 
        !q ||
        (v.gsReference || v.reference || '').toLowerCase().includes(q) ||
        (v.user?.name || v.customer?.name || '').toLowerCase().includes(q) ||
        (v.user?.email || v.customer?.email || '').toLowerCase().includes(q)
      );
    }
    if (activeTab === 'transactions') {
      return transactions.filter(t => 
        !q ||
        (t.gsReference || t.reference || '').toLowerCase().includes(q) ||
        (t.module || '').toLowerCase().includes(q) ||
        (t.type || '').toLowerCase().includes(q) ||
        (t.description || '').toLowerCase().includes(q)
      );
    }
    return [];
  }, [activeTab, searchTerm, adminShopOrders, vendorShopOrders, shopOrders, eventBookings, auctionOrders, vendorPayments, transactions]);

  // Reset page when tab or search changes
  React.useEffect(() => {
    setPage(1);
  }, [activeTab, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const paginatedData = filteredData.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const kpis = [
    { label: "Total Platform Revenue", value: formatR(stats?.totalRevenue), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", sub: "Gross revenue across all channels" },
    { label: "Total GS Commission", value: formatR(stats?.totalCommission), icon: DollarSign, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", sub: "Earned marketplace commission" },
    { label: "Registered Users", value: (stats?.totalUsers || 0).toLocaleString(), icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100", sub: "Active customer & patron profiles" },
    { label: "Approved Vendors", value: (stats?.totalVendors || 0).toLocaleString(), icon: Building2, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", sub: "Verified wineries & brand partners" },
  ];

  if (loading && !stats && !metrics) {
    return (
      <div className="crm-page flex flex-col items-center justify-center min-h-[500px] text-center p-8">
        <div className="w-12 h-12 rounded-full border-3 border-blue-600 border-t-transparent animate-spin mb-4" />
        <h3 className="text-base font-bold text-slate-900">Loading Platform Matrix...</h3>
        <p className="text-xs text-slate-500 mt-1">Connecting to live transaction and ledger telemetry</p>
      </div>
    );
  }

  return (
    <div className="crm-page space-y-6 sm:space-y-8">
      {/* 1. STREAMLINED PAGE HEADER & REAL-TIME PULSE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
              OPERATIONAL TELEMETRY • FINANCIAL PULSE
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Platform <span className="text-blue-600">Overview</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time metrics and financial pulse of The Grand Store.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => refresh()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/50 shadow-xs transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Real-time Metrics"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-blue-600" : ""} />
            <span>{loading ? "Syncing..." : "Refresh"}</span>
          </button>

          <button
            onClick={() => handleExport('overall')}
            disabled={Boolean(exportingReport)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download size={14} />
            <span>Export Master Workbook</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => refresh()} className="font-bold underline ml-4 cursor-pointer">Retry</button>
        </div>
      )}

      {/* 2. PLATFORM KPI CARDS (4 STREAMLINED BOXES) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {kpis.map((kpi, i) => (
          <div 
            key={i} 
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {kpi.label}
              </span>
              <div className={`w-9 h-9 rounded-xl ${kpi.bg} ${kpi.color} flex items-center justify-center shrink-0`}>
                <kpi.icon size={18} />
              </div>
            </div>
            <div>
              <div className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-mono ${kpi.color}`}>
                {kpi.value || '—'}
              </div>
              <p className="text-[11px] text-slate-400 font-medium mt-1">
                {kpi.sub}
              </p>
            </div>
          </div>
        ))}
      </section>

      {/* 3. MODULE BREAKDOWN (3 STREAMLINED WHITE CARDS) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <ShoppingBag size={16} className="text-blue-600" /> Retail Shop
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Direct &amp; Vendor</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Revenue</span>
              <span className="text-sm text-slate-900 font-mono font-bold">{formatR(stats?.breakdown?.shop?.revenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Commission</span>
              <span className="text-sm text-blue-600 font-mono font-bold">{formatR(stats?.breakdown?.shop?.commission)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Gavel size={16} className="text-purple-600" /> Live Auctions
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">Hammer &amp; BP</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Revenue</span>
              <span className="text-sm text-slate-900 font-mono font-bold">{formatR(stats?.breakdown?.auctions?.revenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Commission &amp; BP</span>
              <span className="text-sm text-purple-600 font-mono font-bold">{formatR(stats?.breakdown?.auctions?.commission)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Calendar size={16} className="text-emerald-600" /> Events &amp; Experiences
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Tastings &amp; Desk</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Revenue</span>
              <span className="text-sm text-slate-900 font-mono font-bold">{formatR(stats?.breakdown?.events?.revenue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500">Commission</span>
              <span className="text-sm text-emerald-600 font-mono font-bold">{formatR(stats?.breakdown?.events?.commission)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MASTER TRANSACTION LEDGER & FINANCIAL CONTROL */}
      <section className="space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Activity className="text-blue-600" size={24} /> Master Transaction Ledger
          </h2>
          <p className="text-xs text-slate-500">
            Master overview of marketplace revenue and vendor payables based on immutable ledgers.
          </p>
        </div>

        {/* 4 FINANCIAL CONTROL METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-blue-200 transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-500 text-[11px] font-bold tracking-wider uppercase">Total Processed (Sales)</p>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">{formatMoney(metrics?.totalProcessed)}</p>
            <p className="text-slate-400 text-xs mt-1">Gross customer payments cleared</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-blue-200 transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-500 text-[11px] font-bold tracking-wider uppercase">GS Commission</p>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowUpRight size={16} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600">{formatMoney(metrics?.totalPlatformRevenue)}</p>
            <p className="text-slate-400 text-xs mt-1">Earned marketplace commissions</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-blue-200 transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-500 text-[11px] font-bold tracking-wider uppercase">VAT Collected</p>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <DollarSign size={16} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">{formatMoney(metrics?.totalVatCollected)}</p>
            <p className="text-slate-400 text-xs mt-1">VAT securely withheld &amp; tracked</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-blue-200 transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-500 text-[11px] font-bold tracking-wider uppercase">Owed to Vendors</p>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <ArrowDownRight size={16} />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">{formatMoney(metrics?.totalPendingPayables)}</p>
            <p className="text-slate-400 text-xs mt-1">Pending payables to be disbursed</p>
          </div>
        </div>

        {/* 5. SECTION 15 MANAGEMENT PROFITABILITY DASHBOARD */}
        <section className="bg-white border border-blue-200/80 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-3">
            <div>
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Scale size={18} />
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase font-mono">Executive Accounting • Section 15</span>
              </div>
              <h3 className="text-slate-900 font-extrabold text-xl sm:text-2xl">Management Profitability Dashboard</h3>
              <p className="text-slate-500 text-xs mt-1">
                True net contribution and margin health after vendor payouts, customer incentives, and "Who Pays?" cost absorption.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 text-xs font-mono font-semibold rounded-xl border border-blue-200 bg-blue-50 text-blue-700 flex items-center gap-1.5 shadow-2xs">
                <ShieldCheck size={15} />
                <span>Standard 15% Platform Commission</span>
              </span>
            </div>
          </div>

          {/* 8 DEDUCTION TILES */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl hover:border-blue-300 transition-colors">
              <div className="text-[10px] text-slate-500 uppercase font-mono font-bold mb-1">Total Sales</div>
              <div className="text-sm font-extrabold text-slate-900 font-mono">{formatMoney(managementSummary.totalSales)}</div>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl hover:border-amber-300 transition-colors">
              <div className="text-[10px] text-slate-500 uppercase font-mono font-bold mb-1">Vendor Payouts</div>
              <div className="text-sm font-extrabold text-amber-600 font-mono">- {formatMoney(managementSummary.totalVendorPayouts)}</div>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl hover:border-emerald-300 transition-colors">
              <div className="text-[10px] text-slate-500 uppercase font-mono font-bold mb-1">Gross Margin</div>
              <div className="text-sm font-extrabold text-emerald-600 font-mono">{formatMoney(managementSummary.grossCommission)}</div>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl hover:border-rose-300 transition-colors">
              <div className="text-[10px] text-slate-500 uppercase font-mono font-bold mb-1">Promos Absorbed</div>
              <div className="text-sm font-extrabold text-rose-600 font-mono">- {formatMoney(managementSummary.promosAbsorbed)}</div>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl hover:border-rose-300 transition-colors">
              <div className="text-[10px] text-slate-500 uppercase font-mono font-bold mb-1">Refer &amp; Earn</div>
              <div className="text-sm font-extrabold text-rose-600 font-mono">- {formatMoney(managementSummary.referralAbsorbed)}</div>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl hover:border-rose-300 transition-colors">
              <div className="text-[10px] text-slate-500 uppercase font-mono font-bold mb-1">Super Coins</div>
              <div className="text-sm font-extrabold text-rose-600 font-mono">- {formatMoney(managementSummary.coinsAbsorbed)}</div>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl hover:border-rose-300 transition-colors">
              <div className="text-[10px] text-slate-500 uppercase font-mono font-bold mb-1">Gateway Fees</div>
              <div className="text-sm font-extrabold text-rose-600 font-mono">- {formatMoney(managementSummary.gatewayAbsorbed)}</div>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl hover:border-rose-300 transition-colors">
              <div className="text-[10px] text-slate-500 uppercase font-mono font-bold mb-1">Courier Costs</div>
              <div className="text-sm font-extrabold text-rose-600 font-mono">- {formatMoney(managementSummary.courierAbsorbed)}</div>
            </div>
          </div>

          {/* STREAMLINED CONTRIBUTION BANNER */}
          <div className="p-5 bg-gradient-to-r from-slate-900 via-blue-950 to-blue-900 text-white rounded-xl grid grid-cols-1 md:grid-cols-3 gap-5 items-center shadow-md">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono">Gross Contribution</span>
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-white mt-0.5">{formatMoney(managementSummary.grossCommission)}</div>
              <p className="text-[11px] text-slate-400 mt-1">Platform commission before incentive absorption</p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-mono">Net Grand Store Contribution</span>
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 mt-0.5">{formatMoney(managementSummary.netContribution)}</div>
              <p className="text-[11px] text-slate-300 mt-1">Actual retained profit after all deductions</p>
            </div>
            <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 md:border-l border-white/10 pt-3 md:pt-0 md:pl-6">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-blue-300 font-mono font-semibold">True Net Margin</span>
                <div className="text-2xl sm:text-3xl font-mono font-extrabold text-white mt-0.5">{managementSummary.netMarginPct}%</div>
              </div>
              <div className="p-3 rounded-xl border border-blue-400/30 text-blue-300 bg-blue-500/10 shrink-0">
                <ShieldCheck size={28} />
              </div>
            </div>
          </div>
        </section>

        {/* 6. REPORTS & EXPORTS SUITE */}
        <section className="bg-white border border-slate-200 rounded-2xl px-6 py-5 shadow-sm">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <FileSpreadsheet size={18} />
                <span className="text-[10px] font-bold tracking-[0.18em] uppercase">Reports &amp; exports</span>
              </div>
              <h3 className="text-slate-900 font-bold text-lg sm:text-xl">Download financial reports</h3>
              <p className="text-slate-500 text-xs mt-0.5">Choose the full accountant workbook or a retail sales report grouped by product category.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xl:min-w-[540px]">
              <button
                type="button"
                onClick={() => handleExport(activeTab)}
                disabled={Boolean(exportingReport)}
                className="min-h-12 px-4 py-3 border border-slate-200 bg-slate-50 hover:bg-blue-50/60 hover:border-blue-300 text-left rounded-xl transition-all flex items-center gap-3 cursor-pointer disabled:opacity-50"
                title={`Download ${activeTab} report`}
              >
                {exportingReport === activeTab ? <FileSpreadsheet size={20} className="text-blue-600 animate-pulse shrink-0" /> : <Layers3 size={20} className="text-blue-600 shrink-0" />}
                <span>
                  <strong className="block text-slate-800 text-xs font-bold uppercase tracking-wider">
                    {activeTab === 'admin_shop' && 'Admin Products Excel'}
                    {activeTab === 'vendor_shop' && 'Vendor Products Excel'}
                    {activeTab === 'shop' && 'All Products Excel'}
                    {activeTab === 'events' && 'Event Tickets Excel'}
                    {activeTab === 'auctions' && 'Auctions Excel'}
                    {activeTab === 'vendor' && 'Vendor Reg. Excel'}
                    {activeTab === 'transactions' && 'Ledger Excel'}
                  </strong>
                  <small className="block text-slate-500 text-[10px] mt-0.5">
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
                onClick={() => handleExport('overall')}
                disabled={Boolean(exportingReport)}
                className="min-h-12 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all flex items-center gap-3 cursor-pointer disabled:opacity-50"
                title="Download the complete accountant workbook"
              >
                {exportingReport === 'overall' ? <FileSpreadsheet size={20} className="animate-pulse shrink-0 text-white" /> : <Download size={20} className="shrink-0 text-white" />}
                <span>
                  <strong className="block text-xs font-bold uppercase tracking-wider text-white">Overall Excel report</strong>
                  <small className="block text-blue-100 text-[10px] mt-0.5">All financial modules and master ledger</small>
                </span>
              </button>
            </div>
          </div>
          {exportError && <p className="text-rose-600 text-xs mt-3 font-medium" role="alert">{exportError}</p>}
        </section>

        {/* 7. REVENUE BREAKDOWN MULTI-TAB INTERACTIVE TABLES */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h3 className="text-slate-900 font-bold text-lg">Revenue Breakdown</h3>
              <p className="text-xs text-slate-500 mt-0.5">Interactive drilldown across direct orders, vendor sales, tickets, and ledgers</p>
            </div>

            {/* TAB BUTTONS WITH COUNT CHIPS */}
            <div className="flex flex-wrap gap-1.5 bg-slate-200/60 p-1 rounded-xl">
              {[
                { id: 'admin_shop', label: 'Admin Products', count: adminShopOrders.length },
                { id: 'vendor_shop', label: 'Vendor Products', count: vendorShopOrders.length },
                { id: 'shop', label: 'All Purchases', count: shopOrders.length },
                { id: 'events', label: 'Event Tickets', count: eventBookings.length },
                { id: 'auctions', label: 'Auctions', count: auctionOrders.length },
                { id: 'vendor', label: 'Vendor Reg.', count: vendorPayments.length },
                { id: 'transactions', label: 'Ledger', count: transactions.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-bold tracking-wider uppercase rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeTab === tab.id 
                      ? 'bg-white text-blue-600 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono leading-tight ${
                    activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-300/60 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* SEARCH & FILTER CONTROLS */}
          <div className="px-5 py-3 border-b border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search reference, customer, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <span>Showing <strong>{filteredData.length}</strong> {filteredData.length === 1 ? 'record' : 'records'}</span>
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="text-blue-600 hover:underline cursor-pointer text-[11px] font-semibold">
                  Clear search
                </button>
              )}
            </div>
          </div>

          {/* TAB 1: ADMIN PRODUCTS */}
          {activeTab === 'admin_shop' && (
            <div>
              <div className="px-5 py-2.5 bg-emerald-50/70 border-b border-emerald-100 text-xs text-emerald-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span>Direct store inventory listed by The Grand Store. <strong>100% of product revenue is retained</strong> with R 0,00 vendor payout deductions.</span>
                <span className="font-mono text-emerald-700 font-bold shrink-0">{adminShopOrders.length} {adminShopOrders.length === 1 ? 'Order' : 'Orders'}</span>
              </div>
              {filteredData.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <History size={40} className="mx-auto mb-3 opacity-30 text-slate-500" />
                  <p className="text-xs font-medium">No admin product purchases recorded yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                        <th className="p-4">Order Ref</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Cart Type</th>
                        <th className="p-4 text-right">Admin Products</th>
                        <th className="p-4 text-right">Shipping</th>
                        <th className="p-4 text-right text-blue-600">Ship Margin</th>
                        <th className="p-4 text-right text-amber-600">VAT</th>
                        <th className="p-4 text-right text-slate-900 font-bold">Total Paid</th>
                        <th className="p-4 text-right text-emerald-600 font-bold">Store Retained</th>
                        <th className="p-4 text-right text-slate-400">Vendor Payout</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs text-slate-700 divide-y divide-slate-100 font-mono">
                      {paginatedData.map((order) => {
                        const details = getOrderFinancialDetails(order);
                        const retainedAmount = details.adminSubtotal + details.shippingMargin;
                        return (
                          <tr key={order._id} className="hover:bg-blue-50/40 transition-colors">
                            <td className="p-4 font-bold text-blue-600">{order.orderId || order.transactionId}</td>
                            <td className="p-4 text-slate-500">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td className="p-4 font-sans font-medium text-slate-800">{order.user?.name || order.user?.email || 'Patron'}</td>
                            <td className="p-4 font-sans">
                              {details.isMixed ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Mixed Cart</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Store Direct</span>
                              )}
                            </td>
                            <td className="p-4 text-right text-slate-900 font-semibold">{formatMoney(details.adminSubtotal)}</td>
                            <td className="p-4 text-right text-slate-500">{formatMoney(details.customerShipping)}</td>
                            <td className="p-4 text-right text-blue-600 font-medium">{formatMoney(details.shippingMargin)}</td>
                            <td className="p-4 text-right text-amber-600 font-medium">{formatMoney(order.vatAmount)}</td>
                            <td className="p-4 text-right font-extrabold text-slate-900">{formatMoney(order.totalPrice)}</td>
                            <td className="p-4 text-right font-extrabold text-emerald-600">{formatMoney(retainedAmount)}</td>
                            <td className="p-4 text-right text-slate-400 font-mono">R 0,00</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VENDOR PRODUCTS */}
          {activeTab === 'vendor_shop' && (
            <div>
              <div className="px-5 py-2.5 bg-purple-50/70 border-b border-purple-100 text-xs text-purple-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span>Third-party vendor inventory sales. <strong>15% marketplace commission</strong> is deducted and the remainder is scheduled for vendor payout.</span>
                <span className="font-mono text-purple-700 font-bold shrink-0">{vendorShopOrders.length} {vendorShopOrders.length === 1 ? 'Order' : 'Orders'}</span>
              </div>
              {filteredData.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <History size={40} className="mx-auto mb-3 opacity-30 text-slate-500" />
                  <p className="text-xs font-medium">No vendor product purchases recorded yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                        <th className="p-4">Order Ref</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4">Cart Type</th>
                        <th className="p-4 text-right">Vendor Products</th>
                        <th className="p-4 text-right">Shipping</th>
                        <th className="p-4 text-right text-blue-600">Ship Margin</th>
                        <th className="p-4 text-right text-amber-600">VAT</th>
                        <th className="p-4 text-right text-slate-900 font-bold">Total Paid</th>
                        <th className="p-4 text-right text-blue-600 font-bold">Commission (15%)</th>
                        <th className="p-4 text-right text-rose-600 font-bold">Vendor Payout</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs text-slate-700 divide-y divide-slate-100 font-mono">
                      {paginatedData.map((order) => {
                        const details = getOrderFinancialDetails(order);
                        return (
                          <tr key={order._id} className="hover:bg-blue-50/40 transition-colors">
                            <td className="p-4 font-bold text-blue-600">{order.orderId || order.transactionId}</td>
                            <td className="p-4 text-slate-500">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td className="p-4 font-sans font-medium text-slate-800">{order.user?.name || order.user?.email || 'Patron'}</td>
                            <td className="p-4 font-sans">
                              {details.isMixed ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Mixed Cart</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">Vendor Only</span>
                              )}
                            </td>
                            <td className="p-4 text-right text-slate-900 font-semibold">{formatMoney(details.vendorSubtotal)}</td>
                            <td className="p-4 text-right text-slate-500">{formatMoney(details.customerShipping)}</td>
                            <td className="p-4 text-right text-blue-600 font-medium">{formatMoney(details.shippingMargin)}</td>
                            <td className="p-4 text-right text-amber-600 font-medium">{formatMoney(order.vatAmount)}</td>
                            <td className="p-4 text-right font-extrabold text-slate-900">{formatMoney(order.totalPrice)}</td>
                            <td className="p-4 text-right font-extrabold text-blue-600">{formatMoney(details.actualCommission)}</td>
                            <td className="p-4 text-right font-extrabold text-rose-600">{formatMoney(details.totalVendorPayout)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ALL PURCHASES */}
          {activeTab === 'shop' && (
            <div>
              <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span>Unified overview of all customer store purchases across direct store inventory and vendor listings.</span>
                <span className="font-mono text-slate-700 font-bold shrink-0">{shopOrders.length} {shopOrders.length === 1 ? 'Order' : 'Orders'}</span>
              </div>
              {filteredData.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <History size={40} className="mx-auto mb-3 opacity-30 text-slate-500" />
                  <p className="text-xs font-medium">No shop orders yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                        <th className="p-4">Order Ref</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Origin</th>
                        <th className="p-4 text-right">Products</th>
                        <th className="p-4 text-right">Shipping</th>
                        <th className="p-4 text-right text-blue-600">Ship Margin</th>
                        <th className="p-4 text-right text-amber-600">VAT</th>
                        <th className="p-4 text-right text-slate-900 font-bold">Total Paid</th>
                        <th className="p-4 text-right text-blue-600 font-bold">Commission</th>
                        <th className="p-4 text-right">Vendor Payout</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs text-slate-700 divide-y divide-slate-100 font-mono">
                      {paginatedData.map((order) => {
                        const details = getOrderFinancialDetails(order);
                        return (
                          <tr key={order._id} className="hover:bg-blue-50/40 transition-colors">
                            <td className="p-4 font-bold text-blue-600">{order.orderId || order.transactionId}</td>
                            <td className="p-4 text-slate-500">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td className="p-4 font-sans">
                              {details.isMixed ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Mixed Cart</span>
                              ) : details.hasVendor ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">Vendor</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Store Direct</span>
                              )}
                            </td>
                            <td className="p-4 text-right text-slate-900 font-semibold">{formatMoney(order.subTotal)}</td>
                            <td className="p-4 text-right text-slate-500">{formatMoney(details.customerShipping)}</td>
                            <td className="p-4 text-right text-blue-600 font-medium">{formatMoney(details.shippingMargin)}</td>
                            <td className="p-4 text-right text-amber-600 font-medium">{formatMoney(order.vatAmount)}</td>
                            <td className="p-4 text-right font-extrabold text-slate-900">{formatMoney(order.totalPrice)}</td>
                            <td className="p-4 text-right font-bold text-blue-600">
                              {details.hasVendor ? formatMoney(details.actualCommission) : <span className="text-slate-400 font-mono">—</span>}
                            </td>
                            <td className="p-4 text-right font-bold font-mono">
                              {details.hasVendor ? (
                                <span className="text-rose-600">{formatMoney(details.totalVendorPayout)}</span>
                              ) : (
                                <span className="text-emerald-600">R 0,00 (Store)</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EVENT TICKETS */}
          {activeTab === 'events' && (
            <div>
              <div className="px-5 py-2.5 bg-emerald-50/70 border-b border-emerald-100 text-xs text-emerald-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span>Master register of tasting events, masterclasses, and experience ticket sales.</span>
                <span className="font-mono text-emerald-700 font-bold shrink-0">{eventBookings.length} {eventBookings.length === 1 ? 'Booking' : 'Bookings'}</span>
              </div>
              {filteredData.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <History size={40} className="mx-auto mb-3 opacity-30 text-slate-500" />
                  <p className="text-xs font-medium">No event bookings yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                        <th className="p-4">Ticket Ref</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Customer</th>
                        <th className="p-4 text-right">Subtotal</th>
                        <th className="p-4 text-right text-amber-600">VAT</th>
                        <th className="p-4 text-right text-slate-900 font-bold">Customer Paid</th>
                        <th className="p-4 text-right text-blue-600 font-bold">Commission</th>
                        <th className="p-4 text-right text-rose-600 font-bold">Organizer Payout</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs text-slate-700 divide-y divide-slate-100 font-mono">
                      {paginatedData.map((booking) => (
                        <tr key={booking._id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="p-4 font-bold text-blue-600">{booking.gsReference || booking.ticketId}</td>
                          <td className="p-4 text-slate-500">{new Date(booking.bookingDate || booking.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="p-4 font-sans font-medium text-slate-800">{booking.user?.name || booking.user?.email || 'Patron'}</td>
                          <td className="p-4 text-right text-slate-900 font-semibold">{formatMoney(booking.subTotal)}</td>
                          <td className="p-4 text-right text-amber-600 font-medium">{formatMoney(booking.vatAmount)}</td>
                          <td className="p-4 text-right font-extrabold text-slate-900">{formatMoney(booking.totalPrice)}</td>
                          <td className="p-4 text-right font-bold text-blue-600">{formatMoney(booking.commissionAmount)}</td>
                          <td className="p-4 text-right font-bold text-rose-600">{formatMoney(booking.organizerPayable)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: AUCTIONS */}
          {activeTab === 'auctions' && (
            <div>
              <div className="px-5 py-2.5 bg-purple-50/70 border-b border-purple-100 text-xs text-purple-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span>Completed live auction orders, hammer settlements, and buyer premiums.</span>
                <span className="font-mono text-purple-700 font-bold shrink-0">{auctionOrders.length} {auctionOrders.length === 1 ? 'Order' : 'Orders'}</span>
              </div>
              {filteredData.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <History size={40} className="mx-auto mb-3 opacity-30 text-slate-500" />
                  <p className="text-xs font-medium">No auction payments yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                        <th className="p-4">Order Ref</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Bidder</th>
                        <th className="p-4 text-right">Hammer Price</th>
                        <th className="p-4 text-right text-amber-600">VAT</th>
                        <th className="p-4 text-right text-slate-900 font-bold">Buyer Paid</th>
                        <th className="p-4 text-right text-blue-600 font-bold">Commission</th>
                        <th className="p-4 text-right text-rose-600 font-bold">Vendor Payout</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs text-slate-700 divide-y divide-slate-100 font-mono">
                      {paginatedData.map((order) => {
                        const totalVendorPayout = order.vendorPayables?.reduce((sum, p) => sum + (p.netPayable || 0), 0) || 0;
                        return (
                          <tr key={order._id} className="hover:bg-blue-50/40 transition-colors">
                            <td className="p-4 font-bold text-blue-600">{order.transactionId || order.orderId}</td>
                            <td className="p-4 text-slate-500">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                            <td className="p-4 font-sans font-medium text-slate-800">{order.user?.name || order.user?.email || 'Bidder'}</td>
                            <td className="p-4 text-right text-slate-900 font-semibold">{formatMoney(order.subTotal)}</td>
                            <td className="p-4 text-right text-amber-600 font-medium">{formatMoney(order.vatAmount)}</td>
                            <td className="p-4 text-right font-extrabold text-slate-900">{formatMoney(order.totalPrice)}</td>
                            <td className="p-4 text-right font-bold text-blue-600">{formatMoney(order.commissionAmount)}</td>
                            <td className="p-4 text-right font-bold text-rose-600">{formatMoney(totalVendorPayout)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: VENDOR REGISTRATION */}
          {activeTab === 'vendor' && (
            <div>
              <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span>Vendor registration, academy onboarding, and platform maintenance fee receipts.</span>
                <span className="font-mono text-slate-700 font-bold shrink-0">{vendorPayments.length} {vendorPayments.length === 1 ? 'Payment' : 'Payments'}</span>
              </div>
              {filteredData.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <History size={40} className="mx-auto mb-3 opacity-30 text-slate-500" />
                  <p className="text-xs font-medium">No vendor registration receipts recorded yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                        <th className="p-4">Reference</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Vendor Partner</th>
                        <th className="p-4">Description</th>
                        <th className="p-4">Gateway</th>
                        <th className="p-4 text-right text-slate-900 font-bold">Amount Paid</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs text-slate-700 divide-y divide-slate-100 font-mono">
                      {paginatedData.map((v) => (
                        <tr key={v._id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="p-4 font-bold text-blue-600">{v.gsReference || v.reference || v._id}</td>
                          <td className="p-4 text-slate-500">{new Date(v.createdAt || v.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="p-4 font-sans font-medium text-slate-800">{v.user?.name || v.customer?.name || 'Partner'}</td>
                          <td className="p-4 font-sans text-slate-600">{v.description || 'Vendor Membership'}</td>
                          <td className="p-4 font-sans capitalize text-slate-500">{v.gateway || 'PayFast'}</td>
                          <td className="p-4 text-right font-extrabold text-emerald-600">{formatMoney(v.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: MASTER TRANSACTION LEDGER */}
          {activeTab === 'transactions' && (
            <div>
              <div className="px-5 py-2.5 bg-blue-50/70 border-b border-blue-100 text-xs text-blue-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span>Immutable double-entry transaction record across retail, payouts, fees, and settlements.</span>
                <span className="font-mono text-blue-700 font-bold shrink-0">{transactions.length} {transactions.length === 1 ? 'Transaction' : 'Transactions'}</span>
              </div>
              {filteredData.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <History size={40} className="mx-auto mb-3 opacity-30 text-slate-500" />
                  <p className="text-xs font-medium">No ledger transactions recorded yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                        <th className="p-4">GS Reference</th>
                        <th className="p-4">Date</th>
                        <th className="p-4">Module</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Gross Amount</th>
                        <th className="p-4 text-right text-blue-600 font-bold">Net Amount</th>
                      </tr>
                    </thead>
                    <tbody className="text-xs text-slate-700 divide-y divide-slate-100 font-mono">
                      {paginatedData.map((t) => (
                        <tr key={t._id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="p-4 font-bold text-blue-600">{t.gsReference || t.reference || t._id}</td>
                          <td className="p-4 text-slate-500">{new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="p-4 font-sans capitalize text-slate-800 font-medium">{t.module || 'Store'}</td>
                          <td className="p-4 font-sans capitalize text-slate-600">{t.type || 'Payment'}</td>
                          <td className="p-4 font-sans">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 capitalize">
                              {t.status || 'Cleared'}
                            </span>
                          </td>
                          <td className="p-4 text-right text-slate-900 font-semibold">{formatMoney(t.amount)}</td>
                          <td className="p-4 text-right font-extrabold text-blue-600">{formatMoney(t.netAmount || t.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* PAGINATION CONTROLS */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600">
              <span>Page <strong>{page}</strong> of <strong>{totalPages}</strong></span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
