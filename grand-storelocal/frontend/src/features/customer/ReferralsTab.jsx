import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Copy, Check, Users, Gift, Clock3, MessageCircle, Mail } from 'lucide-react';
import Price from '../../components/ui/Price';
import api from '../../api';

export default function ReferralsTab() {
  const { user, updateUser } = useAuth();
  const [copied, setCopied] = useState(false);
  const [summary, setSummary] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (user?._id) {
      setLoadingProfile(true);
      setLoadError('');
      api.get('/auth/referrals')
        .then((res) => {
          setSummary(res.data);
          updateUser({
            referralCode: res.data.referralCode,
            rewardBalance: res.data.rewardBalance,
            totalReferrals: res.data.successfulReferrals
          });
        })
        .catch((err) => {
          console.error('Failed to fetch referral details:', err);
          setLoadError(err.response?.data?.message || 'Unable to load your referral details.');
        })
        .finally(() => setLoadingProfile(false));
    }
  }, [user?._id]); // Refresh once per signed-in account, not from cached balances.

  const referralCode = summary?.referralCode || user?.referralCode || '';
  const referralLink = referralCode
    ? `${window.location.origin}/register?ref=${encodeURIComponent(referralCode)}`
    : '';

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setLoadError('Your browser blocked clipboard access. Select and copy the link manually.');
    }
  };

  if (!user) return null;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-12 pb-16">
      <section className="mb-4">
        <h1 className="text-[var(--color-ivory)] font-serif text-4xl mb-2 tracking-wide flex items-center gap-3">
          Refer & Earn <Gift className="text-[var(--color-gold)]" size={28} />
        </h1>
        <p className="text-[var(--color-ivory-muted)] text-md font-light">
          Share your referral link with friends. When they make their first purchase, you receive <strong className="text-[var(--color-gold)]">R{summary?.program?.rewardAmount || 50}</strong> store credit directly to your account!
        </p>
      </section>

      <section>
        <div className="bg-[#111] border border-white/10 rounded-xl p-6 lg:p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-gold)]/5 rounded-full blur-3xl"></div>
          
          <h2 className="text-xl text-[var(--color-ivory)] font-serif mb-6 border-b border-white/10 pb-2 relative z-10">
            Your Referral Link
          </h2>
          
          <div className="flex flex-col sm:flex-row items-stretch gap-4 relative z-10 mb-4">
            <div className="flex-1 bg-black/50 border border-white/20 rounded-lg px-4 py-3 flex items-center overflow-hidden">
              <span className="text-[var(--color-ivory-muted)] font-mono text-sm whitespace-nowrap overflow-x-auto select-all">
                {referralLink || (loadingProfile ? 'Loading your link…' : 'Referral link unavailable')}
              </span>
            </div>
            <button 
              onClick={handleCopy}
              disabled={!referralLink}
              className="flex items-center justify-center gap-2 bg-[var(--color-gold)] text-black px-6 py-3 rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-[#b58b38] transition-colors whitespace-nowrap"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>

          <div className="flex items-center gap-3 relative z-10 mb-8">
            <span className="text-xs text-[var(--color-ivory-muted)] uppercase tracking-widest mr-2">Share:</span>
            <a 
              href={`https://wa.me/?text=${encodeURIComponent('Discover exceptional fine wines, spirits, and rare cellar vintages at The Grand Store! Join using my referral link: ' + referralLink)}`} 
              target="_blank" rel="noopener noreferrer" 
              className="w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/70 hover:bg-[var(--color-gold)] hover:text-black hover:border-[var(--color-gold)] transition-all"
              title="Share on WhatsApp"
            >
              <MessageCircle size={18} />
            </a>
            <a 
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Discover exceptional fine wines & spirits at The Grand Store! Join using my link: ')}&url=${encodeURIComponent(referralLink)}`} 
              target="_blank" rel="noopener noreferrer" 
              className="w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/70 hover:bg-[var(--color-gold)] hover:text-black hover:border-[var(--color-gold)] transition-all font-bold font-serif"
              title="Share on X (Twitter)"
            >
              X
            </a>
            <a 
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`} 
              target="_blank" rel="noopener noreferrer" 
              className="w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/70 hover:bg-[var(--color-gold)] hover:text-black hover:border-[var(--color-gold)] transition-all font-bold font-serif"
              title="Share on Facebook"
            >
              f
            </a>
            <a 
              href={`mailto:?subject=${encodeURIComponent('Exclusive Invitation to The Grand Store')}&body=${encodeURIComponent('Hi,\n\nI invite you to explore South Africa’s premier destination for luxury wines and rare spirits. Sign up using my referral link:\n\n' + referralLink)}`} 
              className="w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white/70 hover:bg-[var(--color-gold)] hover:text-black hover:border-[var(--color-gold)] transition-all"
              title="Share via Email"
            >
              <Mail size={18} />
            </a>
          </div>

          {loadError && <p className="mb-5 text-sm text-red-400 relative z-10">{loadError}</p>}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 relative z-10">
            <div className="bg-black/60 border border-[var(--color-gold)]/20 p-4 sm:p-6 rounded-xl text-center col-span-1 order-2 sm:order-1">
              <Users className="text-[var(--color-gold)] mx-auto mb-2 sm:mb-3" size={20} />
              <p className="text-[10px] sm:text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">Friends Invited</p>
              <p className="text-2xl sm:text-3xl font-serif text-white">{summary?.totalSignups ?? 0}</p>
            </div>
            <div className="bg-black/60 border border-[var(--color-gold)]/20 p-4 sm:p-6 rounded-xl text-center col-span-1 order-3 sm:order-2">
              <Check className="text-green-400 mx-auto mb-2 sm:mb-3" size={20} />
              <p className="text-[10px] sm:text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">Rewarded Friends</p>
              <p className="text-2xl sm:text-3xl font-serif text-white">
                {summary?.successfulReferrals ?? user.totalReferrals ?? 0}
                {summary?.program?.maxRewardedUsers ? (
                  <span className="text-sm font-sans text-white/40 ml-1">/ {summary.program.maxRewardedUsers}</span>
                ) : null}
              </p>
              <span className="text-[10px] text-emerald-400 font-mono block mt-0.5">1st Purchase Verified</span>
            </div>
            <div className="bg-gradient-to-b from-[var(--color-gold)]/10 to-black/60 border border-[var(--color-gold)]/40 p-5 sm:p-6 rounded-xl text-center col-span-2 sm:col-span-1 order-1 sm:order-3 flex flex-col justify-center">
              <Gift className="text-[var(--color-gold)] mx-auto mb-2 sm:mb-3" size={24} />
              <p className="text-[11px] sm:text-xs uppercase tracking-widest text-[var(--color-ivory)] mb-1 font-bold">Reward Balance</p>
              <p className="text-3xl sm:text-4xl font-serif text-[#dfbd72]">
                <Price amount={summary?.rewardBalance ?? user.rewardBalance ?? 0} />
              </p>
              <p className="text-[10px] text-white/40 mt-1">Ready to apply at checkout</p>
            </div>
          </div>
        </div>
      </section>

      {summary?.program && (
        <section className="bg-[#111] border border-white/10 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-xl text-[var(--color-ivory)] font-serif">Referral Program Rules</h2>
            <span className="text-xs uppercase font-mono tracking-widest text-[var(--color-gold)] bg-[var(--color-gold)]/10 px-2.5 py-1 rounded-full border border-[var(--color-gold)]/20">
              Active Policy
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="bg-black/40 rounded-lg p-4 border border-white/5">
              <p className="text-white/50 text-xs uppercase tracking-widest mb-1.5 font-semibold">Your Referral Reward</p>
              <p className="text-white font-medium">
                {summary.program.rewardType === 'percentage'
                  ? `${summary.program.rewardAmount}% of the friend's first paid order`
                  : <><Price amount={summary.program.rewardAmount} /> store credit when friend completes 1st order</>}
              </p>
              <p className="text-xs text-white/40 mt-1">
                Credited directly to your wallet balance once your friend's payment is confirmed.
              </p>
            </div>
            <div className="bg-black/40 rounded-lg p-4 border border-white/5">
              <p className="text-white/50 text-xs uppercase tracking-widest mb-1.5 font-semibold">Reward Cap Per Referrer</p>
              <p className="text-white font-medium">
                {summary.program.maxRewardedUsers > 0 
                  ? `Up to ${summary.program.maxRewardedUsers} friends (Max R${summary.program.maxRewardedUsers * (summary.program.rewardAmount || 50)} rewards)`
                  : 'Unlimited friends (No reward cap)'}
              </p>
              <p className="text-xs text-white/40 mt-1">
                {summary.program.maxRewardedUsers > 0 
                  ? `You can earn R${summary.program.rewardAmount || 50} for each of your first ${summary.program.maxRewardedUsers} qualifying friends.`
                  : 'Earn for every friend who makes their first purchase.'}
              </p>
            </div>
          </div>
        </section>
      )}

      {summary?.referrals?.length > 0 && (
        <section>
          <h2 className="text-xl text-[var(--color-ivory)] font-serif mb-5 border-b border-white/10 pb-2">Recent Referrals</h2>
          <div className="overflow-hidden border border-white/10 rounded-xl">
            {summary.referrals.map((referral) => (
              <div key={referral.id} className="flex items-center justify-between gap-4 px-5 py-4 bg-[#111] border-b border-white/5 last:border-b-0">
                <div>
                  <p className="text-white text-sm">{referral.name}</p>
                  <p className="text-white/40 text-xs mt-1">Joined {new Date(referral.joinedAt).toLocaleDateString()}</p>
                </div>
                <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${referral.status === 'successful' ? 'text-green-400' : 'text-amber-300'}`}>
                  {referral.status === 'successful' ? <Check size={14} /> : <Clock3 size={14} />}
                  {referral.status === 'successful' ? '1st Order Paid' : 'Pending 1st Order'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl text-[var(--color-ivory)] font-serif mb-6 border-b border-white/10 pb-2">
          How it Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-3 bg-white/[0.02] p-5 rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-full bg-[var(--color-gold)]/10 text-[var(--color-gold)] flex items-center justify-center text-xl font-serif">1</div>
            <h3 className="text-white font-serif text-base">Share Your Link</h3>
            <p className="text-xs text-[var(--color-ivory-muted)] leading-relaxed">Send your unique referral link to friends and fellow fine wine lovers.</p>
          </div>
          <div className="space-y-3 bg-white/[0.02] p-5 rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-full bg-[var(--color-gold)]/10 text-[var(--color-gold)] flex items-center justify-center text-xl font-serif">2</div>
            <h3 className="text-white font-serif text-base">Friend's First Order</h3>
            <p className="text-xs text-[var(--color-ivory-muted)] leading-relaxed">Your friend signs up and completes their first paid purchase on The Grand Store.</p>
          </div>
          <div className="space-y-3 bg-white/[0.02] p-5 rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-full bg-[var(--color-gold)]/10 text-[var(--color-gold)] flex items-center justify-center text-xl font-serif">3</div>
            <h3 className="text-white font-serif text-base">You Get R50 Credit</h3>
            <p className="text-xs text-[var(--color-ivory-muted)] leading-relaxed">Your reward balance is credited with R50 immediately upon order payment verification!</p>
          </div>
        </div>
      </section>

    </div>
  );
}
