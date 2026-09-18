import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock3, Mail, MessageSquare, Search, Send, XCircle } from 'lucide-react';
import api from '../../api';

const CIGAR_SITE_URL = 'https://cigar.yogapranafitness.com';
const imageUrl = (value) => !value ? '' : /^https?:\/\//i.test(value) ? value : `${CIGAR_SITE_URL}${value.startsWith('/') ? '' : '/'}${value}`;

const statusStyles = {
  new: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  open: 'border-blue-500/30 bg-blue-500/10 text-blue-200',
  replied: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  closed: 'border-white/15 bg-white/5 text-white/45',
};

function StatusBadge({ status }) {
  return <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${statusStyles[status] || statusStyles.new}`}>{status}</span>;
}

function Metric({ icon: Icon, label, value, tone = 'text-[#c9a35b]' }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#111] p-4">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/35"><Icon size={15} className={tone} />{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

export default function AdminCigarEnquiries() {
  const navigate = useNavigate();
  const [enquiries, setEnquiries] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    let active = true;
    api.get('/cigar-enquiries')
      .then(({ data }) => {
        if (!active) return;
        setEnquiries(data.data || []);
        setCounts(data.counts || {});
      })
      .catch((requestError) => active && setError(requestError.response?.data?.message || 'Unable to load cigar enquiries.'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return enquiries.filter((enquiry) => {
      if (status !== 'all' && enquiry.status !== status) return false;
      if (!query) return true;
      return [enquiry.reference, enquiry.customerName, enquiry.email, enquiry.phone, enquiry.product?.name, enquiry.product?.brand]
        .some((value) => String(value || '').toLowerCase().includes(query));
    });
  }, [enquiries, search, status]);

  const total = Object.values(counts).reduce((sum, count) => sum + Number(count || 0), 0) || enquiries.length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-20">
      <header className="flex flex-col justify-between gap-5 border-b border-white/10 pb-7 lg:flex-row lg:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#c9a35b]"><MessageSquare size={17} /> Mcigar concierge</div>
          <h1 className="mt-3 font-serif text-4xl text-white sm:text-5xl">Cigar enquiries</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">Review customer product requests, see every submitted detail and respond from the admin dashboard.</p>
        </div>
        <div className="relative w-full lg:w-80">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, product or reference" className="w-full rounded-lg border border-white/10 bg-[#101010] py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#c9a35b]/60" />
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Mail} label="All enquiries" value={total} />
        <Metric icon={Clock3} label="New" value={counts.new || 0} tone="text-amber-300" />
        <Metric icon={Send} label="Replied" value={counts.replied || 0} tone="text-emerald-300" />
        <Metric icon={XCircle} label="Closed" value={counts.closed || 0} tone="text-white/45" />
      </section>

      <div className="flex flex-wrap gap-2">
        {['all', 'new', 'open', 'replied', 'closed'].map((item) => (
          <button key={item} onClick={() => setStatus(item)} className={`rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.14em] transition ${status === item ? 'border-[#c9a35b] bg-[#c9a35b] text-black' : 'border-white/10 text-white/50 hover:border-white/25 hover:text-white'}`}>{item}</button>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-white/10 bg-[#101010]">
        {loading ? (
          <div className="flex min-h-64 items-center justify-center text-sm text-white/45">Loading Mcigar enquiries…</div>
        ) : error ? (
          <div className="m-5 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center"><CheckCircle2 size={30} className="text-white/20" /><p className="mt-3 text-white/65">No enquiries match this view.</p></div>
        ) : (
          <div className="divide-y divide-white/[0.07]">
            {filtered.map((enquiry) => (
              <button key={enquiry._id} type="button" onClick={() => navigate(`/admin/cigar-enquiries/${enquiry._id}`)} className="group grid w-full gap-4 p-4 text-left transition hover:bg-white/[0.035] sm:p-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] lg:items-center">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/40">
                    {enquiry.product?.image ? <img src={imageUrl(enquiry.product.image)} alt="" className="h-full w-full object-contain p-1" /> : <MessageSquare className="m-auto mt-5 text-[#c9a35b]" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><StatusBadge status={enquiry.status} /><span className="text-[10px] uppercase tracking-[0.12em] text-white/30">{enquiry.reference}</span></div>
                    <p className="mt-2 truncate font-serif text-xl text-white">{enquiry.product?.name}</p>
                    <p className="mt-1 text-xs text-white/40">{enquiry.product?.brand || 'Cigar product'} · Quantity {enquiry.quantity}</p>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white/75">{enquiry.customerName}</p>
                  <p className="mt-1 truncate text-xs text-white/40">{enquiry.email} · {enquiry.phone}</p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.12em] text-white/25">{new Date(enquiry.createdAt).toLocaleString()}</p>
                </div>
                <span className="inline-flex items-center gap-2 justify-self-start text-[10px] font-bold uppercase tracking-[0.13em] text-[#d4b16b] lg:justify-self-end">Review & reply <ArrowRight size={14} className="transition group-hover:translate-x-1" /></span>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
