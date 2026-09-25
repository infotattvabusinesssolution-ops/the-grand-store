import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrmOrders } from '../hooks/useCrmOrders';
import StatusBadge from '../components/common/StatusBadge';
import { 
  ShoppingBag, Truck, AlertTriangle, CheckCircle2, 
  ExternalLink, Clock, User, MapPin, X, Search,
  ArrowRight, Check, RefreshCw, Send, Phone, Mail,
  Package, DollarSign, ShieldAlert, FileText, ChevronRight,
  MessageSquare, Sparkles, RefreshCcw, CreditCard, Loader2, ShieldCheck
} from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { crmApi } from '../services/crmApi';

export default function CrmOrdersBoardPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { lanes, loading, refresh, updateOrderStage, resolveException } = useCrmOrders();

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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Order & Fulfilment Operations Board
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 rounded-md border border-blue-200">
              Module 4 & 5 (Section 5)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic 4-stage operational board synced with live store checkout, winery dispatch timers, and courier waybills
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search Box */}
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search #GS-..., customer, city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <button
            onClick={refresh}
            className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 rounded-xl transition-colors shadow-sm cursor-pointer"
            title="Refresh Order Board"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* 4-Lane Horizontal Operations Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {laneDefinitions.map((lane) => (
          <div
            key={lane.key}
            className={`
              bg-white rounded-2xl border p-4 shadow-sm flex flex-col min-h-[600px]
              ${lane.isExceptionLane ? 'border-rose-200/90' : 'border-slate-200'}
            `}
          >
            {/* Lane Title & Count */}
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight">{lane.title}</h3>
                <p className="text-[10px] text-slate-400 font-medium truncate max-w-[170px]">{lane.subtitle}</p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold border ${lane.badgeColor}`}>
                {lane.items.length} {searchTerm && lane.totalCount > lane.items.length ? `/ ${lane.totalCount}` : ''}
              </span>
            </div>

            {/* Cards Feed */}
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[640px] crm-scrollbar pr-1">
              {lane.items.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400 font-medium">
                  {searchTerm ? 'No matching orders in this lane' : 'No orders in this stage'}
                </div>
              ) : (
                lane.items.map((item) => {
                  const isShipment = lane.isExceptionLane;
                  const order = isShipment ? (item.order || item.orderId || {}) : item;
                  const customerName = order.customerName || item.customer?.name || 'Valued Patron';
                  const customerPhone = order.customerPhone || item.customer?.phone || '';
                  const total = order.totalPrice || order.totalAmount || 0;
                  const orderRef = order.orderId || `GS-${String(order._id || item._id).slice(-6).toUpperCase()}`;

                  return (
                    <div
                      key={item._id}
                      className={`
                        bg-slate-50/80 hover:bg-slate-50 border rounded-xl p-3.5 transition-all text-xs space-y-2.5
                        ${lane.isExceptionLane ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200/80 hover:border-blue-300'}
                      `}
                    >
                      {/* Top Row: Order ID + Price */}
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="font-extrabold text-blue-700 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          #{orderRef} <ExternalLink size={10} className="text-slate-400" />
                        </button>
                        <span className="font-extrabold text-slate-900">
                          R {Number(total).toLocaleString()}
                        </span>
                      </div>

                      {/* Customer Info */}
                      <div className="text-slate-700">
                        <p className="font-semibold flex items-center gap-1 truncate">
                          <User size={12} className="text-slate-400 shrink-0" /> {customerName}
                        </p>
                        {customerPhone && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{customerPhone}</p>
                        )}
                        {order?.shippingAddress?.city && (
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin size={11} className="text-slate-400 shrink-0" /> {order.shippingAddress.city}, {order.shippingAddress.province || 'SA'}
                          </p>
                        )}
                      </div>

                      {/* Bottles / Items Count */}
                      {order.orderItems && order.orderItems.length > 0 && (
                        <div className="p-2 bg-white rounded-lg border border-slate-100 text-[11px] text-slate-600">
                          <p className="font-semibold text-slate-800">
                            {order.orderItems.length} Bottle Line Item{order.orderItems.length > 1 ? 's' : ''}:
                          </p>
                          <p className="text-slate-500 truncate mt-0.5">
                            {order.orderItems.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                          </p>
                        </div>
                      )}

                      {/* Lane 1 Dynamic Action: Assign to Vendor Processing */}
                      {lane.key === 'newOrders' && (
                        <button
                          onClick={() => handleAdvanceStage(order._id, 'Vendor Processing')}
                          className="w-full py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <span>Assign to Winery</span>
                          <ArrowRight size={12} />
                        </button>
                      )}

                      {/* Lane 2 Dynamic Action: Confirm Dispatched / Flag Issue */}
                      {lane.key === 'vendorProcessing' && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleAdvanceStage(order._id, 'Delivered')}
                            className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-sm flex items-center justify-center gap-1 transition-all cursor-pointer"
                            title="Confirm delivery and unlock 30-day payout timer"
                          >
                            <Check size={12} /> Delivered
                          </button>
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-[11px] transition-colors cursor-pointer"
                            title="Inspect order or add waybill"
                          >
                            Details
                          </button>
                        </div>
                      )}

                      {/* Lane 3 Exception Alert OR Customer Support Incident Ticket */}
                      {lane.isExceptionLane && (
                        item.isCustomerTicket ? (
                          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-2 shadow-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded text-[10px]">
                                #{item.ticketNumber}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                                item.status === 'reshipped'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : item.status === 'refunded'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                  : item.status === 'courier_traced'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                              }`}>
                                {item.status.replace('_', ' ')}
                              </span>
                            </div>

                            <div>
                              <p className="font-bold text-slate-900 text-xs line-clamp-1">
                                {item.subject}
                              </p>
                              {item.orderItem?.name && (
                                <p className="text-[11px] text-slate-600 truncate mt-0.5">
                                  <strong>Bottle:</strong> {item.orderItem.name}
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => setSelectedTicket(item)}
                              className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                            >
                              <MessageSquare size={13} />
                              <span>Inspect Ticket & Actions</span>
                            </button>
                          </div>
                        ) : (
                          <div className="p-2 bg-rose-100/70 border border-rose-200 rounded-lg text-rose-800 text-[11px]">
                            <p className="font-bold flex items-center gap-1">
                              <AlertTriangle size={12} /> {item.status || 'Courier Exception'}
                            </p>
                            <p className="text-[10px] text-rose-600 mt-0.5">
                              Carrier: {item.legs?.[0]?.courierName || item.carrier || 'The Courier Guy'}
                            </p>
                            <button
                              onClick={() => {
                                setSelectedException(item);
                                setResolutionData((prev) => ({
                                  ...prev,
                                  courierWaybillUrl: item.tcgTrackingUrl || item.courierWaybillUrl || ''
                                }));
                              }}
                              className="mt-2 w-full py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-[11px] transition-colors shadow-sm cursor-pointer"
                            >
                              Resolve Exception
                            </button>
                          </div>
                        )
                      )}

                      {/* Lane 4 Completed State: 30-Day Payout Timer Status */}
                      {lane.key === 'completed' && (
                        <div className="pt-1 flex items-center justify-between">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 size={11} /> 30-Day Payout Active
                          </span>
                          <button
                            onClick={() => navigate('/settlements')}
                            className="text-[11px] font-bold text-blue-600 hover:underline"
                          >
                            Settlements &rarr;
                          </button>
                        </div>
                      )}

                      {/* Timestamp */}
                      <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 flex items-center gap-1">
                        <Clock size={11} /> Placed: {new Date(order.createdAt || item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
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

            {/* Stage Transition Controls */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-slate-500 font-medium">Quick Move Stage:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAdvanceStage(selectedOrder._id, 'Vendor Processing')}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl font-bold text-xs border border-amber-200 transition-colors cursor-pointer"
                >
                  &rarr; Vendor Processing
                </button>
                <button
                  onClick={() => handleAdvanceStage(selectedOrder._id, 'Delivered')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors cursor-pointer"
                >
                  <Check size={12} className="inline mr-1" /> Mark Delivered (Start 30d Payout)
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
