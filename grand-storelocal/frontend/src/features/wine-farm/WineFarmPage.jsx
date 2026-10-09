import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import api from '../../api'
import wineFarmStyles from './wine-farm.css?inline'

const liveBase = ''

const heroSlides = [
  {
    image: '/assets/hero-vineyard.jpg',
    eyebrow: 'The Grand Store',
    title: 'Transform your passion into profit',
    copy: 'Tailor-made wine experiences for unforgettable memories.',
    focus: '68% center',
  },
  {
    image: '/assets/hero-wine.png',
    eyebrow: 'The Grand Store',
    title: 'Create a brand as unique as your taste',
    copy: 'Customized wine experiences that leave a lasting impression',
    focus: 'center',
  },
]

const privileges = [
  ['01', 'Exclusive Access', 'to premium wines'],
  ['02', 'Best Discounts', '& offers'],
  ['03', 'Private Invitations', 'to exclusive events'],
  ['04', 'Personal Picks', 'wine recommendations'],
]

const journeySteps = [
  {
    image: '/assets/journey-discover.png',
    title: 'Discover',
    copy: 'our wine and spirits destinations worldwide for your next luxury holiday.',
  },
  {
    image: '/assets/journey-choose.png',
    title: 'Choose',
    copy: 'to customize a tailor-made trip with a local expert or plan on your own.',
  },
  {
    image: '/assets/journey-contact.png',
    title: 'Contact',
    copy: 'our local travel experts or our wineries, distilleries, hotels & restaurants by simply filling out a form.',
  },
  {
    image: '/assets/journey-book.png',
    title: 'Book',
    copy: 'an unforgettable travel experience unique to Wine Paths. Relax & enjoy!',
  },
]

// Fallback estates shown when no vendors have published profiles yet
const FALLBACK_FARMS = [
  {
    name: 'Tesselaarsdal Wines',
    vendor: 'Ms. BERENE SAULS',
    image: '/assets/farm-tesselaarsdal.png',
    copy: 'Tesselaarsdal was founded in 2015 by long-standing Hamilton Russell Vineyards employee, Berene Sauls. This wine is named after the historic Overberg farming hamlet of Tesselaarsdal, not far from the Hemel-en-Aarde Ridge appellation, in which Berene was born - a descendant of the freed slaves who bequeathed the land by formaer East India Company settler, Johannes Tesselaar in 1810. Extreme care is takento ensure this small-production, clasically styled Pinot noir and Chardonnay express the personality of the cool, maritime Hemel-en-Aarde Ridge from un-irrigated vines and its elevated, stony, clay and iron-rich soils.',
  },
  {
    name: 'Original Wines',
    vendor: 'Mr. Grand Store',
    image: '/assets/farm-original.jpg',
    copy: 'Guilty Brand Wine is a celebration of bold flavors and refined craftsmanship. This full-bodied red wine offers a complex bouquet of dark fruits, chocolate, and spice, balanced by firm tannins and a long, smooth finish. Perfect for special occasions, it pairs beautifully with hearty dishes and aged cheeses. Produced using sustainable practices, it reflects a commitment to quality and environmental stewardship.Guilty Brand Wine is a celebration of bold flavors and refined craftsmanship.',
  },
]

const categories = [
  { name: 'Red Wine', image: '/assets/category-red.webp', href: '/shop?category=Wine&style=Red' },
  { name: 'White Wine', image: '/assets/category-white.webp', href: '/shop?category=Wine&style=White' },
  { name: 'Sparkling Wine', image: '/assets/category-sparkling.webp', href: '/shop?category=Wine&style=Sparkling' },
  { name: 'Rose Wine', image: '/assets/category-rose.webp', href: '/shop?category=Wine&style=Rose' },
]

const videos = [
  { id: '3oit_bGqjfA', title: 'Red Wine | Red Wines Online | Top 10 Red Wines | South Africa' },
  { id: '4qKj0T3NMqw', title: 'Wines | Online Wines | South Africa | Buy Wines Online' },
  { id: 'eihiYQP-hP8', title: 'Buy Wine Online The Grand Store | Online Wine Shop' },
  { id: '-qE9vRYYnIQ', title: 'The Grand Store | Shop Wine Online in South Africa' },
  { id: 'QREYAw7_gFY', title: 'Top 3 Sparkling Wine | Best 3 Wines you must try' },
  { id: 'YVVEMdJ_sZY', title: 'The Grand Store | Shop Wine Online in South Africa #southafrica' },
]

const initialTestimonials = [
  {
    name: 'Eleanor Sterling',
    image: '/assets/testimonial-1.jpg',
    quote: 'Selling our wines on this platform has been a game changer. The process is incredibly simple, and we’ve seen a significant increase in our sales. It’s wonderful to share our heritage with such a broad and appreciative audience.',
  },
  {
    name: 'James Harcourt',
    image: '/assets/testimonial-2.jpg',
    quote: 'As a small family-run vineyard, reaching new customers used to be a challenge. This portal has not only given us a beautiful space to showcase our wines but has also connected us with buyers we wouldn’t have reached otherwise. Highly recommended!',
  },
  {
    name: 'Alistair Montgomery',
    image: '/assets/testimonial-3.jpg',
    quote: 'We’re very pleased with how this platform has represented our wine farm. The quality of the listings and the visibility we’ve gained have exceeded our expectations. It’s been a great way to connect with wine enthusiasts and grow our customer base.',
  },
]

const faqs = [
  {
    group: 'General Questions',
    items: [
      ['What is The Grand Store?', 'The Grand Store is an online marketplace where registered vendors can sell their wines directly to consumers. We connect wine enthusiasts with a variety of wines from around the world.'],
      ['Who can buy wine on this platform?', 'Any individual of legal drinking age can purchase wine from our platform. Simply create an account, browse through the selection, and place your order.'],
      ['How do I create an account?', 'Click on the "Sign Up" button at the top of the page, fill in your details, and you’re ready to start exploring our wide range of wines.'],
      ['Is there a minimum order requirement?', 'Minimum order requirements may vary depending on the vendor. Please check the specific vendor’s page for more information.'],
    ],
  },
  {
    group: 'Vendor-Related Questions',
    items: [
      ['How can I become a vendor on The Grand Store?', 'To become a vendor, click on the "Become a Vendor" link at the bottom of the page and fill out the application form. Our team will review your application and get back to you within 2 business days.'],
      ['What are the benefits of selling my wine on this platform?', 'As a vendor on The Grand Store, you gain access to a large, engaged audience of wine enthusiasts. You can showcase your products, manage your listings, and increase your sales through our platform.'],
    ],
  },
]

const benefits = [
  { image: '/assets/benefit-voice.png', title: 'A Single voice for industry' },
  { image: '/assets/benefit-meeting.png', title: 'All activities coordinated around the industry strategy.' },
  { image: '/assets/benefit-globe.png', title: 'Single point of accountability for delivering on the overall industry strategy and needs.' },
  { image: '/assets/benefit-handshake.png', title: 'Optimised application of resources and improved collaboration between functions, in line with industry strategy and objectives.' },
  { image: '/assets/benefit-link.png', title: 'Improved speed and agility, especially in terms of decision-making.' },
  { image: '/assets/benefit-engagement.png', title: 'Increased flexibility in allocating funding to meet industry needs (consolidated levy structure).' },
]

const aboutSteps = [
  {
    image: '/assets/work-1.png',
    title: 'Become a Vendor',
    copy: "Start by registering as a vendor on our portal. It's quick and straightforward, allowing you to start listing your wines in no time.",
  },
  {
    image: '/assets/work-2.png',
    title: 'Share Your Farm Details',
    copy: 'After registering, you can add details about your wine farm. Tell your farm’s story, share what makes your vineyard unique, and give potential customers a glimpse into your world.',
  },
  {
    image: '/assets/work-3.png',
    title: 'List Your Products',
    copy: 'Add all your wines to our marketplace. Each wine will have its own page where you can include descriptions, prices, and photos, making it easy for customers to find what they’re looking for.',
  },
  {
    image: '/assets/work-4.png',
    title: 'Include Client Testimonials',
    copy: 'Boost your credibility by sharing testimonials from happy customers. Positive feedback can help attract new buyers and build trust in your brand.',
  },
  {
    image: '/assets/work-5.png',
    title: 'Write Blogs',
    copy: 'Connect with your audience by writing blogs about your winemaking process, vineyard life, or anything else that shows your passion for wine. Blogging helps keep your customers engaged and drives more visitors to your product listings.',
  },
  {
    image: '/assets/work-6.png',
    title: 'Advertise Your Wines',
    copy: 'Use our advertising options to promote your wines and reach a larger audience. Our marketing tools are designed to help you increase your sales and grow your customer base.',
  },
]

function Arrow({ direction = 'right' }) {
  return (
    <svg className={direction === 'left' ? 'icon flip' : 'icon'} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h14M14 6l6 6-6 6" />
    </svg>
  )
}

function LeafMark() {
  return (
    <svg className="leaf-mark" viewBox="0 0 92 38" aria-hidden="true">
      <path d="M2 34C24 30 32 17 43 3c3 15 12 24 31 25" />
      <path d="M42 5C29 9 23 16 23 27M43 5c9 4 16 11 19 20" />
    </svg>
  )
}

function SectionHeading({ kicker, title, copy, align = 'left' }) {
  return (
    <div className={`section-heading ${align === 'center' ? 'center' : ''}`}>
      <div className="kicker"><LeafMark />{kicker}</div>
      <h2>{title}</h2>
      {copy && <p>{copy}</p>}
    </div>
  )
}

function Header() {
  const [open, setOpen] = useState(false)
  const closeMenu = () => setOpen(false)
  const currentPath = window.location.pathname.replace(/\/+$/, '')
  const onInnerPage = currentPath.endsWith('/contact') || currentPath.endsWith('/about')
  const sectionLink = (section) => onInnerPage ? `/winefarm/${section}` : section

  return (
    <>
      <div className="estate-bar">
        <p>Rooted in South Africa <span>•</span> Open to the world</p>
        <div>
          <a href="tel:+27665315815">+27 66 531 5815</a>
          <a href="mailto:info@grandstore.co.za">info@grandstore.co.za</a>
        </div>
      </div>
      <header className="site-header">
        <a className="brand" href="/winefarm/#top" aria-label="The Grand Store wine farm home">
          <img src="/winefarm-logo.webp" alt="The Grand Store Wine Farm" />
        </a>
        <nav className={open ? 'site-nav open' : 'site-nav'} aria-label="Primary navigation">
          <a href="/winefarm/#top" onClick={closeMenu}>Home</a>
          <a href="/winefarm/about" onClick={closeMenu}>About Us</a>
          <a href={sectionLink('#farms')} onClick={closeMenu}>Wine Farm</a>
          <a href={sectionLink('#categories')} onClick={closeMenu}>Shop Wines</a>
          <a href="https://grandstore.co.za/winefarm/blogs" target="_blank" rel="noreferrer">Blogs</a>
          <a href="/winefarm/contact" onClick={closeMenu}>Contact Us</a>
          <Link className="mobile-vendor" to="/vendor-portal">Become A Vendor</Link>
        </nav>
        <Link className="header-cta" to="/vendor-portal">
          Become A Vendor <Arrow />
        </Link>
        <button
          className={open ? 'menu-button active' : 'menu-button'}
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
        </button>
      </header>
    </>
  )
}

function Hero() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % heroSlides.length)
    }, 3000)
    return () => window.clearInterval(timer)
  }, [paused])

  const goTo = (index) => setActive((index + heroSlides.length) % heroSlides.length)

  return (
    <section
      className="hero"
      id="top"
      aria-roledescription="carousel"
      aria-label="Wine farm highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="hero-track" style={{ transform: `translateX(-${active * 100}%)` }}>
        {heroSlides.map((slide, index) => (
          <article className="hero-slide" key={slide.title} aria-hidden={active !== index}>
            <img src={slide.image} alt="" style={{ objectPosition: slide.focus }} />
            <div className="hero-shade" />
            <div className="hero-content">
              <div className="hero-eyebrow"><span /> {slide.eyebrow}</div>
              <h1>{slide.title}</h1>
              <p>{slide.copy}</p>
              <div className="hero-actions">
                <a className="button button-light" href="#about">Explore More <Arrow /></a>
                <a className="text-link light" href="#farms">Meet the estates <span>↗</span></a>
              </div>
            </div>
          </article>
        ))}
      </div>
      <div className="hero-crop-note" aria-hidden="true">
        <span>34° S</span>
        <i />
        <span>Harvest 2026</span>
      </div>

    </section>
  )
}

function Privileges() {
  return (
    <section className="privileges" aria-label="Membership privileges">
      <div className="privileges-intro">
        <span>The cellar key</span>
        <strong>Four privileges.<br />One cultivated world.</strong>
      </div>
      <div className="privilege-list">
        {privileges.map(([number, title, copy]) => (
          <article key={number}>
            <span>{number}</span>
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

const FloralDecoration = () => (
  <svg className="floral-decor" viewBox="0 0 200 400" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M100 400 C100 300 150 200 50 50" stroke="#17372d" strokeWidth="2" opacity="0.15" strokeLinecap="round" />
    <path d="M90 320 C140 300 170 250 130 220 C100 200 80 250 90 320" fill="#17372d" opacity="0.08" />
    <path d="M110 240 C170 200 180 130 140 120 C100 110 90 170 110 240" fill="#17372d" opacity="0.08" />
    <path d="M80 150 C30 120 10 50 60 30 C100 10 110 80 80 150" fill="#17372d" opacity="0.08" />
    <circle cx="50" cy="50" r="10" fill="#d7ad69" opacity="0.4" />
    <circle cx="130" cy="220" r="8" fill="#d7ad69" opacity="0.4" />
    <circle cx="140" cy="120" r="12" fill="#d7ad69" opacity="0.3" />
  </svg>
)

function About() {
  return (
    <section className="about section-pad" id="about">
      <div className="about-art">
        <FloralDecoration />
        <div className="about-full-image-wrapper">
          <img src="/assets/about_wine_bottle_new.jpg" alt="Wine bottle with botanical artwork" />
        </div>
        <blockquote>“Every bottle carries the landscape that raised it.”</blockquote>
      </div>
      <div className="about-copy">
        <SectionHeading kicker="About us" title={<>Welcome to South African<br /><em>Wine Farms Estate</em></>} />
        <p>We've crafted a unique platform tailored specifically for wine farmers from South Africa and beyond. Our mission is to provide a seamless way for vineyards to showcase their products and reach a global audience. Whether you're a small family-run vineyard or a larger estate, our portal is designed to help you expand your market presence and connect with wine lovers and businesses around the world.</p>
        <p>By joining our platform, wine farmers can easily register as vendors and create detailed profiles that highlight their farm’s story, unique offerings, and the rich heritage behind their wines. This not only allows you to tell your vineyard’s story but also provides potential customers and retailers with an in-depth look at what makes your wines special.</p>
        <p>You can list your entire range of products with detailed descriptions, pricing, and high-quality images, making it easy for consumers to find and purchase your wines directly from the comfort of their homes.</p>
        <a className="button button-dark" href="/winefarm/about">Read More <Arrow /></a>
      </div>
    </section>
  )
}

function Specials() {
  return (
    <section className="specials section-pad">
      <div className="specials-title">
        <SectionHeading kicker="Curated escapes" title={<>Get The <em>Specials</em></>} />
        <p>Beyond the cellar door, discover considered journeys made for the curious traveller.</p>
        <a className="text-link" href={`${liveBase}/vendor-portal`} target="_blank" rel="noreferrer">Advertise With Us <span>↗</span></a>
      </div>
      <div className="specials-list">
        <a className="special-card" href={`${liveBase}/vendor-portal`} target="_blank" rel="noreferrer" aria-label="View the Victoria Falls travel promotion">
          <img src="/assets/ad-flight.png" alt="Win a trip to Victoria Falls, Zambia with an exclusive tour package" loading="lazy" />
        </a>
        <a className="special-card" href={`${liveBase}/vendor-portal`} target="_blank" rel="noreferrer" aria-label="View the Zambia resort promotion">
          <img src="/assets/ad-resort.png" alt="Save up to twenty percent on hotel offers in Zambia" loading="lazy" />
        </a>
      </div>
    </section>
  )
}

function Journey() {
  return (
    <section className="journey section-pad" id="journey">
      <SectionHeading
        kicker="The cellar-to-suite journey"
        title={<>Get access to the most exclusive<br /><em>estates all over the world</em></>}
        align="center"
      />
      <div className="journey-line" aria-hidden="true" />
      <div className="journey-grid">
        {journeySteps.map((step, index) => (
          <article key={step.title}>
            <div className="journey-icon">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <img src={step.image} alt="" />
            </div>
            <h3>{step.title}</h3>
            <p>{step.copy}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function Farms() {
  const [estates, setEstates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/estates`)
      .then(res => setEstates(Array.isArray(res.data) ? res.data : []))
      .catch(() => setEstates([]))
      .finally(() => setLoading(false));
  }, []);

  // If no published estates yet, fall back to static placeholders
  const showFallback = !loading && estates.length === 0;

  return (
    <section className="farms section-pad" id="farms">
      <div className="farms-heading">
        <SectionHeading kicker="Farm journal" title={<>Explore By <em>Cultivar</em></>} />
        <p>Two distinct stories shaped by soil, sea air, heritage and an unhurried devotion to craft.</p>
      </div>
      
      {loading ? (
        <div className="farm-stack" style={{ opacity: 0.5 }}>
          {[1,2].map(i => <div key={i} style={{ height: '300px', background: 'var(--paper-deep)' }} />)}
        </div>
      ) : showFallback ? (
        <div className="farm-stack">
          {FALLBACK_FARMS.map((farm, index) => (
            <article className="farm-card" key={farm.name}>
              <div className="farm-image">
                <img src={farm.image} alt={farm.name} />
                <span>{String(index + 1).padStart(2, '0')} / Featured estate</span>
              </div>
              <div className="farm-copy">
                <p className="farm-vendor">Vendor : {farm.vendor}</p>
                <h3>{farm.name}</h3>
                <p>{farm.copy}</p>
                <a className="text-link" href="#farms">Read More <span>↗</span></a>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="farm-stack">
          {estates.map((estate, index) => (
            <article className="farm-card" key={estate._id}>
              <div className="farm-image">
                {estate.heroImageUrl ? (
                  <img src={estate.heroImageUrl} alt={estate.estateName} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'var(--paper-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🍷</div>
                )}
                <span>{String(index + 1).padStart(2, '0')} / {estate.region || 'Featured estate'}</span>
              </div>
              <div className="farm-copy">
                <p className="farm-vendor">Vendor : {estate.estateName}</p>
                <h3>{estate.estateName}</h3>
                <p>{estate.tagline || 'Explore the exquisite wines of our featured estate, shaped by heritage and an unhurried devotion to craft.'}</p>
                <Link className="text-link" to={`/estate/${estate.slug}`}>Explore <span>↗</span></Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

function VendorCta() {
  return (
    <section className="vendor-cta">
      <div className="vendor-cta-rings" aria-hidden="true"><i /><i /><i /></div>
      <span>For growers • makers • visionaries</span>
      <h2>Your journey to success<br /><em>starts here</em></h2>
      <p>Forge unforgettable memories and seize business opportunities with our custom wine experiences.</p>
      <Link className="button button-light" to="/vendor-portal">Become A Vendor <Arrow /></Link>
    </section>
  )
}

function Categories() {
  return (
    <section className="categories section-pad" id="categories">
      <div className="categories-copy">
        <SectionHeading kicker="Shop the cellar" title={<>Explore Top <em>Categories</em></>} />
        <p>Discover South Africa's finest wines, selected from celebrated regions and expressive vineyards.</p>
      </div>
      <div className="category-wheel">
        {categories.map((category, index) => (
          <a href={category.href} className="category-card" key={category.name}>
            <span className="category-index">0{index + 1}</span>
            <div className="category-bottle"><img src={category.image} alt="" /></div>
            <div><h3>{category.name}</h3><p>Discover South Africa's finest {category.name.toLowerCase()}s.</p></div>
            <span className="category-arrow">↗</span>
          </a>
        ))}
      </div>
    </section>
  )
}

function VideoSection() {
  const [selected, setSelected] = useState(0)
  const activeVideo = videos[selected]
  return (
    <section className="videos section-pad">
      <div className="video-heading">
        <SectionHeading kicker="From the field" title={<>Trending <em>Video</em></>} />
        <p>Stories, tastings and bottles worth knowing—broadcast from The Grand Store.</p>
      </div>
      <div className="video-stage">
        <a href={`https://www.youtube.com/watch?v=${activeVideo.id}`} target="_blank" rel="noreferrer" className="video-cover">
          <img src={`https://i.ytimg.com/vi/${activeVideo.id}/maxresdefault.jpg`} alt="" />
          <span className="play-button">▶</span>
          <div><small>Now playing • 0{selected + 1}</small><h3>{activeVideo.title}</h3></div>
        </a>
        <div className="video-list" role="list" aria-label="Select a video">
          {videos.map((video, index) => (
            <button className={selected === index ? 'active' : ''} type="button" onClick={() => setSelected(index)} key={video.id}>
              <span>0{index + 1}</span>
              <strong>{video.title}</strong>
              <i>↗</i>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

function Testimonials() {
  const [active, setActive] = useState(0)
  const [testimonials, setTestimonials] = useState(initialTestimonials)

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await api.get(`/settings/testimonials`);
        const data = response.data;
        if (data && data.length > 0) {
          setTestimonials(data);
        }
      } catch (error) {
        console.error('Error fetching testimonials:', error);
      }
    };
    fetchTestimonials();
  }, []);

  return (
    <section className="testimonials section-pad">
      <div className="testimonial-intro">
        <SectionHeading kicker="From our community" title={<>Grown on trust.<br /><em>Shared with pride.</em></>} />
        <div className="testimonial-nav">
          <button type="button" onClick={() => setActive((active + testimonials.length - 1) % testimonials.length)} aria-label="Previous testimonial"><Arrow direction="left" /></button>
          <span>0{active + 1} / 0{testimonials.length}</span>
          <button type="button" onClick={() => setActive((active + 1) % testimonials.length)} aria-label="Next testimonial"><Arrow /></button>
        </div>
      </div>
      <article className="testimonial-card">
        <div className="testimonial-portrait"><img src={testimonials[active].image} alt={testimonials[active].name} /></div>
        <div>
          <span className="quote-mark">“</span>
          <blockquote>{testimonials[active].quote}</blockquote>
          <p>{testimonials[active].name}</p>
          <small>{testimonials[active].role || 'Wine farm partner'}</small>
        </div>
      </article>
    </section>
  )
}

function NewsletterFaq() {
  const [open, setOpen] = useState('0-0')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const handleSubmit = (event) => {
    event.preventDefault()
    setSubmitted(true)
    setEmail('')
  }

  return (
    <>
      <section className="newsletter">
        <img src="/assets/newsletter.jpg" alt="Wine bottles in an estate cellar" />
        <div className="newsletter-copy">
          <span>Our Newsletter</span>
          <h2>Let's keep the<br /><em>conversation going!</em></h2>
          <p>Receive our newsletter and discover our stories, collections and events.</p>
          <form onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="newsletter-email">Enter your email</label>
            <input id="newsletter-email" type="email" required placeholder="Enter your Email..." value={email} onChange={(event) => setEmail(event.target.value)} />
            <button type="submit" aria-label="Subscribe">Subscribe <Arrow /></button>
          </form>
          {submitted && <p className="form-note" role="status">Thank you. You're on the list.</p>}
        </div>
      </section>

      <section className="faq section-pad" id="faq">
        <div className="faq-aside">
          <SectionHeading kicker="Good to know" title={<>Frequently asked<br /><em>questions</em></>} align="center" />
          <div className="faq-illustration"><img src="/assets/faq_wine_new.jpg" alt="Wine FAQ Illustration" /></div>
          <a className="text-link" href="#faq">Read All <span>↗</span></a>
        </div>
        <div className="faq-list">
          {faqs.map((group, groupIndex) => (
            <div className="faq-group" key={group.group}>
              <h3>{group.group}</h3>
              {group.items.map(([question, answer], itemIndex) => {
                const key = `${groupIndex}-${itemIndex}`
                const isOpen = open === key
                return (
                  <article className={isOpen ? 'faq-item open' : 'faq-item'} key={question}>
                    <button type="button" onClick={() => setOpen(isOpen ? '' : key)} aria-expanded={isOpen}>
                      <span>{question}</span><i>{isOpen ? '−' : '+'}</i>
                    </button>
                    <div className="faq-answer"><p>{answer}</p></div>
                  </article>
                )
              })}
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function Benefits() {
  return (
    <section className="benefits section-pad" id="benefits">
      <div className="benefits-heading">
        <SectionHeading
          kicker="Better together"
          title={<>The Benefits of being a Registered<br />Vendor of <em>South Africa WINE</em></>}
          copy="A connected industry grows further, faster—while giving every estate a stronger place at the table."
          align="center"
        />
      </div>
      <div className="benefits-grid">
        {benefits.map((benefit, index) => (
          <article key={benefit.title}>
            <div className="benefit-top"><span>0{index + 1}</span><i /></div>
            <img src={benefit.image} alt="" />
            <h3>{benefit.title}</h3>
          </article>
        ))}
      </div>
      <div className="benefits-stamp" aria-hidden="true"><span>EST.</span><strong>2015</strong><span>SOUTH AFRICA</span></div>
    </section>
  )
}

function AboutPage() {
  useEffect(() => {
    document.title = 'About Us | Explore the World of Wine | The Grand Store'
    window.scrollTo(0, 0)
  }, [])

  return (
    <main className="about-page" id="top">
      <section className="about-page-hero">
        <div className="about-page-hero-copy">
          <div className="kicker"><LeafMark /> The Grand Store - Wine Farm</div>
          <h1>Welcome to South African<br /><em>Wine Farms Estate</em></h1>
          <p>A platform made for the people, places and stories behind every bottle.</p>
          <a className="button button-light" href="#our-story">Our Story <span>↓</span></a>
        </div>
        <div className="about-page-hero-image">
          <img src="/assets/about-story.jpg" alt="A curated collection of wine bottles prepared for tasting" />
          <span>Estate Journal • 2026</span>
        </div>
      </section>

      <section className="about-values" aria-label="Our values">
        {['Explore', 'Savor', 'Connect', 'Grow'].map((value, index) => (
          <article key={value}><span>0{index + 1}</span><h2>{value}</h2><i /></article>
        ))}
      </section>

      <section className="about-page-story section-pad" id="our-story">
        <div className="about-story-heading">
          <SectionHeading kicker="Our estate story" title={<>Made to take a vineyard’s<br /><em>story further.</em></>} />
          <div className="about-story-seal" aria-hidden="true"><strong>SA</strong><span>Wine Farms Estate</span></div>
        </div>
        <div className="about-story-copy">
          <p className="about-story-lead">We've crafted a unique platform tailored specifically for wine farmers from South Africa and beyond. Our mission is to provide a seamless way for vineyards to showcase their products and reach a global audience. Whether you're a small family-run vineyard or a larger estate, our portal is designed to help you expand your market presence and connect with wine lovers and businesses around the world.</p>
          <p>By joining our platform, wine farmers can easily register as vendors and create detailed profiles that highlight their farm’s story, unique offerings, and the rich heritage behind their wines. This not only allows you to tell your vineyard’s story but also provides potential customers and retailers with an in-depth look at what makes your wines special. You can list your entire range of products with detailed descriptions, pricing, and high-quality images, making it easy for consumers to find and purchase your wines directly from the comfort of their homes.</p>
        </div>
      </section>

      <section className="about-market">
        <div className="about-market-heading">
          <span>One platform • Two markets</span>
          <h2>B2C and B2B</h2>
        </div>
        <div className="about-market-copy">
          <article>
            <span>01 / Wider opportunity</span>
            <p>Our platform is built to serve both B2C (Business to Consumer) and B2B (Business to Business) markets. This means you can sell your wines directly to individual customers who appreciate the convenience of buying online, as well as engage in bulk deals with retailers, wholesalers, and other businesses. This dual-market approach helps you maximize your sales opportunities and reach a wider audience.</p>
          </article>
          <article>
            <span>02 / Tools for growth</span>
            <p>In addition to product listings, our portal offers a variety of marketing and promotional tools designed to help you grow your brand. You can feature customer testimonials to build trust and credibility, write blogs to engage with your audience, and use targeted advertising to promote your products. Our goal is to provide you with all the resources you need to succeed in the competitive wine market.</p>
          </article>
          <article>
            <span>03 / Stories worth sharing</span>
            <p>At South African Wine Farms Estate, we are committed to celebrating the art of winemaking and supporting the people who make it possible. By joining our platform, you're not just selling wine – you're sharing the story of your land, your passion, and your craft with the world. Whether you're looking to reach new customers, connect with retailers, or simply expand your brand's reach, our portal is the perfect place to grow your wine business.</p>
          </article>
        </div>
      </section>

      <section className="about-join">
        <div><span>Your next vintage starts here</span><h2>Sign up today and start sharing the fruits of your vineyard with a global audience!</h2></div>
        <Link className="button button-light" to="/vendor-portal">Join Now <Arrow /></Link>
      </section>

      <section className="about-process section-pad">
        <SectionHeading
          kicker="From field to marketplace"
          title={<>How It <em>Works</em></>}
          copy="Six practical steps give every wine farm a clear route from registration to a growing audience."
          align="center"
        />
        <div className="about-process-grid">
          {aboutSteps.map((step, index) => (
            <article key={step.title}>
              <div className="about-process-image"><img src={step.image} alt="" /><span>0{index + 1}</span></div>
              <div><h3>{step.title}</h3><p>{step.copy}</p></div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

function ContactIcon({ type }) {
  const paths = {
    phone: <><path d="M7.4 3.8 10 7.7 8.2 9.5c1.3 2.8 3.5 5 6.3 6.3l1.8-1.8 3.9 2.6-.8 3.2c-.2.8-.9 1.3-1.7 1.3C9.5 20.8 3.2 14.5 2.9 6.3c0-.8.5-1.5 1.3-1.7l3.2-.8Z" /></>,
    email: <><rect x="3" y="5" width="18" height="14" rx="1" /><path d="m4 7 8 6 8-6" /></>,
    address: <><path d="M20 10c0 5.4-8 11-8 11S4 15.4 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[type]}</svg>
}

function ContactPage() {
  const [form, setForm] = useState({ firstname: '', lastname: '', email: '', phone: '', message: '', website: '' })
  const [status, setStatus] = useState({ type: '', message: '' })

  useEffect(() => {
    document.title = 'Contact Us | Get in Touch with Grandstore – Wine & Liquor Trade Experts'
    window.scrollTo(0, 0)
  }, [])

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    const phonePattern = /^\+?[\d\s\-().]{10,20}$/
    if (form.website) {
      setStatus({ type: 'success', message: 'Thank you for your enquiry' })
      return
    }
    if (!form.firstname) return setStatus({ type: 'error', message: 'First Name is required' })
    if (!form.lastname) return setStatus({ type: 'error', message: 'Last Name is required' })
    if (!form.email) return setStatus({ type: 'error', message: 'Email is required' })
    if (!emailPattern.test(form.email)) return setStatus({ type: 'error', message: 'Please enter a valid email address' })
    if (!form.phone) return setStatus({ type: 'error', message: 'Phone No is required' })
    if (!phonePattern.test(form.phone)) return setStatus({ type: 'error', message: 'Please enter a valid phone number' })
    if (!form.message) return setStatus({ type: 'error', message: 'Message is required' })
    setStatus({ type: 'success', message: 'Thank you for your enquiry' })
    setForm({ firstname: '', lastname: '', email: '', phone: '', message: '', website: '' })
  }

  const details = [
    { type: 'phone', number: '01', title: 'Contact Number', content: <a href="tel:+27665315815">+27 66 531 5815</a> },
    { type: 'email', number: '02', title: 'Email Address', content: <a href="mailto:vendor@grandstore.co.za">vendor@grandstore.co.za</a> },
    { type: 'address', number: '03', title: 'Address', content: <p>Pivot Building , 1 Montecasino Blvd,<br />Fourways, Sandton<br />Johannesburg, 2191, South Africa</p> },
  ]

  return (
    <main className="contact-page" id="top">
      <section className="contact-hero">
        <div className="contact-hero-copy">
          <div className="kicker"><LeafMark /> Contact us</div>
          <h1>Let’s <em>Connect.</em></h1>
          <p>Wine, trade or partnership enquiries—our team is ready to help.</p>
        </div>
        <div className="contact-hero-mark" aria-hidden="true"><span>SA</span><i /><small>34° S • 18° E</small></div>
      </section>

      <section className="contact-details" aria-label="Contact details">
        {details.map((detail) => (
          <article key={detail.title}>
            <div className="contact-detail-top"><span>{detail.number}</span><ContactIcon type={detail.type} /></div>
            <h2>{detail.title}</h2>
            {detail.content}
          </article>
        ))}
      </section>

      <section className="contact-form-section">
        <div className="contact-form-intro">
          <span>Enquiries • Partnerships • Wine Farm Support</span>
          <h2>Let's<br /><em>Connect.</em></h2>
          <p>Complete the form and share what you need with our team.</p>
          <div className="contact-form-seal" aria-hidden="true"><strong>TGS</strong><small>South African Wine Farms Estate</small></div>
        </div>
        <form className="contact-form" onSubmit={handleSubmit} noValidate>
          <input className="contact-honeypot" type="text" name="website" value={form.website} onChange={updateField} tabIndex="-1" autoComplete="off" />
          <label>
            <span>First Name</span>
            <input type="text" name="firstname" placeholder="First Name" value={form.firstname} onChange={updateField} />
          </label>
          <label>
            <span>Last Name</span>
            <input type="text" name="lastname" placeholder="Last Name" value={form.lastname} onChange={updateField} />
          </label>
          <label>
            <span>Email</span>
            <input type="email" name="email" placeholder="Email" value={form.email} onChange={updateField} />
          </label>
          <label>
            <span>Contact No</span>
            <input type="tel" name="phone" placeholder="Contact No" value={form.phone} onChange={updateField} />
          </label>
          <label className="contact-message">
            <span>Message</span>
            <textarea name="message" placeholder="Message" rows="6" value={form.message} onChange={updateField} />
          </label>
          {status.message && <p className={`contact-status ${status.type}`} role="status">{status.message}</p>}
          <button className="button button-dark" type="submit">Submit <Arrow /></button>
        </form>
      </section>
    </main>
  )
}

function Footer() {
  return (
    <footer className="footer" id="contact">
      <div className="footer-lead">
        <div>
          <span>Ready to take your place?</span>
          <h2>Bring your vineyard<br /><em>to a wider world.</em></h2>
        </div>
        <Link className="button button-light" to="/vendor-portal">Become A Vendor <Arrow /></Link>
      </div>
      <div className="footer-grid">
        <div className="footer-about">
          <img src="/winefarm-logo.webp" alt="The Grand Store Wine Farm" />
          <p>At South African Wine Farms Estate, we’ve teamed up with Grandstore to create a platform where wine farmers from around the world can easily showcase their vineyards and market their wines.</p>
          <div className="socials"><a href="#">Fb</a><a href="#">In</a><a href="#">X</a><a href="#">Pt</a></div>
        </div>
        <div className="footer-links">
          <h3>Support</h3>
          <a href="/winefarm/about">About Us</a>
          <a href="/winefarm/contact">Contact Us</a>
          <a href="/winefarm/#farms">Wine Farms</a>
          <a href="https://grandstore.co.za/winefarm/blogs">Latest Blogs</a>
        </div>
        <div className="footer-links">
          <h3>Important Links</h3>
          <Link to="/vendor-portal">Become A Vendor</Link>
          <Link to="/vendor-admin">Vendor Login</Link>
          <Link to="/shop/wine">Shop Wine</Link>
          <Link to="/offers">Exclusive Offers</Link>
        </div>
        <address>
          <h3>Contact Us</h3>
          <a href="tel:+27665315815">+27 66 531 5815</a>
          <a href="mailto:info@grandstore.co.za">info@grandstore.co.za</a>
          <p>The Pivot,1 montecasino blvd,<br />Block E first Floor, Fourways.<br />Johannesburg 2191, South Africa</p>
        </address>
      </div>
      <div className="footer-bottom"><p>© 2026 The Grand Store. All Rights Reserved.</p><a href="/winefarm/#top">Back to the estate ↑</a></div>
    </footer>
  )
}

function WineFarmContent() {
  const mainRef = useRef(null)
  const currentPath = window.location.pathname.replace(/\/+$/, '')
  const contactPage = currentPath.endsWith('/contact')
  const aboutPage = currentPath.endsWith('/about')

  const handleLocalAnchorClick = (event) => {
    const anchor = event.target.closest('a')
    const href = anchor?.getAttribute('href')
    if (!href?.startsWith('#')) return
    const target = mainRef.current?.querySelector(href)
    if (!target) return
    event.preventDefault()
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.history.replaceState(null, '', `${window.location.pathname}${href}`)
  }

  useEffect(() => {
    if (contactPage || aboutPage) return
    document.title = 'South African Wine Farms Estate | The Grand Store'
  }, [aboutPage, contactPage])

  useEffect(() => {
    const querySection = new URLSearchParams(window.location.search).get('section')
    const selector = querySection ? `#${querySection}` : window.location.hash
    if (!selector) return
    const target = mainRef.current?.querySelector(selector)
    if (!target) return
    window.requestAnimationFrame(() => {
      const previousBehavior = document.documentElement.style.scrollBehavior
      document.documentElement.style.scrollBehavior = 'auto'
      window.scrollTo(0, target.offsetTop)
      document.documentElement.style.scrollBehavior = previousBehavior
    })
  }, [])

  useEffect(() => {
    const root = mainRef.current
    if (!root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const elements = root.querySelectorAll('.section-heading, .farm-card, .category-card, .benefits-grid article')
    elements.forEach((element) => element.classList.add('reveal'))
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.12 })
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  if (contactPage) {
    return (
      <div className="wine-farm-site" ref={mainRef} onClick={handleLocalAnchorClick}>
        <Header />
        <ContactPage />
        <Footer />
      </div>
    )
  }

  if (aboutPage) {
    return (
      <div className="wine-farm-site" ref={mainRef} onClick={handleLocalAnchorClick}>
        <Header />
        <AboutPage />
        <Footer />
      </div>
    )
  }

  return (
    <div className="wine-farm-site" ref={mainRef} onClick={handleLocalAnchorClick}>
      <Header />
      <main>
        <Hero />
        <Privileges />
        <About />
        <Specials />
        <Journey />
        <Farms />
        <VendorCta />
        <Categories />
        <VideoSection />
        <Testimonials />
        <NewsletterFaq />
        <Benefits />
      </main>
      <Footer />
    </div>
  )
}

export default function WineFarmPage() {
  const hostRef = useRef(null)
  const [shadowRoot, setShadowRoot] = useState(null)

  useEffect(() => {
    if (!hostRef.current) return
    setShadowRoot(hostRef.current.shadowRoot || hostRef.current.attachShadow({ mode: 'open' }))
  }, [])

  return (
    <div className="wine-farm-route-host" ref={hostRef}>
      {shadowRoot && createPortal(
        <>
          <style>{wineFarmStyles}</style>
          <WineFarmContent />
        </>,
        shadowRoot,
      )}
    </div>
  )
}
