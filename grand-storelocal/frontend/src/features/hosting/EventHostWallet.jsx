import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Wallet, ArrowUpRight, ArrowDownRight, Clock, CheckCircle2, History } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function EventHostWallet() {
  const { user } = useAuth();
  const [walletData, setWalletData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fallback formatter if utils doesn't exist
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount || 0);
  };

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || '';
        const res = await axios.get(`${API_URL}/api/vendor/wallet`, {
          headers: { Authorization: `Bearer ${user?.token}` }
        });
        setWalletData(res.data.wallet);
        setOrders(res.data.orders || []);
      } catch (err) {
        setError('Failed to load wallet data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWallet();
  }, []);

  if (loading) return <div className="text-white p-8 text-center animate-pulse">Loading wallet securely...</div>;
  if (error) return <div className="text-red-500 p-8">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-serif text-white">Vendor Wallet</h2>
          <p className="text-gray-400 text-sm mt-1">Manage your earnings, pending payouts, and transaction history.</p>
        </div>
        <button className="bg-[#b58b38] hover:bg-[#c9a35b] text-black px-6 py-2 rounded-sm font-bold text-sm tracking-widest transition-colors flex items-center gap-2">
          <Wallet size={16} />
          REQUEST PAYOUT
        </button>
      </div>

      {/* BALANCE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#111] border border-[#b58b38]/30 rounded-sm p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle2 size={64} className="text-[#b58b38]" />
          </div>
          <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-1">Available Balance</p>
          <p className="text-3xl font-serif text-[#e6c97a]">{formatMoney(walletData?.availableBalance)}</p>
          <p className="text-[#888] text-xs mt-2">Cleared and ready for withdrawal</p>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Clock size={64} className="text-white" />
          </div>
          <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-1">Pending Clearance</p>
          <p className="text-3xl font-serif text-white">{formatMoney(walletData?.pendingBalance)}</p>
          <p className="text-[#888] text-xs mt-2">Awaiting order completion</p>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <ArrowUpRight size={64} className="text-green-500" />
          </div>
          <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-1">Total Paid Out</p>
          <p className="text-3xl font-serif text-white">{formatMoney(walletData?.totalWithdrawn)}</p>
          <p className="text-[#888] text-xs mt-2">Total funds successfully withdrawn</p>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <History size={64} className="text-white" />
          </div>
          <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-1">Total Earned</p>
          <p className="text-3xl font-serif text-white">{formatMoney(walletData?.totalEarned)}</p>
          <p className="text-[#888] text-xs mt-2">Lifetime earnings on The Grand Store</p>
        </div>
      </div>

      {/* SALES BREAKDOWN */}
      <div className="bg-[#111] border border-white/10 rounded-sm overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-white/10 bg-black/40">
          <h3 className="text-white font-serif text-xl">Sales Breakdown & Payouts</h3>
          <p className="text-xs text-gray-400 mt-1">Detailed calculation of your earnings per completed order.</p>
        </div>
        
        {orders.length === 0 ? (
          <div className="p-12 text-center text-[#666]">
            <History size={48} className="mx-auto mb-4 opacity-20" />
            <p>No sales data available yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-black/60 text-[#888] text-[10px] uppercase tracking-wider">
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Order Ref</th>
                  <th className="p-4 font-medium text-right">Products (Gross)</th>
                  <th className="p-4 font-medium text-right text-yellow-500">VAT Deducted</th>
                  <th className="p-4 font-medium text-right text-red-400">GS Commission</th>
                  <th className="p-4 font-medium text-right">Shipping Reimbursed</th>
                  <th className="p-4 font-medium text-right font-bold text-green-400">Net Payout</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-300">
                {orders.map(order => {
                  const payable = order.vendorPayables?.find(p => p.vendorId === user._id);
                  if (!payable) return null;

                  const gross = payable.grossAmount || 0;
                  const vat = payable.vatDeducted || 0;
                  const comm = payable.commission || 0;
                  const net = payable.netPayable || 0;
                  
                  // Calculate the shipping amount that was added to the net
                  const shippingReimbursed = net - (gross - vat - comm);

                  return (
                    <tr key={order._id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 text-xs">{new Date(order.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="p-4 font-mono text-xs text-[#b58b38]">{order.orderId}</td>
                      <td className="p-4 text-right">{formatMoney(gross)}</td>
                      <td className="p-4 text-right text-yellow-500/80">-{formatMoney(vat)}</td>
                      <td className="p-4 text-right text-red-400/80">-{formatMoney(comm)}</td>
                      <td className="p-4 text-right text-white">+{formatMoney(shippingReimbursed > 0 ? shippingReimbursed : 0)}</td>
                      <td className="p-4 text-right font-bold text-green-400">{formatMoney(net)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
