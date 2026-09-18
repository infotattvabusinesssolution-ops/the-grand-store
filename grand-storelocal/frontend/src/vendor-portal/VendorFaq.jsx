import { useMemo, useState } from 'react';
import { vendorFaqs } from './vendorFaqData';
import './VendorFaq.css';

function VendorFaq() {
  const [query, setQuery] = useState('');
  const filteredFaqs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return vendorFaqs;
    return vendorFaqs.filter(({ question, answer }) =>
      `${question} ${answer}`.toLowerCase().includes(normalized)
    );
  }, [query]);

  return (
    <section className="vendor-faq" id="vendor-faq">
      <div className="vendor-faq__shell">
        <div className="vendor-faq__header">
          <div>
            <span className="vendor-faq__eyebrow">Vendor support library</span>
            <h2>Frequently Asked <span>Questions</span></h2>
          </div>
          <label className="vendor-faq__search">
            <span className="sr-only">Search vendor questions</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m16.5 16.5 4 4" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search vendor questions"
            />
          </label>
        </div>

        <div className="vendor-faq__list">
          {filteredFaqs.map(({ question, answer }, index) => (
            <details className="vendor-faq__item" key={question} open={!query && index === 0}>
              <summary>
                <span className="vendor-faq__number">{String(index + 1).padStart(2, '0')}</span>
                <span>{question}</span>
                <span className="vendor-faq__plus" aria-hidden="true" />
              </summary>
              <div className="vendor-faq__answer"><p>{answer}</p></div>
            </details>
          ))}
          {filteredFaqs.length === 0 && (
            <p className="vendor-faq__empty">No matching question. Try a shorter search phrase.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default VendorFaq;
