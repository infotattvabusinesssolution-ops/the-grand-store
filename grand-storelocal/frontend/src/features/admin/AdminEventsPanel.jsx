import React, { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, CheckCircle2, Clock, MapPin, Users, XCircle } from 'lucide-react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { resolveEventImage } from '../events/eventPhase';

const dateInputValue = (value) => String(value || '').slice(0, 10);

export default function AdminEventsPanel({ onNotify }) {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [forms, setForms] = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [workingId, setWorkingId] = useState('');

  const notify = (message, type) => onNotify?.(message, type);

  const loadEvents = async () => {
    try {
      const response = await api.get('/events/admin');
      setEvents(response.data);
      setForms(Object.fromEntries(response.data.map((event) => [event._id, {
        date: dateInputValue(event.date),
        startTime: event.startTime || '',
        endTime: event.endTime || '',
        capacity: event.capacity || '',
        approvalNote: event.approvalNote || '',
      }])));
    } catch (error) {
      notify(error.response?.data?.message || 'Unable to load events.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const pendingEvents = useMemo(
    () => events.filter((event) => event.approvalStatus === 'pending_approval'),
    [events],
  );
  const visibleEvents = tab === 'pending' ? pendingEvents : events.filter((event) => event.approvalStatus !== 'pending_approval');

  const updateForm = (id, field, value) => {
    setForms((current) => ({ ...current, [id]: { ...current[id], [field]: value } }));
  };

  const approve = async (event) => {
    const form = forms[event._id];
    if (!form?.date || !form.startTime || !form.endTime || form.endTime <= form.startTime) {
      notify('Enter a valid date and an end time later than the start time.', 'error');
      return;
    }
    setWorkingId(event._id);
    try {
      const response = await api.put(`/events/admin/${event._id}/approve`, form);
      notify(response.data.message || 'Event approved.');
      await loadEvents();
    } catch (error) {
      notify(error.response?.data?.message || 'Unable to approve event.', 'error');
    } finally {
      setWorkingId('');
    }
  };

  const reject = async (event) => {
    const reason = String(forms[event._id]?.approvalNote || '').trim();
    if (!reason) {
      notify('Add a rejection reason in the admin note field first.', 'error');
      return;
    }
    setWorkingId(event._id);
    try {
      const response = await api.put(`/events/admin/${event._id}/reject`, { reason });
      notify(response.data.message || 'Event rejected.');
      await loadEvents();
    } catch (error) {
      notify(error.response?.data?.message || 'Unable to reject event.', 'error');
    } finally {
      setWorkingId('');
    }
  };

  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    return <div className="py-20 text-center text-white">Admin access required.</div>;
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
      <section>
        <h1 className="font-serif text-4xl text-[var(--color-ivory)] md:text-5xl">Event Management</h1>
        <p className="mt-3 max-w-2xl text-[var(--color-ivory-muted)]">Review event details, correct the final schedule, and publish only complete experiences.</p>
        <div className="mt-7 flex gap-3 border-b border-white/10 pb-4">
          <button onClick={() => setTab('pending')} className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest ${tab === 'pending' ? 'bg-[#c9a35b] text-black' : 'bg-white/5 text-white/60'}`}>Pending ({pendingEvents.length})</button>
          <button onClick={() => setTab('history')} className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest ${tab === 'history' ? 'bg-[#c9a35b] text-black' : 'bg-white/5 text-white/60'}`}>History</button>
        </div>
      </section>

      {loading ? (
        <div className="py-20 text-center text-[#c9a35b]">Loading events…</div>
      ) : visibleEvents.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-20 text-center">
          <CheckCircle2 className="mx-auto mb-4 text-[#c9a35b]" size={38} />
          <p className="text-white/60">No events in this section.</p>
        </div>
      ) : (
        <div className="space-y-7">
          {visibleEvents.map((event) => {
            const form = forms[event._id] || {};
            const totalTickets = event.ticketTiers?.reduce((sum, tier) => sum + Number(tier.quantity || 0), 0) || 0;
            return (
              <article key={event._id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] lg:grid lg:grid-cols-[260px_1fr_360px]">
                <div className="h-56 bg-black/40 lg:h-full">
                  {event.image ? <img src={resolveEventImage(event.image)} alt={event.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><CalendarCheck className="text-white/20" size={44} /></div>}
                </div>
                <div className="p-6 md:p-8">
                  <div className="mb-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest">
                    <span className="rounded bg-[#c9a35b]/15 px-2 py-1 text-[#d8b76d]">{event.type}</span>
                    <span className="rounded bg-white/5 px-2 py-1 text-white/60">{event.format}</span>
                    <span className="rounded bg-white/5 px-2 py-1 text-white/60">{event.approvalStatus.replace('_', ' ')}</span>
                  </div>
                  <h2 className="font-serif text-2xl text-white">{event.title}</h2>
                  <p className="mt-3 line-clamp-4 text-sm leading-6 text-white/55">{event.description}</p>
                  <div className="mt-6 grid gap-3 text-sm text-white/65 sm:grid-cols-2">
                    <span className="flex items-center gap-2"><MapPin size={15} className="text-[#c9a35b]" /> {event.location}{event.city ? `, ${event.city}` : ''}</span>
                    <span className="flex items-center gap-2"><Users size={15} className="text-[#c9a35b]" /> {totalTickets} tickets / {event.capacity} capacity</span>
                    <span className="flex items-center gap-2"><Clock size={15} className="text-[#c9a35b]" /> {event.startTime}–{event.endTime}</span>
                    <span>Host: {event.hostName || event.vendorId?.name || 'Not specified'}</span>
                  </div>
                </div>
                <div className="border-t border-white/10 bg-black/25 p-6 lg:border-l lg:border-t-0">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-white/45">Final date<input type="date" value={form.date || ''} onChange={(e) => updateForm(event._id, 'date', e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 p-3 text-white [color-scheme:dark]" /></label>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/45">Start<input type="time" value={form.startTime || ''} onChange={(e) => updateForm(event._id, 'startTime', e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 p-3 text-white [color-scheme:dark]" /></label>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/45">End<input type="time" min={form.startTime || undefined} value={form.endTime || ''} onChange={(e) => updateForm(event._id, 'endTime', e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 p-3 text-white [color-scheme:dark]" /></label>
                    <label className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-white/45">Capacity<input type="number" min="1" value={form.capacity || ''} onChange={(e) => updateForm(event._id, 'capacity', e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/50 p-3 text-white" /></label>
                    <label className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-white/45">Admin note<textarea rows="3" value={form.approvalNote || ''} onChange={(e) => updateForm(event._id, 'approvalNote', e.target.value)} placeholder="Optional approval note; required for rejection" className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-black/50 p-3 text-white" /></label>
                  </div>
                  {event.approvalStatus === 'pending_approval' && (
                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <button disabled={workingId === event._id} onClick={() => reject(event)} className="flex items-center justify-center gap-2 rounded-lg border border-red-500/30 px-3 py-3 text-xs font-bold uppercase tracking-wider text-red-300 disabled:opacity-50"><XCircle size={15} /> Reject</button>
                      <button disabled={workingId === event._id} onClick={() => approve(event)} className="flex items-center justify-center gap-2 rounded-lg bg-[#c9a35b] px-3 py-3 text-xs font-bold uppercase tracking-wider text-black disabled:opacity-50"><CheckCircle2 size={15} /> Approve</button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
