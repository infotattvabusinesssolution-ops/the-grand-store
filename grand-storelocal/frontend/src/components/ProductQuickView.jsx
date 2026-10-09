import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ShoppingBag, Wine, X } from 'lucide-react'
import Price from './ui/Price'
import { getProductIdentity } from '../utils/productTaxonomy'

export default function ProductQuickView({ product, onClose, onAdd }) {
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    if (!product) return undefined
    setImageError(false)
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [product, onClose])

  if (!product) return null
  const identity = getProductIdentity(product)

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-[10px] sm:p-5 md:p-[42px]" 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="quick-view-title"
    >
      <button 
        className="absolute inset-0 w-full h-full p-0 border-0 bg-black/80 backdrop-blur-md cursor-pointer" 
        type="button" 
        onClick={onClose} 
        aria-label="Close quick view" 
      />
      <div className="relative z-10 w-full max-w-[1240px] max-h-[calc(100vh-20px)] sm:max-h-full overflow-y-auto sm:overflow-hidden bg-[#0c0b09] border border-white/10 shadow-[0_38px_60px_rgba(0,0,0,0.65)] block md:grid md:grid-cols-[0.8fr_1.2fr] lg:grid-cols-[1.1fr_1.4fr]">
        <button 
          className="absolute top-4 right-4 z-20 grid w-11 h-11 p-0 place-items-center border border-white/10 rounded-full bg-[#080807]/85 cursor-pointer text-[#eee8dd] hover:bg-white/10 hover:border-white/30 transition-all" 
          type="button" 
          onClick={onClose} 
          aria-label="Close quick view"
        >
          <X size={22} />
        </button>
        <div className="grid min-h-[300px] md:min-h-[520px] lg:min-h-[570px] p-[35px] md:p-[28px] lg:p-[45px] items-start justify-items-center bg-[#181612] bg-[radial-gradient(circle,rgba(177,122,39,0.15),transparent_42%)]">
          {product.image && !imageError ? (
            <img
              className="w-[80%] h-[270px] md:h-[420px] lg:h-[470px] object-contain drop-shadow-[0_28px_30px_rgba(0,0,0,0.58)]"
              src={product.image}
              alt={product.fullName || product.name}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-[270px] flex-col items-center justify-center gap-3 text-[#c9a35b]/65 md:h-[420px] lg:h-[470px]" role="img" aria-label={`${product.name} image unavailable`}>
              <Wine size={56} strokeWidth={1.2} aria-hidden="true" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Image coming soon</span>
            </div>
          )}
        </div>
        <div className="self-center p-[30px_22px] sm:p-[clamp(42px,5vw,75px)]">
          <p className="flex items-center gap-3 m-0 mb-[19px] text-[#e1bd70] text-xs font-semibold tracking-[0.2em] uppercase">
            {product.brand} • {identity.origin || product.country || 'Origin not stated'}
          </p>
          <h2 id="quick-view-title" className="m-[0_0_20px] font-serif text-[36px] md:text-[clamp(38px,4vw,58px)] font-medium tracking-[-0.035em] leading-[0.98] text-[#eee8dd]">
            {product.fullName || product.name}
          </h2>
          <strong className="text-[#e1bd70] font-serif text-[32px] font-medium">
            <Price amount={product.price} />
          </strong>
          <p className="m-[22px_0] text-[#a9a195] font-serif text-[17px] leading-[1.6]">
            {product.description}
          </p>
          <dl className="m-[0_0_25px]">
            <div className="flex justify-between py-2.5 border-b border-white/10">
              <dt className="text-[#746e65] text-[10px] tracking-[0.12em] uppercase">Style</dt>
              <dd className="m-0 text-[#d8d0c4] font-serif">{identity.style || 'Not stated'}</dd>
            </div>
            <div className="flex justify-between py-2.5 border-b border-white/10">
              <dt className="text-[#746e65] text-[10px] tracking-[0.12em] uppercase">Size</dt>
              <dd className="m-0 text-[#d8d0c4] font-serif">{identity.bottleSize || product.size || 'Not stated'}</dd>
            </div>
            <div className="flex justify-between py-2.5 border-b border-white/10">
              <dt className="text-[#746e65] text-[10px] tracking-[0.12em] uppercase">SKU</dt>
              <dd className="m-0 text-[#d8d0c4] font-serif">{product.sku}</dd>
            </div>
          </dl>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <button 
              className="inline-flex items-center justify-center min-h-[49px] px-6 gap-[14px] border border-transparent text-[#0b0a08] bg-[#e1bd70] text-[13px] font-semibold tracking-[0.12em] uppercase transition-all duration-180 hover:bg-[#f2dbac] hover:-translate-y-0.5 cursor-pointer w-full" 
              type="button" 
              onClick={() => onAdd(product)}
            >
              Add to bag <ShoppingBag size={17} />
            </button>
            <Link 
              className="inline-flex items-center justify-center min-h-[49px] px-6 gap-[14px] border border-white/20 text-[#eee8dd] bg-transparent text-xs font-semibold tracking-[0.12em] uppercase transition-all duration-180 hover:bg-white hover:text-black hover:border-white hover:-translate-y-0.5 w-full" 
              to={`/product/${product.slug || product.id || product._id}`} 
              onClick={onClose}
            >
              View details <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
