import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  Landmark,
  Loader2,
  RefreshCw,
  Ticket,
  Upload,
} from 'lucide-react';
import api from '../../api';
import Price from '../../components/ui/Price';
import PaymentForm from '../checkout/PaymentForm';
import StoreBankDetailsCard from '../../components/StoreBankDetailsCard';

const PAID_STATUSES = ['Paid', 'Completed'];

const formatStatus = (value) => String(value || 'Pending').replaceAll('_', ' ');

export default function EventSuccessPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const paymentResult = searchParams.get('payment');

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofUrl, setProofUrl] = useState('');
  const [feedback, setFeedback] = useState('');
  const [bankDetails, setBankDetails] = useState(null);
  const [bankDetailsList, setBankDetailsList] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [payfastUrl, setPayfastUrl] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const fetchBooking = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setRefreshing(true);
    try {
      const response = await api.get('/events/bookings/my-tickets');
      const found = response.data.find((item) => item._id === id);
      setBooking(found || null);
      return found;
    } catch (error) {
      console.error('Failed to fetch event booking:', error);
      setFeedback(error.response?.data?.message || 'We could not refresh this ticket right now.');
      return null;
    } finally {
      setLoading(false);
      if (!silent) setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    document.title = 'Event Ticket Status — The Grand Store';
    let active = true;
    let attempts = 0;

    // Immediately trigger backend confirmation to ensure MongoDB update & email dispatch
    if (paymentResult === 'success' && id) {
      api.post('/payfast/confirm-order', { bookingId: id })
        .then(() => fetchBooking({ silent: true }))
        .catch((err) => console.log('Event confirm-order result:', err));
    }

    fetchBooking({ silent: true });

    const poller = paymentResult === 'success'
      ? window.setInterval(async () => {
          if (!active || attempts >= 20) return;
          attempts += 1;
          const latest = await fetchBooking({ silent: true });
          if (latest && (PAID_STATUSES.includes(latest.paymentStatus) || latest.paymentStatus === 'Failed')) {
            window.clearInterval(poller);
          }
        }, 3000)
      : null;

    return () => {
      active = false;
      if (poller) window.clearInterval(poller);
    };
  }, [fetchBooking, paymentResult, id]);

  const downloadTicketPdf = async () => {
    if (!booking) return;
    setDownloadingPdf(true);
    setFeedback('');
    try {
      const response = await api.get(`/events/bookings/${booking._id}/ticket-pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `TheGrandStore-VIP-Pass-${booking.ticketId || booking._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download ticket pass PDF:', err);
      setFeedback('Unable to generate ticket pass PDF right now. You can also download it from My Tickets.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  useEffect(() => {
    if (booking?.paymentMethod !== 'Bank Transfer') return;
    api.get('/settings/public')
      .then((response) => {
        setBankDetails(response.data.bankDetails || {});
        setBankDetailsList(response.data.bankDetailsList || null);
      })
      .catch((error) => console.error('Failed to load bank details:', error));
  }, [booking?.paymentMethod]);

  const retryPayFast = async () => {
    setRetrying(true);
    setFeedback('');
    try {
      const response = await api.post('/payfast/generate-event', { bookingId: id });
      setPayfastUrl(response.data.url);
      setPaymentData(response.data.data);
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Unable to restart payment. Please try booking again.');
      setRetrying(false);
    }
  };

  const uploadProof = async (event) => {
    event.preventDefault();
    setUploadingProof(true);
    setFeedback('');
    try {
      const response = await api.post(`/events/bookings/${id}/bank-transfer/upload`, { proofUrl });
      setBooking((current) => ({ ...current, ...response.data.booking }));
      setFeedback(response.data.message);
      setProofUrl('');
    } catch (error) {
      setFeedback(error.response?.data?.message || 'Failed to upload proof of payment.');
    } finally {
      setUploadingProof(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0907] pt-20">
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#c9a35b]/30 border-t-[#c9a35b]" />
        <p className="text-xs font-bold uppercase tracking-widest text-[#c9a35b]">Checking Ticket Status...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-[#0a0907] px-5 text-center">
        <AlertTriangle size={48} className="mb-4 text-[#888]" />
        <h2 className="mb-2 font-serif text-2xl text-white">Ticket Not Found</h2>
        <p className="mb-6 text-[#888]">We could not locate your ticket booking.</p>
        <button onClick={() => navigate('/events')} className="button button-gold">Back to Events</button>
      </div>
    );
  }

  const isBankTransfer = booking.paymentMethod === 'Bank Transfer';
  const isPaid = PAID_STATUSES.includes(booking.paymentStatus) || (!isBankTransfer && paymentResult === 'success');
  const bankStatus = booking.bankTransferStatus;
  const isRejected = booking.paymentStatus === 'Failed' || bankStatus === 'Rejected';
  const isCancelled = !isBankTransfer && paymentResult === 'cancel' && !isPaid;
  const isVerifying = false; // We no longer block on polling, assume success if PayFast redirects
  const awaitingProof = isBankTransfer && bankStatus === 'Awaiting_Proof' && !isRejected;
  const awaitingApproval = isBankTransfer && bankStatus === 'Awaiting_Approval' && !isRejected;

  const pageState = isPaid
    ? {
        title: 'Ticket Confirmed',
        message: `You are going to ${booking.event?.title || 'the event'}! Your ticket is confirmed.`,
        tone: 'success',
      }
    : isRejected || isCancelled
      ? {
          title: isRejected ? 'Payment Not Approved' : 'Payment Cancelled',
          message: isRejected
            ? (booking.paymentRejectionReason || 'The payment could not be approved and this ticket reservation was released.')
            : 'No payment was taken. You can safely retry payment using the same ticket reservation.',
          tone: 'error',
        }
      : awaitingProof
        ? {
            title: 'Complete Your Bank Transfer',
            message: 'Your tickets are reserved. Transfer the exact amount and submit your proof below.',
            tone: 'pending',
          }
        : awaitingApproval
          ? {
              title: 'Payment Proof Received',
              message: 'Your proof is waiting for finance approval. Your ticket will be issued after verification.',
              tone: 'pending',
            }
          : isVerifying
            ? {
                title: 'Confirming Your Payment',
                message: 'PayFast returned successfully. We are waiting for its verified server notification before issuing your ticket.',
                tone: 'pending',
              }
            : {
                title: 'Payment Pending',
                message: 'Your ticket is reserved, but payment has not yet been confirmed.',
                tone: 'pending',
              };

  const toneClasses = pageState.tone === 'success'
    ? 'bg-[#c9a35b]/10'
    : pageState.tone === 'error'
      ? 'bg-red-900/20'
      : 'bg-amber-900/15';

  return (
    <div className="min-h-screen bg-[#0a0907] pb-24 text-[#eee8dd]">
      <div className={`px-4 py-10 md:py-12 ${toneClasses}`}>
        <div className="shell flex flex-col items-center text-center">
          <div className={`mb-5 flex h-20 w-20 items-center justify-center rounded-full ${
            pageState.tone === 'success'
              ? 'bg-green-500/20 text-green-500'
              : pageState.tone === 'error'
                ? 'bg-red-500/20 text-red-500'
                : 'bg-[#c9a35b]/15 text-[#c9a35b]'
          }`}>
            {pageState.tone === 'success'
              ? <CheckCircle2 size={40} />
              : pageState.tone === 'error'
                ? <AlertTriangle size={40} />
                : isBankTransfer
                  ? <Landmark size={38} />
                  : <Clock3 size={40} />}
          </div>

          <h1 className="mb-4 font-serif text-3xl text-white md:text-5xl">{pageState.title}</h1>
          <p className="mx-auto max-w-2xl text-base text-[#ccc] md:text-lg">{pageState.message}</p>
        </div>
      </div>

      <div className="shell mt-8 max-w-5xl px-4 md:mt-12">
        {feedback && (
          <div className="mb-6 rounded-xl border border-[#c9a35b]/20 bg-[#c9a35b]/10 px-4 py-3 text-center text-sm text-[#e1bd70]">
            {feedback}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
          <div className="rounded-2xl border border-white/10 bg-[#11100d] p-5 md:p-8">
            <h3 className="mb-6 flex items-center gap-2 border-b border-white/10 pb-4 font-serif text-xl text-white">
              <Ticket className="text-[#c9a35b]" /> Ticket Details
            </h3>

            <div className="space-y-4 text-sm text-[#ccc]">
              <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                <span className="text-[#888]">Booking Reference</span>
                <span className="break-all font-mono text-white">{booking.gsReference}</span>
              </div>
              <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
                <span className="text-[#888]">Event</span>
                <span className="text-right font-bold text-white">{booking.event?.title}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[#888]">Ticket Type</span>
                <span className="text-right text-white">{booking.ticketType} × {booking.quantity}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[#888]">{isPaid ? 'Total Paid' : 'Amount Due'}</span>
                <span className="font-bold text-[#c9a35b]"><Price amount={booking.totalPrice} /></span>
              </div>
              <div className="flex justify-between gap-3 border-t border-white/10 pt-4">
                <span className="text-[#888]">Payment</span>
                <span className={`text-right font-bold ${isPaid ? 'text-green-500' : isRejected ? 'text-red-400' : 'text-yellow-500'}`}>
                  {isPaid ? 'Paid' : isBankTransfer ? formatStatus(bankStatus) : formatStatus(booking.paymentStatus)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center rounded-2xl border border-white/10 bg-[#11100d] p-5 text-center md:p-8">
            <h3 className="mb-4 text-lg font-bold uppercase tracking-widest text-white">What happens next?</h3>

            {isPaid ? (
              <>
                <p className="mb-6 text-sm text-[#888]">Your official VIP Pass and QR code are confirmed and attached to your confirmation email.</p>
                <button
                  type="button"
                  onClick={downloadTicketPdf}
                  disabled={downloadingPdf}
                  className="button button-gold mb-3 flex w-full items-center justify-center gap-2"
                >
                  {downloadingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  {downloadingPdf ? 'Generating Ticket PDF...' : 'Download VIP Ticket Pass (PDF)'}
                </button>
                <Link to="/customer/tickets" className="button button-dark mb-3 w-full text-center">View All My Tickets</Link>
                <Link to="/events" className="button button-dark w-full text-center opacity-80 hover:opacity-100">Discover More Events</Link>
              </>
            ) : isRejected ? (
              <>
                <p className="mb-6 text-sm text-[#888]">This reservation has been released. Create a new booking to select another payment method.</p>
                <Link to={`/events/${booking.event?._id}`} className="button button-gold mb-3 w-full text-center">Book Again</Link>
                <Link to="/events" className="button button-dark w-full text-center">Back to Events</Link>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                {isBankTransfer ? (
                  <>
                    <p className="mb-6 text-sm text-[#888]">
                      {awaitingApproval
                        ? 'Finance will review your proof. You can return to this page or My Tickets to see the result.'
                        : 'Use your booking reference for the transfer, then submit a public image or PDF link as proof.'}
                    </p>
                    <Link to="/customer/tickets" className="button button-dark w-full text-center">View My Tickets</Link>
                  </>
                ) : (
                  <>
                    <p className="mb-6 text-sm text-[#888]">
                      {isVerifying
                        ? 'Secure notification can take a moment. This page checks automatically, and you can refresh it manually.'
                        : 'Restart PayFast using this reservation. You will not create a duplicate ticket booking.'}
                    </p>
                    {isVerifying && (
                      <button onClick={() => fetchBooking()} disabled={refreshing} className="button button-dark mb-3 flex w-full items-center justify-center gap-2">
                        <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                        {refreshing ? 'Checking...' : 'Check Payment Status'}
                      </button>
                    )}
                    <button onClick={retryPayFast} disabled={retrying} className="button button-gold mb-3 flex w-full items-center justify-center gap-2 disabled:opacity-50">
                      {retrying ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                      {retrying ? 'Opening PayFast...' : 'Retry Payment'}
                    </button>
                    <Link to="/events" className="button button-dark w-full text-center">Back to Events</Link>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {isBankTransfer && !isPaid && !isRejected && (
          <section className="mt-6 rounded-2xl border border-[#c9a35b]/20 bg-gradient-to-br from-[#111] to-[#0a0a0a] p-5 md:mt-8 md:p-8">
            <div className="mx-auto max-w-3xl">
              <div className="mb-6 flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#c9a35b]/10 text-[#c9a35b]"><Landmark size={21} /></span>
                <div>
                  <h2 className="font-serif text-xl text-white">Bank Transfer Details</h2>
                  <p className="mt-1 text-sm text-[#918a7f]">Transfer exactly <strong className="text-white"><Price amount={booking.totalPrice} /></strong> using the reference below.</p>
                </div>
              </div>

              <StoreBankDetailsCard
                reference={booking.gsReference}
                referenceLabel="Payment Reference"
                title="Event Escrow Banking Details"
                subtitle="Official EFT settlement account for event ticket admissions"
                bankDetailsList={bankDetailsList}
                bankDetails={bankDetails}
                className="mb-6"
              />

              {awaitingProof ? (
                <form onSubmit={uploadProof} className="space-y-3">
                  <label htmlFor="event-proof-url" className="block text-xs font-bold uppercase tracking-widest text-[#918a7f]">Proof of Payment URL (Image/PDF)</label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      id="event-proof-url"
                      type="url"
                      value={proofUrl}
                      onChange={(event) => setProofUrl(event.target.value)}
                      required
                      placeholder="https://..."
                      className="min-h-12 flex-1 rounded-xl border border-white/10 bg-black px-4 text-sm text-white outline-none transition-colors focus:border-[#c9a35b]/60"
                    />
                    <button type="submit" disabled={uploadingProof} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#c9a35b] px-6 text-xs font-bold uppercase tracking-widest text-black disabled:opacity-50">
                      {uploadingProof ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      {uploadingProof ? 'Submitting...' : 'Submit Proof'}
                    </button>
                  </div>
                  <p className="text-xs text-[#6f6a62]">You can leave and return from My Tickets while your reservation is active.</p>
                </form>
              ) : awaitingApproval ? (
                <div className="flex flex-col gap-3 rounded-xl border border-green-500/20 bg-green-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-green-400">Proof submitted successfully</p>
                    <p className="mt-1 text-xs text-[#918a7f]">Awaiting verification by the finance team.</p>
                  </div>
                  {booking.proofUrl && (
                    <a href={booking.proofUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#c9a35b]">
                      View Proof <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              ) : null}
            </div>
          </section>
        )}
      </div>

      <PaymentForm paymentData={paymentData} payfastUrl={payfastUrl} />
    </div>
  );
}

function BankDetail({ label, value, mono = false }) {
  return (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-widest text-[#6f6a62]">{label}</p>
      <p className={`text-sm text-white ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
