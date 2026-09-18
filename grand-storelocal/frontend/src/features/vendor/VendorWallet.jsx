import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import { 
  Wallet, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, History, 
  Landmark, AlertCircle, Loader2, X, Plus, ExternalLink, Calendar,
  Filter, Search, Check, ShieldCheck, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function VendorWallet() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [walletData, setWalletData] = useState(null);
  const [bankingInfo, setBankingInfo] = useState(null);
  const [orders, setOrders] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Active sub-tab: 'sales' | 'payouts'
  const [activeTab, setActiveTab] = useState('payouts');

  // Payout Modal State
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [noBankModalOpen, setNoBankModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [payoutError, setPayoutError] = useState('');

  // Payout History Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);
  };

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vendor/wallet');
      setWalletData(res.data.wallet);
      setBankingInfo(res.data.bankingInfo);
      setOrders(res.data.orders || []);
      setPayouts(res.data.payouts || []);
    } catch (err) {
      setError('Failed to load wallet data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  // Handle auto-open payout modal if URL has ?requestPayout=true
  useEffect(() => {
    if (!loading && searchParams.get('requestPayout') === 'true') {
      handleOpenPayoutModal();
      // Clean query param
      searchParams.delete('requestPayout');
      setSearchParams(searchParams, { replace: true });
    }
  }, [loading, searchParams, bankingInfo]);

  const handleOpenPayoutModal = () => {
    if (!bankingInfo || !bankingInfo.accountNumber) {
      setNoBankModalOpen(true);
      return;
    }
    setPayoutError('');
    setPayoutAmount('');
    setPayoutNotes('');
    setPayoutModalOpen(true);
  };

  const handleMaxAmount = () => {
    if (walletData?.availableBalance > 0) {
      setPayoutAmount(String(walletData.availableBalance));
    }
  };

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    setPayoutError('');

    const amount = Number(payoutAmount);
    if (!amount || isNaN(amount) || amount <= 0) {
      setPayoutError('Please enter a valid withdrawal amount.');
      return;
    }
    if (amount < 50) {
      setPayoutError('Minimum withdrawal request is R 50.00.');
      return;
    }
    if (amount > (walletData?.availableBalance || 0)) {
      setPayoutError(`Amount exceeds available balance of ${formatMoney(walletData?.availableBalance)}.`);
      return;
    }

    setSubmittingPayout(true);
    try {
      const res = await api.post('/vendor/wallet/payout-request', {
        amount,
        notes: payoutNotes
      });

      setSuccessMessage(res.data.message || 'Payout request submitted successfully!');
      setPayoutModalOpen(false);

      // Refresh wallet & transactions
      if (res.data.wallet) {
        setWalletData(res.data.wallet);
      }
      if (res.data.transaction) {
        setPayouts(prev => [res.data.transaction, ...prev]);
      }
      setActiveTab('payouts');

      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Payout request error:', err);
      setPayoutError(err.response?.data?.message || 'Failed to submit payout request. Please try again.');
    } finally {
      setSubmittingPayout(false);
    }
  };

  // Filtered Payouts
  const filteredPayouts = payouts.filter(payout => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'cleared' && !(payout.status === 'cleared' || payout.status === 'paid')) return false;
      if (statusFilter !== 'cleared' && payout.status !== statusFilter) return false;
    }
    if (startDate) {
      const start = new Date(startDate);
      if (new Date(payout.createdAt) < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (new Date(payout.createdAt) > end) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchRef = payout.gsReference?.toLowerCase().includes(q);
      const matchBank = payout.payoutDetails?.bankName?.toLowerCase().includes(q);
      const matchAdminRef = payout.payoutDetails?.adminReference?.toLowerCase().includes(q);
      if (!matchRef && !matchBank && !matchAdminRef) return false;
    }
    return true;
  });

  if (loading) return <div className="text-white p-8 text-center animate-pulse">Loading wallet securely...</div>;
  if (error) return <div className="text-red-500 p-8">{error}</div>;

  const hasBankDetails = Boolean(bankingInfo && bankingInfo.accountNumber);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif text-white flex items-center gap-3">
            <Wallet size={28} className="text-[#b58b38]" /> Vendor Wallet
          </h2>
          <p className="text-gray-400 text-sm mt-1">Manage your earnings, request payouts to your bank account, and track redeemed money history.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/vendor/banking"
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2.5 rounded-sm font-semibold text-xs tracking-wider uppercase transition-colors flex items-center gap-2"
          >
            <Landmark size={15} className="text-[#b58b38]" />
            Bank Details
          </Link>
          <button 
            onClick={handleOpenPayoutModal}
            className="bg-[#b58b38] hover:bg-[#c9a35b] text-black px-6 py-2.5 rounded-sm font-bold text-xs tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(181,139,56,0.25)] flex items-center gap-2 cursor-pointer"
          >
            <Wallet size={16} />
            REQUEST PAYOUT
          </button>
        </div>
      </div>

      {/* SUCCESS MESSAGE */}
      {successMessage && (
        <div className="p-4 rounded-sm bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* BALANCE METRICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Available Balance */}
        <div className="bg-[#111] border border-[#b58b38]/40 rounded-sm p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle2 size={64} className="text-[#b58b38]" />
          </div>
          <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-1">Available Balance</p>
          <p className="text-3xl font-serif text-[#e6c97a]">{formatMoney(walletData?.availableBalance)}</p>
          <p className="text-[#888] text-xs mt-2">Cleared &amp; ready for withdrawal</p>
        </div>

        {/* Queued / Pending Payout Requests */}
        <div className="bg-[#111] border border-amber-500/30 rounded-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Clock size={64} className="text-amber-400" />
          </div>
          <p className="text-amber-400/80 text-xs font-bold tracking-widest uppercase mb-1">Pending Payouts</p>
          <p className="text-3xl font-serif text-white">{formatMoney(walletData?.pendingWithdrawalAmount || 0)}</p>
          <p className="text-[#888] text-xs mt-2">Withdrawals awaiting EFT clearance</p>
        </div>

        {/* Total Redeemed / Withdrawn */}
        <div className="bg-[#111] border border-white/10 rounded-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <ArrowUpRight size={64} className="text-green-500" />
          </div>
          <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-1">Total Redeemed</p>
          <p className="text-3xl font-serif text-white">{formatMoney(walletData?.totalWithdrawn)}</p>
          <p className="text-[#888] text-xs mt-2">Total funds paid out to your bank</p>
        </div>

        {/* Lifetime Earned */}
        <div className="bg-[#111] border border-white/10 rounded-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <History size={64} className="text-white" />
          </div>
          <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-1">Lifetime Earned</p>
          <p className="text-3xl font-serif text-white">{formatMoney(walletData?.totalEarned)}</p>
          <p className="text-[#888] text-xs mt-2">Total marketplace sales revenue</p>
        </div>

      </div>

      {/* LINKED BANK ACCOUNT DESTINATION CARD */}
      <div className="bg-[#111] border border-white/10 rounded-sm p-5 relative overflow-hidden">
        {hasBankDetails ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#b58b38]/15 border border-[#b58b38]/30 flex items-center justify-center text-[#e6c97a] shrink-0">
                <Landmark size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-mono tracking-wider text-white/40">Payout Bank Account</span>
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    <Check size={10} /> Active
                  </span>
                </div>
                <h4 className="text-lg font-serif text-white font-medium mt-0.5">
                  {bankingInfo.bankName} <span className="font-mono text-sm text-[#e6c97a]">•••• {String(bankingInfo.accountNumber).slice(-4)}</span>
                </h4>
                <p className="text-xs text-white/50">
                  Holder: <strong className="text-white/80">{bankingInfo.accountName}</strong> | Branch: <span className="font-mono">{bankingInfo.branchCode}</span> ({bankingInfo.accountType || 'Cheque / Current'})
                </p>
              </div>
            </div>

            <Link
              to="/vendor/banking"
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded text-xs uppercase tracking-wider font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-center"
            >
              Manage Bank Details <ChevronRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2 bg-amber-500/[0.04]">
            <div className="flex items-center gap-3">
              <AlertCircle size={24} className="text-amber-400 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-amber-300">No Settlement Bank Account Linked</h4>
                <p className="text-xs text-white/60 mt-0.5">
                  You must link a South African bank account before you can request payouts or receive scheduled automatic disbursements.
                </p>
              </div>
            </div>
            <Link
              to="/vendor/banking"
              className="px-5 py-2.5 bg-[#b58b38] hover:bg-[#c9a35b] text-black font-bold text-xs uppercase tracking-wider rounded transition-colors whitespace-nowrap self-start sm:self-center cursor-pointer"
            >
              Add Bank Account
            </Link>
          </div>
        )}
      </div>

      {/* NAVIGATION TABS: REDEEMED PAYOUT HISTORY vs SALES BREAKDOWN */}
      <div className="bg-[#111] border border-white/10 rounded-sm overflow-hidden mt-8">
        
        {/* Tab Headers */}
        <div className="px-6 py-3 border-b border-white/10 bg-black/40 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('payouts')}
              className={`px-4 py-2 rounded-sm text-xs uppercase tracking-widest font-bold transition-all flex items-center gap-2 ${
                activeTab === 'payouts'
                  ? 'bg-[#b58b38] text-black shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <History size={14} /> Redeemed Money History ({payouts.length})
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-4 py-2 rounded-sm text-xs uppercase tracking-widest font-bold transition-all flex items-center gap-2 ${
                activeTab === 'sales'
                  ? 'bg-[#b58b38] text-black shadow-md'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <History size={14} /> Order Sales Breakdown ({orders.length})
            </button>
          </div>

          <span className="text-xs text-[#888] uppercase tracking-widest hidden sm:inline-block">
            {activeTab === 'payouts' ? 'Payout & Redemption Audit' : 'Gross to Net Calculations'}
          </span>
        </div>

        {/* TAB 1: REDEEMED MONEY HISTORY */}
        {activeTab === 'payouts' && (
          <div className="p-6 space-y-6">
            
            {/* Filters Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-black/40 p-4 border border-white/5 rounded-sm">
              
              {/* Search Reference */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 font-semibold">Search Reference / Bank</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. GS-26-VND-POUT..."
                    className="w-full bg-[#161616] border border-white/10 text-white text-xs px-3 py-2 rounded outline-none focus:border-[#b58b38]"
                  />
                  <Search size={14} className="absolute right-3 top-2.5 text-white/30" />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 font-semibold">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 text-white text-xs px-3 py-2 rounded outline-none focus:border-[#b58b38]"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending Review</option>
                  <option value="delayed">Processing Delayed</option>
                  <option value="cleared">Disbursed &amp; Cleared</option>
                  <option value="failed">Declined / Failed</option>
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 font-semibold">From Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 text-white text-xs px-3 py-2 rounded outline-none focus:border-[#b58b38]"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-white/40 mb-1 font-semibold">To Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-[#161616] border border-white/10 text-white text-xs px-3 py-2 rounded outline-none focus:border-[#b58b38]"
                />
              </div>

            </div>

            {/* Payouts Table */}
            {filteredPayouts.length === 0 ? (
              <div className="p-12 text-center text-[#666]">
                <History size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-white/60 font-medium">No payout redemption history found matching your filters.</p>
                <p className="text-xs text-white/30 mt-1">When you request a withdrawal or a scheduled payout is cleared, details will appear here.</p>
                {payouts.length === 0 && (
                  <button
                    onClick={handleOpenPayoutModal}
                    className="mt-4 px-4 py-2 bg-[#b58b38] hover:bg-[#c9a35b] text-black font-bold text-xs uppercase tracking-wider rounded transition-colors"
                  >
                    Request First Payout
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-black/60 text-[#888] text-[10px] uppercase tracking-wider">
                      <th className="p-4 font-medium">Request Date &amp; Time</th>
                      <th className="p-4 font-medium">Reference</th>
                      <th className="p-4 font-medium">Destination Bank</th>
                      <th className="p-4 font-medium">Account Details</th>
                      <th className="p-4 font-medium text-right">Amount</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Settlement Date / Ref</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-300">
                    {filteredPayouts.map(payout => {
                      const dt = new Date(payout.createdAt);
                      const clearedDt = payout.payoutDetails?.clearedAt ? new Date(payout.payoutDetails.clearedAt) : null;
                      const isCleared = payout.status === 'cleared' || payout.status === 'paid';
                      const isDelayed = payout.status === 'delayed';
                      const isFailed = payout.status === 'failed';
                      const customMessage = payout.payoutDetails?.customMessage;

                      return (
                        <tr key={payout._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-4 text-xs">
                            <span className="block font-medium text-white">
                              {dt.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-[10px] text-white/40">
                              {dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-xs text-[#b58b38]">{payout.gsReference}</td>
                          <td className="p-4 text-xs font-medium text-white">{payout.payoutDetails?.bankName || 'Standard Bank'}</td>
                          <td className="p-4 text-xs font-mono text-white/70">
                            •••• {String(payout.payoutDetails?.accountNumber || '').slice(-4)}
                            <span className="block text-[10px] font-sans text-white/40">{payout.payoutDetails?.accountName || 'Holder on record'}</span>
                          </td>
                          <td className="p-4 text-right font-bold text-[#e6c97a]">{formatMoney(payout.amount)}</td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isCleared ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400' :
                              isDelayed ? 'bg-orange-500/15 border border-orange-500/30 text-orange-400' :
                              isFailed ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400' :
                              'bg-amber-500/15 border border-amber-500/30 text-amber-300'
                            }`}>
                              {isCleared ? 'Disbursed & Cleared' : isDelayed ? 'Processing Delayed' : isFailed ? 'Declined' : 'Pending Review'}
                            </span>
                            {customMessage && (
                              <div className="mt-1.5 px-2.5 py-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] max-w-xs whitespace-normal">
                                <span className="font-semibold block text-[9px] uppercase tracking-wider text-amber-400/80">Admin Note:</span>
                                "{customMessage}"
                              </div>
                            )}
                            {isFailed && payout.payoutDetails?.rejectionReason && (
                              <span className="block text-[10px] text-rose-400/80 mt-1 max-w-[200px] truncate" title={payout.payoutDetails.rejectionReason}>
                                {payout.payoutDetails.rejectionReason}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-xs">
                            {isCleared && clearedDt ? (
                              <div>
                                <span className="block text-emerald-400 font-mono text-[11px]">
                                  {payout.payoutDetails?.adminReference || 'EFT Cleared'}
                                </span>
                                <span className="text-[10px] text-white/40">
                                  {clearedDt.toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </span>
                              </div>
                            ) : isDelayed ? (
                              <span className="text-[11px] text-orange-400/80 italic">Disbursement delayed</span>
                            ) : (
                              <span className="text-[11px] text-white/30 italic">Awaiting disbursement</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: SALES BREAKDOWN */}
        {activeTab === 'sales' && (
          <div>
            {orders.length === 0 ? (
              <div className="p-12 text-center text-[#666]">
                <History size={48} className="mx-auto mb-4 opacity-20" />
                <p>No sales data available yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-black/60 text-[#888] text-[10px] uppercase tracking-wider">
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Order Ref</th>
                      <th className="p-4 font-medium text-right">Products (Gross)</th>
                      <th className="p-4 font-medium text-right text-yellow-500">VAT Deducted</th>
                      <th className="p-4 font-medium text-right text-red-400">GS Commission</th>
                      <th className="p-4 font-medium text-right">Shipping Reimbursed</th>
                      <th className="p-4 font-medium text-right font-bold text-green-400">Net Payout</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-gray-300">
                    {orders.map(order => {
                      const payable = order.vendorPayables?.find(p => p.vendorId === user._id);
                      if (!payable) return null;

                      const gross = payable.grossAmount || 0;
                      const vat = payable.vatDeducted || 0;
                      const comm = payable.commission || 0;
                      const net = payable.netPayable || 0;
                      
                      const shippingReimbursed = net - (gross - vat - comm);

                      return (
                        <tr key={order._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-4 text-xs">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="p-4 font-mono text-xs text-[#b58b38]">{order.orderId}</td>
                          <td className="p-4 text-right">{formatMoney(gross)}</td>
                          <td className="p-4 text-right text-yellow-500/80">-{formatMoney(vat)}</td>
                          <td className="p-4 text-right text-red-400/80">-{formatMoney(comm)}</td>
                          <td className="p-4 text-right text-white">+{formatMoney(shippingReimbursed > 0 ? shippingReimbursed : 0)}</td>
                          <td className="p-4 text-right font-bold text-green-400">{formatMoney(net)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>

      {/* REQUEST PAYOUT MODAL */}
      {payoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12110e] border border-[#b58b38]/50 rounded-2xl max-w-lg w-full p-6 sm:p-8 relative shadow-2xl animate-scaleUp">
            <button
              onClick={() => setPayoutModalOpen(false)}
              className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl bg-[#b58b38]/15 border border-[#b58b38]/30 flex items-center justify-center text-[#e6c97a]">
                <Wallet size={24} />
              </div>
              <div>
                <h3 className="text-xl font-serif text-white font-medium">Request Payout</h3>
                <span className="text-xs text-white/50">Electronic Funds Transfer (EFT) Withdrawal</span>
              </div>
            </div>

            {payoutError && (
              <div className="p-3 mb-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{payoutError}</span>
              </div>
            )}

            <form onSubmit={handlePayoutSubmit} className="space-y-5">
              
              {/* Destination Bank Account Snapshot */}
              <div className="p-4 rounded-xl bg-black/60 border border-white/10">
                <span className="text-[10px] uppercase font-mono tracking-wider text-white/40 block mb-1">Destination Bank Account</span>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-white block">{bankingInfo?.bankName}</span>
                    <span className="text-xs font-mono text-[#e6c97a]">•••• {String(bankingInfo?.accountNumber).slice(-4)}</span>
                    <span className="text-xs text-white/40 block">Holder: {bankingInfo?.accountName}</span>
                  </div>
                  <Link
                    to="/vendor/banking"
                    className="text-xs text-[#b58b38] hover:underline"
                  >
                    Change
                  </Link>
                </div>
              </div>

              {/* Available Balance Preview */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 text-xs">
                <span className="text-white/60 uppercase tracking-wider">Available for Withdrawal:</span>
                <strong className="text-sm font-serif text-[#e6c97a]">{formatMoney(walletData?.availableBalance)}</strong>
              </div>

              {/* Payout Amount */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs uppercase tracking-wider text-white/60 font-semibold">
                    Withdrawal Amount (ZAR) <span className="text-[#b58b38]">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleMaxAmount}
                    className="text-xs text-[#b58b38] hover:underline font-semibold cursor-pointer"
                  >
                    Withdraw All
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-white/40 font-mono text-sm">R</span>
                  <input
                    type="number"
                    step="0.01"
                    min="50"
                    max={walletData?.availableBalance || 0}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-[#181714] border border-white/15 focus:border-[#b58b38] text-white font-mono text-lg pl-8 pr-4 py-2.5 rounded-xl outline-none transition-colors"
                    required
                  />
                </div>
                <span className="text-[11px] text-white/40 mt-1 block">Minimum payout is R 50.00.</span>
              </div>

              {/* Optional Reference / Notes */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/60 mb-1.5 font-semibold">
                  Reference Note (Optional)
                </label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="e.g. Month-end batch payout"
                  className="w-full bg-[#181714] border border-white/15 focus:border-[#b58b38] text-white text-xs px-3.5 py-2.5 rounded-xl outline-none transition-colors"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setPayoutModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-white/15 text-white text-xs uppercase tracking-wider font-semibold hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayout || !payoutAmount || Number(payoutAmount) <= 0}
                  className="px-7 py-2.5 rounded-xl bg-[#b58b38] hover:bg-[#c9a35b] text-black text-xs uppercase tracking-wider font-bold transition-all shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {submittingPayout ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {submittingPayout ? "Submitting..." : "Confirm & Request Payout"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* NO BANK ACCOUNT WARNING MODAL */}
      {noBankModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12110e] border border-amber-500/50 rounded-2xl max-w-md w-full p-6 sm:p-8 text-center shadow-2xl animate-scaleUp">
            <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-4">
              <Landmark size={32} />
            </div>
            <h3 className="text-xl font-serif text-white font-medium mb-2">Bank Details Required</h3>
            <p className="text-xs text-white/60 mb-6 leading-relaxed">
              To request a payout, you must first register your South African bank account for electronic funds transfer (EFT) settlements.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setNoBankModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-white/15 text-white text-xs uppercase tracking-wider font-semibold hover:bg-white/5"
              >
                Close
              </button>
              <Link
                to="/vendor/banking"
                className="px-6 py-2.5 rounded-xl bg-[#b58b38] hover:bg-[#c9a35b] text-black text-xs uppercase tracking-wider font-bold transition-all"
              >
                Add Bank Account Now
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
