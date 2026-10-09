import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, ShieldAlert, FileText, CheckCircle2, UserCheck, DollarSign } from 'lucide-react';

export default function KycReviewModal({ isOpen, onClose, onUpdateKyc, bidder }) {
  const [biddingLimit, setBiddingLimit] = useState(bidder?.biddingLimit || 250000);
  const [bidderLevel, setBidderLevel] = useState(bidder?.bidderLevel || 'level_2_verified');
  const [rejectionReason, setRejectionReason] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (bidder) {
      setBiddingLimit(bidder.biddingLimit || 250000);
      setBidderLevel(bidder.bidderLevel || 'level_2_verified');
      setRejectionReason('');
    }
    setError('');
  }, [bidder, isOpen]);

  if (!isOpen || !bidder) return null;

  const handlePreset = (limit, level) => {
    setBiddingLimit(limit);
    setBidderLevel(level);
  };

  const handleAction = async (approve) => {
    try {
      setUpdating(true);
      setError('');
      await onUpdateKyc(bidder._id || bidder.id, {
        status: approve ? 'approved' : 'rejected',
        limit: approve ? Number(biddingLimit) : 0,
        level: bidderLevel,
        reason: approve ? 'KYC documents verified by CRM Staff' : (rejectionReason || 'Documentation verification failed')
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update KYC status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
              <ShieldCheck size={18} className="text-blue-600" />
              Bidder KYC Verification Dossier
            </h3>
            <p className="text-xs text-slate-500">
              {bidder.name} • {bidder.email}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="space-y-3 text-xs">
          {/* Identity & Documents Dossier */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">ID Document</span>
                <span className="font-bold text-slate-800">{bidder.idType || 'National ID'}: {bidder.idNumber || 'Pending'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Contact Phone</span>
                <span className="font-semibold text-slate-800">{bidder.phone || 'N/A'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center gap-3">
              {bidder.idDocumentUrl ? (
                <a
                  href={bidder.idDocumentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-blue-600 hover:border-blue-300 font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <FileText size={13} /> View Identity Document
                </a>
              ) : (
                <span className="text-slate-400 italic">No government ID attached</span>
              )}

              {bidder.proofOfResidenceUrl && (
                <a
                  href={bidder.proofOfResidenceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-blue-600 hover:border-blue-300 font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <FileText size={13} /> View Proof of Residence
                </a>
              )}
            </div>
          </div>

          {/* Tier & Limit Ladder */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Select Authorization Level</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handlePreset(50000, 'level_1_registered')}
                className={`p-2.5 rounded-xl border text-left transition-colors ${
                  bidderLevel === 'level_1_registered' 
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900' 
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold">Level 1: Registered</div>
                <div className="text-[10px] text-slate-500">R 50,000 Standard Limit</div>
              </button>

              <button
                type="button"
                onClick={() => handlePreset(250000, 'level_2_verified')}
                className={`p-2.5 rounded-xl border text-left transition-colors ${
                  bidderLevel === 'level_2_verified' 
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900' 
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold">Level 2: Verified</div>
                <div className="text-[10px] text-slate-500">R 250,000 Cellar Limit</div>
              </button>

              <button
                type="button"
                onClick={() => handlePreset(500000, 'level_3_enhanced')}
                className={`p-2.5 rounded-xl border text-left transition-colors ${
                  bidderLevel === 'level_3_enhanced' 
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900' 
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold">Level 3: Enhanced</div>
                <div className="text-[10px] text-slate-500">R 500,000 Reserve Limit</div>
              </button>

              <button
                type="button"
                onClick={() => handlePreset(1500000, 'level_4_vip')}
                className={`p-2.5 rounded-xl border text-left transition-colors ${
                  bidderLevel === 'level_4_vip' 
                    ? 'border-purple-600 bg-purple-50/50 text-purple-900' 
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold text-purple-900">Level 4: VIP Vault</div>
                <div className="text-[10px] text-purple-600">R 1,500,000+ Premium</div>
              </button>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Approved Credit / Bidding Limit (ZAR)</label>
            <div className="relative">
              <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="number"
                value={biddingLimit}
                onChange={(e) => setBiddingLimit(Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-extrabold text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-blue-700"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Rejection Reason (If Disapproving)</label>
            <input 
              type="text"
              placeholder="e.g. Proof of address is older than 3 months"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={updating}
            onClick={() => handleAction(false)}
            className="px-4 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
          >
            Reject KYC
          </button>
          <button
            type="button"
            disabled={updating}
            onClick={() => handleAction(true)}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
          >
            <UserCheck size={14} />
            {updating ? 'Saving...' : 'Approve & Unlock Limit'}
          </button>
        </div>
      </div>
    </div>
  );
}
