import React, { useState } from 'react';
import { 
  ShieldCheck, Users, Mail, UserCheck, AlertTriangle, 
  Download, Eye, RefreshCw, Send, CheckCircle2, Filter, X,
  Plus, Calendar, ArrowRight, Check, Play, TrendingUp, Sparkles,
  Clock, BarChart3, FileText, Lock, Upload, Edit2, Trash2, Tag, ShoppingBag
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import BulkImportCustomersModal from '../components/common/BulkImportCustomersModal';
import ProductSelectorModal from '../components/marketing/ProductSelectorModal';
import CampaignDetailModal from '../components/marketing/CampaignDetailModal';
import CreateVoucherModal from '../components/marketing/CreateVoucherModal';
import { useCrmMarketing } from '../hooks/useCrmMarketing';
import { useToast } from '../context/ToastContext';

// The 7-Stage Newsletter Process specified in Section 8 of GS CRM 1.docx
const NEWSLETTER_FLOW_STEPS = [
  { step: 1, title: 'Select Audience', desc: 'Filter 18+ verified patrons & purchase categories' },
  { step: 2, title: 'Select Admin Bottles', desc: 'Choose direct cellar bottles & luxury vintage allocations' },
  { step: 3, title: 'Attach Voucher', desc: 'Issue product coupon code for Web & Mobile App' },
  { step: 4, title: 'Review Content', desc: 'Verify liquor compliance, age gating & ABV facts' },
  { step: 5, title: 'Approve & Schedule', desc: 'Operations sign-off & dispatch window' },
  { step: 6, title: 'Send Broadcast', desc: 'Automated dispatch with suppression safety' },
  { step: 7, title: 'Track Real Sales', desc: 'Real order attribution & bottle conversion analytics' }
];

export default function CrmMarketingPage() {
  const toast = useToast();
  const { 
    stats, segments, campaigns, coupons, recentSubscribers, loading, 
    refresh, previewSegment, createCampaign, updateCampaignStatus,
    sendCampaignNow, testSendCampaign, syncCampaignAttribution, deleteCampaign,
    toggleProductCoupon, deleteProductCoupon,
    createCategory, updateCategory, deleteCategory
  } = useCrmMarketing();

  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' | 'vouchers' | 'segments' | 'subscribers'
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Modals
  const [isBottlePickerOpen, setIsBottlePickerOpen] = useState(false);
  const [selectedBottlesForCampaign, setSelectedBottlesForCampaign] = useState([]);
  const [selectedCampaignForDrilldown, setSelectedCampaignForDrilldown] = useState(null);
  const [isCreateVoucherModalOpen, setIsCreateVoucherModalOpen] = useState(false);

  // Audience Category (Create / Edit) Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    channel: 'Newsletter & Direct Email',
    complianceStatus: 'Verified (100% Legal Age)',
    recommendedOffers: '',
    customerType: 'all_18plus',
    tags: ''
  });
  const [submittingCategory, setSubmittingCategory] = useState(false);

  // Delete Category Confirmation Modal State
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

  // New Campaign Modal State
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);
  const [newCampaignData, setNewCampaignData] = useState({
    name: '',
    audienceSegment: 'wine_buyers',
    audienceSegmentLabel: 'Fine Wine Collectors & Bordeaux Patrons',
    subject: '',
    contentBrief: '',
    scheduledDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 16)
  });
  const [voucherConfig, setVoucherConfig] = useState({
    createVoucher: false,
    code: '',
    discountType: 'percentage',
    discountValue: '10',
    expiryDays: '14'
  });
  const [submittingCampaign, setSubmittingCampaign] = useState(false);

  // Bulk Customer Import CSV Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importCohortId, setImportCohortId] = useState('auto');

  // Test Email Quick Dispatch
  const [testEmailModalCampaign, setTestEmailModalCampaign] = useState(null);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testEmailLoading, setTestEmailLoading] = useState(false);

  // Dispatch Confirmation Modal
  const [dispatchConfirmCampaign, setDispatchConfirmCampaign] = useState(null);
  const [dispatchingLoading, setDispatchingLoading] = useState(false);

  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({
      name: '',
      description: '',
      channel: 'Newsletter & Direct Email',
      complianceStatus: 'Verified (100% Legal Age)',
      recommendedOffers: '',
      customerType: 'all_18plus',
      tags: ''
    });
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (seg) => {
    setEditingCategory(seg);
    setCategoryFormData({
      name: seg.name || '',
      description: seg.description || '',
      channel: seg.channel || 'Newsletter & Direct Email',
      complianceStatus: seg.complianceStatus || 'Verified (100% Legal Age)',
      recommendedOffers: seg.recommendedOffers || '',
      customerType: seg.targetCriteria?.customerType || 'all_18plus',
      tags: (seg.targetCriteria?.tags || []).join(', ')
    });
    setIsCategoryModalOpen(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryFormData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setSubmittingCategory(true);
    try {
      const payload = {
        name: categoryFormData.name.trim(),
        description: categoryFormData.description.trim(),
        channel: categoryFormData.channel,
        complianceStatus: categoryFormData.complianceStatus,
        recommendedOffers: categoryFormData.recommendedOffers.trim(),
        targetCriteria: {
          customerType: categoryFormData.customerType,
          tags: categoryFormData.tags
            ? categoryFormData.tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
            : []
        }
      };

      if (editingCategory) {
        await updateCategory(editingCategory._id || editingCategory.slug || editingCategory.id, payload);
        toast.success(`Audience category "${payload.name}" updated successfully!`);
      } else {
        await createCategory(payload);
        toast.success(`New audience category "${payload.name}" created and saved!`);
      }
      setIsCategoryModalOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save audience category');
    } finally {
      setSubmittingCategory(false);
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategory) return;
    setDeletingLoading(true);
    try {
      await deleteCategory(deletingCategory._id || deletingCategory.slug || deletingCategory.id);
      toast.success(`Audience category "${deletingCategory.name}" removed successfully.`);
      setDeletingCategory(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete audience category');
    } finally {
      setDeletingLoading(false);
    }
  };

  const handleOpenImport = (cohortId = 'auto') => {
    setImportCohortId(cohortId);
    setIsImportModalOpen(true);
  };

  const handleOpenPreview = async (segment) => {
    setSelectedSegment(segment);
    setPreviewLoading(true);
    try {
      const data = await previewSegment(segment.id);
      setPreviewData(data);
    } catch (err) {
      toast.error('Failed to preview audience recipients');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExportCsv = async (segment) => {
    try {
      toast.info(`Preparing compliance CSV for "${segment.name}"...`);
      const data = await previewSegment(segment.id);
      const recipients = data?.recipients || [];
      if (recipients.length === 0) {
        toast.warning(`No active recipients found in segment "${segment.name}".`);
        return;
      }
      const headers = ['Recipient Name', 'Email', 'Customer Tier', '18+ Verified Status', 'Compliance Verification Timestamp'];
      const rows = recipients.map(r => [
        `"${r.name || 'Valued Patron'}"`,
        `"${r.email}"`,
        `"${r.type || 'Retail'}"`,
        `"VERIFIED_ADULT_18+"`,
        `"${new Date().toISOString()}"`
      ]);
      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `grandstore_${segment.id}_verified_18plus.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`Exported ${recipients.length} sanitized 18+ verified recipients to CSV.`);
    } catch (err) {
      toast.error('Failed to generate compliance CSV export');
    }
  };

  const handleCreateCampaignSubmit = async (e) => {
    e.preventDefault();
    if (!newCampaignData.name || !newCampaignData.subject) {
      toast.error('Campaign title and subject are required');
      return;
    }

    setSubmittingCampaign(true);
    try {
      const segObj = segments.find(s => s.id === newCampaignData.audienceSegment);
      const payload = {
        ...newCampaignData,
        audienceSegmentLabel: segObj?.name || 'Curated Cohort',
        featuredProductIds: selectedBottlesForCampaign.map(b => b.id || b.productId),
        voucherData: voucherConfig.createVoucher ? voucherConfig : null
      };

      await createCampaign(payload);
      toast.success('Campaign created with selected Admin bottles!');
      setIsNewCampaignModalOpen(false);
      setNewCampaignData({
        name: '',
        audienceSegment: 'wine_buyers',
        audienceSegmentLabel: 'Fine Wine Collectors & Bordeaux Patrons',
        subject: '',
        contentBrief: '',
        scheduledDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 16)
      });
      setSelectedBottlesForCampaign([]);
      setVoucherConfig({
        createVoucher: false,
        code: '',
        discountType: 'percentage',
        discountValue: '10',
        expiryDays: '14'
      });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create campaign');
    } finally {
      setSubmittingCampaign(false);
    }
  };

  const handleAdvanceCampaign = async (campaignId, nextStatus) => {
    try {
      await updateCampaignStatus(campaignId, nextStatus);
      toast.success(`Campaign moved to stage: "${nextStatus.replace('_', ' ').toUpperCase()}"`);
    } catch (err) {
      toast.error('Failed to advance campaign status');
    }
  };

  const handleConfirmDispatch = async () => {
    if (!dispatchConfirmCampaign) return;
    setDispatchingLoading(true);
    try {
      const res = await sendCampaignNow(dispatchConfirmCampaign._id);
      toast.success(res?.message || 'Broadcast dispatched successfully!');
      setDispatchConfirmCampaign(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to dispatch campaign');
    } finally {
      setDispatchingLoading(false);
    }
  };

  const handleSendTestEmailSubmit = async (e) => {
    e.preventDefault();
    if (!testEmailAddress.trim() || !testEmailModalCampaign) return;
    setTestEmailLoading(true);
    try {
      await testSendCampaign(testEmailModalCampaign._id, testEmailAddress.trim());
      toast.success(`Test preview dispatched to ${testEmailAddress}!`);
      setTestEmailModalCampaign(null);
      setTestEmailAddress('');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send test email');
    } finally {
      setTestEmailLoading(false);
    }
  };

  const handleToggleCoupon = async (couponId) => {
    try {
      const res = await toggleProductCoupon(couponId);
      toast.success(res?.message || 'Coupon status updated');
    } catch (err) {
      toast.error('Failed to update coupon status');
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm('Are you sure you want to remove this customer voucher?')) return;
    try {
      const res = await deleteProductCoupon(couponId);
      toast.success(res?.message || 'Voucher removed');
    } catch (err) {
      toast.error('Failed to delete coupon');
    }
  };

  const handleDeleteCampaign = async (campId) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await deleteCampaign(campId);
      toast.success('Campaign removed successfully');
    } catch (err) {
      toast.error('Failed to delete campaign');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'draft':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Draft</span>;
      case 'review_pending':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Review Pending</span>;
      case 'approved':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Approved</span>;
      case 'scheduled':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Scheduled</span>;
      case 'sent':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Sent & Tracked</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 capitalize">{status}</span>;
    }
  };

  // Real aggregate attributed sales
  const totalAttributedRevenue = campaigns.reduce((sum, c) => sum + (Number(c.attributedSalesZar) || 0), 0);
  const totalAttributedOrders = campaigns.reduce((sum, c) => sum + (Number(c.attributedOrdersCount) || (c.attributedOrders?.length || 0)), 0);

  return (
    <div className="crm-page space-y-6">
      {/* Page Header */}
      <div className="crm-page-header">
        <div className="crm-page-intro">
          <p className="crm-page-eyebrow">Customer growth</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="crm-page-title">
              Marketing
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck size={13} />
              18+ age gated
            </span>
          </div>
          <p className="crm-page-description">
            Build product campaigns, manage your audiences and track campaign-attributed sales.
          </p>
        </div>

        <div className="crm-page-actions">
          <button 
            onClick={() => setIsCreateVoucherModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs cursor-pointer hover:border-amber-300 hover:text-amber-800"
            title="Create customer voucher for Grand Store Admin products"
          >
            <Tag size={14} className="text-amber-600" /> Create Voucher
          </button>
          <button 
            onClick={() => handleOpenImport('auto')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-2xs cursor-pointer hover:border-blue-300 hover:text-blue-700"
            title="Bulk import patrons, wine club allocations, or wholesale buyers via CSV"
          >
            <Upload size={14} className="text-blue-600" /> Import Customers
          </button>
          <button 
            onClick={() => setIsNewCampaignModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-500/25 cursor-pointer"
          >
            <Plus size={15} /> Create Campaign
          </button>
          <button 
            onClick={refresh}
            disabled={loading}
            aria-label="Refresh marketing data"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm cursor-pointer"
            title="Refresh All Real Metrics"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <section className="crm-workspace-region" aria-label="Marketing summary">
      <div className="crm-stat-grid">
        <StatCard title="Age-verified customers" value={stats.totalAgeVerified || 0}
          icon={UserCheck} color="emerald" loading={loading}
          subtitle={stats.complianceRatePct == null ? 'View audience verification details' : `${stats.complianceRatePct}% statutory compliance`}
          onClick={() => setActiveTab('segments')} active={activeTab === 'segments'} />
        <StatCard title="Active campaigns" value={campaigns.filter(c => c.status !== 'sent').length}
          icon={Mail} color="blue" loading={loading}
          subtitle={`${campaigns.filter(c => c.status === 'sent').length} dispatched & tracked`}
          onClick={() => setActiveTab('campaigns')} active={activeTab === 'campaigns'} />
        <StatCard title="Attributed sales · ZAR" value={`R ${totalAttributedRevenue.toLocaleString()}`}
          icon={TrendingUp} color="purple" loading={loading}
          subtitle={`${totalAttributedOrders} orders attributed to campaigns`}
          onClick={() => setActiveTab('campaigns')} />
        <StatCard title="Customer vouchers" value={coupons.length}
          icon={Tag} color="amber" loading={loading}
          subtitle={`${coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0)} redemptions across store & app`}
          onClick={() => setActiveTab('vouchers')} active={activeTab === 'vouchers'} />
      </div>

      </section>

      {/* The 7-Stage Process Stepper */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles size={16} className="text-blue-600" />
              From audience to attribution
            </h2>
            <p className="text-xs text-slate-500">
              Admin bottle selection, customer voucher generation, bulk dispatch, and real sales attribution.
            </p>
          </div>
          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
            Campaign workflow
          </span>
        </div>

        <div className="crm-campaign-flow" role="list" aria-label="Campaign workflow steps">
          {NEWSLETTER_FLOW_STEPS.map((s, idx) => (
            <div 
              key={s.step}
              role="listitem"
              className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between hover:border-blue-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-extrabold text-[10px] flex items-center justify-center">
                    {s.step}
                  </span>
                  {idx < NEWSLETTER_FLOW_STEPS.length - 1 && (
                    <ArrowRight size={12} className="text-slate-300 hidden lg:block" />
                  )}
                </div>
                <h3 className="font-bold text-slate-900 text-xs">{s.title}</h3>
                <p className="text-[10px] text-slate-500 mt-1 leading-snug">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <nav className="crm-marketing-tabs" aria-label="Marketing sections">
        {[
          { id: 'campaigns', label: 'Campaigns', count: campaigns.length, icon: Mail },
          { id: 'vouchers', label: 'Vouchers', count: coupons.length, icon: Tag },
          { id: 'segments', label: 'Audiences', count: segments.length, icon: Users },
          { id: 'subscribers', label: 'Subscribers', count: recentSubscribers.length, icon: CheckCircle2 }
        ].map(({ id, label, count, icon: Icon }) => (
          <button key={id} type="button" aria-pressed={activeTab === id} onClick={() => setActiveTab(id)}>
            <Icon size={16} /> {label} <span className="crm-tab-count">{count}</span>
          </button>
        ))}
      </nav>

      {/* TAB 1: CAMPAIGN OPERATIONS */}
      {activeTab === 'campaigns' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Campaign Operations Board</h2>
              <p className="text-xs text-slate-500">
                Track marketing campaigns across approval, real bulk email delivery, and live attributed bottle sales.
              </p>
            </div>
            <button
              onClick={() => setIsNewCampaignModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer"
            >
              <Plus size={14} /> New Campaign
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="crm-marketing-table w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3.5">Campaign Details</th>
                  <th className="px-5 py-3.5">Marketed Admin Bottles</th>
                  <th className="px-5 py-3.5">Audience Cohort</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Delivery Results</th>
                  <th className="px-5 py-3.5">Attributed Sales (Real)</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No campaigns created yet. Click "Create Campaign" to initiate the 7-step process.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((camp) => (
                    <tr key={camp._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-900">{camp.name}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-xs">{camp.subject}</p>
                        {camp.attachedCoupon?.code && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-mono font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            <Tag size={10} /> Voucher: {camp.attachedCoupon.code}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {camp.featuredProducts && camp.featuredProducts.length > 0 ? (
                          <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                            {camp.featuredProducts.map((p, i) => (
                              <span
                                key={p.productId || i}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
                                title={p.name}
                              >
                                {p.image && <img src={p.image} alt={p.name} className="w-3.5 h-4 object-contain rounded" />}
                                <span className="max-w-[90px] truncate">{p.name}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">General Allocation</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {camp.audienceSegmentLabel || camp.audienceSegment}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{camp.recipientCount || 0} Recipients</p>
                      </td>
                      <td className="px-5 py-4">
                        {getStatusBadge(camp.status)}
                        {camp.sentDate && (
                          <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                            {new Date(camp.sentDate).toLocaleDateString()}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {camp.status === 'sent' ? (
                          <div className="space-y-0.5">
                            <span className="text-emerald-700 font-bold">{camp.deliveryResults?.delivered || 0}</span>
                            <span className="text-slate-400 text-[10px]"> / {camp.deliveryResults?.sent || 0}</span>
                            <p className="text-[10px] text-slate-400">({camp.deliveryResults?.opened || 0} opens)</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Pending dispatch</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {Number(camp.attributedSalesZar) > 0 ? (
                          <div>
                            <span className="font-extrabold text-emerald-600 text-sm">
                              R {Number(camp.attributedSalesZar).toLocaleString()}
                            </span>
                            <p className="text-[10px] text-slate-400">
                              {camp.attributedOrdersCount || camp.attributedOrders?.length || 0} orders placed
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-semibold">R 0</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => setSelectedCampaignForDrilldown(camp._id)}
                            className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                            title="Inspect Real Attributed Orders & Performance Funnel"
                          >
                            Drilldown
                          </button>
                          <button
                            onClick={() => {
                              setTestEmailModalCampaign(camp);
                              setTestEmailAddress('');
                            }}
                            className="px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                            title="Send test preview to admin inbox"
                          >
                            Test Email
                          </button>
                          {camp.status !== 'sent' && (
                            <button
                              onClick={() => setDispatchConfirmCampaign(camp)}
                              className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                            >
                              Send Now
                            </button>
                          )}
                          {camp.status === 'draft' && (
                            <button
                              onClick={() => handleDeleteCampaign(camp._id)}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="Delete Draft Campaign"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCT VOUCHERS & COUPONS (ADMIN PRODUCTS ONLY) */}
      {activeTab === 'vouchers' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Customer Product Vouchers</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Admin Products Only (vendorId: null)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Vouchers created here are live across Grand Store Global Web, Local Web, and the Mobile App.
              </p>
            </div>
            <button
              onClick={() => setIsCreateVoucherModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
            >
              <Plus size={14} /> Create Customer Voucher
            </button>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="crm-marketing-table w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Voucher Code</th>
                  <th className="px-5 py-3">Targeted Admin Bottles</th>
                  <th className="px-5 py-3">Discount</th>
                  <th className="px-5 py-3">Redemptions</th>
                  <th className="px-5 py-3">Expiry Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No customer product vouchers created yet. Click "Create Customer Voucher" to issue a promo code.
                    </td>
                  </tr>
                ) : (
                  coupons.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5 font-mono font-bold text-amber-900">
                        <div className="flex items-center gap-1.5">
                          <Tag size={14} className="text-amber-600" />
                          <span className="bg-amber-50 px-2 py-0.5 rounded border border-amber-200">{c.code}</span>
                        </div>
                        {c.title && <p className="text-[10px] text-slate-400 font-sans font-normal mt-0.5">{c.title}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        {c.applicableProducts && c.applicableProducts.length > 0 ? (
                          <div className="flex items-center gap-1 flex-wrap max-w-xs">
                            {c.applicableProducts.map((p, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
                              >
                                {p.image && <img src={p.image} alt={p.name} className="w-3.5 h-4 object-contain rounded" />}
                                <span className="max-w-[100px] truncate">{p.name}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">All Admin Bottles</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `R ${c.discountValue} OFF`}
                      </td>
                      <td className="px-5 py-3.5 font-extrabold text-blue-700">
                        {c.usedCount || 0} {c.usageLimit ? `/ ${c.usageLimit}` : 'uses'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : 'No expiry'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {c.isActive ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleCoupon(c._id)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
                          >
                            {c.isActive ? 'Pause' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(c._id)}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg cursor-pointer"
                            title="Delete Voucher"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CURATED AUDIENCES */}
      {activeTab === 'segments' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Customer audiences</h2>
              <p className="text-xs text-slate-500">Review recipients, verification details and campaign targeting.</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                {segments.length} Active Cohorts
              </span>
              <button
                onClick={handleOpenCreateCategory}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
              >
                <Plus size={14} /> Create Category
              </button>
              <button
                onClick={() => handleOpenImport('auto')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
              >
                <Upload size={14} /> Import Bulk Customers (CSV)
              </button>
            </div>
          </div>

          <div className="crm-audience-grid">
            {segments.map((seg) => (
              <div 
                key={seg.id}
                className="crm-audience-card border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-colors flex flex-col justify-between bg-white group"
              >
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-semibold text-slate-900 text-sm">{seg.name}</h3>
                        {seg.isSystem ? (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-slate-100 text-slate-500 rounded border border-slate-200 uppercase tracking-wider">
                            System Default
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-blue-50 text-blue-700 rounded border border-blue-200 uppercase tracking-wider">
                            Custom Category
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-50 text-blue-700 rounded-full border border-blue-200 shrink-0">
                      {seg.count} Recipients
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{seg.description}</p>

                  <div className="mt-3 space-y-1.5 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5 text-slate-600">
                      <span className="font-medium text-slate-800">Compliance:</span>
                      <span className="text-emerald-700 font-semibold">{seg.complianceStatus}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-slate-600">
                      <span className="font-medium text-slate-800">Channels:</span>
                      <span>{seg.channel}</span>
                    </div>
                    {seg.recommendedOffers && (
                      <div className="text-slate-600">
                        <span className="font-medium text-slate-800">Recommended Offers:</span> {seg.recommendedOffers}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenPreview(seg)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Eye size={13} /> Preview ({seg.count})
                    </button>
                    <button
                      onClick={() => handleExportCsv(seg)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    >
                      <Download size={13} /> Export CSV
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenImport(seg.id)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                      title={`Import CSV customers into ${seg.name}`}
                    >
                      <Upload size={13} /> Import
                    </button>
                    <button
                      onClick={() => handleOpenEditCategory(seg)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-2 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    <button
                      onClick={() => setDeletingCategory(seg)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1.5 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: LIVE OPT-IN STREAM */}
      {activeTab === 'subscribers' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Newsletter Registrations</h2>
              <p className="text-xs text-slate-500">Live opt-in stream with country source, giveaway entry tracking, and unsubscribe suppression</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">Last 10 Opt-ins</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Subscriber</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Country</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Giveaway Entry</th>
                  <th className="py-2.5 px-3">Subscribed On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {recentSubscribers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-400">No recent subscribers found</td>
                  </tr>
                ) : (
                  recentSubscribers.map((sub, idx) => (
                    <tr key={sub._id || idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{sub.name || 'Anonymous Collector'}</td>
                      <td className="py-2.5 px-3">
                        <div>{sub.email}</div>
                        {sub.phone && <div className="text-slate-400 text-[10px]">{sub.phone}</div>}
                      </td>
                      <td className="py-2.5 px-3">{sub.country || 'Global'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                          sub.status === 'subscribed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {sub.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {sub.isGiveawayEntry ? (
                          <span className="inline-flex items-center gap-1 text-purple-700 font-semibold">
                            <CheckCircle2 size={12} /> M Collection Draw
                          </span>
                        ) : (
                          <span className="text-slate-400">Standard</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {new Date(sub.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE CAMPAIGN MODAL (WITH ADMIN BOTTLES & VOUCHER GENERATOR) */}
      {isNewCampaignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Create Luxury Marketing Campaign</h3>
                <p className="text-xs text-slate-400">Attach direct Admin bottles, generate customer vouchers, and queue for dispatch</p>
              </div>
              <button 
                onClick={() => setIsNewCampaignModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCampaignSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Campaign Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Krug Grand Cuvée & Rare Champagne Allocation Drop"
                  value={newCampaignData.name}
                  onChange={(e) => setNewCampaignData({ ...newCampaignData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Audience Cohort (Step 1) *</label>
                <select
                  value={newCampaignData.audienceSegment}
                  onChange={(e) => {
                    const chosen = segments.find(s => s.id === e.target.value);
                    setNewCampaignData({ 
                      ...newCampaignData, 
                      audienceSegment: e.target.value,
                      audienceSegmentLabel: chosen?.name || e.target.value
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  {segments.map((seg) => (
                    <option key={seg.id} value={seg.id}>
                      {seg.name} ({seg.count} Recipients — 18+ Age Gated)
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select Admin Bottles */}
              <div className="border border-slate-200 rounded-xl p-3.5 space-y-2 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-bold text-slate-800 block text-xs">
                      Marketed Admin Bottles (Step 2)
                    </label>
                    <p className="text-[10px] text-slate-500">
                      Choose direct cellar bottles to embed in marketing emails and lock vouchers to.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsBottlePickerOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 cursor-pointer shadow-2xs"
                  >
                    <ShoppingBag size={13} /> Select Bottles ({selectedBottlesForCampaign.length})
                  </button>
                </div>

                {selectedBottlesForCampaign.length > 0 ? (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {selectedBottlesForCampaign.map((b) => (
                      <span
                        key={b.id || b.productId}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-800 shadow-2xs"
                      >
                        {b.image && <img src={b.image} alt={b.name} className="w-4 h-5 object-contain" />}
                        <span className="max-w-[130px] truncate">{b.name}</span>
                        <span className="text-emerald-700 font-bold">R {Number(b.price || 0).toLocaleString()}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedBottlesForCampaign(selectedBottlesForCampaign.filter(x => x.id !== b.id))}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No bottles chosen yet. Click "Select Bottles" to choose from 343 direct bottles.</p>
                )}
              </div>

              {/* Step 3: Attach Customer Voucher */}
              <div className="border border-slate-200 rounded-xl p-3.5 space-y-2.5 bg-amber-50/30">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={voucherConfig.createVoucher}
                      onChange={(e) => setVoucherConfig({ ...voucherConfig, createVoucher: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                    />
                    <span>Attach Exclusive Customer Voucher (Step 3)</span>
                  </label>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded">
                    Admin Products Only
                  </span>
                </div>

                {voucherConfig.createVoucher && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Voucher Code (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. KRUG10 (Auto if blank)"
                        value={voucherConfig.code}
                        onChange={(e) => setVoucherConfig({ ...voucherConfig, code: e.target.value.toUpperCase() })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Discount Type & Value *</label>
                      <div className="flex gap-1">
                        <select
                          value={voucherConfig.discountType}
                          onChange={(e) => setVoucherConfig({ ...voucherConfig, discountType: e.target.value })}
                          className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="percentage">% Off</option>
                          <option value="fixed_amount">R Off</option>
                        </select>
                        <input
                          type="number"
                          min="1"
                          placeholder="10"
                          value={voucherConfig.discountValue}
                          onChange={(e) => setVoucherConfig({ ...voucherConfig, discountValue: e.target.value })}
                          className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Validity (Days)</label>
                      <input
                        type="number"
                        min="1"
                        value={voucherConfig.expiryDays}
                        onChange={(e) => setVoucherConfig({ ...voucherConfig, expiryDays: e.target.value })}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Subject Header *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Exclusive Private Allocation: Rare Stellenbosch Reserve"
                  value={newCampaignData.subject}
                  onChange={(e) => setNewCampaignData({ ...newCampaignData, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Content Brief & Editorial Copy</label>
                <textarea
                  rows={3}
                  placeholder="Describe the wines, tasting notes, sommelier recommendations, or cellar allocations..."
                  value={newCampaignData.contentBrief}
                  onChange={(e) => setNewCampaignData({ ...newCampaignData, contentBrief: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Scheduled Date</label>
                <input
                  type="datetime-local"
                  value={newCampaignData.scheduledDate}
                  onChange={(e) => setNewCampaignData({ ...newCampaignData, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCampaignModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCampaign}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  {submittingCampaign ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DISPATCH CONFIRMATION MODAL */}
      {dispatchConfirmCampaign && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                <Send size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Dispatch Live Bulk Campaign?</h3>
                <p className="text-xs text-slate-500">Real emails will be delivered to actual recipient inboxes.</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-800">{dispatchConfirmCampaign.name}</p>
              <p className="text-slate-600">Audience: {dispatchConfirmCampaign.audienceSegmentLabel}</p>
              <p className="text-blue-600 font-semibold">{dispatchConfirmCampaign.recipientCount} legal 18+ verified recipients</p>
            </div>

            <p className="text-[11px] text-slate-400">
              Alcohol advertising compliance checks will run automatically. Deliveries are logged in real time.
            </p>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDispatchConfirmCampaign(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDispatch}
                disabled={dispatchingLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm cursor-pointer"
              >
                {dispatchingLoading ? 'Broadcasting...' : 'Yes, Dispatch Broadcast'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEST EMAIL QUICK MODAL */}
      {testEmailModalCampaign && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Send Live Test Email</h3>
              <button onClick={() => setTestEmailModalCampaign(null)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSendTestEmailSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Deliver Test Email To:</label>
                <input
                  type="email"
                  required
                  placeholder="your.email@domain.com"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTestEmailModalCampaign(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={testEmailLoading}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  {testEmailLoading ? 'Sending...' : 'Send Preview'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1: BOTTLE SELECTOR MODAL */}
      <ProductSelectorModal
        isOpen={isBottlePickerOpen}
        onClose={() => setIsBottlePickerOpen(false)}
        selectedProducts={selectedBottlesForCampaign}
        onSelectProducts={setSelectedBottlesForCampaign}
        maxSelectable={6}
      />

      {/* MODAL 2: CAMPAIGN DETAIL & ATTRIBUTED SALES DRILLDOWN */}
      <CampaignDetailModal
        isOpen={Boolean(selectedCampaignForDrilldown)}
        onClose={() => setSelectedCampaignForDrilldown(null)}
        campaignId={selectedCampaignForDrilldown}
        onCampaignUpdated={refresh}
      />

      {/* MODAL 3: CREATE STANDALONE VOUCHER MODAL */}
      <CreateVoucherModal
        isOpen={isCreateVoucherModalOpen}
        onClose={() => setIsCreateVoucherModalOpen(false)}
        onVoucherCreated={refresh}
      />

      {/* Cohort Preview Modal */}
      {selectedSegment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{selectedSegment.name} — Preview</h3>
                <p className="text-xs text-slate-500">Verified recipients conforming to age and consent policies</p>
              </div>
              <button 
                onClick={() => { setSelectedSegment(null); setPreviewData(null); }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {previewLoading ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <RefreshCw size={20} className="animate-spin mx-auto mb-2 text-blue-600" />
                  Generating compliance-filtered preview...
                </div>
              ) : previewData?.recipients?.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">No matching recipients in this cohort.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {previewData?.recipients?.map((rec, i) => (
                    <div key={rec.id || i} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-900">{rec.name || 'Private Collector'}</p>
                        <p className="text-slate-500 text-[11px]">{rec.email} • {rec.phone}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                          18+ Verified
                        </span>
                        <span className="text-slate-400 text-[11px] capitalize">{rec.type?.replace('_', ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <button
                onClick={() => {
                  const sId = selectedSegment.id;
                  setSelectedSegment(null);
                  setPreviewData(null);
                  handleOpenImport(sId);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors cursor-pointer"
              >
                <Upload size={13} /> Import More Customers (CSV)
              </button>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setSelectedSegment(null); setPreviewData(null); }}
                  className="px-4 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={() => handleExportCsv(selectedSegment)}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm cursor-pointer"
                >
                  Download Sanitized CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Customer Import CSV Modal */}
      <BulkImportCustomersModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        initialCohortId={importCohortId}
        cohorts={segments}
        onSuccess={() => {
          refresh();
        }}
      />
    </div>
  );
}
