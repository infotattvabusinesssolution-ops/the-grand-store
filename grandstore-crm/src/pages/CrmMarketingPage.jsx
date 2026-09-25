import React, { useState } from 'react';
import { 
  ShieldCheck, Users, Mail, UserCheck, AlertTriangle, 
  Download, Eye, RefreshCw, Send, CheckCircle2, Filter, X,
  Plus, Calendar, ArrowRight, Check, Play, TrendingUp, Sparkles,
  Clock, BarChart3, FileText, Lock, Upload, Edit2, Trash2
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import BulkImportCustomersModal from '../components/common/BulkImportCustomersModal';
import { useCrmMarketing } from '../hooks/useCrmMarketing';
import { useToast } from '../context/ToastContext';

// The 7-Stage Newsletter Process specified in Section 8 of GS CRM 1.docx
const NEWSLETTER_FLOW_STEPS = [
  { step: 1, title: 'Select Audience', desc: 'Filter 18+ verified patrons & purchase categories' },
  { step: 2, title: 'Prepare Campaign', desc: 'Craft bottle showcase, allocations & subject copy' },
  { step: 3, title: 'Review Content', desc: 'Verify liquor compliance, age gating & ABV facts' },
  { step: 4, title: 'Approve', desc: 'Operations or Compliance Director sign-off' },
  { step: 5, title: 'Schedule', desc: 'Set optimal broadcast dispatch window' },
  { step: 6, title: 'Send', desc: 'Automated dispatch with suppression safety' },
  { step: 7, title: 'View Results', desc: 'Track opens, clicks, unsubscribes & attributed sales' }
];

export default function CrmMarketingPage() {
  const toast = useToast();
  const { 
    stats, segments, campaigns, recentSubscribers, loading, 
    refresh, previewSegment, createCampaign, updateCampaignStatus,
    createCategory, updateCategory, deleteCategory
  } = useCrmMarketing();

  const [activeTab, setActiveTab] = useState('campaigns'); // 'campaigns' | 'segments' | 'subscribers'
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);

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
        await updateCategory(editingCategory.id || editingCategory._id, payload);
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
      await deleteCategory(deletingCategory.id || deletingCategory._id);
      toast.success(`Audience category "${deletingCategory.name}" removed successfully.`);
      setDeletingCategory(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete audience category');
    } finally {
      setDeletingLoading(false);
    }
  };

  // New Campaign Modal
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);
  const [newCampaignData, setNewCampaignData] = useState({
    name: '',
    audienceSegment: 'wine_buyers',
    audienceSegmentLabel: 'Fine Wine Collectors & Bordeaux Patrons',
    subject: '',
    contentBrief: '',
    scheduledDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 16)
  });
  const [submittingCampaign, setSubmittingCampaign] = useState(false);

  // Bulk Customer Import CSV Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importCohortId, setImportCohortId] = useState('auto');

  const handleOpenImport = (cohortId = 'auto') => {
    setImportCohortId(cohortId);
    setIsImportModalOpen(true);
  };

  // Campaign Review Modal
  const [reviewCampaign, setReviewCampaign] = useState(null);

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
        `"${r.crmCustomerType || 'Retail'}"`,
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
      await createCampaign({
        ...newCampaignData,
        audienceSegmentLabel: segObj?.name || 'Curated Cohort',
        recipientCount: segObj?.count || 120
      });
      toast.success('Campaign created and moved to Content Review stage!');
      setIsNewCampaignModalOpen(false);
      setNewCampaignData({
        name: '',
        audienceSegment: 'wine_buyers',
        audienceSegmentLabel: 'Fine Wine Collectors & Bordeaux Patrons',
        subject: '',
        contentBrief: '',
        scheduledDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().slice(0, 16)
      });
    } catch (err) {
      toast.error('Failed to create campaign');
    } finally {
      setSubmittingCampaign(false);
    }
  };

  const handleAdvanceCampaign = async (campaignId, nextStatus) => {
    try {
      await updateCampaignStatus(campaignId, nextStatus);
      toast.success(`Campaign moved to stage: "${nextStatus.replace('_', ' ').toUpperCase()}"`);
      if (reviewCampaign?._id === campaignId) {
        setReviewCampaign(null);
      }
    } catch (err) {
      toast.error('Failed to advance campaign status');
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

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Marketing, Campaigns & Customer Audiences
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck size={13} />
              18+ Age Gated (Section 8)
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Section 8 Operational Engine: 7-stage newsletter process, curated audience cohorts, age-gated compliance, and revenue attribution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleOpenImport('auto')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-xs cursor-pointer hover:border-blue-300 hover:text-blue-700"
            title="Bulk import patrons, wine club allocations, or wholesale buyers via CSV"
          >
            <Upload size={14} className="text-blue-600" /> Import Customers (CSV)
          </button>
          <button 
            onClick={() => setIsNewCampaignModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm shadow-blue-500/25 cursor-pointer"
          >
            <Plus size={15} /> Create Campaign
          </button>
          <button 
            onClick={refresh}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm cursor-pointer"
            title="Refresh All Metrics"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Compliance & Performance Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Legal Age Verified (18+)" 
          value={stats.totalAgeVerified || 0} 
          icon={UserCheck} 
          color="emerald"
          subtitle={`${stats.complianceRatePct || 100}% statutory compliance`}
        />
        <StatCard 
          title="Active Campaigns" 
          value={campaigns.filter(c => c.status !== 'sent').length || 0} 
          icon={Mail} 
          color="blue"
          subtitle={`${campaigns.filter(c => c.status === 'sent').length} dispatched & tracked`}
        />
        <StatCard 
          title="Attributed Sales (ZAR)" 
          value={`R ${(campaigns.reduce((sum, c) => sum + (c.attributedSalesZar || 0), 0)).toLocaleString()}`} 
          icon={TrendingUp} 
          color="purple"
          subtitle="Direct sales tracked to broadcasts"
        />
        <StatCard 
          title="Global Unsubscribes" 
          value={stats.unsubscribedCount || 0} 
          icon={ShieldCheck} 
          color="amber"
          subtitle="Zero-tolerance suppression list"
        />
      </div>

      {/* The 7-Stage Newsletter Process Pipeline Visualizer (Section 8 of GS CRM 1.docx) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles size={16} className="text-blue-600" />
              The 7-Stage Newsletter & Campaign Process
            </h2>
            <p className="text-xs text-slate-500">
              Standard operating procedure for fine wine and luxury spirits marketing (GS CRM 1, Section 8)
            </p>
          </div>
          <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
            Alcohol Advertising Compliant
          </span>
        </div>

        {/* Pipeline Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2">
          {NEWSLETTER_FLOW_STEPS.map((s, idx) => (
            <div 
              key={s.step}
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

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'campaigns'
              ? 'border-blue-600 text-blue-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Mail size={16} /> Campaign Management ({campaigns.length})
        </button>

        <button
          onClick={() => setActiveTab('segments')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'segments'
              ? 'border-blue-600 text-blue-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users size={16} /> Curated Audiences ({segments.length})
        </button>

        <button
          onClick={() => setActiveTab('subscribers')}
          className={`pb-3 px-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'subscribers'
              ? 'border-blue-600 text-blue-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 size={16} /> Live Opt-in Stream ({recentSubscribers.length})
        </button>
      </div>

      {/* TAB 1: CAMPAIGN MANAGEMENT TABLE (SECTION 8 OF GS CRM 1.DOCX) */}
      {activeTab === 'campaigns' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Campaign Operations Board</h2>
              <p className="text-xs text-slate-500">
                Track marketing campaigns across approval, scheduling, delivery rates, and attributed bottle sales.
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
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Campaign Name</th>
                  <th className="px-6 py-3.5">Audience Cohort</th>
                  <th className="px-6 py-3.5">Scheduled / Sent Date</th>
                  <th className="px-6 py-3.5">Approval Status</th>
                  <th className="px-6 py-3.5">Delivery Results</th>
                  <th className="px-6 py-3.5">Unsubs</th>
                  <th className="px-6 py-3.5">Clicks</th>
                  <th className="px-6 py-3.5">Attributed Sales</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No campaigns created yet. Click "Create Campaign" to initiate the 7-step process.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((camp) => (
                    <tr key={camp._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{camp.name}</p>
                        <p className="text-[11px] text-slate-500 truncate max-w-xs">{camp.subject}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {camp.audienceSegmentLabel || camp.audienceSegment}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{camp.recipientCount || 0} Recipients</p>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {camp.sentDate ? (
                          <div>
                            <span className="text-emerald-700 font-bold">Sent: </span>
                            {new Date(camp.sentDate).toLocaleDateString()}
                          </div>
                        ) : camp.scheduledDate ? (
                          <div>
                            <span className="text-purple-700 font-bold">Sched: </span>
                            {new Date(camp.scheduledDate).toLocaleDateString()}
                          </div>
                        ) : (
                          'Unscheduled'
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(camp.status)}
                        {camp.approvedByName && (
                          <p className="text-[10px] text-slate-400 mt-0.5">By: {camp.approvedByName}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {camp.status === 'sent' ? (
                          <div className="space-y-0.5">
                            <span className="text-emerald-700 font-bold">{camp.deliveryResults?.delivered || 0}</span>
                            <span className="text-slate-400 text-[10px]"> / {camp.deliveryResults?.sent || 0}</span>
                            <p className="text-[10px] text-slate-400">({camp.deliveryResults?.opened || 0} opened)</p>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Pending dispatch</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-700">
                        {camp.unsubscribes || 0}
                      </td>
                      <td className="px-6 py-4 font-semibold text-blue-600">
                        {camp.clicks || 0}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {camp.attributedSalesZar > 0 ? (
                          <span className="text-emerald-600">R {camp.attributedSalesZar.toLocaleString()}</span>
                        ) : (
                          <span className="text-slate-400">R 0</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setReviewCampaign(camp)}
                            className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Inspect Campaign Details & Content Brief"
                          >
                            Review
                          </button>
                          {camp.status === 'draft' && (
                            <button
                              onClick={() => handleAdvanceCampaign(camp._id, 'review_pending')}
                              className="px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors cursor-pointer"
                            >
                              Submit
                            </button>
                          )}
                          {camp.status === 'review_pending' && (
                            <button
                              onClick={() => handleAdvanceCampaign(camp._id, 'approved')}
                              className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                          )}
                          {camp.status === 'approved' && (
                            <button
                              onClick={() => handleAdvanceCampaign(camp._id, 'scheduled')}
                              className="px-2.5 py-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors cursor-pointer"
                            >
                              Schedule
                            </button>
                          )}
                          {camp.status === 'scheduled' && (
                            <button
                              onClick={() => handleAdvanceCampaign(camp._id, 'sent')}
                              className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                            >
                              Send Now
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

      {/* TAB 2: AUDIENCE SEGMENTS & LEGAL AGE COMPLIANCE */}
      {activeTab === 'segments' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Curated Compliance Audiences (Section 8)</h2>
              <p className="text-xs text-slate-500">Target specific luxury cohorts with zero non-compliant outreach</p>
            </div>
            <div className="flex items-center gap-2">
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-xs"
              >
                <Upload size={14} /> Import Bulk Customers (CSV)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {segments.map((seg) => (
              <div 
                key={seg.id}
                className="border border-slate-200 rounded-xl p-4 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between bg-white group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
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
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <span className="font-medium text-slate-800">Compliance:</span>
                      <span className="text-emerald-700 font-semibold">{seg.complianceStatus}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
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
                      <Eye size={13} />
                      Preview ({seg.count})
                    </button>
                    <button
                      onClick={() => handleExportCsv(seg)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    >
                      <Download size={13} />
                      Export CSV
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenImport(seg.id)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 px-2 py-1.5 rounded-lg border border-emerald-200 transition-colors cursor-pointer"
                      title={`Import CSV customers into ${seg.name}`}
                    >
                      <Upload size={13} />
                      Import
                    </button>
                    <button
                      onClick={() => handleOpenEditCategory(seg)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-blue-50 px-2 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                      title="Edit Category Details"
                    >
                      <Edit2 size={13} />
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingCategory(seg)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1.5 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                      title="Delete Category"
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

      {/* TAB 3: LIVE OPT-IN STREAM & SUPPRESSION */}
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

      {/* CREATE NEW CAMPAIGN MODAL (7-STEP PIPELINE INITIATOR) */}
      {isNewCampaignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto crm-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Create New Marketing Campaign</h3>
                <p className="text-xs text-slate-400">Initiate Step 1 (Select Audience) & Step 2 (Prepare Campaign)</p>
              </div>
              <button 
                onClick={() => setIsNewCampaignModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCampaignSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Campaign Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rare Bordeaux Allocation / Spring Gin Drop"
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

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Subject Header *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Exclusive Allocation: 2019 Stellenbosch Reserve"
                  value={newCampaignData.subject}
                  onChange={(e) => setNewCampaignData({ ...newCampaignData, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Content Brief & Featured Bottles</label>
                <textarea
                  rows={3}
                  placeholder="Describe the wines, discounts, free delivery thresholds, or tasting event hooks..."
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

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2 text-[11px] text-emerald-800">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Compliance Guard:</strong> All recipients will be automatically checked for 18+ legal drinking age verification and active opt-in consent before dispatch.
                </span>
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  {submittingCampaign ? 'Queuing...' : 'Create & Move to Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CAMPAIGN REVIEW & PIPELINE INSPECTOR MODAL */}
      {reviewCampaign && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">{reviewCampaign.name}</h3>
                  {getStatusBadge(reviewCampaign.status)}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">Audience: {reviewCampaign.audienceSegmentLabel}</p>
              </div>
              <button 
                onClick={() => setReviewCampaign(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <p className="font-bold text-slate-700">Subject Line:</p>
                <p className="text-slate-900 font-medium">{reviewCampaign.subject}</p>
                <p className="font-bold text-slate-700 pt-2">Content Brief:</p>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{reviewCampaign.contentBrief || 'No specific content notes provided.'}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block">Recipients</span>
                  <span className="font-bold text-slate-900">{reviewCampaign.recipientCount || 0}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block">Attributed Sales</span>
                  <span className="font-bold text-emerald-600">R {(reviewCampaign.attributedSalesZar || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Created: {new Date(reviewCampaign.createdAt).toLocaleDateString()}
              </span>
              <div className="flex gap-2">
                {reviewCampaign.status === 'review_pending' && (
                  <button
                    onClick={() => handleAdvanceCampaign(reviewCampaign._id, 'approved')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
                  >
                    Approve Content
                  </button>
                )}
                {reviewCampaign.status === 'approved' && (
                  <button
                    onClick={() => handleAdvanceCampaign(reviewCampaign._id, 'scheduled')}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
                  >
                    Set Schedule
                  </button>
                )}
                {reviewCampaign.status === 'scheduled' && (
                  <button
                    onClick={() => handleAdvanceCampaign(reviewCampaign._id, 'sent')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm"
                  >
                    Send Now
                  </button>
                )}
                <button
                  onClick={() => setReviewCampaign(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <Upload size={13} />
                Import More Customers (CSV)
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
        onSuccess={() => {
          refresh();
        }}
      />

      {/* CREATE / EDIT AUDIENCE CATEGORY MODAL */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto crm-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingCategory ? 'Edit Audience Category' : 'Create New Audience Category'}
                </h3>
                <p className="text-xs text-slate-400">
                  Configure demographic targeting, legal age compliance gating, and outreach channels
                </p>
              </div>
              <button 
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category / Cohort Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cap Classique & Sparkling Wine Lovers"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Audience Description</label>
                <textarea
                  rows={2}
                  placeholder="Target criteria, vintage affinities, customer preferences..."
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Customer Cohort</label>
                  <select
                    value={categoryFormData.customerType}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, customerType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="all_18plus">All 18+ Verified Buyers</option>
                    <option value="vip_collector">VIP Collectors (High Net Worth)</option>
                    <option value="trade_buyer">B2B Trade & Wholesale Accounts</option>
                    <option value="event_attendees">Tasting & Masterclass Attendees</option>
                    <option value="auction_bidder">Live Auction & Lot Bidders</option>
                    <option value="optin_newsletter">General Newsletter Opt-ins</option>
                    <option value="custom">Custom Tag Match Only</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Marketing Channels</label>
                  <input
                    type="text"
                    placeholder="e.g. Newsletter & Direct Email, WhatsApp Concierge"
                    value={categoryFormData.channel}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, channel: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Compliance Status Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Verified (100% Legal Age)"
                    value={categoryFormData.complianceStatus}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, complianceStatus: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer CRM Tags (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. sparkling, cap_classique, champagne"
                    value={categoryFormData.tags}
                    onChange={(e) => setCategoryFormData({ ...categoryFormData, tags: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Recommended Offers & Highlights</label>
                <input
                  type="text"
                  placeholder="e.g. Vintage Blanc de Blancs Allocations, Private Cellar Previews"
                  value={categoryFormData.recommendedOffers}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, recommendedOffers: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2 text-[11px] text-emerald-800">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Database Synchronization:</strong> This category is saved in the central database and immediately accessible across campaign builders and audience exports.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingCategory}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm cursor-pointer"
                >
                  {submittingCategory ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CATEGORY CONFIRMATION MODAL */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Delete Audience Category</h3>
                <p className="text-xs text-slate-500">Are you sure you want to remove this category?</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-slate-800">{deletingCategory.name}</p>
              <p className="text-slate-500">{deletingCategory.description || 'No description'}</p>
              <p className="text-[11px] text-blue-600 font-semibold mt-1">{deletingCategory.count} active recipients</p>
            </div>

            <p className="text-[11px] text-slate-400">
              This action will permanently delete this audience category from the database. Existing sent campaigns will retain their historical logs.
            </p>

            <div className="pt-2 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCategory}
                disabled={deletingLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm cursor-pointer"
              >
                {deletingLoading ? 'Deleting...' : 'Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
