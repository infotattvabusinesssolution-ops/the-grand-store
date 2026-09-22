import React from 'react';
import { UserCheck, Coins, Phone, ArrowRight, ShieldCheck, X } from 'lucide-react';

export default function ExistingAccountModal({
  isOpen,
  userData,
  onLogin,
  onContinueAsGuest,
  onClose
}) {
  if (!isOpen || !userData) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#121212] border border-[#c9a35b]/40 rounded-2xl shadow-2xl p-6 sm:p-7 text-white overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gold Ambient Glow */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-[#c9a35b]/20 rounded-full blur-3xl pointer-events-none" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white p-1 rounded-full transition"
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        {/* Icon & Title */}
        <div className="flex items-center gap-3.5 mb-3">
          <div className="w-12 h-12 rounded-full bg-[#c9a35b]/15 border border-[#c9a35b]/30 flex items-center justify-center text-[#c9a35b] shadow-inner">
            <UserCheck size={24} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-[#c9a35b] font-semibold">
              Grand Store Patron
            </span>
            <h3 className="text-xl font-serif font-bold text-white tracking-tight">
              Account Detected!
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
          An account already exists for <strong className="text-white font-medium">{userData.email}</strong>.
          {userData.name ? ` Welcome back, ${userData.name}!` : ''}
        </p>

        {/* Account Snapshot Badge */}
        <div className="my-4 bg-white/5 border border-white/10 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between text-white/80">
            <span className="flex items-center gap-1.5 text-white/60">
              <Coins size={14} className="text-[#c9a35b]" />
              SuperCoins Balance:
            </span>
            <span className="font-semibold text-[#c9a35b] font-mono text-sm">
              {userData.superCoinsBalance || 0} Coins
            </span>
          </div>
          {userData.phone && (
            <div className="flex items-center justify-between text-white/80 pt-1.5 border-t border-white/5">
              <span className="flex items-center gap-1.5 text-white/60">
                <Phone size={14} className="text-white/40" />
                Linked Phone:
              </span>
              <span className="font-mono text-white/90">
                {userData.phone}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            onClick={onLogin}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[#c9a35b] to-[#dfb76c] hover:from-[#dfb76c] hover:to-[#c9a35b] text-black font-semibold rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#c9a35b]/20 transition transform active:scale-[0.98]"
          >
            <span>Login to Use SuperCoins & Addresses</span>
            <ArrowRight size={16} />
          </button>

          <button
            type="button"
            onClick={onContinueAsGuest}
            className="w-full py-3 px-4 bg-white/10 hover:bg-white/15 text-white/90 font-medium rounded-xl text-xs sm:text-sm border border-white/15 transition active:scale-[0.98]"
          >
            Continue as Guest (Auto-Link to Account)
          </button>
        </div>

        {/* Trust & Linking Guarantee Note */}
        <div className="mt-4 flex items-start gap-2 bg-[#c9a35b]/10 border border-[#c9a35b]/20 rounded-lg p-2.5">
          <ShieldCheck size={16} className="text-[#c9a35b] shrink-0 mt-0.5" />
          <p className="text-[11px] text-[#c9a35b]/90 leading-tight">
            <strong>Seamless Auto-Link:</strong> If you continue as guest, this order and any earned SuperCoins will automatically appear in your account history when you log in.
          </p>
        </div>
      </div>
    </div>
  );
}
