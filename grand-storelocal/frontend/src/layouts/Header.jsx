import Price from '../components/ui/Price';
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  GitCompareArrows,
  Heart,
  Menu,
  PackageCheck,
  Search,
  ShoppingBag,
  X,
} from 'lucide-react'
import { menuCategories } from '../data'
import { useCurrency } from '../context/CurrencyContext'

function IconButton({ label, children, count, onClick, className = '' }) {
  return (
    <button className={`relative p-2 text-ivory hover:text-gold transition-colors ${className}`} type="button" aria-label={label} onClick={onClick}>
      {children}
      {typeof count === 'number' && <span className="absolute top-0 right-0 bg-gold text-ink text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">{count}</span>}
    </button>
  )
}

export default function Header({ cartCount, compareCount, wishlistCount, onBagClick, onCompareClick, onWishlistClick }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState(0)
  const [megaTrigger, setMegaTrigger] = useState('shop')
  const headerRef = useRef(null)
  const { currency, availableCurrencies, changeCurrency } = useCurrency();
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setMegaOpen(false)
      }
    }
    if (megaOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [megaOpen])

  const closeMenus = () => {
    setMobileOpen(false)
    setMegaOpen(false)
  }

  const toggleMegaMenu = (trigger, categoryName) => {
    const categoryIndex = categoryName
      ? menuCategories.findIndex((category) => category.name === categoryName)
      : activeCategory
    if (categoryIndex >= 0) setActiveCategory(categoryIndex)
    setMegaOpen(!(megaOpen && megaTrigger === trigger))
    setMegaTrigger(trigger)
  }

  return (
    <>
      {/* Tailwind Converted Announcement Bar */}
      <div className="bg-panel-light text-ivory text-xs border-b border-white-line py-2">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center flex-wrap gap-2">
          <p className="flex items-center gap-2"><PackageCheck size={14} className="text-gold" /> Complimentary delivery over <Price amount={1500} /></p>
          <p className="hidden md:block text-ivory-muted tracking-wide uppercase text-[10px]">Private cellar sourcing available worldwide</p>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1 hover:text-gold transition-colors" type="button">South Africa <ChevronDown size={13} /></button>
            <span className="w-px h-3 bg-white-line" />
            
            <div className="relative">
              <button 
                className="flex items-center gap-1 hover:text-gold transition-colors" 
                type="button"
                onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
              >
                {currency} <ChevronDown size={13} />
              </button>
              {showCurrencyDropdown && (
                <div className="absolute right-0 top-full mt-1 bg-panel border border-white-line rounded shadow-lg z-50 min-w-[80px]">
                  {availableCurrencies.map(c => (
                    <button 
                      key={c}
                      className="block w-full text-left px-4 py-2 hover:bg-gold/10 hover:text-gold transition-colors"
                      onClick={() => { changeCurrency(c); setShowCurrencyDropdown(false); }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-ink/95 backdrop-blur-sm border-b border-white-line" ref={headerRef} onMouseLeave={() => setMegaOpen(false)}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <button className="md:hidden p-2" type="button" aria-label="Open menu" onClick={() => setMobileOpen(true)}>
            <Menu size={23} />
          </button>

          <Link className="flex-shrink-0" to="/" aria-label="The Grand Store home">
            <img src="/grand-store-logo.png" alt="The Grand Store" className="h-10 w-auto max-w-[190px] object-contain object-left md:h-14 md:max-w-[260px]" />
          </Link>

          <form className="hidden md:flex flex-1 max-w-xl mx-8 relative items-center" onSubmit={(event) => event.preventDefault()}>
            <Search size={18} className="absolute left-3 text-ivory-muted" aria-hidden="true" />
            <input className="w-full bg-panel text-ivory placeholder-ivory-muted py-2 pl-10 pr-4 rounded-sm border border-transparent focus:border-gold outline-none transition-colors" aria-label="Search the collection" placeholder="Search rare bottles, estates, vintages…" />
            <button className="absolute right-2 text-xs uppercase tracking-wider text-gold hover:text-gold-bright transition-colors" type="submit">Search</button>
          </form>

          <div className="flex items-center gap-2 md:gap-4">
            <IconButton className="hidden md:block" label="Compare products" count={compareCount} onClick={onCompareClick}><GitCompareArrows size={22} /></IconButton>
            <IconButton className={wishlistCount ? 'text-gold' : ''} label={`Wishlist, ${wishlistCount} saved`} count={wishlistCount} onClick={onWishlistClick}><Heart size={22} fill={wishlistCount ? 'currentColor' : 'none'} /></IconButton>
            <IconButton label="Shopping bag" count={cartCount} onClick={onBagClick}><ShoppingBag size={22} /></IconButton>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:block border-t border-white-line" aria-label="Main navigation">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-8 py-3 text-sm tracking-wide uppercase">
            <Link className="hover:text-gold transition-colors" to="/">Home</Link>
            <div className="relative group flex items-center gap-1 cursor-pointer">
              <Link className="hover:text-gold transition-colors" to="/shop">Shop</Link>
              <button type="button" onClick={() => toggleMegaMenu('shop', 'Whisky')} aria-label="Open shop menu"><ChevronDown size={14} className="group-hover:text-gold transition-colors" /></button>
            </div>
            <button className="flex items-center gap-1 hover:text-gold transition-colors uppercase tracking-wide" type="button" onClick={() => toggleMegaMenu('wine', 'Wine')}>Wine <ChevronDown size={14} /></button>
            <button className="flex items-center gap-1 hover:text-gold transition-colors uppercase tracking-wide" type="button" onClick={() => toggleMegaMenu('accessories', 'Accessories')}>Accessories <ChevronDown size={14} /></button>
            <a className="hover:text-gold transition-colors" href="/#private-collection">Offers</a>
            <Link className="hover:text-gold transition-colors" to="/auction">Auction</Link>
            <Link className="hover:text-gold transition-colors" to="/events">Events</Link>
          </div>
        </nav>
      </header>
    </>
  )
}
