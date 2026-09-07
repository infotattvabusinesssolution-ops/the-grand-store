import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";
import Price from "../../components/ui/Price";
import {
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Sparkles,
  ShieldCheck,
  ShoppingBag,
  Gift,
  HelpCircle,
  RefreshCw,
  AlertCircle,
  Calendar,
  CheckCircle2,
} from "lucide-react";

export default function SuperCoinsWallet() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");

  const fetchWallet = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get("/super-coins/wallet");
      setWallet(res.data);
    } catch (err) {
      console.error("Failed to load Super Coins wallet", err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const filteredTransactions = (wallet?.transactions || []).filter((tx) => {
    if (filter === "all") return true;
    if (filter === "earned") return tx.type === "earned" && tx.status !== "pending";
    if (filter === "redeemed") return tx.type === "redeemed";
    if (filter === "pending") return tx.status === "pending";
    return true;
  });

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-[var(--color-gold)]/10 text-[var(--color-gold)] rounded-xl border border-[var(--color-gold)]/20 shadow-[0_0_15px_rgba(212,175,55,0.15)]">
              <Coins size={26} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif text-[var(--color-ivory)]">
              My <span className="text-gold-gradient">Super Coins</span>
            </h1>
          </div>
          <p className="text-sm text-[var(--color-ivory-muted)] font-light">
            Grand Store exclusive loyalty currency. Earn coins on purchases and redeem for instant discounts at checkout.
          </p>
        </div>

        <button
          onClick={() => fetchWallet(true)}
          disabled={refreshing}
          className="self-start sm:self-auto px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin text-[var(--color-gold)]" : ""} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center text-gold-gradient flex flex-col items-center gap-4">
          <Coins className="animate-pulse opacity-50" size={44} />
          <p>Loading your Super Coins wallet...</p>
        </div>
      ) : (
        <>
          {/* Main Balance Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Available Spendable Coins */}
            <div className="bg-gradient-to-br from-[#1b1710] via-[#100f0d] to-black border border-[var(--color-gold)]/30 rounded-2xl p-6 relative overflow-hidden shadow-[0_4px_24px_rgba(212,175,55,0.1)]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-gold)]/5 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex items-center justify-between text-xs text-[var(--color-ivory-muted)] uppercase tracking-widest mb-3">
                <span>Available Balance</span>
                <span className="p-1 rounded bg-[var(--color-gold)]/10 text-[var(--color-gold)]">
                  <Sparkles size={14} />
                </span>
              </div>
              <div className="text-4xl font-serif text-[var(--color-gold)] font-bold mb-1 flex items-baseline gap-2">
                <span>{(wallet?.availableCoins || 0).toLocaleString()}</span>
                <span className="text-xs font-sans uppercase tracking-widest text-white/50 font-normal">
                  Coins
                </span>
              </div>
              <div className="text-xs text-white/70 font-mono mt-2 flex items-center gap-1.5">
                <span>Spendable Value:</span>
                <strong className="text-white text-sm">
                  <Price amount={wallet?.availableRandValue || 0} />
                </strong>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-[var(--color-gold)]">
                <span>1 Coin = R{(wallet?.coinValue || 0.10).toFixed(2)}</span>
                <Link to="/shop" className="hover:underline flex items-center gap-1">
                  Spend Coins →
                </Link>
              </div>
            </div>

            {/* 2. Pending Clearance Coins */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-[var(--color-ivory-muted)] uppercase tracking-widest mb-3">
                <span>Pending Clearance</span>
                <span className="p-1 rounded bg-amber-500/10 text-amber-400">
                  <Clock size={14} />
                </span>
              </div>
              <div className="text-4xl font-serif text-white font-bold mb-1 flex items-baseline gap-2">
                <span>{(wallet?.pendingCoins || 0).toLocaleString()}</span>
                <span className="text-xs font-sans uppercase tracking-widest text-white/40 font-normal">
                  Coins
                </span>
              </div>
              <div className="text-xs text-white/50 font-mono mt-2 flex items-center gap-1.5">
                <span>Pending Value:</span>
                <strong className="text-white/80 text-sm">
                  <Price amount={wallet?.pendingRandValue || 0} />
                </strong>
              </div>
              <p className="mt-4 pt-3 border-t border-white/5 text-[11px] text-white/40">
                Activated upon delivery & 7-day return window completion.
              </p>
            </div>

            {/* 3. Expiring Soon & Expiry Rules */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs text-[var(--color-ivory-muted)] uppercase tracking-widest mb-3">
                <span>Expiring Soon (30d)</span>
                <span className={`p-1 rounded ${wallet?.expiringSoonCoins > 0 ? "bg-rose-500/10 text-rose-400" : "bg-white/5 text-white/40"}`}>
                  <Calendar size={14} />
                </span>
              </div>
              <div className={`text-4xl font-serif font-bold mb-1 flex items-baseline gap-2 ${wallet?.expiringSoonCoins > 0 ? "text-rose-400" : "text-white"}`}>
                <span>{(wallet?.expiringSoonCoins || 0).toLocaleString()}</span>
                <span className="text-xs font-sans uppercase tracking-widest text-white/40 font-normal">
                  Coins
                </span>
              </div>
              <div className="text-xs text-white/50 mt-2">
                Coins are valid for 12 months from issuance.
              </div>
              <p className="mt-4 pt-3 border-t border-white/5 text-[11px] text-white/40">
                Use your coins before they lapse to maximize checkout savings.
              </p>
            </div>
          </div>

          {/* How Super Coins Work - Rules & Benefits */}
          <div className="bg-white/[0.015] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h2 className="text-xl font-serif text-[var(--color-ivory)] flex items-center gap-2.5">
                <ShieldCheck className="text-[var(--color-gold)]" size={22} />
                How Grand Store Super Coins Work
              </h2>
              <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-[var(--color-gold)]/10 text-[var(--color-gold)] border border-[var(--color-gold)]/20">
                15% Margin Protected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-1.5">
                <div className="text-xs font-bold text-[var(--color-gold)] flex items-center gap-1.5">
                  <ShoppingBag size={14} /> Earn on Orders
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Earn 10 Super Coins for every R100 spent on eligible product subtotal (strictly excludes courier and taxes).
                </p>
              </div>

              <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-1.5">
                <div className="text-xs font-bold text-[var(--color-gold)] flex items-center gap-1.5">
                  <Coins size={14} /> 10% Checkout Cap
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Redeem coins for up to 10% off your eligible order value directly at checkout with 1 click.
                </p>
              </div>

              <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-1.5">
                <div className="text-xs font-bold text-[var(--color-gold)] flex items-center gap-1.5">
                  <ShieldCheck size={14} /> Safe Margin Shield
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Our automated margin protection engine ensures Grand Store's net contribution never drops below 15%.
                </p>
              </div>

              <div className="p-4 bg-black/40 rounded-xl border border-white/5 space-y-1.5">
                <div className="text-xs font-bold text-[var(--color-gold)] flex items-center gap-1.5">
                  <Gift size={14} /> Action Bonuses
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Earn coins on registration, profile completion, first order, reviews, friend referrals, and your birthday.
                </p>
              </div>
            </div>
          </div>

          {/* Activity Ledger / Transactions */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-serif text-[var(--color-ivory)]">Transaction History</h2>
                <p className="text-xs text-white/40">Audit trail of all coin issuances, redemptions, and clearances.</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-1 bg-white/[0.03] border border-white/10 rounded-xl self-start sm:self-auto">
                {[
                  { id: "all", label: "All" },
                  { id: "earned", label: "Earned" },
                  { id: "redeemed", label: "Redeemed" },
                  { id: "pending", label: "Pending" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      filter === tab.id
                        ? "bg-[var(--color-gold)] text-black font-bold shadow"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="py-16 text-center border border-white/5 rounded-2xl bg-white/[0.01]">
                <Coins size={36} className="mx-auto text-white/20 mb-3" />
                <h3 className="text-sm font-serif text-white mb-1">No Coin Transactions</h3>
                <p className="text-xs text-white/40 max-w-sm mx-auto">
                  {filter === "all"
                    ? "Start shopping or complete actions to earn your first Super Coins."
                    : `No transactions found matching "${filter}".`}
                </p>
                {filter === "all" && (
                  <Link
                    to="/shop"
                    className="mt-4 inline-block px-5 py-2.5 rounded-xl bg-[var(--color-gold)] text-black text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                  >
                    Explore Shop
                  </Link>
                )}
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden divide-y divide-white/5">
                {filteredTransactions.map((tx) => {
                  const isCredit = tx.type === "earned" || tx.type === "refund" || (tx.amount > 0 && tx.type === "admin_adjustment");
                  return (
                    <div
                      key={tx._id}
                      className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            tx.status === "pending"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : isCredit
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {tx.status === "pending" ? (
                            <Clock size={18} />
                          ) : isCredit ? (
                            <ArrowDownLeft size={18} />
                          ) : (
                            <ArrowUpRight size={18} />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="text-sm font-medium text-white truncate">
                            {tx.description || (isCredit ? "Super Coins Earned" : "Super Coins Redeemed")}
                          </div>
                          <div className="text-xs text-white/40 flex items-center gap-2 mt-0.5">
                            <span>
                              {new Date(tx.createdAt).toLocaleDateString("en-ZA", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                            {tx.orderId && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-white/20"></span>
                                <span className="font-mono text-[11px] text-[var(--color-gold)]/80">
                                  Order #{String(tx.orderId).slice(-6).toUpperCase()}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div
                          className={`text-sm sm:text-base font-mono font-bold ${
                            tx.status === "pending"
                              ? "text-amber-400"
                              : isCredit
                              ? "text-emerald-400"
                              : "text-rose-400"
                          }`}
                        >
                          {isCredit ? `+${tx.amount}` : `-${tx.amount}`} Coins
                        </div>
                        <div className="text-[11px] font-mono text-white/50">
                          {tx.status === "pending" ? (
                            <span className="text-amber-400">Pending</span>
                          ) : (
                            `R${(tx.amount * (wallet?.coinValue || 0.10)).toFixed(2)} value`
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
