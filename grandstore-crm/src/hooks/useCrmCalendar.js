import { useState, useEffect, useCallback, useMemo } from 'react';
import { crmApi } from '../services/crmApi';

export const CALENDAR_CATEGORIES = [
  { id: 'all', label: 'All Operations', color: 'slate', dot: 'bg-slate-400', countKey: 'totalEvents' },
  { id: 'auctions', label: 'Auctions (Lots & Hammer)', color: 'purple', dot: 'bg-purple-500', countKey: 'auctionsCount' },
  { id: 'vip_approvals', label: 'VIP Deposits & Approvals', color: 'amber', dot: 'bg-amber-500', countKey: 'vipApprovalsCount' },
  { id: 'events', label: 'Event Tickets & Tastings', color: 'indigo', dot: 'bg-indigo-500', countKey: 'eventsTicketsCount' },
  { id: 'orders', label: 'Orders Placed', color: 'blue', dot: 'bg-blue-500', countKey: 'ordersCount' },
  { id: 'deliveries', label: 'Deliveries & Transit', color: 'emerald', dot: 'bg-emerald-500', countKey: 'deliveriesCount' },
  { id: 'settlements', label: 'Settlements & Deadlines', color: 'rose', dot: 'bg-rose-500', countKey: 'settlementsCount' }
];

export const ACTOR_OPTIONS = [
  { id: 'all', label: 'All Stakeholders' },
  { id: 'customer', label: 'Customers & VIP Patrons' },
  { id: 'vendor', label: 'Vendors & Consignors' },
  { id: 'internal', label: 'Internal Staff' }
];

/**
 * Robust Local Date Key Formatter: YYYY-MM-DD
 * Guaranteed immune to UTC/timezone offset shifts.
 */
export const formatLocalDateKey = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Custom React Hook: CRM Operations Master Calendar
 * Manages view dates, month/week grid calculation, backend fetching,
 * categories, actor filtering, search querying, and event selection.
 */
export function useCrmCalendar() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [view, setView] = useState('month'); // 'month' | 'week' | 'agenda'
  const [category, setCategory] = useState('all');
  const [actor, setActor] = useState('all');
  const [search, setSearch] = useState('');
  
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDay, setSelectedDay] = useState(() => formatLocalDateKey(new Date()));

  const fetchCalendar = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // 1-12

      const params = {
        year,
        month,
        category: category !== 'all' ? category : undefined,
        actor: actor !== 'all' ? actor : undefined,
        search: search.trim() ? search.trim() : undefined
      };

      const res = await crmApi.getCalendarEvents(params);
      if (res.data?.success) {
        setEvents(res.data.events || []);
        setSummary(res.data.summary || null);
        setError(null);
      } else {
        throw new Error(res.data?.message || 'Failed to fetch calendar');
      }
    } catch (err) {
      console.error('[CRM Calendar Hook Error]:', err);
      setError(err.response?.data?.message || err.message || 'Error loading operations calendar');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [currentDate, category, actor, search]);

  useEffect(() => {
    fetchCalendar(false);
  }, [fetchCalendar]);

  // Navigation handlers
  const goToNext = useCallback(() => {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (view === 'month') {
        next.setMonth(next.getMonth() + 1);
      } else if (view === 'week') {
        next.setDate(next.getDate() + 7);
      } else {
        next.setDate(next.getDate() + 14);
      }
      return next;
    });
  }, [view]);

  const goToPrev = useCallback(() => {
    setCurrentDate((prev) => {
      const prior = new Date(prev);
      if (view === 'month') {
        prior.setMonth(prior.getMonth() - 1);
      } else if (view === 'week') {
        prior.setDate(prior.getDate() - 7);
      } else {
        prior.setDate(prior.getDate() - 14);
      }
      return prior;
    });
  }, [view]);

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(formatLocalDateKey(today));
  }, []);

  // Events indexed by local date key (YYYY-MM-DD) for fast lookup in calendars
  const eventsByDate = useMemo(() => {
    const map = {};
    for (const ev of events) {
      if (!ev.date) continue;
      const key = formatLocalDateKey(ev.date);
      if (!key) continue;
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(ev);
    }
    return map;
  }, [events]);

  return {
    currentDate,
    setCurrentDate,
    view,
    setView,
    category,
    setCategory,
    actor,
    setActor,
    search,
    setSearch,
    events,
    eventsByDate,
    summary,
    loading,
    error,
    selectedEvent,
    setSelectedEvent,
    selectedDay,
    setSelectedDay,
    goToNext,
    goToPrev,
    goToToday,
    refresh: () => fetchCalendar(false)
  };
}
