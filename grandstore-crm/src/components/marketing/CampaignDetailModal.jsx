import React, { useState, useEffect } from 'react';
import { 
  X, Mail, RefreshCw, Send, TrendingUp, CheckCircle2, 
  ExternalLink, Calendar, Users, ShoppingBag, Tag, Eye, ArrowRight 
} from 'lucide-react';
import { crmApi } from '../../services/crmApi';
import { useToast } from '../../context/ToastContext';

export default function CampaignDetailModal({
  isOpen,
  onClose,
  campaignId,
  onCampaignUpdated
}) {
  const toast = useToast();
  const [campaign, setCampaign] = useState(null);
  const [productStats, setProductStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview' | 'preview' | 'orders'
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  useEffect(() => {
    if (isOpen && campaignId) {
      loadDetails();
    }
  }, [isOpen, campaignId]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const res = await crmApi.getCampaignDetails(campaignId);
      if (res.data && res.data.success) {
        setCampaign(res.data.campaign);
        setProductStats(res.data.productStats || []);
      }
    } catch (err) {
      console.error('Error loading campaign details:', err);
      toast.error('Failed to load campaign performance data');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncAttribution = async () => {
    try {
      setSyncing(true);
      toast.info('Scanning orders collection for attributed sales...');
      const res = await crmApi.syncCampaignAttribution(campaignId);
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Attributed sales synchronized!');
        setCampaign(res.data.campaign);
        await loadDetails();
        if (onCampaignUpdated) onCampaignUpdated();
      }
    } catch (err) {
      console.error('Error syncing attribution:', err);
      toast.error('Failed to sync sales attribution');
    } finally {
      setSyncing(false);
    }
  };

  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmailAddress.trim()) {
      toast.error('Please enter a recipient email address');
      return;
    }

    try {
      setSendingTest(true);
      const res = await crmApi.testSendCampaign(campaignId, testEmailAddress.trim());
      if (res.data && res.data.success) {
        toast.success(`Test email preview sent to ${testEmailAddress}! Check your inbox.`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to dispatch test email');
    } finally {
      setSendingTest(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-5xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-lg">
                {campaign?.name || 'Campaign Performance & Attribution'}
              </h3>
              {campaign && (
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  campaign.status === 'sent' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {campaign.status?.replace('_', ' ')}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Audience: <strong className="text-slate-700">{campaign?.audienceSegmentLabel || campaign?.audienceSegment}</strong> • Subject: "{campaign?.subject}"
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncAttribution}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
              title="Query MongoDB Orders to update attributed revenue"
            >
              <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync Attributed Sales'}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-2 border-b border-slate-100 text-xs font-bold">
          <button
            onClick={() => setActiveSubTab('overview')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'overview'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Performance Funnel & Bottles
          </button>
          <button
            onClick={() => setActiveSubTab('orders')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'orders'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Attributed Orders Log ({campaign?.attributedOrders?.length || 0})
          </button>
          <button
            onClick={() => setActiveSubTab('preview')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'preview'
                ? 'border-blue-600 text-blue-600 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Email Template & Test Send
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {loading ? (
            <div className="py-24 text-center text-slate-400 text-xs">
              <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
              Loading real attribution analytics...
            </div>
          ) : activeSubTab === 'overview' ? (
            <div className="space-y-4">
              {/* Funnel KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recipients</span>
                  <span className="text-base font-extrabold text-slate-900">{campaign?.recipientCount || 0}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Delivered</span>
                  <span className="text-base font-extrabold text-emerald-700">{campaign?.deliveryResults?.delivered || 0}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clicks</span>
                  <span className="text-base font-extrabold text-blue-600">{campaign?.clicks || 0}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attributed Orders</span>
                  <span className="text-base font-extrabold text-purple-700">{campaign?.attributedOrdersCount || campaign?.attributedOrders?.length || 0}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Attributed Sales (ZAR)</span>
                  <span className="text-lg font-black text-emerald-600">
                    R {(campaign?.attributedSalesZar || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Attached Voucher Badge */}
              {campaign?.attachedCoupon?.code && (
                <div className="bg-linear-to-r from-amber-50 to-amber-100/60 p-4 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-500/20 text-amber-900 rounded-lg">
                      <Tag size={18} />
                    </div>
                    <div>
                      <p className="font-extrabold text-amber-950">
                        Exclusive Attached Voucher: <span className="font-mono bg-amber-200 px-1.5 py-0.5 rounded">{campaign.attachedCoupon.code}</span>
                      </p>
                      <p className="text-amber-800 text-[11px] mt-0.5">
                        Discount: <strong>{campaign.attachedCoupon.discountType === 'percentage' ? `${campaign.attachedCoupon.discountValue}% OFF` : `R ${campaign.attachedCoupon.discountValue} OFF`}</strong> • Valid on featured Admin Products
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-amber-700 font-semibold shrink-0">
                    Expires: {campaign.attachedCoupon.expiryDate ? new Date(campaign.attachedCoupon.expiryDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              )}

              {/* Marketed Admin Bottles Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Marketed Bottles Performance ({campaign?.featuredProducts?.length || 0})
                  </h4>
                  <span className="text-[10px] text-slate-500">Live order matching</span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-2.5">Bottle Showcase</th>
                        <th className="px-4 py-2.5">Category</th>
                        <th className="px-4 py-2.5">Retail Price</th>
                        <th className="px-4 py-2.5">Units Sold Post-Campaign</th>
                        <th className="px-4 py-2.5 text-right">Attributed Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(campaign?.featuredProducts || []).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            No specific bottles were attached to this campaign.
                          </td>
                        </tr>
                      ) : (
                        productStats.map((prod) => (
                          <tr key={prod.productId} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 flex items-center gap-2.5">
                              {prod.image ? (
                                <img src={prod.image} alt={prod.name} className="w-7 h-9 object-contain rounded shrink-0" />
                              ) : (
                                <ShoppingBag size={18} className="text-slate-400" />
                              )}
                              <span className="font-bold text-slate-900 truncate max-w-xs">{prod.name}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-500">{prod.category}</td>
                            <td className="px-4 py-3 font-semibold text-slate-700">
                              R {Number(prod.price).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 font-extrabold text-blue-700">
                              {prod.unitsSold} units
                            </td>
                            <td className="px-4 py-3 text-right font-extrabold text-emerald-700">
                              R {(prod.revenue || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeSubTab === 'orders' ? (
            /* Attributed Orders Log */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  Customer orders matching campaign recipients, marketed bottles, or redeemed campaign vouchers.
                </p>
                <button
                  onClick={handleSyncAttribution}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Recalculate now
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2.5">Order / Invoice #</th>
                      <th className="px-4 py-2.5">Customer</th>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Purchased Bottles</th>
                      <th className="px-4 py-2.5">Voucher Used</th>
                      <th className="px-4 py-2.5 text-right">Order Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(campaign?.attributedOrders || []).length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          No customer orders placed yet within this campaign's attribution window.
                        </td>
                      </tr>
                    ) : (
                      campaign.attributedOrders.map((ord, idx) => (
                        <tr key={ord.orderId || idx} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">
                            {ord.orderId}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-slate-900">{ord.customerName}</p>
                            <p className="text-[10px] text-slate-400">{ord.customerEmail}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {ord.orderDate ? new Date(ord.orderDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {(ord.matchingProducts || []).join(', ') || 'Attributed Order'}
                          </td>
                          <td className="px-4 py-3">
                            {ord.couponUsed ? (
                              <span className="font-mono px-2 py-0.5 bg-amber-50 text-amber-800 rounded border border-amber-200 text-[10px] font-bold">
                                {ord.couponUsed}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-extrabold text-emerald-700">
                            R {(ord.amount || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Email Preview & Test Dispatch */
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <form onSubmit={handleSendTestEmail} className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="flex-1 w-full">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Send Live Test Email Preview to Your Inbox:
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. yourname@gmail.com"
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={sendingTest}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer shrink-0 mt-auto"
                  >
                    {sendingTest ? 'Sending...' : 'Send Test Preview'}
                  </button>
                </form>
              </div>

              {/* Template Brief */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-2 bg-white text-xs">
                <p className="font-bold text-slate-800">Email Subject Line:</p>
                <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-medium">
                  {campaign?.subject}
                </p>
                <p className="font-bold text-slate-800 pt-1">Campaign Brief Copy:</p>
                <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed whitespace-pre-wrap">
                  {campaign?.contentBrief || 'No specific body copy provided.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Created: {campaign?.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : 'N/A'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
