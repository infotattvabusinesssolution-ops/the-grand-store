import React, { useEffect, useState } from "react";
import api from '../../api';
import { useAuth } from "../../context/AuthContext";
import { Users, Building2, TrendingUp, DollarSign, Activity } from "lucide-react";
import AdminFinancials from "./AdminFinancials"; // We reuse the detailed ledger here!

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const goldText = "text-[#c9a35b]";
  const formatR = (v) => `R${Number(v || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get(`/admin/dashboard`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  if (loading || !stats) {
    return <div className="p-12 text-center text-[var(--color-ivory-muted)] animate-pulse">Loading Platform Matrix...</div>;
  }

  const kpis = [
    { label: "Total Platform Revenue", value: formatR(stats.totalRevenue), icon: TrendingUp, color: "text-green-400" },
    { label: "Total GS Commission", value: formatR(stats.totalCommission), icon: DollarSign, color: "text-[var(--color-gold)]" },
    { label: "Registered Users", value: stats.totalUsers, icon: Users, color: "text-blue-400" },
    { label: "Approved Vendors", value: stats.totalVendors, icon: Building2, color: "text-purple-400" },
  ];

  return (
    <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto pb-10">
      <section>
        <h1 className="text-[var(--color-ivory)] font-serif text-5xl mb-4 leading-tight">
          Platform <span className={goldText} >Overview</span>
        </h1>
        <p className="text-[var(--color-ivory-muted)] text-lg font-light">
          Real-time metrics and financial pulse of The Grand Store.
        </p>
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="p-5 bg-[#0a0a0a] border border-white/10 rounded-2xl group hover:border-white/20 transition-all">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-3">
              <kpi.icon size={14} className={kpi.color} /> {kpi.label}
            </div>
            <div className={`text-2xl md:text-3xl font-serif ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </section>

      {/* Module Breakdown */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-[#0a0a0a] border border-[var(--color-gold)]/10 rounded-2xl">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-ivory)] mb-4">Retail Shop</h3>
          <div className="flex justify-between mb-2">
            <span className="text-xs text-[var(--color-ivory-muted)]">Revenue</span>
            <span className="text-sm text-white font-mono">{formatR(stats.breakdown.shop.revenue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-[var(--color-ivory-muted)]">Commission</span>
            <span className="text-sm text-[var(--color-gold)] font-mono">{formatR(stats.breakdown.shop.commission)}</span>
          </div>
        </div>
        <div className="p-6 bg-[#0a0a0a] border border-[var(--color-gold)]/10 rounded-2xl">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-ivory)] mb-4">Live Auctions</h3>
          <div className="flex justify-between mb-2">
            <span className="text-xs text-[var(--color-ivory-muted)]">Revenue</span>
            <span className="text-sm text-white font-mono">{formatR(stats.breakdown.auctions.revenue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-[var(--color-ivory-muted)]">Commission & BP</span>
            <span className="text-sm text-[var(--color-gold)] font-mono">{formatR(stats.breakdown.auctions.commission)}</span>
          </div>
        </div>
        <div className="p-6 bg-[#0a0a0a] border border-[var(--color-gold)]/10 rounded-2xl">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-ivory)] mb-4">Events & Experiences</h3>
          <div className="flex justify-between mb-2">
            <span className="text-xs text-[var(--color-ivory-muted)]">Revenue</span>
            <span className="text-sm text-white font-mono">{formatR(stats.breakdown.events.revenue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-[var(--color-ivory-muted)]">Commission</span>
            <span className="text-sm text-[var(--color-gold)] font-mono">{formatR(stats.breakdown.events.commission)}</span>
          </div>
        </div>
      </section>

      {/* Detailed Ledger Component Reused */}
      <section className="pt-8 border-t border-white/10">
        <h2 className="text-2xl font-serif text-[var(--color-ivory)] mb-8 flex items-center gap-3">
          <Activity className="text-[var(--color-gold)]" /> Master Transaction Ledger
        </h2>
        <AdminFinancials hideHeader={true} />
      </section>
    </div>
  );
}
