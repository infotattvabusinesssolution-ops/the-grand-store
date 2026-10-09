import React from 'react';
import { AlertTriangle, Clock, Truck, ShieldAlert, ChevronRight, ExternalLink } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function AttentionRequired({ 
  overdueTasks = [], 
  delayedShipments = [], 
  pendingVendorRegistrations = [],
  onOpenTaskModal,
  onNavigate
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Attention Required
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Shipments Requiring Attention */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:border-blue-300 transition-all">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <Truck size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Shipments Requiring Attention</h3>
                  <p className="text-[11px] text-slate-500">Parcels marked Delayed, Failed, or Exception</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                {delayedShipments.length} Priority
              </span>
            </div>

            <div className="divide-y divide-slate-100 mt-2 max-h-56 overflow-y-auto crm-scrollbar">
              {delayedShipments.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  ✓ All active dispatches are on schedule
                </div>
              ) : (
                delayedShipments.map((shipment) => (
                  <div key={shipment._id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">
                        Order #{shipment.order?.orderId || 'GS-ORDER'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Carrier: {shipment.carrier || 'The Courier Guy'} • Waybill: {shipment.waybillNumber || 'Pending'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={shipment.status || 'Delayed'} />
                      <a 
                        href={`https://thecourierguy.co.za/tracking?waybill=${shipment.waybillNumber || ''}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Track Waybill"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => onNavigate('/orders')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              Open Order Operations Board <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* 2. Pending Vendor Documents & KYC */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:border-blue-300 transition-all">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                  <ShieldAlert size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">Pending Vendor Documents</h3>
                  <p className="text-[11px] text-slate-500">Producers awaiting KYC & liquor licence sign-off</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                {pendingVendorRegistrations.length} Pending
              </span>
            </div>

            <div className="divide-y divide-slate-100 mt-2 max-h-56 overflow-y-auto crm-scrollbar">
              {pendingVendorRegistrations.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  ✓ No vendor verifications waiting in queue
                </div>
              ) : (
                pendingVendorRegistrations.map((vendor) => (
                  <div key={vendor._id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-semibold text-slate-900">{vendor.storeName || vendor.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {vendor.email} • {vendor.kycDocuments?.length || 0} Docs Uploaded
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate(`/vendors`)}
                      className="px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold rounded-lg transition-colors"
                    >
                      Review
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => onNavigate('/vendors')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              Open Vendor Onboarding Funnel <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
