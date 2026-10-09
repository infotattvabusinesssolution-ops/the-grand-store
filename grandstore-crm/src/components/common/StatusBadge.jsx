import React from 'react';

export default function StatusBadge({ status, label }) {
  const normalized = (status || '').toLowerCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (['platform_flagship', 'flagship'].includes(normalized)) {
    styles = 'bg-amber-500/20 text-amber-300 border-amber-400/40 font-extrabold shadow-sm';
  } else if (['completed', 'delivered', 'paid', 'verified', 'approved', 'live_active', 'sold', 'payment cleared', 'payment_cleared'].includes(normalized)) {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
  } else if (['live'].includes(normalized)) {
    styles = 'bg-purple-50 text-purple-700 border-purple-200 font-bold';
  } else if (['upcoming'].includes(normalized)) {
    styles = 'bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold';
  } else if (['open', 'new', 'pending', 'under_review', 'ongoing'].includes(normalized)) {
    styles = 'bg-blue-50 text-blue-700 border-blue-200 font-semibold';
  } else if (['in_progress', 'processing', 'extended', 'awaiting payment', 'awaiting_payment', 'awaiting_approval'].includes(normalized)) {
    styles = 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
  } else if (['urgent', 'delayed', 'failed', 'exception', 'overdue', 'cancelled', 'suspended', 'defaulted'].includes(normalized)) {
    styles = 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
  } else if (['unsold'].includes(normalized)) {
    styles = 'bg-slate-100 text-slate-500 border-slate-200';
  }

  const displayLabel = label || (normalized === 'platform_flagship' ? 'Master Flagship' : status) || 'Unknown';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] border capitalize tracking-wide ${styles}`}>
      {displayLabel.replace(/_/g, ' ')}
    </span>
  );
}
