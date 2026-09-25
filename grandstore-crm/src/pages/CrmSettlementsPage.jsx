import React, { useState } from 'react';
import { 
  Wallet, Clock, CheckCircle2, AlertTriangle, FileText, 
  Download, RefreshCw, DollarSign, ArrowUpRight, Search, 
  Building2, ShieldCheck, X 
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import { useCrmSettlements } from '../hooks/useCrmSettlements';
import { useToast } from '../context/ToastContext';

export default function CrmSettlementsPage() {
  const toast = useToast();
  const { stats, settlements, loading, refresh, processPayment, disputeSettlement } = useCrmSettlements();
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'due' | 'pending' | 'settled' | 'disputed'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [payoutModalSettlement, setPayoutModalSettlement] = useState(null);
  const [paymentRefInput, setPaymentRefInput] = useState('');
  const [popUrlInput, setPopUrlInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [disputeModalSettlement, setDisputeModalSettlement] = useState(null);
  const [disputeReasonInput, setDisputeReasonInput] = useState('');

  const filteredSettlements = settlements.filter(s => {
    const matchesFilter = 
      filterStatus === 'all' ? true :
      filterStatus === 'due' ? s.status === 'due_for_payment' :
      filterStatus === 'pending' ? s.status === 'pending_30day_window' :
      filterStatus === 'settled' ? s.status === 'settled' :
      filterStatus === 'disputed' ? (s.status === 'disputed' || s.status === 'held') : true;

    const matchesSearch = 
      (s.vendorName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (s.orderNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (s.reference?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleExportRemittanceCsv = () => {
    try {
      if (settlements.length === 0) {
        toast.warning('No settlement records to export.');
        return;
      }
      const headers = ['Settlement ID', 'Order Reference', 'Vendor / Wine Farm', 'Gross Total (ZAR)', 'Commission (15%)', 'Net Payable to Vendor', 'Maturity Due Date', 'Status', 'Payment Ref'];
      const rows = settlements.map(s => [
        `"${s.id || s.reference || ''}"`,
        `"${s.orderNumber || ''}"`,
        `"${s.vendorName || ''}"`,
        `"${s.orderTotal || 0}"`,
        `"${s.commissionAmount || 0}"`,
        `"${s.netPayoutAmount || 0}"`,
        `"${s.dueDate ? new Date(s.dueDate).toLocaleDateString() : ''}"`,
        `"${s.status || ''}"`,
        `"${s.paymentReference || ''}"`
      ]);
      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `grandstore_vendor_remittance_batch_${new Date().toISOString().slice(0, 10)}.csv`);
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
      await processPayment(payoutModalSettlement.id, {
        paymentReference: paymentRefInput || `EFT-${Date.now().toString().slice(-6)}`,
        proofOfPaymentUrl: popUrlInput,
        notes: notesInput
      });
      setPayoutModalSettlement(null);
      setPaymentRefInput('');
      setPopUrlInput('');
      setNotesInput('');
      toast.success('Vendor settlement payout recorded successfully! Remittance voucher generated.');
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
              30-Day Vendor Settlement Tracking
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <ShieldCheck size={13} />
              Zero-Duplicate Safeguard
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Section 11 Financial Pipeline: Payouts unlock strictly 30 days post-delivery to allow customer inspection and dispute buffers.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button 
            onClick={handleExportRemittanceCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm cursor-pointer"
          >
            <Download size={14} />
            Export Remittance Batch (CSV)
          </button>
          <button 
            onClick={refresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Sync Milestones
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
          subtitle={`${stats.dueCount || 0} batches matured`}
        />
        <StatCard 
          title="Pending (30-Day Clock)" 
          value={stats.pendingCount || 0} 
          icon={Clock} 
          color="blue"
          subtitle="Inspection window active"
        />
        <StatCard 
          title="Total Settled (30d)" 
          value={`R ${(stats.totalSettledAmount || 0).toLocaleString()}`} 
          icon={Wallet} 
          color="emerald"
          subtitle={`${stats.settledCount || 0} vendor transfers complete`}
        />
        <StatCard 
          title="Disputes & Holds" 
          value={stats.disputedCount || 0} 
          icon={ShieldCheck} 
          color="red"
          subtitle="Claims or returns pending"
        />
      </div>

      {/* Controls & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
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
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                filterStatus === f.id 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search vendor, order #, ref..."
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
                <th className="py-3 px-4">Order Details</th>
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
                      <span className="font-semibold text-slate-900 font-mono">{s.reference}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{s.vendorName}</div>
                      <div className="text-slate-400 text-[10px]">{s.bankDetails?.bankName || 'FNB'} • Acc ending in {s.bankDetails?.accountNumber?.slice(-4) || '••••'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">Order #{s.orderNumber}</div>
                      <div className="text-slate-400 text-[10px]">Gross: R {s.orderTotal?.toLocaleString()}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(s.deliveredAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      {s.status === 'settled' ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={12} /> Settled
                        </span>
                      ) : s.status === 'due_for_payment' ? (
                        <span className="text-amber-700 font-bold flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          <AlertTriangle size={12} /> Mature — Due Today
                        </span>
                      ) : s.status === 'disputed' ? (
                        <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
                          Disputed ({s.disputeReason || 'Frozen'})
                        </span>
                      ) : (
                        <div>
                          <div className="font-semibold text-blue-700">{s.daysLeft} Days Remaining</div>
                          <div className="text-slate-400 text-[10px]">Unlocks {new Date(s.payoutDueDate).toLocaleDateString()}</div>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      R {Number(s.payoutAmount || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {s.status === 'due_for_payment' && (
                          <button
                            onClick={() => setPayoutModalSettlement(s)}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-1"
                          >
                            <DollarSign size={12} /> Pay EFT
                          </button>
                        )}
                        {s.status === 'pending_30day_window' && (
                          <button
                            onClick={() => setDisputeModalSettlement(s)}
                            className="px-2 py-1 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg border border-slate-200 transition-colors"
                            title="Flag return / dispute"
                          >
                            Dispute
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedSettlement(s)}
                          className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                          title="View Voucher"
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

      {/* Pay EFT Modal */}
      {payoutModalSettlement && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Authorize Vendor Payout</h3>
            <p className="text-xs text-slate-500">Record banking EFT transfer for {payoutModalSettlement.vendorName}</p>

            <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Vendor:</span>
                <span className="font-semibold text-slate-900">{payoutModalSettlement.vendorName}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Order Total:</span>
                <span>R {payoutModalSettlement.orderTotal?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-blue-900 font-bold text-sm pt-1 border-t border-blue-200">
                <span>Payout Amount:</span>
                <span>R {payoutModalSettlement.payoutAmount?.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">EFT / Wire Payment Reference</label>
                <input 
                  type="text"
                  placeholder="e.g. EFT-2026-FNB-88412"
                  value={paymentRefInput}
                  onChange={(e) => setPaymentRefInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Proof of Payment URL / Doc Link</label>
                <input 
                  type="text"
                  placeholder="https://..."
                  value={popUrlInput}
                  onChange={(e) => setPopUrlInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Internal Note</label>
                <input 
                  type="text"
                  placeholder="Batch processed via Standard Bank portal..."
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setPayoutModalSettlement(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayout}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
              >
                Mark Paid & Lock Voucher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remittance Voucher Modal */}
      {selectedSettlement && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Remittance Voucher</h3>
                <p className="text-xs text-slate-500 font-mono">{selectedSettlement.reference}</p>
              </div>
              <button 
                onClick={() => setSelectedSettlement(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 text-[10px] block">Vendor</span>
                  <span className="font-semibold text-slate-900">{selectedSettlement.vendorName}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Order Number</span>
                  <span className="font-semibold text-slate-900">#{selectedSettlement.orderNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Delivered At</span>
                  <span className="font-medium text-slate-800">{new Date(selectedSettlement.deliveredAt).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Milestone Due Date</span>
                  <span className="font-medium text-slate-800">{new Date(selectedSettlement.payoutDueDate).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Order Value</span>
                  <span>R {selectedSettlement.orderTotal?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Platform Commission (15%)</span>
                  <span>- R {selectedSettlement.commissionAmount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-blue-900 font-bold pt-1.5 border-t border-slate-200 text-sm">
                  <span>Net Payout Payable</span>
                  <span>R {selectedSettlement.payoutAmount?.toLocaleString()}</span>
                </div>
              </div>

              {selectedSettlement.paymentReference && (
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-emerald-900 text-xs">
                  <span className="font-semibold">Bank Payment Cleared:</span> Ref {selectedSettlement.paymentReference}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedSettlement(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => alert('Printing vendor remittance slip...')}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center gap-1.5"
              >
                <Download size={13} /> Print Remittance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {disputeModalSettlement && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Freeze Payout — Flag Dispute</h3>
            <p className="text-xs text-slate-500">Hold 30-day payout timer for order #{disputeModalSettlement.orderNumber}</p>

            <div className="text-xs space-y-1">
              <label className="font-semibold text-slate-700 block">Reason for Dispute / Hold</label>
              <textarea 
                rows="3"
                placeholder="e.g. Broken vintage bottle reported during transit; replacement bottle pending..."
                value={disputeReasonInput}
                onChange={(e) => setDisputeReasonInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDisputeModalSettlement(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDispute}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm"
              >
                Hold Settlement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
