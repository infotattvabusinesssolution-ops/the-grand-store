import React from 'react';
import { Clock, Eye, MapPin, MessageSquare, Package, User, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function OrderBoardCard({ lane, item, onOpenOrder, onOpenTicket, onResolveException, onViewSettlements }) {
  const linkedOrder = item.order || item.orderId;
  const order = lane.isExceptionLane ? (typeof linkedOrder === 'object' && linkedOrder ? linkedOrder : {}) : item;
  const orderRef = order.orderId || `GS-${String(order._id || item._id || '').slice(-6).toUpperCase()}`;
  const customerName = order.customerName || item.customer?.name || 'Valued Patron';
  const phone = order.customerPhone || item.customer?.phone;
  const address = [order.shippingAddress?.city, order.shippingAddress?.province].filter(Boolean).join(', ');
  const products = order.orderItems || [];
  const productSummary = products.map(product => `${product.quantity}× ${product.name}`).join(', ');
  const created = new Date(order.createdAt || item.createdAt);
  const dateLabel = Number.isNaN(created.getTime()) ? 'Date unavailable' : created.toLocaleDateString();

  return (
    <article className={`crm-order-card ${lane.isExceptionLane ? 'crm-order-card--exception' : ''}`}>
      <div className="crm-order-card-heading">
        <button type="button" onClick={() => onOpenOrder(order)} className="min-w-0 truncate text-left font-extrabold text-blue-700 hover:underline" title={`Open order #${orderRef}`}>
          #{orderRef}
        </button>
        <span className="crm-order-amount">R {Number(order.totalPrice ?? order.totalAmount ?? 0).toLocaleString()}</span>
      </div>
      <div className="min-w-0 space-y-1">
        <p className="flex min-w-0 items-center gap-2 font-semibold text-slate-800">
          <User size={13} className="shrink-0 text-slate-400" />
          <span className="truncate" title={customerName}>{customerName}</span>
        </p>
        <p className="truncate pl-5 text-[11px] text-slate-500">{phone || 'Phone not provided'}</p>
        <p className="flex min-w-0 items-center gap-2 text-[11px] text-slate-500">
          <MapPin size={13} className="shrink-0 text-slate-400" />
          <span className="truncate" title={address}>{address || 'Location not provided'}</span>
        </p>
      </div>
      <div className="crm-order-products">
        <p className="flex items-center gap-1.5 font-semibold text-slate-700">
          <Package size={12} /> {products.length ? `${products.length} product line${products.length === 1 ? '' : 's'}` : 'Order items'}
        </p>
        <p className="truncate mt-1 text-[11px] text-slate-500" title={productSummary}>{productSummary || 'View order for item details'}</p>
      </div>
      <div className="crm-order-action">
        {lane.isExceptionLane ? (
          <>
            <div className="flex min-w-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
              <AlertTriangle size={12} className="shrink-0" />
              <span className="truncate">{(item.status || 'Courier exception').replaceAll('_', ' ')}</span>
            </div>
            <p className="truncate text-[11px] text-slate-600" title={item.subject || item.orderItem?.name}>
              {item.isCustomerTicket ? (item.subject || `Ticket #${item.ticketNumber}`) : `Carrier: ${item.legs?.[0]?.courierName || item.carrier || 'The Courier Guy'}`}
            </p>
            <button type="button" onClick={() => item.isCustomerTicket ? onOpenTicket(item) : onResolveException(item)} className="crm-order-button crm-order-button--exception">
              <MessageSquare size={13} /> {item.isCustomerTicket ? 'Inspect ticket & actions' : 'Resolve exception'}
            </button>
          </>
        ) : lane.key === 'completed' ? (
          <>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700"><CheckCircle2 size={13} /> 30-day payout active</span>
            <button type="button" onClick={onViewSettlements} className="crm-order-button">View settlements →</button>
          </>
        ) : (
          <button type="button" onClick={() => onOpenOrder(order)} className="crm-order-button">
            <Eye size={13} /> {lane.key === 'vendorProcessing' ? 'View fulfilment details' : 'View order details'}
          </button>
        )}
      </div>
      <p className="flex items-center gap-1.5 border-t border-slate-100 pt-2 text-[10px] text-slate-500">
        <Clock size={11} /> Placed: {dateLabel}
      </p>
    </article>
  );
}
