import React, { useState, useEffect } from 'react';
import { X, Cookie } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('grandStoreCookieConsent');
    if (!consent) {
      // Small delay so it doesn't pop up instantly on first load
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('grandStoreCookieConsent', 'accepted');
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem('grandStoreCookieConsent', 'rejected');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 right-6 z-[9999] max-w-sm w-[calc(100%-3rem)] bg-[#0a0a0a] border border-[#d99d39]/30 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden"
        >
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 text-[#d99d39]">
                <Cookie size={20} />
                <h3 className="font-serif text-lg font-medium">Cookie Preferences</h3>
              </div>
              <button 
                onClick={handleReject}
                className="text-white/40 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            
            <p className="text-sm text-[#bcb3a7] mb-6 leading-relaxed">
              We use cookies to elevate your experience, analyze site usage, and assist in our exclusive marketing efforts. 
            </p>
            
            <div className="flex items-center gap-3">
              <button
                onClick={handleAccept}
                className="flex-1 bg-[#d99d39] text-[#17120a] hover:bg-[#e1bd70] py-2.5 px-4 text-xs font-bold uppercase tracking-widest rounded transition-colors"
              >
                Accept All
              </button>
              <button
                onClick={handleReject}
                className="flex-1 bg-transparent border border-white/20 text-white hover:bg-white/5 py-2.5 px-4 text-xs font-bold uppercase tracking-widest rounded transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
