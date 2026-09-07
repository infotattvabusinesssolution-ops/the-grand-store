import React, { useState } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  Menu,
  X,
  Package,
  User,
  Heart,
  Ticket,
  Gavel,
  Building2,
  MapPin,
  LogOut,
  Trash2,
  Landmark,
  Calendar,
  Coins,
} from "lucide-react";
import api from '../../api';

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) {
      try {
        await api.delete(`/auth/profile`);
        logout();
        navigate("/");
      } catch (error) {
        alert(error.response?.data?.message || "Failed to delete account");
        console.error("Error deleting account:", error);
      }
    }
  };

  const NavLinks = () => (
    <>
      <button
        onClick={() => {
          navigate("/customer/profile");
          setMobileMenuOpen(false);
        }}
        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left text-xs uppercase tracking-widest border ${
          location.pathname === "/customer/profile"
            ? "bg-white/[0.05] text-gold-gradient shadow-[0_0_15px_rgba(212,175,55,0.05)] font-semibold border-white/[0.05]"
            : "text-[var(--color-ivory-muted)] hover:bg-white/[0.03] hover:text-[var(--color-ivory)] border-transparent"
        }`}
      >
        <User size={16} /> My Profile
      </button>
      <button
        onClick={() => {
          navigate("/customer/calendar");
          setMobileMenuOpen(false);
        }}
        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left text-xs uppercase tracking-widest border ${
          location.pathname === "/customer/calendar"
            ? "bg-white/[0.05] text-gold-gradient shadow-[0_0_15px_rgba(212,175,55,0.05)] font-semibold border-white/[0.05]"
            : "text-[var(--color-ivory-muted)] hover:bg-white/[0.03] hover:text-[var(--color-ivory)] border-transparent"
        }`}
      >
        <Calendar size={16} /> Activity Calendar
      </button>
      <button
        onClick={() => {
          navigate("/customer/banking");
          setMobileMenuOpen(false);
        }}
        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left text-xs uppercase tracking-widest border ${
          location.pathname === "/customer/banking"
            ? "bg-white/[0.05] text-gold-gradient shadow-[0_0_15px_rgba(212,175,55,0.05)] font-semibold border-white/[0.05]"
            : "text-[var(--color-ivory-muted)] hover:bg-white/[0.03] hover:text-[var(--color-ivory)] border-transparent"
        }`}
      >
        <Landmark size={16} /> Bank Details
      </button>
      <button
        onClick={() => {
          navigate("/customer/orders");
          setMobileMenuOpen(false);
        }}
        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left text-xs uppercase tracking-widest border ${
          location.pathname === "/customer/orders"
            ? "bg-white/[0.05] text-gold-gradient shadow-[0_0_15px_rgba(212,175,55,0.05)] font-semibold border-white/[0.05]"
            : "text-[var(--color-ivory-muted)] hover:bg-white/[0.03] hover:text-[var(--color-ivory)] border-transparent"
        }`}
      >
        <Package size={16} /> My Orders
      </button>
      <button
        onClick={() => {
          navigate("/customer/super-coins");
          setMobileMenuOpen(false);
        }}
        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left text-xs uppercase tracking-widest border ${
          location.pathname === "/customer/super-coins"
            ? "bg-white/[0.05] text-gold-gradient shadow-[0_0_15px_rgba(212,175,55,0.05)] font-semibold border-white/[0.05]"
            : "text-[var(--color-ivory-muted)] hover:bg-white/[0.03] hover:text-[var(--color-ivory)] border-transparent"
        }`}
      >
        <Coins size={16} /> Super Coins
      </button>
      <button
        onClick={() => {
          navigate("/customer/wishlist");
          setMobileMenuOpen(false);
        }}
        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left text-xs uppercase tracking-widest border ${
          location.pathname === "/customer/wishlist"
            ? "bg-white/[0.05] text-gold-gradient shadow-[0_0_15px_rgba(212,175,55,0.05)] font-semibold border-white/[0.05]"
            : "text-[var(--color-ivory-muted)] hover:bg-white/[0.03] hover:text-[var(--color-ivory)] border-transparent"
        }`}
      >
        <Heart size={16} /> Wishlist
      </button>
      <button
        onClick={() => {
          navigate("/customer/tickets");
          setMobileMenuOpen(false);
        }}
        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left text-xs uppercase tracking-widest border ${
          location.pathname === "/customer/tickets"
            ? "bg-white/[0.05] text-gold-gradient shadow-[0_0_15px_rgba(212,175,55,0.05)] font-semibold border-white/[0.05]"
            : "text-[var(--color-ivory-muted)] hover:bg-white/[0.03] hover:text-[var(--color-ivory)] border-transparent"
        }`}
      >
        <Ticket size={16} /> My Tickets
      </button>
      <button
        onClick={() => {
          navigate("/customer/auctions");
          setMobileMenuOpen(false);
        }}
        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left text-xs uppercase tracking-widest border ${
          location.pathname === "/customer/auctions"
            ? "bg-white/[0.05] text-gold-gradient shadow-[0_0_15px_rgba(212,175,55,0.05)] font-semibold border-white/[0.05]"
            : "text-[var(--color-ivory-muted)] hover:bg-white/[0.03] hover:text-[var(--color-ivory)] border-transparent"
        }`}
      >
        <Gavel size={16} /> Auction Bids
      </button>
      <button
        onClick={() => {
          navigate("/customer/referrals");
          setMobileMenuOpen(false);
        }}
        className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-left text-xs uppercase tracking-widest border ${
          location.pathname === "/customer/referrals"
            ? "bg-white/[0.05] text-gold-gradient shadow-[0_0_15px_rgba(212,175,55,0.05)] font-semibold border-white/[0.05]"
            : "text-[var(--color-ivory-muted)] hover:bg-white/[0.03] hover:text-[var(--color-ivory)] border-transparent"
        }`}
      >
        <Ticket size={16} /> Refer & Earn
      </button>

      {user?.role === "vendor_active" && (
        <div className="mt-8 pt-8 border-t border-white/[0.05]">
          <button
            onClick={() => {
              navigate("/vendor/dashboard");
              setMobileMenuOpen(false);
            }}
            className="flex items-center gap-4 px-4 py-3 rounded-xl w-full text-[var(--color-ivory-muted)] hover:bg-[var(--color-gold)]/10 hover:text-gold-gradient transition-all text-left text-xs uppercase tracking-widest border border-transparent hover:border-[var(--color-gold)]/20"
          >
            <Building2 size={16} /> Vendor Dashboard
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-[var(--color-ivory)] flex flex-col font-sans overflow-x-hidden">
      {/* Standalone Dashboard Header */}
      <header className="h-16 md:h-20 bg-black/60 backdrop-blur-xl border-b border-white/[0.05] flex items-center justify-between px-4 md:px-8 sticky top-0 z-50">
        <div className="flex items-center gap-3 md:gap-4">
          <button
            className="lg:hidden text-[var(--color-ivory-muted)] hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div
            className="flex items-center gap-2 md:gap-4 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="text-lg md:text-2xl font-serif text-[var(--color-ivory)] tracking-widest uppercase truncate max-w-[120px] sm:max-w-none">
              Grand Store
            </div>
            <div className="h-4 w-px bg-white/20 mx-1 md:mx-2 hidden sm:block"></div>
            <div className="text-[10px] md:text-sm tracking-widest text-gold-gradient font-medium uppercase hidden sm:block">
              Client Portal
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <button
            onClick={() => navigate("/customer/cart")}
            className="relative text-[var(--color-ivory-muted)] hover:text-[var(--color-ivory)] transition-colors"
          >
            <Package size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-sm font-serif truncate max-w-[150px]">
                {user?.name}
              </div>
              <div className="text-xs text-gold-gradient tracking-widest uppercase">
                Private Client
              </div>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-[var(--color-gold)] to-yellow-700 p-[1px] shrink-0">
              <div className="w-full h-full bg-[#0a0a0a] rounded-full flex items-center justify-center">
                <User
                  size={14}
                  className="text-gold-gradient md:w-[18px] md:h-[18px]"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 relative w-full max-w-[100vw]">
        {/* Background glow effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] md:w-[50%] md:h-[50%] rounded-full bg-[var(--color-gold)]/5 blur-[100px] md:blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] md:w-[40%] md:h-[40%] rounded-full bg-[var(--color-gold)]/5 blur-[80px] md:blur-[100px]"></div>
        </div>

        {/* Desktop Glassmorphic Sidebar */}
        <aside className="hidden lg:flex w-64 bg-white/[0.02] backdrop-blur-xl border-r border-white/[0.02] flex-col fixed top-20 bottom-0 left-0 z-10 overflow-y-auto">
          <nav className="flex flex-col flex-1 p-6 gap-2 mt-4">
            <NavLinks />
          </nav>
          <div className="p-6 flex flex-col gap-3">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl w-full text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-all text-xs uppercase tracking-widest border border-transparent hover:border-red-500/20"
            >
              <LogOut size={16} /> Sign Out
            </button>
            <button
              onClick={handleDeleteAccount}
              className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl w-full text-red-700/70 hover:bg-red-900/20 hover:text-red-500 transition-all text-xs uppercase tracking-widest border border-transparent hover:border-red-900/30"
            >
              <Trash2 size={16} /> Delete Account
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden top-16"
              />
              {/* Drawer */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed top-16 bottom-0 left-0 w-3/4 max-w-[300px] bg-[#0a0a0a] border-r border-white/10 z-40 flex flex-col overflow-y-auto shadow-2xl lg:hidden"
              >
                <div className="p-6 border-b border-white/5 md:hidden">
                  <div className="text-sm font-serif mb-1">{user?.name}</div>
                  <div className="text-xs text-gold-gradient tracking-widest uppercase">
                    Private Client
                  </div>
                </div>
                <nav className="flex flex-col flex-1 p-6 gap-2">
                  <NavLinks />
                </nav>
                <div className="p-6 border-t border-white/5 flex flex-col gap-3">
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl w-full text-red-400/70 bg-red-500/5 hover:bg-red-500/10 hover:text-red-400 transition-all text-xs uppercase tracking-widest border border-red-500/10 hover:border-red-500/20"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex items-center justify-center gap-3 px-4 py-3 rounded-xl w-full text-red-700/70 bg-red-900/10 hover:bg-red-900/20 hover:text-red-500 transition-all text-xs uppercase tracking-widest border border-red-900/20 hover:border-red-900/30"
                  >
                    <Trash2 size={16} /> Delete Account
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <main className="flex-1 lg:ml-64 p-3 sm:p-6 lg:p-8 xl:p-10 flex flex-col gap-6 md:gap-10 z-10 w-full overflow-x-hidden min-h-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
