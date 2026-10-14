import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, RotateCw, 
  Search, Filter, Gavel, ShieldCheck, ShoppingBag, Truck, 
  Wallet, Sparkles, X, ExternalLink, Copy, Check, Clock, 
  AlertTriangle, Users, Building2, Layers, CheckCircle2, 
  ArrowUpRight, Ticket, Flame, Bell, Loader2
} from 'lucide-react';
import { 
  useCrmCalendar, 
  CALENDAR_CATEGORIES, 
  ACTOR_OPTIONS, 
  formatLocalDateKey 
} from '../hooks/useCrmCalendar';
import StatusBadge from '../components/common/StatusBadge';
import { useToast } from '../context/ToastContext';

// Category color configuration for badges and styling
const CATEGORY_STYLES = {
  auctions: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-800 border-purple-300',
    dot: 'bg-purple-500',
    icon: Gavel,
    label: 'Auction'
  },
  vip_approvals: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    dot: 'bg-amber-500',
    icon: ShieldCheck,
    label: 'VIP & Approval'
  },
  events: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    dot: 'bg-indigo-500',
    icon: Ticket,
    label: 'Tasting / Ticket'
  },
  orders: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    dot: 'bg-blue-500',
    icon: ShoppingBag,
    label: 'Order'
  },
  deliveries: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    dot: 'bg-emerald-500',
    icon: Truck,
    label: 'Delivery & Transit'
  },
  settlements: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    badge: 'bg-rose-100 text-rose-800 border-rose-300',
    dot: 'bg-rose-500',
    icon: Wallet,
    label: 'Settlement'
  }
};

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CrmCalendarPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const {
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
    selectedEvent,
    setSelectedEvent,
    selectedDay,
    setSelectedDay,
    goToNext,
    goToPrev,
    goToToday,
    refresh
  } = useCrmCalendar();

  const [copiedRef, setCopiedRef] = useState(false);
  const [dayModalDate, setDayModalDate] = useState(null);

  // Timezone-immune local date for today
  const todayIso = useMemo(() => formatLocalDateKey(new Date()), []);

  // Month Grid Calculation (Monday first, local timezone aligned)
  const monthGridDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Monday as 0, Sunday as 6
    const startDayOfWeek = (firstDay.getDay() + 6) % 7;
    const daysInMonth = lastDay.getDate();

    const days = [];

    // Prior month padding
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date: d,
        iso: formatLocalDateKey(d),
        dayNum: prevMonthLastDay - i,
        isCurrentMonth: false
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      days.push({
        date: d,
        iso: formatLocalDateKey(d),
        dayNum: day,
        isCurrentMonth: true
      });
    }

    // Trailing next month padding to complete 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({
        date: d,
        iso: formatLocalDateKey(d),
        dayNum: i,
        isCurrentMonth: false
      });
    }

    return days;
  }, [currentDate]);

  // Week Grid Calculation (Monday to Sunday, local timezone aligned)
  const weekGridDays = useMemo(() => {
    const d = new Date(currentDate);
    const dayOfWeek = (d.getDay() + 6) % 7;
    const monday = new Date(d);
    monday.setDate(monday.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(dayDate.getDate() + i);
      days.push({
        date: dayDate,
        iso: formatLocalDateKey(dayDate),
        dayNum: dayDate.getDate(),
        dayName: DAYS_OF_WEEK[i]
      });
    }
    return days;
  }, [currentDate]);

  const monthYearLabel = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedRef(true);
    toast.success(`Copied "${text}" to clipboard`);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  // Dynamic count extractor helper from backend summary
  const getCategoryCount = (catId, countKey) => {
    if (summary && countKey && summary[countKey] !== undefined) {
      return summary[countKey];
    }
    if (catId === 'all') return events.length;
    return events.filter(e => e.category === catId).length;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 font-bold tracking-wider uppercase rounded-full border border-blue-400/30 flex items-center gap-1.5 backdrop-blur-md">
                <CalendarIcon size={13} className="text-blue-300" />
                Live Dynamic Operations Calendar
              </span>
              <span className="text-slate-400 font-medium">
                Unified Directorate • Central Logistics & Milestones
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Operations & Fulfilment <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Master Calendar</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Consolidated real-time operational telemetry tracking customer & vendor actions: Live Auctions, VIP Deposits & Approvals, Tasting Event Tickets, Placed Orders, Logistics Dispatches & Transit, and 30-Day Payout Deadlines.
            </p>
          </div>

          {/* Controls: Prev, Next, Today, Refresh */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center shrink-0">
            <button
              onClick={goToToday}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition-all shadow-sm"
            >
              Today
            </button>

            <div className="flex items-center bg-slate-800/80 border border-slate-700 rounded-xl p-0.5">
              <button
                onClick={goToPrev}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-lg transition-colors"
                title="Previous"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-3 text-xs font-bold text-white min-w-[120px] text-center">
                {monthYearLabel}
              </span>
              <button
                onClick={goToNext}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-lg transition-colors"
                title="Next"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <button
              onClick={() => refresh()}
              disabled={loading}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-all shadow-sm"
              title="Refresh calendar from backend"
            >
              <RotateCw size={16} className={loading ? 'animate-spin text-blue-400' : ''} />
            </button>
          </div>
        </div>

        {/* Dynamic Operational Metric Badges Bar (All 7 Categories directly from Backend) */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          <div 
            onClick={() => setCategory('all')}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              category === 'all' 
                ? 'bg-blue-600/30 border-blue-400/50 text-white' 
                : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800/70'
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Pipeline</p>
            <p className="text-lg font-black text-white">{summary?.totalEvents ?? events.length}</p>
          </div>

          <div 
            onClick={() => setCategory('auctions')}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              category === 'auctions' 
                ? 'bg-purple-600/30 border-purple-400/50 text-white' 
                : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800/70'
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span> Auctions
            </p>
            <p className="text-lg font-black text-purple-200">{summary?.auctionsCount ?? 0}</p>
          </div>

          <div 
            onClick={() => setCategory('vip_approvals')}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              category === 'vip_approvals' 
                ? 'bg-amber-600/30 border-amber-400/50 text-white' 
                : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800/70'
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> VIP & Approvals
            </p>
            <p className="text-lg font-black text-amber-200">{summary?.vipApprovalsCount ?? 0}</p>
          </div>

          <div 
            onClick={() => setCategory('events')}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              category === 'events' 
                ? 'bg-indigo-600/30 border-indigo-400/50 text-white' 
                : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800/70'
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> Event Tickets
            </p>
            <p className="text-lg font-black text-indigo-200">{summary?.eventsTicketsCount ?? 0}</p>
          </div>

          <div 
            onClick={() => setCategory('orders')}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              category === 'orders' 
                ? 'bg-blue-600/30 border-blue-400/50 text-white' 
                : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800/70'
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Orders Placed
            </p>
            <p className="text-lg font-black text-blue-200">{summary?.ordersCount ?? 0}</p>
          </div>

          <div 
            onClick={() => setCategory('deliveries')}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              category === 'deliveries' 
                ? 'bg-emerald-600/30 border-emerald-400/50 text-white' 
                : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800/70'
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Deliveries
            </p>
            <p className="text-lg font-black text-emerald-200">{summary?.deliveriesCount ?? 0}</p>
          </div>

          <div 
            onClick={() => setCategory('settlements')}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              category === 'settlements' 
                ? 'bg-rose-600/30 border-rose-400/50 text-white' 
                : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:bg-slate-800/70'
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Settlements
            </p>
            <p className="text-lg font-black text-rose-200">{summary?.settlementsCount ?? 0}</p>
          </div>
        </div>
      </div>

      {/* 2. Controls & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Omni Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search patron, consignor, lot #, order ID, waybill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Stakeholder (Actor) Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Stakeholder:</span>
            <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              {ACTOR_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setActor(opt.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    actor === opt.id
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* View Switcher: Month / Week / Agenda */}
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                view === 'month'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon size={14} /> Month
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                view === 'week'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock size={14} /> Week
            </button>
            <button
              onClick={() => setView('agenda')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                view === 'agenda'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers size={14} /> Agenda
            </button>
          </div>
        </div>

        {/* Category Filter Pills with Dynamic Backend Counts */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-2 flex items-center gap-1">
            <Filter size={12} /> Category:
          </span>
          {CALENDAR_CATEGORIES.map((cat) => {
            const isSelected = category === cat.id;
            const count = getCategoryCount(cat.id, cat.countKey);

            return (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${cat.dot}`}></span>
                <span>{cat.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isSelected ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading Overlay Bar */}
      {loading && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs text-blue-700 animate-pulse">
          <span className="flex items-center gap-2 font-medium">
            <Loader2 size={15} className="animate-spin text-blue-600" />
            Synchronizing live operations telemetry from MongoDB backend...
          </span>
          <span className="text-[11px] text-blue-500 font-bold uppercase tracking-wider">
            Live Stream
          </span>
        </div>
      )}

      {/* 3. Main Calendar Views */}
      {view === 'month' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Day Headers (Mon - Sun) */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-slate-600 text-xs font-bold text-center py-3">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="tracking-wider uppercase">
                {day}
              </div>
            ))}
          </div>

          {/* Month Grid Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 min-h-[640px]">
            {monthGridDays.map((cell) => {
              const cellEvents = eventsByDate[cell.iso] || [];
              const isToday = cell.iso === todayIso;
              const isSelected = cell.iso === selectedDay;

              return (
                <div
                  key={cell.iso}
                  onClick={() => setSelectedDay(cell.iso)}
                  className={`min-h-[110px] sm:min-h-[125px] p-2 flex flex-col justify-between transition-colors cursor-pointer group relative ${
                    cell.isCurrentMonth ? 'bg-white hover:bg-blue-50/30' : 'bg-slate-50/60 text-slate-400 hover:bg-slate-100/60'
                  } ${isToday ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/20' : ''} ${
                    isSelected ? 'bg-blue-50/50' : ''
                  }`}
                >
                  {/* Top Bar: Date Number + Count Indicator */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-blue-600 text-white'
                          : cell.isCurrentMonth
                          ? 'text-slate-700 group-hover:text-blue-600'
                          : 'text-slate-400'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {cellEvents.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-full">
                        {cellEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Event Badges List (Max 3, then +X more) */}
                  <div className="flex-1 mt-1.5 space-y-1 overflow-hidden">
                    {cellEvents.slice(0, 3).map((ev) => {
                      const style = CATEGORY_STYLES[ev.category] || CATEGORY_STYLES.orders;
                      const Icon = style.icon;

                      return (
                        <div
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(ev);
                          }}
                          className={`px-1.5 py-1 rounded-md text-[11px] font-semibold border truncate flex items-center gap-1 transition-all hover:scale-[1.02] shadow-2xs ${style.bg} ${style.border} ${style.text}`}
                          title={`${ev.title} (${ev.actorName || ev.actor})`}
                        >
                          <Icon size={11} className="shrink-0" />
                          <span className="truncate">{ev.title}</span>
                        </div>
                      );
                    })}

                    {cellEvents.length > 3 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDayModalDate(cell.iso);
                        }}
                        className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline block pt-0.5 text-left w-full"
                      >
                        +{cellEvents.length - 3} more operations...
                      </button>
                    )}
                  </div>

                  {/* Bottom Dot Preview Bar */}
                  {cellEvents.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 pt-1 border-t border-slate-100/60">
                      {cellEvents.slice(0, 6).map((ev, idx) => {
                        const style = CATEGORY_STYLES[ev.category] || CATEGORY_STYLES.orders;
                        return (
                          <span
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full ${style.dot}`}
                            title={ev.title}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week Column View */}
      {view === 'week' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-slate-200 min-h-[500px]">
            {weekGridDays.map((col) => {
              const colEvents = eventsByDate[col.iso] || [];
              const isToday = col.iso === todayIso;

              return (
                <div 
                  key={col.iso} 
                  className={`p-3 flex flex-col ${isToday ? 'bg-blue-50/30' : 'bg-white'}`}
                >
                  {/* Column Header */}
                  <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        {col.dayName}
                      </p>
                      <p className={`text-base font-extrabold ${isToday ? 'text-blue-600' : 'text-slate-800'}`}>
                        {col.dayNum} {col.date.toLocaleDateString('en-US', { month: 'short' })}
                      </p>
                    </div>
                    {isToday && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                        Today
                      </span>
                    )}
                  </div>

                  {/* Event Cards inside Week Column */}
                  <div className="flex-1 mt-3 space-y-2 overflow-y-auto max-h-[600px] crm-scrollbar pr-0.5">
                    {colEvents.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-400 font-medium">
                        No scheduled items
                      </div>
                    ) : (
                      colEvents.map((ev) => {
                        const style = CATEGORY_STYLES[ev.category] || CATEGORY_STYLES.orders;
                        const Icon = style.icon;

                        return (
                          <div
                            key={ev.id}
                            onClick={() => setSelectedEvent(ev)}
                            className="p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all cursor-pointer space-y-2 group"
                          >
                            <div className="flex items-center justify-between gap-1 text-[11px]">
                              <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase flex items-center gap-1 ${style.badge}`}>
                                <Icon size={10} /> {style.label}
                              </span>
                              <span className="text-slate-400 text-[10px] font-semibold">
                                {ev.date ? new Date(ev.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>

                            <div>
                              <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                {ev.title}
                              </p>
                              <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                                {ev.subtitle}
                              </p>
                            </div>

                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                              <span className="font-semibold text-slate-700 capitalize">
                                {ev.actor}: <span className="font-normal text-slate-500">{ev.actorName || 'N/A'}</span>
                              </span>
                              {ev.amount ? (
                                <span className="font-black text-slate-900">
                                  R{Number(ev.amount).toLocaleString()}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Operational Agenda View */}
      {view === 'agenda' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Layers size={14} className="text-blue-600" />
              Chronological Operations Pipeline ({events.length} Items)
            </h3>
            <span className="text-xs text-slate-500">Live operational milestones</span>
          </div>

          {events.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <CalendarIcon size={36} className="mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No operations found matching current filters</p>
              <p className="text-xs text-slate-400">Try adjusting your category, stakeholder, or search query.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {events.map((ev) => {
                const style = CATEGORY_STYLES[ev.category] || CATEGORY_STYLES.orders;
                const Icon = style.icon;
                const evDate = new Date(ev.date);
                const isToday = formatLocalDateKey(ev.date) === todayIso;

                return (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="p-4 hover:bg-blue-50/40 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      {/* Date Badge */}
                      <div className={`p-2.5 rounded-xl border text-center shrink-0 min-w-[64px] ${
                        isToday ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                        <span className="text-[10px] font-bold uppercase block tracking-wider opacity-80">
                          {evDate.toLocaleDateString('en-US', { month: 'short' })}
                        </span>
                        <span className="text-lg font-black block leading-none my-0.5">
                          {evDate.getDate()}
                        </span>
                        <span className="text-[10px] font-semibold block opacity-80">
                          {evDate.toLocaleDateString('en-US', { weekday: 'short' })}
                        </span>
                      </div>

                      {/* Main Details */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase flex items-center gap-1 ${style.badge}`}>
                            <Icon size={11} /> {style.label}
                          </span>
                          
                          <StatusBadge status={ev.status} />

                          {ev.priority === 'urgent' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                              <Flame size={10} /> Urgent Action
                            </span>
                          )}

                          <span className="text-xs text-slate-400">
                            {evDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {ev.title}
                        </h4>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {ev.subtitle}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                          <span className="flex items-center gap-1 font-medium">
                            {ev.actor === 'vendor' ? <Building2 size={13} className="text-amber-500" /> : <Users size={13} className="text-blue-500" />}
                            <span className="capitalize">{ev.actor}:</span> <strong className="text-slate-800">{ev.actorName || 'N/A'}</strong>
                          </span>

                          {ev.reference && (
                            <span className="text-slate-400 font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                              Ref: {ev.reference}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Action / Financials */}
                    <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pl-16 md:pl-0">
                      {ev.amount ? (
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Value</span>
                          <span className="text-base font-black text-slate-900">
                            R {Number(ev.amount).toLocaleString()}
                          </span>
                        </div>
                      ) : null}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (ev.link) navigate(ev.link);
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-all flex items-center gap-1"
                      >
                        Inspect <ArrowUpRight size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Interactive Event Inspector Modal / Slide-Over */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  CATEGORY_STYLES[selectedEvent.category]?.badge || 'bg-slate-200 text-slate-800'
                }`}>
                  {CATEGORY_STYLES[selectedEvent.category]?.label || 'Operation'}
                </span>
                <StatusBadge status={selectedEvent.status} />
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto crm-scrollbar">
              <div>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {selectedEvent.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {selectedEvent.subtitle}
                </p>
              </div>

              {/* Date & Time */}
              <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Scheduled Milestone</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <span className="font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                  {new Date(selectedEvent.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Stakeholder Info */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Stakeholder Details ({selectedEvent.actor?.toUpperCase()})
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{selectedEvent.actorName || 'Unknown Patron'}</p>
                    <p className="text-[11px] text-slate-500">{selectedEvent.actorEmail || 'No email provided'}</p>
                    {selectedEvent.actorPhone && (
                      <p className="text-[11px] text-slate-500">{selectedEvent.actorPhone}</p>
                    )}
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 capitalize">
                    {selectedEvent.actor}
                  </span>
                </div>
              </div>

              {/* Reference & Financials */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-slate-200 rounded-2xl p-3.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reference Code</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-mono font-bold text-slate-800 truncate">
                      {selectedEvent.reference || 'N/A'}
                    </span>
                    {selectedEvent.reference && (
                      <button
                        onClick={() => handleCopy(selectedEvent.reference)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-600 transition-colors"
                        title="Copy Reference"
                      >
                        {copiedRef ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>
                </div>

                <div className="border border-slate-200 rounded-2xl p-3.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Financial Value</span>
                  <p className="text-base font-black text-slate-900 mt-0.5">
                    {selectedEvent.amount ? `R ${Number(selectedEvent.amount).toLocaleString()}` : 'Non-monetary'}
                  </p>
                </div>
              </div>

              {/* Metadata Details */}
              {selectedEvent.meta && Object.keys(selectedEvent.meta).length > 0 && (
                <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-3.5 text-xs space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Operational Metadata</span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {Object.entries(selectedEvent.meta).map(([k, v]) => (
                      <div key={k} className="truncate">
                        <span className="text-slate-400 capitalize">{k.replace(/([A-Z])/g, ' $1')}: </span>
                        <strong className="text-slate-700">{String(v || 'N/A')}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Close
              </button>

              {selectedEvent.link && (
                <button
                  onClick={() => {
                    navigate(selectedEvent.link);
                    setSelectedEvent(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
                >
                  Open Operational Module <ArrowUpRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Day Expansion Modal (When +X more is clicked on a month cell) */}
      {dayModalDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon size={16} className="text-blue-600" />
                Operations for {new Date(dayModalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </h3>
              <button
                onClick={() => setDayModalDate(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto crm-scrollbar">
              {(eventsByDate[dayModalDate] || []).map((ev) => {
                const style = CATEGORY_STYLES[ev.category] || CATEGORY_STYLES.orders;
                const Icon = style.icon;

                return (
                  <div
                    key={ev.id}
                    onClick={() => {
                      setSelectedEvent(ev);
                      setDayModalDate(null);
                    }}
                    className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase ${style.badge}`}>
                        <Icon size={10} className="inline mr-1" /> {style.label}
                      </span>
                      <StatusBadge status={ev.status} />
                    </div>
                    <p className="text-xs font-bold text-slate-900">{ev.title}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{ev.subtitle}</p>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-right">
              <button
                onClick={() => setDayModalDate(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
