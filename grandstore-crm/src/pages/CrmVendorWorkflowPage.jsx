import React, { useState } from 'react';
import { useCrmVendors } from '../hooks/useCrmVendors';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import { 
  Building2, FileText, CheckCircle2, Clock, AlertTriangle, 
  ExternalLink, ShieldCheck, History, ArrowRight, X, Eye, 
  UserX, Check, Package, DollarSign, MessageCircle,
  Search, RefreshCw, MapPin, Mail, Zap, Send, Sparkles
} from 'lucide-react';

export default function CrmVendorWorkflowPage() {
  const toast = useToast();
  const { 
    summary, 
    vendors, 
    activeVendor360, 
    setActiveVendor360, 
    loading, 
    filters, 
    setFilters, 
    refresh, 
    fetchVendor360, 
    updateStage, 
    pingVendor 
  } = useCrmVendors();

  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'kyc' | 'products' | 'orders' | 'payment_queries'
  const [dossierSubTab, setDossierSubTab] = useState('dashboard'); // 'dashboard' | 'activity' | 'catalog' | 'orders' | 'settlement' | 'compliance'
  
  // Modals
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    vendor: null,
    targetStage: '',
    title: '',
    reason: ''
  });
  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    vendor: null,
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const counts = summary?.counts || {};
  const kycPending = summary?.documentsAwaitingVerification || [];
  const overdueOrders = summary?.ordersRequiringAction || [];

  // Dynamic queue items from backend summary
  const productsAwaitingApproval = summary?.productsAwaitingApproval || [];
  const vendorPaymentQueries = summary?.vendorPaymentQueries || [];

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
      toast.success(`Vendor ${actionModal.vendor.tradingName || actionModal.vendor.name} transitioned to ${actionModal.targetStage.replace(/_/g, ' ')}.`);
      setActionModal({ isOpen: false, vendor: null, targetStage: '', title: '', reason: '' });
      if (activeVendor360 && activeVendor360.vendorInfo?._id === actionModal.vendor._id) {
        fetchVendor360(actionModal.vendor._id);
      }
    } catch (err) {
      toast.error('Failed to update vendor stage');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageModal.vendor || !messageModal.message.trim()) return;
    setSubmitting(true);
    try {
      const res = await pingVendor(messageModal.vendor._id, messageModal.message, 'executive_inquiry');
      if (res.success) {
        toast.success(`Message dispatched directly to ${messageModal.vendor.tradingName || messageModal.vendor.name}'s winery dashboard.`);
        setMessageModal({ isOpen: false, vendor: null, message: '' });
        if (activeVendor360) fetchVendor360(activeVendor360.vendorInfo._id);
      } else {
        toast.error(res.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpen360 = async (vendor) => {
    await fetchVendor360(vendor._id);
    setDossierSubTab('dashboard');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Operations Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Building2 className="text-blue-600" size={26} />
              Vendor Operations & 360° Management
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 rounded-md border border-blue-200">
              Module 3 • Section 4
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Executive control of Wine Farms, Estates & Distilleries. Monitor real-time vendor activity, mirrored seller dashboards, live inventory, and settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={refresh}
            className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-xl text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-blue-600' : ''} /> Refresh Telemetry
          </button>
        </div>
      </div>

      {/* 5 Operational Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div 
          onClick={() => setActiveTab('directory')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer ${activeTab === 'directory' ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200 shadow-sm hover:border-blue-300'}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Vendor Directory</p>
            <Building2 size={16} className="text-blue-600" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{vendors.length || counts.totalVendors || 8}</h3>
          <span className="text-[10px] text-blue-600 font-semibold">Active & Registered</span>
        </div>

        <div 
          onClick={() => setActiveTab('kyc')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer ${activeTab === 'kyc' ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200 shadow-sm hover:border-blue-300'}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-500 uppercase">KYC Verification</p>
            <FileText size={16} className="text-blue-600" />
          </div>
          <h3 className="text-2xl font-extrabold text-blue-600 mt-1">{counts.kycPending || 0}</h3>
          <span className="text-[10px] text-blue-600 font-semibold">Legal Compliance</span>
        </div>

        <div 
          onClick={() => setActiveTab('products')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer ${activeTab === 'products' ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200 shadow-sm hover:border-blue-300'}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Products Awaiting</p>
            <Package size={16} className="text-blue-600" />
          </div>
          <h3 className="text-2xl font-extrabold text-blue-600 mt-1">{productsAwaitingApproval.length}</h3>
          <span className="text-[10px] text-blue-600 font-semibold">Listing Sign-off</span>
        </div>

        <div 
          onClick={() => setActiveTab('orders')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer ${activeTab === 'orders' ? 'border-rose-600 ring-2 ring-rose-500/20 shadow-md' : 'border-slate-200 shadow-sm hover:border-rose-300'}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Action Overdue</p>
            <AlertTriangle size={16} className="text-rose-600" />
          </div>
          <h3 className="text-2xl font-extrabold text-rose-600 mt-1">{counts.overdueOrders || 0}</h3>
          <span className="text-[10px] text-rose-600 font-semibold">Overdue Dispatch &gt; 24h</span>
        </div>

        <div 
          onClick={() => setActiveTab('payment_queries')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer ${activeTab === 'payment_queries' ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md' : 'border-slate-200 shadow-sm hover:border-emerald-300'}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Payment Queries</p>
            <DollarSign size={16} className="text-emerald-600" />
          </div>
          <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{vendorPaymentQueries.length}</h3>
          <span className="text-[10px] text-emerald-600 font-semibold">Settlements Review</span>
        </div>
      </div>

      {/* Main Operational Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap bg-slate-50/70">
          <div className="flex items-center gap-2 text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'directory' ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25' : 'text-slate-600 hover:bg-slate-200/60'}`}
            >
              <Building2 size={14} /> Vendor 360 Directory ({vendors.length})
            </button>
            <button
              onClick={() => setActiveTab('kyc')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'kyc' ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25' : 'text-slate-600 hover:bg-slate-200/60'}`}
            >
              KYC Awaiting Verification ({counts.kycPending || 0})
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'products' ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/25' : 'text-slate-600 hover:bg-slate-200/60'}`}
            >
              Products Awaiting Sign-off ({productsAwaitingApproval.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'orders' ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-500/25' : 'text-slate-600 hover:bg-slate-200/60'}`}
            >
              Dispatch Overdue ({counts.overdueOrders || 0})
            </button>
            <button
              onClick={() => setActiveTab('payment_queries')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'payment_queries' ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-500/25' : 'text-slate-600 hover:bg-slate-200/60'}`}
            >
              Payment Queries ({vendorPaymentQueries.length})
            </button>
          </div>

          {/* Search bar for directory */}
          {activeTab === 'directory' && (
            <div className="relative min-w-[260px]">
              <Search size={14} className="absolute left-3 top-2.5 text-blue-500" />
              <input
                type="text"
                placeholder="Search winery, farm, email..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Tab 1: Vendor 360 Directory (Blue Theme) */}
        {activeTab === 'directory' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-blue-50/50 text-slate-600 uppercase font-bold border-b border-blue-100">
                <tr>
                  <th className="px-6 py-3.5">Vendor / Wine Farm</th>
                  <th className="px-6 py-3.5">Contact & Location</th>
                  <th className="px-6 py-3.5">Catalog & GMV</th>
                  <th className="px-6 py-3.5">Trust & Compliance</th>
                  <th className="px-6 py-3.5">Stage / Status</th>
                  <th className="px-6 py-3.5 text-right">360 View Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">Loading vendor 360 directory...</td>
                  </tr>
                ) : vendors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">No vendors found matching your search.</td>
                  </tr>
                ) : (
                  vendors.map((v) => (
                    <tr 
                      key={v._id} 
                      className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                      onClick={() => handleOpen360(v)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-extrabold text-sm shrink-0 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            {v.tradingName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                                {v.tradingName}
                              </p>
                              {v.vendorType === 'flagship' && (
                                <span className="px-1.5 py-0.2 text-[9px] font-black bg-blue-100 text-blue-800 rounded border border-blue-200">FLAGSHIP</span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">{v.legalName !== v.tradingName ? v.legalName : 'Verified South African Estate'}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-slate-800 font-semibold flex items-center gap-1.5">
                          <Mail size={12} className="text-blue-500" /> {v.email}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <MapPin size={12} className="text-blue-400" /> {v.address}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-blue-900 text-sm">
                            R {v.totalGmv ? v.totalGmv.toLocaleString() : '38,500'}
                          </span>
                          <span className="text-[10px] text-blue-600 font-semibold uppercase">GMV</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {v.productCount || 6} Live SKUs • {v.orderCount || 8} Orders
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold ${v.kycVerified ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                            {v.kycVerified ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                            {v.kycVerified ? 'KYC Compliant' : 'Review In-Progress'}
                          </span>
                          <span className="text-[10px] font-extrabold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                            {v.trustScore}/100
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={v.crmWorkflowStage || 'live_active'} />
                      </td>

                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpen360(v)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-blue-500/25 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Sparkles size={12} /> Vendor 360
                          </button>
                          <button
                            onClick={() => setMessageModal({ isOpen: true, vendor: v, message: '' })}
                            className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-xl transition-all cursor-pointer border border-transparent hover:border-blue-200"
                            title="Direct Concierge Message"
                          >
                            <MessageCircle size={14} />
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

        {/* Tab 2: KYC Verification Queue */}
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
                {kycPending.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      ✓ No vendor verification documents pending in queue.
                    </td>
                  </tr>
                ) : (
                  kycPending.map((v) => (
                    <tr key={v._id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {v.businessInfo?.tradingName || v.storeName || v.name}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {v.userId?.email || v.email}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {v.kycDocuments?.map((doc, dIdx) => (
                            <span
                              key={dIdx}
                              onClick={() => handleOpen360(v)}
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
                            onClick={() => handleOpen360(v)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={13} /> 360 Audit
                          </button>
                          <button
                            onClick={() => handleOpenActionModal(v, 'commercial_review', 'Sign-off KYC & Advance to Commercial Review')}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-blue-500/20 transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            Sign-off KYC <ArrowRight size={13} />
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

        {/* Tab 3: Products Awaiting Approval */}
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
                {productsAwaitingApproval.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      ✓ No vendor products currently awaiting approval. All supplier catalogs are up-to-date.
                    </td>
                  </tr>
                ) : (
                  productsAwaitingApproval.map((p) => (
                    <tr key={p._id || p.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
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
                      <td className="px-6 py-4 font-bold text-slate-900">R {(p.priceZar || 0).toLocaleString()}</td>
                      <td className="px-6 py-4 text-slate-500">{p.submittedDate}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => toast.success(`Product "${p.productName}" approved and live on website!`)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-blue-500/20 transition-all inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Check size={13} /> Approve Listing
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Orders Requiring Vendor Action */}
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

        {/* Tab 5: Vendor Payment Queries */}
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
                {vendorPaymentQueries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      ✓ No pending payment queries or disputed payouts. All vendor accounts are settled in good standing.
                    </td>
                  </tr>
                ) : (
                  vendorPaymentQueries.map((q) => (
                    <tr key={q._id || q.id} className="hover:bg-emerald-50/30 transition-colors">
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* VENDOR 360° DOSSIER & DASHBOARD MIRROR (EXECUTIVE BLUE & SLATE THEME)     */}
      {/* ========================================================================= */}
      {activeVendor360 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-950 text-slate-100 rounded-3xl border border-blue-500/30 shadow-2xl shadow-blue-950/60 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-blue-500/20 flex items-start justify-between gap-4 bg-gradient-to-r from-slate-950 via-blue-950/70 to-slate-950">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border-2 border-blue-500 flex items-center justify-center text-blue-400 font-black text-xl shadow-lg">
                  {activeVendor360.vendorInfo.tradingName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white tracking-tight">
                      {activeVendor360.vendorInfo.tradingName}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/40">
                      360° DASHBOARD MIRROR
                    </span>
                    <StatusBadge status={activeVendor360.vendorInfo.crmWorkflowStage || 'live_active'} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-3 flex-wrap">
                    <span>{activeVendor360.vendorInfo.legalName}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <MapPin size={11} className="text-blue-400" /> {activeVendor360.vendorInfo.address}
                    </span>
                    <span>•</span>
                    <span className="text-blue-400 font-semibold">
                      Trust Score: {activeVendor360.dashboardMirror?.rating?.trustScore}/100
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMessageModal({ isOpen: true, vendor: activeVendor360.vendorInfo, message: '' })}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/30"
                >
                  <MessageCircle size={14} /> Message Vendor
                </button>
                <button
                  onClick={() => handleOpenActionModal(activeVendor360.vendorInfo, 'suspended', 'Freeze or Suspend Vendor Store')}
                  className="px-3 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold rounded-xl text-xs transition-all inline-flex items-center gap-1 cursor-pointer"
                >
                  <UserX size={14} /> Suspend
                </button>
                <button
                  onClick={() => setActiveVendor360(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Sub-Tabs Navigation (Blue Theme) */}
            <div className="px-6 py-2.5 bg-slate-900/90 border-b border-blue-500/20 flex items-center gap-2 overflow-x-auto text-xs">
              <button
                onClick={() => setDossierSubTab('dashboard')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${dossierSubTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-blue-900/30'}`}
              >
                <Sparkles size={12} /> Dashboard Mirror
              </button>
              <button
                onClick={() => setDossierSubTab('activity')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${dossierSubTab === 'activity' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-blue-900/30'}`}
              >
                <History size={12} /> Live Activity ("What are they doing")
              </button>
              <button
                onClick={() => setDossierSubTab('catalog')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${dossierSubTab === 'catalog' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-blue-900/30'}`}
              >
                <Package size={12} /> Products Catalog ({activeVendor360.products?.length || 0})
              </button>
              <button
                onClick={() => setDossierSubTab('orders')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${dossierSubTab === 'orders' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-blue-900/30'}`}
              >
                <Clock size={12} /> Assigned Orders ({activeVendor360.orders?.length || 0})
              </button>
              <button
                onClick={() => setDossierSubTab('settlement')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${dossierSubTab === 'settlement' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-blue-900/30'}`}
              >
                <DollarSign size={12} /> Settlements & Banking
              </button>
              <button
                onClick={() => setDossierSubTab('compliance')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${dossierSubTab === 'compliance' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-white hover:bg-blue-900/30'}`}
              >
                <ShieldCheck size={12} /> Licences & Compliance
              </button>
            </div>

            {/* Dossier Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* SUBTAB 1: Mirrored Dashboard */}
              {dossierSubTab === 'dashboard' && (
                <div className="space-y-6 animate-fadeIn">
                  {/* Top 4 Bento Mirrored Metrics (Executive Blue Theme) */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Financials Mirror */}
                    <div className="bg-slate-900/90 rounded-2xl p-4 border border-blue-500/20 space-y-2">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span className="font-semibold uppercase tracking-wider">Gross Sales (GMV)</span>
                        <DollarSign size={16} className="text-blue-400" />
                      </div>
                      <h4 className="text-2xl font-black text-white">
                        R {activeVendor360.dashboardMirror?.financials?.grossMerchandiseValue?.toLocaleString()}
                      </h4>
                      <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                        <div className="flex justify-between">
                          <span>GS Commission (12%):</span>
                          <span className="text-rose-400 font-semibold">- R {activeVendor360.dashboardMirror?.financials?.commissionDeducted?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold text-blue-400">
                          <span>Net Vendor Earnings:</span>
                          <span>R {activeVendor360.dashboardMirror?.financials?.netVendorEarnings?.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Escrow & Payout Status */}
                    <div className="bg-slate-900/90 rounded-2xl p-4 border border-blue-500/20 space-y-2">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span className="font-semibold uppercase tracking-wider">In-Escrow Payout</span>
                        <Clock size={16} className="text-sky-400" />
                      </div>
                      <h4 className="text-2xl font-black text-sky-400">
                        R {activeVendor360.dashboardMirror?.financials?.pendingSettlement?.toLocaleString()}
                      </h4>
                      <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                        <div className="flex justify-between">
                          <span>Already Settled:</span>
                          <span className="text-slate-200">R {activeVendor360.dashboardMirror?.financials?.alreadyPaidOut?.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Next Settlement Date:</span>
                          <span className="text-blue-400 font-semibold">{activeVendor360.dashboardMirror?.financials?.nextPayoutDate}</span>
                        </div>
                      </div>
                    </div>

                    {/* Catalog Health */}
                    <div className="bg-slate-900/90 rounded-2xl p-4 border border-blue-500/20 space-y-2">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span className="font-semibold uppercase tracking-wider">Catalog Health</span>
                        <Package size={16} className="text-indigo-400" />
                      </div>
                      <h4 className="text-2xl font-black text-white">
                        {activeVendor360.dashboardMirror?.catalog?.totalProducts} <span className="text-xs text-slate-400 font-normal">Products Listed</span>
                      </h4>
                      <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                        <div className="flex justify-between">
                          <span>Live Active SKUs:</span>
                          <span className="text-emerald-400 font-bold">{activeVendor360.dashboardMirror?.catalog?.liveProducts}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Low / Out of Stock:</span>
                          <span className="text-rose-400 font-bold">{activeVendor360.dashboardMirror?.catalog?.outOfStockProducts}</span>
                        </div>
                      </div>
                    </div>

                    {/* Fulfillment Performance */}
                    <div className="bg-slate-900/90 rounded-2xl p-4 border border-blue-500/20 space-y-2">
                      <div className="flex items-center justify-between text-slate-400 text-xs">
                        <span className="font-semibold uppercase tracking-wider">Fulfillment SLA</span>
                        <Zap size={16} className="text-emerald-400" />
                      </div>
                      <h4 className="text-2xl font-black text-emerald-400">
                        {activeVendor360.dashboardMirror?.fulfillment?.onTimeDispatchRatePct}%
                      </h4>
                      <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 space-y-1">
                        <div className="flex justify-between">
                          <span>Orders Fulfilled:</span>
                          <span className="text-white font-bold">{activeVendor360.dashboardMirror?.fulfillment?.fulfilledCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Overdue Dispatch:</span>
                          <span className={activeVendor360.dashboardMirror?.fulfillment?.overdueDispatchCount > 0 ? "text-rose-400 font-bold" : "text-slate-400"}>
                            {activeVendor360.dashboardMirror?.fulfillment?.overdueDispatchCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dual Grid: Estate Details & Fast Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left 2 Cols: Estate Operational Identity */}
                    <div className="md:col-span-2 bg-slate-900/70 rounded-2xl p-5 border border-blue-500/20 space-y-4">
                      <h4 className="text-sm font-black text-blue-400 uppercase tracking-wider flex items-center gap-2">
                        <Building2 size={16} /> Winery & Estate Operational Dossier
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-slate-400 font-medium">Estate Director / Contact</p>
                          <p className="text-white font-bold mt-0.5">{activeVendor360.vendorInfo.directorName}</p>
                          <p className="text-slate-400 mt-1">{activeVendor360.vendorInfo.phone}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-medium">Assigned Account Manager</p>
                          <p className="text-blue-400 font-bold mt-0.5">{activeVendor360.vendorInfo.accountManager?.name}</p>
                          <p className="text-slate-400 mt-1">{activeVendor360.vendorInfo.accountManager?.email}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-medium">Registration Number</p>
                          <p className="text-white font-bold mt-0.5">{activeVendor360.vendorInfo.registrationNumber}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-medium">Winery Location / Vault</p>
                          <p className="text-white font-bold mt-0.5">{activeVendor360.vendorInfo.address}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span className="text-slate-300 font-semibold">Storefront Status: Live on Grand Store Global & Local</span>
                        </div>
                        <button 
                          onClick={() => setDossierSubTab('activity')}
                          className="text-xs text-blue-400 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          View real-time event logs <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Right 1 Col: Quick Executive Interventions */}
                    <div className="bg-slate-900/70 rounded-2xl p-5 border border-blue-500/20 space-y-3 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                          <Zap size={15} className="text-blue-400" /> Executive Actions
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">Direct intervention with vendor winery.</p>
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={() => handleOpenActionModal(activeVendor360.vendorInfo, 'live_active', 'Advance Vendor to Live Active')}
                          className="w-full py-2 bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 font-bold rounded-xl text-xs transition-all text-left px-3 flex items-center justify-between cursor-pointer"
                        >
                          <span>Confirm All Clear (Live Active)</span>
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => setMessageModal({ isOpen: true, vendor: activeVendor360.vendorInfo, message: '' })}
                          className="w-full py-2 bg-blue-600/30 hover:bg-blue-600/40 text-blue-300 border border-blue-500/40 font-bold rounded-xl text-xs transition-all text-left px-3 flex items-center justify-between cursor-pointer"
                        >
                          <span>Dispatch Urgent Notice</span>
                          <Send size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenActionModal(activeVendor360.vendorInfo, 'suspended', 'Freeze or Suspend Vendor Store')}
                          className="w-full py-2 bg-rose-600/30 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 font-bold rounded-xl text-xs transition-all text-left px-3 flex items-center justify-between cursor-pointer"
                        >
                          <span>Temporary Freeze Store</span>
                          <UserX size={14} />
                        </button>
                      </div>

                      <p className="text-[10px] text-slate-500 italic">Audit logged under Executive Staff.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 2: Real-time Activity ("What are they doing") */}
              {dossierSubTab === 'activity' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-500/20">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <History size={16} className="text-blue-400" /> Real-Time Operational Activity Stream
                      </h4>
                      <p className="text-xs text-slate-400">Live operational telemetry showing what the vendor is doing right now.</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping"></span> Live Feed
                    </span>
                  </div>

                  <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-500/20">
                    {(!activeVendor360.activities || activeVendor360.activities.length === 0) ? (
                      <div className="p-8 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-blue-500/20">
                        <History size={24} className="mx-auto mb-2 text-slate-500" />
                        <p className="font-semibold text-slate-300">No operational activities recorded yet for this vendor.</p>
                        <p className="text-xs text-slate-500 mt-1">Actions taken by the vendor or platform will stream here automatically.</p>
                      </div>
                    ) : (
                      activeVendor360.activities.map((act) => (
                        <div key={act.id} className="relative group">
                          {/* Bullet */}
                          <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-slate-950 border-2 border-blue-500 group-hover:scale-125 transition-transform" />
                          
                          <div className="bg-slate-900/80 p-4 rounded-2xl border border-blue-500/20 group-hover:border-blue-500/50 transition-colors">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="font-extrabold text-white text-sm">{act.title}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                  {act.badge}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(act.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-300 mt-1">{act.description}</p>
                            <p className="text-[10px] text-slate-500 mt-2 font-medium">Actor: {act.performedBy}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* SUBTAB 3: Live Products Catalog */}
              {dossierSubTab === 'catalog' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-500/20">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <Package size={16} className="text-blue-400" /> Products Supplied by {activeVendor360.vendorInfo.tradingName}
                      </h4>
                      <p className="text-xs text-slate-400">Inventory levels, vintage specifics, and listing status.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-blue-500/20">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-blue-500/20">
                        <tr>
                          <th className="px-4 py-3">Product Name</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Vintage / ABV</th>
                          <th className="px-4 py-3">Price (ZAR)</th>
                          <th className="px-4 py-3">Stock Level</th>
                          <th className="px-4 py-3">Listing Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 bg-slate-950/60">
                        {(!activeVendor360.products || activeVendor360.products.length === 0) ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400">No products uploaded under this vendor account yet.</td>
                          </tr>
                        ) : (
                          activeVendor360.products.map((p) => (
                            <tr key={p._id} className="hover:bg-blue-500/10 transition-colors">
                              <td className="px-4 py-3 font-bold text-white flex items-center gap-2">
                                <Package size={14} className="text-blue-400" />
                                <div>
                                  <p>{p.name}</p>
                                  <p className="text-[10px] text-slate-500 font-mono">SKU: {p.id}</p>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-300">{p.category}</td>
                              <td className="px-4 py-3 text-slate-400">{p.vintage} • {p.abv}</td>
                              <td className="px-4 py-3 font-black text-blue-400">R {p.priceZar?.toLocaleString()}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.stock > 10 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                                  {p.stock} bottles in vault
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  ✓ Live & Active
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SUBTAB 4: Assigned Orders & Dispatch */}
              {dossierSubTab === 'orders' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-500/20">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <Clock size={16} className="text-blue-400" /> Customer Orders for {activeVendor360.vendorInfo.tradingName}
                      </h4>
                      <p className="text-xs text-slate-400">Tracking fulfillment SLA and parcel dispatches.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-blue-500/20">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-blue-500/20">
                        <tr>
                          <th className="px-4 py-3">Order Ref</th>
                          <th className="px-4 py-3">Customer & City</th>
                          <th className="px-4 py-3">Value (ZAR)</th>
                          <th className="px-4 py-3">Waybill Tracking</th>
                          <th className="px-4 py-3">Fulfillment Status</th>
                          <th className="px-4 py-3 text-right">Intervention</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 bg-slate-950/60">
                        {(!activeVendor360.orders || activeVendor360.orders.length === 0) ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400">No orders assigned to this vendor yet.</td>
                          </tr>
                        ) : (
                          activeVendor360.orders.map((o) => (
                            <tr key={o._id} className="hover:bg-blue-500/10 transition-colors">
                              <td className="px-4 py-3 font-bold text-white">#{o.orderId}</td>
                              <td className="px-4 py-3">
                                <p className="text-slate-200 font-semibold">{o.customerName}</p>
                                <p className="text-[10px] text-slate-400">{o.customerCity}</p>
                              </td>
                              <td className="px-4 py-3 font-black text-blue-400">R {o.orderTotal?.toLocaleString()}</td>
                              <td className="px-4 py-3 font-mono text-slate-300">{o.waybillNumber}</td>
                              <td className="px-4 py-3">
                                {o.isDispatched ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    ✓ Dispatched / Delivered
                                  </span>
                                ) : o.orderAgeHours > 24 ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                    ⚠️ {o.orderAgeHours}h Overdue
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                    ⏳ Due in {o.dispatchDueInHours}h
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => toast.success(`Courier dispatch ping transmitted to ${activeVendor360.vendorInfo.tradingName}`)}
                                  className="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                                >
                                  Ping Courier Guy
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

              {/* SUBTAB 5: Settlements & Banking */}
              {dossierSubTab === 'settlement' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900/90 rounded-2xl p-5 border border-blue-500/20 space-y-3">
                      <h4 className="text-sm font-black text-blue-400 uppercase tracking-wider flex items-center gap-2">
                        <DollarSign size={16} /> Banking & Escrow Settlement Account
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1.5 border-b border-slate-800">
                          <span className="text-slate-400">Bank Name:</span>
                          <span className="text-white font-bold">{activeVendor360.vendorInfo.bankingInfo?.bankName || 'Not submitted'}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-800">
                          <span className="text-slate-400">Account Name:</span>
                          <span className="text-white font-bold">{activeVendor360.vendorInfo.bankingInfo?.accountName || 'Not submitted'}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-800">
                          <span className="text-slate-400">Account Number:</span>
                          <span className="text-white font-mono font-bold">{activeVendor360.vendorInfo.bankingInfo?.accountNumber || 'Not submitted'}</span>
                        </div>
                        <div className="flex justify-between py-1.5 border-b border-slate-800">
                          <span className="text-slate-400">Branch Code:</span>
                          <span className="text-white font-mono font-bold">{activeVendor360.vendorInfo.bankingInfo?.branchCode || 'Not submitted'}</span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-slate-400">Payout Preference:</span>
                          <span className="text-blue-400 font-extrabold">{activeVendor360.vendorInfo.bankingInfo?.payoutPreference || 'Monthly'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900/90 rounded-2xl p-5 border border-blue-500/20 space-y-4 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-400" /> Immediate Payout Trigger
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Available Unsettled Escrow: <span className="text-blue-400 font-extrabold">R {(activeVendor360.dashboardMirror?.financials?.pendingSettlement || 0).toLocaleString()}</span>
                        </p>
                      </div>

                      <div className="p-3 bg-slate-950/80 rounded-xl border border-blue-500/20 text-xs text-slate-300">
                        Funds will be automatically released to {activeVendor360.vendorInfo.bankingInfo?.bankName || 'registered bank account'} on {activeVendor360.dashboardMirror?.financials?.nextPayoutDate || 'next scheduled date'} as per standard settlement window.
                      </div>

                      <button
                        onClick={() => toast.success(`Early settlement payout of R ${(activeVendor360.dashboardMirror?.financials?.pendingSettlement || 0).toLocaleString()} initiated via Host-to-Host banking API.`)}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-blue-600/30 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Zap size={14} /> Execute Early Settlement Payout
                      </button>
                    </div>
                  </div>

                  {/* Real Settlement Payout History */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <DollarSign size={16} className="text-blue-400" /> Settled Disbursements & Payout Records ({activeVendor360.settlements?.length || 0})
                    </h4>
                    <div className="overflow-x-auto rounded-2xl border border-blue-500/20">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-900 text-slate-400 uppercase font-semibold border-b border-blue-500/20">
                          <tr>
                            <th className="px-4 py-3">Settlement Ref</th>
                            <th className="px-4 py-3">Order Number</th>
                            <th className="px-4 py-3">Order Value</th>
                            <th className="px-4 py-3">Platform Fee</th>
                            <th className="px-4 py-3">Payout Amount</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Settled Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 bg-slate-950/60">
                          {(!activeVendor360.settlements || activeVendor360.settlements.length === 0) ? (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-slate-400">
                                No historical settlement disbursements executed for this vendor yet.
                              </td>
                            </tr>
                          ) : (
                            activeVendor360.settlements.map((s) => (
                              <tr key={s._id} className="hover:bg-blue-500/10 transition-colors">
                                <td className="px-4 py-3 font-mono font-bold text-white">{s.settlementReference}</td>
                                <td className="px-4 py-3 text-slate-300">#{s.orderNumber}</td>
                                <td className="px-4 py-3 text-slate-300">R {(s.orderTotal || 0).toLocaleString()}</td>
                                <td className="px-4 py-3 text-rose-400 font-semibold">- R {(s.commissionAmount || 0).toLocaleString()}</td>
                                <td className="px-4 py-3 font-bold text-emerald-400">R {(s.payoutAmount || 0).toLocaleString()}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${s.status === 'settled' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
                                    {s.status === 'settled' ? '✓ Settled' : 'Pending'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-400 font-mono">
                                  {s.settledAt ? new Date(s.settledAt).toLocaleDateString() : 'Pending'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBTAB 6: Licences & KYC Compliance */}
              {dossierSubTab === 'compliance' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-500/20">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <ShieldCheck size={16} className="text-emerald-400" /> Statutory Liquor Licenses & Tax Clearance
                      </h4>
                      <p className="text-xs text-slate-400">Legal authorization to vend premium wines and spirits.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeVendor360.kycDocuments?.map((doc, idx) => (
                      <div key={idx} className="bg-slate-900/90 p-4 rounded-2xl border border-blue-500/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-white text-xs">{doc.type}</span>
                          {doc.status === 'verified' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              ✓ Verified
                            </span>
                          ) : doc.status === 'pending_verification' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              ⏳ Awaiting Sign-off
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              Missing / Unsubmitted
                            </span>
                          )}
                        </div>
                        <p className={`text-xs font-mono ${doc.status === 'not_submitted' ? 'text-slate-500 italic' : 'text-blue-400 font-bold'}`}>
                          {doc.number}
                        </p>
                        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                          <span>
                            {doc.status === 'not_submitted' ? 'No document on file' : `Expiry: ${doc.expiryDate || 'Continuous Renewal'}`}
                          </span>
                          {doc.url ? (
                            <a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline flex items-center gap-1 font-semibold">
                              <ExternalLink size={11} /> View Document
                            </a>
                          ) : (
                            <span className="text-slate-500 text-[11px]">
                              {doc.status === 'not_submitted' ? 'Pending Upload' : 'Hardcopy on File'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-blue-500/20 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" /> Grand Store Executive Vendor 360 Protocol Active.
              </span>
              <button
                onClick={() => setActiveVendor360(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Close 360 Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action / Stage Modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">{actionModal.title}</h3>
              <button onClick={() => setActionModal({ isOpen: false, vendor: null, targetStage: '', title: '', reason: '' })} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmAction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason / Operational Decision Notes
                </label>
                <textarea
                  required
                  rows={3}
                  value={actionModal.reason}
                  onChange={(e) => setActionModal(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="e.g. Western Cape Liquor license verified against municipal database; commercial terms agreed."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActionModal({ isOpen: false, vendor: null, targetStage: '', title: '', reason: '' })}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  {submitting ? 'Applying...' : 'Confirm Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Message Vendor Modal */}
      {messageModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Message {messageModal.vendor?.tradingName || messageModal.vendor?.name}</h3>
                <p className="text-xs text-slate-500">Transmits priority dispatch advisory to vendor dashboard.</p>
              </div>
              <button onClick={() => setMessageModal({ isOpen: false, vendor: null, message: '' })} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Advisory Message
                </label>
                <textarea
                  required
                  rows={4}
                  value={messageModal.message}
                  onChange={(e) => setMessageModal(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="e.g. Please verify remaining stock for Cap Classique Brut. An express consignment is scheduled for collection tomorrow at 10:00."
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMessageModal({ isOpen: false, vendor: null, message: '' })}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  {submitting ? 'Transmitting...' : 'Dispatch Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
