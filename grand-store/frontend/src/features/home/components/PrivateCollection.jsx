import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useProducts } from '../../../context/ProductContext'

export default function PrivateCollection() {
  const { products } = useProducts()

  const cards = products.slice(0, 3).map((product, index) => {
    const uploadedImage = String(product.image || '')
    const hasPreparedBottle = uploadedImage.includes('/uploads/images-1787292711461.png')

    return {
      number: `0${index + 1}`,
      overline: product.category || product.type || 'Exclusive selection',
      title: product.name || product.fullName || 'Private cellar selection',
      image: hasPreparedBottle ? '/assets/products/vendor/whisky-tona-full.png' : product.image,
      hasPreparedBottle,
      link: `/product/${product.slug || product.id || product._id}`,
    }
  })

  if (!cards.length) return null

  return (
    <section className="section private-section home-product-editorial" id="private-collection">
      <div className="shell">
        <div className="section-heading collection-heading">
          <div>
            <p className="eyebrow">The private collection</p>
            <h2>Chosen with intention</h2>
          </div>
        </div>

        <div className="collection-grid">
          {cards.map((card) => (
            <Link className="collection-card" to={card.link} key={card.number}>
              <span className="collection-number">{card.number}</span>
              {card.hasPreparedBottle ? (
                <span
                  className="collection-prepared-bottle"
                  aria-hidden="true"
                  style={{ backgroundImage: `url(${card.image})` }}
                />
              ) : (
                <img src={card.image} alt="" loading="lazy" />
              )}
              <div className="collection-text">
                <p>{card.overline}</p>
                <h3>{card.title}</h3>
                <span>Explore collection <ArrowRight size={15} /></span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
