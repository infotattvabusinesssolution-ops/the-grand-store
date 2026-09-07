import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Calendar, MapPin, Clock, Ticket, LogOut, User, Package, Heart, 
  Building2, Gavel, CheckCircle, Download, Loader2, Share2, Mail, 
  Copy, Check, X, MessageSquare 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Price from '../../components/ui/Price';
import { resolveEventImage } from '../events/eventPhase';

export default function MyTickets() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [shareTicket, setShareTicket] = useState(null);
  const [resendingId, setResendingId] = useState(null);
  const [resendSuccess, setResendSuccess] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  const handleDownloadTicketPdf = async (ticket) => {
    setDownloadingId(ticket._id);
    try {
      const response = await api.get(`/events/bookings/${ticket._id}/ticket-pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `TheGrandStore-VIP-Pass-${ticket.ticketId || ticket._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download ticket PDF:', err);
      alert('Could not download the ticket PDF pass. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleResendTicketEmail = async (ticket) => {
    setResendingId(ticket._id);
    try {
      await api.post(`/events/bookings/${ticket._id}/resend-ticket`);
      setResendSuccess(ticket._id);
      setTimeout(() => setResendSuccess(null), 4000);
    } catch (err) {
      console.error('Failed to resend ticket email:', err);
      alert('Could not resend ticket email pass. Please check your connection.');
    } finally {
      setResendingId(null);
    }
  };

  const handleDownloadQrPng = (ticket) => {
    const svgElement = document.getElementById(`ticket-qr-svg-${ticket._id}`);
    if (!svgElement) return;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `TheGrandStore-QR-${ticket.ticketId || ticket._id}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handleShareWhatsApp = (ticket) => {
    const text = encodeURIComponent(
      `🍷 *The Grand Store VIP Event Pass*\n\n` +
      `*Event:* ${ticket.event?.title || 'Grand Store Experience'}\n` +
      `*Ticket ID:* ${ticket.ticketId}\n` +
      `*Date:* ${ticket.event?.date ? new Date(ticket.event.date).toLocaleDateString() : 'Upcoming'}\n` +
      `*Location:* ${ticket.event?.location || 'Cape Town'}\n\n` +
      `Strictly 18+ • Present this pass at reception for cellar admission.`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleCopyPassDetails = (ticket) => {
    const details = `Grand Store VIP Pass - ${ticket.event?.title || 'Event'}\nTicket ID: ${ticket.ticketId}\nTier: ${ticket.ticketType || 'VIP'}\nDate: ${ticket.event?.date ? new Date(ticket.event.date).toLocaleDateString() : 'Upcoming'}`;
    navigator.clipboard.writeText(details);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchTickets = async () => {
      try {
        const res = await api.get(`/events/bookings/my-tickets`);
        setTickets(res.data);
      } catch (error) {
        console.error('Failed to load tickets', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [user, navigate]);

  if (!user || loading) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-gold-gradient">Loading your tickets...</div>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 md:gap-12">
      <section className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-6 mb-4">
        <div>
          <h1 className="text-[var(--color-ivory)] font-serif text-3xl md:text-5xl mb-4">My Tickets</h1>
          <p className="text-[var(--color-ivory-muted)] text-lg max-w-2xl font-light">
            Your upcoming and past event experiences.
          </p>
        </div>
        <button 
          onClick={() => navigate('/events')}
          className="whitespace-nowrap px-6 py-3 bg-[var(--color-gold)]/10 text-gold-gradient border border-[var(--color-gold)]/20 rounded-xl font-semibold uppercase tracking-widest text-xs hover:bg-[var(--color-gold)]/20 transition-all shadow-[0_0_15px_rgba(212,175,55,0.05)] hover:shadow-[0_0_20px_rgba(212,175,55,0.15)]"
        >
          Explore Events
        </button>
      </section>

      {tickets.length === 0 ? (
        <div className="text-center py-12 md:py-20 px-6 bg-white/[0.02] backdrop-blur-md md:backdrop-blur-2xl rounded-3xl border border-white/[0.05] shadow-lg md:shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col items-center mx-4 md:mx-0">
          <Ticket size={48} className="text-[var(--color-gold)]/50 mb-6" />
          <h3 className="text-2xl font-serif text-[var(--color-ivory)] mb-3">Your Event Calendar is Empty</h3>
          <p className="text-[var(--color-ivory-muted)] text-base md:text-lg font-light mb-8 max-w-md mx-auto">
            Discover exclusive tastings, masterclasses, and private dinners hosted by our master sommeliers and partner estates.
          </p>
          <button 
            onClick={() => navigate('/events')}
            className="px-6 py-4 md:px-8 bg-[var(--color-gold)] md:bg-gold-gradient text-black rounded-xl font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_15px_rgba(212,175,55,0.2)] md:shadow-[0_0_20px_rgba(212,175,55,0.3)] w-full sm:w-auto text-xs md:text-sm"
          >
            Explore Upcoming Events
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {tickets.map(ticket => (
            <motion.div 
              key={ticket._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-white/[0.03] to-transparent backdrop-blur-2xl rounded-3xl border border-white/[0.05] shadow-[0_15px_40px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col lg:flex-row relative group"
            >
              {/* Event Image */}
              <div className="lg:w-1/3 xl:w-1/4 h-48 lg:h-auto relative shrink-0">
                {ticket.event?.image ? (
                  <img src={resolveEventImage(ticket.event.image)} alt={ticket.event.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#1a1814]"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                
                {/* Status Badge Over Image */}
                <div className="absolute top-4 left-4 z-20">
                  <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full ${
                    !['Paid', 'Completed'].includes(ticket.paymentStatus) ? 'bg-yellow-500/80 text-black' :
                    ticket.ticketStatus === 'Valid' ? 'bg-green-500/80 text-white shadow-[0_0_10px_rgba(34,197,94,0.3)]' :
                    ticket.ticketStatus === 'Used' ? 'bg-[#c9a35b]/90 text-black shadow-[0_0_10px_rgba(201,163,91,0.5)] backdrop-blur-md' :
                    'bg-red-500/80 text-white shadow-[0_0_10px_rgba(239,68,68,0.3)]'
                  }`}>
                    {['Paid', 'Completed'].includes(ticket.paymentStatus)
                      ? (ticket.ticketStatus === 'Used' ? 'Verified' : ticket.ticketStatus)
                      : ticket.paymentMethod === 'Bank Transfer'
                        ? String(ticket.bankTransferStatus || ticket.paymentStatus).replaceAll('_', ' ')
                        : ticket.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Ticket Details (Middle Stub) */}
              <div className="p-6 md:p-8 flex-1 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-dashed border-white/20">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gold-gradient text-xs font-bold uppercase tracking-widest">
                      {ticket.ticketType} <span className="text-[var(--color-ivory-muted)] font-normal ml-2 tracking-normal">x{ticket.quantity}</span>
                    </p>
                  </div>
                  <h3 className="text-2xl font-serif text-[var(--color-ivory)] mb-6 line-clamp-2 pr-4">{ticket.event?.title || 'Event removed'}</h3>
                  
                  {ticket.event && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                      <div className="flex items-start gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                        <Calendar size={16} className="text-[#c9a35b] mt-0.5" />
                        <div>
                          <p className="text-[9px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">Date</p>
                          <span className="text-sm font-medium text-[var(--color-ivory)]">{new Date(ticket.event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                        <Clock size={16} className="text-[#c9a35b] mt-0.5" />
                        <div>
                          <p className="text-[9px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">Time</p>
                          <span className="text-sm font-medium text-[var(--color-ivory)]">{ticket.event.startTime}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 sm:col-span-2 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                        <MapPin size={16} className="text-[#c9a35b] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[9px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">Location</p>
                          <span className="text-sm font-medium text-[var(--color-ivory)] line-clamp-1">{ticket.event.location}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code / Boarding Pass Right Stub */}
              <div className="p-6 md:p-8 lg:w-56 bg-[var(--color-gold)]/[0.02] flex flex-col items-center justify-center shrink-0 relative overflow-hidden">
                 <div className="hidden lg:block w-8 h-8 rounded-full bg-[#050505] absolute -left-4 -top-4 border-b border-r border-white/[0.05]"></div>
                 <div className="hidden lg:block w-8 h-8 rounded-full bg-[#050505] absolute -left-4 -bottom-4 border-t border-r border-white/[0.05]"></div>
                 
                 {['Paid', 'Completed'].includes(ticket.paymentStatus) ? (
                   <>
                     {ticket.ticketStatus === 'Used' ? (
                       <div className="bg-[#111] border border-[#c9a35b]/30 p-4 rounded-xl mb-3 flex flex-col items-center justify-center h-[134px]">
                          <CheckCircle className="text-[#c9a35b] mb-2" size={32} />
                          <span className="text-[#c9a35b] font-bold tracking-widest uppercase text-xs">Verified</span>
                       </div>
                     ) : (
                       <>
                         <div className="bg-white p-3 rounded-xl mb-2 shadow-[0_0_30px_rgba(212,175,55,0.15)] relative group-hover:shadow-[0_0_40px_rgba(212,175,55,0.3)] transition-shadow">
                           <QRCodeSVG id={`ticket-qr-svg-${ticket._id}`} value={ticket.ticketId} size={110} />
                         </div>
                         <p className="text-[11px] font-mono text-white/50 tracking-[0.2em]">{ticket.ticketId}</p>
                       </>
                     )}
                     <button
                       type="button"
                       onClick={() => handleDownloadTicketPdf(ticket)}
                       disabled={downloadingId === ticket._id}
                       className="mt-3 flex items-center justify-center gap-1.5 w-full px-3 py-2 bg-[#c9a35b]/15 hover:bg-[#c9a35b]/25 border border-[#c9a35b]/40 rounded-xl text-[10px] font-bold uppercase tracking-wider text-[#c9a35b] transition-all disabled:opacity-50 shadow-[0_0_10px_rgba(201,163,91,0.1)]"
                       title="Download Official VIP Pass (PDF)"
                     >
                       {downloadingId === ticket._id ? (
                         <>
                           <Loader2 size={12} className="animate-spin" />
                           <span>Downloading...</span>
                         </>
                       ) : (
                         <>
                           <Download size={12} />
                           <span>Download PDF Pass</span>
                         </>
                       )}
                     </button>
                     <button
                       type="button"
                       onClick={() => setShareTicket(ticket)}
                       className="mt-2 flex items-center justify-center gap-1.5 w-full px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold uppercase tracking-wider text-[var(--color-ivory)] transition-all"
                       title="Share VIP Pass & QR"
                     >
                       <Share2 size={12} className="text-[#c9a35b]" />
                       <span>Share Pass</span>
                     </button>
                   </>
                 ) : (
                   <>
                     <div className="mb-4 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-center text-xs text-yellow-300">
                       QR ticket available after payment confirmation.
                     </div>
                     {ticket.paymentStatus === 'Pending' && (
                       <button
                         type="button"
                         onClick={() => navigate(`/customer/event-order/${ticket._id}?payment=${ticket.paymentMethod === 'Bank Transfer' ? 'bank-transfer' : 'pending'}`)}
                         className="mb-2 w-full rounded-lg border border-[#c9a35b]/30 bg-[#c9a35b]/10 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#c9a35b] transition-colors hover:bg-[#c9a35b]/20"
                       >
                         {ticket.paymentMethod === 'Bank Transfer' ? 'Manage Bank Payment' : 'Complete Payment'}
                       </button>
                     )}
                   </>
                 )}
                 
                 <div className="mt-6 pt-4 border-t border-white/10 w-full text-center flex items-center justify-between lg:block">
                   <p className="text-[9px] text-[var(--color-ivory-muted)] uppercase tracking-widest lg:mb-1">{['Paid', 'Completed'].includes(ticket.paymentStatus) ? 'Total Paid' : 'Order Total'}</p>
                   <p className="text-2xl font-serif text-gold-gradient"><Price amount={ticket.totalPrice} /></p>
                 </div>
                 
                 {ticket.event?.location && (
                   <a 
                     href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ticket.event.location)}`} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="mt-4 px-4 py-2 bg-white/5 border border-white/10 rounded hover:bg-white/10 hover:border-white/20 transition-all text-xs font-bold uppercase tracking-widest text-[#c9a35b] flex items-center gap-2"
                   >
                     <MapPin size={12} />
                     Open Map
                   </a>
                 )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ================= SHARE VIP PASS MODAL ================= */}
      {shareTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-[#101010] border border-[var(--color-gold)]/40 rounded-3xl w-full max-w-md p-6 shadow-[0_0_50px_rgba(212,175,55,0.2)] relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-[var(--color-gold)]/10 blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[var(--color-gold)]/15 text-[var(--color-gold)] border border-[var(--color-gold)]/30">
                  <Ticket size={20} />
                </div>
                <div>
                  <h3 className="text-base font-serif text-white font-medium">VIP Event Pass</h3>
                  <p className="text-xs text-[var(--color-ivory-muted)] font-mono">
                    {shareTicket.ticketId}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShareTicket(null)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-6 flex flex-col items-center text-center">
              <div className="bg-white p-4 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)] mb-4">
                <QRCodeSVG value={shareTicket.ticketId} size={150} />
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 mb-2">
                {shareTicket.ticketType || 'VIP Access'} • Verified
              </span>
              <h4 className="text-base font-serif text-white max-w-xs">{shareTicket.event?.title || 'Grand Store Experience'}</h4>
              <p className="text-xs text-[var(--color-ivory-muted)] mt-1 font-light">
                {shareTicket.event?.date ? new Date(shareTicket.event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Upcoming Date'} • {shareTicket.event?.location || 'Cape Town'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => handleDownloadTicketPdf(shareTicket)}
                disabled={downloadingId === shareTicket._id}
                className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:brightness-110 text-black font-bold rounded-xl text-xs uppercase tracking-wider transition-all disabled:opacity-50 shadow-md col-span-2 sm:col-span-1"
              >
                {downloadingId === shareTicket._id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                <span>PDF Pass</span>
              </button>

              <button
                type="button"
                onClick={() => handleDownloadQrPng(shareTicket)}
                className="flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-medium uppercase tracking-wider transition-all col-span-2 sm:col-span-1"
              >
                <Download size={14} className="text-[#c9a35b]" />
                <span>Save QR PNG</span>
              </button>

              <button
                type="button"
                onClick={() => handleShareWhatsApp(shareTicket)}
                className="flex items-center justify-center gap-2 p-3 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/30 rounded-xl text-xs font-medium uppercase tracking-wider transition-all"
              >
                <MessageSquare size={14} />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyPassDetails(shareTicket)}
                className="flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-medium uppercase tracking-wider transition-all"
              >
                {copiedId ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copiedId ? 'Copied!' : 'Copy Link'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleResendTicketEmail(shareTicket)}
                disabled={resendingId === shareTicket._id}
                className="flex items-center justify-center gap-2 p-3 bg-[#c9a35b]/10 hover:bg-[#c9a35b]/20 text-[#c9a35b] border border-[#c9a35b]/30 rounded-xl text-xs font-medium uppercase tracking-wider transition-all col-span-2 disabled:opacity-50"
              >
                {resendingId === shareTicket._id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : resendSuccess === shareTicket._id ? (
                  <CheckCircle size={14} className="text-emerald-400" />
                ) : (
                  <Mail size={14} />
                )}
                <span>
                  {resendingId === shareTicket._id
                    ? 'Sending Pass...'
                    : resendSuccess === shareTicket._id
                    ? 'Pass Sent to Email!'
                    : 'Resend PDF to My Gmail'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
