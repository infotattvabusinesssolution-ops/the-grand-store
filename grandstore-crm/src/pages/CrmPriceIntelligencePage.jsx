import React, { useState } from 'react';
import { useCrmCompetitorPrices } from '../hooks/useCrmCompetitorPrices';
import { 
  Compass, RefreshCw, ExternalLink, Search, CheckCircle2, 
  AlertTriangle, TrendingUp, TrendingDown, Minus, Calendar, 
  Download, ArrowRightLeft, ShieldCheck, Tag, ShoppingBag, 
  PackageX, Eye, Link as LinkIcon, Filter, Layers, DollarSign,
  Sparkles
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

async function getExcelJS() {
  try {
    const ExcelModule = await import('exceljs/dist/exceljs.min.js');
    return ExcelModule.default || ExcelModule;
  } catch {
    const ExcelModule = await import('exceljs');
    return ExcelModule.default || ExcelModule;
  }
}

export default function CrmPriceIntelligencePage() {
  const {
    items,
    summary,
    loading,
    syncing,
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
    triggerSync
  } = useCrmCompetitorPrices();

  const toast = useToast();
  const [activeTab, setActiveTab] = useState('comparison'); // 'comparison' | 'monthly'
  const [exportingExcel, setExportingExcel] = useState(false);

  // Format ZAR Currency
  const formatZar = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    return `R ${Number(val).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Export Monthly Data to Excel
  const handleExportMonthlyExcel = async () => {
    if (!monthlyItems || monthlyItems.length === 0) {
      toast.warning('No monthly price records available to export');
      return;
    }

    setExportingExcel(true);
    try {
      const ExcelJS = await getExcelJS();
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'The Grand Store Operations Command';

      const worksheet = workbook.addWorksheet(`NGF Price Intelligence ${selectedMonth}`);

      const headers = [
        'Product Name',
        'Competitor SKU',
        'Competitor',
        'Month',
        'Opening Price (R)',
        'Closing Price (R)',
        'Monthly Low (Min) (R)',
        'Monthly High (Max) (R)',
        'Monthly Average (R)',
        'Net Drift (R)',
        'Net Drift (%)',
        'Price Changes Count',
        'In-Stock Rate (%)',
        'Grand Store Avg (R)',
        'Variance vs GS (R)'
      ];

      worksheet.addRow(headers);

      monthlyItems.forEach(item => {
        worksheet.addRow([
          item.productName || 'Unnamed Product',
          item.competitorTrackId?.sku || 'N/A',
          item.competitorName || 'Norman Goodfellows',
          item.month,
          item.monthStartPrice || 0,
          item.monthEndPrice || 0,
          item.minPrice || 0,
          item.maxPrice || 0,
          item.averagePrice || 0,
          item.netMonthlyDriftZar || 0,
          `${item.netMonthlyDriftPercent || 0}%`,
          item.priceChangeCount || 0,
          `${item.stockAvailabilityPercent || 100}%`,
          item.grandStoreMonthlyAvg || 0,
          item.avgVarianceZar || 0
        ]);
      });

      // Style Header Row
      const headerRow = worksheet.getRow(1);
      headerRow.height = 24;
      headerRow.eachCell(cell => {
        cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E3A8A' } // Grand Store Navy
        };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      });

      // Style Data Rows
      for (let r = 2; r <= worksheet.rowCount; r++) {
        const row = worksheet.getRow(r);
        row.height = 20;
        row.eachCell((cell, colNumber) => {
          cell.font = { name: 'Calibri', size: 10 };
          cell.alignment = { vertical: 'middle' };
          if ([5, 6, 7, 8, 9, 10, 14, 15].includes(colNumber)) {
            cell.numFmt = '"R" #,##0.00';
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
          }
        });
      }

      worksheet.views = [{ state: 'frozen', ySplit: 1 }];
      worksheet.columns = [
        { width: 34 },
        { width: 16 },
        { width: 22 },
        { width: 12 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 16 },
        { width: 14 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 18 }
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `GrandStore_Competitor_Price_Intelligence_${selectedMonth}.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);

      toast.success('Monthly Price Intelligence Excel report exported successfully');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export report: ' + err.message);
    } finally {
      setExportingExcel(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Competitor Price Intelligence
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 rounded-md border border-blue-200">
              Live Feed • Norman Goodfellows (NGF.co.za)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Retail Catalog Side-by-Side: All Grand Store retail products compared with live Norman Goodfellows competitor prices
          </p>
        </div>

        <div className="flex items-center gap-3">
          {summary.lastScrapedAt && (
            <span className="text-[11px] text-slate-400 font-medium hidden md:inline-block">
              Last synced: {new Date(summary.lastScrapedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
            </span>
          )}

          <button
            onClick={() => triggerSync()}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
            title="Scan all Grand Store retail products against live ngf.co.za prices"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Scanning Retail with NGF...' : 'Run Live Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* 4 Top KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tracked Retail Products */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Retail Catalog (Admin)</p>
            <h3 className="text-2xl font-extrabold text-slate-900">{summary.totalTracked.toLocaleString()}</h3>
            <p className="text-[11px] text-slate-500">{summary.matchedCount || 0} monitored on NGF ({summary.notListedCount || 0} exclusive)</p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Compass size={22} />
          </div>
        </div>

        {/* Grand Store Cheaper (Pricing Advantage) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">GS Price Advantage</p>
            <h3 className="text-2xl font-extrabold text-emerald-600">{summary.gsCheaperCount}</h3>
            <p className="text-[11px] text-emerald-700 font-semibold">Grand Store is cheaper</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={22} />
          </div>
        </div>

        {/* Competitor Cheaper / Risk */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Competitor Undercut</p>
            <h3 className="text-2xl font-extrabold text-rose-600">{summary.gsExpensiveCount}</h3>
            <p className="text-[11px] text-rose-700 font-semibold">{summary.onSaleCount} active promos at NGF</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle size={22} />
          </div>
        </div>

        {/* Stockouts & Exclusives */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stockouts & Exclusives</p>
            <h3 className="text-2xl font-extrabold text-purple-600">{(summary.competitorOosCount || 0) + (summary.notListedCount || 0)}</h3>
            <p className="text-[11px] text-purple-700 font-semibold">{summary.notListedCount || 0} exclusive to Grand Store</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <PackageX size={22} />
          </div>
        </div>
      </div>

      {/* Main Tab Navigation Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tab Headers */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('comparison')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'comparison'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowRightLeft size={14} />
              <span>Live Vs-by-Vs Comparison</span>
              <span className="px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded-full text-[10px] font-extrabold">
                {totalCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('monthly')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'monthly'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar size={14} />
              <span>Monthly Price Summary & Drift</span>
              <span className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold">
                {selectedMonth}
              </span>
            </button>
          </div>

          {activeTab === 'monthly' && (
            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {availableMonths.map(m => (
                  <option key={m} value={m}>{m} ({m === new Date().toISOString().slice(0, 7) ? 'Current Month' : 'Past Month'})</option>
                ))}
              </select>

              <button
                onClick={handleExportMonthlyExcel}
                disabled={exportingExcel || monthlyItems.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                title="Download comprehensive monthly report to Excel"
              >
                <Download size={13} />
                <span>{exportingExcel ? 'Exporting...' : 'Export to Excel (.xlsx)'}</span>
              </button>
            </div>
          )}
        </div>

        {/* TAB 1 CONTENT: Live Vs-by-Vs Comparison */}
        {activeTab === 'comparison' && (
          <div className="p-4 space-y-4">
            {/* Filter Bar & Search */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Position Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto crm-scrollbar py-1">
                {[
                  { key: 'all', label: 'All Retail Products', badge: summary.totalTracked },
                  { key: 'matched', label: 'Matched on NGF', badge: summary.matchedCount, color: 'text-blue-700' },
                  { key: 'gs_cheaper', label: 'Grand Store Cheaper', badge: summary.gsCheaperCount, color: 'text-emerald-700' },
                  { key: 'gs_expensive', label: 'NGF Cheaper (Risk)', badge: summary.gsExpensiveCount, color: 'text-rose-700' },
                  { key: 'price_matched', label: 'Price Matched', badge: summary.priceMatchedCount },
                  { key: 'out_of_stock', label: 'NGF Out of Stock', badge: summary.competitorOosCount, color: 'text-purple-700' },
                  { key: 'not_listed', label: 'GS Exclusive / Unlisted', badge: summary.notListedCount, color: 'text-amber-700' }
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => {
                      setPositionFilter(f.key);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                      positionFilter === f.key
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    <span>{f.label}</span>
                    {f.badge !== undefined && (
                      <span className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                        positionFilter === f.key ? 'bg-slate-700 text-white' : 'bg-white ' + (f.color || 'text-slate-800')
                      }`}>
                        {f.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative min-w-[260px]">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by product, SKU, brand..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Comparison Data Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto crm-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Product Details</th>
                      <th className="py-3 px-4">Grand Store Admin Price</th>
                      <th className="py-3 px-4">NGF Live Price</th>
                      <th className="py-3 px-4">Variance (Diff)</th>
                      <th className="py-3 px-4">Market Position</th>
                      <th className="py-3 px-4">NGF Stock</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-slate-400">
                          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          Loading competitor price comparisons...
                        </td>
                      </tr>
                    ) : items.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-slate-400">
                          <Compass className="mx-auto text-slate-300 mb-2" size={32} />
                          <p className="font-bold text-slate-600">No matching products found</p>
                          <p className="text-[11px] text-slate-400 mt-1">Try adjusting your filter or click "Run Live Sync Now".</p>
                        </td>
                      </tr>
                    ) : (
                      items.map(item => {
                        return (
                          <tr key={item._id} className="hover:bg-blue-50/20 transition-colors">
                            {/* Product Name & Thumbnail (Grand Store Retail Item) */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3 min-w-[260px]">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-11 h-11 object-contain rounded-lg border border-slate-200 bg-slate-50 shrink-0 p-1"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                ) : (
                                  <div className="w-11 h-11 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 text-blue-700 font-bold text-xs">
                                    GS
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 truncate max-w-[280px]" title={item.name}>
                                    {item.name}
                                  </p>
                                  <div className="flex items-center flex-wrap gap-1.5 text-[10px] text-slate-400 mt-0.5">
                                    {item.brand && (
                                      <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                                        {item.brand}
                                      </span>
                                    )}
                                    <span>•</span>
                                    <span className="truncate max-w-[120px]">{item.category}</span>
                                    <span>•</span>
                                    <span className="text-slate-500 font-medium">Stock: {item.stock}</span>
                                    {item.hasCompetitorMatch && (
                                      <span className="text-blue-600 bg-blue-50 border border-blue-200 px-1 rounded text-[9px] font-bold truncate max-w-[160px]" title={item.competitorName}>
                                        NGF: {item.competitorName}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Grand Store Admin Retail Price */}
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">
                              <span className="text-sm font-extrabold">{formatZar(item.grandStorePrice)}</span>
                              <span className="block text-[10px] text-slate-400 font-sans font-medium">Admin Price</span>
                            </td>

                            {/* NGF Live Price */}
                            <td className="py-3 px-4 font-mono">
                              {item.hasCompetitorMatch ? (
                                <div>
                                  <span className="text-sm font-extrabold text-slate-900">
                                    {formatZar(item.competitorPrice)}
                                  </span>
                                  {item.competitorOnSale && item.competitorRegularPrice > item.competitorPrice && (
                                    <div className="flex items-center gap-1 text-[10px] mt-0.5">
                                      <span className="text-slate-400 line-through">
                                        {formatZar(item.competitorRegularPrice)}
                                      </span>
                                      <span className="px-1 py-0.2 rounded text-[9px] font-extrabold bg-rose-100 text-rose-700">
                                        PROMO
                                      </span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <span className="text-slate-400 italic font-sans text-xs">Not listed at NGF</span>
                                  <span className="block text-[10px] text-amber-600 font-semibold">GS Exclusive Advantage</span>
                                </div>
                              )}
                            </td>

                            {/* Variance (Diff) */}
                            <td className="py-3 px-4 font-mono">
                              {item.hasCompetitorMatch ? (
                                <div>
                                  <span className={`text-xs font-extrabold ${
                                    item.varianceAmountZar < -2
                                      ? 'text-emerald-600'
                                      : item.varianceAmountZar > 2
                                      ? 'text-rose-600'
                                      : 'text-slate-600'
                                  }`}>
                                    {item.varianceAmountZar > 0 ? `+${formatZar(item.varianceAmountZar)}` : formatZar(item.varianceAmountZar)}
                                  </span>
                                  <span className={`text-[10px] block font-semibold ${
                                    item.variancePercent < -0.5
                                      ? 'text-emerald-700'
                                      : item.variancePercent > 0.5
                                      ? 'text-rose-700'
                                      : 'text-slate-400 font-normal'
                                  }`}>
                                    {item.variancePercent < -0.5 
                                      ? `${Math.abs(item.variancePercent)}% cheaper`
                                      : item.variancePercent > 0.5
                                      ? `+${item.variancePercent}% higher`
                                      : 'Exact Match (0%)'}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-300 text-xs">—</span>
                              )}
                            </td>

                            {/* Market Position Badge */}
                            <td className="py-3 px-4">
                              {(!item.hasCompetitorMatch || item.marketPosition === 'not_listed') && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 shadow-xs">
                                  <Sparkles size={11} className="text-amber-600" /> GS Exclusive
                                </span>
                              )}
                              {item.hasCompetitorMatch && item.marketPosition === 'gs_cheaper' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 size={11} /> GS Cheaper
                                </span>
                              )}
                              {item.hasCompetitorMatch && item.marketPosition === 'gs_expensive' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                                  <AlertTriangle size={11} /> NGF Cheaper
                                </span>
                              )}
                              {item.hasCompetitorMatch && item.marketPosition === 'price_matched' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                  <Minus size={11} /> Price Matched
                                </span>
                              )}
                              {item.hasCompetitorMatch && item.marketPosition === 'competitor_out_of_stock' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                                  <PackageX size={11} /> NGF Out of Stock
                                </span>
                              )}
                            </td>

                            {/* NGF In-Stock Status */}
                            <td className="py-3 px-4">
                              {!item.hasCompetitorMatch ? (
                                <span className="text-slate-400 text-xs italic">Unlisted</span>
                              ) : item.competitorInStock === true ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>In Stock</span>
                                </span>
                              ) : item.competitorInStock === false ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  <span>Out of Stock</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs">—</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="py-3 px-4 text-right">
                              {item.hasCompetitorMatch && item.competitorPermalink ? (
                                <a
                                  href={item.competitorPermalink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors"
                                  title="View live product page on ngf.co.za"
                                >
                                  <ExternalLink size={12} />
                                  <span className="hidden sm:inline">View NGF</span>
                                </a>
                              ) : (
                                <a
                                  href={`https://www.ngf.co.za/?s=${encodeURIComponent(item.name)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-semibold transition-colors"
                                  title="Search product on ngf.co.za"
                                >
                                  <Search size={12} />
                                  <span className="hidden sm:inline">Search NGF</span>
                                </a>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
                  <span>Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} total)</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(p => Math.max(p - 1, 1))}
                      disabled={page === 1}
                      className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                      disabled={page === totalPages}
                      className="px-3 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2 CONTENT: Monthly Price Summary & Drift Analytics */}
        {activeTab === 'monthly' && (
          <div className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">
                  Monthly Price History & Volatility Matrix ({selectedMonth})
                </h4>
                <p className="text-[11px] text-slate-400">
                  Month-over-month price drift, lowest and highest recorded prices, and competitor stock availability
                </p>
              </div>

              <div className="relative min-w-[240px]">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter monthly products..."
                  value={monthlySearch}
                  onChange={(e) => setMonthlySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Monthly Data Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto crm-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Product Name</th>
                      <th className="py-3 px-4">Month Opening</th>
                      <th className="py-3 px-4">Month Closing</th>
                      <th className="py-3 px-4">Monthly Low / High</th>
                      <th className="py-3 px-4">Monthly Average</th>
                      <th className="py-3 px-4">Net Monthly Drift</th>
                      <th className="py-3 px-4">Price Shifts</th>
                      <th className="py-3 px-4">In-Stock Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {monthlyLoading ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-slate-400">
                          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          Loading monthly price intelligence data...
                        </td>
                      </tr>
                    ) : monthlyItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-slate-400">
                          <Calendar className="mx-auto text-slate-300 mb-2" size={32} />
                          <p className="font-bold text-slate-600">No monthly summary records for {selectedMonth}</p>
                          <p className="text-[11px] text-slate-400 mt-1">Run "Live Sync Now" to generate monthly snapshots.</p>
                        </td>
                      </tr>
                    ) : (
                      monthlyItems.map(item => (
                        <tr key={item._id} className="hover:bg-blue-50/20 transition-colors">
                          {/* Product Name */}
                          <td className="py-3 px-4 font-bold text-slate-900 min-w-[200px]">
                            {item.productName}
                            {item.competitorTrackId?.sku && (
                              <span className="block text-[10px] text-slate-400 font-mono font-normal">
                                SKU: {item.competitorTrackId.sku}
                              </span>
                            )}
                          </td>

                          {/* Opening Price */}
                          <td className="py-3 px-4 font-mono text-slate-700">
                            {formatZar(item.monthStartPrice)}
                          </td>

                          {/* Closing Price */}
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {formatZar(item.monthEndPrice)}
                          </td>

                          {/* Min / Max Range */}
                          <td className="py-3 px-4 font-mono text-[11px]">
                            <span className="text-emerald-700 font-semibold">{formatZar(item.minPrice)}</span>
                            <span className="text-slate-400 mx-1">/</span>
                            <span className="text-rose-700 font-semibold">{formatZar(item.maxPrice)}</span>
                          </td>

                          {/* Average Price */}
                          <td className="py-3 px-4 font-mono font-bold text-blue-900 bg-blue-50/40">
                            {formatZar(item.averagePrice)}
                          </td>

                          {/* Net Monthly Drift */}
                          <td className="py-3 px-4 font-mono">
                            <div className="flex items-center gap-1">
                              {item.netMonthlyDriftZar < 0 ? (
                                <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold">
                                  <TrendingDown size={13} />
                                  <span>{formatZar(item.netMonthlyDriftZar)} ({item.netMonthlyDriftPercent}%)</span>
                                </span>
                              ) : item.netMonthlyDriftZar > 0 ? (
                                <span className="inline-flex items-center gap-0.5 text-rose-700 font-bold">
                                  <TrendingUp size={13} />
                                  <span>+{formatZar(item.netMonthlyDriftZar)} (+{item.netMonthlyDriftPercent}%)</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-slate-500 font-semibold">
                                  <Minus size={13} /> Stable (0%)
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Price Shifts Count */}
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.priceChangeCount > 0 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {item.priceChangeCount} {item.priceChangeCount === 1 ? 'change' : 'changes'}
                            </span>
                          </td>

                          {/* Availability Rate */}
                          <td className="py-3 px-4 font-semibold">
                            <span className={`${
                              item.stockAvailabilityPercent >= 90
                                ? 'text-emerald-700'
                                : item.stockAvailabilityPercent >= 60
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }`}>
                              {item.stockAvailabilityPercent}% In-Stock
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
