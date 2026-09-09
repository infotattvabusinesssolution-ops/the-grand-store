import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { QrCode, Search, CheckCircle, XCircle, AlertCircle, Users, Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function EventAttendees({ onNotify }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ticketInput, setTicketInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      if (onNotify) onNotify('Please login to view attendees', 'error');
      navigate('/login');
      return;
    }

    const fetchAttendees = async () => {
      try {
        const token = user?.token;
        if (!token) return;

        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/events/vendor/${id}/attendees`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAttendees(res.data);
      } catch (error) {
        console.error('Failed to load attendees', error);
        if (onNotify) onNotify('Failed to load attendees', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchAttendees();
  }, [id, user, authLoading, navigate, onNotify]);

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

  const verifyCode = async (codeToVerify) => {
    const cleanCode = parseTicketCode(codeToVerify);
    if (!cleanCode) return;
    setVerifying(true);
    setVerifyResult(null);

    try {
      const token = user?.token;
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/events/vendor/verify-ticket`, 
        { ticketId: cleanCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setVerifyResult({
        success: true,
        message: 'Ticket Valid & Checked In',
        booking: res.data.booking
      });
      
      setAttendees(prev => prev.map(a => 
        (a.ticketId === res.data.booking?.ticketId || a._id === res.data.booking?._id) ? { ...a, ticketStatus: 'Used' } : a
      ));
      
      setTicketInput('');
    } catch (error) {
      console.error('Verification failed', error);
      setVerifyResult({
        success: false,
        message: error.response?.data?.message || 'Invalid Ticket'
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyTicket = async (e) => {
    e.preventDefault();
    verifyCode(ticketInput);
  };

  const handleScan = (result) => {
    if (result && result[0]?.rawValue) {
      const rawCode = result[0].rawValue;
      const cleanCode = parseTicketCode(rawCode);
      setShowScanner(false);
      setTicketInput(cleanCode);
      verifyCode(cleanCode);
    }
  };

  if (loading || authLoading) {
    return <div className="p-8 text-[#e1bd70]">Loading attendees...</div>;
  }

  const totalTickets = attendees.reduce((acc, curr) => acc + curr.quantity, 0);
  const checkedIn = attendees.filter(a => a.ticketStatus === 'Used').reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 text-white">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/vendor/events')} className="text-[#918a7f] hover:text-white transition-colors">
          &larr; Back to Events
        </button>
        <h1 className="text-3xl font-serif">Event Attendees</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Verification Scanner Panel */}
        <div className="lg:col-span-1">
          <div className="bg-[#11100d] border border-white/10 rounded-2xl p-6 shadow-xl sticky top-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <QrCode className="text-[#e1bd70]" size={24} />
                <h2 className="text-xl font-serif text-white">Verify Ticket</h2>
              </div>
              <button 
                onClick={() => setShowScanner(!showScanner)}
                className="text-xs flex items-center gap-1 uppercase tracking-widest font-bold text-[#c9a35b] hover:text-white transition-colors"
              >
                <Camera size={14} /> {showScanner ? 'Close' : 'Scan'}
              </button>
            </div>
            
            {showScanner && (
              <div className="mb-6 rounded-xl overflow-hidden border border-[#c9a35b]/30">
                <Scanner 
                  onScan={handleScan}
                  onError={(error) => console.log(error)}
                />
              </div>
            )}

            <p className="text-sm text-[#918a7f] mb-6">
              Scan a QR code or manually enter the ticket ID to check-in an attendee.
            </p>

            <form onSubmit={handleVerifyTicket} className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="e.g. TKT-XYZ123-9999"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:border-[#c9a35b] focus:outline-none font-mono uppercase"
                  autoFocus={!showScanner}
                />
              </div>
              <button
                type="submit"
                disabled={verifying || !ticketInput}
                className="w-full bg-[#c9a35b] text-black font-bold uppercase tracking-wider py-3 rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
              >
                {verifying ? 'Verifying...' : 'Check In Attendee'}
              </button>
            </form>

            {verifyResult && (
              <div className={`mt-6 p-4 rounded-xl border flex items-start gap-3 ${
                verifyResult.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
              }`}>
                {verifyResult.success ? (
                  <CheckCircle className="text-green-400 mt-1 shrink-0" size={20} />
                ) : (
                  <XCircle className="text-red-400 mt-1 shrink-0" size={20} />
                )}
                <div>
                  <p className={`font-bold uppercase tracking-widest text-xs mb-1 ${verifyResult.success ? 'text-green-400' : 'text-red-400'}`}>
                    {verifyResult.message}
                  </p>
                  {verifyResult.success && verifyResult.booking && (
                    <div className="text-sm text-white/70 mt-2 space-y-1">
                      <p>Name: <span className="text-white">{verifyResult.booking.user?.name || 'Guest Patron'}</span></p>
                      <p>Ticket: <span className="text-white">{verifyResult.booking.ticketType} (x{verifyResult.booking.quantity})</span></p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="mt-8 pt-6 border-t border-white/10">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#918a7f]">Total Tickets Sold:</span>
                <span className="font-bold text-white">{totalTickets}</span>
              </div>
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-[#918a7f]">Checked In:</span>
                <span className="font-bold text-green-400">{checkedIn}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Attendees List */}
        <div className="lg:col-span-2">
          <div className="bg-[#11100d] border border-white/10 rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-serif text-white mb-6 flex items-center gap-3">
              <Users className="text-[#e1bd70]" size={24} />
              Guest List
            </h2>

            {attendees.length === 0 ? (
              <div className="text-center py-12 text-[#918a7f]">
                No tickets have been booked for this event yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-[#918a7f]">
                      <th className="pb-3 pr-4 font-semibold">Attendee</th>
                      <th className="pb-3 px-4 font-semibold">Ticket Type</th>
                      <th className="pb-3 px-4 font-semibold">Qty</th>
                      <th className="pb-3 px-4 font-semibold text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendees.map(attendee => (
                      <tr key={attendee._id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="py-4 pr-4">
                          <div className="font-medium text-white">{attendee.user?.name || 'Unknown User'}</div>
                          <div className="text-xs text-[#918a7f] font-mono mt-1">{attendee.ticketId}</div>
                        </td>
                        <td className="py-4 px-4 text-sm text-[#eee8dd]">
                          {attendee.ticketType}
                        </td>
                        <td className="py-4 px-4 text-sm text-white">
                          {attendee.quantity}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-block text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full ${
                            attendee.ticketStatus === 'Valid' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                            attendee.ticketStatus === 'Used' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {attendee.ticketStatus === 'Valid' ? 'Ready' : attendee.ticketStatus === 'Used' ? 'Checked In' : attendee.ticketStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
