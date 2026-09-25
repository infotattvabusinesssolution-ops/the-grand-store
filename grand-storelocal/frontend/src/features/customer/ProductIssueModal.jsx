import React, { useState, useEffect } from 'react';
import api from '../../api';
import { 
  X, AlertTriangle, Package, Truck, MessageSquare, Send, 
  CheckCircle2, Clock, ShieldCheck, ChevronRight, RefreshCw,
  Phone, Mail, ArrowLeft, Loader2, Sparkles, AlertCircle
} from 'lucide-react';

export default function ProductIssueModal({ isOpen, onClose, order, productItem, initialTicket, onTicketCreated }) {
  const [selectedIssue, setSelectedIssue] = useState('delivery_delayed');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTicket, setActiveTicket] = useState(initialTicket || null);
  const [chatMessage, setChatMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (initialTicket) {
      setActiveTicket(initialTicket);
    } else {
      setActiveTicket(null);
      setDescription('');
    }
  }, [initialTicket, isOpen]);

  if (!isOpen || !order) return null;

  const issueOptions = [
    {
      id: 'delivery_delayed',
      label: 'Item Not Delivered / Delayed Delivery',
      desc: 'Order has been paid and dispatched but has not reached address / PostNet branch.',
      icon: Truck,
      badge: 'High Priority'
    },
    {
      id: 'damaged_bottle',
      label: 'Damaged / Broken Bottle upon Arrival',
      desc: 'Bottle arrived broken, cracked, or seal was compromised in transit.',
      icon: AlertTriangle,
      badge: 'Instant Replacement'
    },
    {
      id: 'wrong_item',
      label: 'Wrong Item or Missing Bottles',
      desc: 'Received a different vintage, wine, or quantity from what was ordered.',
      icon: Package,
      badge: 'Exchange / Refund'
    },
    {
      id: 'tracking_stuck',
      label: 'Courier Tracking Stuck / Not Updating',
      desc: 'Waybill shows no movement for more than 48 hours.',
      icon: Clock,
      badge: 'Courier Trace'
    }
  ];

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    setSubmitting(true);
    try {
      const payload = {
        orderId: order._id,
        orderItemId: productItem?._id || productItem?.product,
        issueType: selectedIssue,
        message: description.trim(),
        productSnapshot: {
          product: productItem?.product || 'custom_product',
          name: productItem?.name || 'Grand Store Reserve Bottle',
          image: productItem?.image || '',
          price: productItem?.price || order.totalPrice || 0,
          quantity: productItem?.quantity || 1,
          option: productItem?.option || ''
        }
      };

      const res = await api.post('/tickets/create', payload);
      if (res.data?.success) {
        setActiveTicket(res.data.ticket);
        if (onTicketCreated) onTicketCreated(res.data.ticket);
      }
    } catch (err) {
      console.error('Failed to create support ticket:', err);
      alert(err.response?.data?.message || 'Could not submit support ticket. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || !activeTicket) return;

    setSendingMessage(true);
    try {
      const res = await api.post(`/tickets/${activeTicket._id}/messages`, {
        message: chatMessage.trim()
      });
      if (res.data?.success) {
        setActiveTicket(prev => ({
          ...prev,
          conversation: res.data.conversation,
          status: res.data.status || prev.status
        }));
        setChatMessage('');
      }
    } catch (err) {
      console.error('Failed to append message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'courier_traced':
        return <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[11px] font-mono font-bold">Courier Trace In Progress</span>;
      case 'reshipped':
        return <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[11px] font-mono font-bold">Replacement Reshipped</span>;
      case 'refunded':
        return <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-[11px] font-mono font-bold">Refund Issued</span>;
      case 'resolved':
      case 'closed':
        return <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-[11px] font-mono font-bold">Resolved</span>;
      default:
        return <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-full text-[11px] font-mono font-bold animate-pulse">Under Priority Investigation</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#111215] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-[var(--color-gold)] border border-amber-500/20">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-white tracking-tight">
                {activeTicket ? `Incident Support ${activeTicket.ticketNumber}` : 'Customer Help & Item Support'}
              </h2>
              <p className="text-[11px] text-white/50 font-mono">
                Order #{order.orderId || order._id} • Guaranteed Resolution Policy
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar text-xs">
          
          {/* Product Summary Card (Flipkart/Amazon Style) */}
          <div className="p-3.5 sm:p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center gap-4">
            <div className="w-14 h-16 sm:w-16 sm:h-20 rounded-lg bg-black border border-white/10 p-1 flex items-center justify-center shrink-0 overflow-hidden">
              {productItem?.image ? (
                <img src={productItem.image} alt={productItem.name} className="h-full object-contain" />
              ) : (
                <Package size={22} className="text-amber-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-gold)] font-bold">
                  {order.paymentMethod || 'Online Order'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                  Paid R {(productItem?.price || order.totalPrice || 0).toLocaleString()}
                </span>
              </div>
              <h3 className="text-sm font-serif font-bold text-white truncate mt-1">
                {productItem?.name || 'Luxury Selection Item'}
              </h3>
              <p className="text-[11px] text-white/60 mt-0.5">
                Qty: {productItem?.quantity || 1} {productItem?.option ? `• ${productItem.option}` : ''} • Placed on {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {!activeTicket ? (
            /* STEP 1: Select Issue & Submit */
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                  1. What issue are you experiencing with this bottle?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {issueOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = selectedIssue === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedIssue(opt.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'bg-amber-500/10 border-amber-500/60 ring-1 ring-amber-500/30'
                            : 'bg-white/[0.015] border-white/10 hover:border-white/20 hover:bg-white/[0.03]'
                        }`}
                      >
                        <div className={`p-2 rounded-lg mt-0.5 ${isSelected ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-white/50'}`}>
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-white text-xs">{opt.label}</span>
                          </div>
                          <p className="text-[11px] text-white/50 mt-1 line-clamp-2 leading-relaxed">
                            {opt.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-1.5">
                  2. Detailed description for the Concierge & Logistics Desk
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. My order has been paid and status shows dispatched via PostNet, but I have not received the parcel or collection PIN at my address..."
                  className="w-full p-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center gap-2.5 text-white/70 text-[11px]">
                <ShieldCheck size={16} className="text-[var(--color-gold)] shrink-0" />
                <span>
                  <strong>Grand Store Assurance:</strong> All transit shipments are 100% insured against loss, breakage, or delivery delays.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !description.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[var(--color-gold)] hover:brightness-110 text-black font-bold text-xs shadow-lg shadow-amber-900/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Submitting Incident...
                    </>
                  ) : (
                    <>
                      Open Support Ticket <ChevronRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* STEP 2: Live Support Chat & Incident Tracker */
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-white/10 bg-black/40 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-sm">#{activeTicket.ticketNumber}</span>
                    {getStatusBadge(activeTicket.status)}
                  </div>
                  <p className="text-[11px] text-white/50 mt-1">
                    Subject: {activeTicket.subject}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-white/40 block">Opened</span>
                  <span className="text-xs text-white/80 font-mono">
                    {new Date(activeTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Chat Thread */}
              <div className="space-y-2.5 max-h-64 overflow-y-auto p-3 rounded-xl bg-black/50 border border-white/5 custom-scrollbar">
                {activeTicket.conversation?.map((msg, idx) => {
                  const isUser = msg.sender === 'customer';
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-white/40 font-mono">
                        <span>{msg.senderName}</span>
                        <span>•</span>
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                          isUser
                            ? 'bg-amber-500/20 text-amber-100 border border-amber-500/30 rounded-tr-sm'
                            : 'bg-white/[0.06] text-white/90 border border-white/10 rounded-tl-sm'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Reply Form */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Send a follow-up reply or question to the concierge..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-white/30 text-xs focus:outline-none focus:border-amber-500/50"
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !chatMessage.trim()}
                  className="px-4 py-2.5 bg-[var(--color-gold)] text-black rounded-xl font-bold text-xs hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {sendingMessage ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />} Send
                </button>
              </form>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-[11px] text-white/50">
                  Concierge Desk SLA: Responds within 1–3 business hours
                </span>
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close & View Order
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
