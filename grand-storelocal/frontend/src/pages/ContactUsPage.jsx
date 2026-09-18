import { useState } from 'react'
import { Mail, MapPin, Phone, Send } from 'lucide-react'
import FooterPageShell from './FooterPageShell'

const fieldClass = 'h-14 w-full border border-white/15 bg-[#0d0d0b] px-4 text-[#f2ede4] outline-none transition placeholder:text-[#6f685f] focus:border-[#d99d39]'

export default function ContactUsPage() {
  const [status, setStatus] = useState('')

  const submit = (event) => {
    event.preventDefault()
    setStatus('Thank you. Your message has been received and our team will get back to you.')
    event.currentTarget.reset()
  }

  return (
    <FooterPageShell eyebrow="Contact Us" title="Get In Touch" intro="Questions about an order, a bottle or working with The Grand Store? Our team is ready to help." wide>
      <div className="grid gap-12 lg:grid-cols-[.78fr_1.22fr]">
        <aside>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#d99d39]">Contact details</p>
          <h2 className="mb-8 font-serif text-3xl text-[#f2ede4]">We would love to hear from you</h2>
          <div className="space-y-px overflow-hidden border border-white/10 bg-white/10">
            <a className="flex gap-4 bg-[#10100e] p-5 transition hover:bg-[#15140f]" href="tel:+27765809522"><Phone className="mt-1 shrink-0 text-[#d99d39]" size={20} /><span><small className="block uppercase tracking-widest text-[#80786e]">Telephone</small><strong className="mt-1 block font-normal text-[#f2ede4]">+27 76 580 9522</strong></span></a>
            <a className="flex gap-4 bg-[#10100e] p-5 transition hover:bg-[#15140f]" href="tel:+27824967256"><Phone className="mt-1 shrink-0 text-[#d99d39]" size={20} /><span><small className="block uppercase tracking-widest text-[#80786e]">Alternate</small><strong className="mt-1 block font-normal text-[#f2ede4]">+27 82 496 7256</strong></span></a>
            <a className="flex gap-4 bg-[#10100e] p-5 transition hover:bg-[#15140f]" href="mailto:info@grandstore.co.za"><Mail className="mt-1 shrink-0 text-[#d99d39]" size={20} /><span><small className="block uppercase tracking-widest text-[#80786e]">Email</small><strong className="mt-1 block font-normal text-[#f2ede4]">info@grandstore.co.za</strong></span></a>
            <div className="flex gap-4 bg-[#10100e] p-5"><MapPin className="mt-1 shrink-0 text-[#d99d39]" size={20} /><span><small className="block uppercase tracking-widest text-[#80786e]">Visit us</small><strong className="mt-1 block font-normal leading-7 text-[#f2ede4]">Pivot Building<br />1 Montecasino Blvd, Fourways<br />Sandton, 2191</strong></span></div>
          </div>
        </aside>

        <section className="border border-[#d99d39]/25 bg-[#11110f] p-6 sm:p-9">
          <h2 className="mb-7 font-serif text-3xl text-[#f2ede4]">Send us a message</h2>
          <form className="grid gap-5 sm:grid-cols-2" onSubmit={submit}>
            <label className="text-xs uppercase tracking-[0.15em] text-[#b6ada1]">First Name<input className={`${fieldClass} mt-2`} name="firstName" required /></label>
            <label className="text-xs uppercase tracking-[0.15em] text-[#b6ada1]">Last Name<input className={`${fieldClass} mt-2`} name="lastName" required /></label>
            <label className="text-xs uppercase tracking-[0.15em] text-[#b6ada1]">Email ID<input className={`${fieldClass} mt-2`} name="email" type="email" required /></label>
            <label className="text-xs uppercase tracking-[0.15em] text-[#b6ada1]">Phone No<input className={`${fieldClass} mt-2`} name="phone" type="tel" required /></label>
            <label className="text-xs uppercase tracking-[0.15em] text-[#b6ada1] sm:col-span-2">Message<textarea className={`${fieldClass} mt-2 min-h-36 resize-y py-4`} name="message" required /></label>
            <div className="flex flex-wrap items-center gap-5 sm:col-span-2">
              <button className="inline-flex h-13 items-center gap-2 bg-[#d99d39] px-7 text-sm font-semibold text-[#17120a] transition hover:bg-[#efbd64]" type="submit">Submit <Send size={16} /></button>
              {status && <p className="text-sm leading-6 text-[#cfc6b7]" role="status">{status}</p>}
            </div>
          </form>
        </section>
      </div>

      <div className="mt-14 overflow-hidden border border-white/10">
        <iframe className="h-[420px] w-full grayscale-[.25]" title="The Grand Store at Pivot Building" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=Pivot%20Building%2C%201%20Montecasino%20Blvd%2C%20Fourways%2C%20Sandton%2C%202191&output=embed" />
      </div>
    </FooterPageShell>
  )
}
