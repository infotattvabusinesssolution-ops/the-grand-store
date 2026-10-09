import { useProducts } from './context/ProductContext'
import { useEffect, useMemo, useState } from 'react'
import { WishlistContext } from './wishlistContext'

const STORAGE_KEY = 'grand-store-wishlist'

function readWishlistIds() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(stored) ? stored : []
  } catch {
    return []
  }
}

function WishlistProvider({ children }) {
  const { products } = useProducts();
  const [wishlistIds, setWishlistIds] = useState(readWishlistIds)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlistIds))
  }, [wishlistIds])

  useEffect(() => {
    const syncWishlist = (event) => {
      if (event.key !== STORAGE_KEY) return
      try {
        const nextIds = JSON.parse(event.newValue || '[]')
        setWishlistIds(Array.isArray(nextIds) ? nextIds : [])
      } catch {
        setWishlistIds([])
      }
    }
    window.addEventListener('storage', syncWishlist)
    return () => window.removeEventListener('storage', syncWishlist)
  }, [])

  const value = useMemo(() => ({
    wishlistIds,
    wishlistItems: wishlistIds.map((id) => products.find((product) => product.id === id || product._id === id)).filter(Boolean),
    wishlistCount: wishlistIds.length,
    isWishlisted: (product) => wishlistIds.includes(product.id || product._id),
    toggleWishlist: (product) => {
      const id = product.id || product._id;
      const willAdd = !wishlistIds.includes(id)
      setWishlistIds((current) => current.includes(id)
        ? current.filter((i) => i !== id)
        : [id, ...current])
      return willAdd
    },
    removeFromWishlist: (product) => setWishlistIds((current) => current.filter((id) => id !== (product.id || product._id))),
    clearWishlist: () => setWishlistIds([]),
  }), [wishlistIds, products])

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export default WishlistProvider
