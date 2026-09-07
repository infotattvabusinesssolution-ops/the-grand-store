import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Gavel, Crown, CheckCircle2, Clock, AlertCircle, 
  Sparkles, ArrowRight, RefreshCw, Landmark, ExternalLink, Wine, ShoppingBag
} from 'lucide-react';
import api from '../../api';
import BidderVerificationModal from '../modals/BidderVerificationModal';

export default function BidderKycCard({ onNotify }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchBidderStatus = async () => {
    try {
      const [statusRes, settingsRes] = await Promise.all([
        api.get('/auction/bidder/status').catch(() => ({ data: null })),
        api.get('/settings/public').catch(() => ({ data: null }))
      ]);
      if (statusRes?.data) setProfile(statusRes.data);
      if (settingsRes?.data) setSettings(settingsRes.data);
    } catch (err) {
      console.error('Error fetching bidder status or settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBidderStatus();
  }, []);

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-[#11100e] border border-white/5 animate-pulse flex items-center justify-between text-xs text-white/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/5" />
          <div className="space-y-2">
            <div className="w-40 h-3 bg-white/10 rounded" />
            <div className="w-24 h-2 bg-white/5 rounded" />
          </div>
        </div>
        <div className="w-24 h-8 bg-white/5 rounded-xl" />
      </div>
    );
  }

  const isVerified = profile?.isVerified;
  const isPending = profile?.isPending;
  const isRejected = profile?.bidderApprovalStatus === 'rejected';
  const isUnregistered = !profile || profile.bidderApprovalStatus === 'unregistered';
  const isVip = profile?.bidderLevel === 'level_3_enhanced' || profile?.bidderLevel === 'level_4_vip';

  const minAge = settings?.bidderKycMinAge || 18;
  const depositAmount = settings?.auctionPremiumDepositAmount !== undefined 
    ? settings.auctionPremiumDepositAmount 
    : 5000;
  const standardLimit = settings?.auctionStandardBiddingLimit || 25000;
  const premiumLimit = settings?.auctionPremiumBiddingLimit || 250000;

  return (
    <section className="bg-[#11100e] border border-[#c9a35b]/30 rounded-2xl p-6 relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#c9a35b]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isVip 
              ? 'bg-[var(--color-gold)]/20 text-[var(--color-gold)] border border-[var(--color-gold)]/40' 
              : isVerified 
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
              : isPending 
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
              : 'bg-white/5 text-white/60 border border-white/10'
          }`}>
            {isVip ? <Crown size={20} /> : <ShieldCheck size={20} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-serif text-white font-medium">
                {minAge}+ Legal Age & Identity Verification (KYC)
              </h3>
              {isVip && (
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[var(--color-gold)]/20 text-[var(--color-gold)] border border-[var(--color-gold)]/30 flex items-center gap-1">
                  <Sparkles size={9} /> VIP Bidder
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--color-ivory-muted)] font-light">
              Dual Compliance for Store Wine & Spirit Purchases and Live Auction Bidding
            </p>
          </div>
        </div>

        {/* Top Status Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isVerified && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <CheckCircle2 size={13} /> {isVip ? 'VIP Verified (Store & Auctions)' : `${minAge}+ Verified (Store & Auctions)`}
            </span>
          )}
          {isPending && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
              <Clock size={13} /> Under Compliance Review
            </span>
          )}
          {isRejected && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1.5">
              <AlertCircle size={13} /> Application Rejected
            </span>
          )}
          {isUnregistered && (
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-white/50 border border-white/10">
              Not Verified ({minAge}+)
            </span>
          )}
        </div>
      </div>

      {/* STATE 1: UNREGISTERED */}
      {isUnregistered && (
        <div className="space-y-4">
          <p className="text-xs text-white/70 leading-relaxed font-light">
            Under South African liquor legislation (National Liquor Act) and auction compliance regulations, complete your legal adult age ({minAge}+) verification once. This unlocks pre-cleared store product purchases across all fine wines & spirits, and qualifies your account for live auctions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {/* Store Purchases Benefit */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold text-xs">
                <span className="p-1.5 rounded-lg bg-[var(--color-gold)]/10 text-[var(--color-gold)]">
                  <Wine size={16} />
                </span>
                <span>Store Product Purchases (Wine & Spirits)</span>
              </div>
              <p className="text-[11px] text-[var(--color-ivory-muted)] leading-relaxed">
                Clears 18+ liquor compliance across all fine wines, whiskies, and champagnes. Enjoy 1-click checkout with no document requests at checkout.
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                <CheckCircle2 size={11} /> Required for Fine Spirit Orders
              </span>
            </div>

            {/* Auction Bidding Benefit */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold text-xs">
                <span className="p-1.5 rounded-lg bg-[var(--color-gold)]/10 text-[var(--color-gold)]">
                  <Gavel size={16} />
                </span>
                <span>Live Auction Qualification</span>
              </div>
              <p className="text-[11px] text-[var(--color-ivory-muted)] leading-relaxed">
                Assigns your official Public Bidder Number. Standard Bidding is free with R{standardLimit.toLocaleString()} limit, or upgrade to VIP (R{depositAmount.toLocaleString()} refundable deposit, R{premiumLimit.toLocaleString()}+ limit).
              </p>
              <span className="inline-flex items-center gap-1 text-[10px] text-[var(--color-gold)] font-medium">
                <CheckCircle2 size={11} /> Bidding Privileges Included
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="py-2.5 px-5 bg-gold-gradient text-black font-bold uppercase tracking-wider text-xs rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(212,175,55,0.25)]"
            >
              Verify {minAge}+ Identity (Store & Auctions) <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/auction/vip-checkout')}
              className="py-2.5 px-5 bg-white/5 hover:bg-white/10 text-[var(--color-gold)] font-bold uppercase tracking-wider text-xs rounded-xl border border-[var(--color-gold)]/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Crown size={14} /> VIP Auction Deposit (R{depositAmount.toLocaleString()})
            </button>
          </div>
        </div>
      )}

      {/* STATE 2: PENDING APPROVAL */}
      {isPending && (
        <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15 text-xs text-amber-300/80 space-y-2">
          <p className="font-semibold text-amber-300 flex items-center gap-1.5">
            <Clock size={14} /> 18+ Identity Verification Under Review
          </p>
          <p className="leading-relaxed">
            Your 18+ identification document has been submitted and is currently being reviewed by our compliance officers. 
            Once approved, your profile will be permanently pre-cleared for both instant store spirit purchases and live auction bidding (Bidder Number: <strong className="text-white font-mono">{profile.bidderNumber}</strong>).
          </p>
        </div>
      )}

      {/* STATE 3: REJECTED */}
      {isRejected && (
        <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/15 text-xs text-red-300/80 space-y-3">
          <p className="font-semibold text-red-300 flex items-center gap-1.5">
            <AlertCircle size={14} /> 18+ Verification Application Rejected
          </p>
          <p className="leading-relaxed">
            {profile.bidderRejectionReason || 'Your submitted identification documents could not be validated.'}
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            Re-submit 18+ Verification Documents
          </button>
        </div>
      )}

      {/* STATE 4: APPROVED (STANDARD OR VIP) */}
      {isVerified && (
        <div className="space-y-5">
          {/* Active Credentials Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-black/40 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03]">
              <span className="text-emerald-400/80 block text-[9px] uppercase tracking-wider mb-0.5 font-semibold">Store Orders</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1 text-xs">
                <CheckCircle2 size={13} /> {minAge}+ Pre-Cleared
              </span>
              <span className="text-[9px] text-white/40 block mt-0.5">Instant Spirit Checkout</span>
            </div>
            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
              <span className="text-white/40 block text-[9px] uppercase tracking-wider mb-0.5">Bidder Number</span>
              <span className="text-white font-mono font-bold">{profile.bidderNumber}</span>
              <span className="text-[9px] text-white/40 block mt-0.5">Live Auctions Active</span>
            </div>
            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
              <span className="text-white/40 block text-[9px] uppercase tracking-wider mb-0.5">Auction Tier</span>
              <span className="text-white font-semibold capitalize">
                {isVip ? 'VIP Enhanced' : 'Standard Verified'}
              </span>
              <span className="text-[9px] text-[var(--color-gold)] font-mono block mt-0.5">
                Limit: R{(profile.biddingLimit || standardLimit).toLocaleString()}
              </span>
            </div>
            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
              <span className="text-white/40 block text-[9px] uppercase tracking-wider mb-0.5">Refundable Deposit</span>
              <span className={`font-semibold capitalize ${profile.bidderDepositStatus === 'paid' ? 'text-emerald-400' : profile.bidderDepositStatus === 'pending' ? 'text-amber-400' : 'text-white/40'}`}>
                {profile.bidderDepositStatus === 'paid' ? `R${(profile.bidderDepositAmount || depositAmount).toLocaleString()} (Paid)` : profile.bidderDepositStatus === 'pending' ? 'Awaiting Verification' : 'None Required'}
              </span>
              <span className="text-[9px] text-white/40 block mt-0.5">100% Escrow Protected</span>
            </div>
          </div>

          {/* Official ID on Record Banner */}
          {(profile.idType || profile.idNumber) && (
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-white/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-400 shrink-0" />
                <span>
                  Official ID on Record: <strong className="text-white font-mono">{profile.idType || 'National ID'} {profile.idNumber ? `(•••• ${profile.idNumber.slice(-4)})` : ''}</strong> • Legal compliance pre-cleared for all store product purchases and live auctions.
                </span>
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 self-start sm:self-auto shrink-0">
                Active Clearance
              </span>
            </div>
          )}

          {/* UPGRADE CALLOUT BANNER (If currently Standard) */}
          {!isVip && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#c9a35b]/10 via-[#c9a35b]/5 to-transparent border border-[#c9a35b]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-gold)]">
                  <Crown size={14} /> Upgrade to Premium VIP Bidding
                </div>
                <p className="text-[11px] text-white/60 leading-relaxed max-w-lg">
                  Want to bid on reserve, rare & high-value lots? Place an <strong>R{depositAmount.toLocaleString()} security guarantee deposit</strong> to unlock bidding limits up to <strong>R{premiumLimit.toLocaleString()}+</strong>. 
                  <span className="text-emerald-400 block sm:inline sm:ml-1">100% refundable back to your bank account upon request.</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/auction/vip-checkout')}
                className="py-2.5 px-5 rounded-xl bg-gold-gradient text-black font-bold uppercase tracking-wider text-[11px] hover:brightness-110 hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 shadow-[0_0_12px_rgba(212,175,55,0.25)]"
              >
                <Crown size={13} /> Upgrade to VIP (R{depositAmount.toLocaleString()})
              </button>
            </div>
          )}

          {/* VIP CONFIRMATION NOTICE (If VIP) */}
          {isVip && (
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-white/60 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles size={14} className="text-[var(--color-gold)]" />
                <span>You have unlocked full high-value bidding reserves up to R{(profile.biddingLimit || premiumLimit).toLocaleString()} across all Grand Store live auctions and unlimited store purchasing privileges.</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                VIP Clearance
              </span>
            </div>
          )}
        </div>
      )}

      {/* Active Modal */}
      <BidderVerificationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        bidderProfile={profile}
        onSuccess={(updated) => {
          fetchBidderStatus();
          if (onNotify) {
            onNotify('18+ Verification application submitted successfully!');
          }
        }}
        onNotify={onNotify}
      />
    </section>
  );
}
