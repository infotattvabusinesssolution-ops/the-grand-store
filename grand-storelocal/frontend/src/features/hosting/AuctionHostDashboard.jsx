import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Package, DollarSign, Activity, AlertCircle, ShoppingBag, Lightbulb, Calendar, Gavel } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import { formatCartPrice } from '../../data';
import Price from '../../components/ui/Price';

export default function AuctionHostDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lots, setLots] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch Lots
        try {
          const lotsRes = await api.get(`/auction/vendor/lots`);
          setLots(lotsRes.data);
        } catch (e) { console.error('Lots fetch failed', e); }

        // Fetch Wallet
        try {
          const walletRes = await api.get(`/vendor/wallet`);
          setWallet(walletRes.data.wallet);
        } catch (e) { console.error('Wallet fetch failed', e); }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const goldTextClass = "text-[#c9a35b] drop-shadow-[0_0_12px_rgba(201,163,91,0.6)]";
  const netPayout = wallet ? (wallet.availableBalance + wallet.pendingBalance) : 0;
  const totalLots = lots.length;

  return (
    <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto pb-10">
      
      {/* Welcome Section */}
      <section className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1">
          <h1 className="text-[var(--color-ivory)] font-serif text-5xl mb-4 leading-tight">
            Welcome back, <br/>
            <span className={goldTextClass}>{user?.name?.split(' ')[0] || 'Partner'}</span>
          </h1>
          <p className="text-[var(--color-ivory-muted)] text-lg max-w-2xl font-light leading-relaxed">
            Here is your daily auction summary. You have submitted {totalLots} lots to The Grand Store platform.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={() => navigate('/auction-manager/auction-submit')}
              className="flex items-center gap-2 px-6 py-3 bg-[#c9a35b] hover:bg-[#e6c97a] text-black font-semibold rounded-lg transition-colors shadow-[0_0_15px_rgba(201,163,91,0.2)]"
            >
              <Package size={20} /> Submit Auction Lot
            </button>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { title: "Net Payout", value: <Price amount={netPayout} />, icon: DollarSign },
          { title: "Total Lots Submitted", value: totalLots, icon: Package },
        ].map((kpi, idx) => (
          <div key={idx} className="p-6 border-b border-white/10 group transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="text-[var(--color-ivory-muted)] text-[10px] uppercase tracking-widest font-semibold">{kpi.title}</div>
              <div className="p-2 rounded-lg bg-black/40 text-[#c9a35b] border border-white/[0.05]">
                <kpi.icon size={16} />
              </div>
            </div>
            <div className="text-3xl font-serif text-[var(--color-ivory)] mb-2 group-hover:text-[#c9a35b] transition-colors">{loading ? '...' : kpi.value}</div>
          </div>
        ))}
      </section>

      {/* Recent Lots List */}
      <section className="mt-2 border-t border-white/10 pt-8">
        <h3 className="text-2xl font-serif text-[var(--color-ivory)] mb-6 flex items-center gap-3">
          <div className="p-2 bg-[var(--color-gold)]/10 text-[#c9a35b] rounded-lg">
            <Gavel size={20} />
          </div>
          Your Lots
        </h3>
        
        {lots.length === 0 ? (
          <div className="text-center py-12 border border-white/5 rounded-2xl bg-white/[0.01]">
            <p className="text-[var(--color-ivory-muted)]">No lots submitted yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white/[0.01] border border-white/5 rounded-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] bg-black/20">
                  <th className="py-4 font-semibold pl-6">Title</th>
                  <th className="py-4 font-semibold">Reserve Price</th>
                  <th className="py-4 font-semibold">Status</th>
                  <th className="py-4 font-semibold text-right pr-6">Action</th>
                </tr>
              </thead>
              <tbody>
                {lots.slice(0, 5).map((lot) => (
                  <tr key={lot._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 pl-6">
                      <div className="font-serif text-[var(--color-ivory)]">{lot.title}</div>
                    </td>
                    <td className="py-4">
                      <div className="text-sm text-[var(--color-ivory-muted)]"><Price amount={lot.reservePrice} /></div>
                    </td>
                    <td className="py-4 text-sm text-[var(--color-ivory)]">
                      <span className={`px-2 py-1 rounded text-xs ${
                        lot.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        lot.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {lot.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 text-right pr-6">
                      <button onClick={() => navigate(`/auction-manager/inventory`)} className="text-[10px] uppercase tracking-widest text-[#c9a35b] hover:text-white font-bold transition-colors">
                        View Inventory &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
