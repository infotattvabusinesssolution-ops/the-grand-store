import React, { useEffect } from 'react';

export default function DownloadAppRedirect() {
  useEffect(() => {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    
    // Check if iOS
    if (/iPad|iPhone|iPod/.test(ua) && !window.MSStream) {
      window.location.href = "https://apps.apple.com/in/app/grand-store/id6449220111";
    } 
    // Check if Android
    else if (/android/i.test(ua)) {
      window.location.href = "https://play.google.com/store/apps/details?id=com.grandstore";
    } 
    // Fallback for desktop or unknown
    else {
      // You could also redirect to a landing page instead
      window.location.href = "https://play.google.com/store/apps/details?id=com.grandstore";
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] text-[var(--color-ivory)]">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-[var(--color-gold)] border-t-transparent rounded-full animate-spin"></div>
        <p className="font-serif text-xl">Redirecting to your App Store...</p>
      </div>
    </div>
  );
}
