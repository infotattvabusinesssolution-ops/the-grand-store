import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, Building2, Gavel, Wallet, Settings, Menu, X, LogOut, ArrowLeft, Star, Package, ShoppingBag, Tv, Mail, Activity, Briefcase, Shield, Gem, Award, MessageSquare, Bot, CalendarCheck, Tag, Layers, Flame, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Allow admin, accountant, and product_manager users
  if (!user || !['admin', 'super_admin', 'accountant', 'product_manager'].includes(user.role)) {
    return <Navigate to="/admin/login" replace />;
  }

  const isAdmin = user.role === 'admin' || user.role === 'super_admin';
  const isAccountant = user.role === 'accountant' || isAdmin;
  const isProductManager = user.role === 'product_manager' || isAdmin;

  const handleNavigate = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItemClass = (path) => {
    const baseClass = "flex items-center gap-4 px-4 py-3 rounded-xl text-xs uppercase tracking-widest transition-all text-left border";
    if (isActive(path)) {
      return `${baseClass} bg-[#c9a35b] text-black shadow-[0_0_15px_rgba(212,175,55,0.5)] font-bold border-transparent`;
    }
    return `${baseClass} text-[var(--color-ivory-muted)] hover:bg-white/[0.03] hover:text-[var(--color-ivory)] border-transparent`;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[var(--color-ivory)] flex flex-col font-sans">
      
      {/* Standalone Dashboard Header */}
      <header className="h-20 bg-black/60 backdrop-blur-xl border-b border-white/[0.05] flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button className="md:hidden text-[var(--color-ivory)] hover:text-gold-gradient transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
            <div className="text-xl md:text-2xl font-serif text-[var(--color-ivory)] tracking-widest uppercase">
              The Grand Store
            </div>
            <div className="hidden md:block h-4 w-px bg-white/20 mx-2"></div>
            <div className="hidden md:block text-sm tracking-widest text-gold-gradient font-medium uppercase drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]">
              Admin Gateway
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-sm font-serif">{user.name}</div>
              <div className="text-xs text-gold-gradient tracking-widest uppercase">
                {isAdmin ? 'System Administrator' : user.role === 'accountant' ? 'Accountant' : 'Product Manager'}
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--color-gold)] to-yellow-700 p-[1px]">
              <div className="w-full h-full bg-[#0a0a0a] rounded-full flex items-center justify-center">
                <Settings size={18} className="text-gold-gradient" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Background glow effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[var(--color-gold)]/5 blur-[120px]"></div>
        </div>

        {/* Glassmorphic Sidebar */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>
        )}
        <aside className={`w-64 bg-[#0a0a0a]/95 backdrop-blur-xl border-r border-white/[0.02] flex flex-col fixed top-20 bottom-0 left-0 z-50 overflow-y-auto transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <nav className="flex flex-col flex-1 p-6 gap-2 mt-2">
            
            {user.role !== 'product_manager' && (
              <>
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-ivory-muted)] uppercase tracking-widest mb-2 mt-2 pl-2"><Activity size={12} /> Overview</div>
                <button onClick={() => handleNavigate('/admin/dashboard')} className={navItemClass('/admin/dashboard')}>
                  <LayoutDashboard size={16} /> Dashboard
                </button>
              </>
            )}
            {isAdmin && (
              <>
                <button onClick={() => handleNavigate('/admin/users')} className={navItemClass('/admin/users')}>
                  <Users size={16} /> All Users
                </button>
                <button onClick={() => handleNavigate('/admin/staff')} className={navItemClass('/admin/staff')}>
                  <Shield size={16} /> Staff Directory
                </button>
                <button onClick={() => handleNavigate('/admin/vendors')} className={navItemClass('/admin/vendors')}>
                  <Building2 size={16} /> Vendors & Approvals
                </button>
                <button onClick={() => handleNavigate('/admin/coupons')} className={navItemClass('/admin/coupons')}>
                  <Tag size={16} /> Vendor Coupons
                </button>
                <button onClick={() => handleNavigate('/admin/newsletter')} className={navItemClass('/admin/newsletter')}>
                  <Mail size={16} /> Newsletter Subscribers
                </button>
              </>
            )}

            {isProductManager && (
              <>
                <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-ivory-muted)] uppercase tracking-widest mb-2 mt-4 pl-2"><Briefcase size={12} /> Operations</div>
                <button onClick={() => handleNavigate('/admin/categories')} className={navItemClass('/admin/categories')}>
                  <Layers size={16} /> Config Categories
                </button>
                <button onClick={() => handleNavigate('/admin/marquees')} className={navItemClass('/admin/marquees')}>
                  <Tag size={16} /> Brand Marquees
                </button>
                <button onClick={() => handleNavigate('/admin/products')} className={navItemClass('/admin/products')}>
                  <Package size={16} /> Retail Products
                </button>
                <button onClick={() => handleNavigate('/admin/orders')} className={navItemClass('/admin/orders')}>
                  <ShoppingBag size={16} /> Retail Orders
                </button>
                <button onClick={() => handleNavigate('/admin/accessories')} className={navItemClass('/admin/accessories')}>
                  <Gem size={16} /> Accessories
                </button>
              </>
            )}

            {isAdmin && (
              <>
                <button onClick={() => handleNavigate('/admin/kyc-verifications')} className={navItemClass('/admin/kyc-verifications')}>
                  <UserCheck size={16} /> Bidder KYC Verifications
                </button>
                <button onClick={() => handleNavigate('/admin/auctions')} className={navItemClass('/admin/auctions')}>
                  <Gavel size={16} /> Auctions Management
                </button>
                <button onClick={() => handleNavigate('/admin/events')} className={navItemClass('/admin/events')}>
                  <CalendarCheck size={16} /> Events Management
                </button>
                <button onClick={() => handleNavigate('/admin/expert-reviews')} className={navItemClass('/admin/expert-reviews')}>
                  <Award size={16} /> Expert Reviews
                </button>
                <button onClick={() => handleNavigate('/admin/advertisement-requests')} className={navItemClass('/admin/advertisement-requests')}>
                  <Tv size={16} /> Advertisements
                </button>
                <button onClick={() => handleNavigate('/admin/testimonials')} className={navItemClass('/admin/testimonials')}>
                  <MessageSquare size={16} /> Testimonials
                </button>
                <button onClick={() => handleNavigate('/admin/host-applications')} className={navItemClass('/admin/host-applications')}>
                  <Building2 size={16} /> Host Applications
                </button>
                <button onClick={() => handleNavigate('/admin/trade-enquiries')} className={navItemClass('/admin/trade-enquiries')}>
                  <MessageSquare size={16} /> Enquiries & Messages
                </button>
                <button onClick={() => handleNavigate('/admin/cigar-enquiries')} className={navItemClass('/admin/cigar-enquiries')}>
                  <Flame size={16} /> Cigar Enquiries
                </button>
              </>
            )}

            {(isAdmin || isAccountant) && (
              <div className="flex items-center gap-1.5 text-[10px] text-[var(--color-gold)] uppercase tracking-widest mb-2 mt-4 pl-2 font-bold"><Shield size={12} /> System Control</div>
            )}

            {isAdmin && (
              <>
                <button onClick={() => handleNavigate('/admin/attributes')} className={navItemClass('/admin/attributes')}>
                  <Settings size={16} /> Product Attributes
                </button>
                <button onClick={() => handleNavigate('/admin/glossary')} className={navItemClass('/admin/glossary')}>
                  <Settings size={16} /> Glossary Management
                </button>
                <button onClick={() => handleNavigate('/admin/chatbot')} className={navItemClass('/admin/chatbot')}>
                  <Bot size={16} /> Chatbot FAQ
                </button>
              </>
            )}
            
            {isAccountant && (
              <>
                <button onClick={() => handleNavigate('/admin/financials')} className={navItemClass('/admin/financials')}>
                  <Wallet size={16} /> Financial Control
                </button>
                <button onClick={() => handleNavigate('/admin/bank-transfers')} className={navItemClass('/admin/bank-transfers')}>
                  <Wallet size={16} /> Bank Transfers
                </button>
              </>
            )}

            {isAdmin && (
              <button onClick={() => handleNavigate('/admin/settings')} className={navItemClass('/admin/settings')}>
                <Settings size={16} /> Platform Settings
              </button>
            )}

            <div className="mt-6 pt-6 border-t border-white/[0.05] flex flex-col gap-2">
              <button onClick={() => { logout(); navigate('/admin/login'); }} className="flex items-center gap-4 px-4 py-3 rounded-xl w-full text-red-400 hover:bg-red-500/10 transition-all text-left text-xs uppercase tracking-widest">
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 w-full md:ml-64 p-4 md:p-8 lg:p-12 flex flex-col z-10 min-h-[calc(100vh-5rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

