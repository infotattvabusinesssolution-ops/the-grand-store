import { CircleDollarSign, Compass, ShoppingCart, Users } from 'lucide-react'
import FooterPageShell, { ContentSection } from './FooterPageShell'

const reasons = [
  {
    icon: Compass,
    title: 'Discover new bottles',
    text: 'The biggest resource of different types of spirits from across the world. We promote a lot of local craft spirits and local wines from manufacturers who are passionate about their work. We take great pride in bringing their products directly to you. Since launching the site, we’ve made it our goal to help you uncover fresh and interesting content about wines and spirits that matter to you.',
  },
  {
    icon: CircleDollarSign,
    title: 'Track your collection',
    text: 'Create an account and track your collection. All information is pre-filled; just search the bottles you own and keep track of the value increase and size of your own collection.',
  },
  {
    icon: Users,
    title: 'Contribute to Grandstore',
    text: 'The best way to contribute to our growth is by being yourself. Enjoy your experience and spread the word. Give us your reviews, keep checking our new additions and bring in your suggestions so we can keep improving our level of service.',
  },
  {
    icon: ShoppingCart,
    title: 'Buy and Sell in the market',
    text: 'Searching for a bottle? Maybe one of the Grandstore members has it for sale. Buy it in the marketplace or offer your spare bottles yourself. Help Grandstore friends complete their collections.',
  },
]

export default function AboutPage() {
  return (
    <FooterPageShell
      eyebrow="About us"
      title="A preeminent supplier and marketer in the liquor industry"
      intro="The Grand Store offers an extensive variety of luxury wines and spirits for every occasion, sourced from South Africa and around the globe."
      wide
    >
      <div className="grid gap-12 lg:grid-cols-[1.05fr_.95fr] lg:items-start">
        <div>
          <ContentSection title="About us">
            <p>As a preeminent wholesale supplier and marketer in the liquor industry, The Grand Store offers an extensive variety of luxury wines and spirits for all occasions. We at Grand Store have successfully identified the top wines and spirits from our beloved homeland South Africa and around the globe. We have also formed strong partnerships with prestigious suppliers to bring you the best products at the best prices.</p>
            <p>The Grand Store is committed to excellence in every sphere. Our online, innovative approach will ensure that you have a great online shopping experience accompanied by superior customer service.</p>
          </ContentSection>
          <ContentSection title="A Cut Above The Rest">
            <p>Our innovative approach illustrates our ability to offer our customers the utmost value for money. Through unprecedented involvement in every step of the process, we have raised the bar. Our elite range of products is in line with international trends. We have focused on intricate details from top sommeliers and connoisseurs that offer high-quality products, topped with scheduled, timeous deliveries.</p>
            <p>We make sure that our products are thoroughly checked right from the start to the final stage of production or supply under the presence of qualified quality inspectors.</p>
            <p className="font-serif text-lg italic text-[#d99d39]">For us quality is not a formality but rather an expression of our hard work and dedication.</p>
          </ContentSection>
          <ContentSection title="Our Strength">
            <p>We work relentlessly with our team to bring professionalism and zeal to outperform our competitors.</p>
            <p>Our team of highly experienced professionals is empowered with sophisticated infrastructure. We are fully immersed and dedicated, and our extensive industry knowledge backed by a network of resourceful contacts gives us a better understanding of market requirements. Our experience in the liquor and wine industry has granted us increasing accolades across the industry.</p>
          </ContentSection>
          <ContentSection title="Our Patrons">
            <p>Optimum pricing together with on-schedule delivery has made us immensely popular among our wide clientele across the country. We boast committed clients who enable our quest for excellence by consistently ordering from Grand Store.</p>
          </ContentSection>
        </div>
        <aside className="lg:sticky lg:top-32">
          <img className="aspect-[4/5] w-full rounded-sm object-cover opacity-90" src="/assets/about-new-hero.jpg" alt="A curated Grand Store wine presentation" />
          <blockquote className="border-x border-b border-[#d99d39]/30 bg-[#11110f] p-7">
            <p className="font-serif text-2xl leading-snug text-[#f2ede4]">“Best wines are the ones we drink with friends.”</p>
            <cite className="mt-3 block text-xs not-italic uppercase tracking-[0.2em] text-[#d99d39]">Wine is a lifestyle</cite>
          </blockquote>
        </aside>
      </div>

      <section className="my-16 grid overflow-hidden border border-[#d99d39]/25 bg-[#11110f] md:grid-cols-[.75fr_1.25fr]">
        <img className="h-full min-h-72 w-full object-cover" src="/assets/about-story.jpg" alt="The Grand Store chairman statement" />
        <div className="p-8 sm:p-12">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#d99d39]">Chairman Statement</p>
          <p className="font-serif text-xl leading-9 text-[#eee6da]">This pandemic has taught us the new order of engaging in business. Our response to these challenges reflects who we are as individuals and as an organization. It has changed the way we think and interact with our customers. Digitalization is an integral part of our transformation. We remain optimistic that this is a decade of great opportunity. We should capitalize on this opportunity and do our fair share for our market’s recovery.</p>
          <p className="mt-6 text-[#d99d39]">— Mr. Pravin Upasani</p>
        </div>
      </section>

      <ContentSection title="Our Motto">
        <p>To offer a great variety of spirits and wines from emerging and established companies. We ensure that our innovative solutions and exceptional service support and enable lasting connections between wineries and our valued consumer customers.</p>
      </ContentSection>

      <section className="pt-14">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#d99d39]">Why Choose Us</p>
        <h2 className="mb-8 font-serif text-3xl text-[#f2ede4] sm:text-4xl">A better way to discover and collect</h2>
        <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map(({ icon: Icon, title, text }) => (
            <article className="bg-[#0d0d0b] p-7" key={title}>
              <Icon className="mb-5 text-[#d99d39]" size={28} strokeWidth={1.4} />
              <h3 className="mb-3 font-serif text-xl text-[#f2ede4]">{title}</h3>
              <p className="text-sm leading-7 text-[#aaa196]">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </FooterPageShell>
  )
}
