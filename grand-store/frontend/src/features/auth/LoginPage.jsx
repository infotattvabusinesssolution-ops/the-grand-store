import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowRight, Lock, Mail, Eye, EyeOff, ArrowLeft, 
  Smartphone, ShieldCheck, Sparkles, CheckCircle2, RefreshCw, Star, Zap, Check
} from 'lucide-react';
import { auth, googleProvider, appleProvider, signInWithPopup } from '../../firebase';

export default function LoginPage() {
  const { 
    login, 
    googleLogin, 
    appleLogin, 
    sendMobileOtp, 
    verifyMobileOtp, 
    sendMagicLink, 
    verifyMagicLink 
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Navigation redirect handler
  const handleAuthSuccess = (userData) => {
    let defaultRoute = '/customer/profile';
    const role = userData.role;
    const isVendor = ['vendor', 'vendor_active', 'vendor_pending', 'vendor_approved_unpaid', 'vendor_rejected', 'vendor_suspended'].includes(role);

    if (['admin', 'super_admin', 'accountant'].includes(role)) defaultRoute = '/admin/dashboard';
    else if (role === 'product_manager') defaultRoute = '/admin/products';
    else if (role === 'event_host') defaultRoute = '/event-manager/dashboard';
    else if (role === 'auction_host') defaultRoute = '/auction-manager/dashboard';
    else if (['vendor_pending', 'vendor_active', 'vendor'].includes(role)) defaultRoute = '/vendor/dashboard';
    else if (role === 'vendor_approved_unpaid') defaultRoute = '/vendor/payment';
    
    const redirectParam = searchParams.get('redirect');
    let targetRoute = defaultRoute;
    if (redirectParam) {
      if (isVendor) {
        if (redirectParam.startsWith('/vendor') || redirectParam.startsWith('/auction') || redirectParam === '/') {
          targetRoute = redirectParam;
        }
      } else {
        targetRoute = redirectParam;
      }
    }
    navigate(targetRoute);
  };

  // Primary Login Tab: 'email' (first / default) or 'phone' (second)
  const [primaryTab, setPrimaryTab] = useState('email');

  // Email & Password State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Mobile OTP State
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+27');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState('');

  // General Status
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoMsg, setInfoMsg] = useState(null);

  // Auto-verify Magic Link from URL (?magicToken=...&email=...)
  useEffect(() => {
    const magicToken = searchParams.get('magicToken');
    const tokenEmail = searchParams.get('email');
    if (magicToken) {
      const autoVerify = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const userData = await verifyMagicLink(magicToken, tokenEmail);
          handleAuthSuccess(userData);
        } catch (err) {
          setError(err.message || 'The sign-in link has expired or is invalid.');
        } finally {
          setIsLoading(false);
        }
      };
      autoVerify();
    }
  }, [searchParams]);

  // Timer countdown for resending OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // --- Email + Password Sign In ---
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setInfoMsg(null);
    try {
      const userData = await login(email, password);
      handleAuthSuccess(userData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Send Direct Login Link (Inline in Password section) ---
  const handleSendLoginLink = async (e) => {
    if (e) e.preventDefault();
    const targetEmail = email.trim();
    if (!targetEmail) {
      setError('Please enter your email address above to receive a direct login link');
      return;
    }
    setIsLoading(true);
    setError(null);
    setInfoMsg(null);
    try {
      await sendMagicLink(targetEmail);
      setInfoMsg(`A secure login link was sent to ${targetEmail}. Check your inbox to sign in with one click.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Mobile OTP Handlers ---
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanNum = phone.trim().replace(/\s+/g, '');
    if (!cleanNum) {
      setError('Please enter your mobile number');
      return;
    }
    setIsLoading(true);
    setError(null);
    setInfoMsg(null);
    try {
      const fullPhone = cleanNum.startsWith('+') ? cleanNum : `${countryCode}${cleanNum.replace(/^0+/, '')}`;
      const res = await sendMobileOtp(fullPhone);
      setOtpSent(true);
      setCountdown(60);
      if (res.devOtp) setDevOtp(res.devOtp);
      setInfoMsg(`SMS verification code sent to ${fullPhone}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otp || otp.trim().length < 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const cleanNum = phone.trim().replace(/\s+/g, '');
      const fullPhone = cleanNum.startsWith('+') ? cleanNum : `${countryCode}${cleanNum.replace(/^0+/, '')}`;
      const userData = await verifyMobileOtp(fullPhone, otp.trim());
      handleAuthSuccess(userData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Social Login Handlers (Google & Apple Only - Strictly NO Facebook) ---
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    setInfoMsg(null);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const userData = await googleLogin(userCredential, 'customer');
      handleAuthSuccess(userData);
    } catch (err) {
      console.error('Google sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Google sign-in window was closed.');
      } else {
        setError(err.message || 'Google Login Failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsLoading(true);
    setError(null);
    setInfoMsg(null);
    try {
      const userCredential = await signInWithPopup(auth, appleProvider);
      const userData = await appleLogin(userCredential, 'customer');
      handleAuthSuccess(userData);
    } catch (err) {
      console.error('Apple sign-in error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Apple sign-in window was closed.');
      } else {
        setError(err.message || 'Apple Sign-In failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen w-full bg-[#050505] flex overflow-hidden font-sans text-stone-200 select-none">
      {/* ========================================================================= */}
      {/* LEFT COLUMN: Ultra-Rich Editorial Split-Screen Hero Panel (Desktop)       */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex lg:w-[54%] xl:w-[55%] 2xl:w-[56%] h-screen max-h-screen relative flex-col justify-between p-8 xl:p-12 overflow-hidden border-r border-white/10">
        {/* Real Luxury Photography Background */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105 hover:scale-100"
          style={{ backgroundImage: `url('/images/auth-hero.jpg')` }}
        />
        {/* Layered cinematic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/65 to-[#050505]/35" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#c9a35b]/20 via-transparent to-transparent" />

        {/* Top bar: Back to Home button on left, and Logo slightly down below it */}
        <div className="relative z-10 flex flex-col items-start space-y-3.5 pt-1">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 bg-black/60 hover:bg-black/90 backdrop-blur-md border border-white/20 hover:border-[#c9a35b]/60 text-stone-200 hover:text-white px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all shadow-lg"
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>

          <Link to="/" className="group inline-flex items-center pt-0.5">
            <img 
              src="/logo.png" 
              alt="The Grand Store" 
              className="h-12 lg:h-14 xl:h-16 max-h-16 w-auto object-contain filter drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)] drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] brightness-115 contrast-105 transition-transform duration-300 group-hover:scale-105" 
            />
          </Link>
        </div>

        {/* Middle: Headline & Narrative */}
        <div className="relative z-10 my-auto py-6 max-w-xl">
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] font-semibold text-[#c9a35b] mb-4 px-3.5 py-1.5 bg-[#c9a35b]/15 border border-[#c9a35b]/30 rounded-full backdrop-blur-md shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#c9a35b]" />
            <span>Private Reserve & Cellar Access</span>
          </div>

          <h2 className="font-serif text-3xl lg:text-4xl xl:text-5xl text-white font-normal leading-[1.18] tracking-tight drop-shadow-md">
            South Africa's Premier <span className="text-[#c9a35b] italic">Rare Whisky & Wine</span> Marketplace.
          </h2>

          <p className="text-stone-300/85 text-xs lg:text-sm leading-relaxed mt-4 max-w-lg font-light drop-shadow">
            Join collectors and cellar patrons discovering investment-grade bottles, live auctions, and private cask releases.
          </p>

          <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/10 max-w-lg">
            <div className="space-y-0.5">
              <div className="text-[#c9a35b] text-xs font-semibold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> 100% Verified
              </div>
              <div className="text-stone-400 text-[10px]">Guaranteed Provenance</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-[#c9a35b] text-xs font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Escrow Safe
              </div>
              <div className="text-stone-400 text-[10px]">Bonded Cellar Security</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-[#c9a35b] text-xs font-semibold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Priority Access
              </div>
              <div className="text-stone-400 text-[10px]">Casks & Rare Lots</div>
            </div>
          </div>
        </div>

        {/* Bottom: Social Proof / Patron Trust Counter */}
        <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between pb-1">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center -space-x-2 overflow-hidden">
              <img className="inline-block h-7 w-7 rounded-full ring-2 ring-black object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Patron" />
              <img className="inline-block h-7 w-7 rounded-full ring-2 ring-black object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="Patron" />
              <div className="inline-flex h-7 w-7 rounded-full bg-[#c9a35b] text-black font-bold text-[9px] items-center justify-center ring-2 ring-black">
                +12k
              </div>
            </div>
            <div>
              <div className="text-white text-xs font-semibold">12,500+ Active Patrons</div>
              <div className="text-stone-400 text-[10px]">South Africa & Global</div>
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-0.5 text-[#c9a35b]">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-[#c9a35b]" />
              ))}
            </div>
            <div className="text-stone-400 text-[10px]">Rated 4.9/5 by Collectors</div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN: Modern Zero-Scroll Single-Page Form                         */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[46%] xl:w-[45%] 2xl:w-[44%] h-screen max-h-screen flex flex-col justify-between p-5 sm:p-7 lg:p-6 xl:p-8 relative overflow-hidden bg-[#050505]">
        {/* Mobile top navigation */}
        <div className="lg:hidden flex items-center justify-between pb-2">
          <Link 
            to="/" 
            className="flex items-center gap-1.5 text-stone-400 hover:text-white transition-colors text-[10px] uppercase tracking-widest font-bold cursor-pointer"
          >
            <ArrowLeft size={14} /> Home
          </Link>
          <img 
            src="/logo.png" 
            alt="The Grand Store" 
            className="h-8 sm:h-9 w-auto object-contain filter drop-shadow brightness-115" 
          />
        </div>

        {/* Main Form Body (Centered vertically, fills horizontal space, fits 100vh without scrolling) */}
        <div className="w-full max-w-md sm:max-w-lg xl:max-w-[540px] mx-auto my-auto space-y-3.5">
          {/* Header */}
          <div className="text-left">
            <h1 className="text-white font-serif text-2xl sm:text-3xl font-normal tracking-tight">
              Welcome Back!
            </h1>
            <p className="text-stone-400 text-xs mt-0.5">
              Sign in seamlessly — <span className="text-[#c9a35b] font-medium">It's Quick & Easy!</span>
            </p>
          </div>

          {/* Micro trust value badges */}
          <div className="flex items-center justify-between text-[10px] text-stone-400 px-1 font-medium">
            <div className="flex items-center gap-1"><Zap className="w-3 h-3 text-[#c9a35b]" /> Fast OTP</div>
            <span className="text-stone-700">•</span>
            <div className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-400" /> 100% Secure</div>
            <span className="text-stone-700">•</span>
            <div className="flex items-center gap-1"><Check className="w-3 h-3 text-[#c9a35b]" /> Verified Cellars</div>
          </div>

          {/* Card Container for Inputs */}
          <div className="bg-[#0a0a0a] border border-white/10 p-4 sm:p-5 rounded-xl shadow-xl backdrop-blur-md">
            {/* Notifications */}
            {error && (
              <div className="mb-3 p-2.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg text-center leading-relaxed">
                <div>{error}</div>
                {error.includes('/admin/login') && (
                  <div className="mt-1">
                    <Link
                      to="/admin/login"
                      className="inline-flex items-center gap-1 text-[10px] text-[#c9a35b] hover:underline font-bold uppercase tracking-widest"
                    >
                      Open Admin Gateway &rarr;
                    </Link>
                  </div>
                )}
              </div>
            )}

            {infoMsg && (
              <div className="mb-3 p-2.5 bg-[#c9a35b]/10 border border-[#c9a35b]/30 text-[#e1bd70] text-xs rounded-lg flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#c9a35b] shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed text-[11px]">{infoMsg}</div>
              </div>
            )}

            {/* INITIAL TABS: 1st Email (first/default), 2nd Phone Number */}
            <div className="flex bg-black/60 p-1 rounded-lg border border-white/10 mb-3 text-xs">
              <button
                type="button"
                onClick={() => { setPrimaryTab('email'); setError(null); }}
                className={`flex-1 py-1.5 text-center rounded-md font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
                  primaryTab === 'email'
                    ? 'bg-[#c9a35b] text-black shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </button>
              <button
                type="button"
                onClick={() => { setPrimaryTab('phone'); setError(null); }}
                className={`flex-1 py-1.5 text-center rounded-md font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
                  primaryTab === 'phone'
                    ? 'bg-[#c9a35b] text-black shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Phone Number</span>
              </button>
            </div>

            {/* TAB 1: EMAIL (FIRST / DEFAULT) */}
            {primaryTab === 'email' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                <div>
                  <label className="block text-stone-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="patron@example.com"
                      className="w-full pl-9 pr-3 py-2 bg-black/50 border border-white/15 focus:border-[#c9a35b] rounded-lg text-xs text-white placeholder-stone-600 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-stone-400 text-[10px] font-bold uppercase tracking-wider">
                      Password
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSendLoginLink}
                        disabled={isLoading}
                        className="text-[10px] text-[#c9a35b] hover:text-[#e1bd70] transition-colors flex items-center gap-1 cursor-pointer font-medium"
                        title="Email me a direct login link without entering password"
                      >
                        <Sparkles className="w-3 h-3 text-[#c9a35b]" />
                        <span>Send link to login</span>
                      </button>
                      <span className="text-stone-700 text-xs">|</span>
                      <Link 
                        to="/forgot-password" 
                        className="text-[10px] uppercase tracking-wider text-stone-500 hover:text-white transition-colors font-bold"
                      >
                        Forgot?
                      </Link>
                    </div>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-9 py-2 bg-black/50 border border-white/15 focus:border-[#c9a35b] rounded-lg text-xs text-white placeholder-stone-600 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-0.5 space-y-1.5">
                  <button
                    type="submit"
                    disabled={isLoading || !email || !password}
                    className="w-full py-2.5 px-4 bg-[#c9a35b] hover:bg-[#d8b76d] text-black font-semibold text-xs tracking-wider uppercase rounded-lg transition-all shadow-md shadow-[#c9a35b]/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isLoading ? 'Signing In...' : 'Sign In with Password'}
                  </button>

                  <button
                    type="button"
                    onClick={handleSendLoginLink}
                    disabled={isLoading || !email}
                    className="w-full py-1.5 px-3 bg-transparent hover:bg-white/[0.04] border border-dashed border-white/15 hover:border-[#c9a35b]/50 text-stone-400 hover:text-[#c9a35b] text-[10px] font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-3 h-3 text-[#c9a35b]" />
                    <span>Or email me a one-click login link</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: PHONE NUMBER (SECOND) */}
            {primaryTab === 'phone' && (
              <div className="space-y-3">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-3">
                    <label className="block text-stone-400 text-[10px] font-bold uppercase tracking-wider">
                      Mobile Phone Number (SMS OTP)
                    </label>
                    <div className="flex rounded-lg border border-white/15 bg-black/50 overflow-hidden focus-within:border-[#c9a35b] transition-all">
                      <select 
                        value={countryCode} 
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="bg-stone-900/80 text-xs text-[#c9a35b] font-medium px-2.5 py-2 border-r border-white/10 outline-none cursor-pointer"
                      >
                        <option value="+27">🇿🇦 +27</option>
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+61">🇦🇺 +61</option>
                        <option value="+91">🇮🇳 +91</option>
                      </select>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="82 123 4567"
                        className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder-stone-600 outline-none"
                        autoComplete="tel"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || !phone}
                      className="w-full py-2.5 px-4 bg-[#c9a35b] hover:bg-[#d8b76d] text-black font-semibold text-xs tracking-wider uppercase rounded-lg transition-all shadow-md shadow-[#c9a35b]/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      {isLoading ? 'Sending SMS...' : 'Send SMS OTP'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-stone-400 text-[10px] font-bold uppercase tracking-wider">
                        Enter 6-Digit Code
                      </label>
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setOtp(''); }}
                        className="text-[10px] text-[#c9a35b] hover:underline cursor-pointer"
                      >
                        Change Number
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className="w-full bg-black/60 border border-white/20 focus:border-[#c9a35b] rounded-lg px-3 py-2 text-center text-xl tracking-[0.3em] font-mono text-white outline-none transition-all"
                        autoFocus
                      />
                      {devOtp && (
                        <div className="mt-1 text-center text-[10px] text-stone-500 font-mono">
                          Dev test code: <span className="text-[#c9a35b] font-bold">{devOtp}</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || otp.length < 6}
                      className="w-full py-2.5 px-4 bg-[#c9a35b] hover:bg-[#d8b76d] text-black font-semibold text-xs tracking-wider uppercase rounded-lg transition-all shadow-md shadow-[#c9a35b]/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {isLoading ? 'Verifying...' : 'Verify & Enter'}
                    </button>

                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <span className="text-stone-500 text-[10px]">Didn't get code?</span>
                      {countdown > 0 ? (
                        <span className="text-stone-400 text-[10px]">Resend in {countdown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={isLoading}
                          className="text-[#c9a35b] hover:text-[#e1bd70] text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" /> Resend Code
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-[9px] uppercase tracking-widest">
              <span className="bg-[#050505] px-2 text-stone-500 font-semibold">
                Or Continue With
              </span>
            </div>
          </div>

          {/* Social Row BELOW: Google (White background with crisp solid BLACK text) & Apple */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Google with white background & BLACK text */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-stone-100 text-black font-semibold rounded-xl text-xs transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span className="text-black font-semibold whitespace-nowrap"><span className="hidden sm:inline">Continue with </span>Google</span>
            </button>

            {/* Apple button */}
            <button
              type="button"
              disabled={isLoading}
              onClick={handleAppleLogin}
              className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white/[0.08] hover:bg-white/[0.12] border border-white/15 text-white font-semibold rounded-xl text-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 shrink-0 fill-current" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.58-7.7-11.66-13.98-5.99-9.24-10.74-19.67-14.25-31.29-3.51-11.63-5.27-22.6-5.27-32.92 0-14.47 3.51-26.44 10.53-35.91 7.02-9.47 16.03-14.29 27.02-14.47 5.03 0 10.66 1.34 16.89 4.02 6.23 2.68 10.27 4.08 12.11 4.21 2.35-.34 6.78-1.84 13.3-4.51 6.52-2.67 12.13-3.87 16.83-3.6 12.44.89 22.42 5.56 29.93 14.02-10.97 6.64-16.32 15.86-16.06 27.65.26 9.4 3.79 17.27 10.6 23.6 6.81 6.34 14.86 9.89 24.15 10.67-2.02 6.13-4.59 12.28-7.71 18.45zM119.22 33.02c0-7.38 2.65-14.29 7.94-20.73 5.3-6.44 11.83-10.58 19.6-12.43.78 4.7 1.17 8.94 1.17 12.74 0 7.49-2.73 14.53-8.2 21.12-5.46 6.58-12.35 10.67-20.67 12.27-.11-.9-.17-1.89-.17-2.97z" />
              </svg>
              <span className="text-white font-semibold whitespace-nowrap"><span className="hidden sm:inline">Continue with </span>Apple</span>
            </button>
          </div>

          {/* Compliance Notice */}
          <div className="text-center pt-0.5">
            <div className="inline-flex items-center gap-1 text-[10px] text-stone-500">
              <ShieldCheck className="w-3 h-3 text-[#c9a35b]" />
              <span>Strict 18+ alcohol compliance confirmed at checkout</span>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="w-full max-w-md sm:max-w-lg xl:max-w-[540px] mx-auto pt-2 border-t border-white/[0.08] text-center space-y-1 text-xs">
          <p className="text-stone-400 text-xs">
            New to Grand Store?{' '}
            <Link 
              to={`/register${searchParams.get('redirect') ? `?redirect=${searchParams.get('redirect')}` : ''}`} 
              className="font-bold text-[#c9a35b] hover:text-white transition-colors inline-flex items-center gap-1"
            >
              Create Account <ArrowRight size={12} />
            </Link>
          </p>

          <div className="flex items-center justify-center gap-3 text-[10px] text-stone-500">
            <Link to="/terms" className="hover:text-stone-300 transition-colors">Terms & Conditions</Link>
            <span>•</span>
            <Link to="/privacy" className="hover:text-stone-300 transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link to="/admin/login" className="hover:text-[#c9a35b] transition-colors">Admin Gateway &rarr;</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
