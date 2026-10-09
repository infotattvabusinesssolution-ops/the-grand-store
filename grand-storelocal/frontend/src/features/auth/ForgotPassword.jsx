import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import api from '../../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await api.post('/auth/forgotpassword', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 py-12 md:py-20 relative">
      <Link 
        to="/login" 
        className="absolute top-6 left-6 flex items-center gap-2 text-[var(--color-ivory-muted)] hover:text-white transition-colors text-[10px] uppercase tracking-widest font-bold z-50 cursor-pointer"
      >
        <ArrowLeft size={16} /> Back to Login
      </Link>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <h1 className="text-[#c9a35b] drop-shadow-[0_0_12px_rgba(230,201,122,0.6)] font-serif text-4xl md:text-5xl font-medium tracking-tight mb-4 py-2">
            Reset Password
          </h1>
          <p className="text-[var(--color-ivory-muted)] text-sm md:text-base">
            Enter your email address and we'll send you a link to securely reset your password.
          </p>
        </div>

        {success ? (
          <div className="bg-[#0a0a0a] border-t border-white/10 p-6 md:p-8 rounded-none md:rounded-xl text-center space-y-6">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-serif text-[var(--color-ivory)]">Email Sent</h2>
            <p className="text-[var(--color-ivory-muted)] text-sm">
              If an account exists for <strong className="text-white">{email}</strong>, you will receive a password reset link shortly. Please check your inbox and spam folder.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-[#0a0a0a] border-t border-white/10 p-6 md:p-8 rounded-none md:rounded-xl">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-[var(--color-ivory-muted)] text-[10px] font-bold uppercase tracking-widest mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-white/20" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-4 border-b border-white/10 bg-transparent text-[var(--color-ivory)] placeholder-white/20 focus:outline-none focus:border-[var(--color-gold)] sm:text-sm transition-colors rounded-none"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-4 px-4 shadow-[0_0_15px_rgba(212,175,55,0.4)] text-[10px] uppercase tracking-widest font-bold text-black bg-[#c9a35b] hover:shadow-[0_0_20px_rgba(212,175,55,0.6)] focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-8 rounded-xl"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
