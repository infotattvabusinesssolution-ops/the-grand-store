import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { ArrowRight, Clock, ShieldCheck, ChevronDown, Check } from 'lucide-react';
import AuctionCountdown from './AuctionCountdown';
import { getAuctionPhase, getAuctionTargetTime } from './auctionPhase';
import Price from '../../components/ui/Price';
import { useCurrency, getCountryForCurrency, CURRENCY_SYMBOLS, ZERO_DECIMAL_CURRENCIES } from '../../context/CurrencyContext';
import { CountryFlag } from '../../components/CountryCodeSelect';

export default function LuxuryAuctionHero({ lots, now, onNotify, onRefresh }) {
  if (!lots || lots.length === 0) return null;

  const handleScrollToGrid = () => {
    document.getElementById('current-auctions')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative w-full bg-[#050505]">
      {lots.map((lot, index) => (
        <LuxuryAuctionSlide 
          key={lot._id} 
          lot={lot} 
          now={now} 
          index={index}
          total={lots.length}
          onNotify={onNotify}
          onRefresh={onRefresh}
        />
      ))}
      
      {/* Global View All button at the bottom of the hero sections */}
      <div className="absolute bottom-10 left-0 w-full flex justify-center z-50 pointer-events-none">
        <button 
          onClick={handleScrollToGrid}
          className="pointer-events-auto flex flex-col items-center gap-2 text-[var(--color-ivory-muted)] hover:text-gold-gradient transition-colors group"
        >
          <span className="text-[10px] uppercase tracking-widest font-bold">View All Auctions</span>
          <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-black/50 backdrop-blur-md group-hover:border-[var(--color-gold)]/50 transition-colors">
            <ChevronDown size={18} className="animate-bounce" />
          </div>
        </button>
      </div>
    </div>
  );
}

function LuxuryAuctionSlide({ lot, now, index, total, onNotify, onRefresh }) {
  const { currency, rates, changeCurrency, availableCurrencies } = useCurrency();
  const [bidAmount, setBidAmount] = useState('');
  const [isMaxBid, setIsMaxBid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  
  const phase = lot.displayStatus || getAuctionPhase(lot, now);
  const isUpcoming = phase === 'upcoming';
  const targetTime = getAuctionTargetTime(lot, now);
  const nextMinimumZar = lot.currentBid === 0 ? lot.startingBid : lot.currentBid + (lot.bidIncrement || 50);
  const vendorName = lot.vendor ? (lot.vendor.storeName || lot.vendor.name) : 'The Grand Store';

  // Dynamic currency conversion helpers
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

  // Next minimum bid converted to user's selected currency
  const nextMinimumInCurrency = currency === 'ZAR'
    ? nextMinimumZar
    : Math.ceil(convertFromZar(nextMinimumZar, currency) * 100) / 100;

  // Live converted ZAR reference for entered amount
  const enteredNum = parseFloat(bidAmount);
  const estimatedZar = !isNaN(enteredNum) && enteredNum > 0
    ? Math.round(convertToZar(enteredNum, currency))
    : null;

  const submitBid = async (e) => {
    e.preventDefault();
    const enteredAmt = Number(bidAmount);
    
    if (isNaN(enteredAmt) || enteredAmt <= 0) {
      onNotify('Please enter a valid bid amount.');
      return;
    }

    const amtInZar = Math.round(convertToZar(enteredAmt, currency));

    if (amtInZar < nextMinimumZar) {
      const minStr = `${activeSymbol} ${nextMinimumInCurrency.toLocaleString(undefined, { minimumFractionDigits: currency === 'ZAR' ? 0 : 2, maximumFractionDigits: 2 })}`;
      onNotify(`Your bid must be at least ${minStr} (≈ R${nextMinimumZar.toLocaleString('en-ZA')})`);
      return;
    }
    
    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    const token = userInfo?.token;
    if (!token) {
      onNotify('You must be logged in to place a bid.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post(`/auction/${lot._id}/bid`, {
        amount: amtInZar,
        isMaxBid,
        placedCurrency: currency,
        placedAmount: enteredAmt
      });
      
      onNotify(res.data.message || 'Bid placed successfully!');
      setBidAmount('');
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
      onNotify(err.response?.data?.message || 'Failed to place bid');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full sticky top-0 overflow-hidden flex items-center justify-center bg-[#050505] border-b border-white/[0.02]">
      {/* Abstract Background Glows */}
      <div className="absolute top-1/4 -left-1/4 w-[50%] h-[50%] rounded-full bg-[var(--color-gold)]/5 blur-[150px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-1/4 -right-1/4 w-[50%] h-[50%] rounded-full bg-red-500/5 blur-[150px] mix-blend-screen pointer-events-none" />
      
      <div className="w-full max-w-[1400px] mx-auto px-6 py-24 flex flex-col lg:flex-row items-center gap-12 lg:gap-24 relative z-10">
        
        {/* Left: Product Image */}
        <div className="flex-1 w-full flex items-center justify-center relative">
          <div className="relative w-full max-w-lg aspect-[3/4] flex items-center justify-center">
            {/* Elegant framing */}
            <div className="absolute inset-0 border border-white/[0.05] rounded-[2rem] transform -rotate-3 transition-transform duration-700 hover:rotate-0" />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/80 to-transparent rounded-[2rem] z-10" />
            <img 
              src={lot.images && lot.images[0] ? lot.images[0] : '/assets/auction/macallan-25.png'} 
              alt={lot.title} 
              className="max-h-[90%] max-w-[90%] object-contain z-20 drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
            />
            
            <div className="absolute top-8 left-8 z-30 flex flex-col gap-2">
              <span className={`${isUpcoming ? 'bg-blue-600/90 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.45)]' : 'bg-red-600/90 border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]'} backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border`}>
                {isUpcoming ? 'Upcoming Auction' : 'Live Auction'}
              </span>
              <span className="bg-black/60 backdrop-blur-md text-[var(--color-ivory)] text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10">
                Lot {lot.lotNumber}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Auction Details & Bidding Console */}
        <div className="flex-1 w-full flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-4">
             <div className="h-px w-12 bg-gold-gradient" />
             <span className="text-gold-gradient text-[10px] uppercase tracking-widest font-bold">Featured Collection {index + 1}/{total}</span>
          </div>
          
          <h2 className="text-5xl lg:text-7xl font-serif text-[var(--color-ivory)] leading-[1.1] mb-6">
            {lot.title}
          </h2>
          
          <p className="text-[var(--color-ivory-muted)] text-lg font-light leading-relaxed mb-8 max-w-xl">
            {lot.description}
          </p>

          <div className="grid grid-cols-2 gap-4 mb-10 max-w-xl">
             <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-2xl backdrop-blur-md">
                <p className="text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1 opacity-60">Provenance</p>
                <p className="text-sm font-medium text-[var(--color-ivory)] truncate">{lot.provenance}</p>
             </div>
             <div className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-2xl backdrop-blur-md">
                <p className="text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1 opacity-60">Offered By</p>
                <p className="text-sm font-medium text-gold-gradient truncate">{vendorName}</p>
             </div>
          </div>

          {/* Bidding Console */}
          <div className="bg-black/40 backdrop-blur-2xl border border-white/10 p-8 rounded-[2rem] max-w-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 pb-8 border-b border-white/[0.05]">
                <div>
                   <p className="text-[10px] uppercase tracking-widest text-gold-gradient mb-2 font-bold flex items-center gap-2">
                     <span className={`w-1.5 h-1.5 rounded-full ${isUpcoming ? 'bg-blue-500' : 'bg-red-500 animate-pulse'}`} /> 
                     {isUpcoming 
                       ? (lot.estimatedValueMin ? 'Estimated Valuation' : 'Starting Price') 
                       : (lot.currentBid > 0 ? 'Current Bid' : 'Starting Bid')}
                   </p>
                   <div className="text-3xl md:text-5xl font-serif font-bold text-[var(--color-ivory)] flex items-center flex-wrap gap-2">
                     {isUpcoming && lot.estimatedValueMin ? (
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
                       <Price amount={lot.currentBid || lot.startingBid || 0} />
                     )}
                   </div>
                   {isUpcoming && lot.estimatedValueMin && lot.startingBid && (
                     <p className="text-xs text-[var(--color-ivory-muted)] mt-1 font-light">
                       Opening Bid: <span className="text-white font-medium"><Price amount={lot.startingBid} /></span>
                     </p>
                   )}
                </div>
               <div className="text-left sm:text-right">
                  <p className="text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2 font-bold flex items-center sm:justify-end gap-2">
                    <Clock size={12} className={isUpcoming ? 'text-blue-400' : 'text-red-400'} /> {isUpcoming ? 'Starts In' : 'Ends In'}
                  </p>
                  <div className={`text-xl font-mono ${isUpcoming ? 'text-blue-400' : 'text-red-400'} tracking-wider`}>
                    <AuctionCountdown endTime={targetTime} now={now} compact={true} />
                  </div>
               </div>
            </div>

            {isUpcoming ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <p className="text-sm text-[var(--color-ivory-muted)]">Bidding opens automatically when the countdown reaches zero.</p>
                <Link to={`/auction/${lot._id}`} className="bg-gold-gradient text-black font-bold uppercase tracking-widest text-xs px-7 py-4 rounded-2xl whitespace-nowrap">
                  View Details
                </Link>
              </div>
            ) : (
            <form onSubmit={submitBid} className="flex flex-col gap-4">
               <div className="flex flex-col gap-2">
                 <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                   <div className="relative flex-1">
                      {/* Currency Selector Pill */}
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 z-20 flex items-center">
                        <button
                          type="button"
                          onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
                          className="flex items-center gap-1.5 bg-black/80 hover:bg-white/10 border border-white/20 hover:border-[var(--color-gold)]/60 px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold text-[#f5d77f] transition-all cursor-pointer shadow-md"
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
                          <div className="absolute top-full left-0 mt-2 w-48 bg-[#12110e] border border-[#c9a35b]/40 rounded-2xl shadow-2xl py-2 z-50 max-h-56 overflow-y-auto scrollbar-thin">
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
                        onChange={e => setBidAmount(e.target.value)}
                        placeholder={`Min: ${nextMinimumInCurrency.toLocaleString(undefined, { minimumFractionDigits: currency === 'ZAR' || ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2, maximumFractionDigits: currency === 'ZAR' || ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2 })}`}
                        min={nextMinimumInCurrency}
                        step={currency === 'ZAR' || ZERO_DECIMAL_CURRENCIES.has(currency) ? "1" : "0.01"}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-32 pr-6 text-lg font-mono text-[var(--color-ivory)] focus:outline-none focus:border-[var(--color-gold)] transition-colors placeholder-white/20"
                      />
                   </div>
                   <button 
                     disabled={submitting}
                     className="bg-gold-gradient text-black font-bold uppercase tracking-widest text-xs px-8 py-4 rounded-2xl hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 whitespace-nowrap cursor-pointer shrink-0"
                   >
                     {submitting ? 'Placing...' : 'Place Bid'} <ArrowRight size={14} />
                   </button>
                 </div>

                 {/* Live Converted ZAR Reference if not bidding in ZAR */}
                 {currency !== 'ZAR' && (
                   <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-xs font-mono text-white/50">
                     <span>
                       {estimatedZar ? (
                         <span className="text-[var(--color-gold)] font-semibold">
                           ≈ R {estimatedZar.toLocaleString('en-ZA')} ZAR
                         </span>
                       ) : (
                         <span>Next min in ZAR: R {nextMinimumZar.toLocaleString('en-ZA')}</span>
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
                    <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors ${isMaxBid ? 'bg-gold-gradient border-[var(--color-gold)]' : 'border-white/20 group-hover:border-white/40'}`}>
                      {isMaxBid && <Check size={10} className="text-black" />}
                    </div>
                    <input type="checkbox" className="hidden" checked={isMaxBid} onChange={(e) => setIsMaxBid(e.target.checked)} />
                    <span className="text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] font-medium">Set as Maximum Bid</span>
                 </label>
                 
                 <Link to={`/auction/${lot._id}`} className="text-[10px] uppercase tracking-widest text-[var(--color-gold)] hover:text-white transition-colors underline underline-offset-4">
                   View Full Details
                 </Link>
               </div>
            </form>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
