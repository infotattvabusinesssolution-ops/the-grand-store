import { useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { blogPosts } from './blogContent'

export default function BlogArticleTemplate({ slug, intro, items, closingTitle, closingParagraphs, shopCategory }) {
  const post = blogPosts.find((item) => item.slug === slug)

  useEffect(() => {
    document.title = `${post.title} | The Grand Store`
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [post.title])

  return (
    <main className="blog-page supplied-blog-page">
      <section className="supplied-blog-header">
        <div className="shell supplied-blog-header-inner">
          <Link className="supplied-blog-back" to="/#journal">Journal</Link>
          <p className="eyebrow">The Grand Store Editorial · {post.date} · 6 min read</p>
          <h1 id="article-title">{post.title}</h1>
        </div>
      </section>

      <article className="shell supplied-blog-article" aria-labelledby="article-title">
        <figure className="supplied-blog-cover">
          <img src={post.image} alt={post.title} />
        </figure>

        <div className="supplied-blog-content">
          <div className="supplied-blog-intro">
            {intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>

          <div className="supplied-article-list">
            {items.map(([title, subtitle, text], index) => (
              <section key={title}>
                <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h2>{title}</h2>
                  {text ? <><h3>{subtitle}</h3><p>{text}</p></> : <p>{subtitle}</p>}
                </div>
              </section>
            ))}
          </div>

          <section className="supplied-article-section">
            <h2>{closingTitle}</h2>
            {closingParagraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <Link className="supplied-article-cta" to={`/shop?category=${encodeURIComponent(shopCategory)}`}>
              Shop {shopCategory} <ArrowRight size={16} />
            </Link>
          </section>
        </div>
      </article>
    </main>
  )
}
