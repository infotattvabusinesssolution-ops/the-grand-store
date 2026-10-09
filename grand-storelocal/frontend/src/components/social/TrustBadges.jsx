import React from 'react';
import { ShieldCheck, Award, TrendingUp, Heart } from 'lucide-react';

const badgeConfig = {
  'GRAND_STORE_VERIFIED': { icon: ShieldCheck, label: 'Verified Vendor', className: 'text-amber-500' },
  'GRAND_STORE_CHOICE': { icon: Award, label: 'Grand Store Choice', className: 'text-gold-500' },
  'TRENDING': { icon: TrendingUp, label: 'Trending', className: 'text-red-500' },
  'MOST_LOVED': { icon: Heart, label: 'Most Loved', className: 'text-pink-500' },
};

export const TrustBadges = ({ badges = [], className = '' }) => {
  if (!badges || badges.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {badges.map(badgeId => {
        const config = badgeConfig[badgeId];
        if (!config) return null;
        
        const Icon = config.icon;
        
        return (
          <div 
            key={badgeId} 
            className="inline-flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-medium uppercase tracking-wider"
            title={config.label}
          >
            <Icon size={14} className={config.className} />
            <span className="text-[var(--color-ivory)]">{config.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default TrustBadges;
