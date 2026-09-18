import Price from '../../components/ui/Price';
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api';
import SEO from '../../components/SEO';
import { 
  ChevronLeft, ShieldCheck, Clock, History, AlertCircle, ArrowRight, 
  Play, Video, Film, Image as ImageIcon, Crown, ChevronDown, Check, 
  Award, Trophy, Sparkles, Gem, Shield, CheckCircle2, Gavel,
  Download, Printer, FileCheck, Share2
} from 'lucide-react';
import AuctionCountdown from './AuctionCountdown';
import BidConfirmationModal from '../../components/modals/BidConfirmationModal';
import BidderVerificationModal from '../../components/modals/BidderVerificationModal';
import GoldenCelebrationShower from './GoldenCelebrationShower';
import MagicalBidEffect from './MagicalBidEffect';
import AuctionWinnerCelebrationModal from './components/AuctionWinnerCelebrationModal';
import AuctionAcquisitionCertificate from './components/AuctionAcquisitionCertificate';
import { useCurrency, getCountryForCurrency, CURRENCY_SYMBOLS, ZERO_DECIMAL_CURRENCIES } from '../../context/CurrencyContext';
import { CountryFlag } from '../../components/CountryCodeSelect';

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 45) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const getEmbedVideoUrl = (url) => {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/i);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/i);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  return null;
};

export default function AuctionLotDetail({ onNotify }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentStatus = searchParams.get('payment');
  const [lot, setLot] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [isMaxBid, setIsMaxBid] = useState(false);
  const [activeMedia, setActiveMedia] = useState(0);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [bidderProfile, setBidderProfile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [confirmedZarAmount, setConfirmedZarAmount] = useState(0);
  const [showMagicalBid, setShowMagicalBid] = useState(false);
  const [lastBidAmount, setLastBidAmount] = useState(0);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [downloadingCert, setDownloadingCert] = useState(false);
  const [vaultRecommendations, setVaultRecommendations] = useState([]);
  const shouldCelebrate = searchParams.get('celebrate') === 'true';

  const { currency, rates, changeCurrency, availableCurrencies } = useCurrency();

  const [now, setNow] = useState(() => Date.now());
  const [shareToast, setShareToast] = useState(false);

  const handleShare = async () => {
    if (!lot) return;
    const shareData = {
      title: `${lot.title} | The Grand Store Auction`,
      text: `Inspect Lot #${lot.lotNumber}: ${lot.title} on The Grand Store Auction Vault`,
      url: window.location.href,
    };
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      }
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2400);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBidderProfile = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (userInfo && userInfo.token) {
        const res = await api.get('/auction/bidder/status', {
          headers: { Authorization: `Bearer ${userInfo.token}` }
        });
        setBidderProfile(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch bidder status:', err);
    }
  };

  const fetchLot = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const headers = userInfo && userInfo.token ? { Authorization: `Bearer ${userInfo.token}` } : {};
      const res = await api.get(`/auction/${id}`, { headers });
      setLot(res.data.lot);
      setBids(res.data.bids || []);
    } catch (err) {
      console.error(err);
      onNotify('Failed to fetch lot details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLot();
    fetchBidderProfile();

    const fetchVaultRecs = async () => {
      try {
        const res = await api.get('/products');
        const prods = Array.isArray(res.data) ? res.data : (res.data?.products || []);
        if (prods && prods.length > 0) {
          setVaultRecommendations(prods.slice(0, 4));
        }
      } catch (e) {
        console.warn('Could not load vault recommendations:', e);
      }
    };
    fetchVaultRecs();

    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    const interval = setInterval(fetchLot, 5000);

    return () => {
      window.clearInterval(timer);
      clearInterval(interval);
    };
  }, [id]);

  useEffect(() => {
    if (paymentStatus === 'success' && id) {
      api.post('/payfast/confirm-order', { auctionId: id })
        .then(() => fetchLot())
        .catch(err => console.log('Auction confirm-order result:', err));
    } else if (paymentStatus === 'cancel' && id) {
      api.post('/payfast/cancel-payment', { auctionId: id })
        .then(() => fetchLot())
        .catch(err => console.log('Auction cancel-payment result:', err));
    }
  }, [paymentStatus, id]);

  const userInfo = (() => {
    try {
      return JSON.parse(localStorage.getItem('userInfo'));
    } catch {
      return null;
    }
  })();
  const user = userInfo;
  const isWinner = Boolean(user && lot?.winner && (user._id === (typeof lot.winner === 'object' ? lot.winner._id : lot.winner)));

  // Trigger celebration modal only once when visiting via notification or as unpaid winner
  useEffect(() => {
    if (!lot?._id) return;
    const hasSeen = (() => {
      try {
        return sessionStorage.getItem(`hasSeenAuctionCelebration_${lot._id}`) === 'true' ||
               localStorage.getItem(`hasSeenAuctionCelebration_${lot._id}`) === 'true';
      } catch {
        return false;
      }
    })();
    if (hasSeen) return;

    const isUnsettledAndUnsubmitted = lot.status === 'sold' && lot.paymentStatus === 'Pending' && !lot.isPaid && !lot.proofUrl;
    if (isWinner && (shouldCelebrate || isUnsettledAndUnsubmitted)) {
      setShowCelebrationModal(true);
    }
  }, [lot?._id, isWinner, shouldCelebrate, lot?.status, lot?.paymentStatus, lot?.isPaid, lot?.proofUrl]);

  // Dynamic Increment Ladder
  const getDynamicInc = (cBid) => {
    if (cBid < 5000) return 250;
    if (cBid < 10000) return 500;
    if (cBid < 50000) return 1000;
    if (cBid < 100000) return 2500;
    return 5000;
  };
  const activeIncrement = lot?.bidIncrement || getDynamicInc(lot?.currentBid || 0);
  const nextMinimum = (lot?.currentBid === 0 ? lot?.startingBid : (lot?.currentBid || 0) + activeIncrement) || 0;
  const hasStarted = lot?.startDate ? new Date(lot.startDate).getTime() <= now : true;
  const hasEnded = lot ? (new Date(lot.endDate).getTime() < now || lot.status === 'closed' || lot.status === 'sold' || lot.status === 'unsold') : false;
  const isUpcoming = lot ? (lot.status === 'upcoming' || lot.status === 'pending_approval' || !hasStarted) : false;
  const isLive = lot ? ((lot.status === 'live' || lot.status === 'extended') && hasStarted && !hasEnded) : false;

  // Currency conversion helpers
  const convertFromZar = (zarAmt, curr = currency) => {
    if (!rates || curr === 'ZAR' || !rates[curr] || !rates['ZAR']) return zarAmt;
    const rateZarToCurr = rates[curr] / rates['ZAR'];
    return zarAmt * rateZarToCurr;
  };

  const convertToZar = (currAmt, curr = currency) => {
    if (!rates || curr === 'ZAR' || !rates[curr] || !rates['ZAR']) return currAmt;
    const rateCurrToZar = rates['ZAR'] / rates[curr];
    return currAmt * rateCurrToZar;
  };

  const activeSymbol = CURRENCY_SYMBOLS[currency] || currency;

  const nextMinimumInCurrency = currency === 'ZAR'
    ? nextMinimum
    : Math.ceil(convertFromZar(nextMinimum, currency) * 100) / 100;

  const enteredNum = parseFloat(bidAmount);
  const estimatedZar = !isNaN(enteredNum) && enteredNum > 0
    ? Math.round(convertToZar(enteredNum, currency))
    : null;

  const handleBidClick = (e) => {
    e.preventDefault();
    const amt = Number(bidAmount);
    if (isNaN(amt) || amt <= 0) {
      onNotify('Please enter a valid bid amount.');
      return;
    }

    const amtInZar = Math.round(convertToZar(amt, currency));
    
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const token = userInfo?.token;
    if (!token) {
      onNotify('You must be logged in to place a bid.');
      return;
    }

    if (bidderProfile) {
      if (bidderProfile.isPending) {
        onNotify('Your bidder verification application is pending administrator review and approval.');
        return;
      }
      if (bidderProfile.bidderApprovalStatus === 'rejected') {
        onNotify(`Your application was rejected: ${bidderProfile.bidderRejectionReason || 'Please re-verify.'}`);
        setVerificationModalOpen(true);
        return;
      }
      if (!bidderProfile.isVerified) {
        setVerificationModalOpen(true);
        return;
      }
      if (bidderProfile.isBiddingSuspended) {
        onNotify(`Your bidding privileges are suspended: ${bidderProfile.biddingSuspensionReason || 'Account under review'}`);
        return;
      }
      if (bidderProfile.biddingLimit > 0 && amtInZar > bidderProfile.biddingLimit) {
        onNotify(`Bid of R${amtInZar.toLocaleString()} exceeds your current limit of R${bidderProfile.biddingLimit.toLocaleString()}. Please upgrade to Premium VIP Bidding to place this bid.`);
        setVerificationModalOpen(true);
        return;
      }
    } else {
      setVerificationModalOpen(true);
      return;
    }

    if (amtInZar < nextMinimum) {
      const minFormatted = `${activeSymbol} ${nextMinimumInCurrency.toLocaleString(undefined, { minimumFractionDigits: currency === 'ZAR' ? 0 : 2, maximumFractionDigits: 2 })}`;
      onNotify(`Your bid must be at least ${minFormatted} (≈ R${nextMinimum.toLocaleString('en-ZA')})`);
      return;
    }

    setConfirmedZarAmount(amtInZar);
    setModalOpen(true);
  };

  const submitBid = async () => {
    setSubmitting(true);
    try {
      const res = await api.post(`/auction/${id}/bid`, {
        amount: confirmedZarAmount,
        isMaxBid,
        placedCurrency: currency,
        placedAmount: Number(bidAmount)
      });
      
      onNotify(res.data.message || 'Bid placed successfully!');
      setLastBidAmount(confirmedZarAmount);
      setShowMagicalBid(true);
      await fetchLot(); // Instant UI update of both price and bids array
      setModalOpen(false);
      setBidAmount('');
    } catch (err) {
      console.error(err);
      onNotify(err.response?.data?.message || 'Failed to place bid');
      setModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadCertificate = async () => {
    if (!lot?._id) return;
    setDownloadingCert(true);
    try {
      const res = await api.get(`/auction/${lot._id}/certificate?download=1`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const safeLotNum = lot.lotNumber || lot._id.slice(-6).toUpperCase();
      link.download = `TheGrandStore_Certificate_Lot_${safeLotNum}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      if (onNotify) onNotify('Official Certificate of Acquisition downloaded successfully');
    } catch (err) {
      console.error('Failed to download certificate PDF:', err);
      // Direct link fallback
      const API_URL = import.meta.env.VITE_API_URL || '';
      window.open(`${API_URL}/api/auction/${lot._id}/certificate?download=1`, '_blank');
    } finally {
      setDownloadingCert(false);
    }
  };

  const handleShareCertificate = async () => {
    const shareUrl = `${window.location.origin}/auction/${lot._id}`;
    const shareData = {
      title: `The Grand Store Certificate of Acquisition - ${lot.title}`,
      text: `Official Certificate of Acquisition awarded for Lot #${lot.lotNumber || lot._id.slice(-6).toUpperCase()}: ${lot.title}`,
      url: shareUrl,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (e) {}
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      if (onNotify) onNotify('Certificate verification link copied to clipboard!');
      else alert('Certificate verification link copied to clipboard!');
    } catch (e) {}
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  // Auto trigger download if ?certificate=download query param is present
  useEffect(() => {
    if (searchParams.get('certificate') === 'download' && lot?._id && isWinner) {
      handleDownloadCertificate();
    }
  }, [searchParams, lot?._id, isWinner]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white font-serif">Loading Luxury Lot...</div>;
  if (!lot) return <div className="min-h-screen flex items-center justify-center text-white font-serif">Lot not found</div>;

  const isAdmin = user && user.role === 'admin';
  const isVendor = user && lot.vendor && (user._id === (typeof lot.vendor === 'object' ? lot.vendor._id : lot.vendor));

  const vendorName = lot.vendor ? (lot.vendor.storeName || lot.vendor.name) : 'The Grand Store';

  const currentUserId = user?._id;
  const isRestrictedRole = user?.role === 'admin' || user?.role === 'vendor_active';
  const targetTime = isUpcoming && lot?.startDate ? new Date(lot.startDate).getTime() : new Date(lot.endDate).getTime();

  const currentValuation = hasEnded && lot.winningBid ? lot.winningBid : (lot.currentBid || lot.startingBid || 0);

  const auctionSchema = lot ? {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        '@id': `https://grandstoreglobal.com/auction/${id}#product`,
        name: lot.title,
        description: lot.description || `${lot.title} - Rare collectible lot at The Grand Store Auction Vault.`,
        image: (lot.images && lot.images.length > 0) ? lot.images : (lot.image ? [lot.image] : []),
        sku: lot.bottleNumber ? `LOT-${lot.bottleNumber}` : `LOT-${lot._id}`,
        category: lot.category || 'Fine Spirits & Wine Auctions',
        offers: {
          '@type': 'Offer',
          url: `https://grandstoreglobal.com/auction/${id}`,
          priceCurrency: 'ZAR',
          price: currentValuation,
          availability: hasEnded ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
          validThrough: lot.endDate ? new Date(lot.endDate).toISOString() : undefined,
          priceValidUntil: lot.endDate ? new Date(lot.endDate).toISOString() : undefined,
          itemCondition: 'https://schema.org/NewCondition'
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://grandstoreglobal.com'
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Auction Vault',
            item: 'https://grandstoreglobal.com/auction'
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: lot.title,
            item: `https://grandstoreglobal.com/auction/${id}`
          }
        ]
      }
    ]
  } : null;

  return (
    <main className="min-h-screen bg-[#050505] text-[var(--color-ivory)] font-sans">
      <SEO
        title={`${lot.title} | Rare Whisky & Wine Auction | The Grand Store`}
        description={lot.description ? lot.description.slice(0, 160) : `Bid on rare collectible lot ${lot.title} at The Grand Store Auction Vault.`}
        canonical={`https://grandstoreglobal.com/auction/${id}`}
        ogType="product"
        image={lot.images?.[0] || lot.image}
        schema={auctionSchema}
      />
      
      {/* Top Navigation Bar - Centered, Minimal Luxury */}
      <nav className="w-full border-b border-white/[0.08] bg-[#050505]/95 backdrop-blur-xl sticky top-0 z-50 px-4 sm:px-8 py-3 shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Left: Clean, Elegant Return to Catalogue */}
          <Link 
            to="/auction" 
            className="inline-flex items-center gap-2 text-stone-400 hover:text-[#f5d77f] text-xs uppercase tracking-widest font-semibold transition-all group active:scale-95"
            aria-label="Return to live catalogue"
          >
            <ChevronLeft size={16} className="text-[#c9a35b] group-hover:-translate-x-0.5 transition-transform shrink-0" />
            <span className="hidden sm:inline">Back to Live Catalogue</span>
            <span className="sm:hidden text-[11px]">Catalogue</span>
          </Link>

          {/* Right: Live Bidding / Auction Phase Indicator */}
          <div className="flex items-center gap-2">
            {isLive && !hasEnded ? (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/40 border border-red-500/30 text-red-400 text-[11px] font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(239,68,68,0.25)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]" />
                </span>
                <span>Live Bidding Open</span>
              </div>
            ) : isUpcoming ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/40 border border-blue-500/30 text-blue-400 text-[11px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span>Upcoming Lot</span>
              </div>
            ) : (
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-stone-400 text-[11px] font-bold uppercase tracking-wider">
                <span>Auction Concluded</span>
              </div>
            )}
          </div>

        </div>
      </nav>
      
      {paymentStatus === 'cancel' && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 px-4 py-3 text-center text-xs font-mono text-rose-300 flex items-center justify-center gap-2">
          <span>Checkout was cancelled. No funds were debited. You can resume and complete lot settlement anytime below.</span>
        </div>
      )}
      {paymentStatus === 'success' && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-3 text-center text-xs font-mono text-emerald-300 flex items-center justify-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span>Payment successful! Your acquisition of this lot is confirmed and logged in the Grand Store Vault.</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row w-full min-h-[calc(100vh-80px)]">
        
        {/* Left Side: Luxury Interactive Media Showcase */}
        <div className="w-full lg:w-1/2 lg:h-[calc(100vh-80px)] lg:sticky top-[80px] bg-[#0a0a0a] flex flex-col justify-between p-6 sm:p-10 lg:p-12 lg:border-r border-white/[0.05]">
          {/* Main Stage */}
          <div className="w-full flex-1 flex items-center justify-center relative min-h-[360px] sm:min-h-[460px] overflow-hidden rounded-2xl bg-black/40 border border-white/5">
            {activeMedia === 'video' && lot.videoUrl ? (
              <div className="w-full h-full flex items-center justify-center p-4">
                {getEmbedVideoUrl(lot.videoUrl) ? (
                  <iframe
                    src={getEmbedVideoUrl(lot.videoUrl)}
                    title="Lot inspection video"
                    className="w-full h-full min-h-[380px] rounded-xl border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={lot.videoUrl}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
                  />
                )}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center p-6 relative group">
                <img
                  src={
                    lot.images && lot.images[activeMedia]
                      ? lot.images[activeMedia]
                      : lot.images && lot.images[0]
                      ? lot.images[0]
                      : '/assets/auction/macallan-25.png'
                  }
                  alt={`${lot.title} - View ${typeof activeMedia === 'number' ? activeMedia + 1 : 1}`}
                  className="max-h-[85%] max-w-[85%] object-contain drop-shadow-[0_40px_80px_rgba(0,0,0,0.85)] mix-blend-lighten transition-transform duration-500 group-hover:scale-105"
                />

                {/* Media Counter Pill */}
                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest text-white/80 border border-white/10 flex items-center gap-1.5">
                  <ImageIcon size={12} className="text-[#e1bd70]" />
                  Photo {typeof activeMedia === 'number' ? activeMedia + 1 : 1} of {lot.images?.length || 1}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Thumbnails Strip */}
          {((lot.images && lot.images.length > 1) || lot.videoUrl) && (
            <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
              {/* Photo Thumbnails */}
              {lot.images?.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveMedia(idx)}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border shrink-0 transition-all cursor-pointer bg-black/60 ${
                    activeMedia === idx
                      ? 'border-[#e1bd70] ring-2 ring-[#e1bd70]/40 scale-105 shadow-[0_0_15px_rgba(225,189,112,0.3)]'
                      : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
                  }`}
                  title={`View photo ${idx + 1}`}
                >
                  <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover p-1" />
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] uppercase tracking-tighter bg-black/80 text-[#e1bd70] px-1 rounded font-bold">
                      Cover
                    </span>
                  )}
                </button>
              ))}

              {/* Video Thumbnail (if present) */}
              {lot.videoUrl && (
                <button
                  onClick={() => setActiveMedia('video')}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border shrink-0 transition-all cursor-pointer bg-gradient-to-br from-[#1a1408] to-black flex flex-col items-center justify-center gap-1 text-center ${
                    activeMedia === 'video'
                      ? 'border-[#e1bd70] ring-2 ring-[#e1bd70]/40 scale-105 shadow-[0_0_15px_rgba(225,189,112,0.3)]'
                      : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'
                  }`}
                  title="Watch 360° Inspection Video"
                >
                  <div className="w-7 h-7 rounded-full bg-[#e1bd70] text-black flex items-center justify-center shadow">
                    <Play size={12} fill="black" className="ml-0.5" />
                  </div>
                  <span className="text-[9px] uppercase tracking-wider text-[#e1bd70] font-bold">
                    Video
                  </span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Structured Details & Bidding */}
        <div className="w-full lg:w-1/2 bg-[#050505]">
          <div className="max-w-2xl mx-auto px-8 lg:px-16 py-16 lg:py-24">
            
            {/* Header section */}
            <div className="mb-12">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-gold-gradient text-[11px] uppercase tracking-widest font-bold">
                    LOT {lot.lotNumber || `GS-${lot._id.slice(-6).toUpperCase()}`}
                  </span>
                  <span className="text-white/20">•</span>
                  <span className="text-white/60 text-[11px] uppercase tracking-widest font-medium">{lot.category}</span>
                </div>
                
                <div className="flex items-center gap-2.5 ml-auto">
                  {/* Share button */}
                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] hover:bg-[#c9a35b]/15 border border-white/10 hover:border-[#c9a35b]/40 text-stone-300 hover:text-[#f5d77f] text-xs font-medium transition-all cursor-pointer shadow-sm active:scale-95"
                    title="Share this lot"
                  >
                    <Share2 size={12} className="text-[#c9a35b]" />
                    <span>Share</span>
                  </button>

                  {isLive && (
                    lot.reserveMet ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        🟢 Reserve Met
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        🔴 Reserve Not Met
                      </span>
                    )
                  )}
                </div>
              </div>

              {lot.isExtended && (
                <div className="mb-6 p-4 rounded-xl bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 text-[var(--color-gold)] text-xs flex items-center gap-3">
                  <Clock size={18} className="shrink-0 animate-pulse" />
                  <span><strong>Anti-Sniping Extension Active:</strong> Auction extended by 2 minutes due to competitive late bidding.</span>
                </div>
              )}

              {user && bidderProfile && !bidderProfile.isVerified && isLive && !hasEnded && !isRestrictedRole && (
                <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center justify-between gap-3">
                  <span>Complete legal 18+ age verification to unlock bidding on this lot.</span>
                  <button 
                    onClick={() => setVerificationModalOpen(true)}
                    className="px-4 py-2 bg-[var(--color-gold)] text-black font-bold uppercase text-[10px] tracking-wider rounded-lg hover:brightness-110 transition-all cursor-pointer"
                  >
                    Verify (18+)
                  </button>
                </div>
              )}
              
              {paymentStatus === 'success' && (
                 <div className="mb-6 px-4 py-3 bg-green-900/30 border border-green-500/50 rounded-lg text-green-400 font-medium text-sm">
                    Payment completed successfully via PayFast.
                 </div>
              )}
              {paymentStatus === 'cancel' && (
                 <div className="mb-6 px-4 py-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 font-medium text-sm">
                    Payment was cancelled. You can retry payment below if you are the winner.
                 </div>
              )}

              <h1 className="text-4xl lg:text-6xl font-serif text-[var(--color-ivory)] leading-[1.1] mb-6 tracking-tight">{lot.title}</h1>
              <p className="text-[var(--color-ivory-muted)] text-base lg:text-lg font-light leading-relaxed">
                {lot.description}
              </p>
            </div>

            {/* Bidding Console */}
            <div className="mb-16">
               <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 border-b border-white/[0.05] pb-8">
                  <div>
                    {isUpcoming ? (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-2 h-2 rounded-full bg-blue-400" />
                          <p className="text-[10px] uppercase tracking-widest text-blue-400 font-bold">
                            {lot.estimatedValueMin ? 'Estimated Valuation' : 'Opening Price'}
                          </p>
                        </div>
                        <div className="text-3xl md:text-5xl font-serif font-medium text-gold-gradient mb-2 flex items-center flex-wrap gap-2">
                          {lot.estimatedValueMin ? (
                            <>
                              <Price amount={lot.estimatedValueMin} />
                              {lot.estimatedValueMax && lot.estimatedValueMax !== lot.estimatedValueMin && (
                                <>
                                  <span className="text-white/30 text-2xl font-light">–</span>
                                  <Price amount={lot.estimatedValueMax} />
                                </>
                              )}
                            </>
                          ) : (
                            <Price amount={lot.startingBid || 0} />
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[var(--color-ivory-muted)] font-light flex-wrap">
                          <span>Starting Valuation: <strong className="text-white font-medium"><Price amount={lot.startingBid || 0} /></strong></span>
                          {lot.reserveType === 'none' && (
                            <span className="text-emerald-400 font-semibold">• No Reserve</span>
                          )}
                          {lot.reserveType === 'confidential' && (
                            <span className="text-white/40">• Reserve Protected</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`w-2 h-2 rounded-full ${hasEnded ? 'bg-white/40' : (lot.currentBid > 0 ? 'bg-red-500 animate-pulse' : 'bg-emerald-400')}`} />
                          <p className="text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] font-bold">
                            {hasEnded 
                              ? (lot.status === 'sold' || lot.winningBid > 0 ? 'Winning Bid' : 'Final Bid')
                              : (lot.currentBid && lot.currentBid > 0 ? 'Current Bid' : 'Starting Bid')}
                          </p>
                        </div>
                        <div className="text-3xl sm:text-4xl lg:text-5xl font-serif font-medium text-[var(--color-ivory)] mb-2 tracking-tight whitespace-nowrap overflow-x-auto scrollbar-none flex items-center">
                          <Price amount={hasEnded && lot.winningBid ? lot.winningBid : (lot.currentBid || lot.startingBid || 0)} />
                        </div>
                        {isLive && (
                          <p className="text-xs text-[var(--color-ivory-muted)] font-light">
                            {lot.currentBid && lot.currentBid > 0 ? (
                              <span>{lot.bidCount || 1} {(lot.bidCount === 1) ? 'bid' : 'bids'} placed • Reserve {lot.reserveMet ? 'met' : 'not yet met'}</span>
                            ) : (
                              <span>Opening bid required • No bids placed yet</span>
                            )}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                 <div className="text-left sm:text-right">
                    <p className="text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-3 font-bold">
                      {isUpcoming ? 'Bidding Opens In' : (hasEnded ? 'Auction Ended' : 'Time Remaining')}
                    </p>
                    <div className="text-2xl font-mono text-[var(--color-ivory)] font-light tracking-wider">
                      {hasEnded ? 'Closed' : <AuctionCountdown endTime={targetTime} now={now} />}
                    </div>
                 </div>
               </div>

               {isLive && !hasEnded ? (
                   isRestrictedRole ? (
                      <div className="border border-white/[0.05] p-6 flex items-center gap-4 text-[var(--color-ivory-muted)]">
                         <AlertCircle className="text-[var(--color-ivory-muted)] shrink-0" size={24} />
                         <p className="text-sm font-light leading-relaxed">Admins and Vendors cannot participate in bidding.</p>
                      </div>
                   ) : (
                   <div className="space-y-6">
                     {/* Bidder Verification Status Banner */}
                     {bidderProfile?.isPending && (
                       <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-3">
                         <Clock size={16} className="shrink-0 mt-0.5" />
                         <div>
                           <p className="font-bold text-amber-200">Application Pending Administrator Approval</p>
                           <p className="text-amber-300/80 mt-0.5">Your 18+ age verification and identity details are currently being reviewed by Grand Store compliance. You will be able to place bids once approved.</p>
                         </div>
                       </div>
                     )}

                     {bidderProfile?.bidderApprovalStatus === 'rejected' && (
                       <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start justify-between gap-3">
                         <div className="flex items-start gap-3">
                           <AlertCircle size={16} className="shrink-0 mt-0.5" />
                           <div>
                             <p className="font-bold text-red-200">Verification Rejected</p>
                             <p className="text-red-300/80 mt-0.5">{bidderProfile.bidderRejectionReason || 'Your verification documents could not be validated.'}</p>
                           </div>
                         </div>
                         <button 
                           onClick={() => setVerificationModalOpen(true)}
                           className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-white rounded text-[10px] font-bold uppercase tracking-wider shrink-0 cursor-pointer"
                         >
                           Re-apply
                         </button>
                       </div>
                     )}

                     {bidderProfile?.isVerified && (
                       <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <ShieldCheck size={16} className="text-emerald-400" />
                           <span className="font-medium">Approved Bidder: <strong className="text-white font-mono">{bidderProfile.bidderNumber}</strong></span>
                         </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                              Limit: R{(bidderProfile.biddingLimit || 0).toLocaleString()}
                            </span>
                            {bidderProfile.bidderLevel !== 'level_3_enhanced' && bidderProfile.bidderLevel !== 'level_4_vip' && (
                              <button
                                type="button"
                                onClick={() => navigate('/auction/vip-checkout')}
                                className="px-2 py-0.5 bg-gold-gradient text-black font-bold uppercase tracking-wider text-[10px] rounded hover:brightness-110 flex items-center gap-1 cursor-pointer transition-all shadow-[0_0_10px_rgba(212,175,55,0.25)]"
                              >
                                <Crown size={11} /> Upgrade to VIP
                              </button>
                            )}
                          </div>
                       </div>
                     )}

                     {(!bidderProfile || bidderProfile.bidderApprovalStatus === 'unregistered') && (
                       <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center justify-between">
                         <div>
                           <p className="font-bold text-blue-200">18+ Age & Bidder Verification Required</p>
                           <p className="text-blue-300/80 text-[11px] mt-0.5">Submit legal verification for admin review to unlock bidding privileges.</p>
                         </div>
                         <button 
                           onClick={() => setVerificationModalOpen(true)}
                           className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider shrink-0 cursor-pointer"
                         >
                           Verify Now
                         </button>
                       </div>
                     )}

                   <form onSubmit={handleBidClick} className="flex flex-col gap-6">
                     <div>
                       <div className="flex justify-between items-center mb-3">
                          <label className="text-[10px] uppercase tracking-widest text-[var(--color-ivory)] font-bold">Your Bid</label>
                          <span className="text-[10px] text-[var(--color-gold)] font-mono flex items-center">Next Bid: <Price amount={nextMinimum} /></span>
                       </div>
                       <div className="relative">
                          {/* Currency Selector Pill */}
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center">
                            <button
                              type="button"
                              onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                              className="flex items-center gap-1.5 bg-black/80 hover:bg-white/10 border border-white/20 hover:border-[var(--color-gold)]/60 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold text-[#f5d77f] transition-all cursor-pointer shadow-md"
                              title="Change bidding currency"
                            >
                              <CountryFlag iso={getCountryForCurrency(currency)} className="rounded-xs shrink-0" />
                              {activeSymbol !== currency && (
                                <span className="text-white/90">{activeSymbol}</span>
                              )}
                              <span className="text-[11px] text-white/70">{currency}</span>
                              <ChevronDown size={11} className={`text-white/40 transition-transform ${showCurrencyDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Currency Dropdown Menu */}
                            {showCurrencyDropdown && (
                              <div className="absolute top-full left-0 mt-2 w-48 bg-[#12110e] border border-[#c9a35b]/40 rounded-xl shadow-2xl py-2 z-50 max-h-56 overflow-y-auto scrollbar-thin">
                                <div className="px-3 py-1.5 text-[9px] uppercase tracking-widest text-white/40 font-bold border-b border-white/5 mb-1">
                                  Select Currency
                                </div>
                                {(availableCurrencies || ['ZAR', 'USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD']).map((c) => {
                                  const sym = CURRENCY_SYMBOLS[c] || c;
                                  return (
                                    <button
                                      key={c}
                                      type="button"
                                      onClick={() => {
                                        changeCurrency(c);
                                        setShowCurrencyDropdown(false);
                                      }}
                                      className={`w-full px-3 py-1.5 text-left text-xs font-mono flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer ${
                                        currency === c ? 'text-[#f5d77f] font-bold bg-white/5' : 'text-white/70'
                                      }`}
                                    >
                                      <span className="flex items-center gap-2">
                                        <CountryFlag iso={getCountryForCurrency(c)} className="rounded-xs shrink-0" />
                                        <span>{sym !== c ? `${sym} ` : ''}{c}</span>
                                      </span>
                                      {currency === c && <Check size={12} className="text-[#f5d77f] shrink-0" />}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          <input 
                            type="number"
                            required
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            placeholder={`Min: ${nextMinimumInCurrency.toLocaleString(undefined, { minimumFractionDigits: currency === 'ZAR' || ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2, maximumFractionDigits: currency === 'ZAR' || ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2 })}`}
                            min={nextMinimumInCurrency}
                            step={currency === 'ZAR' || ZERO_DECIMAL_CURRENCIES.has(currency) ? "1" : "0.01"}
                            className="w-full bg-transparent border border-white/20 rounded-none py-5 pl-32 pr-6 text-xl font-mono text-[var(--color-ivory)] focus:outline-none focus:border-[var(--color-gold)] transition-colors placeholder-white/20"
                          />
                       </div>

                       {/* Live Converted ZAR Reference if not bidding in ZAR */}
                       {currency !== 'ZAR' && (
                         <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-mono text-white/50 mt-2">
                           <span>
                             {estimatedZar ? (
                               <span className="text-[var(--color-gold)] font-semibold">
                                 ≈ R {estimatedZar.toLocaleString('en-ZA')} ZAR
                               </span>
                             ) : (
                               <span>Settlement in ZAR: R {nextMinimum.toLocaleString('en-ZA')}</span>
                             )}
                           </span>
                           <span className="text-[10px] text-white/40">
                             Official live exchange rate applied
                           </span>
                         </div>
                       )}
                     </div>

                    <div className="flex items-center justify-between mt-2">
                      <label className="flex items-center gap-3 cursor-pointer group">
                         <div className={`w-4 h-4 border flex items-center justify-center transition-colors ${isMaxBid ? 'bg-gold-gradient border-[var(--color-gold)]' : 'border-white/20 group-hover:border-white/40'}`}>
                           {isMaxBid && <div className="w-2 h-2 bg-black" />}
                         </div>
                         <input type="checkbox" className="hidden" checked={isMaxBid} onChange={(e) => setIsMaxBid(e.target.checked)} />
                         <span className="text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] font-bold group-hover:text-white transition-colors">Place Max Auto-Bid</span>
                      </label>
                    </div>

                    <button 
                      type="submit"
                      disabled={submitting}
                      className="w-full mt-4 bg-gold-gradient text-black font-bold uppercase tracking-widest text-xs py-5 hover:brightness-110 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {submitting ? 'Processing...' : 'Submit Bid'} <ArrowRight size={14} />
                    </button>
                    </form>
                   </div>
                  )
               ) : isUpcoming ? (
                  <div className="border border-blue-500/20 bg-blue-500/5 p-6 flex flex-col items-center justify-center text-center text-blue-400 rounded-xl">
                     <Clock className="text-blue-400 mb-3" size={32} />
                     <p className="text-lg font-serif">Bidding will open when the auction starts.</p>
                     <p className="text-sm font-mono mt-2 tracking-wider"><AuctionCountdown endTime={targetTime} now={now} compact /></p>
                  </div>
               ) : (
                  <div className="flex flex-col gap-6">
                    {lot.status === 'sold' && isWinner ? (
                      <div className="space-y-4">
                        <div id="acquisition-certificate" className="gs-acquisition-shell">
                          <AuctionAcquisitionCertificate lot={lot} user={user} bidderProfile={bidderProfile} />

                          {/* 11. Download, Share & Action Buttons */}
                          <div className="relative z-10 pt-5 grid grid-cols-2 gap-3 border-t border-[#b99b60]/30 mt-4">
                            <button
                              type="button"
                              onClick={handleDownloadCertificate}
                              disabled={downloadingCert}
                              className="w-full col-span-2 flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-[#ffd700] via-[#f5d77f] to-[#d4af37] hover:brightness-110 text-black font-sans font-black uppercase tracking-widest text-sm transition-all shadow-[0_4px_25px_rgba(212,175,55,0.5)] hover:shadow-[0_6px_35px_rgba(212,175,55,0.8)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
                            >
                              <Download size={18} className={downloadingCert ? "animate-bounce" : ""} />
                              <span>{downloadingCert ? "Downloading PDF..." : "Download Official Certificate (PDF)"}</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleShareCertificate}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#f0e8d8] hover:bg-[#e4d8c2] text-[#29261f] border border-[#b99b60] font-sans font-bold uppercase tracking-widest text-xs transition-all cursor-pointer shadow-sm hover:shadow"
                            >
                              <Share2 size={15} />
                              <span>Share Certificate</span>
                            </button>
                            
                            <button
                              type="button"
                              onClick={handlePrintCertificate}
                              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#f0e8d8] hover:bg-[#e4d8c2] text-[#29261f] border border-[#b99b60] font-sans font-bold uppercase tracking-widest text-xs transition-all cursor-pointer shadow-sm hover:shadow"
                            >
                              <Printer size={15} />
                              <span>Print Certificate</span>
                            </button>
                          </div>
                        </div>

                        {/* Payment Settlement Status CTA */}
                        <div className="relative z-10 pt-4">
                          {lot.paymentStatus === 'Paid' || lot.isPaid ? (
                            <div className="w-full bg-emerald-500/15 text-emerald-800 font-bold uppercase tracking-widest text-xs py-4 px-6 rounded-xl text-center border border-emerald-500/40 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                              <CheckCircle2 size={18} /> Acquisition Settled • Logistics In Preparation
                            </div>
                          ) : (lot.paymentStatus === 'Awaiting_Approval' || Boolean(lot.proofUrl)) ? (
                            <Link 
                              to={`/auction/checkout/${lot._id}`} 
                              className="group flex items-center justify-center gap-3 w-full bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 font-bold uppercase tracking-widest text-xs py-4 px-6 rounded-xl border border-amber-500/30 transition-all shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                            >
                              <Clock size={16} className="text-amber-700" />
                              <span>EFT Proof Submitted • Awaiting Admin Verification</span>
                              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-amber-700" />
                            </Link>
                          ) : (
                            <Link 
                              to={`/auction/checkout/${lot._id}`} 
                              className="group relative flex items-center justify-center gap-3 w-full bg-gradient-to-r from-[#ffd700] via-[#f5d77f] to-[#d4af37] text-black font-black uppercase tracking-widest text-xs py-4 px-6 rounded-xl hover:shadow-[0_0_35px_rgba(212,175,55,0.6)] hover:scale-[1.01] transition-all cursor-pointer"
                            >
                              <Sparkles size={16} className="text-black/80" />
                              <span>Claim Lot & Complete Settlement</span>
                              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform text-black/80" />
                            </Link>
                          )}
                        </div>

                      </div>
                    ) : lot.status === 'sold' && (isAdmin || isVendor) ? (
                      <div className="border border-white/10 p-8 bg-black/40">
                        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                           <h3 className="text-sm font-bold tracking-widest uppercase text-[var(--color-gold)]">
                             {isAdmin ? 'Admin View: Sold Lot' : 'Vendor View: Sold Lot'}
                           </h3>
                           <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-widest font-bold ${lot.paymentStatus === 'Paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                             {lot.paymentStatus === 'Paid' ? 'Paid' : 'Payment Pending'}
                           </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-mono text-[var(--color-ivory-muted)]">
                          <div>
                            <h4 className="text-[10px] uppercase tracking-widest text-white mb-2 font-sans font-bold">Financials</h4>
                            <div className="space-y-2">
                               <div className="flex justify-between"><span>Winning Bid:</span> <span><Price amount={lot.winningBid} /></span></div>
                               {isAdmin && (
                                 <>
                                  <div className="flex justify-between"><span>Buyer Premium:</span> <span><Price amount={lot.buyerPremiumAmount} /></span></div>
                                  <div className="flex justify-between"><span>BAR Charge:</span> <span><Price amount={lot.barChargeAmount} /></span></div>
                                  <div className="flex justify-between"><span>Shipping:</span> <span><Price amount={lot.shippingCost} /></span></div>
                                  <div className="flex justify-between"><span>Total Buyer Paid:</span> <span className="text-[var(--color-gold)]"><Price amount={lot.totalPaidByBuyer} /></span></div>
                                 </>
                               )}
                               <div className="flex justify-between"><span>Commission ({lot.commissionPct}%):</span> <span className="text-red-400">- <Price amount={lot.commissionAmount} /></span></div>
                               <div className="flex justify-between"><span>VAT:</span> <span className="text-red-400">- <Price amount={lot.vatAmount} /></span></div>
                               <div className="flex justify-between border-t border-white/10 pt-2 mt-2 text-white font-bold">
                                  <span>Net Vendor Payout:</span> 
                                  <span className="text-yellow-400"><Price amount={lot.vendorPayable} /></span>
                               </div>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-[10px] uppercase tracking-widest text-white mb-2 font-sans font-bold">Delivery Details</h4>
                            <p className="text-white font-sans">{typeof lot.winner === 'object' ? lot.winner.name : lot.winner}</p>
                            {typeof lot.winner === 'object' && <p className="mb-4">{lot.winner.email}</p>}
                            
                            {lot.paymentStatus === 'Paid' && lot.shippingAddress ? (
                               <div className="text-xs">
                                  <p>{lot.shippingAddress.address}</p>
                                  <p>{lot.shippingAddress.city}, {lot.shippingAddress.postalCode}</p>
                                  <p>{lot.shippingAddress.country}</p>
                               </div>
                            ) : (
                               <p className="text-xs italic text-yellow-400">
                                  {lot.paymentStatus === 'Paid' ? 'No shipping address provided.' : 'Waiting for buyer to complete checkout.'}
                               </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (lot.status === 'sold' || hasEnded) ? (
                      <div className="space-y-6">
                        <div className="border border-white/10 p-6 bg-black/40 rounded-2xl">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-serif text-white">Historical Benchmark & Valuation</h3>
                            <span className="text-[10px] uppercase tracking-widest px-2.5 py-1 rounded bg-[#c9a35b]/20 text-[#f5d77f] font-bold font-mono">
                              {lot.status === 'sold' ? 'Sold at Auction' : 'Auction Concluded'}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--color-ivory-muted)] font-light mb-4 leading-relaxed">
                            This singular lot has concluded. The recorded valuation serves as a certified collectible price guide reference.
                          </p>
                          <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-between text-xs font-mono">
                            <span className="text-white/60">Final Valuation / Hammer:</span>
                            <span className="text-[var(--color-gold)] font-bold text-base">
                              <Price amount={lot.winningBid || lot.currentBid || lot.startingBid || 0} />
                            </span>
                          </div>
                        </div>

                        {/* In-stock retail recommendation shelf for ended lots */}
                        {vaultRecommendations.length > 0 && (
                          <div className="p-6 border border-white/10 bg-white/[0.01] rounded-2xl">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <p className="text-[9px] uppercase tracking-widest text-gold-gradient font-bold">In-Stock Allocations</p>
                                <h4 className="text-base font-serif text-white">Available in Our Luxury Vault</h4>
                              </div>
                              <Link to="/shop" className="text-[10px] uppercase tracking-widest text-[var(--color-gold)] hover:underline flex items-center gap-1 font-bold">
                                Browse Store <ArrowRight size={12} />
                              </Link>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {vaultRecommendations.map((prod) => (
                                <Link
                                  key={prod._id || prod.id}
                                  to={`/product/${prod.slug || prod.id || prod._id}`}
                                  className="group p-3 bg-black/50 hover:bg-white/[0.04] border border-white/5 hover:border-[var(--color-gold)]/40 rounded-xl transition-all block"
                                >
                                  <div className="h-24 w-full flex items-center justify-center p-1 mb-2 bg-white/[0.02] rounded-lg overflow-hidden">
                                    <img 
                                      src={prod.image || prod.images?.[0] || '/assets/placeholder-bottle.png'} 
                                      alt={prod.name} 
                                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                                      loading="lazy"
                                    />
                                  </div>
                                  <h5 className="text-[11px] font-medium text-white line-clamp-1 group-hover:text-[var(--color-gold)] transition-colors">
                                    {prod.name}
                                  </h5>
                                  <p className="text-[11px] text-[var(--color-gold)] font-mono font-bold mt-1">
                                    <Price amount={prod.price || 0} />
                                  </p>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : lot.status === 'unsold' ? (
                      <div className="border border-white/[0.05] p-6 flex flex-col gap-4 text-[var(--color-ivory-muted)] bg-white/[0.02] rounded-xl">
                        <h3 className="text-lg font-serif text-white mb-2">Auction Closed</h3>
                        <p className="text-sm font-light">This lot did not meet its reserve or received no bids. (Unsold)</p>
                      </div>
                    ) : (
                      <div className="border border-white/[0.05] p-6 flex items-center gap-4 text-[var(--color-ivory-muted)]">
                        <AlertCircle className="text-[var(--color-ivory-muted)] shrink-0" size={24} />
                        <p className="text-sm font-light leading-relaxed">This auction is currently <strong className="uppercase tracking-wider text-white text-xs">{lot.status}</strong>. Bidding is disabled.</p>
                      </div>
                    )}
                  </div>
               )}
            </div>

            {/* Structured Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/[0.05] border border-white/[0.05] mb-16 rounded-xl overflow-hidden">
               <div className="bg-[#050505] p-6">
                 <p className="text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1 font-bold">Distillery & Vintage</p>
                 <p className="text-sm font-light text-[var(--color-ivory)] leading-relaxed">
                   {lot.distillery || 'Single Malt Distillery'} {lot.vintage ? `• ${lot.vintage} Vintage` : ''} {lot.ageStatement ? `(${lot.ageStatement})` : ''}
                 </p>
               </div>
               <div className="bg-[#050505] p-6">
                 <p className="text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1 font-bold">Fill Level</p>
                 <p className="text-sm font-medium text-[var(--color-gold)] leading-relaxed">{lot.fillLevel || 'Into Neck'}</p>
               </div>
               <div className="bg-[#050505] p-6">
                 <p className="text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1 font-bold">Bottle & Cask Reference</p>
                 <p className="text-sm font-light text-[var(--color-ivory)] leading-relaxed">
                   {lot.bottleNumber ? `Bottle #${lot.bottleNumber}` : 'Numbered Release'} {lot.caskNumber ? `• Cask #${lot.caskNumber}` : ''}
                 </p>
               </div>
               <div className="bg-[#050505] p-6">
                 <p className="text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1 font-bold">Format & Strength</p>
                 <p className="text-sm font-light text-[var(--color-ivory)] leading-relaxed">
                   {lot.bottleSizeMl || 750}ml • {lot.abv ? `${lot.abv}% ABV` : 'Standard ABV'} • {lot.countryOfOrigin || 'Scotland'}
                 </p>
               </div>
               <div className="bg-[#050505] p-6">
                 <p className="text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1 font-bold">Box & Seal Condition</p>
                 <p className="text-sm font-light text-[var(--color-ivory)] leading-relaxed">
                   {lot.boxCondition || 'Original Box'} • {lot.sealCondition || 'Intact'}
                 </p>
               </div>
               <div className="bg-[#050505] p-6">
                 <p className="text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1 font-bold">Custody & Authentication</p>
                 <p className="text-sm font-medium text-emerald-400 leading-relaxed flex items-center gap-1.5">
                   <ShieldCheck size={16} /> {lot.authenticationStatus || 'Authenticated'} ({lot.custodyLocation || 'Grand Store Vault'})
                 </p>
               </div>
               <div className="col-span-1 sm:col-span-2 bg-[#050505] p-6 flex items-center gap-4 border-t border-white/[0.05]">
               <ShieldCheck className="text-[var(--color-gold)]" size={24} />
                 <div>
                   <p className="text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1 font-bold">Offered By</p>
                   <p className="text-sm font-medium text-[var(--color-gold)]">{vendorName}</p>
                 </div>
               </div>
            </div>

            {/* Verified Bid Ledger */}
            <div className="mt-12 pt-8 border-t border-white/[0.08]">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-white/[0.08]">
                 <div>
                   <div className="flex items-center gap-2.5">
                     <h3 className="font-serif text-2xl text-[var(--color-ivory)]">Verified Bid Ledger</h3>
                     {bids.length > 0 && (
                       <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-widest font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                         Live
                       </span>
                     )}
                   </div>
                   <p className="text-xs text-[var(--color-ivory-muted)] font-light mt-0.5">
                     Real-time cryptographic record of all certified auction bids
                   </p>
                 </div>
                 <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-ivory-muted)]">
                   <History size={16} className="text-[var(--color-gold)]" />
                   <span>{bids.length} {bids.length === 1 ? 'Recorded Bid' : 'Recorded Bids'}</span>
                 </div>
               </div>
               
               <div>
                 {bids.length > 0 ? (
                    <div className="flex flex-col gap-2.5">
                      {bids.map((bid, i) => {
                        const isLeading = i === 0;
                        const isUser = bid.isUserBid || (user && bid.user && (user._id === (typeof bid.user === 'object' ? bid.user._id : bid.user)));
                        
                        return (
                          <div 
                            key={bid._id || i} 
                            className={`relative overflow-hidden rounded-xl transition-all duration-300 ${
                              isLeading 
                                ? 'bg-gradient-to-r from-[#d4af37]/20 via-[#d4af37]/5 to-black/60 border border-[var(--color-gold)]/60 shadow-[0_0_20px_rgba(212,175,55,0.18)] p-4 sm:p-5' 
                                : isUser
                                ? 'bg-emerald-500/5 border border-emerald-500/30 p-3.5 sm:p-4'
                                : 'bg-black/30 hover:bg-white/[0.02] border border-white/[0.05] p-3.5 sm:p-4'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              {/* Left: Rank & Bidder */}
                              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                <div className="flex items-center justify-center shrink-0">
                                  {isLeading ? (
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#f9e295] to-[#b8860b] p-0.5 shadow-[0_0_10px_rgba(212,175,55,0.4)] flex items-center justify-center">
                                      <div className="w-full h-full bg-black/90 rounded-[6px] flex items-center justify-center">
                                        <Crown size={15} className="text-[#f9e295]" />
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[10px] text-[var(--color-ivory-muted)] font-mono">
                                      #{i + 1}
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-sm font-medium tracking-wide truncate ${isLeading ? 'text-white font-semibold' : 'text-[var(--color-ivory)]'}`}>
                                      {bid.bidderNumber || bid.bidder || 'Verified Collector'}
                                    </span>
                                    {isLeading && (
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider font-bold bg-[#d4af37]/20 text-[#f9e295] border border-[#d4af37]/40 flex items-center gap-1">
                                        <Sparkles size={9} /> High Bidder
                                      </span>
                                    )}
                                    {isUser && (
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                        Your Bid
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] font-mono text-[var(--color-ivory-muted)] block mt-0.5">
                                    {formatRelativeTime(bid.createdAt || bid.time)}
                                  </span>
                                </div>
                              </div>

                              {/* Right: Price */}
                              <div className="text-right shrink-0">
                                <div className={`font-mono text-base sm:text-lg font-bold ${isLeading ? 'text-transparent bg-clip-text bg-gradient-to-r from-[#fff4cc] via-[#f5d77f] to-[#d4af37]' : 'text-[var(--color-ivory)]'}`}>
                                  <Price amount={bid.amount} />
                                </div>
                                {isLeading && (
                                  <span className="text-[9px] font-mono tracking-widest uppercase text-[#f9e295]/80 block">
                                    Leading Position
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                 ) : (
                    <div className="py-12 px-6 rounded-2xl border border-white/[0.06] bg-black/40 text-center flex flex-col items-center justify-center">
                      <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-3">
                        <Gavel size={24} className="text-[var(--color-gold)] opacity-70" />
                      </div>
                      <h4 className="font-serif text-lg text-white mb-1">No Bids Recorded Yet</h4>
                      <p className="text-xs font-light text-[var(--color-ivory-muted)] max-w-sm">
                        Be the discerning collector to place the inaugural opening bid on this singular lot.
                      </p>
                    </div>
                 )}
               </div>
            </div>

          </div>
        </div>
      </div>

      {/* Golden Celebration Shower for Auction Winner */}
      {((lot.status === 'sold' && isWinner) || shouldCelebrate) && (
        <GoldenCelebrationShower duration={9000} />
      )}

      {/* Grand Victory Celebration Modal */}
      <AuctionWinnerCelebrationModal
        isOpen={showCelebrationModal}
        onClose={() => {
          if (lot?._id) {
            try {
              sessionStorage.setItem(`hasSeenAuctionCelebration_${lot._id}`, 'true');
              localStorage.setItem(`hasSeenAuctionCelebration_${lot._id}`, 'true');
            } catch (e) {}
          }
          setShowCelebrationModal(false);
        }}
        lot={lot}
        user={user}
      />

      {/* Magical Bid Effect with Audio Synthesizer */}
      {showMagicalBid && (
        <MagicalBidEffect
          amount={lastBidAmount || confirmedZarAmount}
          lotTitle={lot.title}
          onFinished={() => setShowMagicalBid(false)}
        />
      )}

      <BidConfirmationModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        lot={lot} 
        bidAmount={confirmedZarAmount} 
        currency={currency}
        isMaxBid={isMaxBid} 
        onConfirm={submitBid} 
        loading={submitting} 
      />

      <BidderVerificationModal
        isOpen={verificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
        bidderProfile={bidderProfile}
        onSuccess={(bidder) => {
          setBidderProfile(prev => ({ ...prev, ...(bidder || {}), isVerified: true }));
          fetchLot();
        }}
        onNotify={onNotify}
      />

      {/* Floating Share Confirmation Toast */}
      {shareToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#12110e] border border-[#c9a35b]/50 text-[#f5d77f] text-xs uppercase tracking-wider font-bold py-2.5 px-4 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200 flex items-center gap-2">
          <span>✓</span>
          <span>Link Copied to Clipboard</span>
        </div>
      )}
    </main>
  );
}
