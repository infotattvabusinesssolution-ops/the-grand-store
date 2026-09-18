import { Gift, Share2, ShoppingBag, Sparkles, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import FooterPageShell from './FooterPageShell'

const steps = [
  { icon: Share2, title: 'Share Your Unique Referral Link', text: "Find your personal referral link in your dashboard. Share it with friends and fellow connoisseurs via WhatsApp, social media, or email." },
  { icon: ShoppingBag, title: 'Friend Signs Up & Makes First Purchase', text: 'When your friend creates an account through your link and places their first paid order, your reward is triggered.' },
  { icon: Gift, title: 'Earn R50 Reward Credit Instantly', text: 'You receive an instant R50 store credit added directly to your reward balance to use at checkout on your next order.' },
  { icon: TrendingUp, title: 'Track Your Referrals & Rewards', text: 'Monitor your referred friends and reward balances in real-time in your account dashboard under Refer & Earn.' },
]

const benefits = [
  ['Simple Sharing', 'Share your personal referral link with 1-click.'],
  ['Generous Rewards', 'Earn R50 store credit for every friend who makes their first purchase.'],
  ['Configurable Cap', 'Track your eligible friend rewards up to the store program limit.'],
]

export default function ReferEarnPage() {
  return (
    <FooterPageShell eyebrow="Refer & Earn" title="Refer & Earn Program — Share & Get Rewarded!" intro='Share South Africa’s finest luxury wines and spirits with friends, and earn R50 store credit when they make their first purchase.' wide>
      <section className="grid gap-12 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
        <div className="relative overflow-hidden border border-[#d99d39]/25 bg-[radial-gradient(circle_at_top_right,rgba(217,157,57,.2),transparent_24rem),#11110f] p-9 sm:p-12">
          <Sparkles className="mb-7 text-[#d99d39]" size={38} strokeWidth={1.3} />
          <p className="mb-3 text-xs uppercase tracking-[0.22em] text-[#d99d39]">Unlock Rewards</p>
          <h2 className="font-serif text-4xl leading-tight text-[#f2ede4]">Start referring now</h2>
          <p className="mt-5 leading-8 text-[#bcb3a7]">Invite friends to discover premier wines and spirits. When they complete their first order, you receive R50 credit directly to your account.</p>
          <Link className="mt-8 button button-gold inline-flex" to="/customer/referrals">Go to your referral dashboard</Link>
        </div>
        <div className="grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2">
          {steps.map(({ icon: Icon, title, text }, index) => (
            <article className="bg-[#0f0f0d] p-7" key={title}>
              <div className="mb-5 flex items-center justify-between"><Icon className="text-[#d99d39]" size={25} strokeWidth={1.4} /><span className="font-serif text-2xl text-white/15">0{index + 1}</span></div>
              <h3 className="font-serif text-xl leading-snug text-[#f2ede4]">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#aaa196]">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pt-16 text-center">
        <p className="mb-3 text-xs uppercase tracking-[0.22em] text-[#d99d39]">Why Join the Program?</p>
        <h2 className="font-serif text-3xl text-[#f2ede4] sm:text-4xl">More people, more rewards</h2>
        <div className="mx-auto mt-9 grid max-w-4xl gap-5 md:grid-cols-3">
          {benefits.map(([title, text]) => <article className="border border-white/10 bg-[#10100e] p-7" key={title}><h3 className="font-serif text-xl text-[#d99d39]">{title}</h3><p className="mt-3 text-sm leading-7 text-[#aaa196]">{text}</p></article>)}
        </div>
        <p className="mx-auto mt-12 max-w-3xl font-serif text-2xl leading-10 text-[#eee6da]">Start sharing today and enjoy the benefits of spreading good times with great company. Let’s raise a glass to you, our valued customer!</p>
      </section>
    </FooterPageShell>
  )
}
