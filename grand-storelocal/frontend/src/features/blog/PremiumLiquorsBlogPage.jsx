import BlogArticleTemplate from './BlogArticleTemplate'
import { premiumLiquorItems } from './blogContent'

export default function PremiumLiquorsBlogPage() {
  return (
    <BlogArticleTemplate
      slug="top-10-must-try-premium-liquors-available-at-the-grand-store"
      intro={[
        'South Africa’s love for quality liquor is nothing new, but what is changing fast is the way people are buying it. With convenience and quality high on the wishlist, more South Africans are turning to trusted platforms like The Grand Store, an online liquor store that brings premium spirits right to your doorstep.',
        'Let’s explore ten must-try premium liquors available at The Grand Store, where luxury meets local convenience.',
      ]}
      items={premiumLiquorItems}
      closingTitle="Final Sip: Luxury is Just a Click Away"
      closingParagraphs={[
        'With a wide selection, easy shopping, trusted delivery and exclusive offers, The Grand Store brings the best of the world’s spirits to customers across South Africa.',
        'Whether you are looking for a rich brandy, a smooth whisky or celebratory Champagne, you can stock your bar and sip in style from the comfort of home.',
      ]}
      shopCategory="Spirits"
    />
  )
}
