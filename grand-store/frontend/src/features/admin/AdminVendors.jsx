import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Search,
  Store,
} from "lucide-react";
import api from "../../api";

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

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#121212] p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-white/40">
        <Icon size={15} className="text-[#c9a35b]" />
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

export default function AdminVendors() {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    const fetchVendors = async () => {
      try {
        const { data } = await api.get("/admin/vendors");
        if (active) setVendors(Array.isArray(data) ? data : []);
      } catch (err) {
        if (active) setError(err.response?.data?.message || "Unable to load vendor applications.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchVendors();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return vendors;
    return vendors.filter((vendor) => [
      vendor.businessInfo?.legalName,
      vendor.businessInfo?.tradingName,
      vendor.userId?.name,
      vendor.userId?.email,
      vendor.vendorType,
      vendor.status,
    ].some((value) => String(value || "").toLowerCase().includes(query)));
  }, [search, vendors]);

  const pending = vendors.filter((vendor) => vendor.status === "pending_approval").length;
  const approved = vendors.filter((vendor) => vendor.status === "approved").length;

  return (
    <div className="min-h-full bg-[#090909] px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c9a35b]">Vendor management</p>
            <h1 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">Vendor applications</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/50">
              Review each registration in a focused workspace with documents, banking details and approval controls together.
            </p>
          </div>
          <div className="relative w-full lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search vendors or email"
              className="w-full rounded-lg border border-white/10 bg-[#121212] py-3 pl-10 pr-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#c9a35b]/70"
            />
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <Metric icon={Store} label="Total applications" value={vendors.length} />
          <Metric icon={Clock3} label="Awaiting review" value={pending} />
          <Metric icon={CheckCircle2} label="Approved vendors" value={approved} />
        </section>

        <section className="overflow-hidden rounded-xl border border-white/10 bg-[#101010]">
          {loading ? (
            <div className="flex min-h-64 items-center justify-center text-sm text-white/50">Loading vendor applications...</div>
          ) : error ? (
            <div className="m-5 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
          ) : filtered.length === 0 ? (
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
                  {filtered.map((vendor) => {
                    const businessName = vendor.businessInfo?.tradingName || vendor.businessInfo?.legalName || "Unnamed business";
                    const progress = getOnboardingProgress(vendor);
                    return (
                      <tr
                        key={vendor._id}
                        onClick={() => navigate(`/admin/vendors/${vendor._id}`)}
                        className="group cursor-pointer transition hover:bg-white/[0.035]"
                      >
                        <td className="px-5 py-4">
                          <div className="font-medium text-white">{businessName}</div>
                          <div className="mt-1 text-xs text-white/40">{vendor.userId?.email || "No account email"}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="capitalize text-sm text-white/70">{vendor.vendorType || "local"} vendor</div>
                          <div className="mt-1 text-xs text-white/35">{vendor.businessInfo?.registrationNumber || "No registration number"}</div>
                        </td>
                        <td className="px-5 py-4"><StatusBadge status={vendor.status} /></td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                              <div className="h-full rounded-full bg-[#c9a35b]" style={{ width: `${progress.percent}%` }} />
                            </div>
                            <span className="text-xs text-white/50">{progress.current}/{progress.total}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {(() => {
                            const nextDue = vendor.maintenanceFee?.nextDueAt || vendor.freeTrialExpiry;
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
                                  {vendor.couponUsed && vendor.freeTrialExpiry && new Date(vendor.freeTrialExpiry) >= new Date() ? (
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
                          {vendor.createdAt ? new Date(vendor.createdAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/admin/vendors/${vendor._id}`);
                            }}
                            className="inline-flex items-center gap-2 rounded-md border border-[#c9a35b]/35 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#d8b76f] transition hover:border-[#c9a35b] hover:bg-[#c9a35b]/10"
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
      </div>
    </div>
  );
}
