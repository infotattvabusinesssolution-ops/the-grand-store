import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import FooterPageShell from '../../pages/FooterPageShell'

const faqs = [
  {
    question: 'What are your opening hours?',
    answer: 'Our Grandstore online site is open 24 hours a day, 7 days a week.',
  },
  {
    question: 'Can I purchase wine from you and get you to send it overseas?',
    answer: 'Yes, we provide an international shipping service, subject to the conditions of the destination country.',
  },
  {
    question: 'Can I shop safely on this site?',
    answer: "Totally. All Visa, Mastercard and Amex credit and debit card transactions for orders placed on this site are processed through a secure online payment system. This means your credit card details are never transferred anywhere.",
  },
  {
    question: 'Do I have to open an account to shop here?',
    answer: 'Yes. Creating an account allows us to recognise you when you return, store your order information and simplify the buying process for you.',
  },
  {
    question: 'How do I open an account?',
    answer: "You will automatically be asked to log in or create a new account when you click the checkout button on your first order. You can also open an account beforehand by selecting the person symbol in the navigation bar, choosing Login and then Create Account.",
  },
  {
    question: 'What does logging in mean?',
    answer: 'If you have already opened an account with us, it is best to sign in each time you visit. Logging in makes shopping faster and gives you access to features such as your Wishlist and previous purchases.',
  },
  {
    question: 'How do I log in?',
    answer: 'Click the person symbol on the right-hand side of the top navigation bar.',
  },
  {
    question: 'Do I have to log in to use the site?',
    answer: 'You can browse without logging in, but you need to log in to view past orders, amend account details and add products to your Wishlist.',
  },
  {
    question: 'What do I do if I forget my password?',
    answer: "Enter the email address you used to register in the Forgotten Password section of the login page and follow the password-reset instructions.",
  },
  {
    question: 'How do I search for a particular wine or browse a range of wines?',
    answer: 'Type the wine name into the search box. To browse, use the category filters to search by variety, country, type or price. You can refine the results further and sort the displayed wines by name or price.',
  },
  {
    question: 'How do I find tasting notes for each product?',
    answer: 'Click the photograph or title of a product to see its larger photograph, tasting notes, reviews and ordering details.',
  },
  {
    question: 'How do I know how many of each wine you have in stock?',
    answer: 'Open the full product details by clicking its photograph or title. The stock status is displayed on the product page.',
  },
  {
    question: 'Is there a minimum order?',
    answer: 'No. There is no minimum order and you may order one bottle if you wish. Applicable delivery charges will be shown during checkout.',
  },
  {
    question: "What defines 'a case'?",
    answer: "The number of units in a case is shown beside each product's case option. A case usually contains twelve or six units of the same product. If the case size is one, there is no case discount.",
  },
  {
    question: 'Do I get case pricing on a mixed case?',
    answer: 'Yes. The case price is per bottle for a twelve-bottle mixed case of eligible products.',
  },
  {
    question: 'Can I send someone a gift?',
    answer: 'Yes. Add the products to your bag and select the available gift options during checkout. You can then provide gift-wrapping requirements and a card message.',
  },
  {
    question: 'Are gifts sent with an invoice?',
    answer: 'No. An invoice will not be included with your gift. Your order records remain available through your account.',
  },
  {
    question: 'Do you have gift cards available for purchase?',
    answer: 'Yes. Select a gift-card value, provide your details and the recipient’s details and message, then complete checkout. The gift voucher will be emailed to the recipient.',
  },
  {
    question: 'What do your gift packs look like?',
    answer: 'Visit the Gifts & Accessories section to view the available gift-pack range.',
  },
  {
    question: 'Can I send a gift to someone outside South Africa?',
    answer: 'No.',
  },
  {
    question: 'Are there any freight charges?',
    answer: 'Yes. Applicable freight charges are calculated and displayed during checkout according to the destination, order size and selected delivery service.',
  },
  {
    question: 'How do I know if my order was received?',
    answer: 'We send you an automated email confirmation as soon as your order is received.',
  },
  {
    question: 'Can I pay by cheque?',
    answer: 'No, we do not accept cheques for web orders. EFT may be available using the banking details provided during checkout. An EFT order is processed after payment has been confirmed.',
  },
  {
    question: 'Can I view my past orders?',
    answer: 'Yes. Log in, open My Account and select My Orders. Current pricing is shown when reordering, and unavailable products will be marked accordingly.',
  },
  {
    question: 'How do I change my payment method, personal details or delivery address?',
    answer: 'Select the person symbol in the top navigation bar, log in to your account and edit your saved details.',
  },
  {
    question: 'How long do the advertised specials last?',
    answer: 'It depends on available stock and customer response. Specials may end when the allocated stock is sold.',
  },
  {
    question: 'What do I do if I get corked, faulty or damaged wine?',
    answer: 'Contact us immediately at returns@grandstore.co.za or +27 76 580 9522. We will arrange replacement stock as soon as possible.',
  },
  {
    question: "What do I do if I buy wine from Grandstore and just don't like it?",
    answer: 'Contact us immediately. We will discuss collection of the wine and suitable replacement stock with you.',
  },
  {
    question: 'When will my order be delivered?',
    answer: 'Orders are normally delivered within 4–5 business days.',
  },
  {
    question: 'What happens if my order cannot be completely filled?',
    answer: 'If an order cannot be filled completely, we will contact you directly.',
  },
]

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null)

  const toggleQuestion = (index) => {
    setOpenIndex((currentIndex) => (currentIndex === index ? null : index))
  }

  return (
    <FooterPageShell
      eyebrow="Help Centre"
      title="Frequently Asked Questions"
      intro="Select a question below to reveal its answer."
    >
      <div className="overflow-hidden border border-white/10 bg-white/10">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index
          const answerId = `faq-answer-${index}`

          return (
            <section className="border-b border-white/10 bg-[#0f0f0d] last:border-b-0" key={faq.question}>
              <h2>
                <button
                  className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left transition-colors hover:bg-white/[0.025] sm:px-7 sm:py-6"
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={answerId}
                  onClick={() => toggleQuestion(index)}
                >
                  <span className={`font-serif text-lg leading-7 transition-colors sm:text-xl ${isOpen ? 'text-[#d99d39]' : 'text-[#f2ede4]'}`}>{faq.question}</span>
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-all duration-300 ${isOpen ? 'rotate-180 border-[#d99d39] bg-[#d99d39] text-[#17120a]' : 'border-white/15 text-[#d99d39]'}`}>
                    <ChevronDown size={18} aria-hidden="true" />
                  </span>
                </button>
              </h2>
              <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                id={answerId}
              >
                <div className="overflow-hidden">
                  <p className="max-w-3xl px-5 pb-6 pr-16 text-[15px] leading-7 text-[#b7aea2] sm:px-7 sm:pb-7 sm:pr-20 sm:text-base sm:leading-8">{faq.answer}</p>
                </div>
              </div>
            </section>
          )
        })}
      </div>
    </FooterPageShell>
  )
}
