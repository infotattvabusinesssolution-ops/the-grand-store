import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { Calendar, Filter, MapPin, Users } from 'lucide-react';
import Price from '../../components/ui/Price';
import { getEventPhase, resolveEventImage } from './eventPhase';
import TribalCardBorder from '../home/components/TribalCardBorder';
import ProteaEmblem from '../home/components/ProteaEmblem';
import ArrivalsMandala from '../home/components/ArrivalsMandala';

const getStartingPrice = (ticketTiers = []) => {
  const prices = ticketTiers
    .map((tier) => Number(tier.price))
    .filter((price) => Number.isFinite(price));
  return prices.length ? Math.min(...prices) : null;
};

const EventCard = ({ event }) => {
  const startingPrice = getStartingPrice(event.ticketTiers);
  const phase = getEventPhase(event);
  return (
    <article className="arrival-luxury-card group flex flex-col justify-between overflow-hidden rounded-xl border border-white/[0.09] bg-gradient-to-b from-[#212529] via-[#16181b] to-[#0c0e10] shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-[#caa458]/60 hover:shadow-[0_20px_45px_rgba(0,0,0,0.9),0_0_28px_rgba(202,164,88,0.2)]">
      <div>
        <div className="relative aspect-[16/10] overflow-hidden bg-[#16181b]">
          {event.image ? (
            <img 
              src={resolveEventImage(event.image)} 
              alt={event.title} 
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" 
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center border-b border-white/10 bg-[#121417]">
              <span className="font-serif text-xl text-[#aaa296]">The Grand Store</span>
            </div>
          )}
          {/* Top category / phase badges */}
          <div className="absolute left-4 top-4 border border-[#caa458]/35 bg-black/75 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#caa458] rounded-sm backdrop-blur-sm">
            {event.type}
          </div>
          <div className="absolute bottom-4 left-4 border border-white/20 bg-black/85 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white rounded-sm backdrop-blur-sm">
            {phase}
          </div>
          {event.format === 'Virtual' && (
            <div className="absolute right-4 top-4 border border-[#caa458] bg-[#caa458] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#0b0a08] rounded-sm font-semibold">
              Virtual
            </div>
          )}
        </div>

        <div className="flex flex-col p-6 md:p-7">
          <div className="mb-4 flex items-center justify-between gap-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[#caa458]">
            <span>{new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <span className="text-[#a0a4a8]">{event.startTime}</span>
          </div>

          <h2 className="line-clamp-2 font-serif text-2xl leading-tight text-[#f4efe6] transition-colors group-hover:text-[#caa458] md:text-[1.7rem]">
            {event.title}
          </h2>

          <div className="mt-6 space-y-3 text-sm text-[#a0a4a8]">
            <div className="flex items-center gap-3">
              <MapPin size={17} className="shrink-0 text-[#caa458]" />
              <span className="truncate">{event.format === 'Virtual' ? 'Online Experience' : `${event.city || 'Local'}, ${event.location}`}</span>
            </div>
            {event.capacity && (
              <div className="flex items-center gap-3">
                <Users size={17} className="shrink-0 text-[#caa458]" />
                <span>Limited to {event.capacity} places</span>
              </div>
            )}
          </div>

          <div className="mt-8 flex items-end justify-between gap-5 border-t border-white/10 pt-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#777066]">From</p>
              <p className="mt-1 font-serif text-2xl text-[#caa458] font-medium">
                {startingPrice === null ? 'Enquire' : <Price amount={startingPrice} />}
              </p>
            </div>
            <Link 
              to={`/events/${event.slug || event._id}`} 
              className="rounded-sm border border-[#caa458] bg-[#caa458] px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[#0b0a08] shadow-[0_2px_12px_rgba(202,164,88,0.25)] transition-all hover:bg-[#d8b566] hover:shadow-[0_3px_15px_rgba(202,164,88,0.4)]"
            >
              {phase === 'completed' ? 'View recap' : 'View event'}
            </Link>
          </div>
        </div>
      </div>

      {/* Authentic South African Tribal Geometric Gold Border Strip */}
      <TribalCardBorder />
    </article>
  );
};

export default function EventsHub() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get(`/events`);
        setEvents(Array.isArray(res.data) ? res.data : Array.isArray(res.data?.events) ? res.data.events : []);
      } catch (error) {
        console.error('Failed to load events', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Strict deduplication by normalized title and date to remove any duplicate events
  const uniqueEvents = useMemo(() => {
    const seen = new Set();
    return events.filter((event) => {
      const key = (event.title || '').trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [events]);

  const filteredEvents = filterType === 'All'
    ? uniqueEvents
    : uniqueEvents.filter((event) => event.type === filterType || (filterType === 'Virtual' && event.format === 'Virtual'));

  const categories = ['All', 'Wine Tasting', 'Whisky Experience', 'Masterclass', 'Virtual'];

  const activeEvents = filteredEvents.filter((event) => ['upcoming', 'ongoing'].includes(getEventPhase(event)));
  const pastEvents = filteredEvents.filter((event) => getEventPhase(event) === 'completed');

  return (
    <main className="min-h-screen bg-[#0a0c0e] text-[#eee8dd]">
      {/* Hero Section with South African Mandala & King Protea Accents */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#0c0e10] via-[#0e1013] to-[#0a0c0e] px-5 py-12 md:px-8 md:py-16">
        {/* Subtle African Sun / Mandala Background Vector Engraving Art */}
        <div className="pointer-events-none absolute right-0 top-0 opacity-15 overflow-hidden">
          <ArrivalsMandala />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl">
          {/* Eyebrow with King Protea */}
          <div className="inline-flex items-center gap-2 mb-2.5">
            <span className="text-[11px] font-semibold tracking-[0.22em] uppercase text-[#caa458]">
              EXCLUSIVE GATHERINGS
            </span>
            <ProteaEmblem className="w-3.5 h-3.5 text-[#caa458]" />
          </div>

          <h1 className="font-serif text-4xl leading-tight text-white md:text-5xl lg:text-[54px] font-normal tracking-[-0.02em]">
            Events
          </h1>
          <p className="mt-3.5 max-w-2xl text-base leading-relaxed text-[#a0a4a8]">
            Intimate tastings, expert-led masterclasses and memorable evenings made for people who appreciate exceptional bottles.
          </p>
        </div>
      </section>

      <section className="px-5 py-10 md:px-8 md:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 border-b border-white/10 pb-7">
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#caa458]">
              <Filter size={15} className="text-[#caa458]" />
              <span>Browse by experience</span>
              <ProteaEmblem className="w-3 h-3 text-[#caa458] ml-1 opacity-80" />
            </div>
            <div className="flex overflow-x-auto sm:flex-wrap gap-2 pb-2 sm:pb-0 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden -mx-5 px-5 sm:mx-0 sm:px-0">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setFilterType(category)}
                  className={`shrink-0 whitespace-nowrap rounded-sm border px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] transition-all duration-200 md:px-5 ${
                    filterType === category
                      ? 'border-[#caa458] bg-[#caa458] text-[#0b0a08] shadow-[0_0_15px_rgba(202,164,88,0.25)]'
                      : 'border-white/15 bg-[#14161a] text-[#a0a4a8] hover:border-[#caa458]/70 hover:text-white'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="rounded-xl border border-white/10 bg-[#121417]/70 px-6 py-24 text-center text-sm uppercase tracking-[0.2em] text-[#caa458]">
              Loading experiences...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-[#121417]/70 px-6 py-24 text-center">
              <Calendar size={30} className="mx-auto mb-5 text-[#caa458]" />
              <h2 className="font-serif text-3xl text-[#f4efe6]">No upcoming events</h2>
              <p className="mt-3 text-[#a0a4a8]">Check back soon for new tastings and masterclasses.</p>
            </div>
          ) : (
            <>
              {activeEvents.length > 0 && (
                <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3 mb-16">
                  {activeEvents.map((event) => (
                    <EventCard key={event._id || event.id} event={event} />
                  ))}
                </div>
              )}
              {activeEvents.length === 0 && pastEvents.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-[#121417]/70 px-6 py-12 text-center mb-16">
                  <h2 className="font-serif text-2xl text-[#f4efe6]">No active events</h2>
                  <p className="mt-2 text-[#a0a4a8]">All events in this category have concluded.</p>
                </div>
              )}

              {pastEvents.length > 0 && (
                <div className="mt-12">
                  <div className="mb-8 border-b border-white/10 pb-4 flex items-center justify-between">
                    <div>
                      <h2 className="font-serif text-3xl text-[#f4efe6]">Past Events</h2>
                      <p className="mt-2 text-sm text-[#a0a4a8]">Discover our previous tastings and masterclasses.</p>
                    </div>
                    <ProteaEmblem className="w-5 h-5 text-[#caa458] opacity-60 hidden sm:block" />
                  </div>
                  <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3 opacity-75">
                    {pastEvents.map((event) => (
                      <EventCard key={event._id || event.id} event={event} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

