import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ArrowRight } from 'lucide-react'
import { useProducts } from '../../../context/ProductContext'
import { useCategories } from '../../../context/CategoryContext'
import ProductCard from '../../../components/ProductCard'
import ProductQuickView from '../../../components/ProductQuickView'
import { tequilaBrands } from '../../../data'

export default function TequilaShowcase({ onAdd, onWish, onCompare, compareItems }) {
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

  const tequilaProducts = products
    .filter((product) => {
      const category = String(product.category || product.type || '').toLowerCase()
      return category === 'tequila'
    })
    .sort((a, b) => {
      const orderA = productOrder[a.id || a._id] || 0
      const orderB = productOrder[b.id || b._id] || 0
      return orderA - orderB
    })
    .slice(0, 5)

  useEffect(() => {
    if (tequilaProducts.length === 0 || !sectionRef.current) return;
    const context = gsap.context(() => {
      gsap.from('.product-card', {
        y: 52,
        opacity: 0,
        stagger: 0.09,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 77%' },
      })
      gsap.from('.cigar-conversation', {
        x: 72,
        opacity: 0,
        duration: 0.9,
        delay: 0.18,
        ease: 'power3.out',
        scrollTrigger: { trigger: sectionRef.current, start: 'top 77%' },
      })
    }, sectionRef)

    return () => context.revert()
  }, [tequilaProducts.length])

  const categoryData = categories?.find(c => c.name.toLowerCase() === 'tequila');
  const dynamicBrands = categoryData?.brandLogos?.length > 0 
    ? categoryData.brandLogos.map(logo => ({ name: logo.alt || 'Brand Logo', image: logo.url })) 
    : tequilaBrands;

  const marqueeBrands = [...dynamicBrands, ...dynamicBrands]

  // Only show the marquee if we actually have brands
  const showMarquee = dynamicBrands.length > 0;

  return (
    <>
      <section className="section tequila-showcase home-product-editorial" id="tequila" ref={sectionRef}>
        <div className="shell relative">
          <div className="section-heading flex flex-col items-start gap-3 text-left md:flex-row md:items-start md:justify-between md:gap-8">
            <div className="flex w-full flex-col items-start md:min-w-0 md:flex-1">
              <p className="eyebrow hidden md:block">From the heart of agave country</p>
              <h2>Top Tequila</h2>
              <p className="section-intro hidden md:block">
                Reposado warmth, crystalline clarity and rare extra añejo—selected for the modern cabinet.
              </p>
            </div>
            <aside className="flex shrink-0 flex-col items-end gap-4">
              <button
                type="button"
                onClick={() => document.getElementById('partners')?.scrollIntoView({ behavior: 'smooth' })}
                className="cigar-conversation group relative hidden h-[152px] w-[400px] items-start justify-end overflow-visible border-0 bg-transparent p-0 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e1bd70] lg:flex"
                aria-label="Explore our private cigar collection"
              >
                <span className="relative z-10 mt-3 flex w-[272px] flex-col rounded-[18px_18px_4px_18px] bg-[#171512] px-5 py-4">
                  <span className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#c9a35b]">Private Collection</span>
                  <span className="font-serif text-[20px] leading-[1.12] text-[#f4eee1]">Looking for a truly exceptional cigar?</span>
                  <span className="mt-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#d9ad5f]">
                    Explore collection
                    <ArrowRight size={13} className="transition-transform duration-200 group-hover:translate-x-1" />
                  </span>
                  <span className="absolute right-[-8px] top-[25px] h-4 w-4 rotate-45 bg-[#171512]" aria-hidden="true" />
                </span>

                <span className="relative -ml-10 h-[152px] w-[112px] shrink-0 overflow-hidden" aria-hidden="true">
                  <img
                    src="/assets/images/cigar_character_full.png"
                    alt=""
                    className="absolute left-1/2 top-0 h-auto w-[230px] max-w-none -translate-x-1/2"
                  />
                </span>
              </button>

              <Link className="text-link arrow-link flex items-center gap-1" to="/shop?category=Tequila">
                <span className="hidden md:inline">View all tequila</span>
                <span className="inline md:hidden">View all</span>
                <ArrowRight size={16} />
              </Link>
            </aside>
          </div>

          <div className="tequila-product-rail">
            {tequilaProducts.map((product, index) => (
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
        <section className="home-brand-marquee relative py-8 md:py-10 border-t border-white/10 bg-[#0b0a08] overflow-hidden" aria-labelledby="tequila-brands-title">
        <div className="relative max-w-[1440px] mx-auto text-center sm:px-8 lg:px-7">
          <div className="home-brand-marquee-panel relative border-y sm:border border-white/10 sm:rounded-2xl py-8 bg-white/[0.01]">
            <div className="home-brand-marquee-heading mb-8 relative px-6 sm:px-0">
              <h2 id="tequila-brands-title" className="home-brand-marquee-title m-0 font-serif text-[clamp(24px,2.5vw,36px)] font-medium tracking-[-0.02em] leading-[1.05] text-[#eee8dd] relative z-10">
                Top Tequila Brands
              </h2>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[160px] h-[2px] rounded-full bg-[linear-gradient(90deg,transparent,rgba(197,153,59,0.8),transparent)] blur-[0.5px]" />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[280px] h-[30px] rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(197,153,59,0.15),transparent_70%)] blur-md pointer-events-none" />
            </div>
            <div
              className="relative overflow-hidden w-full group"
              style={{ maskImage: 'linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)' }}
              aria-label="Featured tequila brands"
            >
              <div className="flex w-max animate-[marquee_20s_linear_infinite] sm:animate-[marquee_24s_linear_infinite] group-hover:[animation-play-state:paused] will-change-transform items-center">
                {marqueeBrands.map((brand, index) => (
                  <Link
                    to={`/shop?category=Tequila&brand=${encodeURIComponent(brand.name)}`}
                    className="home-brand-marquee-tile relative flex items-center justify-center max-sm:flex-[0_0_260px] sm:flex-[0_0_280px] md:flex-[0_0_320px] max-sm:min-h-[180px] sm:min-h-[165px] md:min-h-[190px] max-sm:mx-0 sm:mx-4 md:mx-6 transition-all duration-300 hover:scale-110 hover:-translate-y-1 group/brand select-none cursor-pointer"
                    key={`${brand.name}-${index}`}
                    aria-label={`View ${brand.name}`}
                  >
                    <img
                      className="home-brand-marquee-logo w-auto h-auto max-sm:max-w-[250px] sm:max-w-[260px] md:max-w-[300px] max-sm:max-h-[160px] sm:max-h-[145px] md:max-h-[170px] max-sm:scale-125 object-contain filter contrast-[1.08] brightness-[0.95] group-hover/brand:brightness-110 group-hover/brand:drop-shadow-[0_10px_30px_rgba(225,189,112,0.45)] transition-all duration-300"
                      src={brand.image}
                      alt={brand.name}
                      loading="lazy"
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
