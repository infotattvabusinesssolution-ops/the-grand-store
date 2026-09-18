import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';

export default function VendorApprovalPopup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if the user is a vendor who has been approved but hasn't paid
    if (user && user.role === 'vendor_approved_unpaid') {
      // Small delay to make it feel natural
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [user]);

  // Don't render anything if we're not visible to avoid DOM clutter
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-50 w-full max-w-sm"
        >
          <div className="bg-[#11100e] border border-[#c9a35b]/30 rounded-lg p-5 shadow-2xl relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#c9a35b]/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

            <button
              onClick={() => setIsVisible(false)}
              className="absolute top-3 right-3 text-[#918a7f] hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-4">
              <div className="bg-green-500/10 p-2 rounded-full flex-shrink-0">
                <CheckCircle className="text-green-400" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-playfair text-[#eee8dd] mb-1">Application Approved!</h3>
                <p className="text-sm text-[#bdb5a6] mb-4 leading-relaxed">
                  Congratulations! Your vendor application has been approved. Please pay the registration fee to activate your store and start selling.
                </p>
                <button
                  onClick={() => {
                    setIsVisible(false);
                    navigate('/vendor/payment');
                  }}
                  className="bg-[#c9a35b] hover:bg-[#b08d4a] text-black text-sm font-bold py-2.5 px-4 rounded transition-colors w-full uppercase tracking-wider"
                >
                  Pay Registration Fee
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
