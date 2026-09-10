import Price from '../../components/ui/Price';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  TrendingUp, Package, DollarSign, Activity, AlertCircle, ShoppingBag, 
  Lightbulb, Calendar, Gavel, CreditCard, Clock, ShieldCheck, CheckCheck, 
  Bell, Check, RefreshCw, X, ExternalLink, ShieldAlert, AlertTriangle,
  Copy, Upload, Landmark, FileText, ArrowRight, CheckCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCartPrice } from '../../data';
import api from '../../api';

export default function VendorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [lots, setLots] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resubmitLotId, setResubmitLotId] = useState(null);
  const [resubmitDates, setResubmitDates] = useState({ startDate: '', endDate: '' });
  const [expandedLot, setExpandedLot] = useState(null);

  // Monthly Maintenance Fee & Notification State
  const [maintenanceFeeData, setMaintenanceFeeData] = useState(null);
  const [payingMaintenanceFee, setPayingMaintenanceFee] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('payfast'); // 'payfast' or 'eft'
  const [proofFile, setProofFile] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofError, setProofError] = useState('');
  const [proofSuccess, setProofSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [vendorNotifications, setVendorNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const fetchFeeAndNotifications = async () => {
    try {
      const feeRes = await api.get('/vendor/maintenance-fee');
      setMaintenanceFeeData(feeRes.data);
    } catch (e) { console.error('Maintenance fee fetch failed', e); }

    try {
      const notifRes = await api.get('/notifications?limit=6');
      setVendorNotifications(notifRes.data.notifications || []);
      setUnreadNotifCount(notifRes.data.unreadCount || 0);
    } catch (e) { console.error('Vendor notifications fetch failed', e); }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch Sales
        try {
          const salesRes = await api.get(`/orders/vendor/sales`);
          setSales(salesRes.data);
        } catch (e) { console.error('Sales fetch failed', e); }

        // Fetch Lots
        try {
          const lotsRes = await api.get(`/auction/vendor/lots`);
          setLots(lotsRes.data);
        } catch (e) { console.error('Lots fetch failed', e); }

        // Fetch Wallet
        try {
          const walletRes = await api.get(`/vendor/wallet`);
          setWallet(walletRes.data.wallet);
        } catch (e) { console.error('Wallet fetch failed', e); }

        // Fetch Maintenance Fee & Notifications
        await fetchFeeAndNotifications();
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  useEffect(() => {
    // Check if we just returned from PayFast
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success' && params.get('fee') === 'paid') {
      setPaymentSuccess(true);
      setShowPayModal(true);
      // Fast fallback to confirm payment in case ITN webhook is slightly delayed
      api.post('/payfast/confirm-order', { maintenanceFee: true }).catch(() => {});
      fetchFeeAndNotifications();
      window.history.replaceState({}, '', window.location.pathname);
      setTimeout(() => {
        setPaymentSuccess(false);
        setShowPayModal(false);
      }, 4000);
    } else if (params.get('payment') === 'cancelled') {
      alert("PayFast payment was cancelled. You can complete your maintenance fee payment at any time.");
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handlePayFastMaintenanceFee = async () => {
    setPayingMaintenanceFee(true);
    try {
      const { data } = await api.post('/payfast/generate-maintenance');

      if (!data || !data.url || !data.data) {
        throw new Error('Failed to generate PayFast checkout data.');
      }

      // Construct and submit a form dynamically to redirect to PayFast
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.url;

      for (const key in data.data) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = data.data[key];
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      console.error('PayFast payment generation failed', err);
      alert(err.response?.data?.message || err.message || 'Failed to initialize PayFast gateway.');
      setPayingMaintenanceFee(false);
    }
  };

  const handleUploadEftProof = async (e) => {
    if (e) e.preventDefault();
    if (!proofFile) {
      setProofError('Please choose a proof of payment document (.pdf, .jpg, .png).');
      return;
    }

    setUploadingProof(true);
    setProofError('');

    try {
      // 1. Upload proof file via /vendor/upload-public
      const formData = new FormData();
      formData.append('document', proofFile);
      const uploadRes = await api.post('/vendor/upload-public', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const proofUrl = uploadRes.data.url;

      // 2. Submit proof record
      const ref = maintenanceFeeData?.reference || `MNF-${user?._id?.substring(0, 8).toUpperCase() || 'REF'}`;
      await api.post('/vendor/maintenance-fee/submit-proof', {
        proofUrl,
        reference: ref,
        amount: maintenanceFeeData?.amount || 500
      });

      setProofSuccess(true);
      await fetchFeeAndNotifications();

      setTimeout(() => {
        setProofSuccess(false);
        setProofFile(null);
        setShowPayModal(false);
      }, 3500);
    } catch (err) {
      console.error('Failed to submit EFT proof', err);
      setProofError(err.response?.data?.message || 'Failed to submit proof of payment.');
    } finally {
      setUploadingProof(false);
    }
  };

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleMarkNotifRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await api.put(`/notifications/${id}/read`);
      setVendorNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadNotifCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification read', err);
    }
  };

  const handleMarkAllNotifsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setVendorNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadNotifCount(0);
    } catch (err) {
      console.error('Error marking all notifications read', err);
    }
  };

  const handleResubmit = async (lotId) => {
    try {
      const payload = {
        startDate: resubmitDates.startDate ? new Date(resubmitDates.startDate).toISOString() : new Date().toISOString(),
        endDate: resubmitDates.endDate ? new Date(resubmitDates.endDate).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString()
      };
      
      await api.put(`/auction/${lotId}/resubmit`, payload);
      
      setResubmitLotId(null);
      // Refresh lots
      const lotsRes = await api.get(`/auction/vendor/lots`);
      setLots(lotsRes.data);
    } catch (err) {
      console.error(err);
      alert("Error resubmitting lot.");
    }
  };

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.vendorTotal, 0);
  const totalOrders = sales.length;
  const unitsSold = sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
  const netPayout = wallet ? (wallet.availableBalance + wallet.pendingBalance) : 0;

  return (
    <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto pb-10 font-sans">
      
      {/* Overdue / Due Status Alert Banner */}
      {maintenanceFeeData && (maintenanceFeeData.status === 'due' || maintenanceFeeData.status === 'overdue') && (
        <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl ${
          maintenanceFeeData.status === 'overdue'
            ? 'bg-red-950/40 border-red-500/40 text-red-200'
            : 'bg-[#c9a35b]/10 border-[#c9a35b]/40 text-[#f5e6c8]'
        }`}>
          <div className="flex items-center gap-3.5">
            <div className={`p-2.5 rounded-xl shrink-0 ${
              maintenanceFeeData.status === 'overdue' ? 'bg-red-500/20 text-red-400' : 'bg-[#c9a35b]/20 text-[#e1bd70]'
            }`}>
              {maintenanceFeeData.status === 'overdue' ? <ShieldAlert size={22} /> : <AlertTriangle size={22} />}
            </div>
            <div>
              <div className="font-semibold text-sm sm:text-base">
                {maintenanceFeeData.status === 'overdue'
                  ? 'Urgent Action Required: Monthly Vendor Maintenance Fee Overdue'
                  : 'Notice: Monthly Vendor Maintenance Fee Due'}
              </div>
              <p className="text-xs opacity-80 mt-0.5">
                {maintenanceFeeData.status === 'overdue'
                  ? `Your monthly fee of R ${maintenanceFeeData.amount} is ${Math.abs(maintenanceFeeData.daysRemaining || 0)} days past due. Please settle now to ensure your storefront and product listings stay live.`
                  : `Your recurring monthly maintenance fee of R ${maintenanceFeeData.amount} is due in ${maintenanceFeeData.daysRemaining <= 0 ? 'today' : `${maintenanceFeeData.daysRemaining} days`}.`}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPayModal(true)}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shrink-0 ${
              maintenanceFeeData.status === 'overdue'
                ? 'bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/20'
                : 'bg-[#c9a35b] hover:bg-[#e1bd70] text-black shadow-lg shadow-[#c9a35b]/20'
            }`}
          >
            Pay R {maintenanceFeeData.amount} Now
          </button>
        </div>
      )}

      {/* Welcome & Store Health Section */}
      <section className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1">
          <h1 className="text-[var(--color-ivory)] font-serif text-[clamp(42px,5vw,64px)] font-medium tracking-[-0.035em] mb-4 leading-[1.02]">
            Welcome back, <br/>
            <span className="text-[#e1bd70]">{user?.name?.split(' ')[0] || 'Partner'}</span>
          </h1>
          <p className="text-[var(--color-ivory-muted)] text-lg max-w-2xl font-light leading-relaxed">
            Here is your daily business summary. You have {totalOrders > 0 ? totalOrders : 'no'} pending orders to fulfill and your store health is looking excellent.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={() => navigate('/vendor/event-add')}
              className="flex items-center gap-2 px-6 py-3 bg-[#11100d] border border-[#c9a35b]/30 hover:bg-[#c9a35b]/10 text-[#e1bd70] font-semibold rounded-lg transition-colors"
            >
              <Calendar size={20} /> Create Event
            </button>
            <button
              onClick={() => navigate('/vendor/product-add')}
              className="flex items-center gap-2 px-6 py-3 bg-[#11100d] border border-white/20 hover:bg-white/10 text-[var(--color-ivory)] font-semibold rounded-lg transition-colors"
            >
              <Package size={20} /> Add Product
            </button>
            <button
              onClick={() => navigate('/vendor/auction-submit')}
              className="flex items-center gap-2 px-6 py-3 bg-[#c9a35b] hover:bg-[#e1bd70] text-black font-semibold rounded-lg transition-colors"
            >
              <Package size={20} /> Add Auction Lot
            </button>
          </div>
        </div>

        {/* Gamified Store Health */}
        <div className="w-full lg:w-96 p-6 relative overflow-hidden bg-black/40 border border-white/10 rounded-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-gold)]/5 rounded-full blur-3xl"></div>
          <h3 className="text-[var(--color-ivory)] font-serif text-xl mb-4 flex items-center justify-between">
            Store Health 
            <span className="text-[#e1bd70] font-serif text-2xl">87%</span>
          </h3>
          
          <div className="w-full h-2 bg-black/50 rounded-full mb-6 overflow-hidden border border-white/5">
            <div className="h-full bg-[#c9a35b] w-[87%]"></div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm text-[var(--color-ivory-muted)]">
              <AlertCircle size={16} className="text-yellow-500 shrink-0 mt-0.5" />
              <span><strong className="text-[var(--color-ivory)]">Action required:</strong> Upload 3 more high-quality product photographs to reach 100%.</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-[var(--color-ivory-muted)]">
              <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
              <span>Banking & Compliance verified.</span>
            </div>
          </div>
          <Link to="/vendor/profile" className="mt-6 inline-block text-[10px] uppercase tracking-widest text-[#e1bd70] hover:text-white transition-colors font-bold">
            Improve My Store &rarr;
          </Link>
        </div>
      </section>

      {/* Monthly Maintenance Fee Overview Card */}
      <section className="bg-gradient-to-b from-[#12110e] to-[#0a0a09] border border-[#c9a35b]/30 rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-40 bg-[#c9a35b]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-[#c9a35b]/10 border border-[#c9a35b]/20 text-[#e1bd70] shrink-0 mt-1">
              <CreditCard size={26} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                <h3 className="text-xl font-serif text-[var(--color-ivory)] font-medium">Monthly Vendor Maintenance Fee</h3>
                {maintenanceFeeData?.status === 'awaiting_verification' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1.5">
                    <Clock size={12} className="text-blue-400" /> EFT Verification Pending
                  </span>
                ) : maintenanceFeeData?.status === 'overdue' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span> Overdue ({Math.abs(maintenanceFeeData.daysRemaining || 0)}d)
                  </span>
                ) : maintenanceFeeData?.status === 'due' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Payment Due ({maintenanceFeeData.daysRemaining || 0}d left)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span> Active & Covered
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--color-ivory-muted)] max-w-2xl font-light">
                {maintenanceFeeData?.status === 'awaiting_verification'
                  ? 'Your EFT proof of payment has been uploaded and is undergoing admin review. Store privileges remain active while our accounts team verifies your transfer.'
                  : 'Recurring monthly platform & marketplace maintenance fee configured by admin. Keeps your store storefront, catalog listings, and order fulfillment active.'}
              </p>
              {maintenanceFeeData?.proofOfPaymentUrl && (
                <div className="mt-2 text-xs text-[#e1bd70] flex items-center gap-2">
                  <FileText size={13} />
                  <a href={maintenanceFeeData.proofOfPaymentUrl} target="_blank" rel="noreferrer" className="underline hover:text-white transition-colors">
                    View Uploaded Proof of Payment
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 sm:gap-8 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-4 lg:pt-0 border-white/[0.08]">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] font-semibold mb-1">Monthly Rate</div>
              <div className="text-2xl font-serif text-[#e1bd70] font-medium">
                R {maintenanceFeeData?.amount || 500} <span className="text-xs text-[var(--color-ivory-muted)] font-sans">/ mo</span>
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] font-semibold mb-1">Next Billing Date</div>
              <div className="text-sm font-serif text-[var(--color-ivory)]">
                {maintenanceFeeData?.nextDueAt ? new Date(maintenanceFeeData.nextDueAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'In 30 Days'}
              </div>
              <div className="text-[11px] text-[var(--color-ivory-muted)]">
                {maintenanceFeeData?.status === 'awaiting_verification'
                  ? 'EFT Review in progress'
                  : maintenanceFeeData?.daysRemaining > 0 
                    ? `${maintenanceFeeData.daysRemaining} days remaining`
                    : maintenanceFeeData?.daysRemaining === 0 
                      ? 'Due today'
                      : `${Math.abs(maintenanceFeeData?.daysRemaining || 0)} days overdue`}
              </div>
            </div>

            <div className="flex items-center w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowPayModal(true)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#c9a35b] to-[#b58b38] hover:from-[#d8b467] hover:to-[#c9a35b] text-black font-bold text-xs uppercase tracking-widest shadow-lg shadow-[#c9a35b]/20 hover:shadow-[#c9a35b]/35 transition-all flex items-center justify-center gap-2.5 shrink-0 cursor-pointer"
              >
                <CreditCard size={16} />
                <span>Pay Maintenance Fee</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* KPI Cards (Sales Intelligence) */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Net Payout", value: <Price amount={netPayout} />, icon: DollarSign },
          { title: "Revenue", value: <Price amount={totalRevenue} />, icon: TrendingUp },
          { title: "Units Sold", value: unitsSold, icon: Package },
          { title: "Total Orders", value: totalOrders, icon: ShoppingBag },
        ].map((kpi, idx) => (
          <div key={idx} className="p-6 border-b border-white/10 group transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="text-[var(--color-ivory-muted)] text-[10px] uppercase tracking-widest font-semibold">{kpi.title}</div>
              <div className="p-2 rounded-lg bg-black/40 text-[#e1bd70] border border-white/[0.05]">
                <kpi.icon size={16} />
              </div>
            </div>
            <div className="text-3xl font-serif text-[var(--color-ivory)] mb-2 group-hover:text-[#e1bd70] transition-colors">{loading ? '...' : kpi.value}</div>
          </div>
        ))}
      </section>

      {/* Home Screen Recent Updates & Notifications */}
      <section className="bg-[#0b0b0a] border border-white/[0.08] rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-5 mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#c9a35b]/10 text-[#e1bd70] rounded-xl border border-[#c9a35b]/20">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="text-xl font-serif text-[var(--color-ivory)] font-medium flex items-center gap-2">
                Recent Updates & Notifications
                {unreadNotifCount > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#c9a35b]/20 text-[#e1bd70] border border-[#c9a35b]/30">
                    {unreadNotifCount} unread
                  </span>
                )}
              </h3>
              <p className="text-xs text-[var(--color-ivory-muted)]">Real-time alerts on your orders, fee schedules, customer bids, and platform updates</p>
            </div>
          </div>
          {unreadNotifCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllNotifsRead}
              className="text-xs text-[#e1bd70] hover:text-white uppercase tracking-wider font-semibold flex items-center gap-1.5 transition-colors"
            >
              <CheckCheck size={14} />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        {vendorNotifications.length === 0 ? (
          <div className="py-10 text-center text-[var(--color-ivory-muted)]">
            <Bell size={28} className="mx-auto mb-2 text-white/20" />
            <p className="text-sm">No new notifications at this time.</p>
            <p className="text-xs text-white/40 mt-1">Platform updates, order alerts, and fee notices will appear here automatically.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendorNotifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => {
                  if (!notif.isRead) handleMarkNotifRead(notif._id);
                  if (notif.link) navigate(notif.link);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  !notif.isRead 
                    ? 'bg-[#c9a35b]/[0.05] border-[#c9a35b]/30 hover:border-[#c9a35b]/60 shadow-[0_4px_20px_rgba(201,163,91,0.06)]' 
                    : 'bg-white/[0.02] border-white/[0.06] hover:border-white/20'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/[0.05] text-[var(--color-ivory-muted)]">
                      {notif.type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-white/40">
                      {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <h4 className={`text-sm mb-1 ${!notif.isRead ? 'text-white font-semibold' : 'text-white/80'}`}>
                    {notif.title}
                  </h4>
                  <p className="text-xs text-[var(--color-ivory-muted)] line-clamp-3 leading-relaxed">
                    {notif.message}
                  </p>
                </div>
                {notif.link && (
                  <div className="mt-3 pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-[#e1bd70]">
                    <span>View Details</span>
                    <ExternalLink size={12} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* AI Growth Recommendations & Top Products */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Growth Recommendations (Takes up 2 cols) */}
        <div className="lg:col-span-2 p-8 border-t border-white/10 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-[var(--color-gold)]/20 text-[#e1bd70] rounded-lg border border-[var(--color-gold)]/30">
              <Lightbulb size={20} />
            </div>
            <h3 className="text-2xl font-serif font-medium tracking-[-0.02em] text-[var(--color-ivory)]">Vendor Growth <span className="text-[#e1bd70]">Insights</span></h3>
          </div>
          
          <div className="space-y-4">
            <div className="border-b border-white/5 py-5">
              <p className="text-[var(--color-ivory)] font-medium mb-2">High Traffic, Low Conversion</p>
              <p className="text-[var(--color-ivory-muted)] text-sm leading-relaxed mb-4">
                Your <strong>2022 Stellenbosch Cabernet Sauvignon</strong> has received 42 views this week but only 3 purchases. Consider adding tasting notes and food pairing information to increase buyer confidence.
              </p>
              <div className="flex gap-4">
                <button className="text-[10px] uppercase tracking-widest font-bold text-[#e1bd70] hover:text-white transition-colors">Edit Product</button>
                <button className="text-[10px] uppercase tracking-widest font-bold text-[#e1bd70] hover:text-white transition-colors">Run 10% Promo</button>
              </div>
            </div>
            <div className="border-b border-white/5 py-5">
              <p className="text-[var(--color-ivory)] font-medium mb-2">Trending Category</p>
              <p className="text-[var(--color-ivory-muted)] text-sm leading-relaxed mb-4">
                MCC is selling 34% faster than your other sparkling wines across the platform. You have 0 MCC items in stock.
              </p>
              <button className="text-[10px] uppercase tracking-widest font-bold text-[#e1bd70] hover:text-white transition-colors">Add MCC Product</button>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="p-8 border-t border-white/10">
          <h3 className="text-xl font-serif text-[var(--color-ivory)] mb-6">Top Performers</h3>
          <div className="space-y-6">
            {[
              { name: "Cabernet Sauvignon", sold: 31, trend: "up" },
              { name: "Shiraz Reserve", sold: 19, trend: "up" },
              { name: "Chenin Blanc", sold: 12, trend: "down" },
            ].map((prod, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div>
                  <p className="text-[var(--color-ivory)] font-medium font-serif text-lg">{prod.name}</p>
                  <p className="text-xs text-[var(--color-ivory-muted)] tracking-widest uppercase">{prod.sold} units sold</p>
                </div>
                <div className={`p-2 rounded-full ${prod.trend === 'up' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  <Activity size={16} />
                </div>
              </div>
            ))}
          </div>
          <Link to="/vendor/products" className="block mt-8 text-center text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] hover:text-[#e1bd70] transition-colors">
            View All Products &rarr;
          </Link>
        </div>

      </section>

      {/* Recent Vendor Orders */}
      <section className="mt-2 border-t border-white/10 pt-8">
        <h3 className="text-2xl font-serif text-[var(--color-ivory)] mb-6 flex items-center gap-3">
          <div className="p-2 bg-[var(--color-gold)]/10 text-[#e1bd70] rounded-lg">
            <ShoppingBag size={20} />
          </div>
          Recent Sales
        </h3>
        
        {sales.length === 0 ? (
          <div className="text-center py-12 border border-white/5 rounded-2xl bg-white/[0.01]">
            <p className="text-[var(--color-ivory-muted)]">No sales recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white/[0.01] border border-white/5 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] bg-black/20">
                  <th className="py-4 font-semibold pl-6">Invoice</th>
                  <th className="py-4 font-semibold">Date</th>
                  <th className="py-4 font-semibold">Customer</th>
                  <th className="py-4 font-semibold">Purchased Items</th>
                  <th className="py-4 font-semibold text-right pr-6">Your Revenue</th>
                </tr>
              </thead>
              <tbody>
                {sales.slice(0, 10).map((sale) => (
                  <tr key={sale._id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="py-4 pl-6 font-bold text-xs text-[#e1bd70]">{sale.invoiceNumber || sale._id}</td>
                    <td className="py-4 text-xs text-[var(--color-ivory-muted)]">
                      {new Date(sale.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-4 text-sm text-[var(--color-ivory)] font-serif">{sale.user?.name || 'Guest'}</td>
                    <td className="py-4 text-xs text-[var(--color-ivory-muted)]">
                      {sale.items.map((item, i) => (
                        <div key={i} className="mb-1">
                          <span className="text-white">{item.quantity}x</span> {item.name}
                        </div>
                      ))}
                    </td>
                    <td className="py-4 pr-6 text-right text-sm font-bold text-[var(--color-ivory)] font-serif tracking-wide">
                      <Price amount={sale.vendorTotal} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Vendor Auction Lots */}
      <section className="mt-2 border-t border-white/10 pt-8">
        <h3 className="text-2xl font-serif text-[var(--color-ivory)] mb-6 flex items-center gap-3">
          <div className="p-2 bg-[var(--color-gold)]/10 text-[#e1bd70] rounded-lg">
            <Gavel size={20} />
          </div>
          My Auction Lots
        </h3>
        
        {lots.length === 0 ? (
          <div className="text-center py-12 border border-white/5 rounded-2xl bg-white/[0.01]">
            <p className="text-[var(--color-ivory-muted)]">No auction lots submitted yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white/[0.01] border border-white/5 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] bg-black/20">
                  <th className="py-4 font-semibold pl-6">Lot Title</th>
                  <th className="py-4 font-semibold">Status</th>
                  <th className="py-4 font-semibold">Start / End</th>
                  <th className="py-4 font-semibold">Current/Winning Bid</th>
                  <th className="py-4 font-semibold pr-6">Action</th>
                </tr>
              </thead>
              <tbody>
                {lots.map((lot) => (
                  <React.Fragment key={lot._id}>
                    <tr className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                      <td className="py-4 pl-6 font-serif text-sm text-[var(--color-ivory)]">
                        <Link to={`/auction/${lot._id}`} className="hover:text-[#e1bd70] transition-colors">
                          {lot.title}
                        </Link>
                      </td>
                      <td className="py-4 text-xs font-bold uppercase tracking-widest text-[var(--color-gold)]">
                        {lot.status.replace('_', ' ')}
                        {lot.status === 'sold' && (
                          <span className={`ml-2 px-1.5 py-0.5 rounded text-[8px] ${lot.paymentStatus === 'Paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {lot.paymentStatus || 'Pending'}
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-xs text-[var(--color-ivory-muted)]">
                        <div className="mb-1 text-white">Start: {new Date(lot.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                        <div>End: {new Date(lot.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="py-4 text-sm font-bold text-[var(--color-ivory)] font-serif">
                        <Price amount={(lot.winningBid || lot.currentBid || 0).toLocaleString('en-ZA')} />
                      </td>
                      <td className="py-4 pr-6 text-sm flex items-center gap-2">
                        {(lot.status === 'unsold' || lot.status === 'closed') && (
                          resubmitLotId === lot._id ? (
                            <div className="flex flex-col gap-2">
                              <input type="datetime-local" className="text-xs p-1 bg-black/50 border border-white/20 text-white rounded" onChange={e => setResubmitDates({...resubmitDates, startDate: e.target.value})} placeholder="Start Date" />
                              <input type="datetime-local" className="text-xs p-1 bg-black/50 border border-white/20 text-white rounded" onChange={e => setResubmitDates({...resubmitDates, endDate: e.target.value})} placeholder="End Date" />
                              <div className="flex gap-2">
                                <button onClick={() => handleResubmit(lot._id)} className="text-[10px] bg-[#c9a35b] hover:bg-[#e1bd70] text-black px-2 py-1 rounded font-bold uppercase tracking-widest transition-colors">Save</button>
                                <button onClick={() => setResubmitLotId(null)} className="text-[10px] border border-white/20 text-white px-2 py-1 rounded hover:bg-white/10 transition-colors uppercase tracking-widest">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <button onClick={() => setResubmitLotId(lot._id)} className="text-[10px] border border-[var(--color-gold)] text-[#e1bd70] hover:bg-[var(--color-gold)]/10 px-3 py-1.5 rounded uppercase tracking-widest font-bold transition-all">
                              Resubmit Lot
                            </button>
                          )
                        )}
                        {lot.status === 'sold' && (
                          <button 
                            onClick={() => setExpandedLot(expandedLot === lot._id ? null : lot._id)} 
                            className="text-[10px] border border-white/20 text-white hover:bg-white/10 px-3 py-1.5 rounded uppercase tracking-widest font-bold transition-all"
                          >
                            {expandedLot === lot._id ? 'Hide Details' : 'View Details'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {/* Expanded Row for Sold Lots */}
                    {expandedLot === lot._id && lot.status === 'sold' && (
                      <tr className="bg-white/[0.02]">
                        <td colSpan="5" className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                            <div className="bg-[#0a0a0a] p-5 rounded-xl border border-white/10">
                               <h4 className="text-[var(--color-gold)] font-bold tracking-widest uppercase text-[10px] mb-4">Financial Breakdown</h4>
                               <div className="space-y-2 font-mono text-[var(--color-ivory-muted)]">
                                  <div className="flex justify-between"><span>Winning Bid:</span> <span><Price amount={lot.winningBid?.toLocaleString('en-ZA')} /></span></div>
                                  <div className="flex justify-between"><span>Auction Commission ({(lot.commissionPct || 15)}%):</span> <span className="text-red-400">- <Price amount={lot.commissionAmount?.toLocaleString('en-ZA')} /></span></div>
                                  <div className="flex justify-between"><span>VAT Deducted:</span> <span className="text-red-400">- <Price amount={lot.vatAmount?.toLocaleString('en-ZA')} /></span></div>
                                  <div className="flex justify-between border-t border-white/10 pt-2 mt-2 text-white font-bold">
                                     <span>Your Net Payable:</span> 
                                     <span className="text-[var(--color-gold)]"><Price amount={lot.vendorPayable?.toLocaleString('en-ZA')} /></span>
                                  </div>
                               </div>
                            </div>
                            <div className="bg-[#0a0a0a] p-5 rounded-xl border border-white/10">
                               <h4 className="text-[var(--color-gold)] font-bold tracking-widest uppercase text-[10px] mb-4">Winner & Delivery Details</h4>
                               {lot.winner ? (
                                  <div className="mb-4">
                                    <p className="text-white">{lot.winner.name}</p>
                                    <p className="text-[var(--color-ivory-muted)]">{lot.winner.email}</p>
                                  </div>
                               ) : (
                                  <p className="text-[var(--color-ivory-muted)] mb-4">Winner info not available.</p>
                               )}
                               
                               <h5 className="text-[var(--color-ivory-muted)] text-[10px] tracking-widest uppercase font-bold mb-2">Shipping Address</h5>
                               {lot.paymentStatus === 'Paid' && lot.shippingAddress ? (
                                  <div className="text-[var(--color-ivory-muted)] text-xs">
                                     <p>{lot.shippingAddress.address}</p>
                                     <p>{lot.shippingAddress.city}, {lot.shippingAddress.postalCode}</p>
                                     <p>{lot.shippingAddress.country}</p>
                                  </div>
                               ) : (
                                  <p className="text-[var(--color-ivory-muted)] text-xs italic">
                                     {lot.paymentStatus === 'Paid' ? 'No shipping address provided.' : 'Waiting for buyer to complete checkout.'}
                                  </p>
                               )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Pay Maintenance Fee Modal with PayFast & Manual EFT */}
      {showPayModal && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget && !payingMaintenanceFee && !uploadingProof) {
              setShowPayModal(false);
            }
          }}
        >
          <div className="bg-[#0e0e0c] border border-[#c9a35b]/40 rounded-2xl w-full max-w-xl max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden shadow-[0_25px_90px_rgba(0,0,0,0.95)] relative animate-in fade-in zoom-in-95 duration-200">
            {/* Header - Sticky at top so Close cross button is ALWAYS visible */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-white/[0.08] bg-[#141310] shrink-0 sticky top-0 z-30">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-[#c9a35b]/10 text-[#e1bd70] border border-[#c9a35b]/20 shrink-0">
                  <CreditCard size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-serif text-white font-medium truncate">Settle Monthly Maintenance Fee</h3>
                  <p className="text-xs text-[var(--color-ivory-muted)] truncate">Choose PayFast Gateway or Manual Bank Transfer (EFT)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !payingMaintenanceFee && !uploadingProof && setShowPayModal(false)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 text-white/80 hover:text-white border border-white/10 hover:border-white/25 flex items-center justify-center transition-all cursor-pointer shrink-0 ml-3 group"
                title="Close modal"
                aria-label="Close modal"
                disabled={payingMaintenanceFee || uploadingProof}
              >
                <X size={18} className="group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 overscroll-contain">
              {paymentSuccess ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-400 border border-green-500/30 flex items-center justify-center mx-auto">
                    <Check size={32} />
                  </div>
                  <h4 className="text-xl font-serif text-white">Payment Confirmed!</h4>
                  <p className="text-sm text-[var(--color-ivory-muted)] max-w-sm mx-auto">
                    Your monthly maintenance fee of R {maintenanceFeeData?.amount || 500}.00 has been successfully processed. Store privileges and catalog listings are renewed for the next 30 days.
                  </p>
                </div>
              ) : proofSuccess ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-[#c9a35b]/10 text-[#e1bd70] border border-[#c9a35b]/30 flex items-center justify-center mx-auto">
                    <FileText size={32} />
                  </div>
                  <h4 className="text-xl font-serif text-white">EFT Proof Submitted!</h4>
                  <p className="text-sm text-[var(--color-ivory-muted)] max-w-sm mx-auto">
                    Your proof of payment has been uploaded to our finance team. Your store remains active while we verify the deposit.
                  </p>
                </div>
              ) : (
                <>
                  {/* Fee Summary Pill */}
                  <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-[var(--color-ivory-muted)]">
                      <span>Monthly Fee Amount:</span>
                      <span className="font-mono text-white text-base font-bold">R {maintenanceFeeData?.amount || 500}.00</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[var(--color-ivory-muted)]">
                      <span>Coverage Duration:</span>
                      <span className="text-[#e1bd70] font-medium">+30 Days Active Storefront</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-[var(--color-ivory-muted)] pt-2 border-t border-white/[0.06]">
                      <span>Next Due Date After Settlement:</span>
                      <span className="text-white font-mono">
                        {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  {/* Payment Method Split Tabs */}
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2 font-semibold">
                      Select Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('payfast')}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          paymentMethod === 'payfast'
                            ? 'bg-[#c9a35b]/15 border-[#c9a35b] text-[#e1bd70] shadow-[0_0_20px_rgba(201,163,91,0.15)] ring-1 ring-[#c9a35b]/50'
                            : 'bg-black/40 border-white/10 text-[var(--color-ivory-muted)] hover:border-white/25'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs sm:text-sm text-white">PayFast Gateway</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-bold uppercase tracking-wider">Instant</span>
                        </div>
                        <div className="text-[11px] text-white/50">Cards & Instant EFT (Instant settlement)</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('eft')}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          paymentMethod === 'eft'
                            ? 'bg-[#c9a35b]/15 border-[#c9a35b] text-[#e1bd70] shadow-[0_0_20px_rgba(201,163,91,0.15)] ring-1 ring-[#c9a35b]/50'
                            : 'bg-black/40 border-white/10 text-[var(--color-ivory-muted)] hover:border-white/25'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs sm:text-sm text-white">Bank Transfer / EFT</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-bold uppercase tracking-wider">Manual</span>
                        </div>
                        <div className="text-[11px] text-white/50">Direct bank deposit & proof upload</div>
                      </button>
                    </div>
                  </div>

                  {/* TAB 1: PayFast */}
                  {paymentMethod === 'payfast' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-[#c9a35b]/10 text-[#e1bd70]">
                            <CreditCard size={18} />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-white">Automated PayFast Checkout</h4>
                            <p className="text-xs text-white/50">Supports Visa, Mastercard, and Instant EFT (Capitec, FNB, ABSA, Standard Bank, Nedbank)</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-white/60 pt-2 border-t border-white/[0.06]">
                          <ShieldCheck size={16} className="text-[#e1bd70] shrink-0" />
                          <span>Immediate automated activation with PCI-DSS 256-bit bank-grade security.</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowPayModal(false)}
                          disabled={payingMaintenanceFee}
                          className="flex-1 py-3.5 px-4 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/[0.04] text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handlePayFastMaintenanceFee}
                          disabled={payingMaintenanceFee}
                          className="flex-[2] py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#c9a35b] to-[#b58b38] hover:from-[#d8b467] hover:to-[#c9a35b] text-black text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-[#c9a35b]/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                          {payingMaintenanceFee ? (
                            <>
                              <RefreshCw size={15} className="animate-spin" />
                              <span>Connecting to PayFast...</span>
                            </>
                          ) : (
                            <>
                              <span>Pay R {maintenanceFeeData?.amount || 500} via PayFast</span>
                              <ArrowRight size={14} />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Manual EFT / Bank Details & Proof Upload */}
                  {paymentMethod === 'eft' && (
                    <div className="space-y-4">
                      {/* Bank Details Card */}
                      <div className="bg-[#11100e] border border-[#c9a35b]/30 p-4 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
                          <div className="flex items-center gap-2">
                            <Landmark size={15} className="text-[#e1bd70]" />
                            <span className="text-xs font-bold uppercase tracking-wider text-[#e1bd70]">Official Bank Account</span>
                          </div>
                          <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono">South Africa</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-black/40 p-2.5 rounded-lg border border-white/[0.04]">
                            <div className="text-[10px] text-white/40 uppercase">Bank</div>
                            <div className="font-semibold text-white mt-0.5">{maintenanceFeeData?.bankDetails?.bankName || 'First National Bank (FNB)'}</div>
                          </div>

                          <div className="bg-black/40 p-2.5 rounded-lg border border-white/[0.04]">
                            <div className="text-[10px] text-white/40 uppercase">Account Name</div>
                            <div className="font-semibold text-white mt-0.5">{maintenanceFeeData?.bankDetails?.accountName || 'The Grand Store (Pty) Ltd'}</div>
                          </div>

                          <div className="bg-black/40 p-2.5 rounded-lg border border-white/[0.04] flex items-center justify-between">
                            <div>
                              <div className="text-[10px] text-white/40 uppercase">Account Number</div>
                              <div className="font-mono text-white font-bold mt-0.5">{maintenanceFeeData?.bankDetails?.accountNumber || '62800000000'}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(maintenanceFeeData?.bankDetails?.accountNumber || '62800000000', 'acc')}
                              className="text-[#e1bd70] hover:text-white p-1 transition-colors cursor-pointer"
                              title="Copy Account Number"
                            >
                              {copiedField === 'acc' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                            </button>
                          </div>

                          <div className="bg-black/40 p-2.5 rounded-lg border border-white/[0.04] flex items-center justify-between">
                            <div>
                              <div className="text-[10px] text-white/40 uppercase">Branch Code</div>
                              <div className="font-mono text-white font-bold mt-0.5">{maintenanceFeeData?.bankDetails?.branchCode || '250655'}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopy(maintenanceFeeData?.bankDetails?.branchCode || '250655', 'branch')}
                              className="text-[#e1bd70] hover:text-white p-1 transition-colors cursor-pointer"
                              title="Copy Branch Code"
                            >
                              {copiedField === 'branch' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                            </button>
                          </div>
                        </div>

                        {/* Reference Pill */}
                        <div className="bg-[#c9a35b]/10 border border-[#c9a35b]/40 p-3 rounded-lg flex items-center justify-between">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-[#e1bd70]">Payment Reference (Required)</div>
                            <div className="font-mono font-bold text-white text-sm mt-0.5">
                              {maintenanceFeeData?.reference || `MNF-${user?._id?.substring(0, 8).toUpperCase() || 'REF'}`}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopy(maintenanceFeeData?.reference || `MNF-${user?._id?.substring(0, 8).toUpperCase() || 'REF'}`, 'ref')}
                            className="px-2.5 py-1 rounded bg-[#c9a35b]/20 hover:bg-[#c9a35b]/30 text-[#e1bd70] text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            {copiedField === 'ref' ? (
                              <>
                                <Check size={12} className="text-green-400" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy size={12} />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Proof of Payment Upload Form */}
                      <form onSubmit={handleUploadEftProof} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-white flex items-center gap-2">
                            <Upload size={14} className="text-[#e1bd70]" />
                            <span>Upload Proof of Payment</span>
                          </label>
                          <span className="text-[10px] text-white/40">PDF, JPG, or PNG (Max 10MB)</span>
                        </div>

                        <div className="relative border-2 border-dashed border-white/15 hover:border-[#c9a35b]/50 rounded-xl p-4 text-center transition-colors cursor-pointer bg-black/30">
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.pdf"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                setProofFile(e.target.files[0]);
                                setProofError('');
                              }
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          {proofFile ? (
                            <div className="flex items-center justify-center gap-2 text-xs text-[#e1bd70]">
                              <FileText size={16} />
                              <span className="font-medium truncate max-w-xs">{proofFile.name}</span>
                              <span className="text-white/40">({(proofFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                            </div>
                          ) : (
                            <div className="text-xs text-white/50">
                              <span className="text-[#e1bd70] font-semibold">Click to browse</span> or drop your bank payment receipt here
                            </div>
                          )}
                        </div>

                        {proofError && (
                          <div className="text-red-400 text-xs flex items-center gap-1.5">
                            <AlertCircle size={14} />
                            <span>{proofError}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowPayModal(false)}
                            disabled={uploadingProof}
                            className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/[0.04] text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={uploadingProof || !proofFile}
                            className="flex-[2] py-3 px-4 rounded-xl bg-[#c9a35b] hover:bg-[#e1bd70] text-black text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-[#c9a35b]/20 flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                          >
                            {uploadingProof ? (
                              <>
                                <RefreshCw size={14} className="animate-spin" />
                                <span>Uploading Receipt...</span>
                              </>
                            ) : (
                              <>
                                <Upload size={14} />
                                <span>Submit Proof of Payment</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

const CheckCircle2 = ({ className, size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);
