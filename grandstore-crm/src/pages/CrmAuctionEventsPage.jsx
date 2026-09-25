import React, { useState } from 'react';
import { 
  Gavel, Calendar, UserCheck, AlertCircle, DollarSign, 
  Clock, CheckCircle2, XCircle, Search, RefreshCw, Eye, 
  FileText, ShieldCheck, ChevronRight, X 
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import { useCrmAuctions } from '../hooks/useCrmAuctions';
import { useToast } from '../context/ToastContext';

export default function CrmAuctionEventsPage() {
  const toast = useToast();
  const { 
    stats, pendingBidders, unpaidLots, liveLots, events, 
    loading, refresh, updateBidderKyc, recordHammerPayment, 
    getEventGuests, toggleGuestCheckIn 
  } = useCrmAuctions();

  const [activeTab, setActiveTab] = useState('unpaid'); // 'unpaid' | 'kyc' | 'events' | 'live'
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [guestList, setGuestList] = useState([]);
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestSearchQuery, setGuestSearchQuery] = useState('');
  const [kycModalUser, setKycModalUser] = useState(null);
  const [biddingLimitInput, setBiddingLimitInput] = useState('250000');
  const [paymentModalLot, setPaymentModalLot] = useState(null);
  const [paymentRefInput, setPaymentRefInput] = useState('');

  const handleOpenGuestList = async (event) => {
    setSelectedEvent(event);
    setGuestLoading(true);
    setGuestSearchQuery('');
    try {
      const data = await getEventGuests(event.id);
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
      setGuestList(prev => prev.map(g => 
        g.bookingId === bookingId ? { ...g, ticketStatus: res.ticketStatus, checkedIn: res.checkedIn } : g
      ));
      toast.success(res.checkedIn ? 'Guest checked in successfully!' : 'Check-in status cleared.');
    } catch (err) {
      toast.error('Failed to update guest check-in');
    }
  };

  const handleApproveKyc = async (user, approve) => {
    try {
      await updateBidderKyc(user._id, {
        status: approve ? 'approved' : 'rejected',
        limit: approve ? Number(biddingLimitInput) : 0,
        level: approve ? 'level_3_enhanced' : 'level_1_registered',
        reason: approve ? 'KYC documents verified by CRM Staff' : 'Identity document illegible or incomplete'
      });
      setKycModalUser(null);
      if (approve) {
        toast.success(`Bidder KYC approved with limit R ${Number(biddingLimitInput).toLocaleString()}`);
      } else {
        toast.warning('Bidder KYC rejected and flagged for resubmission.');
      }
    } catch (err) {
      toast.error('Failed to update KYC status');
    }
  };

  const handleClearHammerPayment = async () => {
    if (!paymentModalLot) return;
    try {
      await recordHammerPayment(paymentModalLot._id, {
        paymentStatus: 'Paid',
        paymentReference: paymentRefInput || `EFT-AUC-${Date.now().toString().slice(-6)}`
      });
      setPaymentModalLot(null);
      setPaymentRefInput('');
      toast.success('Hammer payment recorded! Lot authorized for cellar release.');
    } catch (err) {
      toast.error('Failed to update payment status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Auctions & Tasting Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Section 10 Operational Hub: Real-time hammer watch, unpaid lot recovery, bidder KYC gate, and tasting guest desk.
          </p>
        </div>

        <button 
          onClick={refresh}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Live Auction Desk
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Unpaid Hammer Lots" 
          value={stats.unpaidLotsCount || 0} 
          icon={AlertCircle} 
          color="amber"
          subtitle="Awaiting payment settlement"
        />
        <StatCard 
          title="Pending Bidder KYC" 
          value={stats.pendingKycCount || 0} 
          icon={UserCheck} 
          color="blue"
          subtitle="High-value bidding approval"
        />
        <StatCard 
          title="Active Live Auctions" 
          value={stats.liveAuctionsCount || 0} 
          icon={Gavel} 
          color="purple"
          subtitle="Bidding engine active"
        />
        <StatCard 
          title="Upcoming Tastings" 
          value={stats.upcomingEventsCount || 0} 
          icon={Calendar} 
          color="emerald"
          subtitle="Cellar & masterclasses"
        />
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs sm:text-sm font-semibold">
        <button
          onClick={() => setActiveTab('unpaid')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'unpaid' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Unpaid Hammer Lots ({unpaidLots.length})
          {activeTab === 'unpaid' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
        </button>

        <button
          onClick={() => setActiveTab('kyc')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'kyc' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Bidder KYC Verification Queue ({pendingBidders.length})
          {activeTab === 'kyc' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'events' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Tasting Events Desk ({events.length})
          {activeTab === 'events' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
        </button>

        <button
          onClick={() => setActiveTab('live')}
          className={`pb-3 relative transition-colors ${
            activeTab === 'live' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Active / Upcoming Catalogs ({liveLots.length})
          {activeTab === 'live' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
        </button>
      </div>

      {/* Tab 1: Unpaid Hammer Lots */}
      {activeTab === 'unpaid' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Unpaid Hammer Lots (48h SLA Follow-up)</h2>
              <p className="text-xs text-slate-500">Section 10 SLA: Winning bidders must settle within 48 hours before lots default</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">{unpaidLots.length} Pending Collections</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Lot Information</th>
                  <th className="py-3 px-4">Winning Bidder</th>
                  <th className="py-3 px-4">Hammer Price</th>
                  <th className="py-3 px-4">Total with Premium</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {unpaidLots.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-slate-400">
                      <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
                      All hammer lots are fully settled. No overdue balances!
                    </td>
                  </tr>
                ) : (
                  unpaidLots.map((lot) => (
                    <tr key={lot._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{lot.title}</div>
                        <div className="text-slate-400 text-[11px]">Lot #{lot.lotNumber || 'N/A'} • {lot.gsReference || 'GS-AUC'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{lot.winner?.name || 'Private Bidder'}</div>
                        <div className="text-slate-400 text-[11px]">{lot.winner?.email} • {lot.winner?.phone || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        R {Number(lot.winningBid || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-blue-700">
                        R {Number(lot.totalPaidByBuyer || lot.winningBid || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={lot.paymentStatus} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setPaymentModalLot(lot)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
                        >
                          Clear Payment
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Bidder KYC Verification Queue */}
      {activeTab === 'kyc' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">High-Value Bidder KYC Queue</h2>
              <p className="text-xs text-slate-500">Verify government ID and proof of residence before unlocking high-limit bidding</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">{pendingBidders.length} Awaiting Verification</span>
          </div>

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
                {pendingBidders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-slate-400">
                      <ShieldCheck size={24} className="mx-auto mb-2 text-emerald-500" />
                      No pending bidder KYC verifications in queue.
                    </td>
                  </tr>
                ) : (
                  pendingBidders.map((b) => (
                    <tr key={b._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{b.name}</div>
                        <div className="text-slate-400 text-[11px]">{b.email} • {b.phone || 'N/A'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800">{b.idType || 'National ID'}:</span> {b.idNumber || 'Pending'}
                      </td>
                      <td className="py-3 px-4">
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
                            <span className="text-slate-400">No ID File</span>
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
                      <td className="py-3 px-4 font-semibold text-slate-700 capitalize">
                        {b.bidderLevel?.replace('_', ' ') || 'Level 2'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(b.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setKycModalUser(b)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors"
                        >
                          Review & Approve
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Tasting Events Desk */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
              No upcoming wine tasting events found.
            </div>
          ) : (
            events.map((evt) => (
              <div 
                key={evt.id} 
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-blue-400 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-50 text-purple-700 rounded-md border border-purple-200">
                      {evt.type}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{evt.format}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm mt-2">{evt.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                    <Clock size={12} /> {new Date(evt.date).toLocaleDateString()} at {evt.startTime}
                  </p>
                  <p className="text-xs text-slate-600 mt-1 font-medium">{evt.location}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <div className="text-slate-400 text-[10px]">Tickets Sold</div>
                      <div className="font-bold text-slate-900">{evt.soldTickets} / {evt.capacity}</div>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-xl">
                      <div className="text-emerald-700 text-[10px]">Checked In</div>
                      <div className="font-bold text-emerald-800">{evt.checkedInCount} Guests</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenGuestList(evt)}
                  className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <UserCheck size={14} /> Open Guest Check-in Desk
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 4: Live Auctions */}
      {activeTab === 'live' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {liveLots.map((lot) => (
            <div key={lot._id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-slate-500">Lot #{lot.lotNumber || 'N/A'}</span>
                  <StatusBadge status={lot.status} />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{lot.title}</h3>
                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Current High Bid:</span>
                    <span className="font-bold text-blue-700">R {Number(lot.currentBid || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Reserve Price:</span>
                    <span>R {Number(lot.reservePrice || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Total Bids:</span>
                    <span className="font-semibold">{lot.bidCount || 0}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 text-right">
                Ends: {new Date(lot.endDate).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tasting Guest Check-in Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{selectedEvent.title} — Door Desk</h3>
                <p className="text-xs text-slate-500">1-Click guest admission & digital ticket verification</p>
              </div>
              <button 
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Ticket & Guest Search Bar */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Scan or type ticket code (TCK-...) or guest name..."
                value={guestSearchQuery}
                onChange={(e) => setGuestSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {guestLoading ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-blue-600" />
                  Loading attendee roster...
                </div>
              ) : guestList.filter(g =>
                  (g.userName?.toLowerCase() || '').includes(guestSearchQuery.toLowerCase()) ||
                  (g.userEmail?.toLowerCase() || '').includes(guestSearchQuery.toLowerCase()) ||
                  (g.ticketId?.toLowerCase() || '').includes(guestSearchQuery.toLowerCase())
                ).length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  {guestSearchQuery ? `No attendees match "${guestSearchQuery}".` : 'No bookings found for this tasting.'}
                </div>
              ) : (
                guestList.filter(g =>
                  (g.userName?.toLowerCase() || '').includes(guestSearchQuery.toLowerCase()) ||
                  (g.userEmail?.toLowerCase() || '').includes(guestSearchQuery.toLowerCase()) ||
                  (g.ticketId?.toLowerCase() || '').includes(guestSearchQuery.toLowerCase())
                ).map((g) => (
                  <div 
                    key={g.bookingId} 
                    className="p-3 border border-slate-200 rounded-xl flex items-center justify-between hover:border-blue-300 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-xs">{g.userName}</span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded-md">
                          {g.ticketType} (Qty: {g.quantity})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{g.userEmail} • Pass: {g.ticketId}</p>
                    </div>

                    <button
                      onClick={() => handleToggleCheckIn(g.bookingId)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                        g.checkedIn 
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                      }`}
                    >
                      {g.checkedIn ? (
                        <>
                          <CheckCircle2 size={13} /> Checked In
                        </>
                      ) : (
                        'Admit Guest'
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Close Desk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KYC Review Modal */}
      {kycModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Approve High-Value Bidder</h3>
            <p className="text-xs text-slate-500">Assign authorized bidding limit for {kycModalUser.name}</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Approved Bidding Limit (ZAR)</label>
                <input 
                  type="number"
                  value={biddingLimitInput}
                  onChange={(e) => setBiddingLimitInput(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold text-blue-700"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => handleApproveKyc(kycModalUser, false)}
                className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl"
              >
                Reject KYC
              </button>
              <button
                onClick={() => handleApproveKyc(kycModalUser, true)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
              >
                Approve & Unlock Limit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hammer Payment Modal */}
      {paymentModalLot && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Clear Hammer Lot Payment</h3>
            <p className="text-xs text-slate-500">Record proof of payment for {paymentModalLot.title}</p>

            <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-700">
                <span>Winning Bid:</span>
                <span className="font-bold">R {paymentModalLot.winningBid?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-blue-900 font-bold">
                <span>Total Due:</span>
                <span>R {(paymentModalLot.totalPaidByBuyer || paymentModalLot.winningBid)?.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-xs space-y-1">
              <label className="font-semibold text-slate-700 block">Bank EFT / Wire Reference</label>
              <input 
                type="text"
                placeholder="e.g. FNB-EFT-994821"
                value={paymentRefInput}
                onChange={(e) => setPaymentRefInput(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setPaymentModalLot(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleClearHammerPayment}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm"
              >
                Confirm Payment & Release
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
