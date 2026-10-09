import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, Lock, Mail, Eye, EyeOff, ArrowLeft, KeyRound, AlertTriangle } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const userData = await adminLogin(email, password);

      let defaultRoute = '/admin/dashboard';
      if (userData.role === 'product_manager') {
        defaultRoute = '/admin/products';
      }

      const targetRoute = searchParams.get('redirect') || defaultRoute;
      navigate(targetRoute);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your administrative credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[var(--color-ivory,#f5f2eb)] flex items-center justify-center px-4 py-12 md:py-20 relative font-sans">
      {/* Back to Storefront Link */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-white/50 hover:text-white transition-colors text-[10px] uppercase tracking-widest font-bold z-50 cursor-pointer"
      >
        <ArrowLeft size={16} /> Return to Storefront
      </Link>

      <div className="w-full max-w-md z-10">
        {/* Gateway Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-gold,#c9a35b)]/10 border border-[var(--color-gold,#c9a35b)]/30 text-[#d8b76d] text-[10px] uppercase tracking-[0.2em] font-bold mb-4 shadow-[0_0_15px_rgba(201,163,91,0.15)]">
            <Shield size={13} className="text-[#d8b76d]" />
            Administrative Gateway
          </div>
          <h1 className="text-[#d8b76d] font-serif text-3xl md:text-4xl font-medium tracking-tight mb-2">
            The Grand Store
          </h1>
          <p className="text-white/50 text-xs md:text-sm">
            Central Management & Executive Control Console
          </p>
        </div>

        {/* Login Card */}
        <form 
          onSubmit={handleSubmit} 
          className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-7 md:p-9 shadow-2xl backdrop-blur-md relative overflow-hidden"
        >
          {/* Subtle Top Gold Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#d8b76d] to-transparent opacity-60"></div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-start gap-3">
              <AlertTriangle size={18} className="shrink-0 text-red-400 mt-0.5" />
              <div className="leading-relaxed">
                {error}
              </div>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-white/60 text-[10px] font-bold uppercase tracking-widest mb-2">
                Administrator Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@grandstore.com"
                  className="w-full pl-10 pr-4 py-3 bg-black/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#d8b76d] transition-all placeholder:text-white/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/60 text-[10px] font-bold uppercase tracking-widest mb-2">
                Security Passkey / Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-white/40">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-12 py-3 bg-black/60 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#d8b76d] transition-all placeholder:text-white/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/40 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#d8b76d] via-[#e2c786] to-[#c9a35b] text-black font-semibold uppercase tracking-widest text-xs transition-all hover:shadow-[0_0_25px_rgba(216,183,109,0.45)] hover:brightness-105 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mt-3 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Authenticating Credentials...</span>
              ) : (
                <>
                  <KeyRound size={15} />
                  <span>Authenticate & Enter</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-white/[0.07] text-center">
            <p className="text-[11px] text-white/40">
              Not an administrator?{' '}
              <Link to="/login" className="text-[#d8b76d] hover:underline font-medium">
                Customer & Vendor Login
              </Link>
            </p>
          </div>
        </form>

        {/* Security Notice */}
        <div className="mt-6 text-center text-[10px] text-white/30 uppercase tracking-widest flex items-center justify-center gap-1.5">
          <Shield size={11} /> Authorized Executive & Staff Personnel Only
        </div>
      </div>
    </div>
  );
}
