import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertCircle, CheckCircle2, XCircle, Search, 
  Filter, Eye, FileText, User, Calendar, ExternalLink, 
  RotateCw, ZoomIn, ZoomOut, Download, X, Clock, ShieldAlert,
  ChevronRight, RefreshCw, SlidersHorizontal, Check, AlertTriangle
} from 'lucide-react';
import api from '../../api';

export default function AdminKycManagement({ onNotify }) {
  const [activeTab, setActiveTab] = useState('bidders'); // 'bidders' | 'guests'
  const [bidders, setBidders] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Lightbox Document Preview Modal
  const [previewDoc, setPreviewDoc] = useState(null); // { url, title, type, user }
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Rejection Modal
  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    type: '', // 'bidder' | 'guest'
    id: null,
    targetName: '',
    reason: ''
  });

  // Limit Adjustment Modal
  const [limitModal, setLimitModal] = useState({
    isOpen: false,
    bidder: null,
    limit: 25000,
    level: 'level_2_verified'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [biddersRes, guestsRes] = await Promise.all([
        api.get('/auction/admin/bidders').catch(err => ({ data: [] })),
        api.get('/admin/guest-verifications').catch(err => ({ data: { verifications: [] } }))
      ]);

      setBidders(Array.isArray(biddersRes.data) ? biddersRes.data : []);
      setGuests(guestsRes.data?.verifications || []);
    } catch (err) {
      console.error('Error fetching KYC records:', err);
      if (onNotify) onNotify('Failed to fetch KYC records', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Bidder Actions
  const handleApproveBidder = async (bidderId, bidderName) => {
    try {
      await api.put(`/auction/admin/bidders/${bidderId}/approve`, {
        bidderLevel: 'level_2_verified',
        biddingLimit: 25000,
        notes: 'Approved via 18+ KYC Compliance Management'
      });
      if (onNotify) onNotify(`18+ KYC approved for ${bidderName}`, 'success');
      fetchData();
    } catch (err) {
      console.error('Approval error:', err);
      if (onNotify) onNotify(err.response?.data?.message || 'Approval failed', 'error');
    }
  };

  const handleOpenRejectBidder = (bidder) => {
    setRejectModal({
      isOpen: true,
      type: 'bidder',
      id: bidder._id,
      targetName: bidder.name || bidder.legalFullName || 'Patron',
      reason: ''
    });
  };

  const handleOpenRejectGuest = (order) => {
    setRejectModal({
      isOpen: true,
      type: 'guest',
      id: order._id,
      targetName: order.guestInfo?.name || order.orderId || 'Guest Order',
      reason: ''
    });
  };

  const submitRejection = async () => {
    if (!rejectModal.reason.trim()) {
      if (onNotify) onNotify('Please enter a rejection reason', 'error');
      return;
    }

    try {
      if (rejectModal.type === 'bidder') {
        await api.put(`/auction/admin/bidders/${rejectModal.id}/reject`, {
          reason: rejectModal.reason
        });
        if (onNotify) onNotify(`Application rejected for ${rejectModal.targetName}`, 'info');
      } else {
        await api.put(`/admin/orders/${rejectModal.id}/guest-kyc/reject`, {
          reason: rejectModal.reason
        });
        if (onNotify) onNotify(`Guest KYC rejected for ${rejectModal.targetName}`, 'info');
      }
      setRejectModal({ isOpen: false, type: '', id: null, targetName: '', reason: '' });
      fetchData();
    } catch (err) {
      console.error('Rejection error:', err);
      if (onNotify) onNotify(err.response?.data?.message || 'Failed to submit rejection', 'error');
    }
  };

  // Guest Order Verify
  const handleVerifyGuest = async (orderId, customerName) => {
    try {
      await api.put(`/admin/orders/${orderId}/guest-kyc/verify`);
      if (onNotify) onNotify(`Guest 18+ verified for ${customerName}`, 'success');
      fetchData();
    } catch (err) {
      console.error('Guest verify error:', err);
      if (onNotify) onNotify(err.response?.data?.message || 'Verification failed', 'error');
    }
  };

  // Update Limit
  const submitLimitUpdate = async () => {
    try {
      await api.put(`/auction/admin/bidders/${limitModal.bidder._id}/limit`, {
        limit: Number(limitModal.limit),
        notes: `Limit adjusted to R${Number(limitModal.limit).toLocaleString()} by admin`
      });
      if (onNotify) onNotify(`Bidding limit updated for ${limitModal.bidder.name}`, 'success');
      setLimitModal({ isOpen: false, bidder: null, limit: 25000, level: 'level_2_verified' });
      fetchData();
    } catch (err) {
      console.error('Limit update error:', err);
      if (onNotify) onNotify(err.response?.data?.message || 'Failed to update limit', 'error');
    }
  };

  // Calculations for KPI Cards
  const pendingBidders = bidders.filter(b => b.bidderApprovalStatus === 'pending_approval').length;
  const approvedBidders = bidders.filter(b => b.bidderApprovalStatus === 'approved').length;
  const rejectedBidders = bidders.filter(b => b.bidderApprovalStatus === 'rejected').length;

  const pendingGuests = guests.filter(g => g.guestKyc?.status === 'pending_review' || !g.guestKyc?.status).length;
  const verifiedGuests = guests.filter(g => g.guestKyc?.status === 'verified').length;
  const rejectedGuests = guests.filter(g => g.guestKyc?.status === 'rejected').length;

  const totalPending = pendingBidders + pendingGuests;
  const totalApproved = approvedBidders + verifiedGuests;
  const totalRejected = rejectedBidders + rejectedGuests;
  const totalOverall = bidders.length + guests.length;

  // Filtered lists
  const filteredBidders = bidders.filter(b => {
    const matchesSearch = 
      (b.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.idNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.legalFullName || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === 'pending') return matchesSearch && b.bidderApprovalStatus === 'pending_approval';
    if (statusFilter === 'approved') return matchesSearch && b.bidderApprovalStatus === 'approved';
    if (statusFilter === 'rejected') return matchesSearch && b.bidderApprovalStatus === 'rejected';
    return matchesSearch;
  });

  const filteredGuests = guests.filter(g => {
    const matchesSearch = 
      (g.guestInfo?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.guestInfo?.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.orderId || g.invoiceNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.guestKyc?.idNumber || '').toLowerCase().includes(searchQuery.toLowerCase());

    const guestStatus = g.guestKyc?.status || 'pending_review';
    if (statusFilter === 'pending') return matchesSearch && guestStatus === 'pending_review';
    if (statusFilter === 'approved') return matchesSearch && guestStatus === 'verified';
    if (statusFilter === 'rejected') return matchesSearch && guestStatus === 'rejected';
    return matchesSearch;
  });

  const calculateAge = (dobString) => {
    if (!dobString) return 'N/A';
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return 'N/A';
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  return (
    <div className="space-y-8 pb-20 text-[var(--color-ivory)]">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-900/40 border border-amber-500/30 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <ShieldCheck size={26} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-serif text-white tracking-wide">
                18+ KYC & Compliance Verification
              </h1>
              <p className="text-xs text-[var(--color-ivory-muted)] font-light mt-0.5">
                Audit government identity documents, legal age compliance & auction bidder qualifications.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-[var(--color-ivory)] text-xs font-mono rounded-xl border border-white/10 transition-all shadow-sm"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin text-[var(--color-gold)]' : ''} />
            Sync Records
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0e0e0e]/90 border border-amber-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-amber-400">Pending Review</span>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
          </div>
          <div className="text-3xl font-serif text-white mt-3 font-semibold">{totalPending}</div>
          <p className="text-[11px] text-[var(--color-ivory-muted)] mt-1">
            {pendingBidders} Bidders • {pendingGuests} Guest Orders
          </p>
        </div>

        <div className="bg-[#0e0e0e]/90 border border-emerald-500/20 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">Approved 18+</span>
          <div className="text-3xl font-serif text-white mt-3 font-semibold">{totalApproved}</div>
          <p className="text-[11px] text-[var(--color-ivory-muted)] mt-1">
            {approvedBidders} Certified Bidders • {verifiedGuests} Orders
          </p>
        </div>

        <div className="bg-[#0e0e0e]/90 border border-rose-500/20 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-mono uppercase tracking-wider text-rose-400">Rejected</span>
          <div className="text-3xl font-serif text-white mt-3 font-semibold">{totalRejected}</div>
          <p className="text-[11px] text-[var(--color-ivory-muted)] mt-1">
            Non-compliant or under 18 submissions
          </p>
        </div>

        <div className="bg-[#0e0e0e]/90 border border-white/10 rounded-2xl p-5 shadow-lg">
          <span className="text-xs font-mono uppercase tracking-wider text-[var(--color-ivory-muted)]">Total Submissions</span>
          <div className="text-3xl font-serif text-white mt-3 font-semibold">{totalOverall}</div>
          <p className="text-[11px] text-[var(--color-ivory-muted)] mt-1">
            All historical verification attempts
          </p>
        </div>
      </div>

      {/* Segmented Controls & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a0a0a] p-3 rounded-2xl border border-white/[0.08]">
        {/* Dual Tab Buttons */}
        <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('bidders')}
            className={`px-4 py-2 rounded-lg text-xs font-medium tracking-wider uppercase transition-all flex items-center gap-2 ${
              activeTab === 'bidders'
                ? 'bg-gradient-to-r from-amber-500/20 to-yellow-600/30 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'text-[var(--color-ivory-muted)] hover:text-white'
            }`}
          >
            <User size={14} />
            Registered Bidders
            {pendingBidders > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500 text-black font-bold">
                {pendingBidders}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('guests')}
            className={`px-4 py-2 rounded-lg text-xs font-medium tracking-wider uppercase transition-all flex items-center gap-2 ${
              activeTab === 'guests'
                ? 'bg-gradient-to-r from-amber-500/20 to-yellow-600/30 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'text-[var(--color-ivory-muted)] hover:text-white'
            }`}
          >
            <FileText size={14} />
            Guest Order 18+ KYC
            {pendingGuests > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500 text-black font-bold">
                {pendingGuests}
              </span>
            )}
          </button>
        </div>

        {/* Filter and Search */}
        <div className="flex items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
            <Filter size={13} className="text-[var(--color-ivory-muted)]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-[var(--color-ivory)] outline-none cursor-pointer"
            >
              <option value="all" className="bg-[#121212]">All Statuses</option>
              <option value="pending" className="bg-[#121212]">Pending Only</option>
              <option value="approved" className="bg-[#121212]">Approved Only</option>
              <option value="rejected" className="bg-[#121212]">Rejected Only</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-ivory-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patron, email, ID..."
              className="pl-9 pr-4 py-1.5 rounded-xl bg-black/40 border border-white/5 text-xs text-[var(--color-ivory)] placeholder-[var(--color-ivory-muted)] focus:outline-none focus:border-amber-500/40 w-48 lg:w-64"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-[var(--color-ivory-muted)] font-mono text-xs">
          <RefreshCw size={24} className="animate-spin text-amber-400" />
          <span>Loading KYC submissions from registry...</span>
        </div>
      ) : activeTab === 'bidders' ? (
        /* ================= REGISTERED BIDDERS TAB ================= */
        filteredBidders.length === 0 ? (
          <div className="bg-[#0e0e0e] rounded-2xl border border-white/[0.06] p-12 text-center text-[var(--color-ivory-muted)]">
            <ShieldCheck size={40} className="mx-auto text-white/20 mb-3" />
            <h3 className="text-sm font-medium text-white">No Bidder KYC Records Found</h3>
            <p className="text-xs mt-1">No registered bidder applications match your search filter criteria.</p>
          </div>
        ) : (
          <div className="bg-[#0e0e0e] rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[var(--color-ivory-muted)] font-mono uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 font-normal">Patron Details</th>
                    <th className="py-3.5 px-4 font-normal">Legal Age & DOB</th>
                    <th className="py-3.5 px-4 font-normal">Identity Document</th>
                    <th className="py-3.5 px-4 font-normal">KYC Document Proof</th>
                    <th className="py-3.5 px-4 font-normal">Tier & Limit</th>
                    <th className="py-3.5 px-4 font-normal">Status</th>
                    <th className="py-3.5 px-4 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredBidders.map((b) => {
                    const age = calculateAge(b.dateOfBirth);
                    const isPending = b.bidderApprovalStatus === 'pending_approval';
                    const isApproved = b.bidderApprovalStatus === 'approved';
                    const isRejected = b.bidderApprovalStatus === 'rejected';

                    return (
                      <tr key={b._id} className="hover:bg-white/[0.02] transition-colors">
                        {/* Patron Name / Contact */}
                        <td className="py-4 px-4">
                          <div className="font-medium text-white text-sm">
                            {b.legalFullName || b.name || 'Anonymous Patron'}
                          </div>
                          <div className="text-[11px] text-[var(--color-ivory-muted)] font-mono mt-0.5">
                            {b.email}
                          </div>
                          {b.phone && (
                            <div className="text-[10px] text-white/40 font-mono mt-0.5">
                              {b.phone}
                            </div>
                          )}
                          {b.bidderNumber && (
                            <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                              #{b.bidderNumber}
                            </span>
                          )}
                        </td>

                        {/* Legal Age & DOB */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 font-mono">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              typeof age === 'number' && age >= 18 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {age !== 'N/A' ? `${age} YRS OLD` : 'DOB UNSET'}
                            </span>
                          </div>
                          {b.dateOfBirth && (
                            <div className="text-[10px] text-[var(--color-ivory-muted)] font-mono mt-1">
                              DOB: {new Date(b.dateOfBirth).toLocaleDateString()}
                            </div>
                          )}
                        </td>

                        {/* ID Type & Number */}
                        <td className="py-4 px-4 font-mono text-[11px]">
                          <div className="text-white uppercase font-medium">
                            {b.idType?.replace('_', ' ') || 'Government ID'}
                          </div>
                          <div className="text-[var(--color-ivory-muted)] mt-0.5">
                            {b.idNumber || 'No ID Number'}
                          </div>
                        </td>

                        {/* Document Lightbox Trigger */}
                        <td className="py-4 px-4">
                          {b.idDocumentUrl ? (
                            <button
                              onClick={() => {
                                setPreviewDoc({
                                  url: b.idDocumentUrl,
                                  title: `${b.name || 'Patron'} - ${b.idType || 'ID Document'}`,
                                  user: b.name,
                                  idNumber: b.idNumber
                                });
                                setZoomLevel(1);
                                setRotation(0);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-mono transition-all group"
                            >
                              <Eye size={13} className="group-hover:scale-110 transition-transform" />
                              Inspect Document
                            </button>
                          ) : (
                            <span className="text-[11px] text-white/30 italic">No document attached</span>
                          )}

                          {b.proofOfResidenceUrl && (
                            <a
                              href={b.proofOfResidenceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1 text-[10px] text-amber-400/80 hover:text-amber-300 mt-1 font-mono"
                            >
                              <ExternalLink size={10} /> Proof of Address
                            </a>
                          )}
                        </td>

                        {/* Tier & Limit */}
                        <td className="py-4 px-4">
                          <div className="font-mono text-xs text-white">
                            R{(b.biddingLimit || 25000).toLocaleString()}
                          </div>
                          <div className="text-[10px] font-mono text-[var(--color-ivory-muted)] uppercase mt-0.5">
                            {b.bidderLevel?.replace(/_/g, ' ') || 'Level 1'}
                          </div>
                          {b.bidderDepositStatus === 'paid' && (
                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              👑 VIP Escrow Paid
                            </span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-4">
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <Clock size={10} /> Pending Audit
                            </span>
                          )}
                          {isApproved && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 size={10} /> 18+ Cleared
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              <XCircle size={10} /> Rejected
                            </span>
                          )}
                          {b.bidderRejectionReason && isRejected && (
                            <div className="text-[10px] text-rose-300/80 mt-1 max-w-xs truncate" title={b.bidderRejectionReason}>
                              {b.bidderRejectionReason}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleApproveBidder(b._id, b.name)}
                                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1"
                                >
                                  <Check size={12} /> Approve 18+
                                </button>
                                <button
                                  onClick={() => handleOpenRejectBidder(b)}
                                  className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1"
                                >
                                  <X size={12} /> Reject
                                </button>
                              </>
                            )}

                            {isApproved && (
                              <button
                                onClick={() => setLimitModal({ isOpen: true, bidder: b, limit: b.biddingLimit || 25000, level: b.bidderLevel || 'level_2_verified' })}
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[var(--color-ivory)] border border-white/10 rounded-lg text-xs font-mono transition-all flex items-center gap-1"
                              >
                                <SlidersHorizontal size={12} /> Adjust Limit
                              </button>
                            )}

                            {isRejected && (
                              <button
                                onClick={() => handleApproveBidder(b._id, b.name)}
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-amber-300 border border-amber-500/20 rounded-lg text-xs font-mono transition-all"
                              >
                                Re-approve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* ================= GUEST ORDER 18+ KYC TAB ================= */
        filteredGuests.length === 0 ? (
          <div className="bg-[#0e0e0e] rounded-2xl border border-white/[0.06] p-12 text-center text-[var(--color-ivory-muted)]">
            <FileText size={40} className="mx-auto text-white/20 mb-3" />
            <h3 className="text-sm font-medium text-white">No Guest Order KYC Records Found</h3>
            <p className="text-xs mt-1">No guest checkout orders match your current filter.</p>
          </div>
        ) : (
          <div className="bg-[#0e0e0e] rounded-2xl border border-white/[0.08] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.02] text-[var(--color-ivory-muted)] font-mono uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-4 font-normal">Order & Guest</th>
                    <th className="py-3.5 px-4 font-normal">Legal Age & DOB</th>
                    <th className="py-3.5 px-4 font-normal">ID Credentials</th>
                    <th className="py-3.5 px-4 font-normal">Submitted Document</th>
                    <th className="py-3.5 px-4 font-normal">Order Total</th>
                    <th className="py-3.5 px-4 font-normal">Review Status</th>
                    <th className="py-3.5 px-4 font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {filteredGuests.map((order) => {
                    const guestKyc = order.guestKyc || {};
                    const guestInfo = order.guestInfo || {};
                    const age = calculateAge(guestKyc.dateOfBirth);
                    const isPending = guestKyc.status === 'pending_review' || !guestKyc.status;
                    const isVerified = guestKyc.status === 'verified';
                    const isRejected = guestKyc.status === 'rejected';

                    return (
                      <tr key={order._id} className="hover:bg-white/[0.02] transition-colors">
                        {/* Order & Guest info */}
                        <td className="py-4 px-4">
                          <div className="font-medium text-white text-sm">
                            {guestInfo.name || 'Guest Customer'}
                          </div>
                          <div className="text-[11px] text-[var(--color-ivory-muted)] font-mono mt-0.5">
                            {guestInfo.email || order.shippingAddress?.email}
                          </div>
                          <div className="text-[10px] text-amber-400 font-mono mt-1">
                            Ref: #{order.orderId || order.invoiceNumber || order._id.slice(-6)}
                          </div>
                        </td>

                        {/* Legal Age & DOB */}
                        <td className="py-4 px-4 font-mono">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            typeof age === 'number' && age >= 18 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {age !== 'N/A' ? `${age} YRS OLD` : 'DOB UNSET'}
                          </span>
                          {guestKyc.dateOfBirth && (
                            <div className="text-[10px] text-[var(--color-ivory-muted)] mt-1">
                              DOB: {new Date(guestKyc.dateOfBirth).toLocaleDateString()}
                            </div>
                          )}
                        </td>

                        {/* ID Credentials */}
                        <td className="py-4 px-4 font-mono text-[11px]">
                          <div className="text-white uppercase font-medium">
                            {guestKyc.idType?.replace('_', ' ') || 'ID Document'}
                          </div>
                          <div className="text-[var(--color-ivory-muted)] mt-0.5">
                            {guestKyc.idNumber || 'No ID Number'}
                          </div>
                        </td>

                        {/* Submitted Document */}
                        <td className="py-4 px-4">
                          {guestKyc.documentUrl ? (
                            <button
                              onClick={() => {
                                setPreviewDoc({
                                  url: guestKyc.documentUrl,
                                  title: `Guest #${order.orderId || order.invoiceNumber} - ${guestKyc.idType || 'ID Document'}`,
                                  user: guestInfo.name,
                                  idNumber: guestKyc.idNumber
                                });
                                setZoomLevel(1);
                                setRotation(0);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-mono transition-all group"
                            >
                              <Eye size={13} className="group-hover:scale-110 transition-transform" />
                              Inspect Document
                            </button>
                          ) : (
                            <span className="text-[11px] text-white/30 italic">No document attached</span>
                          )}
                        </td>

                        {/* Order Total */}
                        <td className="py-4 px-4 font-mono text-xs text-white">
                          R{(order.totalPrice || 0).toLocaleString()}
                        </td>

                        {/* Review Status */}
                        <td className="py-4 px-4">
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <Clock size={10} /> Pending Review
                            </span>
                          )}
                          {isVerified && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 size={10} /> 18+ Approved
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              <XCircle size={10} /> Rejected
                            </span>
                          )}
                          {guestKyc.rejectionReason && isRejected && (
                            <div className="text-[10px] text-rose-300/80 mt-1 max-w-xs truncate" title={guestKyc.rejectionReason}>
                              {guestKyc.rejectionReason}
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => handleVerifyGuest(order._id, guestInfo.name)}
                                  className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1"
                                >
                                  <Check size={12} /> Approve
                                </button>
                                <button
                                  onClick={() => handleOpenRejectGuest(order)}
                                  className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1"
                                >
                                  <X size={12} /> Reject
                                </button>
                              </>
                            )}

                            {isRejected && (
                              <button
                                onClick={() => handleVerifyGuest(order._id, guestInfo.name)}
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-amber-300 border border-amber-500/20 rounded-lg text-xs font-mono transition-all"
                              >
                                Re-approve
                              </button>
                            )}
                          </div>
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

      {/* ================= LIGHTBOX DOCUMENT MODAL ================= */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#0f0f0f] border border-white/20 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40">
              <div>
                <h3 className="text-base font-serif text-white font-medium">{previewDoc.title}</h3>
                <p className="text-xs text-[var(--color-ivory-muted)] font-mono">
                  Holder: {previewDoc.user || 'N/A'} {previewDoc.idNumber ? `• ID: ${previewDoc.idNumber}` : ''}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 3))}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  onClick={() => setRotation(prev => (prev + 90) % 360)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                  title="Rotate"
                >
                  <RotateCw size={16} />
                </button>
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-amber-300 border border-amber-500/20 transition-colors"
                  title="Open Original / Download"
                >
                  <ExternalLink size={16} />
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors ml-2"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Document Viewer Body */}
            <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-black/60 min-h-[400px]">
              {previewDoc.url.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewDoc.url}
                  title="Document Preview"
                  className="w-full h-[65vh] rounded-xl border border-white/10"
                />
              ) : (
                <div className="overflow-auto max-h-[65vh] flex items-center justify-center">
                  <img
                    src={previewDoc.url}
                    alt="ID Document"
                    style={{
                      transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                      transition: 'transform 0.2s ease-out',
                      maxHeight: '60vh',
                      maxWidth: '100%',
                      objectFit: 'contain'
                    }}
                    className="rounded-xl shadow-2xl"
                  />
                </div>
              )}
            </div>

            {/* Footer Notice */}
            <div className="px-6 py-3 border-t border-white/10 bg-black/40 flex items-center justify-between text-[11px] text-[var(--color-ivory-muted)] font-mono">
              <span className="flex items-center gap-1.5 text-amber-400">
                <ShieldCheck size={14} /> End-to-End Encrypted Compliance Storage
              </span>
              <span>Zoom: {(zoomLevel * 100).toFixed(0)}% • Rotation: {rotation}°</span>
            </div>
          </div>
        </div>
      )}

      {/* ================= REJECTION REASON MODAL ================= */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121212] border border-rose-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-serif text-white font-medium">Reject 18+ Verification</h3>
            </div>
            <p className="text-xs text-[var(--color-ivory-muted)] mb-4">
              Specify the legal compliance reason why <strong className="text-white">{rejectModal.targetName}</strong>'s document was rejected. This will be sent directly to the customer.
            </p>

            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="e.g., ID photo is unreadable/blurry, document has expired, or applicant does not meet the 18+ legal threshold."
              rows={4}
              className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-rose-500/50 mb-4"
            />

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setRejectModal({ isOpen: false, type: '', id: null, targetName: '', reason: '' })}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-mono rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={submitRejection}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-mono font-bold rounded-xl transition-all shadow-lg"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= BIDDING LIMIT MODAL ================= */}
      {limitModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#121212] border border-amber-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400 mb-4">
              <SlidersHorizontal size={24} />
              <h3 className="text-lg font-serif text-white font-medium">Adjust Patron Bidding Ceiling</h3>
            </div>
            <p className="text-xs text-[var(--color-ivory-muted)] mb-4">
              Configure the maximum aggregate live bidding ceiling for <strong className="text-white">{limitModal.bidder?.name}</strong>.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[11px] font-mono text-[var(--color-ivory-muted)] uppercase mb-1.5">
                  Bidding Ceiling (ZAR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[var(--color-gold)] font-mono">R</span>
                  <input
                    type="number"
                    value={limitModal.limit}
                    onChange={(e) => setLimitModal(prev => ({ ...prev, limit: e.target.value }))}
                    className="w-full bg-black/50 border border-white/10 rounded-xl pl-8 pr-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setLimitModal({ isOpen: false, bidder: null, limit: 25000, level: 'level_2_verified' })}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-mono rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={submitLimitUpdate}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:brightness-110 text-black font-bold text-xs font-mono rounded-xl transition-all shadow-lg"
              >
                Save Ceiling
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
