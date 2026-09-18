import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CalendarDays, CheckCircle2, ExternalLink, Mail, MessageSquare, Package, Phone, RefreshCw, Send, UserRound, XCircle } from 'lucide-react';
import api from '../../api';

const CIGAR_SITE_URL = 'https://cigar.yogapranafitness.com';
const imageUrl = (value) => !value ? '' : /^https?:\/\//i.test(value) ? value : `${CIGAR_SITE_URL}${value.startsWith('/') ? '' : '/'}${value}`;

const statusStyles = {
  new: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  open: 'border-blue-500/30 bg-blue-500/10 text-blue-200',
  replied: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  closed: 'border-white/15 bg-white/5 text-white/45',
};

const StatusBadge = ({ status }) => <span className={`rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] ${statusStyles[status] || statusStyles.new}`}>{status}</span>;

function Detail({ label, children }) {
  return <div><dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">{label}</dt><dd className="mt-1.5 break-words text-sm text-white/75">{children || 'Not provided'}</dd></div>;
}

function Section({ icon: Icon, title, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-[#101010]">
      <header className="flex items-center gap-3 border-b border-white/[0.08] px-5 py-4"><span className="rounded-lg bg-[#c9a35b]/10 p-2 text-[#d4b16b]"><Icon size={17} /></span><h2 className="font-serif text-xl text-white">{title}</h2></header>
      <div className="p-5">{children}</div>
    </section>
  );
}

export default function AdminCigarEnquiryDetail() {
  const { id } = useParams();
  const [enquiry, setEnquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [subject, setSubject] = useState('');
  const [reply, setReply] = useState('');

  useEffect(() => {
    let active = true;
    api.get(`/cigar-enquiries/${id}`)
      .then(({ data }) => {
        if (!active) return;
        setEnquiry(data);
        setSubject(`Re: ${data.product?.name || 'your cigar enquiry'} — ${data.reference}`);
      })
      .catch((requestError) => active && setError(requestError.response?.data?.message || 'Unable to load this cigar enquiry.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [id]);

  const sendReply = async (event) => {
    event.preventDefault();
    if (!subject.trim() || !reply.trim()) return setError('Enter an email subject and response message.');
    try {
      setWorking('reply');
      setError('');
      setSuccess('');
      const { data } = await api.post(`/cigar-enquiries/${id}/replies`, { subject: subject.trim(), message: reply.trim() });
      setEnquiry(data.enquiry);
      setReply('');
      setSuccess(data.message);
    } catch (requestError) {
      if (requestError.response?.data?.enquiry) setEnquiry(requestError.response.data.enquiry);
      setError(requestError.response?.data?.message || 'The response email could not be sent.');
    } finally {
      setWorking('');
    }
  };

  const updateStatus = async (status) => {
    if (status === 'closed' && !window.confirm('Close this enquiry? You can reopen it later.')) return;
    try {
      setWorking(status);
      setError('');
      setSuccess('');
      const { data } = await api.patch(`/cigar-enquiries/${id}/status`, { status });
      setEnquiry((current) => ({ ...current, ...data.enquiry }));
      setSuccess(data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'The status could not be updated.');
    } finally {
      setWorking('');
    }
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center text-sm text-white/45">Loading cigar enquiry…</div>;
  if (!enquiry) return <div className="mx-auto max-w-xl rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-100">{error || 'Cigar enquiry not found.'}<div><Link to="/admin/cigar-enquiries" className="mt-5 inline-block text-[#d4b16b]">Back to enquiries</Link></div></div>;

  return (
    <div className="mx-auto w-full max-w-7xl pb-20">
      <Link to="/admin/cigar-enquiries" className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45 hover:text-[#d4b16b]"><ArrowLeft size={14} /> All cigar enquiries</Link>

      <header className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#1c140e] via-[#111] to-[#0d0d0d] p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div className="flex min-w-0 items-start gap-5">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40">
              {enquiry.product?.image ? <img src={imageUrl(enquiry.product.image)} alt="" className="h-full w-full object-contain p-2" /> : <Package className="m-auto mt-8 text-[#c9a35b]" />}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><StatusBadge status={enquiry.status} /><span className="text-[10px] uppercase tracking-[0.14em] text-white/35">{enquiry.reference}</span></div>
              <h1 className="mt-3 break-words font-serif text-3xl text-white sm:text-4xl">{enquiry.product?.name}</h1>
              <p className="mt-2 text-sm text-white/45">{enquiry.product?.brand || 'Premium cigar'} · SKU {enquiry.product?.sku || 'not provided'} · Quantity {enquiry.quantity}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {enquiry.product?.pageUrl && <a href={enquiry.product.pageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-xs text-white/60 hover:bg-white/5"><ExternalLink size={14} /> Product page</a>}
            {enquiry.status === 'closed' ? (
              <button disabled={Boolean(working)} onClick={() => updateStatus('open')} className="inline-flex items-center gap-2 rounded-lg border border-[#c9a35b]/30 px-3 py-2.5 text-xs text-[#d4b16b] hover:bg-[#c9a35b]/10"><RefreshCw size={14} /> Reopen</button>
            ) : (
              <button disabled={Boolean(working)} onClick={() => updateStatus('closed')} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-xs text-white/55 hover:bg-white/5"><XCircle size={14} /> Close enquiry</button>
            )}
          </div>
        </div>
      </header>

      {(error || success) && <div className={`mt-4 flex items-start gap-2 rounded-lg border p-4 text-sm ${error ? 'border-red-500/20 bg-red-500/10 text-red-100' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'}`}>{error ? <AlertCircle size={17} /> : <CheckCircle2 size={17} />}{error || success}</div>}

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <main className="space-y-5">
          <Section icon={UserRound} title="Customer details">
            <dl className="grid gap-5 sm:grid-cols-2">
              <Detail label="Customer">{enquiry.customerName}</Detail>
              <Detail label="Preferred contact"><span className="capitalize">{enquiry.preferredContact}</span></Detail>
              <Detail label="Email"><a href={`mailto:${enquiry.email}`} className="text-[#d4b16b] hover:underline">{enquiry.email}</a></Detail>
              <Detail label="Phone"><a href={`tel:${enquiry.phone}`} className="text-[#d4b16b] hover:underline">{enquiry.phone}</a></Detail>
            </dl>
          </Section>

          <Section icon={Package} title="Product requested">
            <dl className="grid gap-5 sm:grid-cols-2">
              <Detail label="Product">{enquiry.product?.name}</Detail><Detail label="Brand">{enquiry.product?.brand}</Detail>
              <Detail label="SKU">{enquiry.product?.sku}</Detail><Detail label="Quantity">{enquiry.quantity}</Detail>
              {(enquiry.product?.specifications || []).map((specification) => <Detail key={`${specification.label}-${specification.value}`} label={specification.label}>{specification.value}</Detail>)}
            </dl>
          </Section>

          <Section icon={MessageSquare} title="Customer message">
            <p className={`whitespace-pre-wrap text-sm leading-7 ${enquiry.message ? 'text-white/75' : 'italic text-white/30'}`}>{enquiry.message || 'The customer did not add a message.'}</p>
          </Section>

          <Section icon={CalendarDays} title="Activity & email history">
            <div className="space-y-4">
              <div className="rounded-lg border border-white/[0.08] bg-white/[0.025] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-white/75">Automatic acknowledgement</p><span className={`text-[10px] font-bold uppercase tracking-wider ${enquiry.acknowledgement?.sent ? 'text-emerald-300' : 'text-red-300'}`}>{enquiry.acknowledgement?.sent ? 'Delivered' : 'Not delivered'}</span></div>
                <p className="mt-2 text-xs text-white/35">{enquiry.acknowledgement?.sentAt ? new Date(enquiry.acknowledgement.sentAt).toLocaleString() : enquiry.acknowledgement?.error || 'No delivery information available.'}</p>
              </div>
              {[...(enquiry.replies || [])].reverse().map((item) => (
                <article key={item._id} className="rounded-lg border border-white/[0.08] bg-white/[0.025] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-sm font-semibold text-white/80">{item.subject}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-white/30">{item.sentByName || item.sentBy?.name || 'Administrator'} · {new Date(item.sentAt).toLocaleString()}</p></div><span className={`text-[10px] font-bold uppercase tracking-wider ${item.deliveryStatus === 'sent' ? 'text-emerald-300' : 'text-red-300'}`}>{item.deliveryStatus}</span></div>
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-white/60">{item.message}</p>
                  {item.error && <p className="mt-3 text-xs text-red-300">{item.error}</p>}
                </article>
              ))}
            </div>
          </Section>
        </main>

        <aside className="space-y-5 xl:sticky xl:top-6">
          <section className="rounded-xl border border-[#c9a35b]/25 bg-[#14110d] p-5">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.17em] text-[#c9a35b]"><Send size={14} /> Email response</div>
            <h2 className="mt-3 font-serif text-2xl text-white">Reply to {enquiry.customerName.split(' ')[0]}</h2>
            <p className="mt-2 text-xs leading-5 text-white/40">This sends a branded Mcigar email to <strong className="text-white/65">{enquiry.email}</strong> and records it in the history.</p>
            <form onSubmit={sendReply} className="mt-5 space-y-4">
              <label className="block"><span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/40">Subject</span><input value={subject} onChange={(event) => setSubject(event.target.value)} maxLength="180" className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-[#c9a35b]/70" /></label>
              <label className="block"><span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/40">Message</span><textarea value={reply} onChange={(event) => setReply(event.target.value)} rows="10" maxLength="5000" placeholder="Write a clear, personal response about availability, lead time, pricing or next steps…" className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/20 focus:border-[#c9a35b]/70" /></label>
              <button disabled={Boolean(working) || !subject.trim() || !reply.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#c9a35b] px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-black hover:bg-[#dfbd78] disabled:cursor-not-allowed disabled:opacity-50"><Send size={15} />{working === 'reply' ? 'Sending email…' : 'Send email response'}</button>
            </form>
          </section>

          <section className="rounded-xl border border-white/10 bg-[#101010] p-5">
            <h3 className="text-sm font-semibold text-white/75">Enquiry audit</h3>
            <dl className="mt-4 space-y-4">
              <Detail label="Received">{new Date(enquiry.createdAt).toLocaleString()}</Detail>
              <Detail label="First viewed">{enquiry.firstViewedAt ? new Date(enquiry.firstViewedAt).toLocaleString() : 'Not yet'}</Detail>
              <Detail label="Last response">{enquiry.lastResponseAt ? new Date(enquiry.lastResponseAt).toLocaleString() : 'No response yet'}</Detail>
              <Detail label="Responses">{enquiry.replies?.filter((item) => item.deliveryStatus === 'sent').length || 0}</Detail>
            </dl>
            <div className="mt-5 grid gap-2 border-t border-white/10 pt-4">
              <a href={`mailto:${enquiry.email}`} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-xs text-white/55 hover:bg-white/5"><Mail size={14} /> Open email client</a>
              <a href={`tel:${enquiry.phone}`} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-xs text-white/55 hover:bg-white/5"><Phone size={14} /> Call customer</a>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
