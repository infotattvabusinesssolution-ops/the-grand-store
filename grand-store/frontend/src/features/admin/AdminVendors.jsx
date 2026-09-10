import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Search,
  Store,
  Wallet,
  Landmark,
  AlertCircle,
  Clock,
  XCircle,
  ExternalLink,
  RefreshCw,
  MessageSquare,
  BadgeCheck,
  Edit3
} from "lucide-react";
import api from "../../api";
import VendorPayoutModal from "./VendorPayoutModal";

const STATUS_STYLES = {
  approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  rejected: "border-red-500/30 bg-red-500/10 text-red-300",
  suspended: "border-orange-500/30 bg-orange-500/10 text-orange-300",
  pending_approval: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  draft: "border-white/15 bg-white/5 text-white/60",
};

const getOnboardingProgress = (vendor) => {
  const total = vendor.vendorType === "international" ? 9 : 10;
  const current = Math.min(total, Math.max(0, Number(vendor.onboardingStep) || 0));
  return { current, total, percent: Math.round((current / total) * 100) };
};

function StatusBadge({ status }) {
  const label = (status || "draft").replaceAll("_", " ");
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>
      {label}
    </span>
  );
}

function Metric({ icon: Icon, label, value, subtext, onClick, clickable, active }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-4 transition-all ${
        clickable ? 'cursor-pointer hover:border-[#c9a35b]/60' : ''
      } ${
        active
          ? 'border-[#c9a35b] bg-[#1a1710] shadow-[0_0_15px_rgba(201,163,91,0.15)]'
          : 'border-white/10 bg-[#121212]'
      }`}
    >
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-white/40">
        <span className="flex items-center gap-2">
          <Icon size={15} className="text-[#c9a35b]" />
          {label}
        </span>
        {clickable && <ArrowRight size={13} className="text-[#c9a35b] opacity-60" />}
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      {subtext && <div className="mt-1 text-[11px] text-white/40">{subtext}</div>}
    </div>
  );
}

export default function AdminVendors() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "payouts" ? "payouts" : "applications";

  const [vendors, setVendors] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [loadingPayouts, setLoadingPayouts] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Payout Filters & Modal State
  const [payoutStatusFilter, setPayoutStatusFilter] = useState("all");
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(amount || 0);
  };

  const fetchVendors = async () => {
    try {
      setLoadingVendors(true);
      const { data } = await api.get("/admin/vendors");
      setVendors(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load vendor applications.");
    } finally {
      setLoadingVendors(false);
    }
  };

  const fetchPayouts = async () => {
    try {
      setLoadingPayouts(true);
      const { data } = await api.get("/admin/payouts");
      setPayouts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load vendor payouts:", err);
    } finally {
      setLoadingPayouts(false);
    }
  };

  useEffect(() => {
    fetchVendors();
    fetchPayouts();
  }, []);

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
  };

  const openPayoutModal = (payout) => {
    setSelectedPayout(payout);
    setPayoutModalOpen(true);
  };

  const handlePayoutSuccess = (updatedTxn) => {
    setPayouts((prev) =>
      prev.map((p) => (p._id === updatedTxn._id ? { ...p, ...updatedTxn } : p))
    );
  };

  // Filtered Applications
  const filteredVendors = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return vendors;
    return vendors.filter((vendor) =>
      [
        vendor.businessInfo?.legalName,
        vendor.businessInfo?.tradingName,
        vendor.userId?.name,
        vendor.userId?.email,
        vendor.vendorType,
        vendor.status,
      ].some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [search, vendors]);

  // Filtered Payout Requests
  const filteredPayouts = useMemo(() => {
    return payouts.filter((payout) => {
      if (payoutStatusFilter !== "all") {
        if (payoutStatusFilter === "cleared" && !(payout.status === "cleared" || payout.status === "paid")) return false;
        if (payoutStatusFilter !== "cleared" && payout.status !== payoutStatusFilter) return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const vendorName = payout.businessInfo?.tradingName || payout.businessInfo?.legalName || payout.vendor?.name || "";
        const ref = payout.gsReference || "";
        const bankName = payout.payoutDetails?.bankName || "";
        const accNum = String(payout.payoutDetails?.accountNumber || "");
        const customMsg = payout.payoutDetails?.customMessage || "";
        return (
          vendorName.toLowerCase().includes(q) ||
          ref.toLowerCase().includes(q) ||
          bankName.toLowerCase().includes(q) ||
          accNum.includes(q) ||
          customMsg.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [payouts, payoutStatusFilter, search]);

  const pendingApplications = vendors.filter((vendor) => vendor.status === "pending_approval").length;
  const approvedVendors = vendors.filter((vendor) => vendor.status === "approved").length;

  const pendingPayoutsList = payouts.filter((p) => p.status === "pending");
  const delayedPayoutsList = payouts.filter((p) => p.status === "delayed");
  const totalPendingPayoutAmount = pendingPayoutsList.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

  return (
    <div className="min-h-full bg-[#090909] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Page Header */}
        <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c9a35b]">
              Vendor Management Workspace
            </p>
            <h1 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">
              {activeTab === "applications" ? "Vendor Applications" : "Vendor Payout Requests"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-white/50">
              {activeTab === "applications"
                ? "Review registrations, documents, KYC verification, and banking details in one place."
                : "Manage and authorize vendor withdrawals, set settlement statuses (Paid, Delayed, Pending), and dispatch custom messages."}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={activeTab === "applications" ? "Search vendor name or email..." : "Search payouts, ref, or bank..."}
                className="w-full rounded-lg border border-white/10 bg-[#121212] py-2.5 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#c9a35b]/70"
              />
            </div>

            <button
              onClick={() => {
                if (activeTab === "applications") fetchVendors();
                else fetchPayouts();
              }}
              title="Refresh Data"
              className="p-2.5 rounded-lg border border-white/10 bg-[#121212] text-white/60 hover:text-white hover:border-white/20 transition-colors cursor-pointer self-end sm:self-auto"
            >
              <RefreshCw size={16} className={(loadingVendors || loadingPayouts) ? "animate-spin" : ""} />
            </button>
          </div>
        </header>

        {/* NAVIGATION TABS: APPLICATIONS vs PAYOUT REQUESTS */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <button
            type="button"
            onClick={() => handleTabChange("applications")}
            className={`px-5 py-2.5 rounded-lg text-xs uppercase tracking-widest font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === "applications"
                ? "bg-[#c9a35b] text-black shadow-[0_0_15px_rgba(201,163,91,0.3)]"
                : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5"
            }`}
          >
            <Building2 size={15} />
            <span>Applications ({vendors.length})</span>
            {pendingApplications > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === "applications" ? "bg-black text-amber-300" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}>
                {pendingApplications} new
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("payouts")}
            className={`px-5 py-2.5 rounded-lg text-xs uppercase tracking-widest font-bold transition-all flex items-center gap-2.5 cursor-pointer ${
              activeTab === "payouts"
                ? "bg-[#c9a35b] text-black shadow-[0_0_15px_rgba(201,163,91,0.3)]"
                : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5"
            }`}
          >
            <Wallet size={15} />
            <span>Payout Requests ({payouts.length})</span>
            {pendingPayoutsList.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                activeTab === "payouts" ? "bg-black text-amber-300" : "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
              }`}>
                {pendingPayoutsList.length} pending
              </span>
            )}
          </button>
        </div>

        {/* METRICS ROW */}
        {activeTab === "applications" ? (
          <section className="grid gap-3 sm:grid-cols-4">
            <Metric icon={Store} label="Total Applications" value={vendors.length} />
            <Metric icon={Clock3} label="Awaiting Review" value={pendingApplications} />
            <Metric icon={CheckCircle2} label="Approved Vendors" value={approvedVendors} />
            <Metric
              icon={Wallet}
              label="Pending Payouts"
              value={`${pendingPayoutsList.length} Requests`}
              subtext={`${formatMoney(totalPendingPayoutAmount)} in queue`}
              clickable
              onClick={() => handleTabChange("payouts")}
            />
          </section>
        ) : (
          <section className="grid gap-3 sm:grid-cols-4">
            <Metric icon={Wallet} label="Total Payouts" value={payouts.length} />
            <Metric
              icon={Clock3}
              label="Pending Clearance"
              value={pendingPayoutsList.length}
              subtext={formatMoney(totalPendingPayoutAmount)}
              active={payoutStatusFilter === "pending"}
              clickable
              onClick={() => setPayoutStatusFilter("pending")}
            />
            <Metric
              icon={Clock}
              label="Delayed Payouts"
              value={delayedPayoutsList.length}
              subtext="Held safely in escrow"
              active={payoutStatusFilter === "delayed"}
              clickable
              onClick={() => setPayoutStatusFilter("delayed")}
            />
            <Metric
              icon={CheckCircle2}
              label="Disbursed & Cleared"
              value={payouts.filter(p => p.status === 'cleared' || p.status === 'paid').length}
              subtext="Settled via EFT"
              active={payoutStatusFilter === "cleared"}
              clickable
              onClick={() => setPayoutStatusFilter("cleared")}
            />
          </section>
        )}

        {/* TAB 1: VENDOR APPLICATIONS */}
        {activeTab === "applications" && (
          <section className="overflow-hidden rounded-xl border border-white/10 bg-[#101010]">
            {loadingVendors ? (
              <div className="flex min-h-64 items-center justify-center text-sm text-white/50">
                Loading vendor applications...
              </div>
            ) : error ? (
              <div className="m-5 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </div>
            ) : filteredVendors.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
                <Building2 size={30} className="text-white/25" />
                <p className="mt-3 font-medium text-white/70">No vendor applications found</p>
                <p className="mt-1 text-sm text-white/40">Try a different search term.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left">
                  <thead className="border-b border-white/10 bg-white/[0.025] text-[10px] uppercase tracking-[0.16em] text-white/35">
                    <tr>
                      <th className="px-5 py-4 font-medium">Applicant</th>
                      <th className="px-5 py-4 font-medium">Application</th>
                      <th className="px-5 py-4 font-medium">Status</th>
                      <th className="px-5 py-4 font-medium">Progress</th>
                      <th className="px-5 py-4 font-medium">Next Fee Due</th>
                      <th className="px-5 py-4 font-medium">Submitted</th>
                      <th className="px-5 py-4 text-right font-medium">Review</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.07]">
                    {filteredVendors.map((vendor) => {
                      const businessName =
                        vendor.businessInfo?.tradingName ||
                        vendor.businessInfo?.legalName ||
                        "Unnamed business";
                      const progress = getOnboardingProgress(vendor);
                      return (
                        <tr
                          key={vendor._id}
                          onClick={() => navigate(`/admin/vendors/${vendor._id}`)}
                          className="group cursor-pointer transition hover:bg-white/[0.035]"
                        >
                          <td className="px-5 py-4">
                            <div className="font-medium text-white">{businessName}</div>
                            <div className="mt-1 text-xs text-white/40">
                              {vendor.userId?.email || "No account email"}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="capitalize text-sm text-white/70">
                              {vendor.vendorType || "local"} vendor
                            </div>
                            <div className="mt-1 text-xs text-white/35">
                              {vendor.businessInfo?.registrationNumber || "No registration number"}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge status={vendor.status} />
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                                <div
                                  className="h-full rounded-full bg-[#c9a35b]"
                                  style={{ width: `${progress.percent}%` }}
                                />
                              </div>
                              <span className="text-xs text-white/50">
                                {progress.current}/{progress.total}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            {(() => {
                              const nextDue =
                                vendor.maintenanceFee?.nextDueAt || vendor.freeTrialExpiry;
                              if (!nextDue) return <span className="text-xs text-white/30">—</span>;
                              const d = new Date(nextDue);
                              if (isNaN(d.getTime())) return <span className="text-xs text-white/30">—</span>;
                              const now = new Date();
                              now.setHours(0, 0, 0, 0);
                              const dMid = new Date(d);
                              dMid.setHours(0, 0, 0, 0);
                              const diffDays = Math.round((dMid - now) / (1000 * 60 * 60 * 24));
                              return (
                                <div>
                                  <div className="text-xs font-medium text-[#d5b46c]">
                                    {d.toLocaleDateString()}
                                  </div>
                                  <div className="mt-0.5">
                                    {vendor.couponUsed &&
                                    vendor.freeTrialExpiry &&
                                    new Date(vendor.freeTrialExpiry) >= new Date() ? (
                                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                                        Voucher
                                      </span>
                                    ) : diffDays < 0 ? (
                                      <span className="inline-flex items-center rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
                                        {Math.abs(diffDays)}d overdue
                                      </span>
                                    ) : diffDays <= 7 ? (
                                      <span className="inline-flex items-center rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400">
                                        Due in {diffDays}d
                                      </span>
                                    ) : (
                                      <span className="text-[10px] text-white/40">
                                        In {diffDays} days
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-5 py-4 text-sm text-white/55">
                            {vendor.createdAt
                              ? new Date(vendor.createdAt).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate(`/admin/vendors/${vendor._id}`);
                              }}
                              className="inline-flex items-center gap-2 rounded-md border border-[#c9a35b]/35 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#d8b76f] transition hover:border-[#c9a35b] hover:bg-[#c9a35b]/10 cursor-pointer"
                            >
                              View application <ArrowRight size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* TAB 2: VENDOR PAYOUT REQUESTS */}
        {activeTab === "payouts" && (
          <div className="space-y-4">
            
            {/* Filter Pills Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#101010] p-4 rounded-xl border border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { key: "all", label: "All Requests", count: payouts.length },
                  { key: "pending", label: "Pending Review", count: pendingPayoutsList.length, color: "text-amber-300" },
                  { key: "delayed", label: "Delayed", count: delayedPayoutsList.length, color: "text-orange-400" },
                  { key: "cleared", label: "Disbursed (Paid)", count: payouts.filter(p => p.status === 'cleared' || p.status === 'paid').length, color: "text-emerald-400" },
                  { key: "failed", label: "Declined", count: payouts.filter(p => p.status === 'failed').length, color: "text-rose-400" }
                ].map((pill) => (
                  <button
                    key={pill.key}
                    type="button"
                    onClick={() => setPayoutStatusFilter(pill.key)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                      payoutStatusFilter === pill.key
                        ? "bg-[#c9a35b] text-black shadow-sm font-bold"
                        : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/5"
                    }`}
                  >
                    <span>{pill.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      payoutStatusFilter === pill.key ? "bg-black/20 text-black font-extrabold" : "bg-black/40 text-white/50"
                    }`}>
                      {pill.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="text-xs text-white/40">
                Showing {filteredPayouts.length} of {payouts.length} payouts
              </div>
            </div>

            {/* Payouts Table */}
            <section className="overflow-hidden rounded-xl border border-white/10 bg-[#101010]">
              {loadingPayouts ? (
                <div className="flex min-h-64 items-center justify-center text-sm text-white/50">
                  Loading payout requests...
                </div>
              ) : filteredPayouts.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
                  <Wallet size={36} className="text-white/20 mb-3" />
                  <p className="font-medium text-white/70">No payout requests found</p>
                  <p className="mt-1 text-sm text-white/40">
                    {payoutStatusFilter !== "all"
                      ? `No payouts found under "${payoutStatusFilter}" status.`
                      : "No vendor has submitted a withdrawal request yet."}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[960px] text-left">
                    <thead className="border-b border-white/10 bg-white/[0.025] text-[10px] uppercase tracking-[0.16em] text-white/35">
                      <tr>
                        <th className="px-5 py-4 font-medium">Vendor / Store</th>
                        <th className="px-5 py-4 font-medium">Date &amp; Ref</th>
                        <th className="px-5 py-4 font-medium">Destination Bank</th>
                        <th className="px-5 py-4 font-medium text-right">Amount</th>
                        <th className="px-5 py-4 font-medium">Status</th>
                        <th className="px-5 py-4 font-medium">Message &amp; Settlement</th>
                        <th className="px-5 py-4 text-right font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.07]">
                      {filteredPayouts.map((payout) => {
                        const bank = payout.payoutDetails || {};
                        const vendorName =
                          payout.businessInfo?.tradingName ||
                          payout.businessInfo?.legalName ||
                          payout.vendor?.name ||
                          bank.accountName ||
                          "Vendor";
                        const isCleared = payout.status === "cleared" || payout.status === "paid";
                        const isDelayed = payout.status === "delayed";
                        const isFailed = payout.status === "failed";

                        return (
                          <tr
                            key={payout._id}
                            className="group transition hover:bg-white/[0.035]"
                          >
                            <td className="px-5 py-4">
                              <div className="font-medium text-white flex items-center gap-2">
                                <span>{vendorName}</span>
                                {payout.vendor?._id && (
                                  <button
                                    type="button"
                                    onClick={() => navigate(`/admin/vendors/${payout.vendor._id}`)}
                                    title="View Vendor Profile"
                                    className="text-white/30 hover:text-[#c9a35b] transition-colors"
                                  >
                                    <ExternalLink size={12} />
                                  </button>
                                )}
                              </div>
                              <div className="text-xs text-white/40 mt-0.5">
                                {bank.accountName || "Account on record"}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <span className="font-mono text-xs text-[#c9a35b] block">
                                {payout.gsReference}
                              </span>
                              <span className="text-[10px] text-white/40 block mt-0.5">
                                {payout.createdAt ? new Date(payout.createdAt).toLocaleString() : "—"}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              <div className="text-xs text-white flex items-center gap-1.5 font-medium">
                                <Landmark size={13} className="text-[#c9a35b]" />
                                <span>{bank.bankName || "Bank"}</span>
                              </div>
                              <div className="text-[11px] text-white/40 font-mono mt-0.5">
                                •••• {String(bank.accountNumber || "").slice(-4)} • {bank.accountType || "Cheque"}
                              </div>
                            </td>

                            <td className="px-5 py-4 text-right">
                              <span className="font-serif font-bold text-[#e6c97a] text-sm">
                                {formatMoney(payout.amount)}
                              </span>
                            </td>

                            <td className="px-5 py-4">
                              {isCleared && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                                  <CheckCircle2 size={11} /> Disbursed
                                </span>
                              )}
                              {isDelayed && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-300">
                                  <Clock size={11} /> Delayed
                                </span>
                              )}
                              {payout.status === "pending" && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                                  <AlertCircle size={11} /> Pending Review
                                </span>
                              )}
                              {isFailed && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-rose-300">
                                  <XCircle size={11} /> Declined
                                </span>
                              )}
                            </td>

                            <td className="px-5 py-4 max-w-xs">
                              {bank.customMessage && (
                                <div className="text-amber-300 text-xs truncate" title={bank.customMessage}>
                                  💬 <span className="italic">"{bank.customMessage}"</span>
                                </div>
                              )}
                              {bank.adminReference && (
                                <div className="text-emerald-400 font-mono text-[11px] truncate mt-0.5">
                                  EFT: {bank.adminReference}
                                </div>
                              )}
                              {bank.rejectionReason && (
                                <div className="text-rose-400 text-xs truncate mt-0.5" title={bank.rejectionReason}>
                                  Reason: {bank.rejectionReason}
                                </div>
                              )}
                              {!bank.customMessage && !bank.adminReference && !bank.rejectionReason && (
                                <span className="text-white/25 text-xs">—</span>
                              )}
                            </td>

                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={() => openPayoutModal(payout)}
                                className="inline-flex items-center gap-1.5 rounded-md border border-[#c9a35b]/40 bg-[#c9a35b]/10 hover:bg-[#c9a35b]/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[#d8b76f] transition hover:border-[#c9a35b] cursor-pointer"
                              >
                                <Edit3 size={13} />
                                <span>Open Request</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* REUSABLE PAYOUT STATUS MODAL */}
        <VendorPayoutModal
          isOpen={payoutModalOpen}
          onClose={() => setPayoutModalOpen(false)}
          payout={selectedPayout}
          onSuccess={handlePayoutSuccess}
          formatMoney={formatMoney}
        />

      </div>
    </div>
  );
}
