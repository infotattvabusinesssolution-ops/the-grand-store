import React from 'react';

export default function StatCard({ title, count, subtitle, icon: Icon, color = 'blue', onClick }) {
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
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'hover:border-emerald-300'
    }
  };

  const theme = colorThemes[color] || colorThemes.blue;

  return (
    <div 
      onClick={onClick}
      className={`
        bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md 
        transition-all duration-200 flex items-start justify-between cursor-pointer ${theme.border}
      `}
    >
      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-3xl font-extrabold text-slate-900 mt-1.5 tracking-tight">
          {count !== undefined && count !== null ? count : '—'}
        </h3>
        {subtitle && <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-xl ${theme.bg} ${theme.text} shadow-sm`}>
        {Icon && <Icon size={22} />}
      </div>
    </div>
  );
}
