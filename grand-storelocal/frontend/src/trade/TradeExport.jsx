import React from 'react'
import { ClipboardCheck, Grape, PackageCheck, Ship } from 'lucide-react'
import './TradeExport.css'

const exportSteps = [
  {
    icon: Grape,
    number: '01',
    title: 'Source',
    text: 'Access selected vineyards and a broad range of South African wine styles.',
  },
  {
    icon: ClipboardCheck,
    number: '02',
    title: 'Select',
    text: 'Choose the wines, quantities and specifications suited to your market.',
  },
  {
    icon: PackageCheck,
    number: '03',
    title: 'Prepare',
    text: 'Coordinate secure packing, container preparation and export documentation.',
  },
  {
    icon: Ship,
    number: '04',
    title: 'Deliver',
    text: 'Track each shipment through to its final international destination.',
  },
]

export default function TradeExport() {
  return (
    <main className="trade-subpage trade-export">
      <section className="shell trade-export-hero">
        <div className="trade-export-hero-copy">
          <span className="trade-sub-eyebrow">Trade Export</span>
          <h1 className="trade-sub-title">
            Your Global Gateway to
            <span className="trade-script-accent">South Africa’s Finest Wines</span>
          </h1>
          <p className="lead-paragraph">
            Our Company is a leading player in the wine industry, with a strong presence in South Africa&apos;s various wine growing regions. We have established excellent supply channels, allowing us to source the finest wines from the best vineyards in the region.
          </p>
          <div className="trade-export-assurances" aria-label="Export service highlights">
            <span>Vineyard sourcing</span>
            <span>Export coordination</span>
            <span>Shipment tracking</span>
          </div>
        </div>

        <figure className="trade-export-hero-visual">
          <img src="/assets/trade/maritime.jpeg" alt="International freight network serving global wine importers" />
          <figcaption>
            <span>From South Africa</span>
            <strong>To global markets</strong>
          </figcaption>
        </figure>
      </section>

      <section className="shell trade-export-process" aria-labelledby="export-process-title">
        <div className="trade-export-process-heading">
          <span className="trade-sub-eyebrow">One coordinated service</span>
          <h2 id="export-process-title">A clear route from vineyard to destination.</h2>
        </div>
        <div className="trade-export-process-grid">
          {exportSteps.map(({ icon: Icon, number, title, text }) => (
            <article className="trade-export-step" key={title}>
              <div className="trade-export-step-top">
                <Icon size={24} strokeWidth={1.7} />
                <span>{number}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="shell trade-export-story">
        <article className="trade-export-story-card trade-export-supply-card">
          <span className="trade-sub-eyebrow">Supply relationships</span>
          <h2>Connected to respected wine-growing regions.</h2>
          <p>
            Our close relationships with selected reputable vineyards have been built over many years, and these relationships are key to our ability to assist importers from around the world in selecting and shipping the wines of their choice.
          </p>
          <p>
            Our extensive network of supply channels, combined with our expertise in the wine industry, enables us to offer a comprehensive service to our clients.
          </p>
          <div className="trade-export-facts">
            <div><strong>100+</strong><span>Vineyard partners</span></div>
            <div><strong>Global</strong><span>Shipping destinations</span></div>
          </div>
        </article>

        <figure className="trade-export-team-visual">
          <img src="/assets/trade/enquiry.jpeg" alt="Export specialists coordinating an international shipment" />
          <figcaption>Experienced people coordinating every shipment.</figcaption>
        </figure>

        <article className="trade-export-story-card trade-export-range-card">
          <span className="trade-sub-eyebrow">Wine selection</span>
          <h2>Range, quality and market fit.</h2>
          <p>
            We are able to source a wide range of wine varieties, from classic red and white wines to more unique and specialty wines. Our focus is always on providing our clients with the best possible quality, and we work closely with our vineyard partners to ensure that the wines we offer meet the highest standards.
          </p>
        </article>

        <article className="trade-export-story-card trade-export-logistics-card">
          <span className="trade-sub-eyebrow">Logistics and shipping excellence</span>
          <h2>Managed carefully through final delivery.</h2>
          <p>
            Our highly skilled and experienced logistics team handles all aspects of the shipping process, from securing the wine in shipment containers to tracking the shipment to its final destination. Our team understands the complexities involved in shipping wine and takes great care to ensure that it arrives in the best possible condition.
          </p>
          <div className="trade-highlight-box">
            <p>
              With excellent supply channels, close relationships with reputable vineyards and an experienced logistics team, Grand Store is equipped to provide importers with a comprehensive and reliable service.
            </p>
          </div>
        </article>
      </section>
    </main>
  )
}
