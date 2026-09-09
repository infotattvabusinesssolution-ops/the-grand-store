import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, PlusCircle, CalendarDays, MapPin, Clock, Users, QrCode, CheckCircle2, AlertCircle, Camera, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function VendorEvents() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Verification states
  const [ticketInput, setTicketInput] = useState('');
  const [activeVerifyEvent, setActiveVerifyEvent] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState(null); // { success: bool, message: string }
  const [verifying, setVerifying] = useState(false);
  const [activeScannerEvent, setActiveScannerEvent] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/events/vendor`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setEvents(res.data);
      } catch (error) {
        console.error('Failed to load vendor events', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchEvents();
  }, [user]);

  const parseTicketCode = (raw) => {
    if (!raw) return '';
    let str = String(raw).trim();
    if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
      str = str.slice(1, -1).trim();
    }
    if ((str.startsWith('{') && str.endsWith('}')) || (str.startsWith('[') && str.endsWith(']'))) {
      try {
        const parsed = JSON.parse(str);
        if (parsed && typeof parsed === 'object') {
          return parsed.ticketId || parsed.ticket_id || parsed.id || parsed._id || parsed.gsReference || str;
        }
      } catch (_) {}
    }
    if (str.startsWith('http://') || str.startsWith('https://')) {
      try {
        const url = new URL(str);
        return url.searchParams.get('ticketId') || url.searchParams.get('ticket') || url.searchParams.get('id') || str.split('/').pop() || str;
      } catch (_) {}
    }
    return str;
  };

  const handleVerify = async (eventId, code) => {
    const cleanCode = parseTicketCode(code);
    if (!cleanCode) return;
    setVerifying(true);
    setActiveVerifyEvent(eventId);
    setVerifyStatus(null);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/events/vendor/verify-ticket`, 
        { ticketId: cleanCode },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      setVerifyStatus({
        success: true,
        message: 'Valid & Checked In'
      });
      setTicketInput('');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        if (activeVerifyEvent === eventId) setVerifyStatus(null);
      }, 3000);
      
    } catch (error) {
      setVerifyStatus({
        success: false,
        message: error.response?.data?.message || 'Invalid Ticket'
      });
      // Clear error message after 3 seconds
      setTimeout(() => {
        if (activeVerifyEvent === eventId) setVerifyStatus(null);
      }, 3000);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-[var(--color-ivory)] font-serif text-4xl mb-2 flex items-center gap-4">
            <div className="p-3 bg-[var(--color-gold)]/10 text-[var(--color-gold)] rounded-xl border border-[var(--color-gold)]/20 ">
              <CalendarDays size={28} />
            </div>
            My <span className="text-[#e1bd70] ml-2" >Events</span>
          </h1>
          <p className="text-[var(--color-ivory-muted)] text-sm max-w-2xl font-light">
            Manage your tastings, masterclasses, and virtual experiences. 
          </p>
        </div>
        
        <button 
          onClick={() => navigate(user.role === 'event_host' ? '/event-manager/event-add' : '/vendor/event-add')}
          className="bg-[#c9a35b] text-black font-bold uppercase tracking-widest text-xs px-6 py-3 rounded-full flex items-center gap-2 hover:scale-105 transition-transform"
        >
          <PlusCircle size={16} /> Create New Event
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 text-[var(--color-gold)]">Loading...</div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-2xl">
          <CalendarDays size={48} className="mx-auto text-white/20 mb-4" />
          <h3 className="text-xl font-serif text-white mb-2">No events scheduled</h3>
          <p className="text-[var(--color-ivory-muted)] mb-6">Host your first tasting or masterclass today.</p>
          <button 
            onClick={() => navigate(user.role === 'event_host' ? '/event-manager/event-add' : '/vendor/event-add')}
            className="border border-[var(--color-gold)] text-[var(--color-gold)] px-6 py-2 rounded-full uppercase tracking-widest text-xs font-bold hover:bg-[var(--color-gold)] hover:text-black transition-colors"
          >
            Create Event
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {events.map(event => (
            <div 
              key={event._id} 
              className="bg-white/[0.03] backdrop-blur-2xl rounded-3xl border border-white/[0.05] shadow-[0_15px_40px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col lg:flex-row relative group hover:border-[var(--color-gold)]/30 transition-all"
            >
              {/* Event Image */}
              <div className="lg:w-1/3 xl:w-1/4 h-56 lg:h-auto relative shrink-0">
                {event.image ? (
                  <img src={`${import.meta.env.VITE_API_URL}${event.image}`} alt={event.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#1a1814] flex items-center justify-center">
                    <Calendar size={32} className="text-white/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60"></div>
                
                {/* Status Badge Over Image */}
                <div className="absolute top-4 left-4 z-20">
                  {new Date(event.date).setHours(23, 59, 59, 999) < new Date().getTime() ? (
                    <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full bg-gray-500/80 text-white">
                      Ended
                    </span>
                  ) : (
                    <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full ${
                      event.approvalStatus === 'approved' ? 'bg-green-500/80 text-white ' :
                      event.approvalStatus === 'pending_approval' ? 'bg-yellow-500/80 text-white ' :
                      'bg-red-500/80 text-white '
                    }`}>
                      {event.approvalStatus ? event.approvalStatus.replace('_', ' ') : 'Pending'}
                    </span>
                  )}
                </div>
                
                {/* Event Format Label */}
                <div className="absolute bottom-4 left-4 z-20">
                   <span className="bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold text-[var(--color-gold)] border border-[var(--color-gold)]/20">
                    {event.type}
                  </span>
                </div>
              </div>

              {/* Event Details (Middle Stub) */}
              <div className="p-6 md:p-8 flex-1 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-dashed border-white/20">
                <div>
                  <h3 className="text-2xl font-serif text-white mb-6 line-clamp-2 pr-4 group-hover:text-[#e1bd70] transition-colors cursor-pointer" onClick={() => navigate(`/events/${event._id}`)}>
                    {event.title}
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                    <div className="flex items-start gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                      <Calendar size={16} className="text-[var(--color-gold)] mt-0.5" />
                      <div>
                        <p className="text-[9px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">Date</p>
                        <span className="text-sm font-medium text-[var(--color-ivory)]">{new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                      <Clock size={16} className="text-[var(--color-gold)] mt-0.5" />
                      <div>
                        <p className="text-[9px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">Time</p>
                        <span className="text-sm font-medium text-[var(--color-ivory)]">{event.startTime}</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 sm:col-span-2 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                      <MapPin size={16} className="text-[var(--color-gold)] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[9px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">Location</p>
                        <span className="text-sm font-medium text-[var(--color-ivory)] line-clamp-1">{event.format === 'Virtual' ? 'Virtual Event' : event.location}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-8">
                  <button 
                    onClick={() => navigate(user.role === 'event_host' ? `/event-manager/events/${event._id}/attendees` : `/vendor/events/${event._id}/attendees`)}
                    className="w-full sm:w-auto relative group overflow-hidden bg-[var(--color-gold)]/10 px-6 py-3 rounded-2xl border border-[var(--color-gold)]/20 hover:border-[var(--color-gold)]/50 transition-all flex items-center justify-center gap-3  "
                  >
                    <div className="absolute inset-0 w-0 bg-[var(--color-gold)]/20 transition-all duration-300 ease-out group-hover:w-full"></div>
                    <Users size={16} className="text-[var(--color-gold)] relative z-10" /> 
                    <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-ivory)] relative z-10">Guest List</span>
                  </button>
                  <button 
                    onClick={() => navigate(`/events/${event._id}`)}
                    className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-white/10 hover:bg-white/5 hover:border-white/30 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] hover:text-white"
                  >
                    View Page <ExternalLink size={14} className="opacity-70" />
                  </button>
                </div>
              </div>

              {/* Scanner Right Stub */}
              <div className="p-6 md:p-8 lg:w-72 bg-[var(--color-gold)]/[0.02] flex flex-col shrink-0 relative overflow-hidden">
                 {/* Decorative circle cutouts for the perforated edge */}
                 <div className="hidden lg:block w-8 h-8 rounded-full bg-[#050505] absolute -left-4 -top-4 border-b border-r border-white/[0.05]"></div>
                 <div className="hidden lg:block w-8 h-8 rounded-full bg-[#050505] absolute -left-4 -bottom-4 border-t border-r border-white/[0.05]"></div>
                 
                 <div className="flex items-center justify-between mb-4">
                   <h4 className="text-sm font-serif text-[var(--color-ivory)] flex items-center gap-2">
                     <QrCode size={16} className="text-[var(--color-gold)]" /> Quick Verify
                   </h4>
                   <button 
                     onClick={() => setActiveScannerEvent(activeScannerEvent === event._id ? null : event._id)}
                     className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded transition-colors ${activeScannerEvent === event._id ? 'bg-white/10 text-white' : 'bg-[var(--color-gold)]/20 text-[var(--color-gold)] hover:bg-[var(--color-gold)]/30'}`}
                   >
                     <Camera size={12} /> {activeScannerEvent === event._id ? 'Close' : 'Scan QR'}
                   </button>
                 </div>
                 
                 <div className="flex-1 flex flex-col justify-center">
                   {activeScannerEvent === event._id && (
                     <div className="mb-4 rounded-xl overflow-hidden border border-[var(--color-gold)]/30  bg-black/50">
                       <Scanner 
                         onScan={(result) => {
                           if (result && result.length > 0) {
                             const rawCode = result[0].rawValue;
                             const cleanCode = parseTicketCode(rawCode);
                             setActiveVerifyEvent(event._id);
                             setTicketInput(cleanCode);
                             handleVerify(event._id, cleanCode);
                             setActiveScannerEvent(null); // Close scanner on successful read
                           }
                         }}
                         onError={(error) => console.log(error)}
                         components={{ finder: false, torch: true, tracker: true }}
                         styles={{ container: { width: '100%', paddingBottom: '100%' } }}
                       />
                     </div>
                   )}
                   
                   <div className="mb-4">
                     <label className="block text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Manual Entry</label>
                     <div className="flex gap-2">
                       <input 
                         type="text" 
                         placeholder="Ticket ID"
                         className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-[var(--color-gold)]/50 transition-colors"
                         value={activeVerifyEvent === event._id ? ticketInput : ''}
                         onChange={(e) => {
                           setActiveVerifyEvent(event._id);
                           setTicketInput(e.target.value);
                         }}
                         onKeyDown={(e) => {
                           if (e.key === 'Enter') handleVerify(event._id, ticketInput);
                         }}
                       />
                       <button 
                         onClick={() => handleVerify(event._id, ticketInput)}
                         disabled={verifying && activeVerifyEvent === event._id}
                         className="bg-[#c9a35b] text-black font-bold uppercase tracking-widest text-[10px] rounded-lg px-3 hover:brightness-110 transition-all disabled:opacity-50 "
                       >
                         {verifying && activeVerifyEvent === event._id ? '...' : 'Verify'}
                       </button>
                     </div>
                   </div>

                   {/* Verification Feedback */}
                   {activeVerifyEvent === event._id && verifyStatus && (
                     <div className={`p-3 rounded-lg flex items-start gap-2 text-xs border ${verifyStatus.success ? 'bg-green-500/10 border-green-500/20 text-green-400 ' : 'bg-red-500/10 border-red-500/20 text-red-400 '}`}>
                       {verifyStatus.success ? <CheckCircle2 size={14} className="shrink-0 mt-0.5" /> : <AlertCircle size={14} className="shrink-0 mt-0.5" />}
                       <span className="font-medium">{verifyStatus.message}</span>
                     </div>
                   )}
                   
                   {!verifyStatus && !activeScannerEvent && (
                     <p className="text-[9px] text-white/30 italic text-center mt-2">
                       Verify attendee by scanning QR code or entering ID.
                     </p>
                   )}
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
