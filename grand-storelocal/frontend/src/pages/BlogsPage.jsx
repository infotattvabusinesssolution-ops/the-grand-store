import { ArrowRight, CalendarDays, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import FooterPageShell from './FooterPageShell'
import { blogPosts } from '../features/blog/blogContent'

export default function BlogsPage() {
  return (
    <FooterPageShell
      eyebrow="News & Blogs"
      title="Latest Blogs"
      intro="Stories, guides and recommendations from the world of premium wines and spirits."
      wide
    >
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {blogPosts.map((post) => (
          <article className="group overflow-hidden border border-white/10 bg-[#10100e]" key={post.slug}>
            <Link className="block overflow-hidden" to={`/blog/${post.slug}`}>
              <img className="aspect-[16/10] w-full object-cover transition duration-500 group-hover:scale-105" src={post.image} alt={post.title} />
            </Link>
            <div className="p-6">
              <div className="mb-4 flex flex-wrap gap-4 text-[11px] uppercase tracking-[0.16em] text-[#988f83]">
                <span className="flex items-center gap-1.5"><UserRound size={13} /> Admin</span>
                <span className="flex items-center gap-1.5"><CalendarDays size={13} /> {post.date}</span>
              </div>
              <h2 className="font-serif text-2xl leading-snug text-[#f2ede4]"><Link className="hover:text-[#d99d39]" to={`/blog/${post.slug}`}>{post.title}</Link></h2>
              <p className="mt-4 text-sm leading-7 text-[#aaa196]">{post.excerpt}</p>
              <Link className="mt-6 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#d99d39]" to={`/blog/${post.slug}`}>Read More <ArrowRight size={15} /></Link>
            </div>
          </article>
        ))}
      </div>
    </FooterPageShell>
  )
}
