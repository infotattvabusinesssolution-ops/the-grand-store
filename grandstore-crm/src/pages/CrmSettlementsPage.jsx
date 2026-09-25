import React, { useState } from 'react';
import { 
  Wallet, Clock, CheckCircle2, AlertTriangle, FileText, 
  Download, RefreshCw, DollarSign, ArrowUpRight, Search, 
  Building2, ShieldCheck, X, Globe, Plane, MapPin, FileDown
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import { useCrmSettlements } from '../hooks/useCrmSettlements';
import { useToast } from '../context/ToastContext';
import { downloadRemittancePdf, downloadRemittanceBatchPdf } from '../utils/remittancePdfGenerator';

export default function CrmSettlementsPage() {
  const toast = useToast();
  const { stats, settlements, loading, refresh, syncOrders, processPayment, disputeSettlement } = useCrmSettlements();
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'due' | 'pending' | 'settled' | 'disputed'
  const [filterScope, setFilterScope] = useState('all'); // 'all' | 'local' | 'global_export'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [payoutModalSettlement, setPayoutModalSettlement] = useState(null);
  const [paymentRefInput, setPaymentRefInput] = useState('');
  const [popUrlInput, setPopUrlInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [disputeModalSettlement, setDisputeModalSettlement] = useState(null);
  const [disputeReasonInput, setDisputeReasonInput] = useState('');
  const [syncing, setSyncing] = useState(false);

  const filteredSettlements = settlements.filter(s => {
    const matchesFilter = 
      filterStatus === 'all' ? true :
      filterStatus === 'due' ? s.status === 'due_for_payment' :
      filterStatus === 'pending' ? s.status === 'pending_30day_window' :
      filterStatus === 'settled' ? s.status === 'settled' :
      filterStatus === 'disputed' ? (s.status === 'disputed' || s.status === 'held') : true;

    const matchesScope = 
      filterScope === 'all' ? true :
      filterScope === 'local' ? (s.orderType === 'local' || !s.orderType) :
      filterScope === 'global_export' ? s.orderType === 'global_export' : true;

    const matchesSearch = 
      (s.vendorName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (s.orderNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (s.destinationCountry?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (s.reference?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    return matchesFilter && matchesScope && matchesSearch;
  });

  const handleDownloadPdf = (settlement) => {
    try {
      const res = downloadRemittancePdf(settlement);
      toast.success(`Generated Official Remittance Advice: ${res.filename}`);
    } catch (err) {
      toast.error('Failed to generate remittance PDF: ' + (err.message || 'Error'));
    }
  };

  const handleDownloadBatchPdf = () => {
    try {
      if (filteredSettlements.length === 0) {
        toast.warning('No settlement records match current filters to export.');
        return;
      }
      const res = downloadRemittanceBatchPdf(filteredSettlements, filterScope);
      toast.success(`Exported batch remittance statement (${filteredSettlements.length} records): ${res.filename}`);
    } catch (err) {
      toast.error('Failed to export batch remittance PDF: ' + (err.message || 'Error'));
    }
  };

  const handleSyncRealOrders = async () => {
    try {
      setSyncing(true);
      const res = await syncOrders();
      toast.success(res?.message || 'Synchronized settlements from live database orders!');
    } catch (err) {
      toast.error('Failed to sync settlements: ' + (err?.response?.data?.message || err.message));
    } finally {
      setSyncing(false);
    }
  };

  const handleExportRemittanceCsv = () => {
    try {
      if (settlements.length === 0) {
        toast.warning('No settlement records to export.');
        return;
      }
      const headers = ['Settlement ID', 'Order Reference', 'Scope', 'Destination', 'Vendor / Wine Farm', 'Gross Total (ZAR)', 'VAT Rate (%)', 'Commission (15%)', 'Net Payable to Vendor', 'Payout Method', 'Maturity Due Date', 'Status', 'Payment Ref'];
      const rows = settlements.map(s => [
        `"${s.id || s.reference || ''}"`,
        `"${s.orderNumber || ''}"`,
        `"${s.orderType === 'global_export' ? 'Global Export' : 'Local Domestic'}"`,
        `"${s.destinationCountry || 'South Africa'}"`,
        `"${s.vendorName || ''}"`,
        `"${s.orderTotal || 0}"`,
        `"${s.vatRatePct !== undefined ? s.vatRatePct : 15}%"`,
        `"${s.commissionAmount || 0}"`,
        `"${s.payoutAmount || 0}"`,
        `"${s.payoutMethod || 'domestic_eft'}"`,
        `"${s.payoutDueDate ? new Date(s.payoutDueDate).toLocaleDateString() : ''}"`,
        `"${s.status || ''}"`,
        `"${s.paymentReference || ''}"`
      ]);
      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `grandstore_vendor_remittance_${filterScope}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Exported ${settlements.length} settlement records to remittance CSV.`);
    } catch (err) {
      toast.error('Failed to export remittance batch');
    }
  };

  const handleConfirmPayout = async () => {
    if (!payoutModalSettlement) return;
    try {
      const defaultPrefix = payoutModalSettlement.orderType === 'global_export' ? 'SWIFT' : 'EFT';
      await processPayment(payoutModalSettlement.id, {
        paymentReference: paymentRefInput || `${defaultPrefix}-${Date.now().toString().slice(-6)}`,
        proofOfPaymentUrl: popUrlInput,
        notes: notesInput
      });
      setPayoutModalSettlement(null);
      setPaymentRefInput('');
      setPopUrlInput('');
      setNotesInput('');
      toast.success(`Vendor payout processed successfully! Remittance voucher issued.`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to record payout');
    }
  };

  const handleConfirmDispute = async () => {
    if (!disputeModalSettlement) return;
    try {
      await disputeSettlement(disputeModalSettlement.id, disputeReasonInput || 'Delivery return or damage claim reported');
      setDisputeModalSettlement(null);
      setDisputeReasonInput('');
      toast.warning('Settlement held on dispute. 30-Day countdown timer frozen.');
    } catch (err) {
      toast.error('Failed to hold settlement');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              30-Day Vendor Settlement Tracking & Escrow
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <ShieldCheck size={13} />
              Local & Global Escrow
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Section 11 Financial Pipeline: Payouts unlock strictly 30 days post-delivery. Domestic EFT for SA wine estates (15% VAT) & SWIFT/IBAN wire with SARB SAD500 zero-rated tax exemption for international exports.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button 
            onClick={handleDownloadBatchPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
            title="Download consolidated PDF remittance report"
          >
            <FileDown size={14} />
            Download Batch PDF
          </button>
          <button 
            onClick={handleExportRemittanceCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm cursor-pointer"
          >
            <Download size={14} />
            Export CSV
          </button>
          <button 
            onClick={handleSyncRealOrders}
            disabled={syncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            title="Scan database for new delivered orders and update escrow milestones"
          >
            <RefreshCw size={14} className={syncing || loading ? 'animate-spin' : ''} />
            Sync Real Orders
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Due for Payout Now" 
          value={`R ${(stats.totalDueAmount || 0).toLocaleString()}`} 
          icon={AlertTriangle} 
          color="amber"
          subtitle={`${stats.dueCount || 0} batches matured (>30 days)`}
        />
        <StatCard 
          title="Pending (30-Day Window)" 
          value={stats.pendingCount || 0} 
          icon={Clock} 
          color="blue"
          subtitle="Inspection & claim buffer active"
        />
        <StatCard 
          title="Total Settled (30d)" 
          value={`R ${(stats.totalSettledAmount || 0).toLocaleString()}`} 
          icon={Wallet} 
          color="emerald"
          subtitle={`${stats.settledCount || 0} disbursements complete`}
        />
        <StatCard 
          title="Consignment Scope" 
          value={`${stats.localCount || 0} Local • ${stats.globalCount || 0} Export`} 
          icon={Globe} 
          color="purple"
          subtitle="Domestic SA vs Global DDP"
        />
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filters & Scope Toggles */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {[
            { id: 'all', label: 'All Records' },
            { id: 'due', label: `Due Today (${stats.dueCount || 0})` },
            { id: 'pending', label: `Pending Window (${stats.pendingCount || 0})` },
            { id: 'settled', label: `Settled (${stats.settledCount || 0})` },
            { id: 'disputed', label: `Disputed (${stats.disputedCount || 0})` }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterStatus(f.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
                filterStatus === f.id 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}

          <span className="text-slate-300 mx-1">|</span>

          {/* Scope Filters */}
          <button
            onClick={() => setFilterScope('all')}
            className={`px-2.5 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer ${
              filterScope === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            All Scopes
          </button>
          <button
            onClick={() => setFilterScope('local')}
            className={`px-2.5 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
              filterScope === 'local'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            🇿🇦 Domestic ZA
          </button>
          <button
            onClick={() => setFilterScope('global_export')}
            className={`px-2.5 py-1.5 rounded-xl font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
              filterScope === 'global_export'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
            }`}
          >
            🌍 Global Export
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search vendor, order #, country..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Settlements Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-4">Settlement Ref</th>
                <th className="py-3 px-4">Estate / Vendor</th>
                <th className="py-3 px-4">Order & Destination</th>
                <th className="py-3 px-4">Delivered Date</th>
                <th className="py-3 px-4">30-Day Milestone</th>
                <th className="py-3 px-4">Payout Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredSettlements.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-10 text-center text-slate-400">
                    No vendor settlement records match the current filter.
                  </td>
                </tr>
              ) : (
                filteredSettlements.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-900 font-mono">{s.reference}</span>
                        {s.orderType === 'global_export' ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <Plane size={10} /> Global Export
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            🇿🇦 Local (ZAR)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{s.vendorName}</div>
                      <div className="text-slate-400 text-[10px] flex items-center gap-1">
                        <span>{s.bankDetails?.bankName || 'FNB Corporate'}</span>
                        <span>•</span>
                        <span>{s.payoutMethod === 'swift_wire' ? 'SWIFT Wire' : 'Domestic EFT'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">Order #{s.orderNumber}</div>
                      <div className="text-slate-500 text-[10px] flex items-center gap-1">
                        <MapPin size={10} className="text-slate-400" />
                        <span>{s.destinationCountry || 'South Africa'}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-600">
                          {s.vatRatePct === 0 ? '0% Export Zero-Rated' : `${s.vatRatePct}% VAT`}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(s.deliveredAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      {s.status === 'settled' ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={12} /> Settled & Paid
                        </span>
                      ) : s.status === 'due_for_payment' ? (
                        <span className="text-amber-700 font-bold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <AlertTriangle size={12} /> Mature — Due Today
                        </span>
                      ) : s.status === 'disputed' || s.status === 'held' ? (
                        <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                          Disputed (Escrow Frozen)
                        </span>
                      ) : (
                        <div>
                          <div className="font-semibold text-blue-700">{s.daysLeft} Days Remaining</div>
                          <div className="text-slate-400 text-[10px]">Unlocks {new Date(s.payoutDueDate).toLocaleDateString()}</div>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        R {Number(s.payoutAmount || 0).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Gross: R {s.orderTotal?.toLocaleString()} ({s.commissionRatePct || 15}% comm)
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {s.status === 'due_for_payment' && (
                          <button
                            onClick={() => setPayoutModalSettlement(s)}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <DollarSign size={12} /> {s.orderType === 'global_export' ? 'Pay Wire' : 'Pay EFT'}
                          </button>
                        )}
                        {s.status === 'pending_30day_window' && (
                          <button
                            onClick={() => setDisputeModalSettlement(s)}
                            className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                            title="Flag customer claim or freeze payout timer"
                          >
                            Hold / Claim
                          </button>
                        )}
                        <button
                          onClick={() => handleDownloadPdf(s)}
                          className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                          title="Download Official Remittance Advice (PDF)"
                        >
                          <Download size={15} />
                        </button>
                        <button
                          onClick={() => setSelectedSettlement(s)}
                          className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="View Voucher & Escrow Breakdown"
                        >
                          <FileText size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay EFT / SWIFT Modal */}
      {payoutModalSettlement && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                Authorize {payoutModalSettlement.orderType === 'global_export' ? 'SWIFT Wire' : 'Domestic EFT'} Payout
              </h3>
              <button onClick={() => setPayoutModalSettlement(null)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            
            <p className="text-xs text-slate-500">
              Disburse 30-day matured escrow funds to {payoutModalSettlement.vendorName}
            </p>

            <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Consignment Scope:</span>
                <span className="font-semibold text-slate-900">
                  {payoutModalSettlement.orderType === 'global_export' ? '🌍 International Export' : '🇿🇦 Domestic South Africa'}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Beneficiary:</span>
                <span className="font-semibold text-slate-900">{payoutModalSettlement.vendorName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Bank / Routing:</span>
                <span>{payoutModalSettlement.bankDetails?.bankName || 'FNB Corporate'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Order Total:</span>
                <span>R {payoutModalSettlement.orderTotal?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-blue-900 font-bold text-sm pt-1 border-t border-blue-200">
                <span>Net Payable:</span>
                <span>R {payoutModalSettlement.payoutAmount?.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {payoutModalSettlement.orderType === 'global_export' ? 'SWIFT / Wire Reference Number' : 'EFT Payment Reference'}
                </label>
                <input 
                  type="text"
                  placeholder={payoutModalSettlement.orderType === 'global_export' ? 'e.g. SWIFT-2026-STB-99120' : 'e.g. EFT-2026-FNB-88412'}
                  value={paymentRefInput}
                  onChange={(e) => setPaymentRefInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Proof of Payment URL / Audit Receipt</label>
                <input 
                  type="text"
                  placeholder="https://..."
                  value={popUrlInput}
                  onChange={(e) => setPopUrlInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Internal Accountant Notes</label>
                <input 
                  type="text"
                  placeholder="Batch processed via corporate treasury..."
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => setPayoutModalSettlement(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmPayout}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm cursor-pointer"
              >
                Confirm Payout & Issue Voucher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settlement Voucher & Escrow Breakdown Modal */}
      {selectedSettlement && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">Settlement Voucher Details</h3>
                  {selectedSettlement.orderType === 'global_export' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      🌍 Global Export
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      🇿🇦 Domestic ZA
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedSettlement.reference}</p>
              </div>
              <button 
                onClick={() => setSelectedSettlement(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] block">Vendor / Wine Farm</span>
                  <span className="font-semibold text-slate-900">{selectedSettlement.vendorName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Order Reference</span>
                  <span className="font-semibold text-slate-900 font-mono">#{selectedSettlement.orderNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Destination</span>
                  <span className="font-medium text-slate-800">{selectedSettlement.destinationCountry || 'South Africa'}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Tax Treatment</span>
                  <span className="font-medium text-slate-800">
                    {selectedSettlement.vatRatePct === 0 ? '0% Export Zero-Rated (SARS SAD500)' : `${selectedSettlement.vatRatePct}% SA VAT`}
                  </span>
                </div>
                {selectedSettlement.customsDeclarationRef && (
                  <div className="col-span-2">
                    <span className="text-slate-400 text-[10px] block">Customs Clearance Reference (SARS SAD500)</span>
                    <span className="font-mono font-semibold text-purple-700">{selectedSettlement.customsDeclarationRef}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 text-[10px] block">Delivered At (POD)</span>
                  <span className="font-medium text-slate-800">{new Date(selectedSettlement.deliveredAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">30-Day Escrow Maturity</span>
                  <span className="font-medium text-slate-800">{new Date(selectedSettlement.payoutDueDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Beneficiary Banking Details */}
              {(() => {
                const bankInfo = selectedSettlement.bankDetails || selectedSettlement.bankDetailsSnapshot || {};
                return (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
                    <span className="text-slate-400 text-[10px] block font-semibold uppercase tracking-wider">Beneficiary Banking Snapshot</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Bank Name</span>
                        <span className="font-semibold text-slate-900">{bankInfo.bankName || 'Standard Bank Corporate'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Account Holder</span>
                        <span className="font-semibold text-slate-900">{bankInfo.accountHolder || selectedSettlement.vendorName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Account Number</span>
                        <span className="font-mono text-slate-800">{bankInfo.accountNumber || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">{selectedSettlement.orderType === 'global_export' ? 'SWIFT / BIC' : 'Branch Code'}</span>
                        <span className="font-mono text-slate-800">
                          {selectedSettlement.orderType === 'global_export' 
                            ? (bankInfo.swiftCode || 'SBZAJJZA') 
                            : (bankInfo.branchCode || '250655')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Real Consignment Items if available */}
              {selectedSettlement.orderItems && selectedSettlement.orderItems.length > 0 && (
                <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/70 space-y-1.5">
                  <span className="text-slate-400 text-[10px] block font-semibold uppercase tracking-wider">Consigned Product Line Items</span>
                  <div className="divide-y divide-slate-100 max-h-32 overflow-y-auto">
                    {selectedSettlement.orderItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1 text-xs text-slate-700">
                        <span>{item.quantity || item.qty || 1}x {item.name || item.title || 'Fine Wine / Spirit Item'}</span>
                        <span className="font-semibold text-slate-900 font-mono">R {((item.price || 0) * (item.quantity || item.qty || 1)).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border border-slate-200 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Order Value</span>
                  <span>R {selectedSettlement.orderTotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Platform Commission ({selectedSettlement.commissionRatePct || 15}%)</span>
                  <span>- R {selectedSettlement.commissionAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-blue-900 font-bold pt-1.5 border-t border-slate-200 text-sm">
                  <span>Net Payout Payable</span>
                  <span>R {selectedSettlement.payoutAmount?.toLocaleString()}</span>
                </div>
              </div>

              {selectedSettlement.paymentReference && (
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-emerald-900 text-xs">
                  <span className="font-semibold">Settlement Cleared:</span> Reference {selectedSettlement.paymentReference}
                </div>
              )}

              {selectedSettlement.disputeReason && (
                <div className="bg-red-50 border border-red-200 p-2.5 rounded-xl text-red-900 text-xs">
                  <span className="font-semibold">Dispute / Hold Reason:</span> {selectedSettlement.disputeReason}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedSettlement(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadPdf(selectedSettlement)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
                title="Download official PDF remittance voucher"
              >
                <Download size={13} /> Download Remittance PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Freeze / Dispute Modal */}
      {disputeModalSettlement && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Freeze Payout — Open Claim</h3>
            <p className="text-xs text-slate-500">Hold 30-day payout timer for order #{disputeModalSettlement.orderNumber}</p>

            <div className="text-xs space-y-1">
              <label className="font-semibold text-slate-700 block">Reason for Dispute / Transit Claim</label>
              <textarea 
                rows="3"
                placeholder="e.g. Client reported broken bottle during Heathrow air cargo handling; replacement dispatched..."
                value={disputeReasonInput}
                onChange={(e) => setDisputeReasonInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDisputeModalSettlement(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDispute}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm cursor-pointer"
              >
                Freeze Escrow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
