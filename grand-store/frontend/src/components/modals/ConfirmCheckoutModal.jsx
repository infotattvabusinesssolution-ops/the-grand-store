import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, ShoppingBag, CreditCard, ArrowRight, ShieldCheck, 
  Sparkles, Plus, Minus, Check, Truck 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Price from '../ui/Price';
import { useGeoLocation } from '../../context/LocationContext';
import { resolveImageUrl } from '../../utils/imageUtils';

export default function ConfirmCheckoutModal({ 
  isOpen, 
  onClose, 
  product = null, 
  initialQuantity = 1,
  selectedOption: externalOption = null,
  mode = "checkout", // "checkout" | "add"
  onProceed = null,
  onAddToCart = null
}) {
  const { country_code, country_name } = (typeof useGeoLocation === 'function' ? useGeoLocation() : {}) || {};
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(initialQuantity || 1);
  const [selectedOption, setSelectedOption] = useState(
    externalOption || product?.options?.[0] || 'Pack of 1'
  );
  const [imageError, setImageError] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // Synchronize initial state when opening
  useEffect(() => {
    if (isOpen) {
      setQuantity(initialQuantity || 1);
      setSelectedOption(externalOption || product?.options?.[0] || 'Pack of 1');
      setImageError(false);
      setIsAdded(false);
      document.body.style.overflow = 'hidden';
    } else {
      setIsAdded(false);
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialQuantity, externalOption, product]);

  // Handle ESC key dismiss
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unitPrice = parseFloat(product?.price || product?.currentPrice || 0);
  const totalPrice = (unitPrice * quantity).toFixed(2);

  // Resolve the proper bottle image with deep candidate resolution
  const candidateImg = 
    product?.image || 
    product?.imageUrl || 
    (Array.isArray(product?.images) && (typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.url)) ||
    (Array.isArray(product?.gallery) && (typeof product.gallery[0] === 'string' ? product.gallery[0] : product.gallery[0]?.url)) || 
    product?.imageSourceUrl || 
    product?.bottle_image ||
    product?.bottleImage ||
    product?.picture ||
    product?.thumbnail ||
    '';
  const resolvedImg = resolveImageUrl(candidateImg);

  const handleImageError = () => {
    // If primary failed, try second gallery image if available
    if (Array.isArray(product?.gallery) && product.gallery.length > 1) {
      const altCandidate = typeof product.gallery[1] === 'string' ? product.gallery[1] : product.gallery[1]?.url;
      if (altCandidate && resolveImageUrl(altCandidate) !== resolvedImg) {
        return;
      }
    }
    setImageError(true);
  };

  const handleConfirmCheckout = () => {
    if (onProceed) {
      onProceed(product, quantity, selectedOption);
    } else {
      if (onAddToCart) {
        onAddToCart(product, quantity, selectedOption, false);
      }
      navigate('/customer/checkout?mode=domestic_sa');
    }
    onClose();
  };

  const handleConfirmAddToCart = () => {
    if (onAddToCart) {
      onAddToCart(product, quantity, selectedOption, false);
    }
    setIsAdded(true);
  };

  const handleInstantCheckoutFromAdd = () => {
    if (onProceed) {
      onProceed(product, quantity, selectedOption);
    } else {
      if (onAddToCart) {
        onAddToCart(product, quantity, selectedOption, false);
      }
      navigate('/customer/checkout?mode=domestic_sa');
    }
    onClose();
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.82)',
        margin: 0,
        boxSizing: 'border-box'
      }}
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl bg-[#0e0d0b] border border-[var(--color-gold)]/40 rounded-2xl shadow-[0_25px_90px_rgba(0,0,0,0.95),0_0_50px_rgba(201,163,91,0.15)] overflow-hidden flex flex-col md:flex-row my-auto mx-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: '92vh',
          margin: 'auto'
        }}
      >
        {/* Luxury Background Glow Orbs */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-[var(--color-gold)]/10 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[var(--color-gold)]/10 rounded-full blur-[90px] pointer-events-none" />

        {/* ============================================================ */}
        {/* LEFT COLUMN: THE PROPER BOTTLE SHOWCASE                      */}
        {/* ============================================================ */}
        <div className="w-full md:w-[46%] bg-gradient-to-b from-[#181612] via-[#0f0e0b] to-[#080706] border-b md:border-b-0 md:border-r border-white/10 p-6 sm:p-8 flex flex-col items-center justify-between relative overflow-hidden select-none">
          {/* Top Stage Badges */}
          <div className="w-full flex items-center justify-between z-20">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase bg-[var(--color-gold)]/10 text-[var(--color-gold)] border border-[var(--color-gold)]/30 shadow-sm">
              {mode === 'add' ? (
                <>
                  <ShoppingBag size={11} className="text-[var(--color-gold)]" /> Add to Selection
                </>
              ) : (
                <>
                  <Sparkles size={11} className="text-[var(--color-gold)]" /> Authentic Allocation
                </>
              )}
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/25">
              Available
            </span>
          </div>

          {/* Central Bottle Display Frame */}
          <div className="my-auto py-6 sm:py-8 relative flex flex-col items-center justify-center w-full min-h-[250px] sm:min-h-[300px]">
            {/* Ambient Gold Aura Behind Bottle */}
            <div className="absolute w-44 sm:w-56 h-44 sm:h-56 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.22)_0%,rgba(212,175,55,0.03)_65%,transparent_100%)] pointer-events-none" />

            {/* The Proper Bottle Image */}
            {resolvedImg && !imageError ? (
              <div className="relative z-10 flex flex-col items-center">
                <img 
                  src={resolvedImg} 
                  alt={product?.name || "Product bottle"} 
                  onError={handleImageError}
                  className="max-h-60 sm:max-h-76 w-auto object-contain select-none"
                  style={{
                    imageRendering: '-webkit-optimize-contrast',
                    filter: 'drop-shadow(0 14px 24px rgba(0,0,0,0.85))'
                  }}
                  decoding="sync"
                />
                {/* Contact Shadow & Gold Pedestal Line */}
                <div className="w-32 sm:w-40 h-3.5 bg-black/85 rounded-full blur-[3px] -mt-1.5 pointer-events-none" />
                <div className="w-44 sm:w-52 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-gold)]/40 to-transparent mt-1" />
              </div>
            ) : (
              <div className="w-36 h-52 sm:w-44 sm:h-64 rounded-xl bg-black/70 border border-[var(--color-gold)]/40 flex flex-col items-center justify-center p-4 text-center shadow-[0_15px_35px_rgba(0,0,0,0.9)] z-10">
                <ShoppingBag size={42} className="text-[var(--color-gold)] mb-3 opacity-80" />
                <span className="font-serif text-white text-sm line-clamp-2">
                  {product?.name || product?.title || 'Luxury Spirit'}
                </span>
                <span className="text-[10px] text-[var(--color-gold)]/80 uppercase font-mono tracking-widest mt-2">
                  {product?.category || 'Grand Store'}
                </span>
              </div>
            )}
          </div>

          {/* Bottom Provenance Guarantee */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/45 tracking-wider uppercase font-mono z-20">
            <ShieldCheck size={13} className="text-[var(--color-gold)]" />
            <span>Guaranteed Cellar Provenance</span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: LUXURY ORDER DETAILS & CHECKOUT ACTIONS        */}
        {/* ============================================================ */}
        <div className="w-full md:w-[54%] p-6 sm:p-8 flex flex-col justify-between overflow-y-auto custom-scrollbar bg-[#0e0d0b]">
          <div>
            {/* Top Bar with Dismiss Button */}
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="min-w-0">
                <span className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--color-gold)] font-semibold block truncate">
                  {product?.brand || product?.origin || 'The Grand Store Private Cellar'}
                </span>
                <h2 className="text-xl sm:text-2xl font-serif text-white leading-snug mt-1 font-normal line-clamp-2">
                  {product?.name || product?.title || 'Selected Luxury Spirits'}
                </h2>
              </div>

              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[var(--color-gold)]/40 text-white/60 hover:text-white flex items-center justify-center transition-all shrink-0 cursor-pointer"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Product Metadata Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {product?.category && (
                <span className="text-[10px] uppercase tracking-wider text-white/70 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                  {product.category}
                </span>
              )}
              {product?.subcategory && (
                <span className="text-[10px] uppercase tracking-wider text-white/50 bg-white/5 border border-white/5 px-2.5 py-0.5 rounded-full">
                  {product.subcategory}
                </span>
              )}
              {product?.abv && (
                <span className="text-[10px] font-mono text-[var(--color-gold)] bg-[var(--color-gold)]/5 border border-[var(--color-gold)]/20 px-2.5 py-0.5 rounded-full">
                  {product.abv}% ABV
                </span>
              )}
              {product?.size && (
                <span className="text-[10px] font-mono text-white/60 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                  {product.size}
                </span>
              )}
            </div>

            {/* Packaging / Option Selection (if options available) */}
            {Array.isArray(product?.options) && product.options.length > 1 && (
              <div className="mb-4">
                <label className="block text-[10px] uppercase font-mono tracking-widest text-white/50 mb-1.5">
                  Bottle & Packaging Option:
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setSelectedOption(opt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                        selectedOption === opt
                          ? 'bg-[var(--color-gold)]/20 text-[var(--color-gold)] border border-[var(--color-gold)] shadow-[0_0_10px_rgba(212,175,55,0.2)]'
                          : 'bg-white/5 text-white/60 border border-white/10 hover:border-white/25 hover:text-white'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price & Quantity Selector */}
            <div className="bg-black/50 border border-white/10 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-mono text-white/40 block">
                    Subtotal Allocation
                  </span>
                  <div className="text-2xl sm:text-3xl font-serif text-[var(--color-gold)] font-medium mt-0.5">
                    <Price amount={totalPrice} />
                  </div>
                  {quantity > 1 && (
                    <span className="text-[11px] text-white/40 font-mono">
                      (<Price amount={unitPrice.toFixed(2)} /> per unit)
                    </span>
                  )}
                </div>

                {/* Quantity Controls */}
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] uppercase tracking-widest font-mono text-white/40">
                    Quantity
                  </span>
                  <div className="flex items-center border border-white/15 rounded-lg bg-black/40 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1 || isAdded}
                      className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-9 text-center font-mono text-sm text-white font-bold">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={
                        isAdded ||
                        (product?.stock !== undefined &&
                        product?.stock !== null &&
                        (quantity + 1) * (product?.isCase ? Math.max(1, Number(product?.bottlesPerCase || 6)) : 1) > product.stock)
                      }
                      className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* VAT & Tax Transparency */}
              <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between text-[10px] text-white/40 font-mono">
                <span>Inclusive of 15% South African VAT</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Check size={11} /> Ready for Dispatch
                </span>
              </div>
            </div>

            {/* Assurance Guarantees */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="flex items-center gap-2 p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                <ShieldCheck size={14} className="text-[var(--color-gold)] shrink-0" />
                <span className="text-[10px] text-white/70 leading-tight">100% Verified Authentic Bottle</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                <Truck size={14} className="text-[var(--color-gold)] shrink-0" />
                <span className="text-[10px] text-white/70 leading-tight">Insured Door / PostNet Transit</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          {isAdded ? (
            /* Post-Addition Success Confirmation */
            <div className="pt-3 border-t border-white/10 space-y-2.5">
              <div className="p-3 bg-emerald-950/30 border border-emerald-500/35 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Check size={18} className="stroke-[3]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white uppercase tracking-wider">Added to your Bag!</div>
                  <div className="text-[11px] text-white/60 font-mono mt-0.5">
                    {quantity} {quantity === 1 ? 'bottle' : 'bottles'} • <Price amount={totalPrice} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate('/customer/cart');
                  }}
                  className="flex-1 py-3 rounded-full bg-gold-gradient text-black font-bold text-xs uppercase tracking-widest hover:opacity-95 shadow-[0_0_20px_rgba(212,175,55,0.35)] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag size={14} />
                  <span>View Bag & Checkout</span>
                  <ArrowRight size={13} />
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs uppercase tracking-wider font-semibold transition-colors text-center cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : mode === 'add' ? (
            /* Initial Add Mode CTAs */
            <div className="space-y-2.5 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={handleConfirmAddToCart}
                className="w-full py-3.5 rounded-full bg-gold-gradient text-black font-bold text-xs uppercase tracking-widest hover:opacity-95 hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingBag size={15} />
                <span>Add to Bag ({quantity} {quantity === 1 ? 'Bottle' : 'Bottles'})</span>
              </button>

              <button
                type="button"
                onClick={handleInstantCheckoutFromAdd}
                className="w-full py-2.5 rounded-full border border-[var(--color-gold)]/40 hover:border-[var(--color-gold)] bg-[var(--color-gold)]/5 hover:bg-[var(--color-gold)]/15 text-[var(--color-gold)] text-xs uppercase tracking-wider font-semibold transition-colors text-center cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CreditCard size={13} />
                <span>Instant Checkout</span>
              </button>
            </div>
          ) : (
            /* Initial Checkout Mode CTAs */
            <div className="space-y-2.5 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={handleConfirmCheckout}
                className="w-full py-3.5 rounded-full bg-gold-gradient text-black font-bold text-xs uppercase tracking-widest hover:opacity-95 hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard size={15} />
                <span>Proceed to Instant Checkout</span>
                <ArrowRight size={14} className="ml-1" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.02] hover:bg-white/[0.05] text-white/50 hover:text-white text-xs uppercase tracking-wider transition-colors text-center cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
