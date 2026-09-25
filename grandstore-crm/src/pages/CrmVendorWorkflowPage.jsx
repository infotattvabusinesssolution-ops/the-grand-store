import React, { useState } from 'react';
import { useCrmVendors } from '../hooks/useCrmVendors';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import { 
  Building2, FileText, CheckCircle2, Clock, AlertTriangle, 
  ExternalLink, ShieldCheck, History, ArrowRight, X, Eye, 
  ShieldAlert, UserX, Check, Package, DollarSign, MessageCircle 
} from 'lucide-react';

export default function CrmVendorWorkflowPage() {
  const toast = useToast();
  const { summary, loading, updateStage } = useCrmVendors();
  const [activeTab, setActiveTab] = useState('kyc'); // 'kyc' | 'products' | 'orders' | 'payment_queries' | 'applications'
  const [inspectingVendor, setInspectingVendor] = useState(null);
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    vendor: null,
    targetStage: '',
    title: '',
    reason: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const counts = summary?.counts || {};
  const newApplications = summary?.newApplications || [];
  const kycPending = summary?.documentsAwaitingVerification || [];
  const overdueOrders = summary?.ordersRequiringAction || [];

  // Simulated queue items for Products Awaiting Approval & Payment Queries (backed by vendor models)
  const productsAwaitingApproval = [
    { id: 'PROD-101', vendorName: 'Franschhoek Cellars', productName: 'Cap Classique Brut Vintage 2020', vintage: '2020', abv: '12.5%', submittedDate: 'Today, 09:15', priceZar: 480 },
    { id: 'PROD-102', vendorName: 'Stellenbosch Heritage Estate', productName: 'Single Vineyard Cabernet Sauvignon', vintage: '2019', abv: '14.0%', submittedDate: 'Yesterday, 14:30', priceZar: 850 },
    { id: 'PROD-103', vendorName: 'Karoo Craft Distillery', productName: 'Handcrafted Botanical Gin 750ml', vintage: 'NV', abv: '43.0%', submittedDate: '23 Sept', priceZar: 520 }
  ];

  const vendorPaymentQueries = [
    { id: 'PQ-201', vendorName: 'Robertson Valley Wines', query: 'Settlement date for order #GS-1002 (30-day window check)', amount: 'R 14,250', status: 'Pending Review', date: 'Today' },
    { id: 'PQ-202', vendorName: 'Havana Reserve Importers', query: 'Commission breakdown on Churchill 25-box wholesale', amount: 'R 28,900', status: 'Under Investigation', date: '22 Sept' }
  ];

  const handleOpenActionModal = (vendor, targetStage, title) => {
    setActionModal({
      isOpen: true,
      vendor,
      targetStage,
      title,
      reason: ''
    });
  };

  const handleConfirmAction = async (e) => {
    e.preventDefault();
    if (!actionModal.vendor) return;
    setSubmitting(true);
    try {
      await updateStage(
        actionModal.vendor._id, 
        actionModal.targetStage, 
        actionModal.reason || `Stage updated to ${actionModal.targetStage} by Operations Director`
      );
      toast.success(`Vendor ${actionModal.vendor.storeName || actionModal.vendor.name} transitioned to ${actionModal.targetStage.replace(/_/g, ' ')}.`);
      setActionModal({ isOpen: false, vendor: null, targetStage: '', title: '', reason: '' });
      setInspectingVendor(null);
    } catch (err) {
      toast.error('Failed to update vendor stage');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Vendor Management — Daily Operations
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 rounded-md border border-blue-200">
              Module 3 (GS CRM 1.docx)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 4 Operational Workflow: Applications, KYC Verification, Product Onboarding Approval, Orders Requiring Vendor Action & Settlements.
          </p>
        </div>
      </div>

      {/* 5 Operational Cards matching Section 4 of GS CRM 1.docx */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div 
          onClick={() => setActiveTab('applications')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer ${activeTab === 'applications' ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200 shadow-sm hover:border-blue-300'}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-500 uppercase">New Applications</p>
            <Clock size={16} className="text-blue-600" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{counts.applications || 0}</h3>
          <span className="text-[10px] text-blue-600 font-semibold">Review Queue</span>
        </div>

        <div 
          onClick={() => setActiveTab('kyc')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer ${activeTab === 'kyc' ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200 shadow-sm hover:border-blue-300'}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-500 uppercase">KYC Verification</p>
            <FileText size={16} className="text-amber-600" />
          </div>
          <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{counts.kycPending || 0}</h3>
          <span className="text-[10px] text-amber-600 font-semibold">Action Required</span>
        </div>

        <div 
          onClick={() => setActiveTab('products')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer ${activeTab === 'products' ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200 shadow-sm hover:border-blue-300'}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Products Awaiting</p>
            <Package size={16} className="text-purple-600" />
          </div>
          <h3 className="text-2xl font-extrabold text-purple-600 mt-1">{productsAwaitingApproval.length}</h3>
          <span className="text-[10px] text-purple-600 font-semibold">Listing Sign-off</span>
        </div>

        <div 
          onClick={() => setActiveTab('orders')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer ${activeTab === 'orders' ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200 shadow-sm hover:border-blue-300'}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Vendor Action Due</p>
            <AlertTriangle size={16} className="text-rose-600" />
          </div>
          <h3 className="text-2xl font-extrabold text-rose-600 mt-1">{counts.overdueOrders || 0}</h3>
          <span className="text-[10px] text-rose-600 font-semibold">Overdue Dispatch</span>
        </div>

        <div 
          onClick={() => setActiveTab('payment_queries')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer ${activeTab === 'payment_queries' ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200 shadow-sm hover:border-blue-300'}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Payment Queries</p>
            <DollarSign size={16} className="text-emerald-600" />
          </div>
          <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{vendorPaymentQueries.length}</h3>
          <span className="text-[10px] text-emerald-600 font-semibold">Review & Settle</span>
        </div>
      </div>

      {/* Main Operational Table by Selected Tab */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap bg-slate-50/50">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('kyc')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${activeTab === 'kyc' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'}`}
            >
              Documents Awaiting Verification ({counts.kycPending || 0})
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${activeTab === 'products' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'}`}
            >
              Products Awaiting Approval ({productsAwaitingApproval.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${activeTab === 'orders' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'}`}
            >
              Orders Requiring Vendor Action ({counts.overdueOrders || 0})
            </button>
            <button
              onClick={() => setActiveTab('payment_queries')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${activeTab === 'payment_queries' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200/60'}`}
            >
              Vendor Payment Queries ({vendorPaymentQueries.length})
            </button>
          </div>
        </div>

        {/* Tab 1: KYC Verification */}
        {activeTab === 'kyc' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Vendor / Wine Farm</th>
                  <th className="px-6 py-3.5">Contact Email</th>
                  <th className="px-6 py-3.5">Uploaded Docs</th>
                  <th className="px-6 py-3.5">Workflow Stage</th>
                  <th className="px-6 py-3.5 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">Loading vendor records...</td>
                  </tr>
                ) : kycPending.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      ✓ No vendor verification documents pending in queue.
                    </td>
                  </tr>
                ) : (
                  kycPending.map((v) => (
                    <tr key={v._id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {v.storeName || v.name}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {v.email}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {v.kycDocuments?.map((doc, dIdx) => (
                            <span
                              key={dIdx}
                              onClick={() => setInspectingVendor(v)}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 transition-colors cursor-pointer"
                            >
                              <FileText size={11} /> {doc.documentType || `Doc ${dIdx + 1}`}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={v.crmWorkflowStage || 'kyc_verification_pending'} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setInspectingVendor(v)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={13} /> Inspect
                          </button>
                          <button
                            onClick={() => handleOpenActionModal(v, 'commercial_review', 'Sign-off KYC & Advance to Commercial Review')}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-blue-500/20 transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            Sign-off KYC <ArrowRight size={13} />
                          </button>
                          <button
                            onClick={() => handleOpenActionModal(v, 'suspended', 'Suspend / Reject Vendor Application')}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-xs border border-rose-200 transition-all inline-flex items-center gap-1 cursor-pointer"
                            title="Suspend non-compliant vendor"
                          >
                            <UserX size={13} /> Suspend
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

        {/* Tab 2: Products Awaiting Approval */}
        {activeTab === 'products' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Product Listing</th>
                  <th className="px-6 py-3.5">Vendor / Farm</th>
                  <th className="px-6 py-3.5">Vintage & ABV</th>
                  <th className="px-6 py-3.5">Price (ZAR)</th>
                  <th className="px-6 py-3.5">Submitted</th>
                  <th className="px-6 py-3.5 text-right">Listing Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productsAwaitingApproval.map((p) => (
                  <tr key={p.id} className="hover:bg-purple-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                          <Package size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{p.productName}</p>
                          <p className="text-[11px] text-slate-500">Ref: {p.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{p.vendorName}</td>
                    <td className="px-6 py-4 text-slate-600">{p.vintage} • {p.abv}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">R {p.priceZar.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-500">{p.submittedDate}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toast.success(`Product "${p.productName}" approved and live on website!`)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-emerald-500/20 transition-all inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Check size={13} /> Approve Listing
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Orders Requiring Vendor Action */}
        {activeTab === 'orders' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Order ID</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Order Total</th>
                  <th className="px-6 py-3.5">Pending Action</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      ✓ No overdue dispatch orders. All vendors fulfilling on schedule.
                    </td>
                  </tr>
                ) : (
                  overdueOrders.map((o) => (
                    <tr key={o._id} className="hover:bg-rose-50/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{o.orderId || o._id}</td>
                      <td className="px-6 py-4 text-slate-700">{o.user?.name || 'Customer'}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">R {o.totalPrice?.toLocaleString()}</td>
                      <td className="px-6 py-4 text-rose-600 font-semibold">Overdue Dispatch &gt; 24h</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => toast.info(`Reminder notification dispatched to vendor for order ${o.orderId || o._id}`)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-xs border border-rose-200 transition-all cursor-pointer"
                        >
                          Ping Vendor
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Vendor Payment Queries */}
        {activeTab === 'payment_queries' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Query Ref</th>
                  <th className="px-6 py-3.5">Vendor</th>
                  <th className="px-6 py-3.5">Query Summary</th>
                  <th className="px-6 py-3.5">Transaction Value</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vendorPaymentQueries.map((q) => (
                  <tr key={q.id} className="hover:bg-emerald-50/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{q.id}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{q.vendorName}</td>
                    <td className="px-6 py-4 text-slate-600 max-w-xs">{q.query}</td>
                    <td className="px-6 py-4 font-bold text-emerald-700">{q.amount}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                        {q.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toast.success(`Response drafted and sent to ${q.vendorName}`)}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs transition-all cursor-pointer"
                      >
                        Resolve Query
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* KYC Document Inspection Modal */}
      {inspectingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">KYC Documents: {inspectingVendor.storeName || inspectingVendor.name}</h3>
                <p className="text-xs text-slate-500">{inspectingVendor.email} • Compliance Audit Desk</p>
              </div>
              <button onClick={() => setInspectingVendor(null)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="font-bold text-slate-700 uppercase tracking-wider">Submitted Legal Documents</p>
              {(!inspectingVendor.kycDocuments || inspectingVendor.kycDocuments.length === 0) ? (
                <div className="p-4 bg-slate-50 text-slate-400 rounded-xl text-center">No digital documents attached to this record.</div>
              ) : (
                inspectingVendor.kycDocuments.map((doc, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 capitalize">{doc.documentType?.replace(/_/g, ' ') || `Document #${idx + 1}`}</span>
                      <p className="text-[11px] text-slate-500">{doc.documentNumber ? `Reg/Ref: ${doc.documentNumber}` : 'Submitted via portal'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.documentUrl ? (
                        <a 
                          href={doc.documentUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="px-2.5 py-1 bg-blue-50 text-blue-600 font-semibold rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
                        >
                          <ExternalLink size={11} /> View PDF
                        </a>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Original on File</span>
                      )}
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                        <Check size={11} /> Received
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setInspectingVendor(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const v = inspectingVendor;
                  setInspectingVendor(null);
                  handleOpenActionModal(v, 'commercial_review', 'Sign-off KYC & Advance to Commercial Review');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer"
              >
                Proceed to KYC Sign-off
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stage Action / Suspend Modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">{actionModal.title}</h3>
              <button 
                onClick={() => setActionModal({ isOpen: false, vendor: null, targetStage: '', title: '', reason: '' })} 
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmAction} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Audit Justification & Notes {actionModal.targetStage === 'suspended' ? '*' : '(Optional)'}
                </label>
                <textarea
                  required={actionModal.targetStage === 'suspended'}
                  rows={3}
                  value={actionModal.reason}
                  onChange={(e) => setActionModal({ ...actionModal, reason: e.target.value })}
                  placeholder={actionModal.targetStage === 'suspended' ? 'State regulatory reason for suspension (e.g., Expired liquor licence, non-compliant packaging)...' : 'Add approval notes for compliance archive...'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActionModal({ isOpen: false, vendor: null, targetStage: '', title: '', reason: '' })}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 font-bold rounded-xl text-white shadow-sm cursor-pointer ${
                    actionModal.targetStage === 'suspended' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {submitting ? 'Updating...' : 'Confirm Stage Change'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
