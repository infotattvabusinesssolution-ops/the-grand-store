import React, { useCallback, useMemo, useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Building2,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Edit3,
  ExternalLink,
  FileCheck2,
  FileText,
  Globe2,
  Landmark,
  Mail,
  PackageCheck,
  Phone,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Store,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import api from "../../api";

const STATUS_STYLES = {
  approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  rejected: "border-red-500/30 bg-red-500/10 text-red-300",
  suspended: "border-orange-500/30 bg-orange-500/10 text-orange-300",
  pending_approval: "border-amber-500/30 bg-amber-500/10 text-amber-200",
  draft: "border-white/15 bg-white/5 text-white/60",
};

const formatDate = (value, withTime = false) => {
  if (!value) return "Not provided";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return withTime ? date.toLocaleString() : date.toLocaleDateString();
};

const present = (value) => value !== undefined && value !== null && value !== "";
const LOCAL_STEP_NAMES = ["Not started", "Account", "Business", "KYC", "Tax", "Licence", "Customs", "Banking", "Products", "Delivery", "Agreement"];
const INTERNATIONAL_STEP_NAMES = ["Not started", "Account", "Business", "Credentials", "Market", "Logistics", "Story", "Banking", "Products", "Agreement"];

const getOnboardingProgress = (vendor) => {
  const international = vendor.vendorType === "international";
  const total = international ? 9 : 10;
  const current = Math.min(total, Math.max(0, Number(vendor.onboardingStep) || 0));
  const names = international ? INTERNATIONAL_STEP_NAMES : LOCAL_STEP_NAMES;
  return {
    current,
    total,
    percent: Math.round((current / total) * 100),
    label: names[current] || "Application progress",
  };
};

const show = (value) => {
  if (!present(value)) return "Not provided";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "Not provided";
  return String(value);
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] ${STATUS_STYLES[status] || STATUS_STYLES.draft}`}>
      {(status || "draft").replaceAll("_", " ")}
    </span>
  );
}

function SummaryCard({ icon: Icon, label, children }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#111] p-4">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
        <Icon size={15} className="text-[#c9a35b]" /> {label}
      </div>
      <div className="mt-2 text-lg font-semibold text-white">{children}</div>
    </div>
  );
}

function Section({ icon: Icon, title, description, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-[#101010]">
      <div className="flex items-start gap-3 border-b border-white/[0.08] px-5 py-4">
        <span className="rounded-lg bg-[#c9a35b]/10 p-2 text-[#d5b46c]"><Icon size={18} /></span>
        <div>
          <h2 className="font-serif text-xl font-semibold text-white">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-white/40">{description}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Fields({ items }) {
  return (
    <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
      {items.map(({ label, value, wide }) => (
        <div key={label} className={wide ? "sm:col-span-2" : ""}>
          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">{label}</dt>
          <dd className={`mt-1.5 break-words text-sm ${present(value) ? "text-white/80" : "italic text-white/30"}`}>{show(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function DocumentLink({ label, url }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.08] bg-white/[0.025] p-3">
      <div className="flex min-w-0 items-center gap-3">
        <FileText size={17} className={url ? "shrink-0 text-[#c9a35b]" : "shrink-0 text-white/20"} />
        <div className="min-w-0">
          <p className="truncate text-sm text-white/75">{label}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-white/30">{url ? "Uploaded" : "Not uploaded"}</p>
        </div>
      </div>
      {url && (
        <a href={url} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[#c9a35b]/30 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#d6b66f] hover:bg-[#c9a35b]/10">
          Open <ExternalLink size={12} />
        </a>
      )}
    </div>
  );
}

export default function AdminVendorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [fee, setFee] = useState("2500");
  const [reason, setReason] = useState("");
  const [working, setWorking] = useState("");

  const [editingSchedule, setEditingSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleStatus, setScheduleStatus] = useState("paid");
  const [scheduleAmount, setScheduleAmount] = useState("500");
  const [scheduleWorking, setScheduleWorking] = useState(false);

  const fetchVendor = useCallback(async () => {
    try {
      setError("");
      const { data } = await api.get(`/admin/vendors/${id}`);
      setVendor(data);
      setFee(String(data.registrationFee ?? 2500));
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load this vendor application.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchVendor(); }, [fetchVendor]);

  useEffect(() => {
    if (vendor?.maintenanceFee?.nextDueAt) {
      const d = new Date(vendor.maintenanceFee.nextDueAt);
      if (!isNaN(d.getTime())) {
        setScheduleDate(d.toISOString().slice(0, 10));
      }
    } else if (vendor?.freeTrialExpiry) {
      const d = new Date(vendor.freeTrialExpiry);
      if (!isNaN(d.getTime())) {
        setScheduleDate(d.toISOString().slice(0, 10));
      }
    } else {
      const d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      setScheduleDate(d.toISOString().slice(0, 10));
    }
    if (vendor?.maintenanceFee?.status) {
      setScheduleStatus(vendor.maintenanceFee.status);
    }
    if (vendor?.maintenanceFee?.amount !== undefined) {
      setScheduleAmount(String(vendor.maintenanceFee.amount));
    }
  }, [vendor]);

  const applyDateOffset = (days) => {
    const base = scheduleDate ? new Date(scheduleDate) : new Date();
    const target = isNaN(base.getTime()) ? new Date() : base;
    target.setDate(target.getDate() + days);
    setScheduleDate(target.toISOString().slice(0, 10));
  };

  const saveMaintenanceSchedule = async () => {
    if (!scheduleDate) {
      setError("Please select a valid next maintenance fee date.");
      return;
    }
    try {
      setScheduleWorking(true);
      setError("");
      setMessage("");
      await api.put(`/admin/vendors/${id}/maintenance-fee`, {
        nextDueAt: scheduleDate,
        status: scheduleStatus,
        amount: Number(scheduleAmount) || 500,
      });
      setMessage("Next maintenance fee date and schedule updated successfully.");
      setEditingSchedule(false);
      await fetchVendor();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update maintenance fee schedule.");
    } finally {
      setScheduleWorking(false);
    }
  };

  const nextFeeDate = vendor?.maintenanceFee?.nextDueAt || vendor?.freeTrialExpiry || null;
  const isTrialActive = Boolean(vendor?.couponUsed && vendor?.freeTrialExpiry && new Date(vendor.freeTrialExpiry) >= new Date());

  const getDaysDiff = (targetDate) => {
    if (!targetDate) return null;
    const target = new Date(targetDate);
    if (isNaN(target.getTime())) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const targetMid = new Date(target);
    targetMid.setHours(0, 0, 0, 0);
    const diffTime = targetMid.getTime() - now.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysDiff = getDaysDiff(nextFeeDate);

  const updateStatus = async (status) => {
    if (status === "approved" && (!fee || Number(fee) < 0)) {
      setError("Enter a valid registration fee before approving.");
      return;
    }
    if (status === "rejected" && !reason.trim()) {
      setError("Add a reason so the applicant receives a useful decision email.");
      return;
    }
    const labels = { approved: "approve", rejected: "reject", suspended: "suspend", pending_approval: "return to review" };
    if (!window.confirm(`Are you sure you want to ${labels[status]} this vendor?`)) return;
    try {
      setWorking(status);
      setError("");
      setMessage("");
      await api.put(`/admin/vendors/${id}/status`, {
        status,
        reason: reason.trim(),
        ...(status === "approved" ? { registrationFee: Number(fee) } : {}),
      });
      setMessage(`Vendor application updated to ${status.replaceAll("_", " ")}.`);
      await fetchVendor();
    } catch (err) {
      setError(err.response?.data?.message || "The vendor status could not be updated.");
    } finally {
      setWorking("");
    }
  };

  const sendPaymentReminder = async () => {
    try {
      setWorking("reminder");
      setError("");
      setMessage("");
      await api.post(`/admin/vendors/${id}/remind-payment`);
      setMessage("Payment reminder sent to vendor.");
      await fetchVendor();
    } catch (err) {
      setError(err.response?.data?.message || "Could not send payment reminder.");
    } finally {
      setWorking("");
    }
  };

  const updatePaymentStatus = async (status) => {
    try {
      setWorking("payment");
      setError("");
      setMessage("");
      await api.put(`/admin/vendors/${id}/payment-status`, { paymentStatus: status });
      setMessage(`Payment status updated to ${status}.`);
      await fetchVendor();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update payment status.");
    } finally {
      setWorking("");
    }
  };

  const documents = useMemo(() => vendor ? [
    ["Identity document", vendor.kycInfo?.idDocumentUrl],
    ["Tax clearance", vendor.taxInfo?.taxClearanceUrl],
    ["Liquor licence", vendor.licenceInfo?.licenceDocumentUrl],
    ["Bank confirmation", vendor.bankingInfo?.bankConfirmationUrl],
    ["Export document", vendor.customsInfo?.exportDocumentUrl],
    ["Home-country licence", vendor.credentialsInfo?.homeCountryLicence],
    ["Certificates", vendor.credentialsInfo?.certificates],
  ] : [], [vendor]);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center bg-[#090909] text-sm text-white/50">Loading vendor application...</div>;

  if (error && !vendor) {
    return (
      <div className="min-h-full bg-[#090909] p-6 text-white">
        <div className="mx-auto max-w-xl rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center">
          <AlertCircle className="mx-auto text-red-300" />
          <p className="mt-3 text-red-100">{error}</p>
          <button onClick={() => navigate("/admin/vendors")} className="mt-5 text-sm font-semibold text-[#d5b46c]">Back to vendors</button>
        </div>
      </div>
    );
  }

  const business = vendor.businessInfo || {};
  const account = vendor.userId || {};
  const address = business.address || {};
  const pickup = vendor.shippingProfile?.pickupAddress || {};
  const businessName = business.tradingName || business.legalName || "Unnamed business";
  const onboarding = getOnboardingProgress(vendor);

  return (
    <div className="min-h-full bg-[#090909] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/admin/vendors" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/45 transition hover:text-[#d5b46c]">
          <ArrowLeft size={15} /> All vendor applications
        </Link>

        <header className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#17140e] via-[#111] to-[#0e0e0e] p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
                {business.logoUrl ? <img src={business.logoUrl} alt="" className="h-full w-full object-cover" /> : <Store className="text-[#c9a35b]" />}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><StatusBadge status={vendor.status} /><span className="text-xs capitalize text-white/40">{vendor.vendorType || "local"} vendor</span></div>
                <h1 className="mt-3 break-words font-serif text-3xl font-semibold sm:text-4xl">{businessName}</h1>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/50">
                  <span className="inline-flex items-center gap-2"><UserRound size={14} /> {account.name || vendor.kycInfo?.directorName || "Applicant not provided"}</span>
                  <span className="inline-flex items-center gap-2"><Mail size={14} /> {account.email || "Email not provided"}</span>
                  {vendor.kycInfo?.contactNumber && <span className="inline-flex items-center gap-2"><Phone size={14} /> {vendor.kycInfo.contactNumber}</span>}
                </div>
              </div>
            </div>
            <div className="min-w-[220px]">
              <div className="flex justify-between text-xs text-white/45"><span>Onboarding progress</span><span>{onboarding.percent}%</span></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#c9a35b]" style={{ width: `${onboarding.percent}%` }} /></div>
              <p className="mt-2 text-right text-[10px] uppercase tracking-[0.12em] text-white/30">{onboarding.label} · Step {onboarding.current} of {onboarding.total}</p>
            </div>
          </div>
        </header>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <SummaryCard icon={PackageCheck} label="Progress">{onboarding.percent}% complete</SummaryCard>
          <SummaryCard icon={CircleDollarSign} label="Subscription">
            {vendor.couponUsed && vendor.freeTrialExpiry ? (
              <div className="text-xs">
                <span className="inline-block font-semibold text-emerald-400">
                  {new Date(vendor.freeTrialExpiry) >= new Date() ? "Voucher Active" : "Voucher Expired"}
                </span>
                <p className="mt-1 text-white/70">
                  Code: <span className="font-mono text-[#d5b46c]">{vendor.couponUsed}</span>
                </p>
                {vendor.couponRedeemedAt && (
                  <p className="mt-0.5 text-[11px] text-white/50">
                    Redeemed on {formatDate(vendor.couponRedeemedAt)}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-[#d5b46c] font-medium">
                  Next fee: {formatDate(nextFeeDate)}
                </p>
              </div>
            ) : vendor.paymentStatus === "paid" ? (
              <div className="text-xs">
                <span className="inline-block font-semibold text-emerald-400">Paid Active</span>
                <p className="mt-1 text-white/70">
                  Paid on {formatDate(vendor.paidAt || vendor.maintenanceFee?.lastPaidAt || vendor.updatedAt)}
                </p>
                <p className="mt-1 text-[11px] text-[#d5b46c] font-medium">
                  Next fee: {formatDate(nextFeeDate)}
                </p>
              </div>
            ) : vendor.paymentStatus === "awaiting_verification" ? (
              <div>
                <span className="text-sm font-semibold capitalize text-amber-300">
                  Awaiting Verification
                </span>
                <p className="mt-1 text-[11px] text-white/40">
                  Proof of payment uploaded
                </p>
              </div>
            ) : (
              <div>
                <span className="text-sm font-semibold capitalize text-amber-300">
                  {vendor.paymentStatus || "Unpaid"}
                </span>
                <p className="mt-1 text-[11px] text-white/40">
                  Pending payment or voucher redemption
                </p>
              </div>
            )}
          </SummaryCard>

          <SummaryCard icon={Calendar} label="Next Maintenance Fee">
            <div className="text-xs">
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-base font-semibold text-[#d5b46c]">
                  {nextFeeDate ? formatDate(nextFeeDate) : "Not scheduled"}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {daysDiff !== null ? (
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    daysDiff < 0
                      ? "border border-red-500/30 bg-red-500/15 text-red-300"
                      : daysDiff <= 7
                        ? "border border-amber-500/30 bg-amber-500/15 text-amber-300"
                        : "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                  }`}>
                    {daysDiff < 0
                      ? `${Math.abs(daysDiff)}d overdue`
                      : daysDiff === 0
                        ? "Due today"
                        : `${daysDiff} days left`}
                  </span>
                ) : null}
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/60">
                  R {Number(vendor.maintenanceFee?.amount || 500).toLocaleString()}/mo
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditingSchedule((prev) => !prev)}
                className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-[#c9a35b] hover:text-[#e0be78] transition"
              >
                <Edit3 size={11} /> {editingSchedule ? "Close editor" : "Change date"}
              </button>
            </div>
          </SummaryCard>

          <SummaryCard icon={Banknote} label="Registration fee">R {Number(vendor.registrationFee || 0).toLocaleString()}</SummaryCard>
          <SummaryCard icon={CalendarDays} label="Application created">{formatDate(vendor.createdAt)}</SummaryCard>
        </div>

        {(error || message) && (
          <div className={`mt-4 flex items-start gap-3 rounded-lg border p-4 text-sm ${error ? "border-red-500/20 bg-red-500/10 text-red-100" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"}`}>
            {error ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}{error || message}
          </div>
        )}

        <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <main className="space-y-5">
            <Section icon={Building2} title="Business information" description="Company identity and registered address">
              <Fields items={[
                { label: "Legal name", value: business.legalName }, { label: "Trading name", value: business.tradingName },
                { label: "Registration number", value: business.registrationNumber }, { label: "Business type", value: business.businessType },
                { label: "Address", value: [address.street, address.city, address.province, address.postalCode, address.country].filter(Boolean).join(", "), wide: true },
              ]} />
            </Section>

            <Section icon={UserRound} title="Applicant & identity" description="Director contact and KYC details">
              <Fields items={[
                { label: "Account holder", value: account.name }, { label: "Account email", value: account.email },
                { label: "Director / representative", value: vendor.kycInfo?.directorName }, { label: "Contact number", value: vendor.kycInfo?.contactNumber },
                { label: "Identity number", value: vendor.kycInfo?.idNumber }, { label: "Email verified", value: account.isEmailVerified },
              ]} />
            </Section>

            <Section icon={ShieldCheck} title="Tax & licence" description="Compliance information supplied during registration">
              <Fields items={[
                { label: "Tax number", value: vendor.taxInfo?.taxNumber }, { label: "VAT number", value: vendor.taxInfo?.vatNumber },
                { label: "Licence number", value: vendor.licenceInfo?.licenceNumber }, { label: "Licence type", value: vendor.licenceInfo?.licenceType },
                { label: "Licence expiry", value: formatDate(vendor.licenceInfo?.expiryDate) }, { label: "Export code", value: vendor.customsInfo?.exportCode },
              ]} />
            </Section>

            <Section icon={Landmark} title="Banking information" description="Payout account supplied by the applicant">
              <Fields items={[
                { label: "Bank", value: vendor.bankingInfo?.bankName }, { label: "Account name", value: vendor.bankingInfo?.accountName },
                { label: "Account number", value: vendor.bankingInfo?.accountNumber }, { label: "Branch code", value: vendor.bankingInfo?.branchCode },
                { label: "SWIFT code", value: vendor.bankingInfo?.swiftCode }, { label: "Payout preference", value: vendor.bankingInfo?.payoutPreference },
              ]} />
            </Section>

            <Section icon={CreditCard} title="Recurring Maintenance & Payment History" description="Monthly platform maintenance fee schedule and completed payments">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
                    <span className="text-[10px] uppercase tracking-wider text-white/40">Fee Status</span>
                    <div className="mt-1 flex items-center gap-2">
                      {vendor.maintenanceFee?.status === "overdue" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-xs font-bold text-red-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> Overdue
                        </span>
                      ) : vendor.maintenanceFee?.status === "due" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" /> Due
                        </span>
                      ) : vendor.couponUsed && vendor.freeTrialExpiry && new Date(vendor.freeTrialExpiry) >= new Date() ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-300">
                          Trial Active
                        </span>
                      ) : vendor.paymentStatus === "paid" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-bold text-emerald-300">
                          Active & Covered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-xs font-bold text-white/60">
                          Unpaid
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
                    <span className="text-[10px] uppercase tracking-wider text-white/40">Monthly Rate</span>
                    <div className="mt-1 font-serif text-lg font-semibold text-[#d5b46c]">
                      R {Number(vendor.maintenanceFee?.amount || 500).toLocaleString()}<span className="text-xs font-normal text-white/40"> / mo</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-black/40 p-3.5">
                    <span className="text-[10px] uppercase tracking-wider text-white/40">Last Paid</span>
                    <div className="mt-1 text-sm font-medium text-white/90">
                      {vendor.maintenanceFee?.lastPaidAt || vendor.paidAt
                        ? formatDate(vendor.maintenanceFee?.lastPaidAt || vendor.paidAt)
                        : "Not yet paid"}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between rounded-xl border border-[#c9a35b]/30 bg-gradient-to-br from-[#1b1915] to-black/60 p-3.5">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#d5b46c]">Next Maintenance Due</span>
                        {daysDiff !== null && (
                          <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                            daysDiff < 0
                              ? "bg-red-500/20 text-red-300"
                              : daysDiff <= 7
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-emerald-500/20 text-emerald-300"
                          }`}>
                            {daysDiff < 0 ? `${Math.abs(daysDiff)}d overdue` : daysDiff === 0 ? "Due today" : `${daysDiff}d left`}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 font-serif text-lg font-semibold text-[#f3dfad]">
                        {nextFeeDate ? formatDate(nextFeeDate) : "Pending initial payment"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingSchedule((prev) => !prev)}
                      className="mt-2 inline-flex items-center gap-1.5 self-start rounded-md border border-[#c9a35b]/40 bg-[#c9a35b]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#e6c985] hover:bg-[#c9a35b]/20 transition"
                    >
                      <Edit3 size={11} /> {editingSchedule ? "Hide editor" : "Adjust Date"}
                    </button>
                  </div>
                </div>

                {/* Interactive Next Maintenance Fee & Schedule Editor */}
                {editingSchedule && (
                  <div className="rounded-xl border border-[#c9a35b]/30 bg-[#14120e] p-4 text-white shadow-xl transition-all">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-[#c9a35b]" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#e8c982]">
                          Manage Next Maintenance Fee Schedule
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingSchedule(false)}
                        className="rounded p-1 text-white/40 hover:bg-white/10 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      {/* Date Picker */}
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                          Next Maintenance Fee Due Date *
                        </label>
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/60 px-3 py-2 text-xs text-white outline-none focus:border-[#c9a35b] transition"
                        />
                        {/* Quick Offset Buttons */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => applyDateOffset(30)}
                            className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/70 hover:bg-[#c9a35b]/20 hover:text-[#d5b46c] transition"
                          >
                            +30 Days
                          </button>
                          <button
                            type="button"
                            onClick={() => applyDateOffset(60)}
                            className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/70 hover:bg-[#c9a35b]/20 hover:text-[#d5b46c] transition"
                          >
                            +60 Days
                          </button>
                          <button
                            type="button"
                            onClick={() => applyDateOffset(90)}
                            className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/70 hover:bg-[#c9a35b]/20 hover:text-[#d5b46c] transition"
                          >
                            +90 Days
                          </button>
                          <button
                            type="button"
                            onClick={() => applyDateOffset(365)}
                            className="rounded border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-white/70 hover:bg-[#c9a35b]/20 hover:text-[#d5b46c] transition"
                          >
                            +1 Year
                          </button>
                        </div>
                      </div>

                      {/* Status Selector */}
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                          Maintenance Fee Status
                        </label>
                        <select
                          value={scheduleStatus}
                          onChange={(e) => setScheduleStatus(e.target.value)}
                          className="mt-1.5 w-full rounded-lg border border-white/15 bg-black/60 px-3 py-2 text-xs text-white outline-none focus:border-[#c9a35b] transition"
                        >
                          <option value="paid">Paid / Active</option>
                          <option value="due">Due for Payment</option>
                          <option value="overdue">Overdue</option>
                          <option value="grace_period">Grace Period</option>
                        </select>
                        <p className="mt-2 text-[10px] text-white/40">
                          Determines vendor store visibility & billing reminders.
                        </p>
                      </div>

                      {/* Fee Amount */}
                      <div>
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                          Monthly Fee Rate (ZAR)
                        </label>
                        <div className="relative mt-1.5">
                          <span className="absolute left-3 top-2 text-xs text-white/40">R</span>
                          <input
                            type="number"
                            min="0"
                            value={scheduleAmount}
                            onChange={(e) => setScheduleAmount(e.target.value)}
                            className="w-full rounded-lg border border-white/15 bg-black/60 pl-8 pr-3 py-2 text-xs text-white outline-none focus:border-[#c9a35b] transition"
                          />
                        </div>
                        <p className="mt-2 text-[10px] text-white/40">
                          Standard monthly platform fee (default R 500).
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-2 border-t border-white/10 pt-3">
                      <button
                        type="button"
                        onClick={() => setEditingSchedule(false)}
                        className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:bg-white/5 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={scheduleWorking}
                        onClick={saveMaintenanceSchedule}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#c9a35b] px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-black hover:bg-[#d8b76f] disabled:opacity-50 transition"
                      >
                        <Save size={13} /> {scheduleWorking ? "Saving..." : "Save Next Fee Date"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Recurring Payment Records Table */}
                <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                  <div className="border-b border-white/10 bg-white/[0.02] px-4 py-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-white/70">Payment History & Recurrent Receipts</h4>
                  </div>
                  {vendor.maintenanceFee?.paymentHistory && vendor.maintenanceFee.paymentHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-white/10 bg-white/[0.01] text-[10px] uppercase tracking-wider text-white/40">
                            <th className="px-4 py-3 font-medium">Ref / ID</th>
                            <th className="px-4 py-3 font-medium">Date</th>
                            <th className="px-4 py-3 font-medium">Payment Method</th>
                            <th className="px-4 py-3 font-medium text-right">Amount</th>
                            <th className="px-4 py-3 font-medium text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white/80">
                          {vendor.maintenanceFee.paymentHistory.map((item, idx) => (
                            <tr key={idx} className="transition hover:bg-white/[0.02]">
                              <td className="px-4 py-3 font-mono text-[11px] text-[#d5b46c]">{item.reference || item.gsReference || `PAY-${idx + 1}`}</td>
                              <td className="px-4 py-3 text-white/60">{formatDate(item.paidAt, true)}</td>
                              <td className="px-4 py-3 text-white/80">{item.paymentMethod || "Card / EFT"}</td>
                              <td className="px-4 py-3 text-right font-medium text-white">R {Number(item.amount || 0).toLocaleString()}</td>
                              <td className="px-4 py-3 text-center">
                                <span className="inline-block rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                                  {item.status || "Cleared"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-white/40">
                      No recurrent maintenance payments recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </Section>

            <Section icon={Truck} title="Products & fulfilment" description="What the vendor sells and how orders will be handled">
              <Fields items={[
                { label: "Product categories", value: vendor.productCategories, wide: true },
                { label: "Fulfilment method", value: vendor.deliveryInfo?.fulfillmentMethod }, { label: "Dispatch location", value: vendor.deliveryInfo?.dispatchLocation },
                { label: "Dispatch days", value: vendor.deliveryInfo?.dispatchDays }, { label: "Cut-off time", value: vendor.deliveryInfo?.cutoffTime },
                { label: "Processing time", value: vendor.deliveryInfo?.processingTime }, { label: "Handling time", value: vendor.shippingProfile?.handlingTimeDays ? `${vendor.shippingProfile.handlingTimeDays} days` : null },
                { label: "Pickup address", value: [pickup.street, pickup.city, pickup.postal, pickup.country].filter(Boolean).join(", "), wide: true },
                { label: "Free delivery threshold", value: vendor.shippingProfile?.freeDeliveryThreshold }, { label: "Default weight", value: vendor.shippingProfile?.defaultWeight },
              ]} />
            </Section>

            {vendor.vendorType === "international" && (
              <Section icon={Globe2} title="International operations" description="Export credentials, target markets and logistics partners">
                <Fields items={[
                  { label: "Export licence number", value: vendor.credentialsInfo?.exportLicenceNumber }, { label: "Target regions", value: vendor.marketInfo?.targetRegions },
                  { label: "Current importer", value: vendor.logisticsInfo?.currentImporter }, { label: "Freight forwarder", value: vendor.logisticsInfo?.freightForwarder },
                ]} />
              </Section>
            )}

            <Section icon={FileCheck2} title="Uploaded documents" description="Open each source document in a separate tab">
              <div className="grid gap-3 sm:grid-cols-2">{documents.map(([label, url]) => <DocumentLink key={label} label={label} url={url} />)}</div>
            </Section>

            {(vendor.storyInfo?.winemakerBio || vendor.storyInfo?.brandStory || vendor.storyInfo?.wineryPhotosUrl) && (
              <Section icon={BadgeCheck} title="Brand story" description="Public-facing story supplied by the vendor">
                <Fields items={[
                  { label: "Winemaker biography", value: vendor.storyInfo?.winemakerBio, wide: true },
                  { label: "Brand story", value: vendor.storyInfo?.brandStory, wide: true },
                  { label: "Winery photos", value: vendor.storyInfo?.wineryPhotosUrl, wide: true },
                ]} />
              </Section>
            )}
          </main>

          <aside className="space-y-5 xl:sticky xl:top-6">
            <section className="rounded-xl border border-[#c9a35b]/25 bg-[#12110e] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c9a35b]">Application decision</p>
              <h2 className="mt-2 font-serif text-2xl font-semibold">Review controls</h2>
              <p className="mt-2 text-xs leading-5 text-white/40">Status changes notify the applicant by email where applicable.</p>

              {vendor.status !== "approved" && (
                <div className="mt-5">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">Registration fee (ZAR)</label>
                  <input type="number" min="0" value={fee} onChange={(event) => setFee(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none focus:border-[#c9a35b]" />
                  <button disabled={Boolean(working)} onClick={() => updateStatus("approved")} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#d2ad5f] px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-black transition hover:bg-[#e2c275] disabled:opacity-50">
                    <Check size={16} /> {working === "approved" ? "Approving..." : "Approve vendor"}
                  </button>
                </div>
              )}

              {vendor.status !== "rejected" && (
                <div className="mt-5 border-t border-white/10 pt-5">
                  <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">Rejection reason</label>
                  <textarea rows="3" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Explain what needs attention..." className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-black/30 px-3 py-3 text-sm outline-none placeholder:text-white/20 focus:border-red-400/60" />
                  <button disabled={Boolean(working)} onClick={() => updateStatus("rejected")} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/35 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-red-300 hover:bg-red-500/10 disabled:opacity-50">
                    <X size={16} /> {working === "rejected" ? "Rejecting..." : "Reject application"}
                  </button>
                </div>
              )}

              <div className="mt-5 grid gap-2 border-t border-white/10 pt-5">
                {vendor.status !== "pending_approval" && <button disabled={Boolean(working)} onClick={() => updateStatus("pending_approval")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2.5 text-xs font-semibold text-white/65 hover:bg-white/5"><RefreshCw size={14} /> Return to review</button>}
                {vendor.status !== "suspended" && <button disabled={Boolean(working)} onClick={() => updateStatus("suspended")} className="inline-flex items-center justify-center gap-2 rounded-lg border border-orange-500/25 px-3 py-2.5 text-xs font-semibold text-orange-200/80 hover:bg-orange-500/10"><Clock3 size={14} /> Suspend vendor</button>}
              </div>
            </section>

            {vendor.status === "approved" && vendor.paymentStatus !== "paid" && (
              <section className="rounded-xl border border-white/10 bg-[#101010] p-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Mail size={17} className="text-[#c9a35b]" /> Registration payment
                </div>
                
                {vendor.proofOfPaymentUrl ? (
                  <div className="mt-4">
                    <p className="text-xs leading-5 text-emerald-300/80 mb-3 bg-emerald-500/10 p-2 rounded border border-emerald-500/20">
                      Vendor has submitted a proof of payment.
                    </p>
                    <a 
                      href={vendor.proofOfPaymentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-3 py-2.5 text-xs font-medium text-white hover:bg-white/10 mb-3 transition"
                    >
                      View Proof of Payment
                    </a>
                    <button 
                      disabled={Boolean(working)} 
                      onClick={() => updatePaymentStatus('paid')} 
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#c9a35b] px-3 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-black hover:bg-[#d5b46c] disabled:opacity-50 transition"
                    >
                      <CheckCircle2 size={14} /> {working === "payment" ? "Verifying..." : "Verify Payment as Paid"}
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="mt-2 text-xs leading-5 text-white/40">
                      The approved vendor has not completed the registration payment.
                    </p>
                    <button 
                      disabled={Boolean(working)} 
                      onClick={sendPaymentReminder} 
                      className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#c9a35b]/30 px-3 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#d5b46c] hover:bg-[#c9a35b]/10 disabled:opacity-50"
                    >
                      <Send size={14} /> {working === "reminder" ? "Sending..." : "Send payment reminder"}
                    </button>
                    {vendor.paymentReminderSent && (
                      <p className="mt-3 text-center text-[10px] uppercase tracking-[0.12em] text-emerald-300/70">
                        A reminder has already been sent
                      </p>
                    )}
                  </>
                )}
              </section>
            )}

            <section className="rounded-xl border border-white/10 bg-[#101010] p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Calendar size={17} className="text-[#c9a35b]" /> Maintenance Fee
                </div>
                {daysDiff !== null && (
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    daysDiff < 0
                      ? "border border-red-500/20 bg-red-500/15 text-red-300"
                      : daysDiff <= 7
                        ? "border border-amber-500/20 bg-amber-500/15 text-amber-300"
                        : "border border-emerald-500/20 bg-emerald-500/15 text-emerald-300"
                  }`}>
                    {daysDiff < 0 ? `${Math.abs(daysDiff)}d overdue` : daysDiff === 0 ? "Due today" : `${daysDiff}d left`}
                  </span>
                )}
              </div>

              <div className="mt-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 text-xs">
                <div className="flex justify-between text-white/40">
                  <span>Current Due Date</span>
                  <span className="font-medium text-white/90">
                    {nextFeeDate ? formatDate(nextFeeDate) : "Not scheduled"}
                  </span>
                </div>
                <div className="mt-2 flex justify-between text-white/40">
                  <span>Monthly Rate</span>
                  <span className="font-serif font-semibold text-[#d5b46c]">
                    R {Number(vendor.maintenanceFee?.amount || 500).toLocaleString()}/mo
                  </span>
                </div>
                <div className="mt-2 flex justify-between text-white/40">
                  <span>Status</span>
                  <span className="capitalize font-semibold text-white/80">
                    {vendor.maintenanceFee?.status || (isTrialActive ? "Trial Active" : "Unpaid")}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                  Adjust Next Due Date
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-white outline-none focus:border-[#c9a35b]"
                />
                <div className="mt-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyDateOffset(30)}
                    className="flex-1 rounded border border-white/10 bg-white/5 py-1 text-[10px] text-white/60 hover:bg-[#c9a35b]/10 hover:text-[#d5b46c]"
                  >
                    +30d
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDateOffset(60)}
                    className="flex-1 rounded border border-white/10 bg-white/5 py-1 text-[10px] text-white/60 hover:bg-[#c9a35b]/10 hover:text-[#d5b46c]"
                  >
                    +60d
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDateOffset(90)}
                    className="flex-1 rounded border border-white/10 bg-white/5 py-1 text-[10px] text-white/60 hover:bg-[#c9a35b]/10 hover:text-[#d5b46c]"
                  >
                    +90d
                  </button>
                </div>
                <button
                  type="button"
                  disabled={scheduleWorking}
                  onClick={saveMaintenanceSchedule}
                  className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#c9a35b]/30 bg-[#c9a35b]/10 px-3 py-2.5 text-xs font-bold uppercase tracking-[0.12em] text-[#d5b46c] hover:bg-[#c9a35b]/20 disabled:opacity-50 transition"
                >
                  <Save size={13} /> {scheduleWorking ? "Saving..." : "Save Next Fee Date"}
                </button>
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-[#101010] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={17} className="text-[#c9a35b]" /> Verification overview</div>
              <div className="mt-4 space-y-3">
                {Object.entries(vendor.verificationScore || {}).map(([key, verified]) => (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="capitalize text-white/55">{key}</span>
                    <span className={`inline-flex items-center gap-1.5 ${verified ? "text-emerald-300" : "text-white/30"}`}>{verified ? <CheckCircle2 size={14} /> : <Clock3 size={14} />}{verified ? "Verified" : "Pending"}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 border-t border-white/10 pt-4 text-[11px] leading-5 text-white/35">
                <p>Terms accepted: <span className="text-white/60">{show(vendor.agreements?.termsAccepted)}</span></p>
                <p>Information declared accurate: <span className="text-white/60">{show(vendor.agreements?.informationAccurate)}</span></p>
                <p>Accepted on: <span className="text-white/60">{formatDate(vendor.agreements?.acceptedAt, true)}</span></p>
                <p>Last updated: <span className="text-white/60">{formatDate(vendor.updatedAt, true)}</span></p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
