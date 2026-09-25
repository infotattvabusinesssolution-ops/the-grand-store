import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Building2, ShoppingBag, Globe, 
  MessageSquare, Gavel, Wallet, ShieldCheck, CheckSquare, Menu, X, 
  Search, ArrowLeft, LogOut, Activity, ChevronRight, Loader2, TrendingUp 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { crmClient } from '../../services/crmApi';
import '../../index.css';

export default function CrmLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Global Omni-Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search logic querying customers, tasks & orders
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      setSearchOpen(true);
      try {
        const [custRes, taskRes] = await Promise.all([
          crmClient.get('/customers', { params: { search: searchQuery, limit: 4 } }).catch(() => ({ data: { customers: [] } })),
          crmClient.get('/tasks', { params: { search: searchQuery, limit: 4 } }).catch(() => ({ data: { tasks: [] } }))
        ]);

        const customers = (custRes.data?.customers || []).map(c => ({
          id: c._id,
          title: c.name,
          subtitle: `${c.email} • ${c.crmCustomerType?.replace(/_/g, ' ') || 'Retail'}`,
          type: 'customer',
          link: `/customers/${c._id}`
        }));

        const tasks = (taskRes.data?.tasks || []).map(t => ({
          id: t._id,
          title: t.title,
          subtitle: `${t.department?.toUpperCase()} • Priority: ${t.priority}`,
          type: 'task',
          link: '/'
        }));

        // Search match triggers for quick navigational jumps
        const quickNavs = [];
        const q = searchQuery.toLowerCase();
        if ('sales revenue financials profitability ledger turnover dashboard platform'.includes(q)) {
          quickNavs.push({ id: 'sales-lane', title: 'Sales & Platform Overview', subtitle: 'Real-time KPIs, profitability & master ledger', type: 'module', link: '/sales' });
        }
        if ('orders kanban shipments'.includes(q)) {
          quickNavs.push({ id: 'orders-lane', title: 'Orders Kanban Board', subtitle: 'View fulfilment lanes & exceptions', type: 'module', link: '/orders' });
        }
        if ('vendors wineries suppliers onboarding'.includes(q)) {
          quickNavs.push({ id: 'vendors-lane', title: 'Vendor Onboarding Workflow', subtitle: 'KYC & liquor licenses verification', type: 'module', link: '/vendors' });
        }
        if ('export b2b trade international containers'.includes(q)) {
          quickNavs.push({ id: 'export-lane', title: 'Global Trade (B2B Export)', subtitle: 'Container consignments & customs certificates', type: 'module', link: '/export-trade' });
        }
        if ('settlements finance payout'.includes(q)) {
          quickNavs.push({ id: 'settle-lane', title: '30-Day Vendor Settlements', subtitle: 'Payout release queue & anti-duplicate checks', type: 'module', link: '/settlements' });
        }
        if ('staff sla telemetry performance kpis'.includes(q)) {
          quickNavs.push({ id: 'staff-lane', title: 'Staff SLA Telemetry & Leaderboard', subtitle: 'Response benchmarks & 30d task SLA metrics', type: 'module', link: '/staff-telemetry' });
        }

        setSearchResults([...quickNavs, ...customers, ...tasks]);
      } catch (err) {
        console.warn('Search query error:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectResult = (link) => {
    navigate(link);
    setSearchOpen(false);
    setSearchQuery('');
  };

  // Authentication Guard: Redirect to /login if no valid staff/super_admin session
  const hasValidAdminToken = typeof window !== 'undefined' && (
    localStorage.getItem('crmAdminToken') || 
    localStorage.getItem('adminToken')
  );

  // Block customers immediately from accessing CRM layout
  if (user && user.role === 'customer') {
    return <Navigate to="/login" replace />;
  }

  if (!user && !hasValidAdminToken) {
    return <Navigate to="/login" replace />;
  }

  const navLinks = [
    { to: '/', icon: LayoutDashboard, label: 'Morning Screen', end: true },
    { to: '/sales', icon: TrendingUp, label: 'Sales' },
    { to: '/customers', icon: Users, label: 'Customer 360°' },
    { to: '/vendors', icon: Building2, label: 'Vendor Workflow' },
    { to: '/orders', icon: ShoppingBag, label: 'Order Kanban Board' },
    { to: '/export-trade', icon: Globe, label: 'Global Trade (B2B)' },
    { to: '/communications', icon: MessageSquare, label: 'Comms Centre' },
    { to: '/marketing', icon: ShieldCheck, label: 'Marketing (18+)' },
    { to: '/auctions-events', icon: Gavel, label: 'Auctions & Tastings' },
    { to: '/settlements', icon: Wallet, label: '30-Day Settlements' },
    { to: '/staff-telemetry', icon: Activity, label: 'Staff SLA Telemetry' }
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] flex flex-col font-sans antialiased">
      {/* Executive White Topbar with Blue Accents */}
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Toggle Navigation"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <div className="flex items-center gap-3 cursor-pointer select-none group" onClick={() => navigate('/')}>
            <img 
              src="/grand-store-crm-logo.png" 
              alt="The Grand Store" 
              className="h-9 sm:h-10 w-auto object-contain group-hover:opacity-90 transition-opacity" 
            />
            <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
              <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-blue-600 text-white rounded-md shadow-xs shadow-blue-500/20">
                CRM
              </span>
            </div>
          </div>
        </div>

        {/* Global Search & User Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden md:flex items-center relative w-72" ref={searchRef}>
            <Search size={16} className="absolute left-3 text-slate-400" />
            <input 
              type="text"
              placeholder="Search patron, order, task, module..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearchOpen(false);
                if (e.key === 'Enter' && searchResults.length > 0) handleSelectResult(searchResults[0].link);
              }}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {searchLoading && (
              <Loader2 size={14} className="absolute right-3 text-blue-600 animate-spin" />
            )}

            {/* Floating Omni-Search Results Dropdown */}
            {searchOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl shadow-slate-900/10 border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1">
                <div className="p-2 border-b border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3">
                  <span>Search Matches</span>
                  <span>Esc to close</span>
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      {searchLoading ? 'Searching directory...' : 'No matching records found.'}
                    </div>
                  ) : (
                    searchResults.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectResult(item.link)}
                        className="p-3 hover:bg-blue-50/70 transition-colors cursor-pointer flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              item.type === 'customer' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                              item.type === 'module' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {item.type}
                            </span>
                            <span className="font-semibold text-slate-900 truncate">{item.title}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.subtitle}</p>
                        </div>
                        <ChevronRight size={14} className="text-slate-400 shrink-0" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <a 
            href="https://grandstoreglobal.com/admin/dashboard" 
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors"
            title="Open Store Admin"
          >
            <ArrowLeft size={14} /> Main Store Admin
          </a>

          <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs border border-blue-200">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="hidden md:block text-left text-xs">
              <p className="font-semibold text-slate-800 leading-tight">{user?.name || 'Staff'}</p>
              <p className="text-[10px] text-blue-600 font-semibold capitalize">{user?.role || 'Admin'}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area with White & Blue Sidebar */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Crisp White Sidebar with Royal Blue Active Highlights */}
        <aside className={`
          w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col fixed lg:static top-16 bottom-0 left-0 z-30
          transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-4 flex flex-col gap-1 flex-1 overflow-y-auto crm-scrollbar">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 pt-1">
              Operational Modules
            </p>
            {navLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `
                  flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30' 
                    : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/60'}
                `}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/60">
            <button
              onClick={() => {
                if (logout) logout();
                navigate('/login');
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </aside>

        {/* Dynamic Page Outlet */}
        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 crm-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
