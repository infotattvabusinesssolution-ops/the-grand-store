import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, ShoppingBag, CreditCard, ArrowRight, ShieldCheck, 
  Sparkles, Plus, Minus, Check, Rotate3d, Truck, Lock 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Price from '../ui/Price';

const preparedVendorImages = {
  "/uploads/images-1787292711461.png": "/assets/products/vendor/whisky-tona-full.png",
};

const resolveImageUrl = (src) => {
  if (!src) return "";
  const normalizedSrc = String(src).replace(/\\/g, "/");

  const prepared = Object.entries(preparedVendorImages).find(([uploadPath]) =>
    normalizedSrc.includes(uploadPath),
  )?.[1];
  if (prepared) return prepared;

  if (normalizedSrc.startsWith("http://") || normalizedSrc.startsWith("https://")) {
    if (
      normalizedSrc.includes("res.cloudinary.com") &&
      normalizedSrc.includes("/grandstore-uploads/") &&
      normalizedSrc.includes("/image/upload/") &&
      !normalizedSrc.includes("/e_trim")
    ) {
      return normalizedSrc.replace(
        "/image/upload/",
        "/image/upload/e_trim:10/",
      );
    }
    return normalizedSrc;
  }

  if (normalizedSrc.includes("uploads/")) {
    const apiUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");
    const cleanPath = normalizedSrc.substring(normalizedSrc.indexOf("uploads/"));
    return `${apiUrl}/${cleanPath}`;
  }

  return normalizedSrc.startsWith("/") ? normalizedSrc : `/${normalizedSrc}`;
};

export default function ConfirmCheckoutModal({ 
  isOpen, 
  onClose, 
  product = null, 
  initialQuantity = 1,
  selectedOption: externalOption = null,
  onProceed = null,
  onAddToCart = null
}) {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(initialQuantity || 1);
  const [selectedOption, setSelectedOption] = useState(
    externalOption || product?.options?.[0] || 'Pack of 1'
  );
  const [imageError, setImageError] = useState(false);

  // 3D Perspective & Cursor Tracking state
  const stageRef = useRef(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Synchronize initial state when opening
  useEffect(() => {
    if (isOpen) {
      setQuantity(initialQuantity || 1);
      setSelectedOption(externalOption || product?.options?.[0] || 'Pack of 1');
      setImageError(false);
      setRotate({ x: 0, y: 0 });
      document.body.style.overflow = 'hidden';
    } else {
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

  // 3D Interactive Tilt Handlers
  const handleMouseMove = (e) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Normalize coordinates (-0.5 to 0.5)
    const normalizedX = (x / rect.width) - 0.5;
    const normalizedY = (y / rect.height) - 0.5;

    // Smooth tilt angles
    const rotX = -normalizedY * 26; // deg
    const rotY = normalizedX * 26;  // deg

    setRotate({ x: rotX, y: rotY });
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  const unitPrice = parseFloat(product?.price || product?.currentPrice || 0);
  const totalPrice = (unitPrice * quantity).toFixed(2);
  const resolvedImg = resolveImageUrl(
    product?.image || 
    (Array.isArray(product?.gallery) && product?.gallery[0]) || 
    product?.imageSourceUrl || 
    ''
  );

  const handleConfirmCheckout = () => {
    if (onProceed) {
      onProceed(product, quantity, selectedOption);
    } else {
      if (onAddToCart) {
        onAddToCart(product, quantity, selectedOption, false);
      }
      navigate('/customer/checkout');
    }
    onClose();
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl transition-all duration-300 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl bg-[#0d0c0a] border border-[var(--color-gold)]/35 rounded-2xl sm:rounded-3xl shadow-[0_25px_90px_rgba(0,0,0,0.9),0_0_60px_rgba(212,175,55,0.12)] overflow-hidden flex flex-col md:flex-row max-h-[92vh] md:max-h-[86vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Luxury Background Glow Orbs */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-[var(--color-gold)]/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[var(--color-gold)]/10 rounded-full blur-[100px] pointer-events-none"></div>

        {/* ============================================================ */}
        {/* LEFT COLUMN: INTERACTIVE 3D PERSPECTIVE SHOWCASE             */}
        {/* ============================================================ */}
        <div 
          ref={stageRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="w-full md:w-[48%] bg-gradient-to-b from-[#171510] via-[#0f0e0b] to-[#070605] border-b md:border-b-0 md:border-r border-white/10 p-6 sm:p-8 flex flex-col items-center justify-between relative overflow-hidden select-none cursor-grab active:cursor-grabbing"
          style={{ perspective: '1100px' }}
        >
          {/* Top Stage Badges */}
          <div className="w-full flex items-center justify-between z-20">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase bg-[var(--color-gold)]/10 text-[var(--color-gold)] border border-[var(--color-gold)]/30 shadow-sm">
              <Sparkles size={11} className="animate-pulse" /> Authentic Allocation
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/25">
              Available
            </span>
          </div>

          {/* 3D Floating Stage Centerpiece */}
          <div 
            className="my-auto py-8 sm:py-12 relative flex items-center justify-center w-full"
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Concentric 3D Gold Pedestal */}
            <div 
              className="absolute -bottom-2 flex items-center justify-center pointer-events-none"
              style={{
                transform: `rotateX(68deg) translateZ(-20px)`,
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Outer halo */}
              <div className="w-56 sm:w-64 h-56 sm:h-64 rounded-full border border-[var(--color-gold)]/20 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.25)_0%,rgba(212,175,55,0.03)_60%,transparent_100%)] blur-[1px]"></div>
              {/* Mid ring */}
              <div className="absolute w-40 sm:w-48 h-40 sm:h-48 rounded-full border border-[var(--color-gold)]/40 shadow-[0_0_25px_rgba(212,175,55,0.3)]"></div>
              {/* Core disc */}
              <div className="absolute w-24 sm:w-28 h-24 sm:h-28 rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.45)_0%,transparent_80%)]"></div>
            </div>

            {/* The 3D Floating Bottle Card */}
            <div 
              className="relative flex flex-col items-center justify-center transition-transform duration-200 ease-out"
              style={{
                transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) translateZ(40px)`,
                transformStyle: 'preserve-3d',
                filter: 'drop-shadow(0 18px 28px rgba(0,0,0,0.85))'
              }}
            >
              {resolvedImg && !imageError ? (
                <img 
                  src={resolvedImg} 
                  alt={product?.name || "Product preview"} 
                  onError={() => setImageError(true)}
                  className="max-h-56 sm:max-h-72 w-auto object-contain pointer-events-none transition-all duration-300"
                  style={{
                    transform: 'translateZ(50px)'
                  }}
                />
              ) : (
                <div 
                  className="w-36 h-52 sm:w-44 sm:h-64 rounded-xl bg-black/70 border border-[var(--color-gold)]/40 flex flex-col items-center justify-center p-4 text-center shadow-[0_15px_35px_rgba(0,0,0,0.9)]"
                  style={{ transform: 'translateZ(30px)' }}
                >
                  <ShoppingBag size={42} className="text-[var(--color-gold)] mb-3 opacity-80" />
                  <span className="font-serif text-white text-sm line-clamp-2">
                    {product?.name || product?.title || 'Luxury Spirit'}
                  </span>
                  <span className="text-[10px] text-[var(--color-gold)]/80 uppercase font-mono tracking-widest mt-2">
                    {product?.category || 'Grand Store'}
                  </span>
                </div>
              )}

              {/* Dynamic contact shadow directly under the bottle */}
              <div 
                className="w-32 h-6 bg-black/80 rounded-full blur-md -mt-3 pointer-events-none transition-transform duration-300"
                style={{
                  transform: `translateZ(-15px) scale(${isHovered ? 1.15 : 1})`
                }}
              ></div>
            </div>
          </div>

          {/* Interactive Hint Bar */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/40 tracking-wider uppercase font-mono z-20">
            <Rotate3d size={13} className="text-[var(--color-gold)]/80 animate-pulse" />
            <span>Interactive 3D Stage • Move cursor to inspect</span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: LUXURY ORDER DETAILS & CHECKOUT ACTIONS        */}
        {/* ============================================================ */}
        <div className="w-full md:w-[52%] p-6 sm:p-8 flex flex-col justify-between overflow-y-auto custom-scrollbar bg-[#0d0c0a]/90">
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
            <div className="flex flex-wrap items-center gap-2 mb-5">
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
              <div className="mb-5">
                <label className="block text-[10px] uppercase font-mono tracking-widest text-white/50 mb-2">
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
            <div className="bg-black/50 border border-white/10 rounded-xl p-4 mb-5">
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
                      disabled={quantity <= 1}
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
                      className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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
            <div className="grid grid-cols-2 gap-2 mb-6">
              <div className="flex items-center gap-2 p-2.5 bg-white/[0.02] border border-white/5 rounded-lg">
                <ShieldCheck size={15} className="text-[var(--color-gold)] shrink-0" />
                <span className="text-[10px] text-white/70 leading-tight">100% Verified Authentic Bottle</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-white/[0.02] border border-white/5 rounded-lg">
                <Truck size={15} className="text-[var(--color-gold)] shrink-0" />
                <span className="text-[10px] text-white/70 leading-tight">Insured Door / PostNet Transit</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
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
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
