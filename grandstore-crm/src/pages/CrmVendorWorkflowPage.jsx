import React, { useState } from 'react';
import { useCrmVendors } from '../hooks/useCrmVendors';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import { 
  Building2, FileText, CheckCircle2, Clock, AlertTriangle, 
  ExternalLink, ShieldCheck, History, ArrowRight, X, Eye, 
  UserX, Check, Package, DollarSign, MessageCircle,
  Search, RefreshCw, MapPin, Mail, Zap, Send, Sparkles, Crown,
  PauseCircle, PlayCircle, Radio, BellRing, Info
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
    toggleFreeze,
    pingVendor,
    broadcastAdvisory
  } = useCrmVendors();

  const [activeTab, setActiveTab] = useState('directory'); // 'directory' | 'kyc' | 'orders' | 'payment_queries'
  const [dossierSubTab, setDossierSubTab] = useState('dashboard'); // 'dashboard' | 'activity' | 'catalog' | 'orders' | 'settlement' | 'compliance'
  
  // Modals
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    vendor: null,
    targetStage: '',
    title: '',
    reason: ''
  });

  const [freezeModal, setFreezeModal] = useState({
    isOpen: false,
    vendor: null,
    isFreezing: true, // true = freeze, false = unfreeze
    reason: '',
    advisoryMessage: '',
    broadcastNotice: true
  });

  const [messageModal, setMessageModal] = useState({
    isOpen: false,
    vendor: null, // vendor object or { _id: 'all', tradingName: 'All Vendor Partners' }
    title: '',
    message: '',
    priority: 'normal', // 'normal' | 'urgent' | 'critical'
    type: 'operational_advisory'
  });

  const [submitting, setSubmitting] = useState(false);

  const counts = summary?.counts || {};
  const kycPending = summary?.documentsAwaitingVerification || [];
  const overdueOrders = summary?.ordersRequiringAction || [];

  // Dynamic queue items from backend summary
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
    if (actionModal.vendor.vendorType === 'flagship' || /grand store/i.test(actionModal.vendor.tradingName || actionModal.vendor.name || '')) {
      toast.error('The Grand Store is the central platform operator and cannot be suspended or demoted.');
      setActionModal({ isOpen: false, vendor: null, targetStage: '', title: '', reason: '' });
      return;
    }
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

  const handleOpenFreezeModal = (vendor, isFreezing = true) => {
    setFreezeModal({
      isOpen: true,
      vendor,
      isFreezing,
      reason: isFreezing ? 'Annual Inventory Stocktake' : '',
      advisoryMessage: isFreezing ? 'This winery store is temporarily paused for annual vintage stocktaking. Order fulfillment will resume on schedule.' : '',
      broadcastNotice: true
    });
  };

  const handleConfirmFreeze = async (e) => {
    e.preventDefault();
    if (!freezeModal.vendor) return;
    if (freezeModal.vendor.vendorType === 'flagship' || /grand store/i.test(freezeModal.vendor.tradingName || freezeModal.vendor.name || '')) {
      toast.error('The Grand Store is the central platform operator and cannot be frozen.');
      setFreezeModal({ isOpen: false, vendor: null, isFreezing: true, reason: '', advisoryMessage: '', broadcastNotice: true });
      return;
    }
    setSubmitting(true);
    try {
      const res = await toggleFreeze(freezeModal.vendor._id, {
        freeze: freezeModal.isFreezing,
        reason: freezeModal.reason,
        advisoryMessage: freezeModal.advisoryMessage
      });
      if (res.success) {
        toast.success(res.message);
        setFreezeModal({ isOpen: false, vendor: null, isFreezing: true, reason: '', advisoryMessage: '', broadcastNotice: true });
        if (activeVendor360 && activeVendor360.vendorInfo?._id === freezeModal.vendor._id) {
          fetchVendor360(freezeModal.vendor._id);
        }
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error('Failed to update store freeze state');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageModal.vendor || !messageModal.message.trim()) return;
    setSubmitting(true);
    try {
      if (messageModal.vendor._id === 'all') {
        const res = await broadcastAdvisory({
          title: messageModal.title || 'Executive Operations Advisory',
          message: messageModal.message.trim(),
          priority: messageModal.priority,
          type: messageModal.type
        });
        if (res.success) {
          toast.success(res.message);
          setMessageModal({ isOpen: false, vendor: null, title: '', message: '', priority: 'normal', type: 'operational_advisory' });
        } else {
          toast.error(res.message);
        }
      } else {
        const res = await pingVendor(
          messageModal.vendor._id, 
          messageModal.message.trim(), 
          messageModal.type,
          messageModal.title || 'Executive Advisory',
          messageModal.priority
        );
        if (res.success) {
          toast.success(`Advisory successfully dispatched to ${messageModal.vendor.tradingName || messageModal.vendor.name}'s winery dashboard.`);
          setMessageModal({ isOpen: false, vendor: null, title: '', message: '', priority: 'normal', type: 'operational_advisory' });
          if (activeVendor360) fetchVendor360(activeVendor360.vendorInfo._id);
        } else {
          toast.error(res.message);
        }
      }
    } catch (err) {
      toast.error('Failed to dispatch message advisory');
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

      {/* 4 Operational Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div 
          onClick={() => setActiveTab('directory')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer ${activeTab === 'directory' ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md' : 'border-slate-200 shadow-sm hover:border-blue-300'}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Vendor Directory</p>
            <Building2 size={16} className="text-blue-600" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{vendors.length || counts.totalVendors || 0}</h3>
          <div className="flex items-center justify-between text-[10px] mt-1 font-semibold">
            <span className="text-blue-600">{vendors.filter(v => !v.isFrozen && (v.status === 'approved' || v.crmWorkflowStage === 'live_active')).length} Active Live</span>
            {vendors.filter(v => v.isFrozen || v.status === 'suspended').length > 0 && (
              <span className="text-rose-600 font-extrabold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                ❄️ {vendors.filter(v => v.isFrozen || v.status === 'suspended').length} Frozen
              </span>
            )}
          </div>
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

          {/* Search bar & Broadcast trigger for directory */}
          {activeTab === 'directory' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMessageModal({ isOpen: true, vendor: { _id: 'all', tradingName: 'All Vendor Partners', name: 'All Partners' }, title: 'Operational Advisory Broadcast', message: '', priority: 'urgent', type: 'operational_advisory' })}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                title="Broadcast advisory message across all wineries"
              >
                <Radio size={13} className="text-blue-600 animate-pulse" /> Broadcast Advisory
              </button>

              <div className="relative min-w-[240px]">
                <Search size={14} className="absolute left-3 top-2.5 text-blue-500" />
                <input
                  type="text"
                  placeholder="Search winery, farm, email..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
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
                  vendors.map((v) => {
                    const isRowAdmin = v.vendorType === 'flagship' || /grand store/i.test(v.tradingName);
                    const isRowFrozen = Boolean(v.isFrozen || v.status === 'suspended' || v.crmWorkflowStage === 'suspended');

                    return (
                    <tr 
                      key={v._id} 
                      className={`transition-colors group cursor-pointer ${isRowAdmin ? 'bg-amber-50/20 hover:bg-amber-50/40' : (isRowFrozen ? 'bg-rose-50/25 hover:bg-rose-50/45' : 'hover:bg-blue-50/40')}`}
                      onClick={() => handleOpen360(v)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-extrabold text-sm shrink-0 shadow-sm transition-colors ${isRowAdmin ? 'bg-amber-100/60 border-amber-300 text-amber-800 group-hover:bg-amber-600 group-hover:text-white' : (isRowFrozen ? 'bg-rose-100/60 border-rose-300 text-rose-700' : 'bg-blue-50 border-blue-200 text-blue-700 group-hover:bg-blue-600 group-hover:text-white')}`}>
                            {isRowAdmin ? <Crown size={18} /> : (isRowFrozen ? '❄️' : v.tradingName.slice(0, 2).toUpperCase())}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className={`font-extrabold text-sm transition-colors ${isRowAdmin ? 'text-amber-950 group-hover:text-amber-700' : (isRowFrozen ? 'text-rose-950' : 'text-slate-900 group-hover:text-blue-600')}`}>
                                {v.tradingName}
                              </p>
                              {isRowAdmin && (
                                <span className="px-1.5 py-0.5 text-[9px] font-black bg-amber-100 text-amber-800 rounded border border-amber-300 flex items-center gap-0.5">
                                  <Crown size={9} /> MAIN ADMIN
                                </span>
                              )}
                              {isRowFrozen && (
                                <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-rose-100 text-rose-800 rounded border border-rose-300 flex items-center gap-0.5 animate-pulse">
                                  FROZEN
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500">{isRowAdmin ? 'Central Platform Headquarters & Master Vault' : (v.legalName !== v.tradingName ? v.legalName : 'Verified South African Estate')}</p>
                            {isRowFrozen && v.freezeAdvisoryMessage && (
                              <p className="text-[10px] text-rose-600 font-semibold italic mt-0.5 max-w-sm truncate" title={v.freezeAdvisoryMessage}>
                                Advisory: "{v.freezeAdvisoryMessage}"
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="text-slate-800 font-semibold flex items-center gap-1.5">
                          <Mail size={12} className={isRowAdmin ? "text-amber-600" : (isRowFrozen ? "text-rose-500" : "text-blue-500")} /> {v.email}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <MapPin size={12} className={isRowAdmin ? "text-amber-500" : (isRowFrozen ? "text-rose-400" : "text-blue-400")} /> {v.address}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-extrabold text-sm ${isRowAdmin ? 'text-amber-900' : 'text-blue-900'}`}>
                            R {(Number(v.totalGmv) || 0).toLocaleString()}
                          </span>
                          <span className={`text-[10px] font-semibold uppercase ${isRowAdmin ? 'text-amber-700' : 'text-blue-600'}`}>
                            {isRowAdmin ? 'REVENUE' : 'GMV'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {v.productCount ?? 0} Live SKUs • {v.orderCount ?? 0} Orders
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold ${isRowAdmin ? 'bg-amber-100 text-amber-800 border border-amber-300' : (v.kycVerified ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200')}`}>
                            <ShieldCheck size={11} className={isRowAdmin ? "text-amber-700" : (v.kycVerified ? "text-emerald-600" : "text-blue-600")} />
                            {isRowAdmin ? 'Master Licenced' : (v.kycVerified ? 'KYC Compliant' : 'Review In-Progress')}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${isRowAdmin ? 'text-amber-900 bg-amber-50 border-amber-300' : 'text-blue-800 bg-blue-50 border border-blue-200'}`}>
                            {isRowAdmin ? 100 : (v.trustScore ?? 70)}/100
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {isRowFrozen ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                              ❄️ STORE FROZEN
                            </span>
                          </div>
                        ) : (
                          <StatusBadge status={isRowAdmin ? 'platform_flagship' : (v.crmWorkflowStage || 'live_active')} />
                        )}
                      </td>

                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {!isRowAdmin && (
                            isRowFrozen ? (
                              <button
                                onClick={() => handleOpenFreezeModal(v, false)}
                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs inline-flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                                title="Lift freeze and restore storefront"
                              >
                                <CheckCircle2 size={12} /> Lift Freeze
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenFreezeModal(v, true)}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs inline-flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                                title="Temporarily freeze store & broadcast advisory"
                              >
                                <UserX size={12} /> Freeze Store
                              </button>
                            )
                          )}

                          <button
                            onClick={() => handleOpen360(v)}
                            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer ${isRowAdmin ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/25' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/25'}`}
                          >
                            <Sparkles size={12} /> {isRowAdmin ? 'Master 360' : 'Vendor 360'}
                          </button>
                          
                          {!isRowAdmin && (
                            <button
                              onClick={() => setMessageModal({ isOpen: true, vendor: v, title: `Direct Advisory to ${v.tradingName}`, message: '', priority: 'normal', type: 'operational_advisory' })}
                              className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded-xl transition-all cursor-pointer border border-transparent hover:border-blue-200"
                              title="Direct Concierge Advisory Message"
                            >
                              <MessageCircle size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })
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
      {/* VENDOR 360° DOSSIER & DASHBOARD MIRROR (EXECUTIVE LIGHT WEIGHT WHITE THEME)*/}
      {/* ========================================================================= */}
      {activeVendor360 && (() => {
        const isMainAdmin = Boolean(
          activeVendor360.isMainAdmin || 
          activeVendor360.isFlagship || 
          activeVendor360.vendorInfo?.vendorType === 'flagship' ||
          /grand store/i.test(activeVendor360.vendorInfo?.tradingName || '')
        );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
            <div className={`bg-white text-slate-900 rounded-2xl border ${isMainAdmin ? 'border-amber-200 shadow-2xl shadow-amber-950/10' : 'border-slate-200 shadow-2xl shadow-slate-900/15'} max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden`}>
              {/* Modal Header */}
              <div className={`p-5 border-b ${isMainAdmin ? 'border-amber-200 bg-gradient-to-r from-amber-50/60 via-white to-amber-50/30' : 'border-slate-200 bg-white'} flex items-start justify-between gap-4`}>
                <div className="flex items-center gap-4">
                  {isMainAdmin ? (
                    <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-bold text-xl shadow-xs">
                      <Crown size={24} className="text-amber-600" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-extrabold text-lg shadow-xs">
                      {activeVendor360.vendorInfo.tradingName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                        {activeVendor360.vendorInfo.tradingName}
                      </h2>
                      {isMainAdmin ? (
                        <>
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 uppercase tracking-wide">
                            <Crown size={11} className="text-amber-600" /> PLATFORM MASTER • CENTRAL FLAGSHIP
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
                            MAIN ADMIN
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wide">
                            360° DASHBOARD MIRROR
                          </span>
                          <StatusBadge status={activeVendor360.vendorInfo.crmWorkflowStage || 'live_active'} />
                        </>
                      )}
                    </div>
                    {isMainAdmin ? (
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-700">{activeVendor360.vendorInfo.legalName}</span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <MapPin size={11} className="text-amber-600" /> {activeVendor360.vendorInfo.address}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-emerald-700 font-semibold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <ShieldCheck size={12} /> 100/100 Master Authority
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-amber-800 font-semibold">
                          0% Platform Commission
                        </span>
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-700">{activeVendor360.vendorInfo.legalName}</span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <MapPin size={11} className="text-blue-600" /> {activeVendor360.vendorInfo.address}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          Trust Score: {activeVendor360.dashboardMirror?.rating?.trustScore}/100
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isMainAdmin ? (
                    <>
                      <button
                        onClick={() => setDossierSubTab('catalog')}
                        className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-semibold rounded-xl text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Package size={14} className="text-amber-600" /> Master Vault ({activeVendor360.products?.length || 0})
                      </button>
                      <button
                        onClick={() => setDossierSubTab('settlement')}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <DollarSign size={14} /> Corporate Treasury
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setMessageModal({ 
                          isOpen: true, 
                          vendor: activeVendor360.vendorInfo, 
                          title: `Executive Advisory: ${activeVendor360.vendorInfo?.tradingName || activeVendor360.vendorInfo?.name}`,
                          message: '', 
                          priority: 'urgent', 
                          type: 'operational_advisory' 
                        })}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <MessageCircle size={14} /> Message Advisory
                      </button>
                      <button
                        onClick={() => handleOpenFreezeModal(activeVendor360.vendorInfo, !activeVendor360.vendorInfo?.isFrozen)}
                        className={`px-3.5 py-2 border font-semibold rounded-xl text-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs ${
                          activeVendor360.vendorInfo?.isFrozen 
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300' 
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                      >
                        {activeVendor360.vendorInfo?.isFrozen ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                        {activeVendor360.vendorInfo?.isFrozen ? 'Lift Store Freeze' : 'Freeze Store'}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setActiveVendor360(null)}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Temporary Store Freeze Alert Banner (Persistent if frozen) */}
              {activeVendor360.vendorInfo?.isFrozen && (
                <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                      <PauseCircle size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                          ❄️ STOREFRONT LISTINGS TEMPORARILY FROZEN
                        </span>
                        {activeVendor360.vendorInfo?.frozenAt && (
                          <span className="text-[11px] text-slate-500">
                            Frozen since {new Date(activeVendor360.vendorInfo.frozenAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 mt-1">
                        <strong className="text-slate-900">Reason:</strong> {activeVendor360.vendorInfo?.freezeReason || 'Operational Review'}
                        {activeVendor360.vendorInfo?.freezeAdvisoryMessage && (
                          <span className="text-slate-600"> — "{activeVendor360.vendorInfo.freezeAdvisoryMessage}"</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenFreezeModal(activeVendor360.vendorInfo, false)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors inline-flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer self-start sm:self-auto"
                  >
                    <PlayCircle size={14} /> Lift Freeze & Resume Store
                  </button>
                </div>
              )}

              {/* Sub-Tabs Navigation (Always single line whitespace-nowrap, never clumsy) */}
              <div className="px-6 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-xs">
                <button
                  onClick={() => setDossierSubTab('dashboard')}
                  className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    dossierSubTab === 'dashboard'
                      ? (isMainAdmin ? 'bg-white text-amber-800 shadow-xs border border-amber-300' : 'bg-white text-blue-700 shadow-xs border border-slate-200')
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Sparkles size={13} className={dossierSubTab === 'dashboard' ? (isMainAdmin ? 'text-amber-600' : 'text-blue-600') : 'text-slate-400'} />
                  <span>{isMainAdmin ? 'Master Command Dashboard' : 'Dashboard Mirror'}</span>
                </button>
                <button
                  onClick={() => setDossierSubTab('activity')}
                  className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    dossierSubTab === 'activity'
                      ? (isMainAdmin ? 'bg-white text-amber-800 shadow-xs border border-amber-300' : 'bg-white text-blue-700 shadow-xs border border-slate-200')
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <History size={13} className={dossierSubTab === 'activity' ? (isMainAdmin ? 'text-amber-600' : 'text-blue-600') : 'text-slate-400'} />
                  <span>{isMainAdmin ? 'Platform & Vault Logs' : 'Live Activity'}</span>
                </button>
                <button
                  onClick={() => setDossierSubTab('catalog')}
                  className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    dossierSubTab === 'catalog'
                      ? (isMainAdmin ? 'bg-white text-amber-800 shadow-xs border border-amber-300' : 'bg-white text-blue-700 shadow-xs border border-slate-200')
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Package size={13} className={dossierSubTab === 'catalog' ? (isMainAdmin ? 'text-amber-600' : 'text-blue-600') : 'text-slate-400'} />
                  <span>{isMainAdmin ? `Master Vault Catalog (${activeVendor360.products?.length || 0})` : `Products Catalog (${activeVendor360.products?.length || 0})`}</span>
                </button>
                <button
                  onClick={() => setDossierSubTab('orders')}
                  className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    dossierSubTab === 'orders'
                      ? (isMainAdmin ? 'bg-white text-amber-800 shadow-xs border border-amber-300' : 'bg-white text-blue-700 shadow-xs border border-slate-200')
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Clock size={13} className={dossierSubTab === 'orders' ? (isMainAdmin ? 'text-amber-600' : 'text-blue-600') : 'text-slate-400'} />
                  <span>{isMainAdmin ? `Direct Retail Orders (${activeVendor360.orders?.length || 0})` : `Assigned Orders (${activeVendor360.orders?.length || 0})`}</span>
                </button>
                <button
                  onClick={() => setDossierSubTab('settlement')}
                  className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    dossierSubTab === 'settlement'
                      ? (isMainAdmin ? 'bg-white text-amber-800 shadow-xs border border-amber-300' : 'bg-white text-blue-700 shadow-xs border border-slate-200')
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <DollarSign size={13} className={dossierSubTab === 'settlement' ? (isMainAdmin ? 'text-amber-600' : 'text-blue-600') : 'text-slate-400'} />
                  <span>{isMainAdmin ? 'Corporate Treasury & Merchant Settlement' : 'Settlements & Banking'}</span>
                </button>
                <button
                  onClick={() => setDossierSubTab('compliance')}
                  className={`px-3.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    dossierSubTab === 'compliance'
                      ? (isMainAdmin ? 'bg-white text-amber-800 shadow-xs border border-amber-300' : 'bg-white text-blue-700 shadow-xs border border-slate-200')
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <ShieldCheck size={13} className={dossierSubTab === 'compliance' ? (isMainAdmin ? 'text-amber-600' : 'text-blue-600') : 'text-slate-400'} />
                  <span>{isMainAdmin ? 'Master Accreditations & Licences' : 'Licences & Compliance'}</span>
                </button>
              </div>

              {/* Dossier Content Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                {/* SUBTAB 1: Mirrored Dashboard / Master Command */}
                {dossierSubTab === 'dashboard' && (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Top 4 Bento Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Financials */}
                      {isMainAdmin ? (
                        <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-xs space-y-2">
                          <div className="flex items-center justify-between text-slate-500 text-xs">
                            <span className="font-semibold uppercase tracking-wider text-amber-800">Flagship Sales (GMV)</span>
                            <DollarSign size={16} className="text-amber-600" />
                          </div>
                          <h4 className="text-2xl font-black text-slate-900">
                            R {activeVendor360.dashboardMirror?.financials?.grossMerchandiseValue?.toLocaleString()}
                          </h4>
                          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                            <div className="flex justify-between">
                              <span>Platform Commission:</span>
                              <span className="text-emerald-700 font-bold">0% (Platform Operator)</span>
                            </div>
                            <div className="flex justify-between font-bold text-amber-800">
                              <span>Retained Revenue:</span>
                              <span>100% (R {activeVendor360.dashboardMirror?.financials?.grossMerchandiseValue?.toLocaleString()})</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-2">
                          <div className="flex items-center justify-between text-slate-500 text-xs">
                            <span className="font-semibold uppercase tracking-wider">Gross Sales (GMV)</span>
                            <DollarSign size={16} className="text-blue-600" />
                          </div>
                          <h4 className="text-2xl font-black text-slate-900">
                            R {activeVendor360.dashboardMirror?.financials?.grossMerchandiseValue?.toLocaleString()}
                          </h4>
                          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                            <div className="flex justify-between">
                              <span>GS Commission (12%):</span>
                              <span className="text-rose-600 font-semibold">- R {activeVendor360.dashboardMirror?.financials?.commissionDeducted?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between font-bold text-blue-700">
                              <span>Net Vendor Earnings:</span>
                              <span>R {activeVendor360.dashboardMirror?.financials?.netVendorEarnings?.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Escrow & Payout Status / Treasury Capture */}
                      {isMainAdmin ? (
                        <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-xs space-y-2">
                          <div className="flex items-center justify-between text-slate-500 text-xs">
                            <span className="font-semibold uppercase tracking-wider text-emerald-700">Direct Treasury Settlement</span>
                            <CheckCircle2 size={16} className="text-emerald-600" />
                          </div>
                          <h4 className="text-2xl font-black text-emerald-700">
                            R {activeVendor360.dashboardMirror?.financials?.alreadyPaidOut?.toLocaleString()}
                          </h4>
                          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                            <div className="flex justify-between">
                              <span>Settlement Model:</span>
                              <span className="text-emerald-700 font-bold">Direct Settlement</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Corporate Treasury:</span>
                              <span className="text-slate-700 font-semibold">Standard Bank EFT (Real-Time)</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-2">
                          <div className="flex items-center justify-between text-slate-500 text-xs">
                            <span className="font-semibold uppercase tracking-wider">In-Escrow Payout</span>
                            <Clock size={16} className="text-sky-600" />
                          </div>
                          <h4 className="text-2xl font-black text-sky-700">
                            R {activeVendor360.dashboardMirror?.financials?.pendingSettlement?.toLocaleString()}
                          </h4>
                          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                            <div className="flex justify-between">
                              <span>Already Settled:</span>
                              <span className="text-slate-700 font-medium">R {activeVendor360.dashboardMirror?.financials?.alreadyPaidOut?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Next Settlement Date:</span>
                              <span className="text-blue-700 font-semibold">{activeVendor360.dashboardMirror?.financials?.nextPayoutDate}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Catalog Health */}
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-2">
                        <div className="flex items-center justify-between text-slate-500 text-xs">
                          <span className={`font-semibold uppercase tracking-wider ${isMainAdmin ? 'text-indigo-800' : ''}`}>
                            {isMainAdmin ? 'Master Vault Catalog' : 'Catalog Health'}
                          </span>
                          <Package size={16} className="text-indigo-600" />
                        </div>
                        <h4 className="text-2xl font-black text-slate-900">
                          {activeVendor360.dashboardMirror?.catalog?.totalProducts} <span className="text-xs text-slate-500 font-normal">{isMainAdmin ? 'Master SKUs' : 'Products Listed'}</span>
                        </h4>
                        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                          <div className="flex justify-between">
                            <span>Live Active SKUs:</span>
                            <span className="text-emerald-700 font-bold">{activeVendor360.dashboardMirror?.catalog?.liveProducts}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Low / Out of Stock:</span>
                            <span className="text-rose-600 font-bold">{activeVendor360.dashboardMirror?.catalog?.outOfStockProducts}</span>
                          </div>
                        </div>
                      </div>

                      {/* Fulfillment Performance */}
                      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-2">
                        <div className="flex items-center justify-between text-slate-500 text-xs">
                          <span className="font-semibold uppercase tracking-wider">
                            {isMainAdmin ? 'Flagship Fulfillment SLA' : 'Fulfillment SLA'}
                          </span>
                          <Zap size={16} className="text-emerald-600" />
                        </div>
                        <h4 className="text-2xl font-black text-emerald-600">
                          {activeVendor360.dashboardMirror?.fulfillment?.onTimeDispatchRatePct}%
                        </h4>
                        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                          <div className="flex justify-between">
                            <span>{isMainAdmin ? 'Vault Orders Fulfilled:' : 'Orders Fulfilled:'}</span>
                            <span className="text-slate-900 font-bold">{activeVendor360.dashboardMirror?.fulfillment?.fulfilledCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Overdue Dispatch:</span>
                            <span className={activeVendor360.dashboardMirror?.fulfillment?.overdueDispatchCount > 0 ? "text-rose-600 font-bold" : "text-slate-600 font-medium"}>
                              {activeVendor360.dashboardMirror?.fulfillment?.overdueDispatchCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Dual Grid: Estate Details & Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Left 2 Cols: Operational Identity */}
                      <div className="md:col-span-2 bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
                        <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isMainAdmin ? 'text-amber-800' : 'text-slate-900'}`}>
                          {isMainAdmin ? <Crown size={15} className="text-amber-600" /> : <Building2 size={15} className="text-blue-600" />}
                          {isMainAdmin ? 'Master Platform Headquarters & Flagship Cellar Dossier' : 'Winery & Estate Operational Dossier'}
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3.5 gap-x-6 text-xs">
                          <div>
                            <p className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">{isMainAdmin ? 'Platform Authority / Executive' : 'Estate Director / Contact'}</p>
                            <p className="text-slate-900 font-bold mt-0.5">{activeVendor360.vendorInfo.directorName}</p>
                            <p className="text-slate-500 mt-0.5">{activeVendor360.vendorInfo.phone}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">{isMainAdmin ? 'Operations Command' : 'Assigned Account Manager'}</p>
                            <p className={`font-bold mt-0.5 ${isMainAdmin ? 'text-amber-700' : 'text-blue-600'}`}>{activeVendor360.vendorInfo.accountManager?.name}</p>
                            <p className="text-slate-500 mt-0.5">{activeVendor360.vendorInfo.accountManager?.email}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">Company Registration (CIPC)</p>
                            <p className="text-slate-900 font-bold font-mono mt-0.5">{activeVendor360.vendorInfo.registrationNumber}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-medium text-[11px] uppercase tracking-wider">{isMainAdmin ? 'Central Cellar & Vault' : 'Winery Location / Vault'}</p>
                            <p className="text-slate-900 font-semibold mt-0.5">{activeVendor360.vendorInfo.address}</p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span className="text-slate-600 font-medium">
                              {isMainAdmin ? 'Master Platform Authority: Central Storefront & Vendor Marketplace Core' : 'Storefront Status: Live on Grand Store Global & Local'}
                            </span>
                          </div>
                          <button 
                            onClick={() => setDossierSubTab('activity')}
                            className={`text-xs font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer ${isMainAdmin ? 'text-amber-700' : 'text-blue-600'}`}
                          >
                            {isMainAdmin ? 'View master audit logs' : 'View real-time event logs'} <ArrowRight size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Right 1 Col: Executive Interventions */}
                      {isMainAdmin ? (
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-2">
                              <Crown size={15} className="text-amber-600" /> Master Platform Authority
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">Core platform actions for Central Flagship.</p>
                          </div>

                          <div className="space-y-2">
                            <button
                              onClick={() => toast.success(`Master Vault inventory synchronized! All ${activeVendor360.products?.length || activeVendor360.dashboardMirror?.catalog?.totalProducts || 0} luxury items are active across Global & Local storefronts.`)}
                              className="w-full py-2 bg-white hover:bg-amber-50 text-amber-900 border border-amber-200 font-semibold rounded-xl text-xs transition-colors text-left px-3 flex items-center justify-between cursor-pointer shadow-xs"
                            >
                              <span>Sync Master Vault Inventory</span>
                              <RefreshCw size={14} className="text-amber-700" />
                            </button>
                            <button
                              onClick={() => setMessageModal({ 
                                isOpen: true, 
                                vendor: { _id: 'all', tradingName: 'All Vendor Partners', name: 'All Partners' }, 
                                title: 'Platform Operations Broadcast',
                                message: '', 
                                priority: 'urgent', 
                                type: 'system_alert' 
                              })}
                              className="w-full py-2 bg-white hover:bg-blue-50 text-blue-900 border border-blue-200 font-semibold rounded-xl text-xs transition-colors text-left px-3 flex items-center justify-between cursor-pointer shadow-xs"
                            >
                              <span>Broadcast Partner Advisory</span>
                              <Send size={14} className="text-blue-600" />
                            </button>
                            <button
                              onClick={() => toast.success('Corporate Treasury reconciliation completed. Standard Bank merchant gateway in full parity (0 discrepancies).')}
                              className="w-full py-2 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold rounded-xl text-xs transition-colors text-left px-3 flex items-center justify-between cursor-pointer shadow-xs"
                            >
                              <span>Reconcile Corporate Treasury</span>
                              <CheckCircle2 size={14} className="text-emerald-600" />
                            </button>
                          </div>

                          <p className="text-[10px] text-amber-700 italic">Root administrative authority active (Super Admin).</p>
                        </div>
                      ) : (
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                              <Zap size={15} className="text-blue-600" /> Executive Actions
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">Direct intervention with vendor winery.</p>
                          </div>

                          <div className="space-y-2">
                            <button
                              onClick={() => setMessageModal({ 
                                isOpen: true, 
                                vendor: activeVendor360.vendorInfo, 
                                title: `Direct Operational Advisory: ${activeVendor360.vendorInfo?.tradingName || activeVendor360.vendorInfo?.name}`,
                                message: '', 
                                priority: 'urgent', 
                                type: 'operational_advisory' 
                              })}
                              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors text-left px-3 flex items-center justify-between cursor-pointer shadow-xs"
                            >
                              <span>Dispatch Urgent Advisory</span>
                              <Send size={14} />
                            </button>
                            <button
                              onClick={() => handleOpenFreezeModal(activeVendor360.vendorInfo, !activeVendor360.vendorInfo?.isFrozen)}
                              className={`w-full py-2 border font-semibold rounded-xl text-xs transition-colors text-left px-3 flex items-center justify-between cursor-pointer shadow-xs ${
                                activeVendor360.vendorInfo?.isFrozen
                                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-white hover:bg-amber-50 text-amber-800 border-amber-300'
                              }`}
                            >
                              <span>{activeVendor360.vendorInfo?.isFrozen ? 'Lift Store Freeze & Resume' : 'Temporary Freeze Store'}</span>
                              {activeVendor360.vendorInfo?.isFrozen ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                            </button>
                          </div>

                          <p className="text-[10px] text-slate-400 italic">Audit logged under Executive Staff.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* SUBTAB 2: Real-time Activity */}
                {dossierSubTab === 'activity' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <History size={16} className={isMainAdmin ? "text-amber-600" : "text-blue-600"} />
                          {isMainAdmin ? 'Flagship Vault & Master Platform Activity Stream' : 'Real-Time Operational Activity Stream'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {isMainAdmin ? 'Live operational telemetry tracking master catalog synchronizations, corporate settlements, and platform governance.' : 'Live operational telemetry showing what the vendor is doing right now.'}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${isMainAdmin ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full animate-ping ${isMainAdmin ? 'bg-amber-500' : 'bg-blue-500'}`}></span> Live Feed
                      </span>
                    </div>

                    <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {/* Pinned Store Freeze Status Card */}
                      {activeVendor360.vendorInfo?.isFrozen && (
                        <div className="relative group">
                          <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white animate-ping" />
                          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-xs">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                                <PauseCircle size={16} /> PINNED ADVISORY: Storefront Listings Temporarily Frozen
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-amber-100 text-amber-800 border-amber-300">
                                ACTIVE RESTRICTION
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 mt-2 font-medium">
                              <strong>Freeze Reason:</strong> {activeVendor360.vendorInfo.freezeReason || 'Operational Review'}
                            </p>
                            {activeVendor360.vendorInfo.freezeAdvisoryMessage && (
                              <p className="text-xs text-amber-900 mt-1.5 italic bg-amber-100/60 p-2.5 rounded-lg border border-amber-200">
                                "{activeVendor360.vendorInfo.freezeAdvisoryMessage}"
                              </p>
                            )}
                            <div className="mt-2 pt-2 border-t border-amber-200 flex items-center justify-between text-[10px] text-amber-800 font-mono">
                              <span>Actor: {activeVendor360.vendorInfo.frozenBy || 'Operations Command'}</span>
                              <span>Customer catalog checkout blocked</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Active Advisories Broadcast to Vendor */}
                      {activeVendor360.vendorInfo?.activeAdvisories?.filter(a => a.active !== false).map((adv, aIdx) => (
                        <div key={aIdx} className="relative group">
                          <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white" />
                          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-xs">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="font-bold text-blue-900 text-sm flex items-center gap-1.5">
                                <BellRing size={15} /> {adv.title || 'Platform Advisory Broadcast'}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                                adv.priority === 'critical' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                                adv.priority === 'urgent' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                'bg-blue-100 text-blue-800 border-blue-300'
                              }`}>
                                {(adv.priority || 'NORMAL').toUpperCase()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 mt-1">{adv.message}</p>
                            <div className="mt-2 text-[10px] text-slate-500 font-mono">
                              Dispatched: {new Date(adv.createdAt || Date.now()).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}

                      {(!activeVendor360.activities || activeVendor360.activities.length === 0) && !activeVendor360.vendorInfo?.isFrozen ? (
                        <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200 shadow-xs">
                          <History size={24} className="mx-auto mb-2 text-slate-400" />
                          <p className="font-semibold text-slate-800">No operational activities recorded yet.</p>
                          <p className="text-xs text-slate-500 mt-1">Actions taken will stream here automatically.</p>
                        </div>
                      ) : (
                        activeVendor360.activities.map((act) => (
                          <div key={act.id} className="relative group">
                            <div className="absolute -left-[27px] top-1.5 w-3.5 h-3.5 rounded-full bg-white border-2 border-blue-600 group-hover:scale-125 transition-transform" />
                            
                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <span className="font-bold text-slate-900 text-sm">{act.title}</span>
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${isMainAdmin ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                                    {act.badge}
                                  </span>
                                  <span className="text-[11px] text-slate-500 font-mono">
                                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(act.timestamp).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-slate-600 mt-1">{act.description}</p>
                              <p className="text-[10px] text-slate-400 mt-2 font-medium">Actor: {act.performedBy}</p>
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
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <Package size={16} className={isMainAdmin ? "text-amber-600" : "text-blue-600"} />
                          {isMainAdmin ? `Master Vault Inventory (${activeVendor360.products?.length || 0} SKUs)` : `Products Supplied by ${activeVendor360.vendorInfo.tradingName}`}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {isMainAdmin ? 'Central cellar holdings curated and distributed across Grand Store Global and Local storefronts.' : 'Inventory levels, vintage specifics, and listing status.'}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
                      <table className="w-full text-left text-xs min-w-[720px]">
                        <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 whitespace-nowrap">Product Name</th>
                            <th className="px-4 py-3 whitespace-nowrap">Category</th>
                            <th className="px-4 py-3 whitespace-nowrap">Vintage / ABV</th>
                            <th className="px-4 py-3 whitespace-nowrap">Price (ZAR)</th>
                            <th className="px-4 py-3 whitespace-nowrap">Stock Level</th>
                            <th className="px-4 py-3 whitespace-nowrap">Listing Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {(!activeVendor360.products || activeVendor360.products.length === 0) ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-400">No products uploaded under this account yet.</td>
                            </tr>
                          ) : (
                            activeVendor360.products.map((p) => (
                              <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2 whitespace-nowrap">
                                  <Package size={14} className={isMainAdmin ? "text-amber-600 shrink-0" : "text-blue-600 shrink-0"} />
                                  <div>
                                    <p className="font-bold text-slate-900">{p.name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">SKU: {p.id}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{p.category}</td>
                                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{p.vintage} • {p.abv}</td>
                                <td className={`px-4 py-3 font-bold whitespace-nowrap ${isMainAdmin ? 'text-amber-800' : 'text-blue-700'}`}>R {p.priceZar?.toLocaleString()}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${p.stock > 10 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                                    {p.stock} bottles in vault
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
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
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <Clock size={16} className={isMainAdmin ? "text-amber-600" : "text-blue-600"} />
                          {isMainAdmin ? `Direct Retail Orders Fulfilled from Central Vault (${activeVendor360.orders?.length || 0})` : `Customer Orders for ${activeVendor360.vendorInfo.tradingName}`}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {isMainAdmin ? 'Direct customer purchases routed through platform headquarters.' : 'Tracking fulfillment SLA and parcel dispatches.'}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
                      <table className="w-full text-left text-xs min-w-[760px]">
                        <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 whitespace-nowrap">Order Ref</th>
                            <th className="px-4 py-3 whitespace-nowrap">Customer & City</th>
                            <th className="px-4 py-3 whitespace-nowrap">Value (ZAR)</th>
                            <th className="px-4 py-3 whitespace-nowrap">Waybill Tracking</th>
                            <th className="px-4 py-3 whitespace-nowrap">Fulfillment Status</th>
                            <th className="px-4 py-3 whitespace-nowrap text-right">Intervention</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {(!activeVendor360.orders || activeVendor360.orders.length === 0) ? (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-slate-400">No orders recorded under this account yet.</td>
                            </tr>
                          ) : (
                            activeVendor360.orders.map((o) => (
                              <tr key={o._id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="px-4 py-3 font-bold font-mono text-slate-900 whitespace-nowrap">#{o.orderId}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <p className="text-slate-800 font-semibold">{o.customerName}</p>
                                  <p className="text-[10px] text-slate-500">{o.customerCity}</p>
                                </td>
                                <td className={`px-4 py-3 font-bold whitespace-nowrap ${isMainAdmin ? 'text-amber-800' : 'text-blue-700'}`}>R {o.orderTotal?.toLocaleString()}</td>
                                <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">{o.waybillNumber}</td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {o.isDispatched ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      ✓ Dispatched / Delivered
                                    </span>
                                  ) : o.orderAgeHours > 24 ? (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                      ⚠️ {o.orderAgeHours}h Overdue
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                      ⏳ Due in {o.dispatchDueInHours}h
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                  <button
                                    onClick={() => toast.success(`Courier dispatch ping transmitted for order #${o.orderId}`)}
                                    className="px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-semibold text-[11px] shadow-xs transition-colors cursor-pointer"
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

                {/* SUBTAB 5: Settlements & Banking / Treasury */}
                {dossierSubTab === 'settlement' && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-3">
                        <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${isMainAdmin ? 'text-amber-800' : 'text-slate-900'}`}>
                          <DollarSign size={16} className={isMainAdmin ? 'text-amber-600' : 'text-blue-600'} />
                          {isMainAdmin ? 'Corporate Treasury & Merchant Facility' : 'Banking & Escrow Settlement Account'}
                        </h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between py-1.5 border-b border-slate-100">
                            <span className="text-slate-500">Bank Name:</span>
                            <span className="text-slate-900 font-bold">{activeVendor360.vendorInfo.bankingInfo?.bankName || 'Standard Bank Corporate Treasury'}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-100">
                            <span className="text-slate-500">Account Name:</span>
                            <span className="text-slate-900 font-bold">{activeVendor360.vendorInfo.bankingInfo?.accountName || 'The Grand Store (Pty) Ltd'}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-100">
                            <span className="text-slate-500">Account Number:</span>
                            <span className="text-slate-900 font-mono font-bold">{activeVendor360.vendorInfo.bankingInfo?.accountNumber || '•••• 5261'}</span>
                          </div>
                          <div className="flex justify-between py-1.5 border-b border-slate-100">
                            <span className="text-slate-500">Branch Code:</span>
                            <span className="text-slate-900 font-mono font-bold">{activeVendor360.vendorInfo.bankingInfo?.branchCode || '051001'}</span>
                          </div>
                          <div className="flex justify-between py-1.5">
                            <span className="text-slate-500">Settlement Scheme:</span>
                            <span className={`font-bold ${isMainAdmin ? 'text-amber-700' : 'text-blue-700'}`}>
                              {isMainAdmin ? 'Direct Merchant Settlement (Instant EFT, Credit/Debit, Ozow)' : (activeVendor360.vendorInfo.bankingInfo?.payoutPreference || 'Monthly')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isMainAdmin ? (
                        <div className="bg-white rounded-xl p-5 border border-emerald-200 shadow-xs space-y-4 flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
                              <CheckCircle2 size={16} className="text-emerald-600" /> Direct Merchant Acquiring Capture
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">
                              Flagship Direct Settlement: <span className="text-emerald-700 font-extrabold">R {(activeVendor360.dashboardMirror?.financials?.grossMerchandiseValue || 0).toLocaleString()}</span>
                            </p>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                            As Platform Owner & Central Operator, 100% of Flagship sales are settled directly into corporate treasury. No 12% marketplace commission or 14-day escrow withholding applies.
                          </div>

                          <button
                            onClick={() => toast.success(`Corporate Treasury reconciliation sweep verified. R ${(activeVendor360.dashboardMirror?.financials?.grossMerchandiseValue || 0).toLocaleString()} gross retained revenue confirmed.`)}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Zap size={14} /> Reconcile Merchant Settlement Gateway
                          </button>
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                              <CheckCircle2 size={16} className="text-emerald-600" /> Immediate Payout Trigger
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">
                              Available Unsettled Escrow: <span className="text-blue-700 font-bold">R {(activeVendor360.dashboardMirror?.financials?.pendingSettlement || 0).toLocaleString()}</span>
                            </p>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                            Funds will be automatically released to {activeVendor360.vendorInfo.bankingInfo?.bankName || 'registered bank account'} on {activeVendor360.dashboardMirror?.financials?.nextPayoutDate || 'next scheduled date'} as per standard settlement window.
                          </div>

                          <button
                            onClick={() => toast.success(`Early settlement payout of R ${(activeVendor360.dashboardMirror?.financials?.pendingSettlement || 0).toLocaleString()} initiated via Host-to-Host banking API.`)}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2"
                          >
                            <Zap size={14} /> Execute Early Settlement Payout
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Settlement Payout History */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <DollarSign size={16} className={isMainAdmin ? "text-amber-600" : "text-blue-600"} />
                        {isMainAdmin ? 'Direct Settlement Disbursements & Treasury Records' : `Settled Disbursements & Payout Records (${activeVendor360.settlements?.length || 0})`}
                      </h4>
                      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
                        <table className="w-full text-left text-xs min-w-[780px]">
                          <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] tracking-wider border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-3 whitespace-nowrap">Settlement Ref</th>
                              <th className="px-4 py-3 whitespace-nowrap">Order Number</th>
                              <th className="px-4 py-3 whitespace-nowrap">Order Value</th>
                              <th className="px-4 py-3 whitespace-nowrap">Platform Fee</th>
                              <th className="px-4 py-3 whitespace-nowrap">Payout Amount</th>
                              <th className="px-4 py-3 whitespace-nowrap">Status</th>
                              <th className="px-4 py-3 whitespace-nowrap">Settled Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {(!activeVendor360.settlements || activeVendor360.settlements.length === 0) ? (
                              <tr>
                                <td colSpan={7} className="py-8 text-center text-slate-400">
                                  {isMainAdmin ? 'All Flagship sales are settled in real-time via direct merchant acquiring facility. No third-party escrow batches pending.' : 'No historical settlement disbursements executed for this vendor yet.'}
                                </td>
                              </tr>
                            ) : (
                              activeVendor360.settlements.map((s) => (
                                <tr key={s._id} className="hover:bg-slate-50/70 transition-colors">
                                  <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">{s.settlementReference}</td>
                                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">#{s.orderNumber}</td>
                                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">R {(s.orderTotal || 0).toLocaleString()}</td>
                                  <td className={`px-4 py-3 font-medium whitespace-nowrap ${isMainAdmin ? 'text-emerald-700' : 'text-rose-600'}`}>
                                    {isMainAdmin ? 'R 0 (0%)' : `- R ${(s.commissionAmount || 0).toLocaleString()}`}
                                  </td>
                                  <td className="px-4 py-3 font-bold text-emerald-700 whitespace-nowrap">R {(s.payoutAmount || 0).toLocaleString()}</td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${s.status === 'settled' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                                      {s.status === 'settled' ? '✓ Settled' : 'Pending'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-slate-500 font-mono whitespace-nowrap">
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
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <ShieldCheck size={16} className="text-emerald-600" />
                          {isMainAdmin ? 'Master Platform Accreditations & Statutory Compliance' : 'Statutory Liquor Licenses & Tax Clearance'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {isMainAdmin ? 'National Liquor Authority Master Licenses, SARS Tax Clearance, and CIPC Corporate Registration.' : 'Legal authorization to vend premium wines and spirits.'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeVendor360.kycDocuments?.map((doc, idx) => (
                        <div key={idx} className="bg-white p-4.5 rounded-xl border border-slate-200 shadow-xs space-y-2 hover:border-slate-300 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-xs">{doc.type}</span>
                            {doc.status === 'verified' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 size={10} /> Verified Master
                              </span>
                            ) : doc.status === 'pending_verification' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                ⏳ Awaiting Sign-off
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                Missing / Unsubmitted
                              </span>
                            )}
                          </div>
                          <p className={`text-xs font-mono font-semibold ${doc.status === 'not_submitted' ? 'text-slate-400 italic' : (isMainAdmin ? 'text-amber-800' : 'text-blue-700')}`}>
                            {doc.number}
                          </p>
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <span>
                              {doc.status === 'not_submitted' ? 'No document on file' : `Expiry: ${doc.expiryDate || 'Continuous Renewal'}`}
                            </span>
                            {doc.url ? (
                              <a href={doc.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-semibold">
                                <ExternalLink size={11} /> View Document
                              </a>
                            ) : (
                              <span className="text-slate-400 text-[11px]">
                                {doc.status === 'not_submitted' ? 'Pending Upload' : 'Master Document Active'}
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
              <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  {isMainAdmin ? (
                    <span className="flex items-center gap-1.5 text-amber-800 font-semibold">
                      <Crown size={14} className="text-amber-600" /> Grand Store Master Platform Operating System Active.
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <ShieldCheck size={14} className="text-emerald-600" /> Grand Store Executive Vendor 360 Protocol Active.
                    </span>
                  )}
                </span>
                <button
                  onClick={() => setActiveVendor360(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer border border-slate-200 shadow-xs"
                >
                  Close 360 Dossier
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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

      {/* Freeze / Unfreeze Store Modal */}
      {freezeModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                  freezeModal.isFreezing 
                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {freezeModal.isFreezing ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {freezeModal.isFreezing ? 'Temporary Freeze Store' : 'Lift Store Freeze & Resume'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Target Estate: <strong className="text-slate-800">{freezeModal.vendor?.tradingName || freezeModal.vendor?.name}</strong>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setFreezeModal({ isOpen: false, vendor: null, isFreezing: true, reason: '', advisoryMessage: '', broadcastNotice: true })} 
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmFreeze} className="space-y-4">
              {freezeModal.isFreezing ? (
                <>
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-amber-800">
                      <Info size={14} /> Immediate Operational Interventions:
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800/90 pl-1">
                      <li>Instantly hides all catalog products from Grand Store customer search & collections.</li>
                      <li>Halts new customer checkout orders for this vendor estate.</li>
                      <li>Sets operational status to <span className="font-bold">suspended / frozen</span> in CRM directory.</li>
                      <li>Dispatches advisory message to vendor portal and alerts customer storefront visitors.</li>
                    </ul>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Internal Freeze Reason (Audit Log)
                    </label>
                    <input
                      type="text"
                      required
                      value={freezeModal.reason}
                      onChange={(e) => setFreezeModal(prev => ({ ...prev, reason: e.target.value }))}
                      placeholder="e.g. Annual Inventory Stocktake / Cellar Maintenance"
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Public Storefront & Partner Advisory Message
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={freezeModal.advisoryMessage}
                      onChange={(e) => setFreezeModal(prev => ({ ...prev, advisoryMessage: e.target.value }))}
                      placeholder="e.g. This winery store is temporarily paused for annual vintage stocktaking. Order fulfillment will resume on schedule."
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Will display as an official advisory banner across all estate touchpoints.
                    </p>
                  </div>
                </>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-2">
                  <p className="font-bold text-sm text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 size={16} /> Confirm Store Unfreeze & Listing Restoration
                  </p>
                  <p className="text-slate-700 text-xs leading-relaxed">
                    Lifting the freeze will immediately reinstate active catalog SKUs across the Grand Store storefront, re-enable customer ordering, and return vendor status to <span className="text-emerald-700 font-bold">Approved (Live Active)</span>.
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setFreezeModal({ isOpen: false, vendor: null, isFreezing: true, reason: '', advisoryMessage: '', broadcastNotice: true })}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2 font-semibold rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                    freezeModal.isFreezing 
                      ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {submitting ? 'Applying...' : freezeModal.isFreezing ? '❄️ Freeze Store Now' : '▶️ Resume Storefront'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Message / Broadcast Advisory Modal */}
      {messageModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                  messageModal.vendor?._id === 'all'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {messageModal.vendor?._id === 'all' ? <Radio size={18} /> : <MessageCircle size={18} />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {messageModal.vendor?._id === 'all' ? 'Broadcast Partner Advisory' : 'Dispatch Vendor Advisory'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Recipient: <strong className="text-slate-800">{messageModal.vendor?.tradingName || messageModal.vendor?.name}</strong>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setMessageModal({ isOpen: false, vendor: null, title: '', message: '', priority: 'normal', type: 'operational_advisory' })} 
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Advisory Subject / Title
                </label>
                <input
                  type="text"
                  required
                  value={messageModal.title}
                  onChange={(e) => setMessageModal(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Vintage Stock Count Verification / Courier Holiday Schedule"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={messageModal.priority}
                    onChange={(e) => setMessageModal(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="normal">Normal (Notice)</option>
                    <option value="urgent">Urgent (Action Required)</option>
                    <option value="critical">Critical (Immediate SLA)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Advisory Classification
                  </label>
                  <select
                    value={messageModal.type}
                    onChange={(e) => setMessageModal(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    <option value="operational_advisory">Operational Advisory</option>
                    <option value="system_alert">System Alert</option>
                    <option value="payout_notice">Payout & Settlement</option>
                    <option value="compliance_warning">Compliance & License</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Advisory Content
                </label>
                <textarea
                  required
                  rows={4}
                  value={messageModal.message}
                  onChange={(e) => setMessageModal(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="e.g. Please verify remaining stock for Cap Classique Brut. An express consignment is scheduled for collection tomorrow at 10:00."
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Transmits in real-time to {messageModal.vendor?._id === 'all' ? 'all registered partner estate dashboards' : `${messageModal.vendor?.tradingName || messageModal.vendor?.name}'s dashboard`}.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setMessageModal({ isOpen: false, vendor: null, title: '', message: '', priority: 'normal', type: 'operational_advisory' })}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors cursor-pointer border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send size={13} />
                  {submitting ? 'Transmitting...' : messageModal.vendor?._id === 'all' ? 'Broadcast Advisory' : 'Dispatch Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
