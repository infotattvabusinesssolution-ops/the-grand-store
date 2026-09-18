import React from 'react';

export default function AppDownloadBadges({ className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <a
        href="https://play.google.com/store/apps/details?id=com.grandstore"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c9a35b]"
      >
        <img src="/assets/footer/google-play.svg" alt="Get it on Google Play" width="162" height="48" className="block h-12 w-auto" />
      </a>
      <a
        href="https://apps.apple.com/in/app/grand-store/id6449220111"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex rounded-lg transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c9a35b]"
      >
        <img src="/assets/footer/app-store.svg" alt="Download on the App Store" width="144" height="48" className="block h-12 w-auto" />
      </a>
    </div>
  );
}
