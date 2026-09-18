import BlogArticleTemplate from './BlogArticleTemplate'
import { whiskeyArticleBrands } from './blogContent'

export default function WhiskeyBlogPage() {
  return (
    <BlogArticleTemplate
      slug="top-10-whiskey-brands-you-can-buy-online-in-south-africa"
      intro={[
        'South Africa’s whiskey market is thriving, with a growing appreciation for both local and international brands. Online shopping has made it easier than ever to find the perfect bottle.',
        'In this guide, we explore ten whiskey brands you can purchase online in South Africa.',
      ]}
      items={whiskeyArticleBrands}
      closingTitle="Why Buy Whiskey Online in South Africa?"
      closingParagraphs={[
        'Online shopping gives you a wider choice of local, rare and international releases, alongside exclusive deals and reliable delivery.',
        'Whether you prefer a local gem like Three Ships and Bains Cape Mountain Whiskey or an international classic such as Johnnie Walker, Glenfiddich or Macallan, The Grand Store makes discovery easy.',
      ]}
      shopCategory="Whisky"
    />
  )
}
