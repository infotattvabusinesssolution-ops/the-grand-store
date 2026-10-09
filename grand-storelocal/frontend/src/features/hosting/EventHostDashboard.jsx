import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, DollarSign, Activity, AlertCircle, ShoppingBag, Lightbulb, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import { formatCartPrice } from '../../data';
import Price from '../../components/ui/Price';

export default function EventHostDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch Events
        try {
          const eventsRes = await api.get(`/events/vendor`);
          setEvents(eventsRes.data);
        } catch (e) { console.error('Events fetch failed', e); }

        // Fetch Wallet
        try {
          const walletRes = await api.get(`/vendor/wallet`);
          setWallet(walletRes.data.wallet);
        } catch (e) { console.error('Wallet fetch failed', e); }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const goldTextClass = "text-[#c9a35b] drop-shadow-[0_0_12px_rgba(201,163,91,0.6)]";
  const netPayout = wallet ? (wallet.availableBalance + wallet.pendingBalance) : 0;
  const totalEvents = events.length;
  // This is a naive calculation for attendees, assuming events model has attendees array or count
  const totalAttendees = events.reduce((sum, ev) => sum + (ev.attendees?.length || 0), 0);

  return (
    <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto pb-10">
      
      {/* Welcome Section */}
      <section className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1">
          <h1 className="text-[var(--color-ivory)] font-serif text-5xl mb-4 leading-tight">
            Welcome back, <br/>
            <span className={goldTextClass}>{user?.name?.split(' ')[0] || 'Partner'}</span>
          </h1>
          <p className="text-[var(--color-ivory-muted)] text-lg max-w-2xl font-light leading-relaxed">
            Here is your daily event summary. You are hosting {totalEvents} events on The Grand Store platform.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={() => navigate('/event-manager/event-add')}
              className="flex items-center gap-2 px-6 py-3 bg-[#c9a35b] hover:bg-[#e6c97a] text-black font-semibold rounded-lg transition-colors shadow-[0_0_15px_rgba(201,163,91,0.2)]"
            >
              <Calendar size={20} /> Create Event
            </button>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: "Net Payout", value: <Price amount={netPayout} />, icon: DollarSign },
          { title: "Total Events", value: totalEvents, icon: Calendar },
          { title: "Total Attendees", value: totalAttendees, icon: Users },
        ].map((kpi, idx) => (
          <div key={idx} className="p-6 border-b border-white/10 group transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="text-[var(--color-ivory-muted)] text-[10px] uppercase tracking-widest font-semibold">{kpi.title}</div>
              <div className="p-2 rounded-lg bg-black/40 text-[#c9a35b] border border-white/[0.05]">
                <kpi.icon size={16} />
              </div>
            </div>
            <div className="text-3xl font-serif text-[var(--color-ivory)] mb-2 group-hover:text-[#c9a35b] transition-colors">{loading ? '...' : kpi.value}</div>
          </div>
        ))}
      </section>

      {/* Recent Events List */}
      <section className="mt-2 border-t border-white/10 pt-8">
        <h3 className="text-2xl font-serif text-[var(--color-ivory)] mb-6 flex items-center gap-3">
          <div className="p-2 bg-[var(--color-gold)]/10 text-[#c9a35b] rounded-lg">
            <Calendar size={20} />
          </div>
          Your Events
        </h3>
        
        {events.length === 0 ? (
          <div className="text-center py-12 border border-white/5 rounded-2xl bg-white/[0.01]">
            <p className="text-[var(--color-ivory-muted)]">No events created yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white/[0.01] border border-white/5 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] bg-black/20">
                  <th className="py-4 font-semibold pl-6">Event</th>
                  <th className="py-4 font-semibold">Date</th>
                  <th className="py-4 font-semibold">Attendees</th>
                  <th className="py-4 font-semibold text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 5).map((ev) => (
                  <tr key={ev._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 pl-6">
                      <div className="font-serif text-[var(--color-ivory)]">{ev.title}</div>
                    </td>
                    <td className="py-4">
                      <div className="text-sm text-[var(--color-ivory-muted)]">{new Date(ev.date).toLocaleDateString()}</div>
                    </td>
                    <td className="py-4 text-sm text-[var(--color-ivory)]">
                      {ev.attendees?.length || 0} / {ev.capacity}
                    </td>
                    <td className="py-4 text-right pr-6">
                      <button onClick={() => navigate(`/event-manager/events/${ev._id}/attendees`)} className="text-[10px] uppercase tracking-widest text-[#c9a35b] hover:text-white font-bold transition-colors">
                        View Attendees &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
