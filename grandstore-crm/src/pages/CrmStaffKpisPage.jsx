import React, { useState } from 'react';
import { 
  Activity, Users, CheckCircle2, Clock, AlertTriangle, 
  RefreshCw, Award, ShieldCheck, TrendingUp, Calendar, 
  Search, ArrowUpRight, ChevronRight, UserCheck, Flame 
} from 'lucide-react';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import { useCrmStaffKpis } from '../hooks/useCrmStaffKpis';

export default function CrmStaffKpisPage() {
  const { teamSummary, staff, loading, error, refresh } = useCrmStaffKpis();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(null);

  const filteredStaff = staff.filter((s) =>
    (s.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (s.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (s.role?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Staff SLA Telemetry & Operational KPIs
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
              <Activity size={13} />
              Module 12
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Section 12 Telemetry Engine: Real-time task response rates, 30-day turnaround benchmarks, and team productivity audit logs.
          </p>
        </div>

        <button 
          onClick={refresh}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Telemetry
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Team SLA Compliance" 
          value={`${teamSummary.avgTeamSla || 100}%`} 
          icon={ShieldCheck} 
          color="emerald"
          subtitle="Target: ≥ 90% On-Time"
        />
        <StatCard 
          title="Tasks Completed (30d)" 
          value={teamSummary.totalTeamCompleted || 0} 
          icon={CheckCircle2} 
          color="blue"
          subtitle={`Out of ${teamSummary.totalTeamTasks || 0} assigned`}
        />
        <StatCard 
          title="Active Overdue Tasks" 
          value={teamSummary.totalTeamOverdue || 0} 
          icon={AlertTriangle} 
          color={teamSummary.totalTeamOverdue > 0 ? "rose" : "emerald"}
          subtitle="Requires immediate manager triage"
        />
        <StatCard 
          title="Operational Staff" 
          value={teamSummary.activeStaffCount || staff.length || 0} 
          icon={Users} 
          color="purple"
          subtitle="Active admin & triage accounts"
        />
      </div>

      {/* Standard Operating SLA Benchmarks Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
            <Clock size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Grand Store SLA Benchmark Thresholds</h3>
            <p className="text-xs text-slate-500">Official operational standards measured against every task in the queue</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
              Urgent Priority
            </span>
            <h4 className="text-base font-extrabold text-slate-900 mt-2">≤ 2 Hours</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">High-roller VIP inquiries & damaged transit claims</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
              Logistics Exception
            </span>
            <h4 className="text-base font-extrabold text-slate-900 mt-2">≤ 4 Hours</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Courier delays, wrong addresses, and border customs holds</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
              Medium Priority
            </span>
            <h4 className="text-base font-extrabold text-slate-900 mt-2">≤ 6 Hours</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Vendor KYC documents and B2B quote drafting</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">
              Normal Priority
            </span>
            <h4 className="text-base font-extrabold text-slate-900 mt-2">≤ 24 Hours</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">Routine tasting bookings and general newsletter questions</p>
          </div>
        </div>
      </div>

      {/* Staff Leaderboard & Performance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Staff Productivity & SLA Leaderboard</h3>
            <p className="text-xs text-slate-500">Live 30-day rolling performance telemetry by operator</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Filter by staff name or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Staff Member</th>
                <th className="px-6 py-3.5">Assigned Role</th>
                <th className="px-6 py-3.5">Tasks Assigned (30d)</th>
                <th className="px-6 py-3.5">Completed</th>
                <th className="px-6 py-3.5">SLA Compliance Rate</th>
                <th className="px-6 py-3.5">Active / Overdue</th>
                <th className="px-6 py-3.5 text-right">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading staff performance metrics...
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No staff records found matching search.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => (
                  <tr 
                    key={member.id} 
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-200">
                          {member.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{member.name}</p>
                          <p className="text-[11px] text-slate-500">{member.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                        {member.role?.replace(/_/g, ' ') || 'Staff'}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-semibold text-slate-700">
                      {member.totalAssigned || 0}
                    </td>

                    <td className="px-6 py-4 font-semibold text-emerald-600">
                      {member.completedCount || 0}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all ${
                              member.slaCompliancePct >= 90 ? 'bg-emerald-500' :
                              member.slaCompliancePct >= 75 ? 'bg-blue-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(member.slaCompliancePct || 100, 100)}%` }}
                          />
                        </div>
                        <span className="font-bold text-slate-900 text-xs">
                          {member.slaCompliancePct || 100}%
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 font-medium">{member.activeCount || 0} active</span>
                        {member.overdueCount > 0 ? (
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px]">
                            {member.overdueCount} overdue
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-medium text-[11px]">✓ 0 overdue</span>
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold inline-flex items-center gap-1 border ${
                        member.performanceRating === 'Excellent' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : member.performanceRating === 'Good'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {member.performanceRating === 'Excellent' && <Award size={13} className="text-emerald-600" />}
                        {member.performanceRating}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
