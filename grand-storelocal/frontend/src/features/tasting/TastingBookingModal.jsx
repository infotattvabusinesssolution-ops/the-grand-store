import { useProducts } from '../../context/ProductContext'
import React, { useState, useEffect, useRef } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { ChevronRight, ChevronLeft, ShoppingBag, ArrowRight, Minus, Plus, Trash2, Heart, ZoomIn, CheckCircle2, Truck, RotateCcw, ShieldCheck, Mail, MessageCircle, Share2, X, Gift, SlidersHorizontal, Grid3X3, GitCompareArrows, MapPin, Calendar, Clock, CreditCard, Droplets } from 'lucide-react';
import { brandyBrands, brands, menuCategories, tequilaBrands } from '../../data';
import { useWishlist } from '../../wishlistContext';
import ProductCard from '../../components/ProductCard';
import Price from '../../components/ui/Price';

export default function TastingBookingModal({ event, onClose, onConfirm }) {
  const { products } = useProducts();

  const [selectedDate, setSelectedDate] = useState(event?.dates?.[0]?.date ?? '')
  const [selectedTime, setSelectedTime] = useState(event?.dates?.[0]?.times?.[0] ?? '')
  const [guest, setGuest] = useState({ name: '', phone: '', email: '', seats: 1 })
  const activeDate = event?.dates.find((item) => item.date === selectedDate)

  useEffect(() => {
    if (!event) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const closeOnEscape = (keyEvent) => {
  const { products } = useProducts();
 if (keyEvent.key === 'Escape') onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [event, onClose])

  if (!event) return null

  const selectDate = (date) => {
  const { products } = useProducts();

    const nextDate = event.dates.find((item) => item.date === date)
    setSelectedDate(date)
    setSelectedTime(nextDate?.times?.[0] ?? '')
  }

  const submitBooking = (submitEvent) => {
  const { products } = useProducts();

    submitEvent.preventDefault()
    if (!selectedDate || !selectedTime || !guest.name.trim() || !guest.phone.trim() || !guest.email.trim()) return
    onConfirm(`${guest.name}, your ${event.title} request for ${guest.seats} ${Number(guest.seats) === 1 ? 'seat' : 'seats'} at ${selectedTime} has been received`)
  }

  return (
    <div className="tasting-modal" role="dialog" aria-modal="true" aria-labelledby="tasting-modal-title">
      <button className="tasting-modal-scrim" type="button" onClick={onClose} aria-label="Close reservation" />
      <div className="tasting-modal-panel">
        <button className="tasting-modal-close" type="button" onClick={onClose} aria-label="Close reservation"><X size={22} /></button>
        <div className="tasting-modal-intro"><img src={event.image} alt="" /><div><p className="eyebrow">Private tasting</p><h2 id="tasting-modal-title">{event.title}</h2><p>{event.description}</p><strong><Price amount={event.price.toLocaleString('en-ZA')} /> per guest</strong></div></div>
        <form className="tasting-booking-form" onSubmit={submitBooking}>
          <fieldset><legend>Choose a date</legend><div className="tasting-date-options">{event.dates.map((item) => <button className={selectedDate === item.date ? 'active' : ''} type="button" onClick={() => selectDate(item.date)} key={item.date}><CalendarDays size={17} /><span>{item.label}</span></button>)}</div></fieldset>
          <fieldset><legend>Select a time</legend><div className="tasting-time-options">{activeDate?.times.map((time) => <button className={selectedTime === time ? 'active' : ''} type="button" onClick={() => setSelectedTime(time)} key={time}>{time}</button>)}</div></fieldset>
          <div className="tasting-guest-fields"><label>Full name<input required value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value })} /></label><label>Email address<input required type="email" value={guest.email} onChange={(e) => setGuest({ ...guest, email: e.target.value })} /></label><label>Phone number<input required type="tel" value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })} /></label><label>Guests<select value={guest.seats} onChange={(e) => setGuest({ ...guest, seats: e.target.value })}>{Array.from({ length: Math.min(6, event.seats) }, (_, index) => <option value={index + 1} key={index + 1}>{index + 1} {index ? 'guests' : 'guest'}</option>)}</select></label></div>
          <button className="button button-gold tasting-confirm" type="submit">Request reservation <ArrowRight size={17} /></button>
        </form>
      </div>
    </div>
  )
}