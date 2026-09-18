import { useProducts } from '../../context/ProductContext'
import React, { useState, useEffect, useRef } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronRight, ChevronLeft, ShoppingBag, ArrowRight, Minus, Plus, Trash2, Heart, ZoomIn, CheckCircle2, Truck, RotateCcw, ShieldCheck, Mail, MessageCircle, Share2, X, Gift, SlidersHorizontal, Grid3X3, GitCompareArrows, MapPin, Calendar, Clock, CreditCard, Droplets } from 'lucide-react';
import { brandyBrands, brands, menuCategories, tequilaBrands } from '../../data';
import { useWishlist } from '../../wishlistContext';
import ProductCard from '../../components/ProductCard';
import Price from '../../components/ui/Price';

export default function TastingPage({ onNotify }) {
  const { products } = useProducts();

  const [availability, setAvailability] = useState('live')
  const [sortBy, setSortBy] = useState('featured')
  const [selectedEvent, setSelectedEvent] = useState(null)
  const filteredEvents = tastingEvents
    .filter((event) => availability === 'all' || event.status === availability)
    .sort((first, second) => sortBy === 'price-low' ? first.price - second.price : sortBy === 'price-high' ? second.price - first.price : first.id.localeCompare(second.id))

  useEffect(() => {
    document.title = 'Book a Tasting — The Grand Store'
    window.scrollTo({ top: 0, behavior: 'auto' })
    return () => { document.title = 'The Grand Store — Luxury Wines & Spirits' }
  }, [])

  const confirmBooking = (message) => {
  const { products } = useProducts();

    onNotify(message)
    setSelectedEvent(null)
  }

  return (
    <main className="tasting-page">
      <section className="tasting-page-hero">
        <div className="shell tasting-page-hero-inner"><div><p className="eyebrow">The private tasting room</p><h1>In-store<br /><em>tastings.</em></h1></div><p>Guided flights, considered pairings and intimate evenings created for curious drinkers and seasoned collectors alike.</p></div>
      </section>
      <section className="tasting-catalogue section">
        <div className="shell tasting-catalogue-layout">
          <aside className="tasting-filters">
            <div><p className="eyebrow">Availability</p>{[['live', 'Live events'], ['past', 'Past events'], ['all', 'All tastings']].map(([value, label]) => <label key={value}><input type="radio" name="availability" checked={availability === value} onChange={() => setAvailability(value)} /><span>{label}</span></label>)}</div>
            <label className="tasting-sort">Sort by<select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option></select></label>
            <div className="tasting-venue"><MapPin size={20} /><span><strong>Grand Store tasting room</strong>Fourways, Johannesburg<br />Limited seating by reservation.</span></div>
          </aside>
          <div className="tasting-results">
            <div className="tasting-results-heading"><div><p className="eyebrow">Curated experiences</p><h2>{availability === 'past' ? 'Past Tastings' : availability === 'all' ? 'All Tastings' : 'Upcoming Tastings'}</h2></div><span>{filteredEvents.length} {filteredEvents.length === 1 ? 'experience' : 'experiences'}</span></div>
            <div className="tasting-event-grid">
              {filteredEvents.map((event) => (
                <article className={`tasting-event-card ${event.status}`} key={event.id}>
                  <div className="tasting-event-image"><img src={event.image} alt={event.title} loading="lazy" /><span>{event.status === 'live' ? 'Now booking' : 'Completed'}</span><Wine size={24} /></div>
                  <div className="tasting-event-copy"><p className="eyebrow">{event.type} experience</p><h3>{event.title}</h3><p>{event.description}</p><div className="tasting-event-price"><strong><Price amount={event.price.toLocaleString('en-ZA')} /></strong><span>per guest</span></div><div className="tasting-event-footer"><span className={event.seats <= 8 ? 'limited' : ''}>{event.status === 'live' ? `${event.seats} seats available` : 'Event concluded'}</span><button type="button" disabled={event.status === 'past'} onClick={() => setSelectedEvent(event)}>{event.status === 'live' ? 'Select a time' : 'View details'} <ArrowRight size={15} /></button></div></div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section className="tasting-service-strip"><div className="shell"><article><span>01</span><div><h3>Expertly guided</h3><p>Every flight is led by an informed host who makes each style approachable.</p></div></article><article><span>02</span><div><h3>Intimate seating</h3><p>Small groups allow time for questions, conversation and considered tasting.</p></div></article><article><span>03</span><div><h3>Thoughtful pairings</h3><p>Selected accompaniments reveal new dimensions in every glass.</p></div></article></div></section>
      <TastingBookingModal event={selectedEvent} onClose={() => setSelectedEvent(null)} onConfirm={confirmBooking} />
    </main>
  )
}