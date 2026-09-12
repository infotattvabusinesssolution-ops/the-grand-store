import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";
import { CreditCard, CheckCircle, Store, ShieldCheck, AlertTriangle } from "lucide-react";
import Price from "../../components/ui/Price";

export default function VendorPaymentGate() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [registrationFee, setRegistrationFee] = useState(0);
  const [couponCode, setCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("payfast");
  
  const [proofFile, setProofFile] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofError, setProofError] = useState("");

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'vendor_active') {
    return <Navigate to="/vendor/dashboard" replace />;
  }

  React.useEffect(() => {
    // Check if we just returned from PayFast
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      handleSuccessRedirect();
    } else if (params.get('success') === 'false') {
      setCancelled(true);
      window.history.replaceState({}, '', window.location.pathname);
    }

    // Fetch fee
    const fetchFee = async () => {
      try {
        const { data } = await api.get('/vendor/onboarding');
        if (data && data.registrationFee) {
          setRegistrationFee(data.registrationFee);
        }
      } catch (err) {
        console.error("Failed to fetch vendor registration fee", err);
      }
    };
    fetchFee();
  }, [user]);

  const handleSuccessRedirect = async () => {
    setVerifying(true);
    try {
      await api.post('/payfast/confirm-order', { vendorRegistration: true });
    } catch (e) {}

    const userInfo = JSON.parse(localStorage.getItem('userInfo'));
    
    let attempts = 0;
    const maxAttempts = 10;
    
    const checkRole = async () => {
      try {
        const { data } = await api.get('/auth/profile');
        
        if (data && data.role === 'vendor_active') {
          if (userInfo) {
            userInfo.role = "vendor_active";
            localStorage.setItem("userInfo", JSON.stringify(userInfo));
          }
          if (login && userInfo) {
            login(userInfo);
          }
          setVerifying(false);
          setSuccess(true);
          setTimeout(() => {
            navigate("/vendor/dashboard");
          }, 2000);
          return true;
        }
      } catch (err) {
        console.error("Failed to fetch profile during verification", err);
      }
      return false;
    };

    // Poll until ITN webhook processes
    const pollInterval = setInterval(async () => {
      attempts++;
      const isUpdated = await checkRole();
      if (isUpdated || attempts >= maxAttempts) {
        clearInterval(pollInterval);
        if (!isUpdated) {
          setVerifying(false);
          alert("Payment is still processing. Please check your dashboard in a few minutes.");
          navigate("/");
        }
      }
    }, 2000);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // Call backend to generate PayFast URL and signature
      const { data } = await api.post('/payfast/generate-vendor');

      // Construct and submit a form dynamically to redirect to PayFast
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.url;

      for (const key in data.data) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = data.data[key];
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
      
    } catch (error) {
      console.error("Payment generation failed", error);
      alert("Failed to initialize payment gateway.");
      setProcessing(false);
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    
    setApplyingCoupon(true);
    setCouponError("");
    
    try {
      const { data } = await api.post('/vendor/apply-coupon', { code: couponCode });
      
      // Update local storage and context
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (userInfo) {
        userInfo.role = "vendor_active";
        localStorage.setItem("userInfo", JSON.stringify(userInfo));
      }
      
      alert(`Coupon applied! ${data.message}`);
      setSuccess(true);
      setTimeout(() => {
        login(userInfo || { ...user, role: 'vendor_active' });
        navigate("/vendor/dashboard");
      }, 2000);
      
    } catch (error) {
      console.error("Failed to apply coupon", error);
      setCouponError(error.response?.data?.message || "Invalid or expired coupon code.");
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleUploadProof = async (e) => {
    e.preventDefault();
    if (!proofFile) {
      setProofError("Please select a proof of payment file to upload.");
      return;
    }
    
    setUploadingProof(true);
    setProofError("");
    
    try {
      // 1. Upload the file to Cloudinary
      const formData = new FormData();
      formData.append('document', proofFile);
      const uploadRes = await api.post('/vendor/upload-public', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const proofUrl = uploadRes.data.url;
      
      // 2. Submit the proof URL
      await api.post('/vendor/onboarding/submit-proof', { proofUrl });
      
      // Update local storage
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      if (userInfo) {
        // Technically still unpaid until admin verifies, but we can send them to dashboard
        localStorage.setItem("userInfo", JSON.stringify(userInfo));
      }
      
      alert("Proof submitted successfully! Your application is awaiting admin verification.");
      setSuccess(true);
      setTimeout(() => {
        navigate("/vendor/dashboard");
      }, 2000);
      
    } catch (error) {
      console.error("Failed to upload proof", error);
      setProofError(error.response?.data?.message || "Failed to submit proof of payment.");
    } finally {
      setUploadingProof(false);
    }
  };

  if (verifying) {
    return (
      <div className="vendor-theme min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="bg-[#0a0a0a] border border-gold/30 p-12 rounded-2xl max-w-md w-full text-center">
          <div className="animate-spin w-16 h-16 border-4 border-[#c9a35b] border-t-transparent rounded-full mx-auto mb-6"></div>
          <h2 className="text-2xl text-white font-light mb-4">
            Verifying Payment...
          </h2>
          <p className="text-white/60 mb-8">
            Please wait while we confirm your payment with PayFast. This can take a few moments.
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="vendor-theme min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="bg-[#0a0a0a] border border-gold/30 p-12 rounded-2xl max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl text-white font-light mb-4">
            Payment Successful!
          </h2>
          <p className="text-white/60 mb-8">
            Welcome to The Grand Store. Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (cancelled) {
    return (
      <div className="vendor-theme min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="bg-[#0a0a0a] border border-rose-500/30 p-10 rounded-2xl max-w-md w-full text-center animate-fadeIn">
          <div className="w-20 h-20 bg-rose-500/15 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(244,63,94,0.2)]">
            <AlertTriangle size={40} className="text-rose-400" />
          </div>
          <h2 className="text-3xl font-serif text-white mb-3">
            Payment Cancelled
          </h2>
          <div className="p-4 bg-rose-950/30 border border-rose-500/40 rounded-xl text-rose-200 text-sm leading-relaxed mb-6">
            You cancelled your vendor onboarding payment on PayFast. No funds were debited. You can retry with PayFast or choose Bank Transfer EFT.
          </div>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                setCancelled(false);
                setPaymentMethod('payfast');
              }}
              className="w-full py-3.5 px-6 rounded-full bg-gold-gradient text-black font-bold uppercase tracking-widest text-xs hover:opacity-95 shadow-[0_0_25px_rgba(212,175,55,0.35)] transition-all cursor-pointer"
            >
              Retry Payment with PayFast
            </button>
            <button
              type="button"
              onClick={() => {
                setCancelled(false);
                setPaymentMethod('eft');
              }}
              className="w-full py-3 px-6 rounded-full bg-white/10 hover:bg-white/15 text-white font-bold uppercase tracking-widest text-xs border border-white/15 transition-all cursor-pointer"
            >
              Pay via Bank Transfer (EFT)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vendor-theme min-h-screen bg-[#050505] flex items-center justify-center p-4 py-20">
      <div className="max-w-4xl w-full flex flex-col md:flex-row gap-8">
        {/* Left Side: Summary */}
        <div className="w-full md:w-1/3 bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 flex flex-col justify-between">
          <div>
            <div className="text-gold mb-6">
              <Store size={32} />
            </div>
            <h2 className="text-2xl text-white font-light mb-2">
              Vendor Activation
            </h2>
            <p className="text-white/50 text-sm mb-8">
              Complete your one-time registration fee to activate your
              storefront.
            </p>

            <div className="space-y-4 border-b border-white/10 pb-6 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Setup & Verification</span>
                <span className="text-white">
                  <Price amount={registrationFee} />
                </span>
              </div>
            </div>

            <div className="flex justify-between text-lg">
              <span className="text-white">Total Due</span>
              <span className="text-gold font-mono">
                <Price amount={registrationFee} />
              </span>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3 text-xs text-white/40">
            <ShieldCheck size={16} />
            <span>Secured by Grand Store Payments</span>
          </div>
        </div>

        {/* Right Side: Payment Form */}
        <div className="w-full md:w-2/3 bg-[#0a0a0a] border border-white/10 rounded-2xl p-8">
          <h3 className="text-xl text-white mb-6">Payment Method</h3>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <label className={`flex-1 flex flex-col p-4 border rounded cursor-pointer transition-colors ${paymentMethod === 'payfast' ? 'border-[#c9a35b] bg-[#c9a35b]/10' : 'border-white/10 hover:border-white/30 bg-[#111]'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">PayFast (Instant)</span>
                <input type="radio" name="paymentMethod" value="payfast" checked={paymentMethod === 'payfast'} onChange={() => setPaymentMethod('payfast')} className="hidden" />
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'payfast' ? 'border-[#c9a35b]' : 'border-white/30'}`}>
                  {paymentMethod === 'payfast' && <div className="w-2 h-2 rounded-full bg-[#c9a35b]"></div>}
                </div>
              </div>
              <span className="text-white/50 text-sm">Credit card, Debit card, Instant EFT</span>
            </label>

            <label className={`flex-1 flex flex-col p-4 border rounded cursor-pointer transition-colors ${paymentMethod === 'eft' ? 'border-[#c9a35b] bg-[#c9a35b]/10' : 'border-white/10 hover:border-white/30 bg-[#111]'}`}>
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">Manual EFT / Bank Transfer</span>
                <input type="radio" name="paymentMethod" value="eft" checked={paymentMethod === 'eft'} onChange={() => setPaymentMethod('eft')} className="hidden" />
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'eft' ? 'border-[#c9a35b]' : 'border-white/30'}`}>
                  {paymentMethod === 'eft' && <div className="w-2 h-2 rounded-full bg-[#c9a35b]"></div>}
                </div>
              </div>
              <span className="text-white/50 text-sm">Send proof of payment</span>
            </label>
          </div>

          {paymentMethod === 'payfast' ? (
            <form onSubmit={handlePayment}>
              <div className="mb-6">
                <p className="text-white/60 text-sm mb-6">
                  You will be securely redirected to PayFast to complete your activation payment.
                </p>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full bg-[#c9a35b] hover:bg-[#b08d4a] text-black py-4 rounded font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-8 uppercase tracking-wider"
              >
                {processing ? (
                  "Initializing Secure Gateway..."
                ) : (
                  <>
                    Pay Now via PayFast <ShieldCheck size={18} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="mb-8">
              <div className="bg-[#111] border border-white/10 p-6 rounded mb-6">
                <h4 className="text-[#c9a35b] mb-4 text-sm font-semibold uppercase tracking-wider">Bank Details</h4>
                <div className="space-y-3 text-sm text-white/80">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/50">Bank</span>
                    <span>First National Bank (FNB)</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/50">Account Name</span>
                    <span>The Grand Store (Pty) Ltd</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/50">Account Number</span>
                    <span className="font-mono text-white">62800000000</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-white/50">Branch Code</span>
                    <span className="font-mono text-white">250655</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-white/50">Reference</span>
                    <span className="font-mono text-[#c9a35b] font-bold">VEN-{user?._id?.substring(0, 8).toUpperCase() || 'FEE'}</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-white/60 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded leading-relaxed mb-6">
                Please transfer exactly <strong><Price amount={registrationFee} /></strong> to the account above using the exact reference provided. 
                After transferring, please upload your proof of payment below. 
                <br/><br/>
                Your vendor account will be manually activated within 1-2 business days once the funds clear.
              </p>

              <form onSubmit={handleUploadProof} className="bg-[#111] border border-white/10 p-6 rounded">
                <h4 className="text-white mb-4">Upload Proof of Payment</h4>
                <input 
                  type="file" 
                  accept=".jpg,.jpeg,.png,.pdf" 
                  onChange={(e) => setProofFile(e.target.files[0])}
                  className="w-full text-sm text-white/60 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 mb-4"
                />
                <button
                  type="submit"
                  disabled={uploadingProof || !proofFile}
                  className="w-full bg-white hover:bg-white/90 text-black py-3 rounded font-medium transition-colors disabled:opacity-50"
                >
                  {uploadingProof ? "Uploading..." : "Submit Proof of Payment"}
                </button>
                {proofError && (
                  <p className="text-red-400 text-sm mt-3">{proofError}</p>
                )}
              </form>
            </div>
          )}

          <div className="pt-6 border-t border-white/10">
            <h4 className="text-white mb-4">Have a Registration Coupon?</h4>
            <form onSubmit={handleApplyCoupon} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="flex-1 bg-[#111] border border-white/10 rounded px-4 py-2 text-white uppercase placeholder:normal-case"
              />
              <button
                type="submit"
                disabled={applyingCoupon || !couponCode}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded transition-colors disabled:opacity-50"
              >
                {applyingCoupon ? "Applying..." : "Apply"}
              </button>
            </form>
            {couponError && (
              <p className="text-red-400 text-sm mt-2">{couponError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
