import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { Calendar, Filter, MapPin, Users } from 'lucide-react';
import Price from '../../components/ui/Price';
import { getEventPhase, resolveEventImage } from './eventPhase';

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
    <article className="group flex flex-col overflow-hidden border border-white/10 bg-[#12110e] transition-colors hover:border-[#c9a35b]/60">
      <div className="relative aspect-[16/10] overflow-hidden bg-[#1a1814]">
        {event.image ? (
          <img src={resolveEventImage(event.image)} alt={event.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full w-full items-center justify-center border-b border-white/10"><span className="font-serif text-xl text-[#aaa296]">The Grand Store</span></div>
        )}
        <div className="absolute left-4 top-4 border border-white/15 bg-[#0b0a08] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#d8b76d]">{event.type}</div>
        <div className="absolute bottom-4 left-4 border border-white/15 bg-[#0b0a08]/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white">{phase}</div>
        {event.format === 'Virtual' && (
          <div className="absolute right-4 top-4 border border-[#d8b76d] bg-[#c9a35b] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#0b0a08]">Virtual</div>
        )}
      </div>
      <div className="flex flex-grow flex-col p-6 md:p-7">
        <div className="mb-4 flex items-center justify-between gap-4 text-[11px] font-bold uppercase tracking-[0.16em] text-[#aaa296]">
          <span>{new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span>{event.startTime}</span>
        </div>
        <h2 className="line-clamp-2 font-serif text-2xl leading-tight text-[#f4efe6] md:text-[1.7rem]">{event.title}</h2>
        <div className="mt-6 space-y-3 text-sm text-[#aaa296]">
          <div className="flex items-center gap-3">
            <MapPin size={17} className="shrink-0 text-[#d8b76d]" />
            <span className="truncate">{event.format === 'Virtual' ? 'Online Experience' : `${event.city || 'Local'}, ${event.location}`}</span>
          </div>
          {event.capacity && (
            <div className="flex items-center gap-3"><Users size={17} className="shrink-0 text-[#d8b76d]" /><span>Limited to {event.capacity} places</span></div>
          )}
        </div>
        <div className="mt-8 flex items-end justify-between gap-5 border-t border-white/10 pt-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#777066]">From</p>
            <p className="mt-1 font-serif text-2xl text-[#d8b76d]">{startingPrice === null ? 'Enquire' : <Price amount={startingPrice} />}</p>
          </div>
          <Link to={`/events/${event.slug || event._id}`} className="border border-[#c9a35b] bg-[#c9a35b] px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[#0b0a08] transition-colors hover:bg-[#e1bd70]">{phase === 'completed' ? 'View recap' : 'View event'}</Link>
        </div>
      </div>
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
        setEvents(res.data);
      } catch (error) {
        console.error('Failed to load events', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const filteredEvents = filterType === 'All'
    ? events
    : events.filter((event) => event.type === filterType || (filterType === 'Virtual' && event.format === 'Virtual'));

  const categories = ['All', 'Wine Tasting', 'Whisky Experience', 'Masterclass', 'Virtual'];

  const activeEvents = filteredEvents.filter((event) => ['upcoming', 'ongoing'].includes(getEventPhase(event)));
  const pastEvents = filteredEvents.filter((event) => getEventPhase(event) === 'completed');

  return (
    <main className="min-h-screen bg-[#0b0a08] text-[#eee8dd]">
      <section className="border-b border-white/10 bg-[#11100d] px-5 py-10 md:px-8 md:py-12">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-serif text-4xl leading-tight text-[#f4efe6] md:text-5xl">
            Events
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-[#aaa296]">
            Intimate tastings, expert-led masterclasses and memorable evenings made for people who appreciate exceptional bottles.
          </p>
        </div>
      </section>

      <section className="px-5 py-10 md:px-8 md:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 border-b border-white/10 pb-7">
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#aaa296]">
              <Filter size={15} className="text-[#d8b76d]" />
              Browse by experience
            </div>
            <div className="flex overflow-x-auto sm:flex-wrap gap-2 pb-2 sm:pb-0 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden -mx-5 px-5 sm:mx-0 sm:px-0">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setFilterType(category)}
                  className={`shrink-0 whitespace-nowrap border px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors md:px-5 ${
                    filterType === category
                      ? 'border-[#c9a35b] bg-[#c9a35b] text-[#0b0a08]'
                      : 'border-white/15 bg-[#15130f] text-[#aaa296] hover:border-[#c9a35b]/70 hover:text-[#eee8dd]'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="border border-white/10 bg-[#11100d] px-6 py-24 text-center text-sm uppercase tracking-[0.2em] text-[#d8b76d]">
              Loading experiences...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="border border-white/10 bg-[#11100d] px-6 py-24 text-center">
              <Calendar size={30} className="mx-auto mb-5 text-[#d8b76d]" />
              <h2 className="font-serif text-3xl text-[#f4efe6]">No upcoming events</h2>
              <p className="mt-3 text-[#aaa296]">Check back soon for new tastings and masterclasses.</p>
            </div>
          ) : (
            <>
              {activeEvents.length > 0 && (
                <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3 mb-16">
                  {activeEvents.map((event) => (
                    <EventCard key={event._id} event={event} />
                  ))}
                </div>
              )}
              {activeEvents.length === 0 && pastEvents.length > 0 && (
                <div className="border border-white/10 bg-[#11100d] px-6 py-12 text-center mb-16">
                  <h2 className="font-serif text-2xl text-[#f4efe6]">No active events</h2>
                  <p className="mt-2 text-[#aaa296]">All events in this category have concluded.</p>
                </div>
              )}

              {pastEvents.length > 0 && (
                <div className="mt-12">
                  <div className="mb-8 border-b border-white/10 pb-4">
                    <h2 className="font-serif text-3xl text-[#f4efe6]">Past Events</h2>
                    <p className="mt-2 text-sm text-[#aaa296]">Discover our previous tastings and masterclasses.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3 opacity-60">
                    {pastEvents.map((event) => (
                      <EventCard key={event._id} event={event} />
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
