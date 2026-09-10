import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building2, Package, PlusCircle, User, LayoutDashboard, Wallet, Landmark, Megaphone, GraduationCap, Menu, X, ShoppingBag, Calendar, Settings, Truck, LogOut, Store, Gavel, MapPin } from 'lucide-react';
import NotificationBell from '../../components/NotificationBell';

export default function VendorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [vendorData, setVendorData] = useState(null);
  const [academyConfig, setAcademyConfig] = useState(null);

  React.useEffect(() => {
    import('../../api').then(({ default: api }) => {
      api.get('/academy')
        .then((res) => {
          if (res.data?.config) setAcademyConfig(res.data.config);
        })
        .catch(() => {});
    });
  }, []);

  React.useEffect(() => {
    if (user?.role === 'vendor_approved_unpaid') {
      import('../../api').then(({ default: api }) => {
        api.get('/vendor/profile', {
          headers: { Authorization: `Bearer ${user.token}` }
        }).then(res => setVendorData(res.data))
          .catch(err => console.error("Failed to fetch vendor data", err));
      });
    }
  }, [user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Handle specific vendor states
  if (user.role === 'vendor_pending') {
    return (
      <div className="vendor-theme min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="bg-[#0a0a0a] border border-gold/30 p-12 rounded-2xl max-w-md w-full text-center">
          <h2 className="text-2xl text-white font-light mb-4">Under Review</h2>
          <p className="text-white/60 mb-6">Your vendor application is currently being reviewed by our team. You will be notified via email once approved.</p>
          <button onClick={() => navigate('/')} className="text-gold uppercase tracking-widest text-xs hover:text-white transition-colors">Return to Home</button>
        </div>
      </div>
    );
  }

  if (user.role === 'vendor_rejected') {
    return (
      <div className="vendor-theme min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="bg-[#0a0a0a] border border-red-500/30 p-12 rounded-2xl max-w-md w-full text-center">
          <h2 className="text-2xl text-white font-light mb-4">Changes Required</h2>
          <p className="text-white/60 mb-6">Your application requires some adjustments before approval.</p>
          <button onClick={() => navigate('/vendor/onboarding')} className="w-full bg-gold text-black py-3 rounded font-medium mb-4 hover:bg-white transition-colors">Edit & Re-apply</button>
          <button onClick={() => navigate('/')} className="text-white/40 uppercase tracking-widest text-xs hover:text-white transition-colors">Return to Home</button>
        </div>
      </div>
    );
  }

  // Allow admin OR active vendors OR unpaid vendors
  const allowedVendorRoles = ['vendor_active', 'vendor', 'admin', 'super_admin', 'vendor_approved_unpaid'];
  if (!allowedVendorRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

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
      return `${baseClass} bg-[#c9a35b] text-black  font-bold border-transparent`;
    }
    return `${baseClass} text-[var(--color-ivory-muted)] hover:bg-white/[0.03] hover:text-[var(--color-ivory)] border-transparent`;
  };

  return (
    <div className="vendor-theme min-h-screen bg-[#050505] text-[var(--color-ivory)] flex flex-col font-sans">
      
      {/* Standalone Dashboard Header */}
      <header className="h-20 bg-black/60 backdrop-blur-xl border-b border-white/[0.05] flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button className="md:hidden text-[var(--color-ivory)] hover:text-[#e1bd70] transition-colors" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
            <div className="text-xl md:text-2xl font-serif text-[var(--color-ivory)] tracking-widest uppercase">
              The Grand Store
            </div>
            <div className="hidden md:block h-4 w-px bg-white/20 mx-2"></div>
            <div className="hidden md:block text-sm tracking-widest text-[#e1bd70] font-medium uppercase ">
              {user?.role === 'admin' ? 'Admin Gateway' : 'Business Partner'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <NotificationBell isVendor={true} />
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-sm font-serif">{user.name}</div>
              <div className="text-xs text-[#e1bd70] tracking-widest uppercase">{user?.role === 'admin' ? 'System Administrator' : 'Level 1 - New Vendor'}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#c9a35b] p-[1px]">
              <div className="w-full h-full bg-[#0a0a0a] rounded-full flex items-center justify-center">
                <Building2 size={18} className="text-[#e1bd70]" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Background glow effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        </div>

        {/* Glassmorphic Sidebar */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>
        )}
        <aside className={`w-64 bg-[#0a0a0a]/95 backdrop-blur-xl border-r border-white/[0.02] flex flex-col fixed top-20 bottom-0 left-0 z-50 overflow-y-auto transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <nav className="flex flex-col flex-1 p-6 gap-2 mt-2">
            
            <div className="text-[10px] text-[var(--color-ivory-muted)] uppercase tracking-widest mb-2 mt-2 pl-2">Overview</div>
            <button onClick={() => handleNavigate('/vendor/dashboard')} className={navItemClass('/vendor/dashboard')}>
              <LayoutDashboard size={16} /> Overview
            </button>
            <button onClick={() => handleNavigate('/vendor/orders')} className={navItemClass('/vendor/orders')}>
              <ShoppingBag size={16} /> Order History
            </button>
            <button onClick={() => handleNavigate('/vendor/wallet')} className={navItemClass('/vendor/wallet')}>
              <Wallet size={16} /> Vendor Wallet
            </button>
            <button onClick={() => handleNavigate('/vendor/banking')} className={navItemClass('/vendor/banking')}>
              <Landmark size={16} /> Bank Details
            </button>

            <div className="text-[10px] text-[var(--color-ivory-muted)] uppercase tracking-widest mb-2 mt-4 pl-2">Products & Inventory</div>
            <button onClick={() => handleNavigate('/vendor/inventory')} className={navItemClass('/vendor/inventory')}>
              <Package size={16} /> Auction Inventory
            </button>
            <button onClick={() => handleNavigate('/vendor/products')} className={navItemClass('/vendor/products')}>
              <Package size={16} /> Retail Products
            </button>
            <button onClick={() => handleNavigate('/vendor/product-add')} className={navItemClass('/vendor/product-add')}>
              <PlusCircle size={16} /> Add Retail
            </button>
            <button onClick={() => handleNavigate('/vendor/auction-submit')} className={navItemClass('/vendor/auction-submit')}>
              <PlusCircle size={16} /> Add Auction Lot
            </button>
            <button onClick={() => handleNavigate('/auction')} className={navItemClass('/auction')}>
              <Gavel size={16} /> Live Auctions
            </button>
            <button onClick={() => handleNavigate('/vendor/events')} className={navItemClass('/vendor/events')}>
              <Calendar size={16} /> Events
            </button>
            
            <div className="text-[10px] text-[var(--color-ivory-muted)] uppercase tracking-widest mb-2 mt-4 pl-2">Growth & Support</div>
            <button onClick={() => handleNavigate('/vendor/store')} className={navItemClass('/vendor/store')}>
              <Store size={16} /> Store Management
            </button>
            <button onClick={() => handleNavigate('/vendor/estate-builder')} className={navItemClass('/vendor/estate-builder')}>
              <MapPin size={16} /> Estate Profile
            </button>
            <button onClick={() => handleNavigate('/vendor/marketing')} className={navItemClass('/vendor/marketing')}>
              <Megaphone size={16} /> Marketing Centre
            </button>
            {academyConfig?.isEnabled !== false && (
              <button onClick={() => handleNavigate('/vendor/academy')} className={navItemClass('/vendor/academy')}>
                <div className="flex items-center justify-between w-full">
                  <span className="flex items-center gap-4">
                    <GraduationCap size={16} /> {academyConfig?.sidebarLabel || 'Vendor Academy'}
                  </span>
                  {academyConfig?.sidebarBadge && (
                    <span className="px-1.5 py-0.5 rounded bg-[#c9a35b] text-black text-[9px] font-bold uppercase tracking-wider">
                      {academyConfig.sidebarBadge}
                    </span>
                  )}
                </div>
              </button>
            )}
            <div className="mt-6 pt-6 border-t border-white/[0.05]">
              <button onClick={() => handleNavigate('/vendor/shipping')} className={navItemClass('/vendor/shipping')}>
                <Truck size={16} /> Shipping Profile
              </button>
              <button onClick={() => handleNavigate('/vendor/profile')} className="flex items-center gap-4 px-4 py-3 mt-2 rounded-xl w-full text-[var(--color-ivory-muted)] hover:bg-[var(--color-gold)]/10 hover:text-[#e1bd70] transition-all text-left text-xs uppercase tracking-widest border border-transparent hover:border-[var(--color-gold)]/20">
                <User size={16} /> Vendor Profile
              </button>
              <button onClick={() => { logout(); navigate('/login'); }} className="flex items-center gap-4 px-4 py-3 mt-2 rounded-xl w-full text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all text-left text-xs uppercase tracking-widest border border-transparent">
                <LogOut size={16} /> Logout
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 w-full md:ml-64 p-4 md:p-8 lg:p-12 flex flex-col z-10 min-h-[calc(100vh-5rem)] relative">
          <Outlet />

          {user.role === 'vendor_approved_unpaid' && location.pathname !== '/vendor/payment' && (
            <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm p-4">
               <div className="bg-[#0a0a0a] p-8 rounded-xl border border-gold/30 text-center max-w-md shadow-2xl">
                  <div className="w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Store size={32} className="text-gold" />
                  </div>
                  <h2 className="text-2xl text-white mb-4 font-light">Activation Required</h2>
                  
                  {vendorData?.paymentReminderSent && (
                    <div className="bg-red-500/20 border border-red-500 text-red-100 p-4 rounded mb-6 text-sm font-bold animate-pulse">
                      ⚠️ URGENT: Admin has requested immediate payment of your registration fee to activate your store.
                    </div>
                  )}

                  <p className="text-white/60 mb-8 leading-relaxed">
                    Your vendor account is currently inactive. Please pay the registration fee to unlock your dashboard and make your products visible.
                  </p>
                  <button 
                    onClick={() => navigate('/vendor/payment')} 
                    className="bg-gold text-black px-8 py-3 rounded-lg font-medium hover:bg-white transition-colors"
                  >
                    Pay Registration Fee
                  </button>
               </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
