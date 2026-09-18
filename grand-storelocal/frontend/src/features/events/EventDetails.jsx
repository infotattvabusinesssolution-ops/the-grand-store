import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import SEO from '../../components/SEO';
import api from '../../api';
import { Calendar, MapPin, Clock, Users, Tag, Check, ArrowLeft, ShoppingBag, ChevronRight, CreditCard, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import PaymentForm from '../checkout/PaymentForm';
import SecurePaymentBadges from '../../components/checkout/SecurePaymentBadges';
import Price from '../../components/ui/Price';
import { getEventPhase, getTierAvailability, isEventBookable, resolveEventImage } from './eventPhase';

export default function EventDetails({ onNotify, onAdd }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${id}`);
        setEvent(res.data);
        if (res.data.ticketTiers && res.data.ticketTiers.length > 0) {
          setSelectedTicket(res.data.ticketTiers.find((tier) => getTierAvailability(tier) > 0) || res.data.ticketTiers[0]);
        }
      } catch (error) {
        console.error('Failed to load event details', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id]);

  const [quantity, setQuantity] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  
  const [paymentData, setPaymentData] = useState(null);
  const [payfastUrl, setPayfastUrl] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('payfast');

  const handleWaitlist = async () => {
    if (!user) {
      if (onNotify) onNotify('Please login to join the waitlist', 'error');
      navigate('/login?redirect=/events/' + id);
      return;
    }
    
    setWaitlistLoading(true);
    try {
      const targetId = event?._id || id;
      const res = await api.post(`/events/${targetId}/waitlist`);
      
      if (onNotify) onNotify(res.data.message || 'Successfully joined the waitlist!');
    } catch (error) {
      console.error('Waitlist join failed:', error);
      if (onNotify) onNotify(error.response?.data?.message || 'Failed to join waitlist. Please try again.', 'error');
    } finally {
      setWaitlistLoading(false);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      if (onNotify) onNotify('Please login to book tickets', 'error');
      navigate('/login?redirect=/events/' + id);
      return;
    }
    
    if (!isEventBookable(event)) {
      if (onNotify) onNotify('This event is no longer accepting bookings.', 'error');
      return;
    }

    setBookingLoading(true);
    try {
      // 1. Create Pending Booking
      const targetId = event?._id || id;
      const res = await api.post(`/events/${targetId}/book`, {
        ticketTierId: selectedTicket._id,
        ticketType: selectedTicket.name,
        quantity,
        paymentMethod: paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'PayFast'
      });

      if (paymentMethod === 'bank_transfer') {
        navigate(`/customer/event-order/${res.data._id}?payment=bank-transfer`);
        return;
      }

      // 2. Request PayFast Signature
      const pfRes = await api.post(`/payfast/generate-event`, {
        bookingId: res.data._id
      });

      setPayfastUrl(pfRes.data.url);
      setPaymentData(pfRes.data.data);
    } catch (error) {
      console.error('Booking failed:', error);
      if (error.response?.status === 401) {
        if (onNotify) onNotify('Your session has expired. Please sign in again.', 'error');
        navigate('/login?redirect=/events/' + id);
        return;
      }
      if (onNotify) onNotify(error.response?.data?.message || 'Booking failed. Please try again.', 'error');
      setBookingLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#0a0907] flex items-center justify-center text-gold-gradient">Loading experience details...</div>;
  }

  if (!event) {
    return <div className="min-h-screen bg-[#0a0907] pt-0 text-center text-white">Event not found.</div>;
  }

  const phase = getEventPhase(event);
  const bookable = isEventBookable(event);

  const eventCanonicalUrl = `https://grandstoreglobal.com/events/${event.slug || event._id || id}`;
  const eventSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Event',
        '@id': `${eventCanonicalUrl}#event`,
        name: event.title,
        description: event.description,
        image: resolveEventImage(event.image),
        startDate: event.date ? `${new Date(event.date).toISOString().split('T')[0]}T${event.startTime || '18:00'}:00` : undefined,
        endDate: event.date ? `${new Date(event.date).toISOString().split('T')[0]}T${event.endTime || '22:00'}:00` : undefined,
        eventStatus: event.status === 'cancelled'
          ? 'https://schema.org/EventCancelled'
          : 'https://schema.org/EventScheduled',
        eventAttendanceMode: event.format === 'Virtual'
          ? 'https://schema.org/OnlineEventAttendanceMode'
          : (event.format === 'Hybrid' ? 'https://schema.org/MixedEventAttendanceMode' : 'https://schema.org/OfflineEventAttendanceMode'),
        location: event.format === 'Virtual' ? {
          '@type': 'VirtualLocation',
          url: 'https://grandstoreglobal.com'
        } : {
          '@type': 'Place',
          name: event.location || 'The Grand Store Tasting Cellar',
          address: {
            '@type': 'PostalAddress',
            addressLocality: event.city || 'South Africa',
            addressCountry: 'ZA'
          }
        },
        organizer: {
          '@type': 'Organization',
          name: event.hostName || 'The Grand Store',
          url: 'https://grandstoreglobal.com'
        },
        offers: event.ticketTiers?.map(tier => ({
          '@type': 'Offer',
          name: tier.name,
          price: tier.price,
          priceCurrency: 'ZAR',
          availability: (tier.quantity - (tier.sold || 0)) > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/SoldOut',
          validFrom: new Date().toISOString(),
          url: eventCanonicalUrl
        }))
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://grandstoreglobal.com'
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Events & Tastings',
            item: 'https://grandstoreglobal.com/events'
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: event.title,
            item: eventCanonicalUrl
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#0a0907] pb-20 text-[#eee8dd]">
      <SEO
        title={`${event.title} — Events & Tastings`}
        description={event.description?.substring(0, 160) || `Book tickets for ${event.title} at The Grand Store.`}
        image={resolveEventImage(event.image)}
        url={`/events/${event.slug || event._id || id}`}
        type="event"
        schema={eventSchema}
      />
      {/* Hero Section */}
      <div className="relative h-[60vh] w-full">
        {event.image ? (
          <img src={resolveEventImage(event.image)} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#11100d]"></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0907] via-[#0a0907]/80 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0907] to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 max-w-7xl mx-auto">
          <button onClick={() => navigate('/events')} className="flex items-center gap-2 text-[#918a7f] hover:text-white transition-colors uppercase tracking-widest text-[10px] font-bold mb-6">
            <ArrowLeft size={14} /> Back to Events
          </button>
          
          <div className="inline-block px-3 py-1 bg-[#c9a35b]/20 border border-[#c9a35b]/40 text-gold-gradient rounded text-xs font-bold uppercase tracking-wider mb-4">
            {event.type} · {phase}
          </div>
          <h1 className="text-4xl md:text-6xl font-serif text-white mb-6 leading-tight max-w-4xl">{event.title}</h1>
          
          <div className="flex flex-wrap items-center gap-6 text-[#918a7f] text-sm md:text-base font-medium">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-gold-gradient" />
              {new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-gold-gradient" />
              {event.startTime} - {event.endTime}
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-gold-gradient" />
              {event.format === 'Virtual' ? 'Virtual Global Experience' : `${event.location}, ${event.city}`}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-5 md:px-10 lg:px-12 pt-12 md:pt-16 space-y-16 md:space-y-20">
          <section>
            <h2 className="text-2xl font-serif text-white mb-6">About the Experience</h2>
            <div className="text-[#918a7f] leading-relaxed space-y-4 whitespace-pre-wrap">
              {event.description}
            </div>
          </section>

          {/* Tasting Journey */}
          {event.tastingJourney && event.tastingJourney.length > 0 && (
            <section className="bg-[#11100d] border border-white/5 p-8 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#c9a35b]/5 rounded-full blur-[100px] pointer-events-none"></div>
              <h2 className="text-2xl font-serif text-white mb-6 relative">Your Tasting Journey</h2>
              <div className="space-y-4 relative">
                {event.tastingJourney.map((item, idx) => {
                  const product = event.tastingProducts && event.tastingProducts[idx];
                  
                  return (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-[#c9a35b]/10 border border-[#c9a35b]/30 flex items-center justify-center text-gold-gradient font-serif shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <span className="text-lg text-[#eee8dd]">{item}</span>
                          {product && (
                            <p className="text-xs text-[#918a7f] mt-1 line-clamp-1">{product.category} &bull; <Price amount={product.price} /></p>
                          )}
                        </div>
                      </div>
                      
                      {product && onAdd && (
                        <button 
                          onClick={() => onAdd(product)}
                          className="shrink-0 self-start sm:self-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-transparent border border-[#c9a35b]/40 text-gold-gradient hover:bg-[#c9a35b]/10 transition-colors text-xs uppercase tracking-widest font-bold"
                        >
                          <ShoppingBag size={14} /> Add to Cart
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Host Info */}
          {(event.hostName || event.vendorId) && (
            <section className="border-t border-white/10 pt-10 md:pt-12">
              <div className="mb-6 flex items-end justify-between gap-4">
                <h2 className="text-2xl font-serif text-white">Meet Your Host</h2>
                <span className="hidden text-[10px] font-bold uppercase tracking-[0.22em] text-[#c9a35b]/70 sm:block">Your experience guide</span>
              </div>
              <div className="relative overflow-hidden border border-white/10 bg-[#11100d]">
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#c9a35b]/20 via-[#c9a35b] to-[#c9a35b]/20" />
                <Users size={180} className="pointer-events-none absolute -bottom-14 -right-8 text-white/[0.018]" />
                <div className="relative grid gap-6 p-6 sm:grid-cols-[112px_minmax(0,1fr)] sm:items-center md:p-8">
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-[#c9a35b]/35 bg-[#17130f] sm:h-28 sm:w-28">
                    <div className="absolute inset-2 rounded-full border border-white/[0.06]" />
                    <Users size={34} className="text-[#b69a72]" />
                  </div>
                  <div className="min-w-0 sm:pr-8">
                  <h3 className="text-xl font-serif text-[#eee8dd] mb-1">{event.hostName || event.vendorId.name}</h3>
                  <p className="text-gold-gradient text-sm uppercase tracking-widest mb-3">
                    {event.hostTitle || 'Distillery Partner'}
                  </p>
                  {event.vendorSlug && (
                    <Link to={`/estate/${event.vendorSlug}`} className="inline-block text-xs font-bold uppercase tracking-wider text-white hover:text-gold-gradient transition-colors mt-2">
                      <span className="flex items-center gap-1">View Vendor Profile <ChevronRight size={14} /></span>
                    </Link>
                  )}
                  </div>
                </div>
              </div>
            </section>
          )}

        {/* Ticket Booking */}
        <section className="relative mx-auto max-w-5xl border-t border-white/10 pt-10 md:pt-12">
          <div className="relative w-full overflow-hidden border border-[#c9a35b]/25 bg-[#100f0c] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.28)] sm:p-6 md:p-7">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#c9a35b] to-transparent opacity-50"></div>
            <div className="pointer-events-none absolute -right-28 -top-32 h-80 w-80 rounded-full bg-[#c9a35b]/[0.055] blur-3xl" />
            
            <div className="relative">
              <div className="mb-5 flex flex-col justify-between gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-end">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#c9a35b]">Reservations</p>
                  <h3 className="font-serif text-3xl text-white md:text-4xl">Select Tickets</h3>
                </div>
                <span className="w-fit border border-white/10 bg-white/[0.025] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white/50">{phase}</span>
              </div>

              <div className="mb-6 grid gap-3 md:grid-cols-2">
                {event.ticketTiers.map(tier => {
                  const available = getTierAvailability(tier);
                  const isSelected = selectedTicket?._id === tier._id;

                  return (
                    <div
                      key={tier._id}
                      onClick={() => {
                        if (bookable && available > 0) {
                          setSelectedTicket(tier);
                          setQuantity(current => Math.min(current, available));
                        }
                      }}
                      className={`relative flex h-full cursor-pointer flex-col border p-4 transition-all duration-300 ${
                        available === 0
                        ? 'border-white/5 opacity-40 cursor-not-allowed bg-black/20'
                        : isSelected
                        ? 'border-[#c9a35b] bg-[#c9a35b]/10 shadow-[inset_0_0_30px_rgba(201,163,91,0.04)]'
                        : 'border-white/10 hover:border-white/30 hover:bg-white/[0.035] bg-black/10'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-[#c9a35b] text-black"><Check size={12} strokeWidth={3} /></div>
                      )}
                      <div className="mb-2 flex items-start justify-between gap-8">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className={`font-serif text-xl ${isSelected ? 'text-gold-gradient' : 'text-white'}`}>{tier.name}</h4>
                            {available === 0 && <span className="text-xs uppercase font-bold text-red-400 border border-red-500/20 bg-red-500/10 px-2 py-0.5 rounded-md tracking-wider">Sold Out</span>}
                          </div>
                          <p className="mt-1 text-sm tracking-wide text-[#a59d91]">{available} remaining</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`font-serif text-2xl ${isSelected ? 'text-white' : 'text-[#eee8dd]'}`}><Price amount={tier.price} /></p>
                        </div>
                      </div>

                      {tier.benefits && tier.benefits.length > 0 && (
                        <ul className="mt-3 space-y-1.5 border-t border-white/5 pt-3">
                          {tier.benefits.map((benefit, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm leading-5 text-[#a59d91]">
                              <Check size={15} className="text-[#c9a35b] mt-0.5 shrink-0" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedTicket && (
                <div className="mb-6 grid animate-in grid-cols-1 border-y border-white/10 bg-black/20 fade-in slide-in-from-top-4 duration-300 sm:grid-cols-2 sm:divide-x sm:divide-white/10">
                  <div className="flex items-center justify-between gap-5 p-4 md:px-5">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-[#eee8dd]">Quantity</label>
                      <p className="mt-1 text-sm text-[#a59d91]">{selectedTicket.name}</p>
                    </div>
                    <div className="flex items-center gap-2 border border-white/10 bg-[#0a0a0a] px-1 py-1">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="flex h-9 w-9 items-center justify-center text-white/50 transition-colors hover:bg-white/5 hover:text-white"
                      >-</button>
                      <span className="w-6 text-center text-base font-medium text-white">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(getTierAvailability(selectedTicket), quantity + 1))}
                        className="flex h-9 w-9 items-center justify-center text-white/50 transition-colors hover:bg-white/5 hover:text-white"
                      >+</button>
                    </div>
                  </div>

                  <div className="flex items-end justify-between gap-5 border-t border-white/10 p-4 sm:border-t-0 md:px-5">
                    <div>
                      <span className="mb-1 block text-xs font-bold uppercase tracking-[0.18em] text-[#c9a35b]">Total Amount</span>
                      <span className="text-xs italic text-[#a59d91]">Service fee & VAT included</span>
                    </div>
                    <span className="font-serif text-2xl leading-none text-gold-gradient md:text-3xl">
                      <Price amount={selectedTicket.price * quantity} />
                    </span>
                  </div>
                </div>
              )}

            {bookable && selectedTicket && getTierAvailability(selectedTicket) > 0 && (
              <div className="mb-6">
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#a59d91]">Payment Method</p>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className={`cursor-pointer bg-[#0a0a0a] border p-4 relative overflow-hidden transition-all ${paymentMethod === 'payfast' ? 'border-[#c9a35b] shadow-[inset_0_0_22px_rgba(201,163,91,0.05)]' : 'border-white/10 hover:border-white/30'}`}>
                    <input type="radio" name="eventPaymentMethod" value="payfast" checked={paymentMethod === 'payfast'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                    <div className="absolute right-0 top-0 p-3 opacity-[0.07]"><CreditCard size={48} /></div>
                    <div className="relative z-10">
                      <h4 className="mb-1 text-lg font-medium text-white">PayFast (Instant)</h4>
                      <p className="mb-3 text-sm text-[#a59d91]">Credit/Debit Cards, Instant EFT</p>
                      <div className="inline-flex min-w-[108px] items-center justify-center rounded-md bg-white px-3 py-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.25)]">
                        <img
                          src="https://res.cloudinary.com/oioqrgj0/image/upload/v1787729897/grand-store/assets/pkv0g8anwi079fvihl2e.png"
                          alt="PayFast"
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                    </div>
                  </label>

                  <label className={`cursor-pointer bg-[#0a0a0a] border p-4 relative overflow-hidden transition-all ${paymentMethod === 'bank_transfer' ? 'border-[#c9a35b] shadow-[inset_0_0_22px_rgba(201,163,91,0.05)]' : 'border-white/10 hover:border-white/30'}`}>
                    <input type="radio" name="eventPaymentMethod" value="bank_transfer" checked={paymentMethod === 'bank_transfer'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                    <div className="absolute right-0 top-0 p-3 opacity-[0.07]"><ShieldCheck size={48} /></div>
                    <div className="relative z-10">
                      <h4 className="mb-1 text-lg font-medium text-white">Manual Bank Transfer</h4>
                      <p className="text-sm leading-5 text-[#a59d91]">Transfer funds directly to our bank. Upload proof to verify.</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {(() => {
              const totalAvailable = event.ticketTiers.reduce((acc, tier) => acc + getTierAvailability(tier), 0);

              if (!bookable) {
                return (
                  <div className="w-full border border-white/10 bg-white/[0.03] px-4 py-4 text-center text-sm text-[#918a7f] rounded-xl">
                    {phase === 'completed' ? 'This event has concluded. Ticket sales are closed.' : 'This event is not accepting bookings.'}
                  </div>
                );
              }
              
              if (totalAvailable === 0) {
                return (
                  <button 
                    onClick={handleWaitlist}
                    disabled={waitlistLoading}
                    className="w-full bg-transparent border border-[#c9a35b]/50 text-gold-gradient hover:bg-[#c9a35b]/10 font-bold uppercase tracking-wider py-4 rounded-xl transition-all disabled:opacity-50"
                  >
                    {waitlistLoading ? 'Joining Waitlist...' : 'Join Waitlist'}
                  </button>
                );
              }

              return (
                <button 
                  onClick={handleBooking}
                  disabled={!selectedTicket || getTierAvailability(selectedTicket) === 0 || bookingLoading}
                  className="w-full rounded-lg bg-gold-gradient py-3.5 text-sm font-bold uppercase tracking-wider text-black shadow-[0_0_20px_rgba(201,163,91,0.2)] transition-all hover:bg-[#e1bd70] disabled:opacity-50"
                >
                  {bookingLoading ? 'Booking...' : !selectedTicket ? 'Select a Ticket' : paymentMethod === 'bank_transfer' ? 'Reserve & Pay by Bank' : 'Book & Pay Securely'}
                </button>
              );
            })()}

            <SecurePaymentBadges compact />
            <p className="mt-4 text-center text-xs uppercase tracking-widest text-[#a59d91]">
              {paymentMethod === 'bank_transfer' ? 'Ticket issued after payment approval' : 'Secure checkout via PayFast'}
            </p>
            <PaymentForm paymentData={paymentData} payfastUrl={payfastUrl} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
