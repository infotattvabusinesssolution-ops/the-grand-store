import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, Lock, Mail, Eye, EyeOff, Smartphone, 
  ShieldCheck, Sparkles, RefreshCw
} from 'lucide-react';
import { auth, googleProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from '../../firebase';
import CountryCodeSelect from '../../components/CountryCodeSelect';
import LoginShowcase from './LoginShowcase';

export default function LoginPage() {
  const { 
    login, 
    googleLogin, 
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

  // Primary Login Tab: 'phone' (Mobile SMS OTP) or 'email' (Email & Password)
  const [primaryTab, setPrimaryTab] = useState('phone');

  // Email & Password State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isAgeConfirmed, setIsAgeConfirmed] = useState(true);

  // Mobile OTP State
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+27');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

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
    if (!isAgeConfirmed) {
      setError('You must confirm that you are 18 years of age or older to enter.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setInfoMsg(null);
    try {
      const userData = await login(email, password);
      handleAuthSuccess(userData);
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Send Direct Login Link ---
  const handleSendLoginLink = async (e) => {
    if (e) e.preventDefault();
    if (!isAgeConfirmed) {
      setError('You must confirm that you are 18 years of age or older to enter.');
      return;
    }
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
      setError(err.message || 'Failed to send login link');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Mobile OTP Handlers ---
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!isAgeConfirmed) {
      setError('You must confirm that you are 18 years of age or older to enter.');
      return;
    }
    const cleanNum = phone.trim().replace(/\s+/g, '');
    if (!cleanNum || cleanNum.length < 6) {
      setError('Please enter a valid mobile number');
      return;
    }
    setIsLoading(true);
    setError(null);
    setInfoMsg(null);
    try {
      const fullPhone = cleanNum.startsWith('+') ? cleanNum : `${countryCode}${cleanNum.replace(/^0+/, '')}`;

      // 1. Try Firebase Real SMS Phone Auth (Direct Google carrier dispatch)
      let fbConfirmation = null;
      try {
        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => {},
          });
        }
        fbConfirmation = await signInWithPhoneNumber(auth, fullPhone, window.recaptchaVerifier);
        setConfirmationResult(fbConfirmation);
        setInfoMsg(`Real SMS verification code dispatched to ${fullPhone} via Firebase.`);
      } catch (fbErr) {
        console.warn('[Firebase Phone Auth] Web client attempt:', fbErr.message);
        if (window.recaptchaVerifier) {
          try { window.recaptchaVerifier.clear(); } catch (_) {}
          window.recaptchaVerifier = null;
        }
        // 2. Fallback to Backend SMS Gateway Dispatcher
        const res = await sendMobileOtp(fullPhone);
        if (res?.devOtp) setDevOtp(res.devOtp);
        setInfoMsg(res?.message || `Verification code sent to ${fullPhone}`);
      }

      setOtpSent(true);
      setCountdown(60);
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

      let firebaseToken = null;
      if (confirmationResult) {
        try {
          const userCredential = await confirmationResult.confirm(otp.trim());
          firebaseToken = await userCredential.user.getIdToken();
        } catch (confErr) {
          console.warn('[Firebase Confirm] Fallback to backend verification:', confErr.message);
        }
      }

      const userData = await verifyMobileOtp(fullPhone, otp.trim(), { firebaseIdToken: firebaseToken });
      handleAuthSuccess(userData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Google Login Handler ---
  const handleGoogleLogin = async () => {
    if (!isAgeConfirmed) {
      setError('You must confirm that you are 18 years of age or older to enter.');
      return;
    }
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

  return (
    <div className="h-screen max-h-screen w-full bg-[#050505] grid grid-cols-1 lg:grid-cols-12 overflow-hidden font-sans text-stone-200 select-none">
      
      <LoginShowcase />

      {/* RIGHT COLUMN: Sculpted Obsidian & Gold Authentication Sanctuary           */}
      {/* ========================================================================= */}
      <div className="col-span-1 lg:col-span-6 xl:col-span-5 h-screen max-h-screen bg-[#070605] overflow-y-auto p-4 sm:p-6 lg:p-8 xl:p-10 flex flex-col justify-between relative scrollbar-thin scrollbar-thumb-stone-800">
        
        {/* Top Header Row with Official Grand Store Logo (Clean Single-Line Brand Mark) */}
        <div className="flex items-center justify-between mb-2">
          <Link to="/" className="flex items-center gap-2.5 group">
            <img 
              src="/logo.png" 
              alt="The Grand Store" 
              className="h-9 sm:h-10 w-auto max-w-[140px] sm:max-w-[165px] object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <div className="hidden sm:flex flex-col border-l border-[#c9a35b]/30 pl-2.5">
              <span className="text-[9.5px] font-mono uppercase tracking-[0.2em] text-[#c9a35b] font-bold whitespace-nowrap">
                Member Vault
              </span>
              <span className="text-[8px] text-stone-400 font-light whitespace-nowrap">
                Private Client Portal
              </span>
            </div>
          </Link>

          <Link 
            to="/" 
            className="inline-flex items-center gap-1.5 text-stone-400 hover:text-white text-xs font-medium transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full border border-white/10"
          >
            <ArrowLeft size={12} className="text-[#c9a35b]" /> Return to Store
          </Link>
        </div>

        {/* Sculpted Obsidian & Gold Card Shell (Balanced Height for 730px Viewport) */}
        <div className="w-full max-w-md mx-auto my-auto relative py-1">
          {/* Molten Gold Back-Halo behind card */}
          <div className="absolute -top-6 -left-6 w-56 h-56 rounded-full bg-[#c9a35b]/10 blur-[80px] pointer-events-none" />
          <div className="absolute -bottom-6 -right-6 w-56 h-56 rounded-full bg-[#d4af37]/10 blur-[80px] pointer-events-none" />

          <div className="relative bg-gradient-to-b from-[#110e0a]/95 via-[#0a0806]/95 to-[#060504] border border-[#c9a35b]/30 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_30px_rgba(201,163,91,0.06)] backdrop-blur-2xl rounded-2xl p-5 sm:p-6 xl:p-7">
            
            {/* Card Header */}
            <div className="mb-4">
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-white tracking-tight">
                Log in to The Grand Store<span className="text-[#c9a35b]">.</span>
              </h1>
              <p className="text-xs text-stone-400 mt-1 font-light leading-relaxed">
                Welcome back! Sign in with your phone OTP or account credentials.
              </p>
            </div>

            {/* Error & Info Alerts */}
            {error && (
              <div className="mb-3 p-2.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <span className="text-sm shrink-0">⚠️</span>
                <span>{error}</span>
              </div>
            )}
            {infoMsg && (
              <div className="mb-3 p-2.5 rounded-xl bg-[#c9a35b]/10 border border-[#c9a35b]/35 text-[#e6c987] text-xs flex items-center gap-2 animate-in fade-in duration-200">
                <span className="text-sm shrink-0">✨</span>
                <span>{infoMsg}</span>
              </div>
            )}

            {/* Social Login Button: Continue with Google */}
            <div className="w-full mb-3">
              <button
                type="button"
                disabled={isLoading}
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white/[0.07] hover:bg-white/[0.12] border border-white/15 hover:border-[#c9a35b]/50 text-white font-medium rounded-xl text-xs sm:text-sm transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-[11px]">
                <span className="bg-[#0a0806] px-3 text-stone-500 font-medium">or sign in with</span>
              </div>
            </div>

            {/* Segmented Architectural Tab Switcher */}
            <div className="flex p-1 bg-black/90 rounded-xl border border-stone-800/80 mb-3.5 shadow-inner">
              <button
                type="button"
                onClick={() => { setPrimaryTab('phone'); setError(null); setInfoMsg(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  primaryTab === 'phone'
                    ? 'bg-gradient-to-r from-[#eac56a] via-[#c99742] to-[#9a722a] text-black font-extrabold shadow-md shadow-[#c9a35b]/25'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <Smartphone size={13} />
                <span>Mobile SMS OTP</span>
              </button>
              <button
                type="button"
                onClick={() => { setPrimaryTab('email'); setError(null); setInfoMsg(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  primaryTab === 'email'
                    ? 'bg-gradient-to-r from-[#eac56a] via-[#c99742] to-[#9a722a] text-black font-extrabold shadow-md shadow-[#c9a35b]/25'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <Mail size={13} />
                <span>Email & Password</span>
              </button>
            </div>

            {/* ===================================================================== */}
            {/* TAB 1: PHONE NUMBER (SMS OTP)                                         */}
            {/* ===================================================================== */}
            {primaryTab === 'phone' && (
              <div className="space-y-3">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-3">
                    <div>
                      <label className="block text-[#c9a35b] text-[9.5px] font-bold uppercase tracking-widest mb-1">
                        Mobile Phone Number
                      </label>
                      <div className="flex rounded-xl border border-white/15 bg-black/80 overflow-visible focus-within:border-[#c9a35b] focus-within:ring-1 focus-within:ring-[#c9a35b]/30 transition-all relative">
                        <CountryCodeSelect 
                          value={countryCode} 
                          onChange={(code) => setCountryCode(code)}
                          id="login-country-code"
                          buttonClassName="py-2.5 px-3 rounded-l-xl"
                          showName={true}
                        />
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="82 123 4567"
                          className="flex-1 bg-transparent px-3 py-2.5 text-xs sm:text-sm text-white placeholder-stone-600 outline-none font-mono"
                          autoComplete="tel"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* 18+ Legal Drinking Age Checkbox */}
                    <label className="flex items-center gap-2.5 cursor-pointer text-stone-300 hover:text-white py-1 select-none">
                      <input
                        type="checkbox"
                        checked={isAgeConfirmed}
                        onChange={(e) => setIsAgeConfirmed(e.target.checked)}
                        className="w-4 h-4 rounded border-white/30 bg-black/70 text-[#c9a35b] focus:ring-0 cursor-pointer accent-[#c9a35b]"
                      />
                      <span className="text-xs sm:text-[13px] text-stone-300 font-medium">
                        I confirm that I am <strong className="text-[#f5c242] font-bold">18 years of age or older</strong>
                      </span>
                    </label>

                    {/* Submit Button (Vibrant Luxury Gold Gradient) */}
                    <button
                      type="submit"
                      disabled={isLoading || !phone || !isAgeConfirmed}
                      className="w-full py-3 px-4 bg-gradient-to-r from-[#f5c242] via-[#c99742] to-[#a67c2e] hover:brightness-110 active:brightness-95 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#c9a35b]/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Smartphone className="w-4 h-4" />
                      {isLoading ? 'Dispatching SMS OTP...' : 'SEND SMS OTP'}
                    </button>

                    {/* Firebase Invisible reCAPTCHA Mount */}
                    <div id="recaptcha-container"></div>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-[#c9a35b] text-[9.5px] font-bold uppercase tracking-widest">
                        Enter 6-Digit Code
                      </label>
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setOtp(''); }}
                        className="text-[9.5px] text-[#c9a35b] hover:underline cursor-pointer font-mono"
                      >
                        Edit Number
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••••"
                        className="w-full bg-black/80 border border-white/20 focus:border-[#c9a35b] focus:ring-1 focus:ring-[#c9a35b]/30 rounded-xl px-4 py-2.5 text-center text-xl tracking-[0.35em] font-mono text-white outline-none transition-all"
                        autoFocus
                      />
                      {devOtp && (
                        <div className="mt-1 text-center text-[10.5px] text-stone-500 font-mono">
                          Dev test code: <span className="text-[#c9a35b] font-bold">{devOtp}</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || otp.length < 6}
                      className="w-full py-3 px-4 bg-gradient-to-r from-[#f5c242] via-[#c99742] to-[#a67c2e] hover:brightness-110 active:brightness-95 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#c9a35b]/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      {isLoading ? 'Verifying...' : 'VERIFY & ENTER CELLAR'}
                    </button>

                    <div className="flex items-center justify-between text-xs pt-0.5">
                      <span className="text-stone-500 text-[10.5px]">Didn't get the code?</span>
                      {countdown > 0 ? (
                        <span className="text-stone-400 text-[10.5px] font-mono">Resend in {countdown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={isLoading}
                          className="text-[#c9a35b] hover:text-[#e1bd70] text-[10.5px] font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" /> Resend Code
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ===================================================================== */}
            {/* TAB 2: EMAIL & PASSWORD                                               */}
            {/* ===================================================================== */}
            {primaryTab === 'email' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-3">
                {/* Email Field */}
                <div>
                  <label className="block text-[#c9a35b] text-[9.5px] font-bold uppercase tracking-widest mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="patron@grandstore.co.za"
                      className="w-full pl-9 pr-3 py-2 bg-black/80 border border-white/15 focus:border-[#c9a35b] focus:ring-1 focus:ring-[#c9a35b]/30 rounded-xl text-xs sm:text-sm text-white placeholder-stone-600 outline-none transition-all"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-[#c9a35b] text-[9.5px] font-bold uppercase tracking-widest mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-9 py-2 bg-black/80 border border-white/15 focus:border-[#c9a35b] focus:ring-1 focus:ring-[#c9a35b]/30 rounded-xl text-xs sm:text-sm text-white placeholder-stone-600 outline-none transition-all"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <label className="flex items-center gap-1.5 cursor-pointer text-stone-400 hover:text-stone-300">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-white/20 bg-black/60 text-[#c9a35b] focus:ring-0 cursor-pointer"
                    />
                    <span className="text-[10.5px]">Remember me</span>
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[10.5px] text-stone-400 hover:text-[#c9a35b] transition-colors"
                  >
                    Forgot your password?
                  </Link>
                </div>

                {/* Direct Login Link Button */}
                <button
                  type="button"
                  onClick={handleSendLoginLink}
                  disabled={isLoading || !email}
                  className="w-full py-1.5 px-3 bg-transparent hover:bg-white/[0.04] border border-dashed border-white/15 hover:border-[#c9a35b]/50 text-stone-400 hover:text-[#c9a35b] text-[10.5px] font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-3 h-3 text-[#c9a35b]" />
                  <span>Email me a one-click login link</span>
                </button>

                {/* 18+ Legal Drinking Age Checkbox */}
                <label className="flex items-center gap-2.5 cursor-pointer text-stone-300 hover:text-white py-1 select-none">
                  <input
                    type="checkbox"
                    checked={isAgeConfirmed}
                    onChange={(e) => setIsAgeConfirmed(e.target.checked)}
                    className="w-4 h-4 rounded border-white/30 bg-black/70 text-[#c9a35b] focus:ring-0 cursor-pointer accent-[#c9a35b]"
                  />
                  <span className="text-xs sm:text-[13px] text-stone-300 font-medium">
                    I confirm that I am <strong className="text-[#f5c242] font-bold">18 years of age or older</strong>
                  </span>
                </label>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !email || !password || !isAgeConfirmed}
                  className="w-full py-3 px-4 bg-gradient-to-r from-[#f5c242] via-[#c99742] to-[#a67c2e] hover:brightness-110 active:brightness-95 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#c9a35b]/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? 'Signing In...' : 'LOGIN TO CELLAR'}
                </button>
              </form>
            )}

            {/* Don't have an account? Register - Prominently Visible Inside Card */}
            <div className="mt-4 pt-3.5 border-t border-white/10 text-center">
              <p className="text-xs sm:text-sm text-stone-300">
                Don't have an account?{' '}
                <Link 
                  to="/register" 
                  className="text-[#f5c242] hover:text-[#ffd768] font-bold underline underline-offset-4 ml-1.5 transition-colors cursor-pointer"
                >
                  Register
                </Link>
              </p>
            </div>

          </div>
        </div>

        {/* Bottom Footer: Responsible Drinking Compliance */}
        <div className="text-center pt-2 border-t border-white/5">
          <p className="text-[10px] text-stone-500 font-mono">
            Strictly not for sale to persons under the age of 18 • Drink Responsibly
          </p>
        </div>

      </div>

    </div>
  );
}
