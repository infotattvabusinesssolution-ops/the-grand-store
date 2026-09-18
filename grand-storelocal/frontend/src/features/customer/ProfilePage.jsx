import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, AlertCircle, Loader2, Store, Clock, Landmark, ArrowRight, Phone, Calendar as CalendarIcon, Coins } from 'lucide-react';
import { Link } from 'react-router-dom';
import BidderKycCard from '../../components/auction/BidderKycCard';
import CustomerCalendar from './CustomerCalendar';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);

  // Form States
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);

  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.role === 'admin') {
      navigate('/admin/auctions');
    } else {
      setProfileForm({ 
        name: user.name || '', 
        email: user.email || '', 
        phone: user.phone || user.phoneNumber || '' 
      });
      setLoading(false);

      // Fetch latest profile to sync phone if updated on server
      api.get('/auth/profile').then(res => {
        if (res.data) {
          updateUser(res.data);
          setProfileForm(prev => ({
            ...prev,
            name: res.data.name || prev.name,
            email: res.data.email || prev.email,
            phone: res.data.phone || res.data.phoneNumber || prev.phone || ''
          }));
        }
      }).catch(() => {});
    }
  }, [user?._id, navigate]);

  if (!user || loading) return null;

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage(null);
    try {
      const { data } = await api.put(`/auth/profile`, {
        name: profileForm.name,
        email: (profileForm.email || '').trim().toLowerCase(),
        phone: profileForm.phone,
        phoneNumber: profileForm.phone
      });
      updateUser(data);
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (err) {
      setProfileMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
    }
    setIsSavingPassword(true);
    setPasswordMessage(null);
    try {
      const { data } = await api.put(`/auth/profile`, {
        currentPassword: passwordForm.currentPassword,
        password: passwordForm.newPassword
      });
      updateUser(data);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordMessage({ type: 'success', text: 'Password changed successfully' });
      setTimeout(() => setPasswordMessage(null), 3000);
    } catch (err) {
      setPasswordMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-12 pb-16">
      
      {/* Header */}
      <section className="mb-4">
        <h1 className="text-[var(--color-ivory)] font-serif text-4xl mb-2 tracking-wide">
          Profile Settings
        </h1>
        <p className="text-[var(--color-ivory-muted)] text-md font-light">
          Manage your personal details, 18+ store purchase & auction compliance verification, and payment accounts.
        </p>
      </section>

      {/* Vendor Application Status Section */}
      {(user.role === 'vendor_pending' || user.role === 'vendor_approved_unpaid') && (
        <section className="bg-[#11100e] border border-[#c9a35b]/30 rounded-lg p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#c9a35b]/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          
          <h2 className="text-xl text-[var(--color-ivory)] font-serif mb-4 flex items-center gap-2">
            <Store size={20} className="text-[#c9a35b]" />
            Vendor Application Status
          </h2>
          
          {user.role === 'vendor_pending' ? (
            <div className="flex items-start gap-4">
              <div className="bg-yellow-500/10 p-2 rounded-full mt-1">
                <Clock className="text-yellow-500" size={20} />
              </div>
              <div>
                <p className="text-[#eee8dd] font-medium text-lg">Under Review</p>
                <p className="text-[#918a7f] text-sm mt-1">
                  Your vendor application is currently being reviewed by our administration team. We will notify you once a decision has been made.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="bg-green-500/10 p-2 rounded-full mt-1">
                  <CheckCircle2 className="text-green-500" size={20} />
                </div>
                <div>
                  <p className="text-[#eee8dd] font-medium text-lg">Application Approved</p>
                  <p className="text-[#918a7f] text-sm mt-1 max-w-sm">
                    Congratulations! Your application is approved. Please pay the registration fee to activate your store.
                  </p>
                </div>
              </div>
              <Link 
                to="/vendor/payment" 
                className="bg-[#c9a35b] hover:bg-[#b08d4a] text-black font-semibold py-2 px-6 rounded transition-colors whitespace-nowrap w-full sm:w-auto text-center"
              >
                Pay Registration Fee
              </Link>
            </div>
          )}
        </section>
      )}

      {/* 18+ Auction Bidder Qualification & KYC */}
      <BidderKycCard onNotify={(msg) => setProfileMessage({ type: 'success', text: msg })} />

      {/* Bank Details & Refund Accounts Quick Card */}
      <section className="bg-gradient-to-r from-[#14120e] via-[#0d0d0d] to-black border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-gold)]/15 border border-[var(--color-gold)]/30 flex items-center justify-center text-[var(--color-gold)] shrink-0">
            <Landmark size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Bank Details & Refund Accounts</h3>
            <p className="text-xs text-white/50">Manage your South African bank account for auction deposit refunds and escrow returns.</p>
          </div>
        </div>
        <Link
          to="/customer/banking"
          className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all self-start sm:self-auto shrink-0 cursor-pointer"
        >
          Manage Bank Account <ArrowRight size={13} />
        </Link>
      </section>

      {/* Super Coins Loyalty Wallet Quick Card */}
      <section className="bg-gradient-to-r from-[#17140e] via-[#0d0d0d] to-black border border-[var(--color-gold)]/25 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-gold)]/15 border border-[var(--color-gold)]/30 flex items-center justify-center text-[var(--color-gold)] shrink-0">
            <Coins size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Super Coins Loyalty Wallet</h3>
              <span className="text-[10px] font-mono text-[var(--color-gold)] bg-[var(--color-gold)]/10 px-2 py-0.5 rounded border border-[var(--color-gold)]/20">
                {user.superCoinsBalance || 0} Coins
              </span>
            </div>
            <p className="text-xs text-white/50">
              Spend up to 10% on checkout with your loyalty coins. Redeemable on eligible fine wines, spirits, and luxury cigars.
            </p>
          </div>
        </div>
        <Link
          to="/customer/super-coins"
          className="py-2.5 px-4 rounded-xl bg-[var(--color-gold)]/10 hover:bg-[var(--color-gold)]/20 border border-[var(--color-gold)]/30 text-[var(--color-gold)] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all self-start sm:self-auto shrink-0 cursor-pointer"
        >
          View Wallet <ArrowRight size={13} />
        </Link>
      </section>

      {/* Profile Form */}
      <section>
        <h2 className="text-xl text-[var(--color-ivory)] font-serif mb-6 border-b border-white/10 pb-2">
          Personal Information
        </h2>
        
        {profileMessage && (
          <div className={`p-3 rounded-md text-sm mb-6 ${profileMessage.type === 'error' ? 'bg-red-900/20 text-red-400' : 'bg-green-900/20 text-green-400'} flex items-center gap-2`}>
            {profileMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {profileMessage.text}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Name</label>
              <input 
                type="text" 
                required
                value={profileForm.name}
                onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                className="w-full bg-transparent border-b border-white/20 px-0 py-2 text-white focus:border-[var(--color-gold)] focus:outline-none transition-colors font-light text-lg"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Email Address</label>
              <input 
                type="email" 
                required
                value={profileForm.email}
                onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
                placeholder="your.email@example.com"
                className="w-full bg-transparent border-b border-white/20 px-0 py-2 text-white focus:border-[var(--color-gold)] focus:outline-none transition-colors font-light text-lg"
              />
            </div>
            <div className="md:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                <label className="text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] flex items-center gap-1.5">
                  <Phone size={13} className="text-[var(--color-gold)]" /> Phone Number
                </label>
                <span className="text-[11px] text-[var(--color-gold)]/80">
                  Auto-fills during checkout for courier & SMS tracking
                </span>
              </div>
              <input 
                type="tel" 
                placeholder="e.g. +27 82 123 4567"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                className="w-full bg-transparent border-b border-white/20 px-0 py-2 text-white focus:border-[var(--color-gold)] focus:outline-none transition-colors font-light text-lg placeholder:text-white/20"
              />
              <p className="text-xs text-[var(--color-ivory-muted)] mt-2 font-light leading-relaxed">
                Your saved phone number is automatically populated in checkout and shared with couriers (Courier Guy / DHL) for delivery alerts, gate access, and collection pin codes.
              </p>
            </div>
          </div>
          <div>
            <button 
              type="submit" 
              disabled={isSavingProfile || (
                profileForm.name === (user.name || '') && 
                profileForm.phone === (user.phone || user.phoneNumber || '')
              )}
              className="mt-2 text-xs uppercase tracking-widest font-bold text-black bg-[var(--color-gold)] px-8 py-3 hover:bg-[#b58b38] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
            >
              {isSavingProfile ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>

      {/* Password Form */}
      <section>
        <h2 className="text-xl text-[var(--color-ivory)] font-serif mb-6 border-b border-white/10 pb-2 mt-8">
          Security
        </h2>

        {passwordMessage && (
          <div className={`p-3 rounded-md text-sm mb-6 ${passwordMessage.type === 'error' ? 'bg-red-900/20 text-red-400' : 'bg-green-900/20 text-green-400'} flex items-center gap-2`}>
            {passwordMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {passwordMessage.text}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Current Password</label>
              <input 
                type="password" 
                required
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                className="w-full max-w-sm bg-transparent border-b border-white/20 px-0 py-2 text-white focus:border-[var(--color-gold)] focus:outline-none transition-colors font-light text-lg tracking-widest"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">New Password</label>
              <input 
                type="password" 
                required
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                className="w-full bg-transparent border-b border-white/20 px-0 py-2 text-white focus:border-[var(--color-gold)] focus:outline-none transition-colors font-light text-lg tracking-widest"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Confirm New Password</label>
              <input 
                type="password" 
                required
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                className="w-full bg-transparent border-b border-white/20 px-0 py-2 text-white focus:border-[var(--color-gold)] focus:outline-none transition-colors font-light text-lg tracking-widest"
              />
            </div>
          </div>
          <div>
            <button 
              type="submit" 
              disabled={isSavingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
              className="mt-2 text-xs uppercase tracking-widest font-bold text-white border border-white/20 hover:bg-white/10 px-8 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
            >
              {isSavingPassword ? <Loader2 size={16} className="animate-spin" /> : 'Update Password'}
            </button>
          </div>
        </form>
      </section>

      {/* Customer Activity & Delivery Schedule Calendar */}
      <section className="border-t border-white/10 pt-10">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl text-[var(--color-ivory)] font-serif mb-1 tracking-wide flex items-center gap-2.5">
              <CalendarIcon className="text-[var(--color-gold)]" size={24} /> Activity & Delivery Calendar
            </h2>
            <p className="text-xs text-[var(--color-ivory-muted)]">
              Track scheduled order deliveries, booked tasting tickets, auction deadlines, and birthday privileges.
            </p>
          </div>
          <Link
            to="/customer/calendar"
            className="py-2 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs uppercase tracking-wider font-semibold transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            Standalone Calendar <ArrowRight size={13} />
          </Link>
        </div>
        <CustomerCalendar embedded={true} />
      </section>

    </div>
  );
}
