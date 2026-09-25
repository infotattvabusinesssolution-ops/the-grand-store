import React, { useState, useEffect } from 'react';
import { 
  Gavel, Calendar, UserCheck, AlertCircle, DollarSign, 
  Clock, CheckCircle2, XCircle, Search, RefreshCw, Eye, 
  FileText, ShieldCheck, ChevronRight, X, Plus, Bell, 
  RotateCcw, Trash2, Edit3, ShieldAlert, Sparkles, Filter,
  Phone, Mail, Ticket, Copy, Check, Users, Receipt, CreditCard
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import { useCrmAuctions } from '../hooks/useCrmAuctions';
import { useToast } from '../context/ToastContext';

// Specialized Operational Modals
import LiveBidsModal from '../components/auctions/LiveBidsModal';
import KycReviewModal from '../components/auctions/KycReviewModal';

export default function CrmAuctionEventsPage() {
  const toast = useToast();
  const { 
    stats, pendingBidders, unpaidLots, liveLots, events, 
    loading, refresh, updateBidderKyc, 
    sendPaymentReminder, defaultLot, approveAuctionLot, 
    rejectAuctionLot, updateAuctionLot, deleteAuctionLot, 
    getLotBids, getEventGuests, 
    toggleGuestCheckIn, approveTastingEvent, rejectTastingEvent, 
    updateTastingEvent, deleteTastingEvent, getAllBidders 
  } = useCrmAuctions();

  // Active Tab: 'unpaid' | 'kyc' | 'events' | 'live'
  const [activeTab, setActiveTab] = useState('unpaid');

  // Search & Filter States
  const [unpaidSearch, setUnpaidSearch] = useState('');
  const [unpaidFilter, setUnpaidFilter] = useState('all'); // 'all' | 'overdue' | 'active'
  const [kycTab, setKycTab] = useState('pending'); // 'pending' | 'approved'
  const [kycSearch, setKycSearch] = useState('');
  const [approvedBiddersList, setApprovedBiddersList] = useState([]);
  const [approvedLoading, setApprovedLoading] = useState(false);
  const [eventSearch, setEventSearch] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [eventApprovalFilter, setEventApprovalFilter] = useState('all'); // 'all' | 'pending_approval' | 'approved' | 'rejected'
  const [lotSearch, setLotSearch] = useState('');
  const [lotStatusFilter, setLotStatusFilter] = useState('all');

  // Rejection Dialog State
  const [rejectionModal, setRejectionModal] = useState(null); // { type: 'event'|'lot', id: string, title: string }
  const [rejectionReason, setRejectionReason] = useState('');

  // Modals Visibility & Selected States
  const [selectedEventForDesk, setSelectedEventForDesk] = useState(null);
  const [guestList, setGuestList] = useState([]);
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestSearchQuery, setGuestSearchQuery] = useState('');
  const [guestStatusFilter, setGuestStatusFilter] = useState('all'); // 'all' | 'checkedIn' | 'pending'
  const [selectedCustomerDossier, setSelectedCustomerDossier] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const [selectedLotForBids, setSelectedLotForBids] = useState(null);
  const [kycModalUser, setKycModalUser] = useState(null);

  // Fetch approved bidders when KYC tab changes to 'approved'
  useEffect(() => {
    if (activeTab === 'kyc' && kycTab === 'approved') {
      loadApprovedBidders();
    }
  }, [activeTab, kycTab]);

  const loadApprovedBidders = async () => {
    try {
      setApprovedLoading(true);
      const res = await getAllBidders({ status: 'approved' });
      setApprovedBiddersList(res.bidders || []);
    } catch (err) {
      console.error('Failed to load approved bidders:', err);
    } finally {
      setApprovedLoading(false);
    }
  };

  const handleCopyText = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedId(null), 1800);
  };

  // --- Tasting Event Handlers ---
  const handleOpenGuestList = async (event) => {
    setSelectedEventForDesk(event);
    setGuestLoading(true);
    setGuestSearchQuery('');
    setGuestStatusFilter('all');
    setSelectedCustomerDossier(null);
    try {
      const data = await getEventGuests(event.id || event._id);
      setGuestList(data.guests || []);
    } catch (err) {
      toast.error('Failed to load guest list');
    } finally {
      setGuestLoading(false);
    }
  };

  const handleToggleCheckIn = async (bookingId) => {
    try {
      const res = await toggleGuestCheckIn(bookingId);
      const isNowCheckedIn = res.checkedIn;
      setGuestList(prev => prev.map(g => 
        g.bookingId === bookingId ? { ...g, ticketStatus: res.ticketStatus, checkedIn: isNowCheckedIn } : g
      ));
      if (selectedCustomerDossier && selectedCustomerDossier.bookingId === bookingId) {
        setSelectedCustomerDossier(prev => ({
          ...prev,
          ticketStatus: res.ticketStatus,
          checkedIn: isNowCheckedIn
        }));
      }
      setSelectedEventForDesk(prev => {
        if (!prev) return prev;
        const diff = isNowCheckedIn ? 1 : -1;
        return {
          ...prev,
          checkedInCount: Math.max(0, (prev.checkedInCount || 0) + diff)
        };
      });
      refresh();
      toast.success(isNowCheckedIn ? 'Customer checked in successfully!' : 'Check-in status cleared.');
    } catch (err) {
      toast.error('Failed to update guest check-in');
    }
  };

  // --- Vendor Submission Approval Handlers ---
  const handleApproveEvent = async (id, title) => {
    try {
      const res = await approveTastingEvent(id, {});
      toast.success(res.message || `Tasting event "${title}" approved and published to website!`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to approve event');
    }
  };

  const openRejectModal = (type, id, title) => {
    setRejectionModal({ type, id, title });
    setRejectionReason('');
  };

  const handleConfirmRejection = async () => {
    if (!rejectionModal) return;
    const { type, id, title } = rejectionModal;
    const reason = rejectionReason.trim() || 'Declined during executive curation review.';

    try {
      if (type === 'event') {
        const res = await rejectTastingEvent(id, { reason });
        toast.warning(res.message || `Event "${title}" marked as rejected.`);
      } else {
        const res = await rejectAuctionLot(id, { reason });
        toast.warning(res.message || `Auction lot #${title} marked as rejected.`);
      }
      setRejectionModal(null);
      setRejectionReason('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reject item');
    }
  };

  const handleDeleteEvent = async (id, title) => {
    if (!window.confirm(`Are you sure you want to cancel or remove tasting event "${title}"?`)) return;
    try {
      await deleteTastingEvent(id);
      toast.success('Event status updated successfully.');
    } catch (err) {
      toast.error('Failed to delete event');
    }
  };

  // --- Auction Lot Handlers ---
  const handleApproveLot = async (lot) => {
    try {
      const res = await approveAuctionLot(lot._id, {});
      toast.success(res.message || `Lot #${lot.lotNumber || lot.title} approved and authenticated!`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to approve auction lot');
    }
  };

  const handleDeleteLot = async (id, lotNumber) => {
    if (!window.confirm(`Are you sure you want to archive or remove Lot #${lotNumber || id}?`)) return;
    try {
      await deleteAuctionLot(id);
      toast.success('Auction lot removed successfully.');
    } catch (err) {
      toast.error('Failed to remove auction lot');
    }
  };

  // --- Quick 1-Click Bidder KYC Approval (Admin Desk Standard) ---
  const handleQuickApproveBidder = async (bidder) => {
    try {
      await updateBidderKyc(bidder._id, {
        status: 'approved',
        bidderLevel: 'level_2_verified',
        biddingLimit: 25000,
        notes: 'Approved via Section 10 Executive Desk'
      });
      toast.success(`Bidder KYC approved for ${bidder.name || 'bidder'}! Paddle assigned & confirmation email sent.`);
      refresh();
      if (kycTab === 'approved') loadApprovedBidders();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to approve bidder KYC');
    }
  };

  // --- Unpaid Hammer Actions ---
  const handleSendReminder = async (lot) => {
    try {
      const res = await sendPaymentReminder(lot._id);
      toast.success(res.message || `Payment notification dispatched to ${lot.winner?.email || 'winner'} via Gmail!`);
      refresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send payment reminder notification');
    }
  };

  const handleDefaultLot = async (lot) => {
    if (!window.confirm(`Mark Lot #${lot.lotNumber || lot._id} as defaulted? This docks bidder reliability and relists the lot as unsold.`)) return;
    try {
      const res = await defaultLot(lot._id);
      toast.warning(res.message || 'Lot marked as defaulted.');
    } catch (err) {
      toast.error('Failed to default lot');
    }
  };

  // --- KYC Review Actions ---
  const handleUpdateKyc = async (userId, payload) => {
    try {
      const res = await updateBidderKyc(userId, payload);
      toast.success(res.message || 'Bidder KYC authorization updated!');
      if (kycTab === 'approved') loadApprovedBidders();
    } catch (err) {
      toast.error('Failed to update KYC authorization');
      throw err;
    }
  };

  // Filtered Unpaid Lots
  const filteredUnpaidLots = unpaidLots.filter((lot) => {
    const q = unpaidSearch.toLowerCase();
    const matchesSearch = 
      (lot.title || '').toLowerCase().includes(q) ||
      (lot.lotNumber || '').toLowerCase().includes(q) ||
      (lot.winner?.name || '').toLowerCase().includes(q) ||
      (lot.winner?.email || '').toLowerCase().includes(q) ||
      (lot.gsReference || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (unpaidFilter === 'overdue') {
      const isOverdue = lot.endDate && (Date.now() - new Date(lot.endDate).getTime() > 48 * 3600 * 1000);
      return isOverdue;
    }
    if (unpaidFilter === 'active') {
      const isOverdue = lot.endDate && (Date.now() - new Date(lot.endDate).getTime() > 48 * 3600 * 1000);
      return !isOverdue;
    }
    return true;
  });

  // Filtered Events (Vendor Tasting Submissions)
  const filteredEvents = events.filter((evt) => {
    const q = eventSearch.toLowerCase();
    const matchesSearch = 
      (evt.title || '').toLowerCase().includes(q) ||
      (evt.location || '').toLowerCase().includes(q) ||
      (evt.hostName || '').toLowerCase().includes(q) ||
      (evt.vendor?.name || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (eventTypeFilter !== 'all' && evt.type !== eventTypeFilter) return false;
    if (eventApprovalFilter !== 'all' && (evt.approvalStatus || 'approved') !== eventApprovalFilter) return false;
    return true;
  });

  // Filtered Live Lots (Vendor Consignments)
  const filteredLiveLots = liveLots.filter((lot) => {
    const q = lotSearch.toLowerCase();
    const matchesSearch = 
      (lot.title || '').toLowerCase().includes(q) ||
      (lot.lotNumber || '').toLowerCase().includes(q) ||
      (lot.distillery || '').toLowerCase().includes(q) ||
      (lot.category || '').toLowerCase().includes(q) ||
      (lot.vendor?.name || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (lotStatusFilter !== 'all' && lot.status !== lotStatusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Auctions & Tasting Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Section 10 Executive Operational Engine: Live hammer telemetry, bidder KYC verification, vendor tasting event curation & auction lot approvals.
          </p>
        </div>

        {/* Action Controls - Note: Events and Lots are submitted by Vendors; Admins review & approve/reject */}
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={refresh}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-2xs"
            title="Refresh database live counters"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh Desk
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Unpaid Hammer Lots" 
          value={stats.unpaidLotsCount || 0} 
          icon={AlertCircle} 
          color="amber"
          subtitle="Section 10 48h SLA Queue"
        />
        <StatCard 
          title="Pending Bidder KYC" 
          value={stats.pendingKycCount || 0} 
          icon={UserCheck} 
          color="blue"
          subtitle="Dossier verification queue"
        />
        <StatCard 
          title="Tasting Event Submissions" 
          value={events.length} 
          icon={Calendar} 
          color="emerald"
          subtitle={`${stats.pendingEventsCount || 0} pending admin review`}
        />
        <StatCard 
          title="Auction Consignments" 
          value={liveLots.length} 
          icon={Gavel} 
          color="purple"
          subtitle={`${stats.pendingLotsCount || 0} pending curator review`}
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs sm:text-sm font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('unpaid')}
          className={`pb-3 relative transition-colors whitespace-nowrap ${
            activeTab === 'unpaid' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Unpaid Hammer Lots ({unpaidLots.length})
          {activeTab === 'unpaid' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
        </button>

        <button
          onClick={() => setActiveTab('kyc')}
          className={`pb-3 relative transition-colors whitespace-nowrap ${
            activeTab === 'kyc' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Bidder KYC Verification Queue ({pendingBidders.length})
          {activeTab === 'kyc' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`pb-3 relative transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'events' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Vendor Tasting Events ({events.length})</span>
          {stats.pendingEventsCount > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full border border-amber-300">
              {stats.pendingEventsCount} Review
            </span>
          )}
          {activeTab === 'events' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
        </button>

        <button
          onClick={() => setActiveTab('live')}
          className={`pb-3 relative transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'live' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Auction Catalog & Lots ({liveLots.length})</span>
          {stats.pendingLotsCount > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full border border-amber-300">
              {stats.pendingLotsCount} Review
            </span>
          )}
          {activeTab === 'live' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: UNPAID HAMMER LOTS (SECTION 10 48H SLA)                            */}
      {/* ========================================================================= */}
      {activeTab === 'unpaid' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Sub Header & Search Filter Bar */}
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <AlertCircle size={16} className="text-amber-600" />
                Unpaid Hammer Lots (Section 10 48h SLA Tracking)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Statutory SLA: Winning bidders must settle within 48 hours before lots default and are relisted
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter Pills */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-semibold text-slate-600">
                <button
                  onClick={() => setUnpaidFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    unpaidFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
                  }`}
                >
                  All ({unpaidLots.length})
                </button>
                <button
                  onClick={() => setUnpaidFilter('overdue')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    unpaidFilter === 'overdue' ? 'bg-red-50 text-red-700 shadow-2xs' : 'hover:text-red-700'
                  }`}
                >
                  Overdue 48h
                </button>
                <button
                  onClick={() => setUnpaidFilter('active')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    unpaidFilter === 'active' ? 'bg-amber-50 text-amber-700 shadow-2xs' : 'hover:text-amber-700'
                  }`}
                >
                  Within SLA
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search lot, bidder, ref..."
                  value={unpaidSearch}
                  onChange={(e) => setUnpaidSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Lot Information</th>
                  <th className="py-3 px-4">Winning Bidder</th>
                  <th className="py-3 px-4">Hammer Price</th>
                  <th className="py-3 px-4">Total with Premium</th>
                  <th className="py-3 px-4">48h SLA Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredUnpaidLots.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-400">
                      <CheckCircle2 size={26} className="mx-auto mb-2 text-emerald-500" />
                      {unpaidSearch ? 'No unpaid lots match your filter criteria.' : 'All hammer lots are fully settled. No overdue balances in queue!'}
                    </td>
                  </tr>
                ) : (
                  filteredUnpaidLots.map((lot) => {
                    const isOverdue = lot.endDate && (Date.now() - new Date(lot.endDate).getTime() > 48 * 3600 * 1000);
                    const hoursElapsed = lot.endDate ? Math.round((Date.now() - new Date(lot.endDate).getTime()) / (3600 * 1000)) : 0;

                    return (
                      <tr key={lot._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{lot.title}</div>
                          <div className="text-slate-400 text-[11px] flex items-center gap-1.5 mt-0.5">
                            <span>Lot #{lot.lotNumber || 'N/A'}</span>
                            <span>•</span>
                            <span className="font-mono">{lot.gsReference || 'GS-AUC'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{lot.winner?.name || 'Private Collector'}</div>
                          <div className="text-slate-400 text-[11px]">{lot.winner?.email} • {lot.winner?.phone || 'N/A'}</div>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          R {Number(lot.winningBid || 0).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-blue-700">
                          R {Number(lot.totalPaidByBuyer || lot.winningBid || 0).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            {isOverdue ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-100 text-red-800 border border-red-200">
                                <Clock size={11} /> Overdue ({hoursElapsed}h)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock size={11} /> Active SLA ({48 - hoursElapsed}h left)
                              </span>
                            )}

                            {lot.reminderSent && (
                              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Bell size={10} className="text-blue-600" />
                                Reminder Sent {new Date(lot.reminderSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {lot.reminderSent && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                                <Check size={11} className="text-emerald-600" />
                                Notified
                              </span>
                            )}
                            <button
                              onClick={() => handleSendReminder(lot)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-2xs transition-colors cursor-pointer"
                              title="Send Section 10 Payment Reminder directly to winner's Gmail"
                            >
                              <Mail size={13} />
                              <span>Send Notification (Gmail)</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BIDDER KYC VERIFICATION QUEUE & APPROVED DIRECTORY                 */}
      {/* ========================================================================= */}
      {activeTab === 'kyc' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Sub Header & Switcher */}
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-blue-600" />
                High-Value Bidder KYC & Credit Limit Gate
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect identity dossiers, allocate bidding limit brackets, and manage approved VIP privileges
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* KYC View Switcher */}
              <div className="flex bg-slate-100 p-0.5 rounded-xl text-xs font-semibold text-slate-600">
                <button
                  onClick={() => setKycTab('pending')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    kycTab === 'pending' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
                  }`}
                >
                  Pending Queue ({pendingBidders.length})
                </button>
                <button
                  onClick={() => setKycTab('approved')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    kycTab === 'approved' ? 'bg-white text-slate-900 shadow-2xs' : 'hover:text-slate-900'
                  }`}
                >
                  Approved Directory
                </button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search bidder name, ID, email..."
                  value={kycSearch}
                  onChange={(e) => setKycSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Pending Queue Sub-View */}
          {kycTab === 'pending' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4">Applicant</th>
                    <th className="py-3 px-4">ID Details</th>
                    <th className="py-3 px-4">Documents Submitted</th>
                    <th className="py-3 px-4">Requested Level</th>
                    <th className="py-3 px-4">Registered Date</th>
                    <th className="py-3 px-4 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {pendingBidders.filter(b => 
                    (b.name || '').toLowerCase().includes(kycSearch.toLowerCase()) ||
                    (b.email || '').toLowerCase().includes(kycSearch.toLowerCase()) ||
                    (b.idNumber || '').toLowerCase().includes(kycSearch.toLowerCase())
                  ).length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        <ShieldCheck size={26} className="mx-auto mb-2 text-emerald-500" />
                        No pending bidder KYC verifications awaiting review.
                      </td>
                    </tr>
                  ) : (
                    pendingBidders.filter(b => 
                      (b.name || '').toLowerCase().includes(kycSearch.toLowerCase()) ||
                      (b.email || '').toLowerCase().includes(kycSearch.toLowerCase()) ||
                      (b.idNumber || '').toLowerCase().includes(kycSearch.toLowerCase())
                    ).map((b) => (
                      <tr key={b._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{b.name}</div>
                          <div className="text-slate-400 text-[11px]">{b.email} • {b.phone || 'N/A'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-800">{b.idType || 'National ID'}:</span> {b.idNumber || 'Pending'}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            {b.idDocumentUrl ? (
                              <a 
                                href={b.idDocumentUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                              >
                                <FileText size={12} /> ID Proof
                              </a>
                            ) : (
                              <span className="text-slate-400">No ID Attached</span>
                            )}
                            {b.proofOfResidenceUrl && (
                              <a 
                                href={b.proofOfResidenceUrl} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                              >
                                <FileText size={12} /> Residence
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700 capitalize">
                          {b.bidderLevel?.replace(/_/g, ' ') || 'Level 2 Verified'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(b.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleQuickApproveBidder(b)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-2xs transition-colors cursor-pointer"
                              title="Direct 1-Click Approval (Assigns VIP Paddle & R25,000 Level 2 Limit)"
                            >
                              <CheckCircle2 size={13} />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => setKycModalUser(b)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                              title="Review Dossier & Set Custom Limits"
                            >
                              <Eye size={12} />
                              <span>Review</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Approved Directory Sub-View */}
          {kycTab === 'approved' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-3 px-4">Approved Bidder</th>
                    <th className="py-3 px-4">Bidder Level</th>
                    <th className="py-3 px-4">Authorized Limit</th>
                    <th className="py-3 px-4">Verified Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Adjust Privileges</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {approvedLoading ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-blue-600" />
                        Loading approved bidder registry...
                      </td>
                    </tr>
                  ) : approvedBiddersList.filter(b => 
                    (b.name || '').toLowerCase().includes(kycSearch.toLowerCase()) ||
                    (b.email || '').toLowerCase().includes(kycSearch.toLowerCase())
                  ).length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        No approved high-value bidders registered yet.
                      </td>
                    </tr>
                  ) : (
                    approvedBiddersList.filter(b => 
                      (b.name || '').toLowerCase().includes(kycSearch.toLowerCase()) ||
                      (b.email || '').toLowerCase().includes(kycSearch.toLowerCase())
                    ).map((b) => (
                      <tr key={b._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{b.name}</div>
                          <div className="text-slate-400 text-[11px]">{b.email} • {b.phone || 'N/A'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-purple-50 text-purple-700 border border-purple-200 capitalize">
                            {b.bidderLevel?.replace(/_/g, ' ') || 'Level 2 Verified'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-blue-800 text-sm">
                          R {Number(b.biddingLimit || 0).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {b.bidderApprovedAt ? new Date(b.bidderApprovedAt).toLocaleDateString() : 'Active'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Approved & Active
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setKycModalUser(b)}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                          >
                            Adjust Limit
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: TASTING EVENTS DESK & DOOR WALK-IN PASSES                          */}
      {/* ========================================================================= */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          {/* Sub Header & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tasting title, venue, vendor estate..."
                  value={eventSearch}
                  onChange={(e) => setEventSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-56 sm:w-72"
                />
              </div>

              {/* Approval Status Filter */}
              <select
                value={eventApprovalFilter}
                onChange={(e) => setEventApprovalFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="all">All Vendor Submissions ({events.length})</option>
                <option value="pending_approval">Pending Approval ({stats.pendingEventsCount || 0})</option>
                <option value="approved">Approved & Published</option>
                <option value="rejected">Rejected</option>
              </select>

              <select
                value={eventTypeFilter}
                onChange={(e) => setEventTypeFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="all">All Experience Types</option>
                <option value="Wine Tasting">Wine Tasting</option>
                <option value="Whisky Experience">Whisky Experience</option>
                <option value="Masterclass">Masterclass</option>
                <option value="Winemaker Dinner">Winemaker Dinner</option>
              </select>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {stats.pendingEventsCount > 0 && (
                <span className="px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded-xl flex items-center gap-1.5">
                  <Clock size={13} className="text-amber-600" />
                  <span>{stats.pendingEventsCount} Awaiting Review</span>
                </span>
              )}
              <div className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-2 self-start sm:self-auto">
                <Users size={14} className="text-blue-600" />
                <span>{filteredEvents.reduce((acc, e) => acc + (e.soldTickets || 0), 0)} Total Tickets Booked</span>
              </div>
            </div>
          </div>

          {/* Grid of Tasting Experiences */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                <Calendar size={32} className="mx-auto mb-2 text-slate-300" />
                No tasting experiences found matching your filters.
              </div>
            ) : (
              filteredEvents.map((evt) => {
                const soldPct = Math.min(100, Math.round(((evt.soldTickets || 0) / (evt.capacity || 1)) * 100));

                return (
                  <div 
                    key={evt.id || evt._id} 
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-blue-400 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-50 text-purple-700 rounded-md border border-purple-200">
                          {evt.type}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {/* Approval Status Badge */}
                          {evt.approvalStatus === 'pending_approval' ? (
                            <span className="px-2 py-0.5 text-[11px] font-bold bg-amber-50 text-amber-800 rounded-md border border-amber-300 flex items-center gap-1">
                              <Clock size={11} className="text-amber-600" /> Pending Review
                            </span>
                          ) : evt.approvalStatus === 'rejected' ? (
                            <span className="px-2 py-0.5 text-[11px] font-bold bg-red-50 text-red-800 rounded-md border border-red-300 flex items-center gap-1">
                              <XCircle size={11} className="text-red-600" /> Rejected
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-800 rounded-md border border-emerald-300 flex items-center gap-1">
                              <CheckCircle2 size={11} className="text-emerald-600" /> Approved
                            </span>
                          )}
                          <span className="text-xs font-semibold text-slate-500">{evt.format}</span>
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm mt-2">{evt.title}</h3>

                      {/* Submitting Vendor / Estate */}
                      {evt.vendor && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg w-fit">
                          <Users size={11} className="text-blue-600" />
                          <span>Submitted by: <strong className="text-slate-900">{evt.vendor.name}</strong></span>
                        </div>
                      )}

                      {evt.hostName && (
                        <p className="text-[11px] text-purple-700 font-semibold mt-1">
                          Host: {evt.hostName} ({evt.hostTitle || 'Cellar Master'})
                        </p>
                      )}

                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Clock size={12} /> {new Date(evt.date).toLocaleDateString()} at {evt.startTime}
                      </p>
                      <p className="text-xs text-slate-600 mt-1 font-medium">{evt.location}</p>

                      {evt.approvalStatus === 'rejected' && evt.approvalNote && (
                        <div className="mt-2.5 p-2 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-800">
                          <strong>Curator Feedback:</strong> {evt.approvalNote}
                        </div>
                      )}

                      {/* Ticket Capacity Progress Bar */}
                      <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5">
                        <div className="flex justify-between text-xs text-slate-600">
                          <span className="text-[11px] text-slate-400">Tickets Booked</span>
                          <span className="font-bold text-slate-900">{evt.soldTickets} / {evt.capacity} ({soldPct}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-600 h-full rounded-full transition-all"
                            style={{ width: `${soldPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Checked in stats */}
                      <div className="mt-3 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/60 flex items-center justify-between text-xs">
                        <span className="text-emerald-700 font-semibold">Door Attendance:</span>
                        <span className="font-extrabold text-emerald-900">{evt.checkedInCount} Checked In</span>
                      </div>
                    </div>

                    {/* Card Actions - Approval Workflow */}
                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      {evt.approvalStatus === 'pending_approval' ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApproveEvent(evt.id || evt._id, evt.title)}
                            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 size={14} />
                            Approve & Publish
                          </button>
                          <button
                            onClick={() => openRejectModal('event', evt.id || evt._id, evt.title)}
                            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <XCircle size={14} />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenGuestList(evt)}
                            className="flex-1 py-2.5 px-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-2xs hover:shadow-sm transition-all flex items-center justify-between group cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <UserCheck size={15} className="text-blue-100 group-hover:scale-110 transition-transform" />
                              <span>View Guests & Desk</span>
                            </span>
                            <span className="flex items-center gap-1 text-[11px] font-medium text-blue-100 bg-blue-700/70 px-2 py-0.5 rounded-lg">
                              <span>{evt.soldTickets || 0} Booked</span>
                              <ChevronRight size={13} className="opacity-80 group-hover:translate-x-0.5 transition-transform" />
                            </span>
                          </button>

                          {evt.approvalStatus === 'approved' && (
                            <button
                              onClick={() => openRejectModal('event', evt.id || evt._id, evt.title)}
                              className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-slate-200 cursor-pointer"
                              title="Revoke / Reject event"
                            >
                              <XCircle size={14} />
                            </button>
                          )}
                          {evt.approvalStatus === 'rejected' && (
                            <button
                              onClick={() => handleApproveEvent(evt.id || evt._id, evt.title)}
                              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                              title="Re-approve event"
                            >
                              <CheckCircle2 size={13} />
                              Re-Approve
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ACTIVE & UPCOMING CATALOGS                                         */}
      {/* ========================================================================= */}
      {activeTab === 'live' && (
        <div className="space-y-4">
          {/* Sub Header & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search catalog lot, distillery, vintage, vendor..."
                  value={lotSearch}
                  onChange={(e) => setLotSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-56 sm:w-72"
                />
              </div>

              <select
                value={lotStatusFilter}
                onChange={(e) => setLotStatusFilter(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="all">All Vendor Consignments ({liveLots.length})</option>
                <option value="pending_approval">Pending Review ({stats.pendingLotsCount || 0})</option>
                <option value="live">Live (Bidding Open)</option>
                <option value="upcoming">Upcoming</option>
                <option value="extended">Extended (Overtime)</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {stats.pendingLotsCount > 0 && (
                <span className="px-2.5 py-1 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded-xl flex items-center gap-1.5">
                  <Clock size={13} className="text-amber-600" />
                  <span>{stats.pendingLotsCount} Awaiting Review</span>
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLiveLots.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                <Gavel size={32} className="mx-auto mb-2 text-slate-300" />
                No auction lots found matching your filter criteria.
              </div>
            ) : (
              filteredLiveLots.map((lot) => {
                const reserveMet = lot.currentBid >= lot.reservePrice;

                return (
                  <div key={lot._id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between hover:border-blue-300 transition-colors">
                    <div>
                      {/* Lot Header & Status */}
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-slate-600">Lot #{lot.lotNumber || 'N/A'}</span>
                        {lot.status === 'pending_approval' ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-800 rounded border border-amber-300 flex items-center gap-1">
                            <Clock size={10} className="text-amber-600" /> Pending Review
                          </span>
                        ) : lot.status === 'rejected' ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-red-50 text-red-800 rounded border border-red-300 flex items-center gap-1">
                            <XCircle size={10} className="text-red-600" /> Rejected
                          </span>
                        ) : (
                          <StatusBadge status={lot.status} />
                        )}
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm">{lot.title}</h3>

                      {/* Submitting Vendor Consignor */}
                      {lot.vendor && (
                        <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg w-fit">
                          <Users size={11} className="text-blue-600" />
                          <span>Consignor: <strong className="text-slate-900">{lot.vendor.name || lot.vendor.storeName || 'Vendor'}</strong></span>
                        </div>
                      )}
                      
                      <div className="text-[11px] text-slate-500 mt-1">
                        {lot.distillery || lot.category} {lot.vintage ? `• ${lot.vintage}` : ''} {lot.fillLevel ? `• ${lot.fillLevel}` : ''}
                      </div>

                      {lot.status === 'rejected' && lot.authenticationNotes && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-xl text-[11px] text-red-800">
                          <strong>Curator Feedback:</strong> {lot.authenticationNotes}
                        </div>
                      )}

                      {/* Bidding Matrix */}
                      <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-slate-600">
                          <span className="font-medium">Current High Bid:</span>
                          <span className="font-extrabold text-blue-700 text-sm">
                            R {Number(lot.currentBid || 0).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-slate-500">
                          <span>Confidential Reserve:</span>
                          <span className="font-medium">R {Number(lot.reservePrice || 0).toLocaleString()}</span>
                        </div>

                        <div className="flex justify-between text-slate-500 pt-1 border-t border-slate-200">
                          <span>Reserve Condition:</span>
                          {reserveMet ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Reserve Met
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              Below Reserve
                            </span>
                          )}
                        </div>

                        <div className="flex justify-between text-slate-500">
                          <span>Total Floor/Web Bids:</span>
                          <span className="font-semibold text-slate-800">{lot.bidCount || 0} bids</span>
                        </div>

                        {/* Leader summary row */}
                        <div className="flex justify-between items-center text-slate-500 pt-1 border-t border-slate-200">
                          <span>Highest Bidder:</span>
                          <span className="font-semibold text-slate-800">
                            {lot.highBidder?.name || 'No bids yet'}
                          </span>
                        </div>
                      </div>

                      {/* Current Highest Bidder Dossier Card */}
                      {lot.highBidder ? (
                        <div className="mt-2.5 p-2.5 bg-blue-50/70 rounded-xl border border-blue-200/80 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1">
                              <UserCheck size={11} className="text-blue-600" /> Current Leader
                            </span>
                            {lot.highBidder.bidderNumber && (
                              <span className="px-1.5 py-0.2 text-[10px] font-mono font-bold bg-white text-blue-700 rounded border border-blue-200">
                                Paddle #{lot.highBidder.bidderNumber}
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-slate-900 truncate">
                            {lot.highBidder.name || 'Anonymous High Bidder'}
                          </div>
                          {(lot.highBidder.email || lot.highBidder.phone) && (
                            <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                              <span>{lot.highBidder.email}</span>
                              {lot.highBidder.phone && <span>• {lot.highBidder.phone}</span>}
                            </div>
                          )}
                          <div className="text-[11px] font-semibold text-blue-900 flex justify-between pt-0.5 border-t border-blue-100">
                            <span>Top Bid Value:</span>
                            <span className="font-extrabold text-blue-700">R {Number(lot.currentBid || 0).toLocaleString()}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
                          <span>Active Bidder:</span>
                          <span className="italic">No bids recorded yet</span>
                        </div>
                      )}

                      {/* Who Won The Lot Card (Sold / Closed / Declared Winner) */}
                      {(lot.winner || lot.status === 'sold') && (
                        <div className="mt-2.5 p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                              <Sparkles size={11} className="text-emerald-600" /> Lot Won / Hammer Fell
                            </span>
                            <span className="px-1.5 py-0.2 text-[10px] font-bold bg-emerald-600 text-white rounded">
                              Winner Declared
                            </span>
                          </div>
                          <div className="font-bold text-slate-900 truncate">
                            {lot.winner?.name || lot.highBidder?.name || 'Verified Collector'}
                          </div>
                          <div className="text-[11px] text-slate-600 flex items-center justify-between pt-0.5">
                            <span>Final Hammer Price:</span>
                            <span className="font-extrabold text-emerald-800">
                              R {Number(lot.winningBid || lot.currentBid || 0).toLocaleString()}
                            </span>
                          </div>
                          {lot.winner?.email && (
                            <div className="text-[10px] text-slate-500 truncate">
                              {lot.winner.email} {lot.winner.phone ? `• ${lot.winner.phone}` : ''}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                      <div className="text-[11px] text-slate-400 flex items-center justify-between">
                        <span>Closes:</span>
                        <span className="font-medium text-slate-700">{new Date(lot.endDate).toLocaleString()}</span>
                      </div>

                      {/* Lot Action Buttons: Admin cannot change bids; only view live bids stream */}
                      <div className="flex items-center gap-2 pt-1">
                        {lot.status === 'pending_approval' ? (
                          <>
                            <button
                              onClick={() => handleApproveLot(lot)}
                              className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 size={13} />
                              Approve & Authenticate
                            </button>

                            <button
                              onClick={() => openRejectModal('lot', lot._id, lot.lotNumber || lot.title)}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <XCircle size={13} />
                              Reject
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setSelectedLotForBids(lot)}
                              className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                              title="View real-time live bids stream, highest bidder & lot winner details"
                            >
                              <Eye size={13} />
                              <span>View Live Bids ({lot.bidCount || 0})</span>
                            </button>

                            {lot.status === 'rejected' ? (
                              <button
                                onClick={() => handleApproveLot(lot)}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                title="Re-approve lot"
                              >
                                <CheckCircle2 size={12} />
                                Re-Approve
                              </button>
                            ) : (
                              <button
                                onClick={() => openRejectModal('lot', lot._id, lot.lotNumber || lot.title)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-slate-200 cursor-pointer"
                                title="Reject consignment"
                              >
                                <XCircle size={13} />
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteLot(lot._id, lot.lotNumber)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                              title="Remove auction lot"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TASTING GUEST CHECK-IN & CUSTOMER DETAILS MODAL                           */}
      {/* ========================================================================= */}
      {selectedEventForDesk && (() => {
        const totalGuests = guestList.length;
        const checkedInCount = guestList.filter(g => g.checkedIn).length;
        const pendingCount = guestList.filter(g => !g.checkedIn).length;
        const totalRevenue = guestList.reduce((sum, g) => sum + Number(g.totalPaid || 0), 0);
        const capacity = selectedEventForDesk.capacity || 1;
        const bookedTickets = selectedEventForDesk.soldTickets || totalGuests;
        const checkInPct = totalGuests > 0 ? Math.round((checkedInCount / totalGuests) * 100) : 0;

        const filteredGuests = guestList.filter((g) => {
          const q = guestSearchQuery.toLowerCase().trim();
          const matchesSearch = !q || (
            (g.userName?.toLowerCase() || '').includes(q) ||
            (g.userEmail?.toLowerCase() || '').includes(q) ||
            (g.userPhone?.toLowerCase() || '').includes(q) ||
            (g.ticketId?.toLowerCase() || '').includes(q) ||
            (g.gsReference?.toLowerCase() || '').includes(q) ||
            (g.ticketType?.toLowerCase() || '').includes(q)
          );

          if (!matchesSearch) return false;
          if (guestStatusFilter === 'checkedIn') return !!g.checkedIn;
          if (guestStatusFilter === 'pending') return !g.checkedIn;
          return true;
        });

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
            <div className="bg-white rounded-3xl border border-slate-200 max-w-5xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
              
              {/* Header */}
              <div className="p-5 sm:p-6 border-b border-slate-200 flex items-start justify-between gap-4 bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-lg bg-blue-100 text-blue-800 border border-blue-200">
                      {selectedEventForDesk.type}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {selectedEventForDesk.format}
                    </span>
                    <StatusBadge status={selectedEventForDesk.status} />
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl mt-1.5 flex items-center gap-2">
                    <UserCheck size={22} className="text-blue-600 shrink-0" />
                    <span>{selectedEventForDesk.title}</span>
                  </h3>

                  <p className="text-xs text-slate-600 mt-1 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock size={13} className="text-slate-400" />
                      {new Date(selectedEventForDesk.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at {selectedEventForDesk.startTime}
                    </span>
                    <span>•</span>
                    <span className="text-slate-600 font-medium">
                      Venue: {selectedEventForDesk.location}
                    </span>
                    {selectedEventForDesk.hostName && (
                      <>
                        <span>•</span>
                        <span className="text-purple-700 font-semibold">
                          Host: {selectedEventForDesk.hostName} ({selectedEventForDesk.hostTitle || 'Sommelier'})
                        </span>
                      </>
                    )}
                  </p>
                </div>

                <button 
                  onClick={() => setSelectedEventForDesk(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors shrink-0"
                  title="Close customer details desk"
                >
                  <X size={20} />
                </button>
              </div>

              {/* KPI Summary Strip */}
              <div className="p-4 sm:p-5 bg-white border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between text-slate-500 text-xs">
                    <span>Tickets Booked</span>
                    <Ticket size={15} className="text-blue-600" />
                  </div>
                  <div className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                    {totalGuests} <span className="text-xs font-medium text-slate-500">/ {capacity} cap</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {Math.round((bookedTickets / capacity) * 100)}% capacity filled
                  </div>
                </div>

                <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/60">
                  <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
                    <span>Checked In & Admitted</span>
                    <CheckCircle2 size={15} className="text-emerald-600" />
                  </div>
                  <div className="text-lg sm:text-xl font-black text-emerald-900 mt-1">
                    {checkedInCount} <span className="text-xs font-semibold text-emerald-700">Guests</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">
                    {checkInPct}% door attendance
                  </div>
                </div>

                <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/60">
                  <div className="flex items-center justify-between text-amber-800 text-xs font-semibold">
                    <span>Awaiting Arrival</span>
                    <Clock size={15} className="text-amber-600" />
                  </div>
                  <div className="text-lg sm:text-xl font-black text-amber-900 mt-1">
                    {pendingCount} <span className="text-xs font-semibold text-amber-700">Pending</span>
                  </div>
                  <div className="text-[11px] text-amber-700 mt-0.5 font-medium">
                    Not checked in yet
                  </div>
                </div>

                <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200/60">
                  <div className="flex items-center justify-between text-blue-800 text-xs font-semibold">
                    <span>Ticket Revenue</span>
                    <DollarSign size={15} className="text-blue-600" />
                  </div>
                  <div className="text-lg sm:text-xl font-black text-blue-900 mt-1 truncate">
                    R {totalRevenue.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-blue-700 mt-0.5 font-medium">
                    Settled payments
                  </div>
                </div>
              </div>

              {/* Attendance Progress Line */}
              <div className="px-5 pt-3 bg-slate-50/30">
                <div className="flex justify-between items-center text-[11px] text-slate-500 mb-1 font-medium">
                  <span>Door Attendance Progress</span>
                  <span><strong>{checkedInCount}</strong> of <strong>{totalGuests}</strong> ticket holders admitted ({checkInPct}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${checkInPct}%` }}
                    title={`${checkedInCount} Checked In`}
                  />
                  <div 
                    className="bg-amber-400 h-full transition-all duration-300"
                    style={{ width: `${100 - checkInPct}%` }}
                    title={`${pendingCount} Awaiting Arrival`}
                  />
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                {/* Status Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 self-start sm:self-auto">
                  <button
                    onClick={() => setGuestStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      guestStatusFilter === 'all' 
                        ? 'bg-white text-slate-900 shadow-2xs font-bold' 
                        : 'hover:text-slate-900'
                    }`}
                  >
                    All Customers ({totalGuests})
                  </button>
                  <button
                    onClick={() => setGuestStatusFilter('checkedIn')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      guestStatusFilter === 'checkedIn' 
                        ? 'bg-emerald-600 text-white shadow-2xs font-bold' 
                        : 'hover:text-emerald-700'
                    }`}
                  >
                    <CheckCircle2 size={13} />
                    Checked In ({checkedInCount})
                  </button>
                  <button
                    onClick={() => setGuestStatusFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      guestStatusFilter === 'pending' 
                        ? 'bg-amber-500 text-white shadow-2xs font-bold' 
                        : 'hover:text-amber-800'
                    }`}
                  >
                    <Clock size={13} />
                    Awaiting ({pendingCount})
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative flex-1 max-w-md">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search customer name, email, phone, ticket pass, ref..."
                    value={guestSearchQuery}
                    onChange={(e) => setGuestSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                  {guestSearchQuery && (
                    <button
                      onClick={() => setGuestSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>

              {/* Customer Roster List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 bg-slate-50/40">
                {guestLoading ? (
                  <div className="py-20 text-center text-slate-400 text-xs">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
                    Loading attendee details from booking ledger...
                  </div>
                ) : filteredGuests.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-6">
                    <Ticket size={32} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700 text-sm">
                      {guestSearchQuery 
                        ? `No customers match search "${guestSearchQuery}"` 
                        : guestStatusFilter === 'checkedIn' 
                          ? 'No customers have checked in yet for this experience.' 
                          : guestStatusFilter === 'pending'
                            ? 'All customers have already checked in!'
                            : 'No customer ticket purchases recorded for this tasting event yet.'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {guestSearchQuery 
                        ? 'Try searching by a different name, email, or ticket code.' 
                        : 'Confirmed customer ticket purchases appear here automatically once settled.'}
                    </p>
                  </div>
                ) : (
                  filteredGuests.map((g) => (
                    <div 
                      key={g.bookingId} 
                      className={`p-4 rounded-2xl border transition-all ${
                        g.checkedIn 
                          ? 'bg-emerald-50/25 border-emerald-200/80 hover:border-emerald-300' 
                          : 'bg-white border-slate-200 hover:border-blue-300 shadow-2xs'
                      }`}
                    >
                      {/* Top Row: Customer identity & check-in badge */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 ${
                            g.checkedIn ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {(g.userName || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-900 text-sm">{g.userName}</span>
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-50 text-purple-700 border border-purple-200 capitalize">
                                {g.userTier || 'Private Collector'}
                              </span>
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                                g.paymentStatus === 'Paid' || g.paymentStatus === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {g.paymentStatus || 'Paid'}
                              </span>
                            </div>

                            <div className="text-xs text-slate-500 flex items-center gap-3 mt-1 flex-wrap">
                              <span className="flex items-center gap-1">
                                <Mail size={12} className="text-slate-400" />
                                <a href={`mailto:${g.userEmail}`} className="hover:text-blue-600 hover:underline">{g.userEmail}</a>
                                <button 
                                  onClick={() => handleCopyText(g.userEmail, `email-${g.bookingId}`)}
                                  className="text-slate-400 hover:text-slate-700 p-0.5 transition-colors"
                                  title="Copy customer email"
                                >
                                  {copiedId === `email-${g.bookingId}` ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                </button>
                              </span>

                              {g.userPhone && g.userPhone !== 'N/A' && (
                                <span className="flex items-center gap-1">
                                  <Phone size={12} className="text-slate-400" />
                                  <a href={`tel:${g.userPhone}`} className="hover:text-blue-600">{g.userPhone}</a>
                                  <button 
                                    onClick={() => handleCopyText(g.userPhone, `phone-${g.bookingId}`)}
                                    className="text-slate-400 hover:text-slate-700 p-0.5 transition-colors"
                                    title="Copy customer phone"
                                  >
                                    {copiedId === `phone-${g.bookingId}` ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                                  </button>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Check-In Status Tag */}
                        <div>
                          {g.checkedIn ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-2xs">
                              <CheckCircle2 size={14} className="text-emerald-600" />
                              Checked In & Admitted
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Clock size={14} className="text-amber-600" />
                              Awaiting Arrival
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Middle Grid: Detailed Ticket & Purchase Breakdown */}
                      <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-[11px] text-slate-400 block font-medium">Ticket Pass Code</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono font-bold text-slate-800 text-xs bg-white px-2 py-0.5 rounded border border-slate-200">
                              {g.ticketId}
                            </span>
                            <button 
                              onClick={() => handleCopyText(g.ticketId, `ticket-${g.bookingId}`)}
                              className="text-slate-400 hover:text-blue-600 p-0.5 transition-colors"
                              title="Copy ticket pass code"
                            >
                              {copiedId === `ticket-${g.bookingId}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-400 block font-medium">Ticket Tier & Quantity</span>
                          <div className="font-semibold text-slate-900 mt-0.5 truncate">
                            {g.ticketType} <span className="text-slate-500 font-normal">({g.quantity || 1} {g.quantity === 1 ? 'Pass' : 'Passes'})</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-400 block font-medium">Total Paid</span>
                          <div className="font-bold text-blue-700 mt-0.5 flex items-center gap-1">
                            <span>R {Number(g.totalPaid || 0).toLocaleString()}</span>
                            <span className="text-[10px] text-slate-400 font-normal">({g.paymentMethod || 'PayFast'})</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-400 block font-medium">Purchased Date</span>
                          <div className="text-slate-600 mt-0.5 text-[11px] flex items-center gap-1 font-medium">
                            <Calendar size={11} className="text-slate-400" />
                            <span>{g.bookedAt ? new Date(g.bookedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Action Bar */}
                      <div className="mt-3 pt-2.5 flex items-center justify-between gap-2 flex-wrap">
                        <button
                          onClick={() => setSelectedCustomerDossier(g)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors shadow-2xs"
                        >
                          <FileText size={13} className="text-blue-600" />
                          View Full Customer Dossier
                        </button>

                        <div className="flex items-center gap-2">
                          {g.checkedIn ? (
                            <button
                              onClick={() => handleToggleCheckIn(g.bookingId)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-2xs cursor-pointer"
                              title="Click to revert check-in status"
                            >
                              <RotateCcw size={13} className="text-slate-500" />
                              Undo Check-In
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleCheckIn(g.bookingId)}
                              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-colors shadow-2xs cursor-pointer"
                            >
                              <CheckCircle2 size={14} />
                              Check In Customer
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 text-xs">
                <div className="text-slate-600">
                  Showing <strong>{filteredGuests.length}</strong> of <strong>{totalGuests}</strong> customer ticket holders (<strong>{checkedInCount}</strong> checked in)
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleOpenGuestList(selectedEventForDesk)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors shadow-2xs"
                  >
                    <RefreshCw size={13} className={guestLoading ? 'animate-spin' : ''} />
                    Refresh
                  </button>

                  <button
                    onClick={() => setSelectedEventForDesk(null)}
                    className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-200/80 hover:bg-slate-300 rounded-xl transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* CUSTOMER FULL DETAILS DOSSIER POPUP                                       */}
      {/* ========================================================================= */}
      {selectedCustomerDossier && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <UserCheck size={18} className="text-blue-600" />
                  Customer Ticket & Attendance Dossier
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Full registration, payment, and door verification record
                </p>
              </div>
              <button 
                onClick={() => setSelectedCustomerDossier(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Customer Personal Info */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Users size={14} className="text-blue-600" />
                Customer Identity
              </h4>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[11px]">Full Name</span>
                  <span className="font-semibold text-slate-900 text-sm">{selectedCustomerDossier.userName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Customer Classification</span>
                  <span className="font-bold text-purple-700 capitalize">{selectedCustomerDossier.userTier || 'Private Collector'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Email Address</span>
                  <span className="font-medium text-slate-800 break-all">{selectedCustomerDossier.userEmail}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Phone Number</span>
                  <span className="font-medium text-slate-800">{selectedCustomerDossier.userPhone || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Ticket Pass Information */}
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 space-y-2 text-xs">
              <h4 className="font-bold text-blue-900 flex items-center gap-1.5">
                <Ticket size={14} className="text-blue-700" />
                Ticket Pass Details
              </h4>
              <div className="grid grid-cols-2 gap-2 text-slate-700">
                <div>
                  <span className="text-slate-400 block text-[11px]">Ticket Pass ID</span>
                  <span className="font-mono font-bold text-blue-900 bg-white px-2 py-0.5 rounded border border-blue-200 inline-block mt-0.5">
                    {selectedCustomerDossier.ticketId}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Booking Reference</span>
                  <span className="font-mono font-bold text-slate-800 inline-block mt-0.5">
                    {selectedCustomerDossier.gsReference || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Ticket Tier</span>
                  <span className="font-semibold text-slate-900">{selectedCustomerDossier.ticketType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Pass Quantity</span>
                  <span className="font-bold text-slate-900">{selectedCustomerDossier.quantity || 1} Attendee Pass(es)</span>
                </div>
              </div>
            </div>

            {/* Accounting Breakdown */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Receipt size={14} className="text-blue-600" />
                Payment & Accounting Ledger
              </h4>
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Unit Price:</span>
                  <span>R {Number(selectedCustomerDossier.unitPrice || selectedCustomerDossier.totalPaid || 0).toLocaleString()}</span>
                </div>
                {selectedCustomerDossier.vatAmount ? (
                  <div className="flex justify-between text-slate-600">
                    <span>VAT (15% Included):</span>
                    <span>R {Number(selectedCustomerDossier.vatAmount).toLocaleString()}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-slate-900 font-bold text-sm pt-1 border-t border-slate-200">
                  <span>Total Amount Paid:</span>
                  <span className="text-blue-700">R {Number(selectedCustomerDossier.totalPaid || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500 pt-1 text-[11px]">
                  <span>Payment Gateway / Method:</span>
                  <span className="font-medium text-slate-700">{selectedCustomerDossier.paymentMethod || 'PayFast'} ({selectedCustomerDossier.paymentStatus || 'Paid'})</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Booked At:</span>
                  <span>{selectedCustomerDossier.bookedAt ? new Date(selectedCustomerDossier.bookedAt).toLocaleString() : 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Check-In Status Strip */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
              selectedCustomerDossier.checkedIn 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="flex items-center gap-2">
                {selectedCustomerDossier.checkedIn ? (
                  <CheckCircle2 size={18} className="text-emerald-600" />
                ) : (
                  <Clock size={18} className="text-amber-600" />
                )}
                <div>
                  <div className="font-bold">
                    {selectedCustomerDossier.checkedIn ? 'Admitted & Checked In' : 'Awaiting Door Arrival'}
                  </div>
                  <div className="text-[11px] opacity-80">
                    Ticket Status: {selectedCustomerDossier.ticketStatus || (selectedCustomerDossier.checkedIn ? 'Used' : 'Valid')}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleToggleCheckIn(selectedCustomerDossier.bookingId)}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shadow-2xs ${
                  selectedCustomerDossier.checkedIn
                    ? 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {selectedCustomerDossier.checkedIn ? 'Undo Check-In' : 'Check In Customer'}
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCustomerDossier(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Curator Rejection Feedback Dialog */}
      {rejectionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                <AlertCircle size={18} />
                <span>Reject {rejectionModal.type === 'event' ? 'Tasting Experience' : 'Auction Consignment'}</span>
              </div>
              <button
                onClick={() => setRejectionModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Please enter the curator review feedback for declining <strong>"{rejectionModal.title}"</strong>. This will be recorded on the vendor audit dossier.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Curator Reason / Feedback:
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Provenance documents incomplete, reserve valuation misaligned, or scheduling conflict with master calendar..."
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 text-slate-900"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setRejectionModal(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejection}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      <LiveBidsModal 
        isOpen={!!selectedLotForBids}
        onClose={() => setSelectedLotForBids(null)}
        lot={selectedLotForBids}
        onFetchBids={getLotBids}
      />

      <KycReviewModal 
        isOpen={!!kycModalUser}
        onClose={() => setKycModalUser(null)}
        onUpdateKyc={handleUpdateKyc}
        bidder={kycModalUser}
      />
    </div>
  );
}
