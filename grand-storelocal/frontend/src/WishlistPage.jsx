import { useEffect } from 'react'
import { ArrowRight, GitCompareArrows, Heart, ShoppingBag, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useWishlist } from './wishlistContext'

function WishlistPage({ onAdd, onCompare, compareItems }) {
  const { wishlistItems, wishlistCount, removeFromWishlist, clearWishlist } = useWishlist()

  useEffect(() => {
    document.title = 'My Wishlist — The Grand Store'
    window.scrollTo({ top: 0, behavior: 'auto' })
    return () => { document.title = 'The Grand Store — Luxury Wines & Spirits' }
  }, [])

  const clearAll = () => {
    if (window.confirm('Remove every bottle from your wishlist?')) clearWishlist()
  }

  return (
    <main className="wishlist-page">
      <section className="wishlist-hero">
        <div className="shell wishlist-hero-inner">
          <div>
            <p className="eyebrow">Your private shortlist</p>
            <h1>Saved for <span>later.</span></h1>
            <p className="wishlist-hero-description">A personal collection of bottles you want to revisit.</p>
          </div>
          <div className="wishlist-count" aria-label={`${wishlistCount} saved ${wishlistCount === 1 ? 'bottle' : 'bottles'}`}>
            <strong>{String(wishlistCount).padStart(2, '0')}</strong>
            <span>{wishlistCount === 1 ? 'bottle' : 'bottles'} saved</span>
          </div>
        </div>
      </section>

      <section className="shell wishlist-content">
        {wishlistCount ? (
          <>
            <div className="wishlist-toolbar">
              <div>
                <p className="eyebrow">Curated by you</p>
                <h2>Your wishlist</h2>
              </div>
              <button type="button" onClick={clearAll} className="wishlist-clear"><Trash2 size={15} /> Clear all</button>
            </div>

            <div className="wishlist-grid">
              {wishlistItems.map((product) => {
                const compared = compareItems.some((item) => item.id === product.id)
                const productPath = `/product/${product.slug || product.id || product._id}`
                return (
                  <article className="wishlist-card" key={product.id || product._id}>
                    <div className="wishlist-card-visual">
                      <button type="button" onClick={() => removeFromWishlist(product)} aria-label={`Remove ${product.name} from wishlist`} className="wishlist-remove"><Heart size={17} fill="currentColor" /></button>
                      <Link to={productPath} className="wishlist-image-link"><img src={product.image} alt={product.fullName || product.name} /></Link>
                    </div>
                    <div className="wishlist-card-body">
                      <p>{[product.brand, product.origin].filter(Boolean).join(' · ') || product.category}</p>
                      <h2><Link to={productPath}>{product.fullName || product.name}</Link></h2>
                      <strong>{product.price}</strong>
                      <div className="wishlist-actions">
                        <button type="button" onClick={() => onAdd(product)} className="wishlist-add">Add to bag <ShoppingBag size={15} /></button>
                        <button className={`wishlist-compare ${compared ? 'is-active' : ''}`} type="button" onClick={() => onCompare(product)} aria-label={compared ? `View ${product.name} in comparison` : `Compare ${product.name}`}><GitCompareArrows size={16} /></button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </>
        ) : (
          <div className="wishlist-empty">
            <span><Heart size={30} /></span>
            <p className="eyebrow">Your wishlist is empty</p>
            <h2>Start a collection of favourites.</h2>
            <p>Use the heart beside any bottle and it will be waiting here whenever you return.</p>
            <Link to="/shop">Explore the cellar <ArrowRight size={16} /></Link>
          </div>
        )}
      </section>
    </main>
  )
}

export default WishlistPage
