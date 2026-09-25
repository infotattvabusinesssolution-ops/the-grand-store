import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrmOrders } from '../hooks/useCrmOrders';
import StatusBadge from '../components/common/StatusBadge';
import OrderBoardCard from '../components/orders/OrderBoardCard';
import { 
  ShoppingBag, Truck, AlertTriangle, CheckCircle2, 
  ExternalLink, Clock, User, MapPin, X, Search, Eye,
  ArrowRight, Check, RefreshCw, Send, Phone, Mail,
  Package, DollarSign, ShieldAlert, FileText, ChevronRight,
  MessageSquare, Sparkles, RefreshCcw, CreditCard, Loader2, ShieldCheck
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { crmApi } from '../services/crmApi';

export default function CrmOrdersBoardPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { lanes, loading, error, refresh, updateOrderStage, resolveException } = useCrmOrders();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedException, setSelectedException] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketReply, setTicketReply] = useState('');
  const [ticketActionLoading, setTicketActionLoading] = useState(false);
  const [trackingInput, setTrackingInput] = useState('');

  const [resolutionData, setResolutionData] = useState({
    exceptionType: 'courier_delay',
    resolutionNotes: '',
    resolutionStatus: 'resolved',
    courierWaybillUrl: ''
  });
  const [submitting, setSubmitting] = useState(false);

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

  // Advance Order to next lane
  const handleAdvanceStage = async (orderId, newStatus, trackingNo = '') => {
    try {
      await updateOrderStage(orderId, {
        status: newStatus,
        vendorDispatchStatus: newStatus === 'Vendor Processing' ? 'processing' : 'dispatched',
        trackingNumber: trackingNo || undefined
      });
      toast.success(`Order moved to "${newStatus}"!`);
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(null);
      }
    } catch (err) {
      toast.error('Failed to update order stage');
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedException) return;
    setSubmitting(true);
    try {
      await resolveException(selectedException._id, resolutionData);
      toast.success('Logistics exception resolved! Shipment resumed to transit.');
      setSelectedException(null);
    } catch (err) {
      toast.error('Failed to update exception');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter helper
  const filterItems = (items) => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(item => {
      const order = item.order || item;
      const orderId = (order.orderId || '').toLowerCase();
      const custName = (order.customerName || item.customer?.name || '').toLowerCase();
      const city = (order.shippingAddress?.city || '').toLowerCase();
      return orderId.includes(term) || custName.includes(term) || city.includes(term);
    });
  };

  const laneDefinitions = [
    {
      key: 'newOrders',
      title: 'New Orders',
      subtitle: 'Payment Confirmed • Assign Fulfilment',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      items: filterItems(lanes.newOrders?.items || []),
      totalCount: lanes.newOrders?.count || 0
    },
    {
      key: 'vendorProcessing',
      title: 'Vendor Processing',
      subtitle: 'Awaiting Vendor Dispatch Confirmation',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      items: filterItems(lanes.vendorProcessing?.items || []),
      totalCount: lanes.vendorProcessing?.count || 0
    },
    {
      key: 'shipmentIssues',
      title: 'Shipment Issues',
      subtitle: 'Delivery Exceptions • Priority Action',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      items: filterItems(lanes.shipmentIssues?.items || []),
      totalCount: lanes.shipmentIssues?.count || 0,
      isExceptionLane: true
    },
    {
      key: 'completed',
      title: 'Completed',
      subtitle: 'Delivered • 30-Day Payout Active',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      items: filterItems(lanes.completed?.items || []),
      totalCount: lanes.completed?.count || 0
    }
  ];

  return (
    <div className="crm-page space-y-6">
      <header className="crm-page-header">
        <div className="crm-page-intro">
          <p className="crm-page-eyebrow">Store operations</p>
          <h1 className="crm-page-title">Orders & fulfilment</h1>
          <p className="crm-page-description">Follow each order from payment to delivery. Review customer details and resolve shipment issues in one place.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
          <ShoppingBag size={14} /> {laneDefinitions.reduce((sum, lane) => sum + lane.totalCount, 0).toLocaleString()} records across all stages
        </span>
      </header>

      <div className="crm-order-toolbar">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Fulfilment board</h2>
          <p className="mt-1 text-xs text-slate-500">Four stages · Select an order to view details</p>
        </div>
        <div className="crm-order-toolbar-controls">
          <div className="relative min-w-0 flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="search" aria-label="Search orders by reference, customer or city"
              placeholder="Order, customer or city…"
              value={searchTerm} onChange={event => setSearchTerm(event.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-9 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
            {searchTerm && (
              <button type="button" aria-label="Clear order search" onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"><X size={14} /></button>
            )}
          </div>
          <button type="button" onClick={refresh} disabled={loading} aria-label="Refresh order board"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-600">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

      {/* 4-Lane Horizontal Operations Board */}
      <div className="crm-workspace-region">
      <div className="crm-order-grid" aria-busy={loading}>
        {laneDefinitions.map((lane) => (
          <div
            key={lane.key}
            className={`
              crm-order-lane
              ${lane.isExceptionLane ? 'crm-order-lane--exception' : ''}
            `}
          >
            {/* Lane Title & Count */}
            <div className="crm-order-lane-header">
              <div>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight">{lane.title}</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{lane.subtitle}</p>
              </div>
              <span className={`shrink-0 whitespace-nowrap px-2 py-0.5 rounded-full text-xs font-extrabold border ${lane.badgeColor}`}>
                {lane.items.length} {searchTerm && lane.totalCount > lane.items.length ? `/ ${lane.totalCount}` : ''}
              </span>
            </div>

            {/* Cards Feed */}
            <div className="crm-order-feed crm-scrollbar">
              {lane.items.length === 0 ? (
                <div className="crm-order-empty">
                  <Package size={28} className="text-slate-300" />
                  {loading ? 'Loading orders…' : searchTerm ? 'No matching orders in this lane' : 'No orders in this stage'}
                </div>
              ) : (
                lane.items.map((item) => (
                  <OrderBoardCard
                    key={item._id}
                    lane={lane}
                    item={item}
                    onOpenOrder={setSelectedOrder}
                    onOpenTicket={setSelectedTicket}
                    onResolveException={(exception) => {
                      setSelectedException(exception);
                      setResolutionData(prev => ({
                        ...prev,
                        courierWaybillUrl: exception.tcgTrackingUrl || exception.courierWaybillUrl || ''
                      }));
                    }}
                    onViewSettlements={() => navigate('/settlements')}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      </div>

      {/* ORDER 360 INSPECTION MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto crm-scrollbar space-y-4">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Order #{selectedOrder.orderId || selectedOrder._id}
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                    selectedOrder.status === 'Delivered' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : selectedOrder.status === 'Vendor Processing'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {selectedOrder.status || 'Payment Confirmed'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()} • Total: R {Number(selectedOrder.totalPrice || selectedOrder.totalAmount || 0).toLocaleString()}
                </p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Customer & Shipping Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900">Customer Details</p>
                <p className="font-medium text-slate-800">{selectedOrder.customerName || selectedOrder.user?.name || 'Customer'}</p>
                {selectedOrder.customerEmail && (
                  <p className="text-slate-500 font-mono text-[11px]">{selectedOrder.customerEmail}</p>
                )}
                {selectedOrder.customerPhone && (
                  <p className="text-slate-500 text-[11px]">{selectedOrder.customerPhone}</p>
                )}
                <div className="pt-2 flex gap-2">
                  {selectedOrder.customerPhone && (
                    <a
                      href={`https://wa.me/${selectedOrder.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${selectedOrder.customerName}, this is Grand Store regarding your order #${selectedOrder.orderId}...`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-bold text-[11px] border border-emerald-200 inline-flex items-center gap-1"
                    >
                      <Send size={11} /> WhatsApp
                    </a>
                  )}
                  {selectedOrder.customerEmail && (
                    <a
                      href={`mailto:${selectedOrder.customerEmail}?subject=${encodeURIComponent(`Grand Store Order Update #${selectedOrder.orderId}`)}`}
                      className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold text-[11px] border border-blue-200 inline-flex items-center gap-1"
                    >
                      <Mail size={11} /> Email
                    </a>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                <p className="font-bold text-slate-900">Delivery Destination</p>
                <p className="text-slate-700 leading-relaxed">
                  {selectedOrder.shippingAddress?.address || 'Standard Address'}<br />
                  {selectedOrder.shippingAddress?.city || 'Cape Town'}, {selectedOrder.shippingAddress?.province || 'Western Cape'} {selectedOrder.shippingAddress?.postalCode || ''}<br />
                  {selectedOrder.shippingAddress?.country || 'South Africa'}
                </p>
                <p className="text-[11px] text-slate-400 pt-1">
                  Payment Method: <span className="font-bold text-slate-700 capitalize">{selectedOrder.paymentMethod || 'Credit Card (PayFast)'}</span>
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <p className="font-bold text-slate-900 text-xs mb-2">Bottles & Spirits Breakdown</p>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Item / Vintage</th>
                      <th className="py-2.5 px-3">Qty</th>
                      <th className="py-2.5 px-3">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {(!selectedOrder.orderItems || selectedOrder.orderItems.length === 0) ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400">Order item details not loaded</td>
                      </tr>
                    ) : (
                      selectedOrder.orderItems.map((item, idx) => (
                        <tr key={item._id || idx}>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              {item.image && (
                                <img src={item.image} alt={item.name} className="w-8 h-10 object-contain rounded bg-white p-0.5 border border-slate-100" />
                              )}
                              <div>
                                <p className="font-bold text-slate-900">{item.name}</p>
                                <p className="text-[10px] text-slate-400 capitalize">{item.category} • {item.option || 'Bottle'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-3 font-bold">{item.quantity}</td>
                          <td className="py-2 px-3">R {Number(item.price).toLocaleString()}</td>
                          <td className="py-2 px-3 text-right font-bold text-slate-900">
                            R {(item.quantity * item.price).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Telemetry & Logistics Information Banner (Read-Only) */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-slate-800">Fulfillment & Delivery Telemetry</p>
                  <p className="text-[11px] text-slate-500">
                    Handled by vendor estate dispatch & integrated courier tracking (Read-only observation mode)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const custId = selectedOrder.user?._id || selectedOrder.user || selectedOrder.customerId;
                    if (custId) {
                      navigate(`/customers/${custId}`);
                    } else {
                      toast.info('No linked customer ID found for this order.');
                    }
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs border border-slate-200 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
                >
                  <User size={13} className="text-blue-600" /> Customer 360
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exception Resolution Modal */}
      {selectedException && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 text-sm">Resolve Logistics Exception</h3>
              <button 
                onClick={() => setSelectedException(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Exception Type</label>
                <select
                  value={resolutionData.exceptionType}
                  onChange={(e) => setResolutionData({ ...resolutionData, exceptionType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="courier_delay">Courier Transit Delay</option>
                  <option value="failed_delivery">Customer Not Home / Failed Delivery</option>
                  <option value="address_query">Address Incomplete / Query</option>
                  <option value="customs_hold">Customs Hold (International)</option>
                  <option value="damaged_in_transit">Damaged in Transit (Insurance Claim)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Resolution Status</label>
                <select
                  value={resolutionData.resolutionStatus}
                  onChange={(e) => setResolutionData({ ...resolutionData, resolutionStatus: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="resolved">Resolved (Resume Transit)</option>
                  <option value="in_investigation">In Investigation (Operations Active)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Resolution Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail conversation with courier depot or revised customer ETA..."
                  value={resolutionData.resolutionNotes}
                  onChange={(e) => setResolutionData({ ...resolutionData, resolutionNotes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedException(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Update Exception'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOMER INCIDENT & SUPPORT TICKET MODAL */}
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
                    Order #{selectedTicket.order?.orderId || selectedTicket.orderId} • Customer: {selectedTicket.order?.customerName || selectedTicket.customerName}
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
