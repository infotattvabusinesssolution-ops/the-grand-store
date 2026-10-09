import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCrmCustomer360 } from '../hooks/useCrmCustomers';
import { useCrmTasks } from '../hooks/useCrmTasks';
import StatusBadge from '../components/common/StatusBadge';
import TaskModal from '../components/common/TaskModal';
import { 
  ArrowLeft, Mail, Phone, ShoppingBag, Gavel, CalendarCheck, 
  MessageSquare, FileText, CheckCircle2, Clock, Plus, Send, 
  ExternalLink, Shield, Tag, Heart, AlertTriangle, Package,
  Truck, RefreshCcw, CreditCard, Loader2, X
} from 'lucide-react';

import { useToast } from '../context/ToastContext';
import { crmApi } from '../services/crmApi';

export default function CrmCustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading, addNote, refresh } = useCrmCustomer360(id);
  const { createTask } = useCrmTasks();

  const [activeTab, setActiveTab] = useState('orders');
  const [newNoteText, setNewNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketReply, setTicketReply] = useState('');
  const [ticketActionLoading, setTicketActionLoading] = useState(false);

  const profile = data?.profile || {};
  const dossier = data?.dossier || {};
  const history = data?.history || {};

  const handleTicketAction = async (ticketId, actionTaken, resolutionNotes = '', refundAmount = 0) => {
    setTicketActionLoading(true);
    try {
      const res = await crmApi.resolveCrmTicket(ticketId, {
        actionTaken,
        resolutionNotes,
        refundAmount
      });
      if (res.data?.success) {
        toast.success(`Action applied: ${actionTaken.replace('_', ' ').toUpperCase()}`);
        if (selectedTicket && selectedTicket._id === ticketId) {
          setSelectedTicket(res.data.ticket);
        }
        refresh();
      }
    } catch (err) {
      console.error('Failed to resolve ticket:', err);
      toast.error(err.response?.data?.message || 'Failed to update ticket');
    } finally {
      setTicketActionLoading(false);
    }
  };

  const handleSendTicketReply = async (e) => {
    e.preventDefault();
    if (!ticketReply.trim() || !selectedTicket) return;
    setTicketActionLoading(true);
    try {
      const res = await crmApi.sendTicketReply(selectedTicket._id, ticketReply.trim());
      if (res.data?.success) {
        toast.success('Concierge reply sent to customer');
        setSelectedTicket(prev => ({
          ...prev,
          conversation: res.data.conversation,
          status: res.data.status || prev.status
        }));
        setTicketReply('');
        refresh();
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
      toast.error('Failed to send reply to customer');
    } finally {
      setTicketActionLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    setSubmittingNote(true);
    try {
      await addNote(newNoteText);
      toast.success('Concierge taste preference note saved.');
      setNewNoteText('');
    } catch (err) {
      toast.error('Failed to save concierge note');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleCreateFollowUpTask = async (taskFormData) => {
    await createTask({
      ...taskFormData,
      linkedEntity: {
        entityType: 'User',
        entityId: profile._id,
        referenceCode: profile.email
      }
    });
    refresh();
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-400 max-w-7xl mx-auto">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs font-semibold">Loading Customer 360° Dossier...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/customers')}
        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft size={15} /> Back to Customer Directory
      </button>

      {/* 360 Profile Dossier Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-md shadow-blue-500/20">
            {profile.name?.charAt(0) || 'U'}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {profile.name || 'Anonymous Customer'}
              </h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-xs border capitalize tracking-wide ${
                profile.crmCustomerType === 'vip_collector'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : profile.crmCustomerType === 'trade_buyer'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : profile.crmCustomerType === 'corporate_client'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {profile.crmCustomerType ? profile.crmCustomerType.replace(/_/g, ' ') : 'Retail Client'}
              </span>
              {dossier.openTicketsCount > 0 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-xs bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                  <AlertTriangle size={12} /> {dossier.openTicketsCount} Incident Case{dossier.openTicketsCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5">
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <Mail size={13} className="text-blue-500" /> {profile.email}
              </span>
              {profile.phone && (
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <Phone size={13} className="text-blue-500" /> {profile.phone}
                </span>
              )}
              <span className="text-slate-400">• Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
            </div>

            {/* GS CRM 1.docx Profile Attributes: Country, Source, Consent */}
            <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px]">
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                Country: {profile.country || 'South Africa'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                Source: {profile.customerSource || 'Website Registration'}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                ✓ 18+ Marketing Consented
              </span>
            </div>

            {/* Direct Concierge Contact & Trade Triggers */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <a
                href={`mailto:${profile.email}?subject=Grand%20Store%20Concierge%20Service`}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold border border-blue-200 transition-colors"
                title="Send Concierge Email"
              >
                <Mail size={12} /> Send Email
              </a>
              {profile.phone && (
                <a
                  href={`https://wa.me/${profile.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-200 transition-colors"
                  title="Open WhatsApp Chat"
                >
                  <Send size={12} /> WhatsApp Chat
                </a>
              )}
              <button
                type="button"
                onClick={() => navigate('/export-trade')}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold border border-purple-200 transition-colors cursor-pointer"
                title="Create B2B Export / Trade Enquiry for this customer (Section 3)"
              >
                <Tag size={12} /> Create Trade Enquiry
              </button>
            </div>
          </div>
        </div>

        {/* 3 Financial KPIs */}
        <div className="flex items-center gap-4 sm:gap-6 border-t lg:border-t-0 pt-4 lg:pt-0 w-full lg:w-auto justify-between lg:justify-end border-slate-100">
          <div className="text-left lg:text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lifetime Spend</p>
            <p className="text-lg sm:text-xl font-extrabold text-blue-600 mt-0.5">
              R {dossier.lifetimeSpend?.toLocaleString() || 0}
            </p>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div className="text-left lg:text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Paid Orders</p>
            <p className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
              {dossier.paidOrdersCount || 0}
            </p>
          </div>
          <div className="h-8 w-px bg-slate-200"></div>
          <div className="text-left lg:text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Order</p>
            <p className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
              R {dossier.averageOrderValue?.toLocaleString() || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Tabbed Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-bold overflow-x-auto crm-scrollbar pb-px">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShoppingBag size={16} /> Purchase History
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'orders' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
            {history.orders?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('auctions')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'auctions'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Gavel size={16} /> Auctions & Tastings
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'auctions' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
            {(dossier.auctionLotsBidded || 0) + (dossier.eventsAttended || 0)}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('enquiries')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'enquiries'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText size={16} /> Sourcing & Enquiries
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'enquiries' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
            {(history.enquiries?.trade?.length || 0) + (history.enquiries?.wine?.length || 0) + (history.enquiries?.cigar?.length || 0)}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('wishlist')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'wishlist'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Heart size={16} /> Wishlist & Saved
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'wishlist' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
            {history.wishlist?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'notes'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <MessageSquare size={16} /> Team Notes & Tasks
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === 'notes' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
            {(history.internalNotes?.length || 0) + (history.tasks?.length || 0)}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'tickets'
              ? 'border-amber-600 text-amber-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <AlertTriangle size={16} className={dossier.openTicketsCount > 0 ? "text-amber-500 animate-pulse" : ""} /> Support Cases
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
            dossier.openTicketsCount > 0 
              ? 'bg-amber-100 text-amber-800 border border-amber-300' 
              : 'bg-slate-100 text-slate-600'
          }`}>
            {history.tickets?.length || 0}
          </span>
        </button>
      </div>

      {/* Tab 1: Orders History */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Order ID</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Bottles / Items</th>
                  <th className="px-6 py-3.5">Total Amount</th>
                  <th className="px-6 py-3.5">Payment</th>
                  <th className="px-6 py-3.5">Fulfillment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(!history.orders || history.orders.length === 0) ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No purchase orders recorded for this customer yet.
                    </td>
                  </tr>
                ) : (
                  history.orders.map((order) => (
                    <tr key={order._id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-6 py-4 font-bold text-blue-600">#{order.orderId || order._id}</td>
                      <td className="px-6 py-4 text-slate-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-slate-700">
                        <div className="font-semibold text-slate-800">
                          {order.orderItems?.length || 0} {order.orderItems?.length === 1 ? 'Product' : 'Products'}
                        </div>
                        {order.orderItems?.[0] && (
                          <div className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5" title={order.orderItems[0].name}>
                            {order.orderItems[0].name} {order.orderItems.length > 1 ? `(+${order.orderItems.length - 1} more)` : ''}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        R {(order.totalPrice || order.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.isPaid ? 'paid' : 'pending'} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status || 'processing'} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Auctions & Events */}
      {activeTab === 'auctions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Auction Bids & Wins */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Gavel size={16} className="text-blue-600" /> Auction Bidding & Won Lots
              </h3>
              <span className="text-xs text-slate-400">
                {history.auctions?.length || 0} {history.auctions?.length === 1 ? 'lot' : 'lots'}
              </span>
            </div>
            <div className="space-y-3">
              {(!history.auctions || history.auctions.length === 0) ? (
                <p className="text-xs text-slate-400 py-6 text-center">No auction lots bidded on yet</p>
              ) : (
                history.auctions.map((lot) => (
                  <div key={lot._id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{lot.title}</p>
                      <p className="text-[11px] text-slate-500">Lot #{lot.lotNumber} • Current Bid: R {(lot.currentBid || lot.startingBid || 0).toLocaleString()}</p>
                      {String(lot.winner) === String(profile._id) && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Won Lot
                        </span>
                      )}
                    </div>
                    <StatusBadge status={lot.status} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tasting Event Passes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CalendarCheck size={16} className="text-blue-600" /> Cellar Tastings & VIP Passes
              </h3>
              <span className="text-xs text-slate-400">
                {history.eventBookings?.length || 0} passes
              </span>
            </div>
            <div className="space-y-3">
              {(!history.eventBookings || history.eventBookings.length === 0) ? (
                <p className="text-xs text-slate-400 py-6 text-center">No event bookings on file</p>
              ) : (
                history.eventBookings.map((booking) => (
                  <div key={booking._id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{booking.event?.title || 'Tasting Masterclass'}</p>
                      <p className="text-[11px] text-slate-500">Venue: {booking.event?.venue || 'The Grand Cellar'}</p>
                      {booking.event?.eventDate && (
                        <p className="text-[10px] text-slate-400 mt-0.5">Date: {new Date(booking.event.eventDate).toLocaleDateString()}</p>
                      )}
                    </div>
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Confirmed Pass
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Enquiries */}
      {activeTab === 'enquiries' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Customer Enquiries & Sourcing Requests</h3>
            <span className="text-xs text-slate-400">
              Total: {(history.enquiries?.trade?.length || 0) + (history.enquiries?.wine?.length || 0) + (history.enquiries?.cigar?.length || 0)} requests
            </span>
          </div>

          <div className="space-y-3">
            {(!history.enquiries?.trade?.length && !history.enquiries?.wine?.length && !history.enquiries?.cigar?.length) ? (
              <p className="text-xs text-slate-400 py-8 text-center">No submitted sourcing enquiries</p>
            ) : (
              <>
                {history.enquiries?.trade?.map((item) => (
                  <div key={item._id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">Trade Wholesale Enquiry</span>
                      <p className="font-bold text-slate-900 mt-1">{item.company || item.name} ({item.country || 'South Africa'})</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                ))}

                {history.enquiries?.wine?.map((item) => (
                  <div key={item._id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded">Wine Sourcing Request</span>
                      <p className="font-bold text-slate-900 mt-1">{item.wineName || item.brand || 'Rare Wine Request'} {item.vintage ? `(${item.vintage})` : ''}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.notes || item.message || 'Customer requested vintage sourcing'}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                    <StatusBadge status={item.status || 'open'} />
                  </div>
                ))}

                {history.enquiries?.cigar?.map((item) => (
                  <div key={item._id} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">Cigar Concierge Request</span>
                      <p className="font-bold text-slate-900 mt-1">{item.cigarName || item.brand || 'Rare Cigar Request'}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.notes || item.message || 'Customer requested cigar box allocation'}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                    <StatusBadge status={item.status || 'open'} />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Tab: Wishlist & Products of Interest (Section 3 of GS CRM 1.docx) */}
      {activeTab === 'wishlist' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Customer Wishlist & Saved Products</h3>
              <p className="text-xs text-slate-500">
                Wines, rare spirits, and reserve bottles this customer has expressed interest in or bookmarked.
              </p>
            </div>
            <button
              onClick={() => navigate(`/export-trade?customerId=${id}&customerName=${encodeURIComponent(profile.name || '')}&country=${encodeURIComponent(profile.country || 'South Africa')}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold border border-blue-200 transition-colors"
            >
              <Tag size={13} /> Quote from Wishlist
            </button>
          </div>

          {(!history.wishlist || history.wishlist.length === 0) ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
              <Heart className="mx-auto text-slate-300 mb-2" size={28} />
              <p className="text-xs font-semibold text-slate-500">No items currently in customer's wishlist</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                When the customer bookmarks bottles on the Grand Store marketplace, they will synchronize here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.wishlist.map((item, idx) => (
                <div key={item._id || idx} className="p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all bg-slate-50/50 flex flex-col justify-between">
                  <div className="flex items-start gap-3">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-12 h-16 object-contain rounded bg-white p-1 border border-slate-100" />
                    ) : (
                      <div className="w-12 h-16 rounded bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-xs">
                        GS
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.brand || item.category || 'Fine Wine'}</p>
                      <h4 className="font-bold text-slate-900 text-xs truncate" title={item.name}>{item.name}</h4>
                      {item.vintage && <p className="text-[11px] text-slate-500">Vintage: {item.vintage}</p>}
                      <p className="text-xs font-extrabold text-blue-600 mt-1">R {(item.price || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      item.inStock !== false ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {item.inStock !== false ? 'In Stock' : 'Out of Stock'}
                    </span>
                    <button
                      onClick={() => {
                        navigate(`/export-trade?customerId=${id}&customerName=${encodeURIComponent(profile.name || '')}&country=${encodeURIComponent(profile.country || 'South Africa')}&product=${encodeURIComponent(item.name || '')}`);
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      Create B2B Quote &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Team Notes & Tasks */}
      {activeTab === 'notes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notes Stream */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Internal Team Communication History</h3>
            
            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="space-y-2.5">
              <textarea
                rows={3}
                placeholder="Log internal conversation, phone callback outcome, or customer preference..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingNote}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-blue-500/20 transition-all"
                >
                  <Send size={14} /> Add Note
                </button>
              </div>
            </form>

            <div className="divide-y divide-slate-100 mt-4 max-h-80 overflow-y-auto crm-scrollbar">
              {history.internalNotes?.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No internal notes recorded yet</p>
              ) : (
                history.internalNotes?.map((noteItem, idx) => (
                  <div key={idx} className="py-3 text-xs">
                    <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                      <span className="font-bold text-slate-800">{noteItem.authorName || 'Staff Member'}</span>
                      <span>{new Date(noteItem.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      {noteItem.note}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Customer Follow-up Tasks */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Assigned Follow-ups</h3>
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-bold text-xs flex items-center gap-1"
              >
                <Plus size={14} /> Task
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto crm-scrollbar">
              {history.tasks?.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No pending follow-ups for this patron</p>
              ) : (
                history.tasks?.map((task) => (
                  <div key={task._id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-slate-900">{task.title}</p>
                      <StatusBadge status={task.status} />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                    {task.completionReason && (
                      <p className="text-[10px] text-emerald-700 font-medium mt-1 bg-emerald-50 p-1.5 rounded">
                        Resolved: {task.completionReason}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Customer Support & Incident Tickets */}
      {activeTab === 'tickets' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Customer Order Incidents & Support History</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Amazon / Flipkart style reported transit delays, damaged bottles, courier traces, and authorized refunds
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-mono text-xs font-bold">
              {history.tickets?.length || 0} Total Case{history.tickets?.length === 1 ? '' : 's'}
            </span>
          </div>

          {history.tickets?.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Package size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold">No support tickets filed by this patron</p>
              <p className="text-[11px] text-slate-400 mt-0.5">All shipments and products were fulfilled without customer dispute.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.tickets?.map((t) => {
                const getStatusPill = (status) => {
                  switch (status) {
                    case 'courier_traced':
                      return <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-full text-[10px] font-bold">Courier Trace</span>;
                    case 'reshipped':
                      return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-bold">Replacement Reshipped</span>;
                    case 'refunded':
                      return <span className="px-2 py-0.5 bg-blue-100 text-blue-800 border border-blue-300 rounded-full text-[10px] font-bold">Refund Issued</span>;
                    case 'resolved':
                    case 'closed':
                      return <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-[10px] font-bold">Resolved</span>;
                    default:
                      return <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 rounded-full text-[10px] font-bold animate-pulse">Under Investigation</span>;
                  }
                };

                return (
                  <div
                    key={t._id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300 transition-all text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-14 h-16 bg-white border border-slate-200 rounded-lg p-1 flex items-center justify-center shrink-0 overflow-hidden">
                        {t.orderItem?.image ? (
                          <img src={t.orderItem.image} alt={t.orderItem.name} className="h-full object-contain" />
                        ) : (
                          <Package size={20} className="text-slate-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded text-[10px]">
                            #{t.ticketNumber}
                          </span>
                          {getStatusPill(t.status)}
                          <span className="text-[10px] text-slate-400 font-mono">
                            Order #{t.orderId || t.order?._id || 'N/A'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {t.orderItem?.name || t.subject}
                        </h4>
                        <p className="text-[11px] text-slate-600 mt-0.5 truncate">
                          <strong>Issue:</strong> {t.subject}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right hidden sm:block">
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {t.conversation?.length || 0} messages
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedTicket(t)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <MessageSquare size={13} /> Inspect & Actions
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Task Creation Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        mode="create"
        onSubmit={handleCreateFollowUpTask}
      />

      {/* Customer Support Incident Drawer / Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 max-h-[92vh] flex flex-col space-y-4">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-slate-900 text-base">
                      Incident Ticket #{selectedTicket.ticketNumber}
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800 rounded-full border border-rose-200">
                      {selectedTicket.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Order #{selectedTicket.order?.orderId || selectedTicket.orderId} • Customer: {profile.name || selectedTicket.customerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Product Card */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3.5">
              <div className="w-14 h-16 bg-white border border-slate-200 rounded-lg p-1 flex items-center justify-center shrink-0 overflow-hidden">
                {selectedTicket.orderItem?.image ? (
                  <img src={selectedTicket.orderItem.image} alt={selectedTicket.orderItem.name} className="h-full object-contain" />
                ) : (
                  <Package size={20} className="text-slate-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-slate-900 truncate">
                  {selectedTicket.orderItem?.name || selectedTicket.subject}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Qty: {selectedTicket.orderItem?.quantity || 1} • Unit Price: R {Number(selectedTicket.orderItem?.price || 0).toLocaleString()}
                </p>
                <p className="text-[11px] text-amber-700 font-semibold mt-1">
                  Reported Issue: {selectedTicket.subject}
                </p>
              </div>
            </div>

            {/* 1-Click Operations Quick Actions */}
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                  Fast Incident Operations Desk Actions
                </span>
                <span className="text-[10px] text-amber-700 font-medium">1-Click Client Updates</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  disabled={ticketActionLoading}
                  onClick={() => handleTicketAction(selectedTicket._id, 'courier_trace', 'Priority tracking escalation sent to logistics courier hub')}
                  className="p-2 rounded-lg bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] flex flex-col items-center justify-center gap-1 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Truck size={14} className="text-amber-700" />
                  <span>Courier Trace</span>
                </button>

                <button
                  type="button"
                  disabled={ticketActionLoading}
                  onClick={() => handleTicketAction(selectedTicket._id, 'free_replacement', 'Complimentary replacement dispatch authorized from reserve cellar')}
                  className="p-2 rounded-lg bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 font-bold text-[11px] flex flex-col items-center justify-center gap-1 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCcw size={14} className="text-emerald-700" />
                  <span>Free Replacement</span>
                </button>

                <button
                  type="button"
                  disabled={ticketActionLoading}
                  onClick={() => handleTicketAction(selectedTicket._id, 'wallet_refund', 'Full item refund authorized to customer wallet/card', selectedTicket.orderItem?.price || 0)}
                  className="p-2 rounded-lg bg-white hover:bg-blue-50 text-blue-900 border border-blue-300 font-bold text-[11px] flex flex-col items-center justify-center gap-1 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <CreditCard size={14} className="text-blue-700" />
                  <span>Issue Refund</span>
                </button>

                <button
                  type="button"
                  disabled={ticketActionLoading}
                  onClick={() => handleTicketAction(selectedTicket._id, 'resolved', 'Issue resolved in consultation with patron')}
                  className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex flex-col items-center justify-center gap-1 shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 size={14} />
                  <span>Mark Resolved</span>
                </button>
              </div>
            </div>

            {/* Conversation Thread */}
            <div className="flex-1 overflow-y-auto max-h-52 crm-scrollbar space-y-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              {selectedTicket.conversation?.map((msg, idx) => {
                const isConcierge = msg.sender === 'concierge';
                return (
                  <div key={idx} className={`flex flex-col ${isConcierge ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5 px-1 font-mono">
                      <span>{msg.senderName}</span>
                      <span>•</span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className={`p-2.5 rounded-xl max-w-[85%] text-xs ${
                      isConcierge
                        ? 'bg-blue-600 text-white rounded-tr-none shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs'
                    }`}>
                      {msg.message}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Concierge Reply Form */}
            <form onSubmit={handleSendTicketReply} className="flex gap-2 pt-1">
              <input
                type="text"
                required
                placeholder="Type response from Concierge & Operations desk..."
                value={ticketReply}
                onChange={(e) => setTicketReply(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="submit"
                disabled={ticketActionLoading || !ticketReply.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {ticketActionLoading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Reply
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
