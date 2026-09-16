import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Calendar, Clock } from 'lucide-react'
import api from '../../../api'

const DEFAULT_BLOG_POSTS = [
  {
    slug: 'top-10-must-try-premium-liquors-available-at-the-grand-store',
    title: 'Top 10 Must-Try Premium Liquors Available at The Grand Store',
    titleBefore: 'Top 10 Must-Try ',
    titleAccent: 'Premium Liquors',
    titleAfter: ' Available at The Grand Store',
    date: '14 Apr 2025',
    readTime: '5 min read',
    category: 'The Grand Edit',
    image: '/assets/blogs/premium-liquors.jpg',
    excerpt: 'A considered shortlist of celebrated Scotch, polished vodka, fine Cognac and distinctly South African bottles curated for the modern cabinet.',
  },
  {
    slug: 'top-south-african-brandy-brands-you-can-order-online',
    title: 'Top South African Brandy Brands You Can Order Online',
    titleBefore: 'Top South African ',
    titleAccent: 'Brandy Brands',
    titleAfter: ' You Can Order Online',
    date: '26 Mar 2025',
    readTime: '4 min read',
    category: 'Brandy Journal',
    image: '/assets/blogs/south-african-brandy-brands.jpeg',
    excerpt: 'From Stellenbosch oak maturation to Robertson heritage, meet the local master distillers giving Cape potstill its world-class acclaim.',
  },
  {
    slug: 'top-10-whiskey-brands-you-can-buy-online-in-south-africa',
    title: 'Top 10 Whiskey Brands You Can Buy Online in South Africa',
    titleBefore: 'Top 10 ',
    titleAccent: 'Whiskey Brands',
    titleAfter: ' You Can Buy Online in South Africa',
    date: '19 Mar 2025',
    readTime: '6 min read',
    category: 'Whisky Journal',
    image: '/assets/blogs/whiskey-brands.jpg',
    excerpt: 'Homegrown favourites and international icons for collectors discovering their next elegant everyday dram or investment bottle.',
  },
]

export default function LatestBlogs() {
  const [posts, setPosts] = useState(DEFAULT_BLOG_POSTS)

  useEffect(() => {
    let isMounted = true
    api.get('/blogs')
      .then(res => {
        if (isMounted && Array.isArray(res.data) && res.data.length > 0) {
          setPosts(res.data)
        }
      })
      .catch(err => {
        console.warn('Using default blog posts:', err.message)
      })

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <section
      className="relative overflow-hidden border-y border-white/10 bg-[#0b0907] py-7 text-[#f3ede2] md:py-9"
      id="journal"
      aria-labelledby="latest-blogs-title"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#d8b56c]/45" />

      <div className="relative z-10 mx-auto max-w-[1390px] px-5 sm:px-8 xl:px-10">
        <header
          className="border-b border-[#d8b56c]/22 pb-4 md:pb-5"
        >
          <div>
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.23em] text-[#d8b56c]">
              Stories from the cellar
            </span>
            <h2
              id="latest-blogs-title"
              className="m-0 font-serif text-[clamp(42px,4.7vw,66px)] font-medium leading-[0.92] tracking-[-0.04em] text-[#f3ede2]"
            >
              Explore the <span className="text-[#dfbd72]">Journal</span>
            </h2>
          </div>
        </header>
        <div>
          {posts.map((post, index) => {
            const imageFirst = index % 2 === 0
            const hasAccent = Boolean(post.titleAccent)

            return (
              <article
                className="group/story grid grid-cols-1 items-center gap-4 border-b border-[#d8b56c]/18 py-5 transition-colors duration-500 hover:bg-[#d8b56c]/[0.025] md:gap-5 md:py-6 lg:grid-cols-2 lg:gap-[clamp(28px,3.5vw,52px)]"
                key={post.slug || post._id || index}
              >
                <Link
                  className={`relative block overflow-hidden bg-[#17130e] shadow-[0_20px_55px_rgba(0,0,0,0.28)] ring-1 ring-inset ring-[#e0be70]/10 transition-[box-shadow] duration-500 group-hover/story:shadow-[0_24px_70px_rgba(0,0,0,0.42)] ${imageFirst ? '' : 'lg:order-2'}`}
                  to={`/blog/${post.slug}`}
                  aria-label={`Read ${post.title}`}
                >
                  <div className="w-full overflow-hidden">
                    <img
                      className="h-auto w-full object-cover object-center transition-transform duration-700 ease-out group-hover/story:scale-[1.03]"
                      src={post.image}
                      alt={post.title}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <span className="flex min-h-8 items-center border-t border-[#edce82]/30 bg-[#cda858] px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-[#100c06] transition-colors duration-500 group-hover/story:bg-[#dfbd72] sm:text-[10px]">
                    {String(index + 1).padStart(2, '0')} / {index === 0 ? 'Featured story' : post.category}
                  </span>
                </Link>

                <div className={`${imageFirst ? '' : 'lg:order-1'} relative text-left`}>
                  <span
                    className="absolute -left-5 top-0 hidden h-14 w-px bg-[#d8b56c]/65 transition-all duration-500 group-hover/story:h-24 lg:block"
                    aria-hidden="true"
                  />

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d8b56c] sm:text-[11px]">
                      Edition {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="h-px w-8 bg-[#d8b56c]/65" aria-hidden="true" />
                    <span className="font-serif text-[14px] italic tracking-[0.02em] text-[#c9bda9] sm:text-[15px]">
                      {post.category}
                    </span>
                  </div>

                  <h3 className="mb-0 mt-2.5 max-w-[640px] font-serif text-[clamp(29px,2.9vw,44px)] font-medium leading-[1.08] tracking-[-0.03em] text-[#f3ede2]">
                    <Link className="transition-colors duration-300" to={`/blog/${post.slug}`} aria-label={post.title}>
                      {hasAccent ? (
                        <>
                          {post.titleBefore}
                          <span className="inline text-[#dfbd72]">
                            {post.titleAccent}
                          </span>
                          {post.titleAfter}
                        </>
                      ) : (
                        post.title
                      )}
                    </Link>
                  </h3>

                  <p className="mb-0 mt-2.5 max-w-[610px] text-[14px] leading-[1.55] text-[#aaa297] md:text-[15px]">
                    {post.excerpt}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-semibold uppercase tracking-[0.11em] text-[#938b80]">
                    <span className="flex items-center gap-2">
                      <Calendar size={14} strokeWidth={1.5} aria-hidden="true" /> {post.date}
                    </span>
                    <span className="flex items-center gap-2">
                      <Clock size={14} strokeWidth={1.5} aria-hidden="true" /> {post.readTime}
                    </span>
                  </div>

                  <Link
                    className="mt-4 inline-flex items-center gap-6 border-b border-[#d8b56c] pb-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#e5c577] transition-[filter,border-color] hover:border-white hover:brightness-125"
                    to={`/blog/${post.slug}`}
                  >
                    <span>Read story</span>
                    <ArrowUpRight className="transition-transform duration-300 group-hover/story:-translate-y-0.5 group-hover/story:translate-x-0.5" size={15} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
