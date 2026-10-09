import React from 'react';
import { Star } from 'lucide-react';

export const ExpertReviewCard = ({ expertReview }) => {
  if (!expertReview) return null;

  return (
    <div className="relative w-full overflow-hidden py-8 sm:py-12">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Star size={120} />
      </div>
      
      <div className="relative z-10 flex min-w-0 flex-col gap-8 md:flex-row lg:gap-16">
        <div className="min-w-0 border-b border-white/10 pb-8 md:w-1/3 md:border-b-0 md:border-r md:pb-0 md:pr-10">
          <p className="eyebrow text-gold-400 mb-2">Grand Store Expert Review</p>
          <div className="flex items-center gap-4 mb-4">
            {expertReview.expertImage ? (
              <img src={expertReview.expertImage} alt={expertReview.expertName} className="w-16 h-16 rounded-full object-cover grayscale" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-xl uppercase">{expertReview.expertName.substring(0, 2)}</span>
              </div>
            )}
            <div className="min-w-0">
              <h3 className="break-words text-lg font-serif">{expertReview.expertName}</h3>
              <p className="break-words text-sm text-[var(--color-ivory-muted)]">{expertReview.expertTitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <span className="text-3xl font-light">{expertReview.ratings.overall}/10</span>
            <div className="flex text-gold-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} fill={i < Math.round(expertReview.ratings.overall / 2) ? "currentColor" : "none"} />
              ))}
            </div>
          </div>
        </div>
        
        <div className="min-w-0 md:w-2/3">
          <div className="mb-6 grid grid-cols-2 md:grid-cols-3 gap-4">
            {expertReview.ratings.criteria.map((c, i) => (
              <div key={i}>
                <span className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)]">{c.label}</span>
                <span className="text-lg">{c.score}/10</span>
              </div>
            ))}
          </div>
          
          <div>
            <h4 className="text-sm uppercase tracking-widest mb-2 text-gold-400">Our Verdict</h4>
            <p className="break-words text-[var(--color-ivory)] leading-relaxed italic">"{expertReview.verdict}"</p>
          </div>
          
          {expertReview.detailedReview && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-sm text-[var(--color-ivory-muted)]">{expertReview.detailedReview}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpertReviewCard;
