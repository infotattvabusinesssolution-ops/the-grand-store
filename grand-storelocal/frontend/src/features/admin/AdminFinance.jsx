import React, { useState, useEffect } from 'react';
import api from '../../api';
import { DollarSign, ArrowUpRight, ArrowDownRight, TrendingUp, History } from 'lucide-react';

export default function AdminFinance() {
  const [metrics, setMetrics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);
  };

  useEffect(() => {
    const fetchFinanceData = async () => {
      try {
        const token = localStorage.getItem('token');
        const API_URL = import.meta.env.VITE_API_URL || '';
        const res = await api.get(`${API_URL}/api/admin/finance`);
        setMetrics(res.data.metrics);
        setTransactions(res.data.transactions);
      } catch (err) {
        setError('Failed to load finance data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchFinanceData();
  }, []);

  if (loading) return <div className="text-white p-8 text-center animate-pulse">Loading financial data...</div>;
  if (error) return <div className="text-red-500 p-8">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-serif text-white">Financial Control Centre</h2>
          <p className="text-gray-400 text-sm mt-1">Master overview of marketplace revenue and vendor payables.</p>
        </div>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111] border border-[#b58b38]/30 rounded-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp size={64} className="text-[#b58b38]" />
          </div>
          <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-1">Total Processed (Sales)</p>
          <p className="text-3xl font-serif text-[#e6c97a]">{formatMoney(metrics?.totalProcessed)}</p>
          <p className="text-[#888] text-xs mt-2">Gross customer payments cleared</p>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <ArrowUpRight size={64} className="text-green-500" />
          </div>
          <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-1">Grand Store Revenue</p>
          <p className="text-3xl font-serif text-white">{formatMoney(metrics?.totalPlatformRevenue)}</p>
          <p className="text-[#888] text-xs mt-2">Earned marketplace commissions</p>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <ArrowDownRight size={64} className="text-red-500" />
          </div>
          <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-1">Money Owed to Vendors</p>
          <p className="text-3xl font-serif text-white">{formatMoney(metrics?.totalPendingPayables)}</p>
          <p className="text-[#888] text-xs mt-2">Pending payables to be disbursed</p>
        </div>
      </div>

      {/* MASTER LEDGER */}
      <div className="bg-[#111] border border-white/10 rounded-sm overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-white/10 bg-black/40 flex justify-between items-center">
          <h3 className="text-white font-serif text-xl">Master Transaction Ledger</h3>
          <span className="text-xs text-[#888] uppercase tracking-widest">Immutable Records</span>
        </div>
        
        {transactions.length === 0 ? (
          <div className="p-12 text-center text-[#666]">
            <History size={48} className="mx-auto mb-4 opacity-20" />
            <p>No transactions yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/60 text-[#888] text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Reference</th>
                  <th className="p-4 font-medium">Type</th>
                  <th className="p-4 font-medium">Description</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-300">
                {transactions.map(txn => (
                  <tr key={txn._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 whitespace-nowrap">{new Date(txn.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit' })}</td>
                    <td className="p-4 font-mono text-xs text-[#b58b38] whitespace-nowrap">{txn.gsReference}</td>
                    <td className="p-4 uppercase text-[10px] tracking-wider font-bold">
                      <span className={
                        txn.type === 'commission' ? 'text-green-400' :
                        txn.type === 'payout' ? 'text-blue-400' :
                        'text-gray-400'
                      }>
                        {txn.type}
                      </span>
                    </td>
                    <td className="p-4 text-xs">{txn.description}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                        ${txn.status === 'cleared' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                          txn.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 
                          'bg-red-500/10 text-red-400 border border-red-500/20'}
                      `}>
                        {txn.status}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium">
                      {formatMoney(txn.netAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
