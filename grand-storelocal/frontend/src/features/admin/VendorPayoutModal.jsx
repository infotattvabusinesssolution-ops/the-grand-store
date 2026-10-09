import React, { useState, useEffect } from 'react';
import {
  CheckCircle2, Clock, AlertCircle, XCircle, X,
  MessageSquare, Loader2, Landmark
} from 'lucide-react';
import api from '../../api';

export default function VendorPayoutModal({
  isOpen,
  onClose,
  payout,
  onSuccess,
  formatMoney: customFormatMoney
}) {
  const [status, setStatus] = useState('cleared');
  const [adminReference, setAdminReference] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const formatMoney = customFormatMoney || ((val) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(val || 0);
  });

  useEffect(() => {
    if (payout) {
      // Map initial status
      const initialStatus = payout.status === 'paid' ? 'cleared' : (payout.status || 'pending');
      setStatus(initialStatus === 'pending' ? 'cleared' : initialStatus);
      setAdminReference(payout.payoutDetails?.adminReference || '');
      setCustomMessage(payout.payoutDetails?.customMessage || '');
      setAdminNotes(payout.payoutDetails?.adminNotes || '');
      setErrorMessage('');
    }
  }, [payout]);

  if (!isOpen || !payout) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!payout._id) return;

    if (status === 'cleared' && !adminReference.trim()) {
      setErrorMessage('Please enter an EFT batch or bank payment reference.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const payload = {
        status,
        adminReference: adminReference.trim(),
        customMessage: customMessage.trim(),
        adminNotes: adminNotes.trim(),
        rejectionReason: customMessage.trim() || adminNotes.trim()
      };

      const res = await api.put(`/admin/payouts/${payout._id}/status`, payload);
      const updatedTxn = res.data.transaction || res.data.payout || res.data;

      if (onSuccess) {
        onSuccess(updatedTxn);
      }
      onClose();
    } catch (err) {
      console.error('Failed to update payout status:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to update payout request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const vendorName = payout.businessInfo?.tradingName ||
    payout.businessInfo?.legalName ||
    payout.vendor?.name ||
    payout.payoutDetails?.accountName ||
    'Vendor Store';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#111] border border-white/15 rounded-xl max-w-lg w-full p-6 relative shadow-2xl my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              status === 'cleared' ? 'bg-emerald-500/20 text-emerald-400' :
              status === 'delayed' ? 'bg-orange-500/20 text-orange-400' :
              status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
              'bg-rose-500/20 text-rose-400'
            }`}>
              {status === 'cleared' && <CheckCircle2 size={22} />}
              {status === 'delayed' && <Clock size={22} />}
              {status === 'pending' && <AlertCircle size={22} />}
              {status === 'failed' && <XCircle size={22} />}
            </div>
            <div>
              <h4 className="text-white font-serif text-lg font-semibold">Vendor Payout Request</h4>
              <p className="text-white/50 text-xs">Set settlement status and send custom messages to the vendor</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white p-1 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Recipient & Amount Details Box */}
        <div className="p-4 bg-white/[0.03] border border-white/10 rounded-lg space-y-2.5 mb-5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-white/50">Vendor / Store:</span>
            <span className="text-white font-semibold">{vendorName}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-white/50">Withdrawal Amount:</span>
            <span className="text-white font-serif font-bold text-base text-[#e6c97a]">
              {formatMoney(payout.amount)}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-white/50">Destination Bank:</span>
            <span className="text-[#c9a35b] font-mono flex items-center gap-1.5">
              <Landmark size={13} />
              {payout.payoutDetails?.bankName || 'Bank'} (•••• {String(payout.payoutDetails?.accountNumber || '').slice(-4)})
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-white/50">GS Reference:</span>
            <span className="text-white/70 font-mono">{payout.gsReference}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* STATUS SELECTOR */}
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-2 uppercase tracking-wider">
              Select Payout Status <span className="text-[#c9a35b]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              
              {/* Paid / Disbursed */}
              <button
                type="button"
                onClick={() => setStatus('cleared')}
                className={`p-3 rounded-lg border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                  status === 'cleared'
                    ? 'bg-emerald-500/15 border-emerald-500 text-white shadow-sm'
                    : 'bg-white/[0.02] border-white/10 text-white/50 hover:border-white/20'
                }`}
              >
                <CheckCircle2 size={16} className={status === 'cleared' ? 'text-emerald-400 shrink-0 mt-0.5' : 'text-gray-500 shrink-0 mt-0.5'} />
                <div>
                  <span className="block text-xs font-bold text-emerald-400">Paid / Disbursed</span>
                  <span className="block text-[10px] text-white/40 mt-0.5">EFT processed to bank</span>
                </div>
              </button>

              {/* Delayed */}
              <button
                type="button"
                onClick={() => setStatus('delayed')}
                className={`p-3 rounded-lg border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                  status === 'delayed'
                    ? 'bg-orange-500/15 border-orange-500 text-white shadow-sm'
                    : 'bg-white/[0.02] border-white/10 text-white/50 hover:border-white/20'
                }`}
              >
                <Clock size={16} className={status === 'delayed' ? 'text-orange-400 shrink-0 mt-0.5' : 'text-gray-500 shrink-0 mt-0.5'} />
                <div>
                  <span className="block text-xs font-bold text-orange-400">Delaying / Delayed</span>
                  <span className="block text-[10px] text-white/40 mt-0.5">Held safely in escrow</span>
                </div>
              </button>

              {/* Pending */}
              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`p-3 rounded-lg border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                  status === 'pending'
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-sm'
                    : 'bg-white/[0.02] border-white/10 text-white/50 hover:border-white/20'
                }`}
              >
                <AlertCircle size={16} className={status === 'pending' ? 'text-amber-400 shrink-0 mt-0.5' : 'text-gray-500 shrink-0 mt-0.5'} />
                <div>
                  <span className="block text-xs font-bold text-amber-300">Pending Review</span>
                  <span className="block text-[10px] text-white/40 mt-0.5">Queued in pipeline</span>
                </div>
              </button>

              {/* Declined / Refund */}
              <button
                type="button"
                onClick={() => setStatus('failed')}
                className={`p-3 rounded-lg border text-left transition-all flex items-start gap-2.5 cursor-pointer ${
                  status === 'failed'
                    ? 'bg-rose-500/15 border-rose-500 text-white shadow-sm'
                    : 'bg-white/[0.02] border-white/10 text-white/50 hover:border-white/20'
                }`}
              >
                <XCircle size={16} className={status === 'failed' ? 'text-rose-400 shrink-0 mt-0.5' : 'text-gray-500 shrink-0 mt-0.5'} />
                <div>
                  <span className="block text-xs font-bold text-rose-400">Declined / Refund</span>
                  <span className="block text-[10px] text-white/40 mt-0.5">Refunds back to wallet</span>
                </div>
              </button>
            </div>
          </div>

          {/* CONDITIONAL EFT REFERENCE (When Paid) */}
          {status === 'cleared' && (
            <div>
              <label className="block text-xs font-medium text-emerald-300 mb-1">
                EFT Batch / Bank Payment Reference <span className="text-[#c9a35b]">*</span>
              </label>
              <input
                type="text"
                required
                value={adminReference}
                onChange={(e) => setAdminReference(e.target.value)}
                placeholder="e.g. EFT-202609-001 or ABSA-BATCH-99"
                className="w-full px-3.5 py-2.5 bg-black/60 border border-emerald-500/30 rounded text-sm text-white focus:outline-none focus:border-emerald-400"
              />
            </div>
          )}

          {/* STATUS EXPLANATION BANNERS */}
          {status === 'cleared' && (
            <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded text-xs text-emerald-300/90 leading-relaxed">
              Funds will be marked as <strong>Disbursed (Paid)</strong>. The vendor's pending withdrawal amount will clear from escrow.
            </div>
          )}
          {status === 'delayed' && (
            <div className="p-3 bg-orange-950/30 border border-orange-500/20 rounded text-xs text-orange-300/90 leading-relaxed">
              The payout status will show as <strong>Delayed</strong>. Funds remain held safely in escrow so the vendor cannot double-withdraw.
            </div>
          )}
          {status === 'pending' && (
            <div className="p-3 bg-amber-950/30 border border-amber-500/20 rounded text-xs text-amber-300/90 leading-relaxed">
              The payout will remain in the <strong>Pending Review</strong> queue awaiting finance clearance.
            </div>
          )}
          {status === 'failed' && (
            <div className="p-3 bg-rose-950/30 border border-rose-500/20 rounded text-xs text-rose-300/90 leading-relaxed">
              <strong>Notice:</strong> Declining will immediately refund the full <strong>{formatMoney(payout.amount)}</strong> back to the vendor's available wallet balance.
            </div>
          )}

          {/* CUSTOM MESSAGE FOR VENDOR */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-white/70 flex items-center gap-1.5">
                <MessageSquare size={13} className="text-[#c9a35b]" />
                <span>Custom Message for Vendor (Visible on Vendor Wallet &amp; In-App Alert)</span>
              </label>
              <span className="text-[10px] text-white/40">Optional</span>
            </div>
            <textarea
              rows={3}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="e.g. Delayed due to public holiday, will be disbursed Monday morning. / EFT processed via Standard Bank."
              className="w-full px-3.5 py-2.5 bg-black/60 border border-white/15 rounded text-sm text-white focus:outline-none focus:border-[#b58b38] placeholder-white/30"
            />

            {/* Quick Presets */}
            <div className="mt-2 space-y-1">
              <span className="text-[10px] text-white/40 uppercase tracking-wider block">Quick Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Bank Holiday Delay', text: 'Delayed due to South African bank holiday; disbursement will run on the next business day.' },
                  { label: 'Account Verification', text: 'Delayed pending confirmation of updated banking documents with the compliance department.' },
                  { label: 'Weekly EFT Batch', text: 'Scheduled for release in our scheduled weekly Friday EFT disbursement run.' },
                  { label: 'EFT Settled', text: 'EFT transfer completed from Standard Bank. Please allow standard 24-48h interbank clearance.' },
                  { label: 'Name Mismatch', text: 'Declined: Registered account holder does not match verified legal vendor business name.' }
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCustomMessage(preset.text)}
                    className="px-2 py-0.5 rounded text-[10px] bg-white/5 hover:bg-white/10 text-white/70 border border-white/10 transition-colors cursor-pointer"
                  >
                    + {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* INTERNAL ADMIN NOTES */}
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1">
              Internal Admin Notes (Private audit trail)
            </label>
            <input
              type="text"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="e.g. Verified by admin on 10 Sept"
              className="w-full px-3.5 py-2 bg-black/60 border border-white/10 rounded text-xs text-white/70 focus:outline-none focus:border-[#b58b38]"
            />
          </div>

          {errorMessage && (
            <p className="text-rose-400 text-xs p-2.5 bg-rose-950/40 border border-rose-500/30 rounded">
              {errorMessage}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-xs font-bold rounded flex items-center gap-2 transition-colors cursor-pointer ${
                status === 'cleared' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' :
                status === 'delayed' ? 'bg-orange-600 hover:bg-orange-500 text-white' :
                status === 'pending' ? 'bg-amber-500 hover:bg-amber-400 text-black font-extrabold' :
                'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>
                  {status === 'cleared' ? 'Save as Paid / Cleared' :
                   status === 'delayed' ? 'Save as Delayed' :
                   status === 'pending' ? 'Save as Pending Review' :
                   'Confirm Decline & Refund'}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
