import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCrmDashboard } from '../hooks/useCrmDashboard';
import { useCrmTasks } from '../hooks/useCrmTasks';
import { useCrmComms } from '../hooks/useCrmComms';
import { useToast } from '../context/ToastContext';
import StatCard from '../components/common/StatCard';
import StatusBadge from '../components/common/StatusBadge';
import TaskModal from '../components/common/TaskModal';
import { 
  ShoppingBag, MessageSquare, Building2, AlertTriangle, 
  RotateCw, Plus, CheckCircle2, Clock, Gavel, Wallet, 
  ShieldCheck, PhoneCall, ArrowUpRight, Search, Filter, 
  Calendar, ChevronRight, UserCheck, Truck, Sparkles, X 
} from 'lucide-react';

export default function CrmDashboardPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data, loading: dashboardLoading, refresh, lastRefreshed } = useCrmDashboard();
  const { tasks, loading: tasksLoading, completeTask, createTask, refresh: refreshTasks } = useCrmTasks();
  const { logComm } = useCrmComms();

  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'urgent' | 'logistics' | 'auctions' | 'completed'
  const [searchQuery, setSearchQuery] = useState('');
  const [quickCommsOpen, setQuickCommsOpen] = useState(false);
  const [commsForm, setCommsForm] = useState({
    customerName: '',
    contact: '',
    channel: 'phone_call',
    summary: '',
    sentiment: 'neutral'
  });

  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'create', // 'create' or 'complete'
    task: null
  });

  const handleOpenCreateModal = () => {
    setModalState({ isOpen: true, mode: 'create', task: null });
  };

  const handleOpenCompleteModal = (task) => {
    setModalState({ isOpen: true, mode: 'complete', task });
  };

  const handleModalSubmit = async (formData) => {
    try {
      if (modalState.mode === 'complete') {
        const res = await completeTask(modalState.task._id, formData.completionReason, formData.resolutionOutcome);
        if (res.success) {
          toast.success('Task marked as completed with audit justification.');
          refresh();
          refreshTasks();
        } else {
          toast.error(res.message || 'Failed to complete task');
        }
      } else {
        const res = await createTask(formData);
        if (res.success) {
          toast.success('New operations task created successfully.');
          refresh();
          refreshTasks();
        } else {
          toast.error(res.message || 'Failed to create task');
        }
      }
    } catch (err) {
      toast.error(err.message || 'Operation failed');
    }
  };

  const handleQuickCommsSubmit = async (e) => {
    e.preventDefault();
    if (!commsForm.customerName || !commsForm.summary) {
      toast.warning('Please enter customer name and summary.');
      return;
    }
    try {
      const res = await logComm({
        channel: commsForm.channel,
        direction: 'outbound',
        subject: `${commsForm.channel === 'phone_call' ? 'Phone Call' : commsForm.channel === 'whatsapp' ? 'WhatsApp Message' : 'Customer Note'}: ${commsForm.customerName}`,
        messageBody: commsForm.summary,
        recipient: {
          name: commsForm.customerName,
          email: commsForm.contact?.includes('@') ? commsForm.contact : undefined,
          phone: !commsForm.contact?.includes('@') ? commsForm.contact : undefined
        },
        phoneCallDetails: commsForm.channel === 'phone_call' ? { durationSeconds: 120, outcome: 'discussed' } : undefined
      });
      if (res?.success) {
        toast.success(`Communication log saved for ${commsForm.customerName} and synced with Comms Hub.`);
        setQuickCommsOpen(false);
        setCommsForm({ customerName: '', contact: '', channel: 'phone_call', summary: '', sentiment: 'neutral' });
        refresh();
      } else {
        toast.error(res?.message || 'Failed to record communication log');
      }
    } catch (err) {
      toast.error('Failed to record communication log');
    }
  };

  const metrics = data?.metrics || {};
  const attention = data?.attentionRequired || {};

  // Filter tasks based on search & tab
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = 
      t.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.assignedTo?.name?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'urgent') return t.priority === 'urgent' && t.status !== 'completed';
    if (filterTab === 'logistics') return (t.department === 'logistics' || t.department === 'orders') && t.status !== 'completed';
    if (filterTab === 'auctions') return (t.department === 'auctions' || t.department === 'compliance') && t.status !== 'completed';
    if (filterTab === 'completed') return t.status === 'completed';
    return t.status !== 'completed';
  });

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const currentDate = new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* 1. Executive Master Operations Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-slate-900/10 border border-slate-800 relative overflow-hidden">
        {/* Subtle Atmospheric Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 font-bold tracking-wider uppercase rounded-full border border-blue-400/30 flex items-center gap-1.5 backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                The Morning Screen — Live Operations
              </span>
              <span className="text-slate-400 font-medium">
                {currentDate} • {currentTime} SAST
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Grand Store <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Executive CRM</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Unified operational directorate: Real-time telemetry across orders, private VIP collectors, auction hammer lots, B2B trade pipelines, and 30-day vendor settlements.
            </p>

            {/* Compliance Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-[11px] font-semibold text-slate-300">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <ShieldCheck size={13} className="text-emerald-400" /> 18+ Drinking Age Enforced
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <Gavel size={13} className="text-purple-400" /> Bidding Engine Anti-Sniping Live
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <Wallet size={13} className="text-amber-400" /> 30-Day Settlement Milestone Engine
              </div>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center shrink-0">
            <button
              onClick={() => { refresh(); refreshTasks(); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all shadow-sm"
              title="Refresh telemetry"
            >
              <RotateCw size={14} className={dashboardLoading ? 'animate-spin text-blue-400' : ''} />
              <span>Sync All</span>
            </button>

            <button
              onClick={() => setQuickCommsOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700 text-cyan-300 hover:text-white rounded-xl text-xs font-semibold border border-cyan-500/30 transition-all shadow-sm"
            >
              <PhoneCall size={14} /> Quick Call Log
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/30 transition-all"
            >
              <Plus size={16} /> New SLA Action
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top-Level Operational KPI Cards (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div 
          onClick={() => navigate('/orders')}
          className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Orders Today</span>
            <span className="p-1.5 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
              <ShoppingBag size={16} />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {metrics.ordersToday || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Fulfilment pipeline</span> <ChevronRight size={11} className="text-slate-300" />
          </p>
        </div>

        <div 
          onClick={() => navigate('/customers')}
          className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>New Enquiries</span>
            <span className="p-1.5 rounded-xl bg-cyan-50 text-cyan-600 group-hover:scale-110 transition-transform">
              <MessageSquare size={16} />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {metrics.newEnquiries || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>Trade, Wine & VIP</span> <ChevronRight size={11} className="text-slate-300" />
          </p>
        </div>

        <div 
          onClick={() => navigate('/vendors')}
          className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-amber-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Vendor Actions</span>
            <span className="p-1.5 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <Building2 size={16} />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {metrics.vendorTasks || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <span>KYC & products audit</span> <ChevronRight size={11} className="text-slate-300" />
          </p>
        </div>

        <div 
          onClick={() => navigate('/auctions-events')}
          className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Auctions & Tastings</span>
            <span className="p-1.5 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
              <Gavel size={16} />
            </span>
          </div>
          <div className="text-2xl font-black text-purple-900 tracking-tight">
            {attention.unpaidLotsCount || 0}
          </div>
          <p className="text-[11px] text-purple-700 font-semibold mt-1 flex items-center gap-1">
            <span>Unpaid hammer lots</span> <ChevronRight size={11} className="text-purple-300" />
          </p>
        </div>

        <div 
          onClick={() => navigate('/settlements')}
          className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>30-Day Settlements</span>
            <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <Wallet size={16} />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-700 tracking-tight">
            {attention.dueSettlementsCount || 0}
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <span>Due for payout EFT</span> <ChevronRight size={11} className="text-emerald-300" />
          </p>
        </div>
      </div>

      {/* 3. Split Priority Matrix: Attention Required Radar & Live Velocity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 Cols): Critical Attention Required Radar */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                Critical Operational Attention Radar
              </h2>
              <p className="text-xs text-slate-500">Items requiring immediate staff intervention to safeguard luxury customer SLAs</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Live Priority
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Card 1: Overdue Staff SLA Follow-ups */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-700">Breached / Overdue SLAs</span>
                  <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-red-50 text-red-700 border border-red-200">
                    {metrics.overdueFollowups || 0} Overdue
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Staff tasks that have crossed their due date without a logged Golden Rule resolution reason.
                </p>
              </div>
              <button
                onClick={() => setFilterTab('urgent')}
                className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 pt-2 border-t border-slate-200/60"
              >
                Inspect Overdue Tasks <ArrowUpRight size={13} />
              </button>
            </div>

            {/* Card 2: Delayed Shipments & Customs */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-700">Delayed Shipments & Holds</span>
                  <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-amber-50 text-amber-700 border border-amber-200">
                    {attention.delayedShipments?.length || 0} Flags
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Consignments with logistics exception tags, courier delays, or customs inspection hold status.
                </p>
              </div>
              <button
                onClick={() => navigate('/orders')}
                className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 pt-2 border-t border-slate-200/60"
              >
                Open Order Kanban Board <ArrowUpRight size={13} />
              </button>
            </div>

            {/* Card 3: Unpaid Hammer Lots Recovery */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-700">Hammer Payment Recovery</span>
                  <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-purple-50 text-purple-700 border border-purple-200">
                    48h SLA Limit
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Winning auction lots requiring phone follow-up before lots default and bidder deposit is forfeit.
                </p>
              </div>
              <button
                onClick={() => navigate('/auctions-events')}
                className="mt-3 text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1 pt-2 border-t border-slate-200/60"
              >
                Open Auction Recovery Desk <ArrowUpRight size={13} />
              </button>
            </div>

            {/* Card 4: 30-Day Vendor Payouts Due */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-700">30-Day Vendor Payouts</span>
                  <span className="px-2 py-0.5 rounded-md font-bold text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Matured Today
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Post-delivery 30-day dispute window elapsed. Remittance vouchers ready for accounting authorization.
                </p>
              </div>
              <button
                onClick={() => navigate('/settlements')}
                className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 pt-2 border-t border-slate-200/60"
              >
                Review Payout Queue <ArrowUpRight size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Right (1 Col): Live Operations Stream */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles size={16} className="text-blue-600" />
                Live Operational Pulse
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Real-time platform activity stream</p>

            <div className="mt-4 space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-500 text-[10px]">
                  <span>AUCTION DESK</span>
                  <span>12m ago</span>
                </div>
                <div className="font-semibold text-slate-800 mt-1">High-Value Bidder KYC Passed</div>
                <div className="text-slate-500 text-[11px]">Johannesburg collector unlocked for R 250,000 limit</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-500 text-[10px]">
                  <span>LOGISTICS</span>
                  <span>45m ago</span>
                </div>
                <div className="font-semibold text-slate-800 mt-1">Vault Dispatch Out for Delivery</div>
                <div className="text-slate-500 text-[11px]">RAM Courier tracking active for Cape Town Order #GS-9941</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-500 text-[10px]">
                  <span>B2B EXPORT</span>
                  <span>1h ago</span>
                </div>
                <div className="font-semibold text-slate-800 mt-1">Export Certificate Issued</div>
                <div className="text-slate-500 text-[11px]">UK Pallet shipment documentation stamped & verified</div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => navigate('/communications')}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              Open Full Communications Centre <ArrowUpRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. The Master Daily Work Queue Interactive Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Master Operations Work Queue</h2>
            <p className="text-xs text-slate-500">Every open operational task with strict SLA countdowns and Golden Staff Rule compliance</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-60">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input 
                type="text"
                placeholder="Search tasks, staff, dept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors shrink-0"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Work Queue Tabs */}
        <div className="flex border-b border-slate-200 gap-4 text-xs font-semibold overflow-x-auto pb-1">
          {[
            { id: 'all', label: `All Open Queue (${tasks.filter(t => t.status !== 'completed').length})` },
            { id: 'urgent', label: `Urgent Only (${tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length})` },
            { id: 'logistics', label: 'Logistics & Orders' },
            { id: 'auctions', label: 'Auctions & Compliance' },
            { id: 'completed', label: `Resolved Today (${tasks.filter(t => t.status === 'completed').length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              className={`pb-2.5 relative transition-colors whitespace-nowrap ${
                filterTab === tab.id ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
              {filterTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />}
            </button>
          ))}
        </div>

        {/* Interactive Work Queue Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Task Details</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Assignee</th>
                <th className="py-3 px-3">SLA Due Timer</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Golden Rule Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-10 text-center text-slate-400">
                    <CheckCircle2 size={24} className="mx-auto mb-2 text-emerald-500" />
                    All tasks in this filter queue are clear!
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const isOverdue = task.dueAt && new Date(task.dueAt) < new Date() && task.status !== 'completed';
                  return (
                    <tr key={task._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          task.priority === 'urgent' ? 'bg-red-50 text-red-700 border border-red-200' :
                          task.priority === 'high' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {task.priority?.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900">{task.title}</div>
                        {task.description && (
                          <div className="text-slate-400 text-[11px] line-clamp-1">{task.description}</div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className="capitalize font-medium text-slate-700">{task.department || 'general'}</span>
                      </td>

                      <td className="py-3 px-3 font-medium text-slate-800">
                        {task.assignedTo?.name || 'Unassigned'}
                      </td>

                      <td className="py-3 px-3">
                        {task.dueAt ? (
                          <span className={`font-semibold flex items-center gap-1 ${
                            isOverdue ? 'text-red-600 animate-pulse font-bold' : 'text-slate-600'
                          }`}>
                            <Clock size={12} />
                            {new Date(task.dueAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {isOverdue && ' (BREACHED)'}
                          </span>
                        ) : (
                          <span className="text-slate-400">No deadline</span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <StatusBadge status={task.status} />
                      </td>

                      <td className="py-3 px-3 text-right">
                        {task.status === 'completed' ? (
                          <span className="text-emerald-700 font-semibold text-[11px] flex items-center justify-end gap-1">
                            <CheckCircle2 size={13} /> Logged
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenCompleteModal(task)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
                          >
                            Resolve (Log Reason)
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Task Modal (Create / Golden Rule Complete) */}
      <TaskModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, mode: 'create', task: null })}
        mode={modalState.mode}
        task={modalState.task}
        onSubmit={handleModalSubmit}
      />

      {/* Quick Comms Drawer / Modal */}
      {quickCommsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <PhoneCall size={18} className="text-blue-600" />
                Quick Customer Phone / WhatsApp Log
              </h3>
              <button 
                onClick={() => setQuickCommsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQuickCommsSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Customer / Collector Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. David Van Der Merwe"
                  value={commsForm.customerName}
                  onChange={(e) => setCommsForm({ ...commsForm, customerName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Contact Phone / WhatsApp</label>
                <input 
                  type="text"
                  placeholder="+27 (0) 82 123 4567"
                  value={commsForm.contact}
                  onChange={(e) => setCommsForm({ ...commsForm, contact: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Channel</label>
                  <select 
                    value={commsForm.channel}
                    onChange={(e) => setCommsForm({ ...commsForm, channel: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="phone_call">Phone Call</option>
                    <option value="whatsapp">WhatsApp Message</option>
                    <option value="email">Direct Email</option>
                    <option value="in_person">In-Person Tasting</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Client Sentiment</label>
                  <select 
                    value={commsForm.sentiment}
                    onChange={(e) => setCommsForm({ ...commsForm, sentiment: e.target.value })}
                    className="w-full px-2.5 py-2 border border-slate-200 rounded-xl bg-white"
                  >
                    <option value="positive">VIP Delight (Positive)</option>
                    <option value="neutral">Neutral / Inquiry</option>
                    <option value="escalated">Urgent / Frustrated</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Call Notes & Resolution Summary</label>
                <textarea 
                  rows="3"
                  required
                  placeholder="Discussed rare Macallan 25 allocation. Client confirmed attendance for Franschhoek tasting..."
                  value={commsForm.summary}
                  onChange={(e) => setCommsForm({ ...commsForm, summary: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setQuickCommsOpen(false)}
                  className="px-3 py-1.5 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  Save Call Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
