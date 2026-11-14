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
  Edit3,
  Plus,
  Trash2,
  X,
  KeyRound,
  Mail,
  Lock
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

  // Add Vendor State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addingVendor, setAddingVendor] = useState(false);
  const [addError, setAddError] = useState("");
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password: "",
    storeName: "",
    vendorType: "local",
    sellingCapabilities: "domestic",
    phone: "",
    commissionRate: "10",
    status: "approved"
  });

  // Delete Vendor State
  const [vendorToDelete, setVendorToDelete] = useState(null);
  const [deleteOption, setDeleteOption] = useState("permanent");
  const [deleteProducts, setDeleteProducts] = useState(false);
  const [deletingVendor, setDeletingVendor] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Toggle Active State
  const [togglingVendorId, setTogglingVendorId] = useState(null);

  // Password Reset State
  const [vendorForPasswordReset, setVendorForPasswordReset] = useState(null);
  const [passwordResetMode, setPasswordResetMode] = useState("email");
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [resetPasswordWorking, setResetPasswordWorking] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState("");

  // Quick Edit Vendor State
  const [vendorForQuickEdit, setVendorForQuickEdit] = useState(null);
  const [editForm, setEditForm] = useState({
    storeName: "",
    name: "",
    phone: "",
    commissionRate: "10",
    vendorType: "local",
    sellingCapabilities: "domestic",
  });
  const [editingVendorWorking, setEditingVendorWorking] = useState(false);
  const [editVendorError, setEditVendorError] = useState("");

  // Notification Toast
  const [toastMessage, setToastMessage] = useState(null);

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

  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let pass = "";
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setAddForm(prev => ({ ...prev, password: pass }));
  };

  const handleCreateVendor = async (e) => {
    e.preventDefault();
    setAddError("");
    if (!addForm.storeName.trim() || !addForm.name.trim() || !addForm.email.trim() || !addForm.password.trim()) {
      setAddError("Store name, owner name, email, and password are required.");
      return;
    }
    if (addForm.password.length < 6) {
      setAddError("Password must be at least 6 characters.");
      return;
    }

    try {
      setAddingVendor(true);
      const { data } = await api.post("/admin/vendors", {
        storeName: addForm.storeName.trim(),
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        password: addForm.password,
        vendorType: addForm.vendorType,
        sellingCapabilities: addForm.sellingCapabilities,
        phone: addForm.phone.trim(),
        commissionRate: Number(addForm.commissionRate) || 10,
        status: addForm.status,
      });

      setIsAddModalOpen(false);
      setAddForm({
        name: "",
        email: "",
        password: "",
        storeName: "",
        vendorType: "local",
        sellingCapabilities: "domestic",
        phone: "",
        commissionRate: "10",
        status: "approved"
      });
      setToastMessage({
        type: "success",
        text: data.message || `Vendor "${addForm.storeName}" created successfully!`
      });
      fetchVendors();
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      setAddError(err.response?.data?.message || err.message || "Failed to create vendor.");
    } finally {
      setAddingVendor(false);
    }
  };

  const handleDeleteVendor = async () => {
    if (!vendorToDelete) return;
    setDeleteError("");
    try {
      setDeletingVendor(true);
      const { data } = await api.delete(`/admin/vendors/${vendorToDelete._id}`, {
        data: {
          deleteOption,
          deleteProducts,
        }
      });

      setVendorToDelete(null);
      setToastMessage({
        type: "success",
        text: data.message || "Vendor removed successfully."
      });
      fetchVendors();
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      setDeleteError(err.response?.data?.message || err.message || "Failed to remove vendor.");
    } finally {
      setDeletingVendor(false);
    }
  };

  const handleToggleActive = async (vendor) => {
    try {
      setTogglingVendorId(vendor._id);
      const isCurrentlyActive = vendor.status === "approved";
      const { data } = await api.put(`/admin/vendors/${vendor._id}/toggle-active`, {
        isActive: !isCurrentlyActive
      });

      setVendors((prev) =>
        prev.map((v) => (v._id === vendor._id ? (data.vendor || { ...v, status: !isCurrentlyActive ? "approved" : "suspended" }) : v))
      );
      setToastMessage({
        type: "success",
        text: data.message || `Vendor status updated.`
      });
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      setToastMessage({
        type: "error",
        text: err.response?.data?.message || err.message || "Failed to update vendor status."
      });
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setTogglingVendorId(null);
    }
  };

  const openPasswordReset = (vendor) => {
    setVendorForPasswordReset(vendor);
    setPasswordResetMode("email");
    setResetPasswordValue("");
    setResetPasswordError("");
  };

  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    if (!vendorForPasswordReset) return;
    setResetPasswordError("");

    if (passwordResetMode === "manual") {
      if (!resetPasswordValue || resetPasswordValue.length < 6) {
        setResetPasswordError("Password must be at least 6 characters.");
        return;
      }
    }

    try {
      setResetPasswordWorking(true);
      const { data } = await api.post(`/admin/vendors/${vendorForPasswordReset._id}/reset-password`, {
        action: passwordResetMode === "manual" ? "set_manual" : "send_email",
        password: resetPasswordValue
      });

      setToastMessage({
        type: "success",
        text: data.message || "Password action completed successfully."
      });
      setVendorForPasswordReset(null);
      setResetPasswordValue("");
      setTimeout(() => setToastMessage(null), 6000);
    } catch (err) {
      setResetPasswordError(err.response?.data?.message || err.message || "Failed to reset password.");
    } finally {
      setResetPasswordWorking(false);
    }
  };

  const openQuickEdit = (vendor) => {
    setVendorForQuickEdit(vendor);
    setEditVendorError("");
    setEditForm({
      storeName: vendor.businessInfo?.tradingName || vendor.businessInfo?.legalName || "",
      name: vendor.userId?.name || "",
      phone: vendor.userId?.phone || vendor.userId?.phoneNumber || "",
      commissionRate: String(vendor.tradeTerms?.commissionRate ?? "10"),
      vendorType: vendor.vendorType || "local",
      sellingCapabilities: vendor.sellingCapabilities || "domestic",
    });
  };

  const handleSaveQuickEdit = async (e) => {
    e.preventDefault();
    if (!vendorForQuickEdit) return;
    setEditVendorError("");

    try {
      setEditingVendorWorking(true);
      const { data } = await api.put(`/admin/vendors/${vendorForQuickEdit._id}/basic-info`, editForm);

      setVendors((prev) =>
        prev.map((v) => (v._id === vendorForQuickEdit._id ? (data.vendor || { ...v, ...editForm }) : v))
      );
      setToastMessage({
        type: "success",
        text: data.message || "Vendor details updated successfully."
      });
      setVendorForQuickEdit(null);
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      setEditVendorError(err.response?.data?.message || err.message || "Failed to update vendor details.");
    } finally {
      setEditingVendorWorking(false);
    }
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

        {/* TOAST NOTIFICATION */}
        {toastMessage && (
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm font-medium ${
            toastMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="shrink-0" />
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-white/40 hover:text-white transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        )}
        
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

            <button
              type="button"
              onClick={() => {
                setAddError("");
                setIsAddModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#c9a35b] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-black shadow-[0_0_15px_rgba(201,163,91,0.25)] hover:bg-[#d8b76f] transition-all cursor-pointer whitespace-nowrap self-stretch sm:self-auto"
            >
              <Plus size={16} /> Add Vendor
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
                      <th className="px-5 py-4 text-right font-medium">Actions</th>
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
                          <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                disabled={togglingVendorId === vendor._id}
                                onClick={() => handleToggleActive(vendor)}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  vendor.status === "approved" ? "bg-emerald-500" : "bg-white/20"
                                } ${togglingVendorId === vendor._id ? "opacity-50" : ""}`}
                                title={vendor.status === "approved" ? "Click to Pause (Deactivate)" : "Click to Activate"}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                    vendor.status === "approved" ? "translate-x-4" : "translate-x-0"
                                  }`}
                                />
                              </button>
                              <StatusBadge status={vendor.status} />
                            </div>
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
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => navigate(`/admin/vendors/${vendor._id}`)}
                                title="View Application Details"
                                className="inline-flex items-center gap-1 rounded-md border border-[#c9a35b]/35 px-2.5 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-[#d8b76f] transition hover:border-[#c9a35b] hover:bg-[#c9a35b]/10 cursor-pointer"
                              >
                                View <ArrowRight size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => openPasswordReset(vendor)}
                                title="Reset Vendor Password"
                                className="inline-flex items-center justify-center rounded-md border border-amber-500/30 bg-amber-500/10 p-1.5 text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/50 transition cursor-pointer"
                              >
                                <KeyRound size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => openQuickEdit(vendor)}
                                title="Quick Edit Vendor Details"
                                className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 p-1.5 text-white/70 hover:bg-white/10 hover:border-white/20 hover:text-white transition cursor-pointer"
                              >
                                <Edit3 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteError("");
                                  setVendorToDelete(vendor);
                                }}
                                title="Remove Vendor"
                                className="inline-flex items-center justify-center rounded-md border border-red-500/30 bg-red-500/10 p-1.5 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-300 transition cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
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

        {/* ADD VENDOR MODAL */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-xl my-8 rounded-2xl border border-[#c9a35b]/30 bg-[#121212] p-6 sm:p-8 shadow-2xl text-left">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#c9a35b]/10 border border-[#c9a35b]/30 flex items-center justify-center text-[#c9a35b]">
                    <Store size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-white">Add New Vendor</h3>
                    <p className="text-xs text-white/40">Directly onboard an authorized marketplace vendor</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {addError && (
                <div className="mt-4 flex items-center gap-2 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-300">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              <form onSubmit={handleCreateVendor} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                      Store / Brand Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cape Cellars Winery"
                      value={addForm.storeName}
                      onChange={(e) => setAddForm({ ...addForm, storeName: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#c9a35b] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                      Owner / Contact Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jean-Luc Picard"
                      value={addForm.name}
                      onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#c9a35b] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                      Email Address (Login) *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="vendor@brand.com"
                      value={addForm.email}
                      onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#c9a35b] outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                        Password *
                      </label>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="text-[10px] uppercase font-bold tracking-wider text-[#c9a35b] hover:underline cursor-pointer"
                      >
                        Generate
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="At least 6 characters"
                      value={addForm.password}
                      onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-white/25 focus:border-[#c9a35b] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                      Vendor Classification
                    </label>
                    <select
                      value={addForm.vendorType}
                      onChange={(e) => setAddForm({ ...addForm, vendorType: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-3.5 py-2.5 text-sm text-white focus:border-[#c9a35b] outline-none"
                    >
                      <option value="local">Domestic South Africa (Local)</option>
                      <option value="international">Global International Partner</option>
                      <option value="flagship">Flagship / Premier Estate</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                      Selling Scope
                    </label>
                    <select
                      value={addForm.sellingCapabilities}
                      onChange={(e) => setAddForm({ ...addForm, sellingCapabilities: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-3.5 py-2.5 text-sm text-white focus:border-[#c9a35b] outline-none"
                    >
                      <option value="domestic">Domestic Fulfillment Only</option>
                      <option value="international">Cross-Border International Only</option>
                      <option value="both">Both Domestic & Cross-Border</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                      Commission (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={addForm.commissionRate}
                      onChange={(e) => setAddForm({ ...addForm, commissionRate: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-3.5 py-2.5 text-sm text-white focus:border-[#c9a35b] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      placeholder="+27..."
                      value={addForm.phone}
                      onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#c9a35b] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                      Initial Status
                    </label>
                    <select
                      value={addForm.status}
                      onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-3.5 py-2.5 text-sm text-white focus:border-[#c9a35b] outline-none"
                    >
                      <option value="approved">Pre-Approved (Active)</option>
                      <option value="pending_approval">Pending Review</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2.5 rounded-lg border border-white/10 text-xs font-semibold text-white/70 hover:bg-white/5 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingVendor}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c9a35b] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#d8b76f] transition shadow-[0_0_15px_rgba(201,163,91,0.25)] disabled:opacity-50 cursor-pointer"
                  >
                    {addingVendor ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        <span>Create Vendor</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* REMOVE VENDOR CONFIRMATION MODAL */}
        {vendorToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-2xl border border-red-500/30 bg-[#141414] p-6 shadow-2xl text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-white">Remove Vendor</h3>
                  <p className="text-xs text-white/40">Modify vendor status or revoke marketplace access</p>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                <div className="text-sm font-medium text-white">
                  {vendorToDelete.businessInfo?.tradingName || vendorToDelete.businessInfo?.legalName || "Vendor"}
                </div>
                <div className="text-xs text-white/40 mt-0.5">
                  {vendorToDelete.userId?.email || "No email available"}
                </div>
              </div>

              {deleteError && (
                <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-300">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="mt-4 space-y-3">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50">
                  Removal Action
                </label>
                
                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  deleteOption === "permanent"
                    ? "border-red-500/50 bg-red-500/10 text-white"
                    : "border-white/10 bg-[#181818] text-white/70 hover:border-white/20"
                }`}>
                  <input
                    type="radio"
                    name="deleteOption"
                    value="permanent"
                    checked={deleteOption === "permanent"}
                    onChange={(e) => setDeleteOption(e.target.value)}
                    className="mt-1 accent-red-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-red-300">Permanent Removal</div>
                    <div className="text-[11px] text-white/40 mt-0.5">
                      Permanently removes the vendor account and deactivates all their products.
                    </div>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  deleteOption === "soft"
                    ? "border-amber-500/50 bg-amber-500/10 text-white"
                    : "border-white/10 bg-[#181818] text-white/70 hover:border-white/20"
                }`}>
                  <input
                    type="radio"
                    name="deleteOption"
                    value="soft"
                    checked={deleteOption === "soft"}
                    onChange={(e) => setDeleteOption(e.target.value)}
                    className="mt-1 accent-amber-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-amber-300">Soft Deactivation (Suspend)</div>
                    <div className="text-[11px] text-white/40 mt-0.5">
                      Suspends the vendor account and hides products from the storefront, keeping records safe.
                    </div>
                  </div>
                </label>

                {deleteOption === "permanent" && (
                  <label className="flex items-center gap-2.5 pt-1 text-xs text-white/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deleteProducts}
                      onChange={(e) => setDeleteProducts(e.target.checked)}
                      className="rounded accent-red-500"
                    />
                    <span>Also permanently delete all products of this vendor</span>
                  </label>
                )}
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setVendorToDelete(null)}
                  className="px-4 py-2 rounded-lg border border-white/10 text-xs font-semibold text-white/70 hover:bg-white/5 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deletingVendor}
                  onClick={handleDeleteVendor}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-red-700 transition disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                >
                  {deletingVendor ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>Removing...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={13} />
                      <span>Confirm Remove</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RESET PASSWORD MODAL */}
        {vendorForPasswordReset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-2xl border border-amber-500/30 bg-[#141414] p-6 shadow-2xl text-left">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-white">Reset Password</h3>
                    <p className="text-xs text-white/40">Manage authentication for this vendor</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVendorForPasswordReset(null)}
                  className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-4 p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                <div className="text-sm font-medium text-white">
                  {vendorForPasswordReset.businessInfo?.tradingName || vendorForPasswordReset.businessInfo?.legalName || "Vendor"}
                </div>
                <div className="text-xs text-white/40 mt-0.5">
                  {vendorForPasswordReset.userId?.email || "No email available"}
                </div>
              </div>

              {resetPasswordError && (
                <div className="mt-3 flex items-center gap-2 p-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-300">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{resetPasswordError}</span>
                </div>
              )}

              {/* Tabs */}
              <div className="mt-5 grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setPasswordResetMode("email")}
                  className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition cursor-pointer ${
                    passwordResetMode === "email"
                      ? "bg-[#c9a35b] text-black shadow"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  Email Reset Link
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPasswordResetMode("manual");
                    if (!resetPasswordValue) {
                      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
                      let pass = "";
                      for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
                      setResetPasswordValue(pass);
                    }
                  }}
                  className={`py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition cursor-pointer ${
                    passwordResetMode === "manual"
                      ? "bg-[#c9a35b] text-black shadow"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  Set Temporary Password
                </button>
              </div>

              {passwordResetMode === "email" ? (
                <div className="mt-5 space-y-4">
                  <p className="text-xs text-white/60 leading-5">
                    Clicking below will dispatch a secure, 1-hour password reset link to <strong>{vendorForPasswordReset.userId?.email}</strong>.
                  </p>
                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setVendorForPasswordReset(null)}
                      className="px-4 py-2 rounded-lg border border-white/10 text-xs font-semibold text-white/70 hover:bg-white/5 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={resetPasswordWorking}
                      onClick={handleResetPassword}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c9a35b] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#d8b76f] transition disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(201,163,91,0.2)]"
                    >
                      {resetPasswordWorking ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <>
                          <Mail size={14} />
                          <span>Send Reset Email</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="mt-5 space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
                        New Temporary Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
                          let pass = "";
                          for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
                          setResetPasswordValue(pass);
                        }}
                        className="text-[10px] uppercase font-bold tracking-wider text-[#c9a35b] hover:underline cursor-pointer"
                      >
                        Regenerate
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={resetPasswordValue}
                      onChange={(e) => setResetPasswordValue(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-white/25 focus:border-[#c9a35b] outline-none"
                    />
                    <p className="mt-2 text-[11px] text-white/40 flex items-center gap-1.5">
                      <Lock size={12} className="text-emerald-400" />
                      <span>Vendor must change this upon their next login.</span>
                    </p>
                  </div>

                  <div className="pt-2 flex justify-end gap-3 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setVendorForPasswordReset(null)}
                      className="px-4 py-2 rounded-lg border border-white/10 text-xs font-semibold text-white/70 hover:bg-white/5 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={resetPasswordWorking}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#c9a35b] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#d8b76f] transition disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(201,163,91,0.2)]"
                    >
                      {resetPasswordWorking ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound size={14} />
                          <span>Set Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* QUICK EDIT VENDOR MODAL */}
        {vendorForQuickEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
            <div className="relative w-full max-w-lg my-8 rounded-2xl border border-white/15 bg-[#141414] p-6 shadow-2xl text-left">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#c9a35b]">
                    <Edit3 size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-white">Edit Vendor Profile</h3>
                    <p className="text-xs text-white/40">{vendorForQuickEdit.userId?.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVendorForQuickEdit(null)}
                  className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {editVendorError && (
                <div className="mt-4 flex items-center gap-2 p-2.5 rounded-lg border border-red-500/30 bg-red-500/10 text-xs text-red-300">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{editVendorError}</span>
                </div>
              )}

              <form onSubmit={handleSaveQuickEdit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                    Store / Brand Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.storeName}
                    onChange={(e) => setEditForm({ ...editForm, storeName: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-3.5 py-2 text-sm text-white focus:border-[#c9a35b] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                      Owner Name
                    </label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-3.5 py-2 text-sm text-white focus:border-[#c9a35b] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-3.5 py-2 text-sm text-white focus:border-[#c9a35b] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                      Commission (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editForm.commissionRate}
                      onChange={(e) => setEditForm({ ...editForm, commissionRate: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-3.5 py-2 text-sm text-white focus:border-[#c9a35b] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                      Classification
                    </label>
                    <select
                      value={editForm.vendorType}
                      onChange={(e) => setEditForm({ ...editForm, vendorType: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-3.5 py-2 text-sm text-white focus:border-[#c9a35b] outline-none"
                    >
                      <option value="local">Domestic Local</option>
                      <option value="international">International</option>
                      <option value="flagship">Flagship Partner</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                      Scope
                    </label>
                    <select
                      value={editForm.sellingCapabilities}
                      onChange={(e) => setEditForm({ ...editForm, sellingCapabilities: e.target.value })}
                      className="w-full rounded-lg border border-white/10 bg-[#1a1a1a] px-3.5 py-2 text-sm text-white focus:border-[#c9a35b] outline-none"
                    >
                      <option value="domestic">Domestic</option>
                      <option value="international">International</option>
                      <option value="both">Both</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setVendorForQuickEdit(null)}
                    className="px-4 py-2 rounded-lg border border-white/10 text-xs font-semibold text-white/70 hover:bg-white/5 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editingVendorWorking}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#c9a35b] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#d8b76f] transition disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(201,163,91,0.2)]"
                  >
                    {editingVendorWorking ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
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
