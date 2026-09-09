import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, ShieldCheck, Gift, CircleUserRound, GitCompareArrows, ChevronLeft } from 'lucide-react';
import api from '../../api';
import AuctionLotCard from './AuctionLotCard';
import AuctionCountdown from './AuctionCountdown';
import LuxuryAuctionHero from './LuxuryAuctionHero';
import Price from '../../components/ui/Price';
import SEO from '../../components/SEO';
import { getAuctionPhase, isPastAuctionPhase } from './auctionPhase';

export default function AuctionPage({ onNotify }) {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [now, setNow] = useState(() => Date.now());
  const [filters, setFilters] = useState({ search: '', category: 'all', price: 'all', ending: 'all' });
  const [appliedFilters, setAppliedFilters] = useState(filters);

  const fetchLots = async () => {
    try {
      const res = await api.get(`/auction`);
      setLots(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Rare Whisky Auctions — The Grand Store';
    window.scrollTo({ top: 0, behavior: 'auto' });
    
    // Timer for UI ticking
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    
    fetchLots();
    const interval = setInterval(fetchLots, 5000);

    return () => {
      window.clearInterval(timer);
      clearInterval(interval);
      document.title = 'The Grand Store — Luxury Wines & Spirits';
    }
  }, []);

  const displayLots = lots.map((lot) => ({ ...lot, displayStatus: getAuctionPhase(lot, now) }));

  const visibleLots = displayLots.filter((lot) => {
    const matchesSearch = `${lot.title} ${lot.lotNumber}`.toLowerCase().includes(appliedFilters.search.trim().toLowerCase());
    const matchesCategory = appliedFilters.category === 'all' || lot.category === appliedFilters.category;
    const matchesPrice = appliedFilters.price === 'all'
      || (appliedFilters.price === 'under-10000' ? lot.currentBid < 10000 : lot.currentBid >= 10000);
    const remainingDays = (new Date(lot.endDate).getTime() - now) / 86400000;
    const matchesEnding = appliedFilters.ending === 'all' || remainingDays < 5;
    return matchesSearch && matchesCategory && matchesPrice && matchesEnding && (lot.displayStatus === 'live' || lot.displayStatus === 'upcoming');
  });

  const pastLots = displayLots.filter((lot) => isPastAuctionPhase(lot.displayStatus));

  const steps = [
    ['Become a member', 'Create a complimentary account and join a private community of collectors.'],
    ['Place your bid', 'Bid with confidence through a clear, secure and carefully monitored process.'],
    ['Winning the lot', 'Successful bidders receive confirmation and collection guidance immediately.'],
    ['Grow your collection', 'Discover rare, vintage and limited releases selected for lasting significance.'],
  ];

  if (loading) {
     return <div className="min-h-screen flex items-center justify-center text-white">Loading Auctions...</div>;
  }

  // Get top 3 live lots to feature in the hero section
  const heroLots = visibleLots.slice(0, 3);

  const auctionPageSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': 'https://grandstoreglobal.com/auction#webpage',
        url: 'https://grandstoreglobal.com/auction',
        name: 'Rare Whisky & Wine Auctions | The Grand Store Luxury Vault',
        description: 'Bid on authenticated rare single malts, collectible spirits, and investment-grade fine wines in The Grand Store Luxury Auction Vault.',
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: visibleLots.slice(0, 10).map((lot, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            url: `https://grandstoreglobal.com/auction/${lot._id}`,
            name: lot.title
          }))
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
            name: 'Rare Auctions',
            item: 'https://grandstoreglobal.com/auction'
          }
        ]
      }
    ]
  };

  return (
    <main className="auction-page min-h-screen bg-[#050505] text-[#eee8dd] relative">
      <SEO
        title="Rare Whisky & Wine Auctions | The Grand Store Luxury Vault"
        description="Explore live auctions for rare single malts, collectible spirits, and vintage investment wines with certified provenance and white-glove security."
        canonical="https://grandstoreglobal.com/auction"
        ogType="website"
        schema={auctionPageSchema}
      />
      <div className="w-full max-w-7xl mx-auto px-6 absolute top-6 left-0 right-0 z-50 pointer-events-none flex justify-start">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#c9a35b] hover:bg-[#e1bd70] text-black !text-black rounded-full shadow-[0_4px_20px_rgba(201,163,91,0.4)] transition-all duration-300 font-bold uppercase tracking-widest text-xs pointer-events-auto w-max"
          title="Back to Home"
        >
          <ChevronLeft size={16} />
          Back to Home
        </Link>
      </div>
      <LuxuryAuctionHero lots={heroLots} now={now} onNotify={onNotify} onRefresh={fetchLots} />

      <section className="auction-catalogue py-24 bg-[#050505] border-t border-white/[0.05]" id="current-auctions" aria-labelledby="current-auctions-title">
        <div className="shell max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gold-gradient font-bold mb-2">Live catalogue</p>
              <h2 id="current-auctions-title" className="text-4xl md:text-5xl font-serif text-[var(--color-ivory)]">Current Auctions</h2>
            </div>
            <p className="text-[var(--color-ivory-muted)] text-sm md:text-base max-w-md font-light leading-relaxed">
              Explore rare single malts, iconic releases and investment-grade bottles selected for serious collectors.
            </p>
          </div>
          
          <form className="flex flex-col md:flex-row gap-4 mb-12 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.05]" onSubmit={(event) => { event.preventDefault(); setAppliedFilters(filters) }}>
            <label className="flex-1 flex items-center gap-3 bg-black/40 border border-white/[0.05] rounded-xl px-4 py-3">
              <Search size={16} className="text-gold-gradient" />
              <input className="bg-transparent text-sm text-[var(--color-ivory)] w-full focus:outline-none placeholder-white/30" value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Search whisky, distillery or lot" aria-label="Search auction lots" />
            </label>
            <select className="bg-black/40 border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-[var(--color-ivory)] focus:outline-none focus:border-[var(--color-gold)]/50 [color-scheme:dark]" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })} aria-label="Category">
               <option value="all">All categories</option>
               <option>Whisky</option>
               <option>Wine</option>
               <option>Spirits</option>
            </select>
            <select className="bg-black/40 border border-white/[0.05] rounded-xl px-4 py-3 text-sm text-[var(--color-ivory)] focus:outline-none focus:border-[var(--color-gold)]/50 [color-scheme:dark]" value={filters.price} onChange={(event) => setFilters({ ...filters, price: event.target.value })} aria-label="Price range">
               <option value="all">All price ranges</option>
               <option value="under-10000">Under R 10,000</option>
               <option value="over-10000">R 10,000 and above</option>
            </select>
            <button className="bg-gold-gradient text-black font-bold uppercase tracking-widest text-[10px] px-8 py-3 rounded-xl hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-shadow" type="submit">Apply</button>
          </form>
          
          {visibleLots.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {visibleLots.map((lot) => <AuctionLotCard lot={lot} endTime={new Date(lot.endDate).getTime()} now={now} key={lot._id} />)}
            </div>
          ) : (
            <div className="py-24 text-center flex flex-col items-center bg-white/[0.01] rounded-3xl border border-white/[0.02]">
              <h3 className="text-2xl font-serif text-[var(--color-ivory)] mb-4">No lots match your selection.</h3>
              <button className="text-xs uppercase tracking-widest text-gold-gradient border-b border-[var(--color-gold)] pb-1 hover:opacity-70 transition-opacity" type="button" onClick={() => { const reset = { search: '', category: 'all', price: 'all', ending: 'all' }; setFilters(reset); setAppliedFilters(reset) }}>Clear filters</button>
            </div>
          )}
        </div>
      </section>

      <section className="past-auctions section" aria-labelledby="past-auctions-title">
        <div className="shell">
           <div className="auction-section-heading"><div><p className="eyebrow">Previous results</p><h2 id="past-auctions-title">Past Auctions</h2></div></div>
           <div className="past-auction-grid">
              {pastLots.map((lot) => (
                 <article key={lot._id} className="relative group block">
                   <Link to={`/auction/${lot._id}`} className="absolute inset-0 z-10">
                     <span className="sr-only">View Lot Details</span>
                   </Link>
                   <div>
                     <img src={lot.images && lot.images[0] ? lot.images[0] : '/assets/auction/hibiki-17.jpeg'} alt={lot.title} loading="lazy" className="group-hover:scale-105 transition-transform duration-500" />
                     <span>Auction ended</span>
                   </div>
                   <section>
                     <h3 className="group-hover:text-gold-gradient transition-colors">{lot.title}</h3>
                     <dl className="mt-4 space-y-2">
                       <div className="flex justify-between text-sm"><dt className="text-[var(--color-ivory-muted)]">Base Price</dt><dd className="font-serif"><Price amount={(lot.startingBid || 0).toLocaleString('en-ZA')} /></dd></div>
                       <div className="flex justify-between text-sm"><dt className="text-[var(--color-ivory-muted)]">Highest Bid</dt><dd className="font-serif text-black font-bold"><Price amount={(lot.winningBid || lot.currentBid || 0).toLocaleString('en-ZA')} /></dd></div>
                       <div className="flex justify-between text-sm"><dt className="text-[var(--color-ivory-muted)]">Winner</dt><dd className="font-serif">{lot.winner ? lot.winner.name : (lot.status === 'unsold' ? 'Unsold' : 'TBD')}</dd></div>
                     </dl>
                   </section>
                 </article>
              ))}
           </div>
        </div>
      </section>
      
      <section className="auction-process section">
         <div className="shell">
           <div className="auction-section-heading"><div><p className="eyebrow">Simple & secure</p><h2>Your Path to Premium Bottles</h2></div></div>
           <div className="auction-step-grid">
              {steps.map(([title, text], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{text}</p></article>)}
           </div>
         </div>
      </section>

    </main>
  )
}
