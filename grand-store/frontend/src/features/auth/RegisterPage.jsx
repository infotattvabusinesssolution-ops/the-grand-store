import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowRight, Lock, Mail, User, Eye, EyeOff, ArrowLeft, 
  Smartphone, Calendar, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import { auth, googleProvider, appleProvider, signInWithPopup } from '../../firebase';
import CountryCodeSelect from '../../components/CountryCodeSelect';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+27');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [isAgeConfirmed, setIsAgeConfirmed] = useState(true);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState((searchParams.get('ref') || '').trim().toUpperCase());
  const { register, googleLogin, appleLogin } = useAuth();
  const navigate = useNavigate();

  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAgeConfirmed) {
      setError('You must confirm you are at least 18 years of age to purchase liquor on Grand Store.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const fullPhone = phone.trim() ? (phone.trim().startsWith('+') ? phone.trim() : `${countryCode}${phone.trim().replace(/^0+/, '')}`) : '';
      await register(name, email, password, referralCode, {
        phone: fullPhone,
        dateOfBirth: dateOfBirth || undefined,
        isAgeVerified: isAgeConfirmed
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const userData = await googleLogin(userCredential, 'customer', referralCode);
      let defaultRoute = '/customer/profile';
      if (userData.role === 'admin') defaultRoute = '/admin/auctions';
      if (userData.role === 'vendor_active') defaultRoute = '/vendor/dashboard';
      navigate(defaultRoute);
    } catch (err) {
      console.error('Google sign-up error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in popup was closed before completing.');
      } else {
        setError(err.message || 'Google Sign Up Failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithPopup(auth, appleProvider);
      const userData = await appleLogin(userCredential, 'customer', referralCode);
      let defaultRoute = '/customer/profile';
      navigate(defaultRoute);
    } catch (err) {
      console.error('Apple sign-up error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Apple sign-in popup was closed before completing.');
      } else {
        setError(err.message || 'Apple Sign Up Failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 py-12 md:py-20 relative font-sans text-stone-200">
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-stone-400 hover:text-white transition-colors text-[10px] uppercase tracking-widest font-bold z-50 cursor-pointer"
      >
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="w-full max-w-lg z-10">
        <div className="text-center mb-8">
          <span className="inline-block text-[10px] uppercase tracking-[0.25em] font-semibold text-[#c9a35b] mb-2 px-3 py-1 bg-[#c9a35b]/10 border border-[#c9a35b]/20 rounded-full">
            New Customer Access
          </span>
          <h1 className="text-white font-serif text-3xl md:text-4xl font-normal tracking-tight mb-2">
            Join the Grand Store Cellar
          </h1>
          <p className="text-stone-400 text-xs md:text-sm">
            Create your private account to unlock premium vintages, private casks, and live auctions.
          </p>
        </div>

        {success ? (
          <div className="bg-[#0a0a0a] border border-white/10 p-8 rounded-2xl shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 bg-[#c9a35b]/10 rounded-full flex items-center justify-center mx-auto border border-[#c9a35b]/30">
              <Mail className="w-7 h-7 text-[#c9a35b]" />
            </div>
            <h2 className="text-xl font-serif text-white">Check Your Email</h2>
            <p className="text-stone-400 text-xs md:text-sm leading-relaxed">
              We've dispatched a verification confirmation to <strong className="text-white">{email}</strong>. 
              Please verify your email address to complete activation.
            </p>
            <div className="pt-2">
              <Link 
                to="/login" 
                className="inline-block py-3 px-6 bg-[#c9a35b] text-black text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-[#d8b76d] transition-colors"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-[#0a0a0a] border border-white/10 p-6 md:p-8 rounded-2xl shadow-2xl space-y-5">
            {error && (
              <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-center leading-relaxed">
                {error}
              </div>
            )}

            {/* Social 1-Click Fast Registration (Strictly NO Facebook, NO WhatsApp) */}
            <div className="w-full">
              <button
                type="button"
                disabled={isLoading}
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-white hover:bg-stone-100 text-black font-semibold rounded-xl text-xs transition-all shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-black font-semibold">Continue with Google</span>
              </button>

              {/*
              ========================================================================
              [COMMENTED OUT FOR NOW AS REQUESTED - APPLE SIGN-IN]
              ========================================================================
              <button
                type="button"
                disabled={isLoading}
                onClick={handleAppleLogin}
                className="flex items-center justify-center gap-2 py-3 px-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/20 text-white rounded-xl text-xs font-medium transition-all disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.58-7.7-11.66-13.98-5.99-9.24-10.74-19.67-14.25-31.29-3.51-11.63-5.27-22.6-5.27-32.92 0-14.47 3.51-26.44 10.53-35.91 7.02-9.47 16.03-14.29 27.02-14.47 5.03 0 10.66 1.34 16.89 4.02 6.23 2.68 10.27 4.08 12.11 4.21 2.35-.34 6.78-1.84 13.3-4.51 6.52-2.67 12.13-3.87 16.83-3.6 12.44.89 22.42 5.56 29.93 14.02-10.97 6.64-16.32 15.86-16.06 27.65.26 9.4 3.79 17.27 10.6 23.6 6.81 6.34 14.86 9.89 24.15 10.67-2.02 6.13-4.59 12.28-7.71 18.45zM119.22 33.02c0-7.38 2.65-14.29 7.94-20.73 5.3-6.44 11.83-10.58 19.6-12.43.78 4.7 1.17 8.94 1.17 12.74 0 7.49-2.73 14.53-8.2 21.12-5.46 6.58-12.35 10.67-20.67 12.27-.11-.9-.17-1.89-.17-2.97z" />
                </svg>
                <span>Apple</span>
              </button>
              ========================================================================
              */}
            </div>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                <span className="bg-[#0a0a0a] px-3 text-stone-500 font-semibold">
                  Or Register with Details
                </span>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-stone-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Johnathan Smith"
                  className="w-full pl-10 pr-3.5 py-3 bg-black/40 border border-white/15 focus:border-[#c9a35b] rounded-xl text-xs text-white placeholder-stone-600 outline-none transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-stone-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patron@example.com"
                  className="w-full pl-10 pr-3.5 py-3 bg-black/40 border border-white/15 focus:border-[#c9a35b] rounded-xl text-xs text-white placeholder-stone-600 outline-none transition-all"
                />
              </div>
            </div>

            {/* Mobile Number (+27 SA default) */}
            <div>
              <label className="block text-stone-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                Mobile Number (Recommended for SMS OTP login)
              </label>
              <div className="flex rounded-xl border border-white/15 bg-black/40 overflow-visible focus-within:border-[#c9a35b] transition-all relative">
                <CountryCodeSelect 
                  value={countryCode} 
                  onChange={(code) => setCountryCode(code)}
                  id="register-country-code"
                  buttonClassName="py-3 px-3 rounded-l-xl"
                  showName={true}
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="82 123 4567"
                  className="flex-1 bg-transparent px-3.5 py-3 text-xs text-white placeholder-stone-600 outline-none"
                />
              </div>
            </div>

            {/* Date of Birth (Age Gate) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 bg-black/40 border border-white/15 focus:border-[#c9a35b] rounded-xl text-xs text-white outline-none transition-all cursor-pointer"
                  />
                </div>
              </div>

              {/* Referral Code */}
              <div>
                <label className="block text-stone-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  Referral Code (Optional)
                </label>
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.trimStart().toUpperCase())}
                  placeholder="FRIEND-CODE"
                  className="w-full px-3.5 py-3 bg-black/40 border border-white/15 focus:border-[#c9a35b] rounded-xl text-xs text-white placeholder-stone-600 outline-none uppercase font-mono transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-stone-400 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full pl-10 pr-10 py-3 bg-black/40 border border-white/15 focus:border-[#c9a35b] rounded-xl text-xs text-white placeholder-stone-600 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* 18+ Age Eligibility Confirmation Checkbox */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-white/10 bg-black/30 cursor-pointer">
              <input
                type="checkbox"
                checked={isAgeConfirmed}
                onChange={(e) => setIsAgeConfirmed(e.target.checked)}
                className="mt-0.5 accent-[#c9a35b] rounded cursor-pointer"
              />
              <span className="text-[11px] text-stone-400 leading-relaxed">
                I confirm that I am <strong className="text-white">18 years of age or older</strong> and legally permitted to purchase alcoholic beverages under South African liquor laws.
              </span>
            </label>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-[#c9a35b] hover:bg-[#d8b76d] text-black font-semibold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md shadow-[#c9a35b]/20 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Creating Account...' : 'Complete Registration'}
            </button>

            <div className="text-center pt-2 space-y-2 border-t border-white/[0.08]">
              <p className="text-xs text-stone-400">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-[#c9a35b] hover:text-white transition-colors inline-flex items-center gap-1">
                  Sign in here <ArrowRight size={13} />
                </Link>
              </p>
              <p className="text-xs text-stone-500">
                Are you a Winery or Merchant?{' '}
                <Link to="/vendor/onboarding" className="text-stone-400 hover:text-[#c9a35b] underline transition-colors">
                  Apply as Vendor &rarr;
                </Link>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
