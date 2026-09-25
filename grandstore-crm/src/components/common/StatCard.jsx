import React from 'react';

export default function StatCard({ title, count, value, subtitle, icon: Icon, color = 'blue', onClick, active = false, loading = false }) {
  const colorThemes = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      border: 'hover:border-blue-300'
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'hover:border-amber-300'
    },
    red: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'hover:border-rose-300'
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'hover:border-rose-300'
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'hover:border-emerald-300'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'hover:border-purple-300'
    }
  };

  const theme = colorThemes[color] || colorThemes.blue;
  const displayVal = value !== undefined && value !== null ? value : (count !== undefined && count !== null ? count : '—');
  const Card = onClick ? 'button' : 'div';

  return (
    <Card
      type={onClick ? 'button' : undefined}
      aria-pressed={onClick ? active : undefined}
      aria-busy={loading || undefined}
      onClick={onClick}
      className={`
        crm-stat-card bg-white rounded-2xl p-5 border border-slate-200 shadow-sm
        ${onClick ? `cursor-pointer hover:shadow-md ${theme.border}` : ''}
        ${active ? 'ring-2 ring-blue-500/60 border-blue-300' : ''}
      `}
    >
      <div className="crm-stat-heading">
        <span className="text-[11px] leading-relaxed font-bold text-slate-500 uppercase tracking-wider">{title}</span>
        {Icon && <span className={`crm-stat-icon ${theme.bg} ${theme.text}`}><Icon size={20} aria-hidden="true" /></span>}
      </div>
      <span className="crm-stat-value font-extrabold text-slate-900 tracking-tight">
        {loading ? '…' : displayVal}
      </span>
      <span className="crm-stat-description text-xs text-slate-500 font-medium">{subtitle || '\u00a0'}</span>
    </Card>
  );
}
