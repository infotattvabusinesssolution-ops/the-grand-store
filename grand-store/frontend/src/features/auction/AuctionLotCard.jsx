import { useProducts } from '../../context/ProductContext'
import React, { useState, useEffect, useRef } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronRight, ChevronLeft, ShoppingBag, ArrowRight, Minus, Plus, Trash2, Heart, ZoomIn, CheckCircle2, Truck, RotateCcw, ShieldCheck, Mail, MessageCircle, Share2, X, Gift, SlidersHorizontal, Grid3X3, GitCompareArrows, MapPin, Calendar, Clock, CreditCard, Droplets } from 'lucide-react';
import { useWishlist } from '../../wishlistContext';
import ProductCard from '../../components/ProductCard';
import AuctionCountdown from './AuctionCountdown';
import Price from '../../components/ui/Price';
import { getAuctionPhase, getAuctionTargetTime } from './auctionPhase';

export default function AuctionLotCard({ lot, endTime, now, saved, onSave, onBid }) {
  const { products } = useProducts();
  const vendorName = lot.vendor ? (lot.vendor.storeName || lot.vendor.name) : 'The Grand Store';
  const phase = lot.displayStatus || getAuctionPhase(lot, now);
  const isUpcoming = phase === 'upcoming';
  const targetTime = getAuctionTargetTime(lot, now);

  return (
    <article className="bg-[#111] border border-white/[0.05] rounded-xl overflow-hidden flex flex-col hover:border-[var(--color-gold)]/50 transition-colors duration-300 shadow-xl group">
      <div className="relative h-64 bg-black/40 flex items-center justify-center p-6 border-b border-white/[0.05]">
        <img src={lot.images && lot.images[0] ? lot.images[0] : '/assets/auction/hibiki-17.jpeg'} alt={lot.title} loading="lazy" className="max-h-full object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
        
        {isUpcoming ? (
          <span className="absolute top-4 left-4 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded backdrop-blur-md">Upcoming</span>
        ) : (
          <span className="absolute top-4 left-4 bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded backdrop-blur-md">Live Auction</span>
        )}

        <div className="absolute top-4 right-4 flex items-center gap-1.5 z-10">
          {lot.videoUrl && (
            <span className="bg-black/80 text-[#e1bd70] border border-[#e1bd70]/40 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded backdrop-blur-md flex items-center gap-1 shadow">
              ▶ Video
            </span>
          )}
          {lot.images && lot.images.length > 1 && (
            <span className="bg-black/80 text-white/80 border border-white/10 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded backdrop-blur-md shadow">
              📷 {lot.images.length}
            </span>
          )}
        </div>
        
        <div className="absolute bottom-4 left-4 text-[10px] font-bold tracking-widest text-[var(--color-ivory)] uppercase bg-black/60 px-3 py-1.5 rounded backdrop-blur-md border border-white/10">Lot {lot.lotNumber}</div>
      </div>
      
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-xl font-serif text-[var(--color-ivory)] leading-tight mb-2">{lot.title}</h3>
        <p className="text-[var(--color-ivory-muted)] text-sm mb-5 line-clamp-2 font-light leading-relaxed">{lot.description}</p>
        
        <div className="text-[11px] text-[var(--color-ivory-muted)] mb-6 flex flex-col gap-2 bg-white/[0.02] p-4 rounded-lg border border-white/[0.02]">
          <div className="flex justify-between items-center pb-2 border-b border-white/[0.05]">
             <span className="uppercase tracking-widest opacity-70">Condition</span> 
             <span className="text-[var(--color-ivory)] font-medium text-right max-w-[60%] truncate">{lot.condition}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-white/[0.05]">
             <span className="uppercase tracking-widest opacity-70">Provenance</span> 
             <span className="text-[var(--color-ivory)] font-medium text-right max-w-[60%] truncate">{lot.provenance}</span>
          </div>
          <div className="flex justify-between items-center">
             <span className="uppercase tracking-widest opacity-70">Offered by</span> 
             <span className="text-gold-gradient font-medium">{vendorName}</span>
          </div>
        </div>

        <div className="mt-auto">
          <div className="flex justify-between items-end mb-5">
            {isUpcoming ? (
              <div className="w-full">
                <div className="text-[9px] uppercase tracking-widest text-blue-400 mb-1 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  {lot.estimatedValueMin ? 'Estimated Valuation' : 'Starting Price'}
                </div>
                <div className="text-xl font-serif font-bold text-gold-gradient flex items-center flex-wrap gap-1.5 whitespace-nowrap">
                  {lot.estimatedValueMin ? (
                    <>
                      <Price amount={lot.estimatedValueMin} />
                      {lot.estimatedValueMax && lot.estimatedValueMax !== lot.estimatedValueMin && (
                        <>
                          <span className="text-white/30 font-light">–</span>
                          <Price amount={lot.estimatedValueMax} />
                        </>
                      )}
                    </>
                  ) : (
                    <Price amount={lot.startingBid || 0} />
                  )}
                </div>
                {lot.estimatedValueMin && lot.startingBid && (
                  <div className="text-[10px] text-[var(--color-ivory-muted)] mt-1 font-light">
                    Starting Valuation: <span className="text-white font-medium"><Price amount={lot.startingBid} /></span>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div>
                  <div className="text-[9px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1 font-semibold">Starting Bid</div>
                  <div className="text-sm font-serif opacity-70 line-through decoration-white/20 flex items-center whitespace-nowrap">
                    <Price amount={lot.startingBid || 0} />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-widest text-[#c9a35b] mb-1 font-semibold">
                    {lot.currentBid && lot.currentBid > 0 ? 'Current Bid' : 'Starting Bid'}
                  </div>
                  <div className="text-xl font-serif font-bold text-[#c9a35b] flex items-center justify-end whitespace-nowrap">
                    <Price amount={lot.currentBid || lot.startingBid || 0} />
                  </div>
                </div>
              </>
            )}
          </div>
          
          <div className={`flex items-center justify-between mb-5 ${isUpcoming ? 'bg-blue-500/5 border-blue-500/10' : 'bg-red-500/5 border-red-500/10'} p-3 rounded-lg border`}>
            <span className={`text-[10px] uppercase tracking-widest ${isUpcoming ? 'text-blue-400' : 'text-red-400'} font-semibold flex items-center gap-2`}><Clock size={12} /> {isUpcoming ? 'Starts In' : 'Ends In'}</span>
            <div className={`text-sm font-mono font-medium ${isUpcoming ? 'text-blue-400' : 'text-red-400'} tracking-wider`}><AuctionCountdown endTime={targetTime} now={now} compact /></div>
          </div>

          <Link className="w-full py-4 rounded-lg text-center text-[11px] font-bold uppercase tracking-widest text-black hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all block bg-gold-gradient" to={`/auction/${lot._id}`}>
             {isUpcoming ? 'View Details' : 'Place Bid'} <ArrowRight size={14} className="inline-block ml-2 -mt-0.5" />
          </Link>
        </div>
      </div>
    </article>
  )
}
