import React, { useState, useEffect } from 'react';
import api from '../../api';
import {
  Gavel, Calendar, CheckCircle, XCircle, Trash2, Copy, Eye,
  ChevronDown, ChevronUp, Clock, User, Mail, Phone, Building2,
  RefreshCw, Shield
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL;
const token = () => JSON.parse(localStorage.getItem('userInfo'))?.token;
const headers = () => ({ Authorization: `Bearer ${token()}` });

/* ─── Status badge ─── */
const StatusBadge = ({ status }) => {
  const map = {
    pending:  'bg-amber-100 text-amber-700 border-amber-200',
    approved: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] uppercase tracking-widest font-semibold border ${map[status] || ''}`}>
      {status}
    </span>
  );
};

/* ─── Credentials modal shown once after approval ─── */
const CredentialsModal = ({ data, onClose }) => {
  const [copied, setCopied] = useState({});
  const copy = (key, val) => {
    navigator.clipboard.writeText(val);
    setCopied(p => ({ ...p, [key]: true }));
    setTimeout(() => setCopied(p => ({ ...p, [key]: false })), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full border border-stone-200 shadow-2xl">
        <div className="bg-green-50 border-b border-green-100 px-6 py-5">
          <div className="flex items-center gap-3 mb-1">
            <CheckCircle size={20} className="text-green-500" />
            <h2 className="font-semibold text-stone-900">Application Approved</h2>
          </div>
          <p className="text-stone-500 text-sm">
            {data.emailSent
              ? '✅ Credentials have been emailed to the applicant.'
              : '⚠ Email not configured — share these credentials manually.'}
          </p>
        </div>
        <div className="p-6 space-y-5">
          <div className="bg-stone-50 border border-stone-200 p-4 space-y-4">
            {[
              { label: 'Username (Email)', key: 'username', value: data.credentials?.username },
              { label: 'Temporary Password', key: 'password', value: data.credentials?.password },
            ].map(({ label, key, value }) => (
              <div key={key}>
                <p className="text-[10px] uppercase tracking-widest text-stone-400 mb-1.5">{label}</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white border border-stone-200 px-3 py-2 text-sm font-mono text-stone-800 select-all">
                    {value}
                  </code>
                  <button onClick={() => copy(key, value)}
                    className={`flex items-center gap-1 px-3 py-2 text-xs border transition-colors ${
                      copied[key]
                        ? 'bg-green-50 border-green-200 text-green-600'
                        : 'bg-stone-900 border-stone-900 text-white hover:bg-stone-800'
                    }`}>
                    <Copy size={12} /> {copied[key] ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs text-stone-400 space-y-1">
            <p>• Host logs in at <strong>{window.location.origin}/login</strong></p>
            <p>• Portal: {data.type === 'auction' ? '/host/auction' : '/host/event'}</p>
          </div>
        </div>
        <div className="px-6 pb-6">
          <button onClick={onClose}
            className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white text-sm uppercase tracking-widest font-medium transition-colors">
            Done — Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Expand row detail ─── */
const DetailRow = ({ label, value }) =>
  value ? (
    <div className="flex gap-4">
      <span className="text-[10px] uppercase tracking-widest text-stone-400 w-28 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-stone-700 text-sm">{value}</span>
    </div>
  ) : null;

export default function AdminHostApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', type: '' });
  const [expanded, setExpanded] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveId, setApproveId] = useState(null);
  const [approveLimit, setApproveLimit] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);
  const [credentials, setCredentials] = useState(null); // shown in modal

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.type)   params.type   = filter.type;
      const res = await api.get(`/host-applications`, { headers: headers(), params });
      setApps(res.data);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const approve = async (id) => {
    if (!approveLimit || approveLimit < 1) { alert('Limit must be at least 1'); return; }
    setActionLoading(id + '_approve');
    try {
      const res = await api.put(`/host-applications/${id}/approve`, { allowedHostLimit: Number(approveLimit) }, { headers: headers() });
      setCredentials({ ...res.data, id });
      setApproveId(null);
      setApproveLimit(1);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Approval failed');
    } finally { setActionLoading(null); }
  };

  const reject = async (id) => {
    if (!rejectReason.trim()) { alert('Please enter a rejection reason'); return; }
    setActionLoading(id + '_reject');
    try {
      await axios.put(`${API}/api/host-applications/${id}/reject`,
        { reason: rejectReason }, { headers: headers() });
      setRejectId(null);
      setRejectReason('');
      load();
    } catch { } finally { setActionLoading(null); }
  };

  const revoke = async (id) => {
    if (!window.confirm('Revoke this host\'s access? This will delete their account.')) return;
    setActionLoading(id + '_revoke');
    try {
      await api.delete(`/host-applications/${id}/revoke`, { headers: headers() });
      load();
    } catch { } finally { setActionLoading(null); }
  };

  const counts = {
    all:      apps.length,
    pending:  apps.filter(a => a.status === 'pending').length,
    approved: apps.filter(a => a.status === 'approved').length,
    rejected: apps.filter(a => a.status === 'rejected').length,
  };

  return (
    <div>
      {/* Credentials modal */}
      {credentials && (
        <CredentialsModal data={credentials} onClose={() => setCredentials(null)} />
      )}

      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Host Applications</h1>
          <p className="text-white/40 text-sm">Review and approve auction & event hosting applications</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-white/40 hover:text-white text-xs uppercase tracking-widest transition-colors">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', count: counts.all, color: 'text-white' },
          { label: 'Pending', count: counts.pending, color: 'text-amber-400' },
          { label: 'Approved', count: counts.approved, color: 'text-green-400' },
          { label: 'Rejected', count: counts.rejected, color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/[0.04] border border-white/[0.07] p-5">
            <p className={`text-3xl font-serif ${s.color}`}>{s.count}</p>
            <p className="text-white/30 text-xs uppercase tracking-widest mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <select value={filter.status} onChange={e => setFilter(p => ({ ...p, status: e.target.value }))}
          className="bg-white/[0.05] border border-white/10 text-white/70 text-xs px-4 py-2 focus:outline-none">
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={filter.type} onChange={e => setFilter(p => ({ ...p, type: e.target.value }))}
          className="bg-white/[0.05] border border-white/10 text-white/70 text-xs px-4 py-2 focus:outline-none">
          <option value="">All Types</option>
          <option value="auction">Auction</option>
          <option value="event">Event</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center text-white/30 text-sm">Loading applications…</div>
      ) : apps.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-white/20 text-4xl mb-4">📋</p>
          <p className="text-white/30 text-sm uppercase tracking-widest">No applications found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {apps.map(app => (
            <div key={app._id} className="bg-white/[0.04] border border-white/[0.07] overflow-hidden">
              {/* Row */}
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Type icon */}
                <div className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${
                  app.type === 'auction' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                }`}>
                  {app.type === 'auction' ? <Gavel size={16} /> : <Calendar size={16} />}
                </div>

                {/* Applicant */}
                <div className="flex-1 min-w-0">
                  <p className="text-white/90 font-medium text-sm truncate">{app.applicantName}</p>
                  <p className="text-white/40 text-xs">{app.applicantEmail}</p>
                </div>

                {/* Item / Event name */}
                <div className="flex-1 min-w-0 hidden md:block">
                  <p className="text-white/60 text-sm truncate">
                    {app.type === 'auction' ? app.itemTitle : app.eventName}
                  </p>
                  <p className="text-white/30 text-xs capitalize">{app.type}</p>
                </div>

                {/* Date */}
                <div className="text-white/30 text-xs hidden lg:block w-24">
                  {new Date(app.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>

                {/* Status */}
                <div className="w-24">
                  <StatusBadge status={app.status} />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {app.status === 'pending' && (
                    <>
                      <button
                        onClick={() => setApproveId(approveId === app._id ? null : app._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 text-xs uppercase tracking-widest transition-colors border border-green-500/20 disabled:opacity-50"
                      >
                        <CheckCircle size={12} />
                        Approve
                      </button>
                      <button
                        onClick={() => setRejectId(rejectId === app._id ? null : app._id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs uppercase tracking-widest transition-colors border border-red-500/20"
                      >
                        <XCircle size={12} /> Reject
                      </button>
                    </>
                  )}
                  {app.status === 'approved' && app.generatedUserId && (
                    <button
                      onClick={() => revoke(app._id)}
                      disabled={actionLoading === app._id + '_revoke'}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs uppercase tracking-widest transition-colors border border-red-500/20 disabled:opacity-50"
                    >
                      <Trash2 size={12} />
                      {actionLoading === app._id + '_revoke' ? '…' : 'Revoke'}
                    </button>
                  )}
                  <button
                    onClick={() => setExpanded(expanded === app._id ? null : app._id)}
                    className="text-white/20 hover:text-white/60 transition-colors p-1.5"
                  >
                    {expanded === app._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </div>

              {/* Approve limit input */}
              {approveId === app._id && (
                <div className="px-5 pb-4 border-t border-white/[0.05] pt-4 flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-3">
                    <span className="text-white/50 text-xs uppercase tracking-widest">Allowed Limit:</span>
                    <input
                      type="number"
                      min="1"
                      value={approveLimit}
                      onChange={e => setApproveLimit(e.target.value)}
                      className="bg-white/[0.05] border border-white/10 px-3 py-2 text-white text-sm focus:outline-none w-24 text-center"
                    />
                  </div>
                  <button
                    onClick={() => approve(app._id)}
                    disabled={actionLoading === app._id + '_approve'}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-black text-xs uppercase tracking-widest font-bold disabled:opacity-50"
                  >
                    {actionLoading === app._id + '_approve' ? '…' : 'Confirm'}
                  </button>
                  <button onClick={() => { setApproveId(null); setApproveLimit(1); }}
                    className="text-white/30 hover:text-white/60 text-xs uppercase tracking-widest">
                    Cancel
                  </button>
                </div>
              )}

              {/* Reject reason input */}
              {rejectId === app._id && (
                <div className="px-5 pb-4 border-t border-white/[0.05] pt-4 flex items-center gap-3">
                  <input
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    placeholder="Rejection reason (required)…"
                    className="flex-1 bg-white/[0.05] border border-white/10 px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-red-400/40"
                  />
                  <button
                    onClick={() => reject(app._id)}
                    disabled={actionLoading === app._id + '_reject'}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs uppercase tracking-widest font-medium disabled:opacity-50"
                  >
                    {actionLoading === app._id + '_reject' ? '…' : 'Confirm'}
                  </button>
                  <button onClick={() => { setRejectId(null); setRejectReason(''); }}
                    className="text-white/30 hover:text-white/60 text-xs uppercase tracking-widest">
                    Cancel
                  </button>
                </div>
              )}

              {/* Expanded details */}
              {expanded === app._id && (
                <div className="px-5 pb-6 pt-4 border-t border-white/[0.05] grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-widest text-white/30 mb-3">Applicant</p>
                    <DetailRow label="Name"    value={app.applicantName} />
                    <DetailRow label="Email"   value={app.applicantEmail} />
                    <DetailRow label="Phone"   value={app.applicantPhone} />
                    <DetailRow label="Company" value={app.companyName} />
                    {app.notes && <DetailRow label="Notes" value={app.notes} />}
                    {app.status === 'approved' && (
                      <>
                        <div className="mt-4 pt-4 border-t border-white/[0.05] flex items-center gap-2 text-green-400 text-xs">
                          <Shield size={12} /> Access granted · role: {app.generatedUserId?.role}
                        </div>
                        {app.generatedPassword && (
                          <div className="mt-2 text-white/50 text-xs">
                            <span className="text-white/30 mr-2">Password:</span>
                            <code className="bg-white/10 px-1.5 py-0.5 font-mono">{app.generatedPassword}</code>
                          </div>
                        )}
                      </>
                    )}
                    {app.rejectedReason && (
                      <div className="mt-4 pt-4 border-t border-white/[0.05] text-red-400/70 text-xs">
                        ✗ Rejected: {app.rejectedReason}
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-widest text-white/30 mb-3">
                      {app.type === 'auction' ? 'Item Details' : 'Event Details'}
                    </p>
                    {app.type === 'auction' ? (
                      <>
                        <DetailRow label="Item"       value={app.itemTitle} />
                        <DetailRow label="Category"   value={app.itemCategory} />
                        <DetailRow label="Condition"  value={app.itemCondition} />
                        <DetailRow label="Est. Value" value={app.estimatedValue ? `R${Number(app.estimatedValue).toLocaleString()}` : null} />
                        <DetailRow label="Description" value={app.itemDescription} />
                      </>
                    ) : (
                      <>
                        <DetailRow label="Event"      value={app.eventName} />
                        <DetailRow label="Type"       value={app.eventType} />
                        <DetailRow label="Date"       value={app.eventDate ? new Date(app.eventDate).toLocaleDateString() : null} />
                        <DetailRow label="Venue"      value={app.eventVenue} />
                        <DetailRow label="Capacity"   value={app.eventCapacity} />
                        <DetailRow label="Description" value={app.eventDescription} />
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
