import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Gavel, CheckCircle2, ShieldAlert, BookOpen, AlertTriangle, ShieldCheck, Check, Clock, RefreshCw, UserCheck, UserX, Ban, CreditCard, ExternalLink, Shield, Eye, Play, Video, Film, Image as ImageIcon, X, Award, Globe, FileText } from 'lucide-react';
import Price from '../../components/ui/Price';

const toDatetimeLocal = (date) => {
  const d = new Date(date);
  const pad = (number) => number.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const getEmbedVideoUrl = (url) => {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/i);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/i);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  return null;
};

export default function AdminAuctionPanel({ onNotify }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lots, setLots] = useState([]);
  const [allLots, setAllLots] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [settings, setSettings] = useState(null);
  const [bidders, setBidders] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [bidderFilter, setBidderFilter] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [limitInputs, setLimitInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'bidders' | 'fraud' | 'ledger' | 'history'
  const [expandedLot, setExpandedLot] = useState(null);
  const [previewMediaModal, setPreviewMediaModal] = useState(null);
  
  // Quick form state per lot
  const [approvalForms, setApprovalForms] = useState({});
  const [authForms, setAuthForms] = useState({});

  useEffect(() => {
    api.get('/settings/public').then(res => setSettings(res.data)).catch(() => {});
    fetchLots();
    fetchBidders();
    if (activeTab === 'bidders') { fetchBidders(); fetchDeposits(); }
    if (activeTab === 'fraud') fetchFraudAlerts();
    if (activeTab === 'ledger') fetchLedger();
  }, [activeTab]);

  const fetchLots = async () => {
    try {
      const pendingRes = await api.get(`/auction/admin/lots`);
      const pendingLots = pendingRes.data;
      setLots(pendingLots);

      const allRes = await api.get(`/auction/admin/all`);
      setAllLots(allRes.data);
      
      const forms = {};
      const aForms = {};
      const currentYear = new Date().getFullYear();

      pendingLots.forEach(l => {
        const now = new Date();
        const requestedStart = l.startDate ? new Date(l.startDate) : null;
        const requestedEnd = l.endDate ? new Date(l.endDate) : null;
        const sd = requestedStart && !Number.isNaN(requestedStart.getTime()) && requestedStart > now
          ? requestedStart
          : new Date(now.getTime() + 2 * 60000);
        const ed = requestedEnd && !Number.isNaN(requestedEnd.getTime()) && requestedEnd > sd
          ? requestedEnd
          : new Date(sd.getTime() + 7 * 86400000);
        
        forms[l._id] = {
          lotNumber: l.lotNumber || `LOT-${currentYear}-${l._id.substring(l._id.length - 5).toUpperCase()}`,
          startDate: toDatetimeLocal(sd),
          endDate: toDatetimeLocal(ed),
        };

        aForms[l._id] = {
          authenticationStatus: l.authenticationStatus || 'pending_custody',
          custodyLocation: l.custodyLocation || 'Grand Store Bonded Vault'
        };
      });
      setApprovalForms(forms);
      setAuthForms(aForms);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchFraudAlerts = async () => {
    try {
      const res = await api.get('/auction/admin/fraud-alerts');
      setFraudAlerts(res.data);
    } catch (err) {
      console.error('Failed to load fraud alerts', err);
    }
  };

  const fetchLedger = async () => {
    try {
      const res = await api.get(`/auction/admin/ledger`);
      setLedgerEntries(res.data);
    } catch (err) {
      console.error('Error fetching ledger:', err);
    }
  };

  const fetchBidders = async () => {
    try {
      const res = await api.get(`/auction/admin/bidders`);
      setBidders(res.data);
      const inputs = {};
      res.data.forEach(b => {
        inputs[b._id] = b.biddingLimit || 25000;
      });
      setLimitInputs(inputs);
    } catch (err) {
      console.error('Error fetching bidders:', err);
    }
  };

  const fetchDeposits = async () => {
    try {
      const res = await api.get(`/auction/admin/deposits`);
      setDeposits(res.data);
    } catch (err) {
      console.error('Error fetching deposits:', err);
    }
  };

  const handleApproveBidder = async (bidderId, bidderLevel = 'level_2_verified') => {
    try {
      const limit = limitInputs[bidderId] || 25000;
      const res = await api.put(`/auction/admin/bidders/${bidderId}/approve`, {
        bidderLevel,
        biddingLimit: limit
      });
      if (onNotify) onNotify(res.data.message || 'Bidder approved successfully!');
      fetchBidders();
    } catch (err) {
      console.error('Error approving bidder:', err);
      if (onNotify) onNotify(err.response?.data?.message || 'Failed to approve bidder');
    }
  };

  const handleRejectBidder = async (bidderId) => {
    const reason = window.prompt('Enter rejection reason for this applicant:', 'Identification documents or age verification could not be validated.');
    if (reason === null) return;
    try {
      const res = await api.put(`/auction/admin/bidders/${bidderId}/reject`, { reason });
      if (onNotify) onNotify(res.data.message || 'Bidder application rejected.');
      fetchBidders();
    } catch (err) {
      console.error('Error rejecting bidder:', err);
      if (onNotify) onNotify(err.response?.data?.message || 'Failed to reject bidder');
    }
  };

  const handleUpdateLimit = async (bidderId) => {
    try {
      const limit = limitInputs[bidderId];
      const res = await api.put(`/auction/admin/bidders/${bidderId}/limit`, { biddingLimit: limit });
      if (onNotify) onNotify(res.data.message || 'Bidding limit updated.');
      fetchBidders();
    } catch (err) {
      console.error('Error updating limit:', err);
      if (onNotify) onNotify(err.response?.data?.message || 'Failed to update limit');
    }
  };

  const handleToggleSuspension = async (bidderId, currentlySuspended) => {
    try {
      const res = await api.put(`/auction/admin/bidders/${bidderId}/limit`, {
        isBiddingSuspended: !currentlySuspended,
        suspensionReason: !currentlySuspended ? 'Suspended by administrator review' : ''
      });
      if (onNotify) onNotify(res.data.message || 'Bidder status updated.');
      fetchBidders();
    } catch (err) {
      console.error('Error toggling suspension:', err);
      if (onNotify) onNotify(err.response?.data?.message || 'Failed to toggle suspension');
    }
  };

  const handleVerifyDeposit = async (depositId, action) => {
    try {
      const res = await api.put(`/auction/admin/deposits/${depositId}/verify`, { action });
      if (onNotify) onNotify(res.data.message || 'Deposit updated.');
      fetchDeposits();
      fetchBidders();
    } catch (err) {
      console.error('Error verifying deposit:', err);
      if (onNotify) onNotify(err.response?.data?.message || 'Failed to update deposit');
    }
  };

  const handleUpdateAuth = async (id) => {
    try {
      const form = authForms[id];
      await api.put(`/auction/admin/lots/${id}/authenticate`, form);
      if (onNotify) onNotify('Lot authentication status updated!');
      fetchLots();
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify(err.response?.data?.message || 'Failed to update authentication status.');
    }
  };

  const handleApprove = async (id) => {
    try {
      const form = approvalForms[id];
      const startDate = new Date(form.startDate);
      const endDate = new Date(form.endDate);
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
        if (onNotify) onNotify('Enter a valid auction start and end time.');
        return;
      }
      if (endDate <= startDate) {
        if (onNotify) onNotify('Auction end time must be later than the start time.');
        return;
      }
      if (endDate <= new Date()) {
        if (onNotify) onNotify('Auction end time must be in the future.');
        return;
      }
      await api.put(`/auction/${id}/approve`, {
        ...form,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      if (onNotify) onNotify('Lot approved and published successfully!');
      fetchLots();
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify(err.response?.data?.message || 'Failed to approve lot.');
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      const notes = window.prompt('Enter resolution notes:', 'Reviewed and cleared by Compliance');
      if (!notes) return;
      await api.put(`/auction/admin/fraud-alerts/${alertId}/resolve`, { resolutionNotes: notes });
      if (onNotify) onNotify('Fraud alert marked as resolved.');
      fetchFraudAlerts();
    } catch (err) {
      console.error(err);
      if (onNotify) onNotify('Failed to resolve alert.');
    }
  };

  const updateForm = (id, field, value) => {
    setApprovalForms(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const updateAuthForm = (id, field, value) => {
    setAuthForms(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  if (!user || user.role !== 'admin') {
     return <div className="min-h-screen bg-[#0a0907] flex items-center justify-center text-white">Admin access required</div>;
  }

  return (
    <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto relative z-10 px-4 py-8">
      {/* Welcome Section */}
      <section>
        <h1 className="text-[var(--color-ivory)] font-serif text-3xl md:text-5xl mb-4">
          Auction <span className="text-4xl md:text-6xl text-gold-gradient font-normal ml-2 tracking-wide drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">Management & Compliance</span>
        </h1>
        <p className="text-[var(--color-ivory-muted)] text-base md:text-lg max-w-2xl font-light">
          Manage lot custody, authenticate bottles, monitor real-time shill bidding fraud, and review double-entry CPA ledgers.
        </p>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-4 mt-8 border-b border-white/10 pb-4">
          <button 
            onClick={() => setActiveTab('pending')}
            className={`text-xs uppercase tracking-widest font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'pending' ? 'bg-[var(--color-gold)]/20 text-[var(--color-gold)] border border-[var(--color-gold)]/40 shadow-lg shadow-[var(--color-gold)]/10' : 'text-white/60 hover:text-white bg-white/5'}`}
          >
            <Gavel size={15} />
            Pending Lots & Custody ({lots.length})
          </button>
          <button 
            onClick={() => navigate('/admin/kyc-verifications')}
            className="text-xs uppercase tracking-widest font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 text-amber-400 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 shadow-sm"
          >
            <UserCheck size={15} />
            Dedicated 18+ KYC Portal →
          </button>
          <button 
            onClick={() => { setActiveTab('bidders'); fetchBidders(); fetchDeposits(); }}
            className={`text-xs uppercase tracking-widest font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'bidders' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40 shadow-lg shadow-blue-500/10' : 'text-white/60 hover:text-white bg-white/5'}`}
          >
            <UserCheck size={15} />
            Quick Approvals ({bidders.filter(b => b.bidderApprovalStatus === 'pending_approval').length})
          </button>
          <button 
            onClick={() => { setActiveTab('fraud'); fetchFraudAlerts(); }}
            className={`text-xs uppercase tracking-widest font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'fraud' ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-lg shadow-red-500/10' : 'text-white/60 hover:text-white bg-white/5'}`}
          >
            <ShieldAlert size={15} />
            Fraud & Shill Alerts ({fraudAlerts.filter(a => a.status === 'FLAGGED').length})
          </button>
          <button 
            onClick={() => { setActiveTab('ledger'); fetchLedger(); }}
            className={`text-xs uppercase tracking-widest font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'ledger' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/10' : 'text-white/60 hover:text-white bg-white/5'}`}
          >
            <BookOpen size={15} />
            CPA Financial Ledger
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`text-xs uppercase tracking-widest font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${activeTab === 'history' ? 'bg-[var(--color-gold)]/20 text-[var(--color-gold)] border border-[var(--color-gold)]/40' : 'text-white/60 hover:text-white bg-white/5'}`}
          >
            <Clock size={15} />
            Auction History
          </button>
        </div>
      </section>

      {/* TAB 1: PENDING APPROVALS & CUSTODY PIPELINE */}
      {activeTab === 'pending' && (
        <section>
          {loading ? (
            <div className="py-24 text-center text-[var(--color-ivory-muted)] font-light tracking-wide">Loading pending lots...</div>
          ) : lots.length === 0 ? (
            <div className="py-24 text-center flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-white/[0.02] border border-white/[0.05] flex items-center justify-center mb-6">
                <CheckCircle2 size={40} className="text-gold-gradient opacity-30" />
              </div>
              <h3 className="text-[var(--color-ivory)] font-serif text-3xl mb-3">All Caught Up</h3>
              <p className="text-[var(--color-ivory-muted)] text-base font-light">There are no pending auction lots requiring authentication or approval at this time.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              {lots.map((lot) => (
                <div key={lot._id} className="bg-white/[0.02] backdrop-blur-2xl rounded-3xl border border-white/[0.05] shadow-[0_8px_32px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col xl:flex-row">
                  
                  {/* Lot Specs & Physical Info */}
                  <div className="flex-1 p-6 md:p-10 flex flex-col gap-6">
                    
                    {/* Top Row: Media Showcase + Essential Info */}
                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                      
                      {/* Media Viewer Column */}
                      <div className="w-full lg:w-56 shrink-0 flex flex-col gap-3">
                        {/* Primary Image Preview */}
                        <div 
                          className="w-full h-52 bg-black/60 rounded-2xl flex items-center justify-center p-3 border border-white/[0.08] relative group cursor-pointer overflow-hidden"
                          onClick={() => setPreviewMediaModal({
                            type: 'image',
                            url: lot.images?.[0] || '/assets/auction/macallan-25.png',
                            title: `${lot.title} - Cover Photo`
                          })}
                        >
                          <img 
                            src={lot.images && lot.images[0] ? lot.images[0] : '/assets/auction/macallan-25.png'} 
                            alt={lot.title} 
                            className="max-w-full max-h-full object-contain mix-blend-screen group-hover:scale-105 transition-transform duration-300" 
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold backdrop-blur-[2px]">
                            <Eye size={16} /> Inspect
                          </div>
                          <span className="absolute bottom-2 left-2 text-[9px] font-mono uppercase bg-black/80 text-white/70 px-2 py-0.5 rounded border border-white/10">
                            Cover
                          </span>
                        </div>

                        {/* All Uploaded Photos Strip */}
                        {lot.images && lot.images.length > 1 && (
                          <div>
                            <div className="text-[10px] text-white/50 uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1">
                              <ImageIcon size={11} className="text-[#e1bd70]" />
                              All Photos ({lot.images.length})
                            </div>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10">
                              {lot.images.map((imgUrl, imgIdx) => (
                                <button
                                  key={imgIdx}
                                  type="button"
                                  onClick={() => setPreviewMediaModal({
                                    type: 'image',
                                    url: imgUrl,
                                    title: `${lot.title} - Photo #${imgIdx + 1}`
                                  })}
                                  className="w-12 h-12 rounded-lg border border-white/10 hover:border-[#e1bd70] overflow-hidden shrink-0 bg-black/40 p-0.5 transition-colors cursor-pointer"
                                  title={`Inspect photo ${imgIdx + 1}`}
                                >
                                  <img src={imgUrl} alt={`Photo ${imgIdx + 1}`} className="w-full h-full object-cover rounded" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Video Showcase Tile */}
                        {lot.videoUrl && (
                          <div 
                            onClick={() => setPreviewMediaModal({
                              type: 'video',
                              url: lot.videoUrl,
                              title: `${lot.title} - 360° Inspection Video`
                            })}
                            className="w-full p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-900/20 border border-amber-500/30 flex items-center gap-3 cursor-pointer hover:border-amber-400 transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-full bg-[#e1bd70] text-black flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                              <Play size={14} fill="black" className="ml-0.5" />
                            </div>
                            <div className="overflow-hidden">
                              <div className="text-[11px] font-bold text-[#e1bd70] uppercase tracking-wider truncate">
                                360° Inspection Video
                              </div>
                              <div className="text-[9px] text-white/50">Click to Play & Inspect</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Title, Vendor, and Descriptions */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5 mb-2">
                          <span className="text-[10px] tracking-widest uppercase font-bold text-[var(--color-gold)] bg-gold/10 px-2 py-0.5 rounded border border-[var(--color-gold)]/20">
                            {lot.lotNumber || `LOT-${lot._id.slice(-6).toUpperCase()}`}
                          </span>
                          <span className="text-white/20">•</span>
                          <span className="text-[10px] tracking-widest uppercase text-white/70 font-semibold">{lot.category}</span>
                          <span className="text-white/20">•</span>
                          <span className="text-[10px] tracking-widest uppercase text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Vendor: {lot.vendor?.name || lot.vendor?.storeName || 'Approved Vendor'} {lot.vendor?.email ? `(${lot.vendor.email})` : ''}
                          </span>
                        </div>

                        <h3 className="text-[var(--color-ivory)] font-serif text-2xl md:text-3xl mb-2.5 leading-tight">{lot.title}</h3>
                        <p className="text-[var(--color-ivory-muted)] font-light leading-relaxed mb-4 text-sm whitespace-pre-line">{lot.description}</p>
                        
                        {/* Financials & Valuation Highlights */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                          <div className="bg-white/[0.02] p-3 rounded-xl border border-white/[0.05]">
                            <span className="text-[var(--color-ivory-muted)] block text-[9px] uppercase tracking-widest mb-0.5 font-semibold">Starting Bid</span> 
                            <span className="font-serif text-base text-gold-gradient"><Price amount={lot.startingBid} /></span>
                          </div>
                          <div className="bg-white/[0.02] p-3 rounded-xl border border-white/[0.05]">
                            <span className="text-[var(--color-ivory-muted)] block text-[9px] uppercase tracking-widest mb-0.5 font-semibold">Reserve Price</span> 
                            <span className="font-serif text-base text-gold-gradient"><Price amount={lot.reservePrice} /></span>
                            <span className="text-[9px] text-white/40 uppercase block mt-0.5">{lot.reserveType || 'confidential'} reserve</span>
                          </div>
                          <div className="bg-white/[0.02] p-3 rounded-xl border border-white/[0.05] col-span-2 sm:col-span-1">
                            <span className="text-[var(--color-ivory-muted)] block text-[9px] uppercase tracking-widest mb-0.5 font-semibold">Estimated Valuation</span> 
                            <span className="font-serif text-sm text-white font-medium">
                              {lot.estimatedValueMin ? (
                                <><Price amount={lot.estimatedValueMin} /> – <Price amount={lot.estimatedValueMax} /></>
                              ) : (
                                'Not specified'
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Specifications Grid */}
                    <div>
                      <h5 className="text-[10px] uppercase tracking-widest text-white/50 font-bold mb-2 flex items-center gap-1.5">
                        <Award size={13} className="text-[#e1bd70]" /> Bottle Specifications & Physical Verification Details
                      </h5>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 text-xs bg-black/40 p-4 rounded-2xl border border-white/5">
                        <div>
                          <span className="text-white/40 block text-[9px] uppercase tracking-wider mb-0.5">Distillery / Winery</span>
                          <span className="text-white font-medium">{lot.distillery || '—'}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block text-[9px] uppercase tracking-wider mb-0.5">Expression / Cuvée</span>
                          <span className="text-white font-medium">{lot.expression || '—'}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block text-[9px] uppercase tracking-wider mb-0.5">Vintage / Bottling</span>
                          <span className="text-white font-medium">{lot.vintage ? `${lot.vintage} (${lot.bottlingYear || 'Vintage'})` : '—'}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block text-[9px] uppercase tracking-wider mb-0.5">Age Statement</span>
                          <span className="text-white font-medium">{lot.ageStatement || '—'}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block text-[9px] uppercase tracking-wider mb-0.5">Bottle # / Cask #</span>
                          <span className="text-white font-medium">#{lot.bottleNumber || '—'} / Cask #{lot.caskNumber || '—'}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block text-[9px] uppercase tracking-wider mb-0.5">Bottle Size / ABV</span>
                          <span className="text-white font-medium">{lot.bottleSizeMl ? `${lot.bottleSizeMl}ml` : '750ml'} • {lot.abv ? `${lot.abv}%` : '—'}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block text-[9px] uppercase tracking-wider mb-0.5">Country of Origin</span>
                          <span className="text-white font-medium">{lot.countryOfOrigin || '—'}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block text-[9px] uppercase tracking-wider mb-0.5">Fill Level</span>
                          <span className="text-[var(--color-gold)] font-medium">{lot.fillLevel || 'Into Neck'}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block text-[9px] uppercase tracking-wider mb-0.5">Box / Packaging</span>
                          <span className="text-white font-medium">{lot.boxCondition || 'Original Box'}</span>
                        </div>
                        <div>
                          <span className="text-white/40 block text-[9px] uppercase tracking-wider mb-0.5">Seal Condition</span>
                          <span className="text-white font-medium">{lot.sealCondition || 'Intact'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-white/40 block text-[9px] uppercase tracking-wider mb-0.5">Condition Assessment</span>
                          <span className="text-white font-medium">{lot.condition || '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Provenance History */}
                    {(lot.provenanceHistory || lot.provenance) && (
                      <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 text-xs">
                        <span className="text-white/40 block text-[9px] uppercase tracking-wider mb-1 font-semibold flex items-center gap-1">
                          <FileText size={11} className="text-[#e1bd70]" /> Stated Provenance & Cellar History
                        </span>
                        <p className="text-white/80 font-light leading-relaxed">{lot.provenanceHistory || lot.provenance}</p>
                      </div>
                    )}
                  </div>

                  {/* Authentication & Approval Controls */}
                  <div className="w-full xl:w-[420px] bg-black/60 xl:border-l border-t xl:border-t-0 border-white/[0.05] p-6 md:p-8 flex flex-col justify-between">
                    <div>
                      <h4 className="font-semibold text-xs text-gold-gradient uppercase tracking-widest border-b border-white/[0.05] pb-3 mb-5 flex items-center gap-2">
                        <ShieldCheck size={16} /> Physical Custody & Authentication
                      </h4>

                      <div className="space-y-4 mb-6">
                        <div>
                          <label className="block text-[10px] text-white/60 mb-1.5 uppercase tracking-widest font-semibold">
                            Custody Location
                          </label>
                          <input 
                            type="text" 
                            value={authForms[lot._id]?.custodyLocation || ''} 
                            onChange={e => updateAuthForm(lot._id, 'custodyLocation', e.target.value)} 
                            className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[var(--color-gold)]"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-white/60 mb-1.5 uppercase tracking-widest font-semibold">
                            Authentication Status
                          </label>
                          <select 
                            value={authForms[lot._id]?.authenticationStatus || 'pending_custody'} 
                            onChange={e => updateAuthForm(lot._id, 'authenticationStatus', e.target.value)}
                            className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[var(--color-gold)]"
                          >
                            <option value="pending_custody">Pending Custody Intake</option>
                            <option value="in_inspection">In Inspection</option>
                            <option value="documents_verified">Documents Verified</option>
                            <option value="authenticated">Authenticated</option>
                            <option value="rejected">Rejected / Inauthentic</option>
                          </select>
                        </div>

                        <button 
                          onClick={() => handleUpdateAuth(lot._id)}
                          className="w-full py-2 bg-white/5 border border-white/10 text-white hover:bg-white/10 rounded-xl text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer"
                        >
                          Save Authentication State
                        </button>
                      </div>

                      <h4 className="font-semibold text-xs text-gold-gradient uppercase tracking-widest border-b border-white/[0.05] pb-3 mb-5 flex items-center gap-2">
                        <Gavel size={14} /> Schedule & Approve
                      </h4>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] text-white/60 mb-1 uppercase tracking-widest font-semibold">Start Date/Time</label>
                          <input 
                            type="datetime-local" 
                            min={toDatetimeLocal(new Date())} 
                            value={approvalForms[lot._id]?.startDate || ''} 
                            onChange={e => updateForm(lot._id, 'startDate', e.target.value)} 
                            className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[var(--color-gold)] [color-scheme:dark]" 
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-white/60 mb-1 uppercase tracking-widest font-semibold">End Date/Time</label>
                          <input 
                            type="datetime-local" 
                            min={approvalForms[lot._id]?.startDate || toDatetimeLocal(new Date())} 
                            value={approvalForms[lot._id]?.endDate || ''} 
                            onChange={e => updateForm(lot._id, 'endDate', e.target.value)} 
                            className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[var(--color-gold)] [color-scheme:dark]" 
                          />
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleApprove(lot._id)} 
                      className="w-full mt-6 rounded-xl bg-gold-gradient text-black font-bold uppercase tracking-widest text-xs py-3.5 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all cursor-pointer"
                    >
                      Approve & Publish Lot
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: FRAUD & SHILL-BIDDING ALERTS */}
      {activeTab === 'fraud' && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif text-white">Fraud & Shill Bidding Telemetry</h2>
            <button 
              onClick={fetchFraudAlerts}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 text-xs text-white rounded-lg hover:bg-white/10"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {fraudAlerts.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center bg-white/[0.01] border border-white/5 rounded-2xl">
              <ShieldCheck size={48} className="text-emerald-400 opacity-60 mb-3" />
              <h3 className="text-lg font-serif text-white mb-1">No Fraud Alerts Recorded</h3>
              <p className="text-xs text-white/50">All auction bidding operations have maintained integrity.</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white/[0.01] border border-white/5 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] bg-black/40">
                    <th className="py-4 font-semibold pl-6">Severity & Type</th>
                    <th className="py-4 font-semibold">Lot Number</th>
                    <th className="py-4 font-semibold">Bidder # / Role</th>
                    <th className="py-4 font-semibold">IP & Fingerprint</th>
                    <th className="py-4 font-semibold">Reason</th>
                    <th className="py-4 font-semibold">Status</th>
                    <th className="py-4 font-semibold pr-6">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs font-light">
                  {fraudAlerts.map(alert => (
                    <tr key={alert._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 pl-6">
                        <span className={`inline-block px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider ${
                          alert.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                          alert.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                          'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                        }`}>
                          {alert.severity}: {alert.alertType}
                        </span>
                      </td>
                      <td className="py-4 font-mono text-white/80">{alert.lot?.lotNumber || alert.lot?._id?.slice(-6) || '—'}</td>
                      <td className="py-4 font-mono text-[var(--color-gold)]">{alert.user?.bidderNumber || alert.user?.name || 'Anonymous'}</td>
                      <td className="py-4 font-mono text-[10px] text-white/50">{alert.ipAddress || '—'}</td>
                      <td className="py-4 text-white/70 max-w-xs">{alert.reason}</td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          alert.status === 'FLAGGED' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {alert.status}
                        </span>
                      </td>
                      <td className="py-4 pr-6">
                        {alert.status === 'FLAGGED' && (
                          <button 
                            onClick={() => handleResolveAlert(alert._id)}
                            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Resolve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 3: CPA FINANCIAL LEDGER */}
      {activeTab === 'ledger' && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-serif text-white">Trust Account Double-Entry Ledger (CPA Section 45)</h2>
            <button 
              onClick={fetchLedger}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 text-xs text-white rounded-lg hover:bg-white/10"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {ledgerEntries.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center bg-white/[0.01] border border-white/5 rounded-2xl">
              <BookOpen size={48} className="text-[var(--color-gold)] opacity-40 mb-3" />
              <h3 className="text-lg font-serif text-white mb-1">No Ledger Entries Yet</h3>
              <p className="text-xs text-white/50">Ledger entries are created automatically upon auction conclusion.</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white/[0.01] border border-white/5 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] bg-black/40">
                    <th className="py-4 font-semibold pl-6">Lot Info</th>
                    <th className="py-4 font-semibold">Hammer Price</th>
                    <th className="py-4 font-semibold">Buyer Premium (Rev)</th>
                    <th className="py-4 font-semibold">Seller Comm (Rev)</th>
                    <th className="py-4 font-semibold">Grand Store Net Rev</th>
                    <th className="py-4 font-semibold">Seller Net Payout</th>
                    <th className="py-4 font-semibold pr-6">Payment Deadline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs font-light font-mono">
                  {ledgerEntries.map(entry => (
                    <tr key={entry._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 pl-6 font-sans">
                        <div className="font-serif text-sm text-white">{entry.lot?.title}</div>
                        <div className="text-[10px] text-[var(--color-gold)] uppercase font-mono">{entry.lot?.lotNumber}</div>
                      </td>
                      <td className="py-4 text-white"><Price amount={entry.hammerPrice} /></td>
                      <td className="py-4 text-emerald-400">+<Price amount={entry.buyersPremium} /></td>
                      <td className="py-4 text-emerald-400">+<Price amount={entry.sellersCommission} /></td>
                      <td className="py-4 font-bold text-[var(--color-gold)]"><Price amount={entry.grandStoreRevenue} /></td>
                      <td className="py-4 text-amber-400"><Price amount={entry.sellerNetPayout} /></td>
                      <td className="py-4 pr-6 text-white/60 font-sans text-[11px]">
                        {new Date(entry.paymentDeadline).toLocaleString('en-ZA')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 4: AUCTION HISTORY */}
      {activeTab === 'history' && (
        <section>
          {loading ? (
            <div className="py-24 text-center text-[var(--color-ivory-muted)] font-light tracking-wide">Loading history...</div>
          ) : allLots.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-[var(--color-ivory-muted)]">No auction history found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white/[0.01] border border-white/5 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] bg-black/20">
                    <th className="py-4 font-semibold pl-6">Lot Info</th>
                    <th className="py-4 font-semibold">Status</th>
                    <th className="py-4 font-semibold">Vendor</th>
                    <th className="py-4 font-semibold">Current/Winning Bid</th>
                    <th className="py-4 font-semibold pr-6">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allLots.map((lot) => (
                    <React.Fragment key={lot._id}>
                      <tr className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                        <td className="py-4 pl-6">
                          <div className="font-serif text-sm text-[var(--color-ivory)]">{lot.title}</div>
                          <div className="text-[10px] text-[var(--color-ivory-muted)] tracking-widest uppercase">Lot {lot.lotNumber || lot._id.slice(-6)}</div>
                        </td>
                        <td className="py-4 text-xs font-bold uppercase tracking-widest text-[var(--color-gold)]">
                          {lot.status.replace('_', ' ')}
                          {lot.status === 'sold' && (
                            <span className={`ml-2 px-1.5 py-0.5 rounded text-[8px] ${lot.paymentStatus === 'Paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                              {lot.paymentStatus || 'Pending'}
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-xs text-[var(--color-ivory)]">
                           {lot.vendor?.name || 'Unknown'}
                        </td>
                        <td className="py-4 text-sm font-bold text-[var(--color-ivory)] font-serif">
                          <Price amount={(lot.winningBid || lot.currentBid || 0).toLocaleString('en-ZA')} />
                        </td>
                        <td className="py-4 pr-6 text-sm">
                          {lot.status === 'sold' && (
                            <button 
                              onClick={() => setExpandedLot(expandedLot === lot._id ? null : lot._id)} 
                              className="text-[10px] border border-white/20 text-white hover:bg-white/10 px-3 py-1.5 rounded uppercase tracking-widest font-bold transition-all cursor-pointer"
                            >
                              {expandedLot === lot._id ? 'Hide Details' : 'View Details'}
                            </button>
                          )}
                        </td>
                      </tr>
                      
                      {expandedLot === lot._id && lot.status === 'sold' && (
                        <tr className="bg-white/[0.02]">
                          <td colSpan="5" className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                              <div className="bg-[#0a0a0a] p-5 rounded-xl border border-white/10">
                                 <h4 className="text-[var(--color-gold)] font-bold tracking-widest uppercase text-[10px] mb-4">Financial Breakdown</h4>
                                 <div className="space-y-2 font-mono text-[var(--color-ivory-muted)]">
                                    <div className="flex justify-between"><span>Winning Bid:</span> <span><Price amount={lot.winningBid?.toLocaleString('en-ZA')} /></span></div>
                                    <div className="flex justify-between"><span>Buyer Premium ({(lot.buyerPremiumPct || 5)}%):</span> <span>+ <Price amount={lot.buyerPremiumAmount?.toLocaleString('en-ZA')} /></span></div>
                                    <div className="flex justify-between"><span>BAR Charge ({(lot.barChargePct || 2)}%):</span> <span>+ <Price amount={lot.barChargeAmount?.toLocaleString('en-ZA')} /></span></div>
                                    <div className="flex justify-between"><span>VAT ({(lot.vatPct || 15)}%):</span> <span>+ <Price amount={lot.vatAmount?.toLocaleString('en-ZA')} /></span></div>
                                    <div className="flex justify-between"><span>Shipping:</span> <span>+ <Price amount={lot.shippingCost?.toLocaleString('en-ZA')} /></span></div>
                                    <div className="flex justify-between border-t border-white/10 pt-2 mt-2 text-white font-bold">
                                       <span>Total Paid By Buyer:</span> 
                                       <span className="text-[var(--color-gold)]"><Price amount={lot.totalPaidByBuyer?.toLocaleString('en-ZA')} /></span>
                                    </div>
                                    
                                    <div className="flex justify-between border-t border-dashed border-white/10 pt-2 mt-2"><span>Commission Earned ({(lot.commissionPct || 15)}%):</span> <span className="text-green-400"><Price amount={lot.commissionAmount?.toLocaleString('en-ZA')} /></span></div>
                                    <div className="flex justify-between"><span>Vendor Payout Net:</span> <span className="text-yellow-400"><Price amount={lot.vendorPayable?.toLocaleString('en-ZA')} /></span></div>
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
      )}
      {/* TAB 5: BIDDER APPROVALS & KYC (PHASE 4 & SECTION 17-19) */}
      {activeTab === 'bidders' && (
        <section className="space-y-12">
          {/* Subheader & Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.02] border border-white/5 p-6 rounded-2xl">
            <div>
              <h3 className="text-xl font-serif text-[var(--color-ivory)]">Bidder Verification & Qualification</h3>
              <p className="text-xs text-[var(--color-ivory-muted)] font-light mt-1">
                South African Liquor Act (18+) and FICA-aligned bidder qualification pipeline.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {[
                { id: 'pending', label: 'Pending Review', count: bidders.filter(b => b.bidderApprovalStatus === 'pending_approval').length },
                { id: 'approved', label: 'Approved', count: bidders.filter(b => b.bidderApprovalStatus === 'approved').length },
                { id: 'rejected', label: 'Rejected', count: bidders.filter(b => b.bidderApprovalStatus === 'rejected').length },
                { id: 'all', label: 'All Bidders', count: bidders.length }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setBidderFilter(f.id)}
                  className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${bidderFilter === f.id ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-white/5 text-white/60 hover:text-white'}`}
                >
                  {f.label} ({f.count})
                </button>
              ))}
            </div>
          </div>

          {/* Bidder List */}
          {bidders.filter(b => bidderFilter === 'all' || (bidderFilter === 'pending' ? b.bidderApprovalStatus === 'pending_approval' : b.bidderApprovalStatus === bidderFilter)).length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
              <UserCheck size={40} className="text-white/20 mb-4" />
              <h4 className="text-lg text-[var(--color-ivory)] font-medium">No bidders found in this category</h4>
              <p className="text-xs text-[var(--color-ivory-muted)] mt-1">When users submit 18+ verification or deposit requests, they will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {bidders
                .filter(b => bidderFilter === 'all' || (bidderFilter === 'pending' ? b.bidderApprovalStatus === 'pending_approval' : b.bidderApprovalStatus === bidderFilter))
                .map(bidder => {
                  const minAge = settings?.bidderKycMinAge || 18;
                  const birthDate = bidder.dateOfBirth ? new Date(bidder.dateOfBirth) : null;
                  let age = null;
                  if (birthDate && !Number.isNaN(birthDate.getTime())) {
                    const today = new Date();
                    age = today.getFullYear() - birthDate.getFullYear();
                    const m = today.getMonth() - birthDate.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
                  }

                  const hasCustomKyc = bidder.customKycValues && typeof bidder.customKycValues === 'object' && Object.keys(bidder.customKycValues).length > 0;

                  return (
                    <div key={bidder._id} className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all flex flex-col lg:flex-row justify-between gap-6">
                      {/* Bidder Details */}
                      <div className="space-y-4 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-lg font-serif text-[var(--color-ivory)]">{bidder.name}</h4>
                              {bidder.legalFullName && bidder.legalFullName !== bidder.name && (
                                <span className="text-xs text-[var(--color-gold)] font-medium">
                                  (Legal: {bidder.legalFullName})
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-white/40">{bidder.email}</span>
                          </div>
                          
                          {/* Status Badge */}
                          {bidder.bidderApprovalStatus === 'approved' && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <ShieldCheck size={12} /> Approved
                            </span>
                          )}
                          {bidder.bidderApprovalStatus === 'pending_approval' && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                              <Clock size={12} /> Pending Review
                            </span>
                          )}
                          {bidder.bidderApprovalStatus === 'rejected' && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                              <UserX size={12} /> Rejected
                            </span>
                          )}
                          {bidder.isBiddingSuspended && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                              <Ban size={12} /> Suspended
                            </span>
                          )}
                        </div>

                        {/* Identification Details Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/30 p-4 rounded-xl text-xs border border-white/5">
                          <div>
                            <span className="text-white/40 block text-[10px] uppercase tracking-wider">Age ({minAge}+)</span>
                            <span className={`font-medium ${age && age >= minAge ? 'text-emerald-400' : 'text-red-400'}`}>
                              {age !== null ? `${age} Yrs (${age >= minAge ? `Legal ${minAge}+` : `Under ${minAge}`})` : 'Not Verified'}
                            </span>
                          </div>
                          <div>
                            <span className="text-white/40 block text-[10px] uppercase tracking-wider">ID Document</span>
                            <span className="text-white/90 font-medium truncate block">
                              {bidder.idType || 'National ID'}: {bidder.idNumber || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-white/40 block text-[10px] uppercase tracking-wider">Assigned Handle</span>
                            <span className="text-[var(--color-gold)] font-mono font-bold">
                              {bidder.bidderNumber || 'Pending'}
                            </span>
                          </div>
                          <div>
                            <span className="text-white/40 block text-[10px] uppercase tracking-wider">Rules of Auction</span>
                            <span className="text-emerald-400 font-medium">
                              {bidder.rulesAcceptedVersion ? `Accepted (${bidder.rulesAcceptedVersion})` : 'Not Accepted'}
                            </span>
                          </div>
                        </div>

                        {/* Uploaded Documents Badges & Links */}
                        <div className="flex flex-wrap gap-2.5 text-xs pt-1">
                          {bidder.idDocumentUrl ? (
                            <a 
                              href={bidder.idDocumentUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 font-medium flex items-center gap-1.5 transition-colors"
                            >
                              <FileText size={13} className="text-blue-400" />
                              <span>View Passport / ID Document</span>
                              <ExternalLink size={11} />
                            </a>
                          ) : (
                            <span className="px-2.5 py-1 rounded-lg bg-white/5 text-white/40 border border-white/5 flex items-center gap-1.5 text-[11px]">
                              No ID Document Uploaded
                            </span>
                          )}

                          {bidder.proofOfResidenceUrl && (
                            <a 
                              href={bidder.proofOfResidenceUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 font-medium flex items-center gap-1.5 transition-colors"
                            >
                              <FileText size={13} className="text-purple-400" />
                              <span>Proof of Residence</span>
                              <ExternalLink size={11} />
                            </a>
                          )}
                        </div>

                        {/* Custom Dynamic KYC Fields configured by admin */}
                        {hasCustomKyc && (
                          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1.5 text-xs">
                            <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider block">
                              Additional Admin KYC Fields:
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(bidder.customKycValues).map(([key, val]) => (
                                <span key={key} className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-white/80 text-[11px] font-mono">
                                  <strong className="text-[var(--color-gold)] font-sans">{key}:</strong> {String(val)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Rejection reason if any */}
                        {bidder.bidderRejectionReason && (
                          <p className="text-xs text-red-400 italic">
                            Rejection Note: {bidder.bidderRejectionReason}
                          </p>
                        )}
                      </div>

                      {/* Limit Configuration & Action Controls */}
                      <div className="w-full lg:w-80 flex flex-col justify-between bg-black/40 p-5 rounded-xl border border-white/5 space-y-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-white/50 uppercase tracking-wider font-semibold">Bidding Limit (ZAR)</span>
                            <span className="text-xs font-mono text-[var(--color-gold)] font-bold">
                              R{(bidder.biddingLimit || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={limitInputs[bidder._id] ?? (bidder.biddingLimit || 25000)}
                              onChange={(e) => setLimitInputs({ ...limitInputs, [bidder._id]: Number(e.target.value) })}
                              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
                              placeholder="e.g. 25000"
                            />
                            <button
                              onClick={() => handleUpdateLimit(bidder._id)}
                              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap"
                            >
                              Set Limit
                            </button>
                          </div>
                        </div>

                        {/* Approval / Rejection / Suspension Buttons */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                          {bidder.bidderApprovalStatus !== 'approved' && (
                            <button
                              onClick={() => handleApproveBidder(bidder._id, 'level_2_verified')}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-600/20"
                            >
                              <CheckCircle2 size={14} /> Approve Bidder
                            </button>
                          )}
                          {bidder.bidderApprovalStatus === 'pending_approval' && (
                            <button
                              onClick={() => handleRejectBidder(bidder._id)}
                              className="bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <UserX size={14} /> Reject
                            </button>
                          )}
                          {bidder.bidderApprovalStatus === 'approved' && (
                            <button
                              onClick={() => handleToggleSuspension(bidder._id, bidder.isBiddingSuspended)}
                              className={`flex-1 text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${bidder.isBiddingSuspended ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-red-950/40 text-red-400 border border-red-500/30 hover:bg-red-900/40'}`}
                            >
                              <Ban size={14} /> {bidder.isBiddingSuspended ? 'Lift Suspension' : 'Suspend Bidding'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Refundable Bidding Deposits Section (Section 19) */}
          <div className="mt-16 pt-8 border-t border-white/10 space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-xl font-serif text-[var(--color-ivory)]">Refundable Bidding Deposits</h4>
                <p className="text-xs text-[var(--color-ivory-muted)] font-light mt-1">
                  High-value auction guarantees held in escrow per Section 19 of Auction Rules.
                </p>
              </div>
              <button
                onClick={fetchDeposits}
                className="text-xs bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            {deposits.length === 0 ? (
              <div className="p-8 text-center bg-white/[0.01] border border-white/5 rounded-xl text-xs text-white/40">
                No refundable bidding deposits recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/5 bg-black/20">
                <table className="w-full text-left text-xs">
                  <thead className="bg-white/5 text-white/50 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-4">Reference</th>
                      <th className="p-4">Bidder</th>
                      <th className="p-4">Tier & Deposit</th>
                      <th className="p-4">Method & Proof</th>
                      <th className="p-4">Refund Bank Account</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {deposits.map(d => (
                      <tr key={d._id} className="hover:bg-white/[0.02]">
                        <td className="p-4 font-mono font-bold text-white">{d.paymentReference}</td>
                        <td className="p-4">
                          <p className="font-medium text-white">{d.bidder?.name || 'N/A'}</p>
                          <p className="text-[10px] text-white/40">{d.bidder?.email}</p>
                        </td>
                        <td className="p-4">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/20 mb-1">
                            {d.tier === 'premium' ? 'VIP Premium Tier' : 'Standard'}
                          </span>
                          <p className="font-mono text-[var(--color-gold)] font-bold text-sm">
                            R{d.amount?.toLocaleString()}
                          </p>
                        </td>
                        <td className="p-4">
                          <span className="uppercase text-[10px] tracking-wider text-white/70 block mb-1">{d.paymentMethod}</span>
                          {d.proofOfPayment ? (
                            <a
                              href={d.proofOfPayment}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-400 hover:text-blue-300 underline flex items-center gap-1"
                            >
                              <ExternalLink size={10} /> View Proof
                            </a>
                          ) : (
                            <span className="text-[10px] text-white/30">Direct Gateway</span>
                          )}
                        </td>
                        <td className="p-4 text-[11px]">
                          {d.bankAccountDetails?.accountNumber ? (
                            <div className="bg-black/40 p-2 rounded border border-white/5 space-y-0.5 text-[10px]">
                              <p className="text-white font-medium">{d.bankAccountDetails.bankName}</p>
                              <p className="text-white/60 font-mono">Acc: {d.bankAccountDetails.accountNumber}</p>
                              <p className="text-white/40">Holder: {d.bankAccountDetails.accountHolder || d.bidder?.name}</p>
                              {d.bankAccountDetails.branchCode && (
                                <p className="text-white/40">Branch: {d.bankAccountDetails.branchCode}</p>
                              )}
                            </div>
                          ) : (
                            <span className="text-white/30 text-[10px]">Gateway Reversal</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${d.paymentStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : d.paymentStatus === 'refunded' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                            {d.paymentStatus}
                          </span>
                        </td>
                        <td className="p-4 text-white/40">{new Date(d.createdAt).toLocaleDateString()}</td>
                        <td className="p-4 text-right space-x-2">
                          {d.paymentStatus === 'pending' && (
                            <button
                              onClick={() => handleVerifyDeposit(d._id, 'verify_paid')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Verify Paid
                            </button>
                          )}
                          {d.paymentStatus === 'paid' && (
                            <button
                              onClick={() => handleVerifyDeposit(d._id, 'refund')}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] font-bold cursor-pointer"
                            >
                              Issue Refund
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Admin Fullscreen Media Inspection Modal */}
      {previewMediaModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
          onClick={() => setPreviewMediaModal(null)}
        >
          <div 
            className="relative max-w-5xl w-full bg-[#111] border border-white/10 rounded-2xl overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/60">
              <div className="flex items-center gap-2 overflow-hidden">
                {previewMediaModal.type === 'video' ? (
                  <Film size={16} className="text-[#e1bd70] shrink-0" />
                ) : (
                  <Eye size={16} className="text-[#e1bd70] shrink-0" />
                )}
                <span className="text-sm font-semibold text-white truncate">
                  {previewMediaModal.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewMediaModal(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Media Body */}
            <div className="p-4 flex items-center justify-center min-h-[350px] max-h-[80vh] overflow-hidden bg-black/40">
              {previewMediaModal.type === 'video' ? (
                getEmbedVideoUrl(previewMediaModal.url) ? (
                  <iframe
                    src={getEmbedVideoUrl(previewMediaModal.url)}
                    title={previewMediaModal.title}
                    className="w-full h-[70vh] rounded-lg border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={previewMediaModal.url}
                    controls
                    autoPlay
                    className="max-h-[75vh] max-w-full rounded-lg object-contain shadow-2xl"
                  />
                )
              ) : (
                <img
                  src={previewMediaModal.url}
                  alt={previewMediaModal.title}
                  className="max-h-[75vh] max-w-full rounded-lg object-contain shadow-2xl"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
