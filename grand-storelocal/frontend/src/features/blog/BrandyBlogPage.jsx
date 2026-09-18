import BlogArticleTemplate from './BlogArticleTemplate'
import { brandyArticleBrands } from './blogContent'

export default function BrandyBlogPage() {
  return (
    <BlogArticleTemplate
      slug="top-south-african-brandy-brands-you-can-order-online"
      intro={[
        'Brandy holds a special place in South Africa’s rich heritage of fine spirits, with local distillers producing world-class options that rival the finest European counterparts.',
        'Whether you are looking for a smooth sipping brandy, a premium aged bottle or something perfect for cocktails, these ten South African brands deserve a place in your collection.',
      ]}
      items={brandyArticleBrands}
      closingTitle="Why Buy Brandy Online in South Africa?"
      closingParagraphs={[
        'Shopping online offers convenience, a wide selection, exclusive deals and fast, secure delivery throughout South Africa.',
        'From the smooth elegance of Van Ryn’s to the traditional craftsmanship of Oude Molen and the rich heritage of KWV, there is a brandy for every taste.',
      ]}
      shopCategory="Brandy"
    />
  )
}
