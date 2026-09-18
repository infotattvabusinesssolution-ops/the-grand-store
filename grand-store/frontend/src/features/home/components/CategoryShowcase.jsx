import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ArrowRight } from 'lucide-react'
import { useProducts } from '../../../context/ProductContext'
import { useCategories } from '../../../context/CategoryContext'
import ProductCard from '../../../components/ProductCard'
import ProductQuickView from '../../../components/ProductQuickView'

export default function CategoryShowcase({ 
  categoryId, 
  title, 
  eyebrow, 
  description, 
  onAdd, 
  onWish, 
  onCompare, 
  compareItems,
  brands = [] 
}) {
  const { products } = useProducts()
  const { categories } = useCategories()
  const sectionRef = useRef(null)
  const [quickViewProduct, setQuickViewProduct] = useState(null)
  const [productOrder, setProductOrder] = useState({})

  useEffect(() => {
    if (products.length > 0 && Object.keys(productOrder).length === 0) {
      const order = {}
      products.forEach(p => { order[p.id || p._id] = Math.random() })
      setProductOrder(order)
    }
  }, [products])

  const categoryProducts = products
    .filter((product) => {
      const cat = String(product.category || product.type || '').toLowerCase()
      return cat === categoryId.toLowerCase()
    })
    .sort((a, b) => {
      const orderA = productOrder[a.id || a._id] || 0
      const orderB = productOrder[b.id || b._id] || 0
      return orderA - orderB
    })
    .slice(0, 5)

  useEffect(() => {
    if (categoryProducts.length === 0 || !sectionRef.current) return;
    const context = gsap.context(() => {
      gsap.from('.product-card', {
        y: 52,
        opacity: 0,
        stagger: 0.09,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 77%' },
      })
    }, sectionRef)
    return () => context.revert()
  }, [categoryProducts.length])

  
  const categoryData = categories?.find(c => c.name.toLowerCase() === categoryId.toLowerCase());
  const dynamicBrands = categoryData?.brandLogos?.length > 0 
    ? categoryData.brandLogos.map(logo => ({ name: logo.alt || 'Brand Logo', image: logo.url })) 
    : brands;
    
  const marqueeBrands = [...dynamicBrands, ...dynamicBrands]

  const showMarquee = dynamicBrands.length > 0;

  if (categoryProducts.length === 0) return null;

  return (
    <>
      <section className="section tequila-showcase home-product-editorial" id={categoryId.toLowerCase()} ref={sectionRef}>
        <div className="shell">
          <div className="section-heading flex flex-col items-start text-left md:flex-row md:text-left md:justify-between md:items-end gap-3 md:gap-0">
            <div className="flex flex-col items-start md:items-start w-full">
              <p className="eyebrow hidden md:block">{eyebrow}</p>
              <h2>{title}</h2>
              <p className="section-intro hidden md:block">{description}</p>
            </div>
            <Link className="text-link arrow-link flex items-center gap-1" to={`/shop?category=${encodeURIComponent(categoryId)}`}>
              <span className="hidden md:inline">View all {categoryId.toLowerCase()}</span>
              <span className="inline md:hidden">View all</span> 
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="tequila-product-rail">
            {categoryProducts.map((product, index) => (
              <ProductCard
                key={product.id || product._id}
                product={product}
                index={index}
                onAdd={onAdd}
                onWish={onWish}
                onCompare={onCompare}
                isCompared={compareItems.some((item) => (item.id || item._id) === (product.id || product._id))}
                onQuickView={setQuickViewProduct}
              />
            ))}
          </div>
          <p className="swipe-hint"><ArrowRight size={15} /> Swipe to explore</p>
        </div>
      </section>

      {showMarquee && (
        <section className="home-brand-marquee relative py-0 md:py-10 border-t border-white/10 bg-[#0b0a08] overflow-hidden" aria-labelledby={`${categoryId}-brands-title`}>
          <div className="relative max-w-[1440px] mx-auto text-center sm:px-8 lg:px-7">
            <div className="home-brand-marquee-panel relative border-y sm:border border-white/10 sm:rounded-2xl py-1 md:py-8 bg-white/[0.01]">
              <div className="home-brand-marquee-heading mb-2 md:mb-8 mt-1 md:mt-0 relative px-6 sm:px-0">
                <h2 id={`${categoryId}-brands-title`} className="home-brand-marquee-title m-0 font-serif text-[clamp(20px,2.5vw,36px)] font-medium tracking-[-0.02em] leading-[1.05] text-[#eee8dd] relative z-10">
                  Top {title} Brands
                </h2>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[100px] md:w-[160px] h-[1px] md:h-[2px] rounded-full bg-[linear-gradient(90deg,transparent,rgba(197,153,59,0.8),transparent)] blur-[0.5px]" />
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[150px] md:w-[280px] h-[15px] md:h-[30px] rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(197,153,59,0.15),transparent_70%)] blur-md pointer-events-none" />
              </div>
              <div
                className="relative overflow-hidden w-full group"
                style={{ maskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)' }}
                aria-label={`Featured ${categoryId} brands`}
              >
                <div className="flex w-max animate-[marquee_20s_linear_infinite] sm:animate-[marquee_24s_linear_infinite] group-hover:[animation-play-state:paused] will-change-transform items-center">
                  {marqueeBrands.map((brand, index) => (
                    <Link
                      to={`/shop?category=${encodeURIComponent(categoryId)}&brand=${encodeURIComponent(brand.name)}`}
                      className="home-brand-marquee-tile relative flex items-center justify-center max-sm:flex-[0_0_80px] sm:flex-[0_0_240px] md:flex-[0_0_280px] max-sm:min-h-[40px] sm:min-h-[135px] md:min-h-[150px] max-sm:mx-1 sm:mx-5 md:mx-6 transition-all duration-300 hover:scale-105 group/brand select-none cursor-pointer"
                      key={`${brand.name}-${index}`}
                      aria-label={`View ${brand.name}`}
                    >
                      <img
                        className="home-brand-marquee-logo w-auto h-auto max-sm:max-w-[70px] sm:max-w-[220px] md:max-w-[260px] max-sm:max-h-[30px] sm:max-h-[115px] md:max-h-[130px] object-contain filter contrast-[1.05] brightness-[0.98] group-hover/brand:brightness-110 transition-all duration-300"
                        src={brand.image}
                        alt={brand.name}
                      />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {quickViewProduct && (
        <ProductQuickView
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAdd={onAdd}
        />
      )}
    </>
  )
}
