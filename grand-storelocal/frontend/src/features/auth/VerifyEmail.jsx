import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import api from '../../api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token || !email) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    const verify = async () => {
      try {
        const res = await api.post('/auth/verify-email', { email, token });
        setStatus('success');
        setMessage(res.data.message || 'Email verified successfully!');
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed.');
      }
    };

    verify();
  }, [token, email]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 py-12 relative">
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-2 text-[var(--color-ivory-muted)] hover:text-white transition-colors text-[10px] uppercase tracking-widest font-bold z-50 cursor-pointer"
      >
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <h1 className="text-[#c9a35b] drop-shadow-[0_0_12px_rgba(230,201,122,0.6)] font-serif text-3xl md:text-4xl font-medium tracking-tight mb-4 py-2">
            Email Verification
          </h1>
        </div>

        <div className="bg-[#0a0a0a] border-t border-white/10 p-8 rounded-none md:rounded-xl text-center shadow-2xl">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-6">
              <Loader2 className="w-10 h-10 text-[var(--color-gold)] animate-spin" />
              <p className="text-[var(--color-ivory-muted)]">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center border border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-serif text-white mb-2">Verified!</h2>
                <p className="text-green-400 text-sm">{message}</p>
              </div>
              <Link 
                to="/login" 
                className="w-full mt-4 bg-[var(--color-gold)] text-black font-bold uppercase tracking-widest text-[10px] py-4 rounded hover:bg-[#d4b26f] transition-colors inline-block"
              >
                Log In to Your Account
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/30">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-serif text-white mb-2">Verification Failed</h2>
                <p className="text-red-400 text-sm">{message}</p>
              </div>
              <Link 
                to="/register" 
                className="w-full mt-4 bg-transparent border border-white/20 text-white font-bold uppercase tracking-widest text-[10px] py-4 rounded hover:bg-white/5 transition-colors inline-block"
              >
                Back to Registration
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
