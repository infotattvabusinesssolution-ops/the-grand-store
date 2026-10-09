import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Package, 
  Ticket, Gavel, Cake, Clock, MapPin, ExternalLink, ArrowRight, 
  CheckCircle2, AlertCircle, Copy, Loader2, Sparkles, Filter, Info,
  Truck, ShieldCheck, ChevronDown, ChevronUp, Lock, Crown, Download
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { createGoogleCalendarUrl, downloadIcsFile } from '../../utils/calendarUtils';

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_OF_WEEK = [
  { full: "Sun", short: "S" },
  { full: "Mon", short: "M" },
  { full: "Tue", short: "T" },
  { full: "Wed", short: "W" },
  { full: "Thu", short: "T" },
  { full: "Fri", short: "F" },
  { full: "Sat", short: "S" }
];

export default function CustomerCalendar({ embedded = false }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ activities: [], user: null, birthdaySettings: null });
  const [activeCategory, setActiveCategory] = useState('all');
  const [copiedCode, setCopiedCode] = useState(false);

  // Calendar navigation state
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState(null); // ISO string or null

  const fetchActivities = async () => {
    try {
      const res = await api.get('/auth/calendar-activities');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching calendar activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  // Filter activities by category and sort by date descending
  const filteredActivities = useMemo(() => {
    if (!data.activities || !Array.isArray(data.activities)) return [];
    const list = activeCategory === 'all' 
      ? data.activities 
      : data.activities.filter(a => a.category === activeCategory);
    return [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [data.activities, activeCategory]);

  // Group activities by date key (YYYY-MM-DD), ensuring no duplicates per day
  const activitiesByDate = useMemo(() => {
    const map = {};
    filteredActivities.forEach(act => {
      const d = new Date(act.date);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map[key]) map[key] = [];
      const alreadyExists = map[key].some(existing => 
        existing.id === act.id || 
        (existing.title === act.title && existing.subtitle === act.subtitle)
      );
      if (!alreadyExists) {
        map[key].push(act);
      }
    });
    return map;
  }, [filteredActivities]);

  // Calendar Grid Calculations
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateKey = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dayNumber: dayNum,
        isCurrentMonth: false,
        dateKey,
        activities: activitiesByDate[dateKey] || []
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const isToday = 
        today.getFullYear() === currentYear && 
        today.getMonth() === currentMonth && 
        today.getDate() === i;

      days.push({
        dayNumber: i,
        isCurrentMonth: true,
        isToday,
        dateKey,
        activities: activitiesByDate[dateKey] || []
      });
    }

    // Next month padding to make full 35 or 42 grid
    const totalSlots = days.length <= 35 ? 35 : 42;
    const remainingSlots = totalSlots - days.length;
    for (let i = 1; i <= remainingSlots; i++) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateKey = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        dayNumber: i,
        isCurrentMonth: false,
        dateKey,
        activities: activitiesByDate[dateKey] || []
      });
    }

    return days;
  }, [currentYear, currentMonth, activitiesByDate]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setSelectedDate(todayKey);
  };

  // Selected date activities or all upcoming activities (deduplicated timeline)
  const activeDayActivities = useMemo(() => {
    if (selectedDate) {
      const dayList = activitiesByDate[selectedDate] || [];
      const seen = new Set();
      return dayList.filter(act => {
        const sig = act.id || `${act.category}-${act.type}-${act.title}`;
        if (seen.has(sig)) return false;
        seen.add(sig);
        return true;
      });
    }

    // Timeline view (when no date selected):
    // Deduplicate so repetitive notifications never appear multiple times
    const seen = new Set();
    const timeline = [];

    for (const act of filteredActivities) {
      // In timeline, only show 1 birthday milestone (the active/upcoming celebration)
      if (act.type === 'birthday') {
        if (seen.has('birthday-milestone')) continue;
        seen.add('birthday-milestone');
      }

      // Group/deduplicate auction bids on the same lot
      if (act.type === 'auction_bid' && act.details?.lotId) {
        const lotKey = `auction-lot-${act.details.lotId}`;
        if (seen.has(lotKey)) continue;
        seen.add(lotKey);
      }

      // Deduplicate orders
      if ((act.type === 'delivery' || act.type === 'order_placed') && act.details?.orderId) {
        const orderKey = `order-${act.details.orderId}`;
        if (seen.has(orderKey)) continue;
        seen.add(orderKey);
      }

      const sig = act.id || `${act.category}-${act.type}-${act.title}`;
      if (!seen.has(sig)) {
        seen.add(sig);
        timeline.push(act);
      }
    }

    return timeline.slice(0, 10);
  }, [selectedDate, activitiesByDate, filteredActivities]);

  const copyBirthdayCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const getActivityColor = (type, category) => {
    if (category === 'birthday') return { dot: 'bg-rose-400', badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30' };
    if (category === 'events') return { dot: 'bg-amber-400', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
    if (type === 'auction_win') return { dot: 'bg-[var(--color-gold)]', badge: 'bg-[var(--color-gold)]/15 text-[var(--color-gold)] border-[var(--color-gold)]/30' };
    if (type === 'auction_deposit_verified') return { dot: 'bg-[var(--color-gold)]', badge: 'bg-[var(--color-gold)]/15 text-[var(--color-gold)] border-[var(--color-gold)]/30' };
    if (type === 'bidder_kyc_approved') return { dot: 'bg-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    if (type === 'auction_deposit_pending') return { dot: 'bg-amber-400', badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
    if (type === 'auction_deposit_refunded') return { dot: 'bg-white/40', badge: 'bg-white/10 text-white/70 border-white/20' };
    if (category === 'auctions') return { dot: 'bg-[var(--color-gold)]', badge: 'bg-[var(--color-gold)]/15 text-[var(--color-gold)] border-[var(--color-gold)]/30' };
    if (type === 'delivery') return { dot: 'bg-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
    return { dot: 'bg-sky-400', badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30' };
  };

  const getActivityIcon = (category, type) => {
    if (category === 'birthday') return <Cake size={16} className="text-rose-400" />;
    if (category === 'events') return <Ticket size={16} className="text-amber-400" />;
    if (type === 'auction_win') return <Crown size={16} className="text-[var(--color-gold)]" />;
    if (type === 'auction_deposit_verified') return <Crown size={16} className="text-[var(--color-gold)]" />;
    if (type === 'bidder_kyc_approved') return <ShieldCheck size={16} className="text-emerald-400" />;
    if (type === 'auction_deposit_pending') return <Clock size={16} className="text-amber-400" />;
    if (category === 'auctions') return <Gavel size={16} className="text-[var(--color-gold)]" />;
    if (type === 'delivery') return <Truck size={16} className="text-emerald-400" />;
    return <Package size={16} className="text-sky-400" />;
  };

  const bdaySettings = data.birthdaySettings;
  const userDob = data.user?.dateOfBirth ? new Date(data.user.dateOfBirth) : null;
  const isBirthMonth = userDob && userDob.getMonth() === currentMonth;

  const birthdayInfo = useMemo(() => {
    if (!userDob || isNaN(userDob.getTime())) return { hasDob: false };
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Birthday this year
    const bdayThisYear = new Date(currentYear, userDob.getMonth(), userDob.getDate(), 0, 0, 0);
    
    // Active window: from birthday date (day 0) through 30 days after
    const diffMs = now.getTime() - bdayThisYear.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    const isToday = now.getMonth() === userDob.getMonth() && now.getDate() === userDob.getDate();
    const isCurrentMonth = now.getMonth() === userDob.getMonth();
    const isActiveCelebration = diffDays >= 0 && diffDays <= 30;
    const daysRemaining = isActiveCelebration ? (30 - diffDays) : null;

    return {
      hasDob: true,
      dob: userDob,
      dateFormatted: `${MONTH_NAMES[userDob.getMonth()]} ${userDob.getDate()}`,
      isToday,
      isCurrentMonth,
      isActiveCelebration,
      daysRemaining,
    };
  }, [userDob]);

  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center text-[var(--color-gold)]">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className={`w-full ${embedded ? '' : 'max-w-6xl mx-auto'} flex flex-col gap-6 sm:gap-8 pb-10 sm:pb-12 animate-fadeIn`}>
      
      {/* Top Header if standalone */}
      {!embedded && (
        <section className="border-b border-white/10 pb-5 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-[var(--color-ivory)] font-serif text-2xl sm:text-3xl lg:text-4xl mb-1.5 flex items-center gap-2.5 sm:gap-3 tracking-wide">
                <CalendarIcon className="text-[var(--color-gold)] shrink-0" size={28} />
                My Activity Calendar
              </h1>
              <p className="text-[var(--color-ivory-muted)] text-xs sm:text-sm font-light leading-relaxed">
                Track your order delivery schedules, booked tasting events, auction bidding milestones, and birthdays in one place.
              </p>
            </div>
            <Link
              to="/customer/profile"
              className="py-2 px-3.5 sm:py-2.5 sm:px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs uppercase tracking-wider font-semibold transition-all self-start sm:self-auto shrink-0"
            >
              Back to Profile
            </Link>
          </div>
        </section>
      )}

      {/* Birthday Celebration Promo Banner (Strictly restricted to birthday celebration) */}
      {bdaySettings?.enabled && bdaySettings?.discountEnabled && (
        <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border p-4 sm:p-6 lg:p-7 shadow-[0_10px_35px_rgba(0,0,0,0.6)] transition-all ${
          birthdayInfo.isActiveCelebration
            ? 'bg-gradient-to-r from-[#22180b] via-[#16130f] to-[#0a0a0a] border-[#c9a35b] shadow-[0_0_30px_rgba(201,163,91,0.2)]'
            : 'bg-gradient-to-r from-[#14120f] via-[#0d0c0a] to-[#0a0a0a] border-white/10'
        }`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#c9a35b]/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />
          
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 sm:gap-5 relative z-10">
            <div className="flex flex-col sm:flex-row items-start gap-3.5 sm:gap-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl border flex items-center justify-center shrink-0 ${
                birthdayInfo.isActiveCelebration 
                  ? 'bg-[#c9a35b]/20 border-[#c9a35b] text-[#c9a35b] animate-pulse' 
                  : 'bg-white/5 border-white/10 text-white/50'
              }`}>
                <Cake size={22} className="sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                  <span className="text-xs uppercase tracking-widest font-bold text-[#c9a35b] flex items-center gap-1">
                    <Sparkles size={13} /> Exclusive Birthday Privilege
                  </span>

                  {birthdayInfo.hasDob ? (
                    birthdayInfo.isActiveCelebration ? (
                      <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 sm:px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={11} /> Active for your Birthday • {birthdayInfo.daysRemaining}d left
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2 sm:px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Lock size={11} /> Unlocks on {birthdayInfo.dateFormatted}
                      </span>
                    )
                  ) : (
                    <Link
                      to="/customer/profile"
                      className="text-[10px] uppercase tracking-wider font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full hover:bg-rose-500/20 transition-colors"
                    >
                      Set Birthday in Profile &rarr;
                    </Link>
                  )}
                </div>

                <h3 className="text-base sm:text-lg lg:text-xl font-serif text-white font-medium">
                  {bdaySettings.discountPercent}% Off Your Birthday Order
                </h3>
                
                <p className="text-xs text-white/60 mt-1 max-w-xl leading-relaxed">
                  {birthdayInfo.isActiveCelebration
                    ? (bdaySettings.customMessage || "Happy Birthday! Your exclusive celebration discount is active. Apply the code below at checkout.")
                    : `This exclusive privilege is strictly reserved for your birthday celebration (${birthdayInfo.hasDob ? birthdayInfo.dateFormatted : 'Annual Birthday'}). The code activates on your birthday and is valid for 30 days.`}
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] sm:text-[11px] text-[#c9a35b]/80 font-medium">
                  <Info size={12} className="shrink-0" />
                  <span>Strictly 1 use per customer per calendar year on birthday celebration.</span>
                </div>
              </div>
            </div>

            {/* Promo Code Box */}
            <div className={`flex items-center justify-between sm:justify-start gap-3 border p-2.5 pl-3.5 sm:pl-4 rounded-xl sm:rounded-2xl shrink-0 transition-all w-full sm:w-auto ${
              birthdayInfo.isActiveCelebration
                ? 'bg-black/80 border-[#c9a35b]/50 shadow-[0_0_20px_rgba(201,163,91,0.15)]'
                : 'bg-black/50 border-white/10 opacity-90'
            }`}>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] uppercase tracking-widest text-white/40 font-semibold">Birthday Code</span>
                  {!birthdayInfo.isActiveCelebration && (
                    <span className="text-[9px] text-amber-400/90 font-mono flex items-center gap-0.5">
                      <Lock size={9} /> Birthday Only
                    </span>
                  )}
                </div>
                <span className="text-sm font-mono font-bold text-[#f5d77f] tracking-wider">
                  {bdaySettings.promoCode || 'BDAY-LUXURY15'}
                </span>
              </div>
              <button
                onClick={() => copyBirthdayCode(bdaySettings.promoCode || 'BDAY-LUXURY15')}
                className={`p-2 sm:p-2.5 rounded-xl transition-all cursor-pointer ${
                  birthdayInfo.isActiveCelebration
                    ? 'bg-[#c9a35b]/20 hover:bg-[#c9a35b]/30 text-[#f5d77f]'
                    : 'bg-white/5 hover:bg-white/10 text-white/70'
                }`}
                title={birthdayInfo.isActiveCelebration ? "Copy Birthday Code" : `Activates on your birthday (${birthdayInfo.dateFormatted || 'Birthday'})`}
              >
                {copiedCode ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Category Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-none w-full">
        <span className="text-[10px] sm:text-xs uppercase tracking-wider text-white/40 font-semibold flex items-center gap-1 mr-1 shrink-0">
          <Filter size={12} /> Filter:
        </span>
        {[
          { id: 'all', label: 'All Activities', icon: CalendarIcon },
          { id: 'orders', label: 'Deliveries & Orders', icon: Truck },
          { id: 'events', label: 'Event Tickets', icon: Ticket },
          { id: 'auctions', label: 'Auction Activity', icon: Gavel },
          { id: 'birthday', label: 'Birthday & Milestones', icon: Cake },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveCategory(tab.id);
                setSelectedDate(null);
              }}
              className={`py-1.5 sm:py-2 px-2.5 sm:px-4 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer border ${
                isActive 
                  ? 'bg-[#c9a35b] text-black border-[#c9a35b] shadow-[0_0_15px_rgba(201,163,91,0.25)]' 
                  : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/10'
              }`}
            >
              <Icon size={13} className="shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Responsive Layout: Month Grid + Day Detail Drawer (stacks gracefully below xl) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8">
        
        {/* Left / Center: Month Calendar Grid (xl:col-span-8) */}
        <div className="xl:col-span-8 bg-[#0e0d0b] border border-white/10 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 lg:p-7 shadow-2xl space-y-4 sm:space-y-6">
          
          {/* Calendar Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <h2 className="text-lg sm:text-xl md:text-2xl font-serif text-white font-medium">
                {MONTH_NAMES[currentMonth]} <span className="text-[var(--color-gold)] font-sans font-bold">{currentYear}</span>
              </h2>
              {isBirthMonth && (
                <span className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold text-rose-400 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Cake size={11} /> Birthday Month
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={goToToday}
                className="py-1 sm:py-1.5 px-2.5 sm:px-3 bg-white/5 hover:bg-white/10 text-white text-[11px] sm:text-xs font-semibold rounded-lg border border-white/10 transition-colors cursor-pointer"
              >
                Today
              </button>
              <div className="flex items-center gap-0.5 bg-white/5 border border-white/10 rounded-lg p-0.5">
                <button
                  onClick={prevMonth}
                  className="p-1 sm:p-1.5 text-white/60 hover:text-white rounded transition-colors cursor-pointer"
                  title="Previous Month"
                >
                  <ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1 sm:p-1.5 text-white/60 hover:text-white rounded transition-colors cursor-pointer"
                  title="Next Month"
                >
                  <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs uppercase tracking-widest text-white/40 font-bold border-b border-white/10 pb-2 sm:pb-3">
            {DAYS_OF_WEEK.map((day, dIdx) => (
              <div key={dIdx}>
                <span className="sm:hidden">{day.short}</span>
                <span className="hidden sm:inline">{day.full}</span>
              </div>
            ))}
          </div>

          {/* Calendar Day Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-2.5">
            {calendarDays.map((cell, idx) => {
              const hasActivity = cell.activities.length > 0;
              const isSelected = selectedDate === cell.dateKey;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDate(cell.dateKey)}
                  className={`min-h-[50px] sm:min-h-[68px] md:min-h-[82px] p-1 sm:p-2 rounded-xl sm:rounded-2xl border transition-all flex flex-col justify-between cursor-pointer relative overflow-hidden ${
                    !cell.isCurrentMonth
                      ? 'bg-black/20 border-white/[0.02] text-white/20'
                      : isSelected
                      ? 'bg-[var(--color-gold)]/15 border-[var(--color-gold)] text-white shadow-[0_0_20px_rgba(201,163,91,0.2)]'
                      : cell.isToday
                      ? 'bg-white/10 border-white/30 text-white'
                      : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5 text-white/80'
                  }`}
                >
                  {/* Top: Day Number & Today indicator */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] sm:text-xs md:text-sm font-semibold ${
                      cell.isToday ? 'w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[var(--color-gold)] text-black flex items-center justify-center font-bold text-[10px] sm:text-xs' : ''
                    }`}>
                      {cell.dayNumber}
                    </span>
                    {cell.activities.some(a => a.category === 'birthday') && (
                      <Cake size={12} className="text-rose-400 animate-bounce sm:w-3.5 sm:h-3.5" />
                    )}
                  </div>

                  {/* Bottom: Activity pills / dots */}
                  {hasActivity && (
                    <div className="flex flex-col gap-0.5 sm:gap-1 mt-1">
                      <div className="flex items-center gap-1 flex-wrap">
                        {cell.activities.slice(0, 3).map((act, aIdx) => {
                          const col = getActivityColor(act.type, act.category);
                          return (
                            <span 
                              key={aIdx} 
                              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${col.dot}`} 
                              title={act.title}
                            />
                          );
                        })}
                        {cell.activities.length > 3 && (
                          <span className="text-[8px] sm:text-[9px] text-white/50 font-mono">+{cell.activities.length - 3}</span>
                        )}
                      </div>
                      
                      {/* Short text snippet on desktop */}
                      <span className="hidden lg:block text-[10px] text-white/70 truncate font-medium max-w-full">
                        {cell.activities[0].title.split(':')[0]}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-4 pt-3 border-t border-white/5 text-[10px] sm:text-xs text-white/50">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" /> Deliveries & Transit
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" /> Orders Placed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" /> Event Tickets
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--color-gold)] shrink-0" /> Auctions, VIP Deposits & Approvals
            </span>
            <span className="flex items-center gap-1.5 col-span-2 sm:col-span-1">
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" /> Birthday Milestone
            </span>
          </div>

        </div>

        {/* Right: Selected Day Activities Detail Drawer (xl:col-span-4) */}
        <div className="xl:col-span-4 bg-[#0e0d0b] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 shadow-2xl flex flex-col justify-between space-y-4 sm:space-y-6">
          
          <div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3.5 sm:pb-4 mb-4 sm:mb-5">
              <div>
                <h3 className="text-sm sm:text-base font-serif text-white font-medium flex items-center gap-2">
                  <Clock size={16} className="text-[var(--color-gold)] shrink-0" />
                  {selectedDate ? `Activities for ${selectedDate}` : 'Upcoming Activity Timeline'}
                </h3>
                <p className="text-[11px] sm:text-xs text-white/40 mt-0.5">
                  {selectedDate ? `${activeDayActivities.length} event(s) scheduled` : 'Recent & upcoming activities'}
                </p>
              </div>
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate(null)}
                  className="text-xs text-[var(--color-gold)] hover:underline cursor-pointer shrink-0 ml-2"
                >
                  View All
                </button>
              )}
            </div>

            {/* List of activities */}
            {activeDayActivities.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-white/30 border border-dashed border-white/10 rounded-2xl space-y-2">
                <CalendarIcon size={24} className="mx-auto opacity-40 text-[var(--color-gold)] sm:w-7 sm:h-7" />
                <p className="text-xs">No scheduled activities on this date.</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4 max-h-[420px] sm:max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                {activeDayActivities.map((act) => {
                  const colors = getActivityColor(act.type, act.category);
                  const actDate = new Date(act.date);

                  return (
                    <div 
                      key={act.id} 
                      className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 transition-all space-y-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg sm:rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                          {getActivityIcon(act.category, act.type)}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                            <span className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border inline-flex items-center leading-tight ${colors.badge}`}>
                              {act.badge}
                            </span>
                            <span className="text-[10px] text-white/40 font-medium shrink-0">
                              {actDate.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-semibold text-white leading-snug break-words">
                            {act.title}
                          </h4>
                          {act.subtitle && (
                            <p className="text-[11px] sm:text-xs text-white/50 leading-relaxed break-words">
                              {act.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Extra details (deposit info, bidding limit, proof) */}
                      {(act.details?.paymentReference || act.details?.biddingLimit || act.details?.proofOfPayment) && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-white/60">
                          {act.details?.paymentReference && (
                            <span className="font-mono bg-white/5 px-2 py-0.5 rounded border border-white/10 text-white/70">
                              Ref: {act.details.paymentReference}
                            </span>
                          )}
                          {act.details?.biddingLimit && (
                            <span className="font-sans bg-[var(--color-gold)]/10 text-[var(--color-gold)] px-2 py-0.5 rounded border border-[var(--color-gold)]/20 font-medium">
                              Limit: R{act.details.biddingLimit.toLocaleString()}
                            </span>
                          )}
                          {act.details?.proofOfPayment && (
                            <a
                              href={act.details.proofOfPayment}
                              target="_blank"
                              rel="noreferrer"
                              className="text-white/70 hover:text-[var(--color-gold)] underline flex items-center gap-1"
                            >
                              <ExternalLink size={10} /> View Bank Statement
                            </a>
                          )}
                        </div>
                      )}

                      {/* Calendar Sync & Details Link */}
                      <div className="flex items-center justify-between text-[11px] sm:text-xs text-white/40 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-white/40 font-medium">Sync:</span>
                          <button
                            onClick={() => {
                              const url = createGoogleCalendarUrl({
                                title: act.title,
                                description: `${act.subtitle}\nStatus: ${act.badge}`,
                                location: 'Grand Store Luxury Vault',
                                startTime: act.date
                              });
                              window.open(url, '_blank');
                            }}
                            className="text-[10px] text-white/50 hover:text-[var(--color-gold)] transition-colors px-1.5 py-0.5 rounded bg-white/5 border border-white/5 hover:border-[var(--color-gold)]/30"
                            title="Add to Google Calendar"
                          >
                            Google
                          </button>
                          <button
                            onClick={() => {
                              downloadIcsFile({
                                filename: `${(act.id || 'activity')}.ics`,
                                title: act.title,
                                description: `${act.subtitle}\nStatus: ${act.badge}`,
                                location: 'Grand Store Luxury Vault',
                                startTime: act.date
                              });
                            }}
                            className="text-[10px] text-white/50 hover:text-[var(--color-gold)] transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/5 border border-white/5 hover:border-[var(--color-gold)]/30"
                            title="Download .ICS Calendar file"
                          >
                            <Download size={9} /> .ics
                          </button>
                        </div>

                        {act.details?.link && (
                          <Link 
                            to={act.details.link} 
                            className="text-[var(--color-gold)] hover:underline flex items-center gap-1 font-medium text-xs ml-2 shrink-0"
                          >
                            Details <ArrowRight size={11} />
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Support / Delivery Tracker Help */}
          <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/[0.02] border border-white/5 text-[11px] sm:text-xs text-white/60 flex items-start gap-2.5 sm:gap-3">
            <Info size={15} className="text-[var(--color-gold)] shrink-0 mt-0.5" />
            <span>
              All couriers are tracked in real-time. Delivery estimates update automatically as packages are collected from partner cellars.
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
