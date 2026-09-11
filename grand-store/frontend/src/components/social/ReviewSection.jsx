import React, { useEffect, useMemo, useState } from 'react';
import { 
  Star, CheckCircle, Image as ImageIcon, Video, ThumbsUp, X, 
  ShieldCheck, Maximize2, Sparkles, Quote, ChevronDown 
} from 'lucide-react';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const ReviewSection = ({ 
  productId,
  reviews = [], 
  averageRating = 0, 
  reviewCount = 0 
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // 'all', 'with_media', 'verified', '5', '4', '3', '2', '1'
  const [sort, setSort] = useState('newest');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [mediaList, setMediaList] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [localReviews, setLocalReviews] = useState(reviews);
  const [helpfulLoading, setHelpfulLoading] = useState({});

  // Lightbox Modal state for full-resolution photo inspection
  const [activeLightbox, setActiveLightbox] = useState(null);

  useEffect(() => {
    setLocalReviews(Array.isArray(reviews) ? reviews : []);
  }, [reviews]);

  // Handle ESC key to close lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveLightbox(null);
      }
    };
    if (activeLightbox) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeLightbox]);

  // Rating Distribution Histogram (Apple & Amazon Luxury pattern)
  const ratingDistribution = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    localReviews.forEach((review) => {
      const star = Math.max(1, Math.min(5, Math.round(Number(review.ratings?.overall || 5))));
      counts[star] = (counts[star] || 0) + 1;
    });
    const total = localReviews.length || 1;
    return [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: counts[star],
      percentage: localReviews.length ? Math.round((counts[star] / total) * 100) : 0,
    }));
  }, [localReviews]);

  // Aggregate Customer Photos Reel
  const allCustomerMedia = useMemo(() => {
    const list = [];
    localReviews.forEach((review) => {
      if (Array.isArray(review.media)) {
        review.media.forEach((item) => {
          if (item?.url) {
            list.push({
              ...item,
              authorName: review.author?.name || 'Grand Store Patron',
              rating: review.ratings?.overall || 5,
              comment: review.comment || '',
              createdAt: review.createdAt,
            });
          }
        });
      }
    });
    return list;
  }, [localReviews]);

  const displayReviews = useMemo(() => {
    const filteredReviews = localReviews.filter((review) => {
      if (filter === 'with_media') return Array.isArray(review.media) && review.media.length > 0;
      if (filter === 'verified') return Boolean(review.isVerifiedPurchase);
      if (['5', '4', '3', '2', '1'].includes(filter)) {
        return Math.round(Number(review.ratings?.overall || 0)) === Number(filter);
      }
      return true;
    });

    return [...filteredReviews].sort((left, right) => {
      if (sort === 'highest') return Number(right.ratings?.overall || 0) - Number(left.ratings?.overall || 0);
      if (sort === 'lowest') return Number(left.ratings?.overall || 0) - Number(right.ratings?.overall || 0);
      if (sort === 'helpful') return Number(right.helpfulCount || 0) - Number(left.helpfulCount || 0);
      return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
    });
  }, [filter, localReviews, sort]);

  const summary = useMemo(() => {
    if (localReviews.length === 0) {
      return { average: Number(averageRating) || 0, count: Number(reviewCount) || 0 };
    }
    const total = localReviews.reduce((sum, review) => sum + Number(review.ratings?.overall || 0), 0);
    return { average: total / localReviews.length, count: localReviews.length };
  }, [averageRating, localReviews, reviewCount]);

  const handleWriteReviewClick = () => {
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setSubmitError('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post('/social-proof/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data?.success && response.data?.url) {
        setMediaList((current) => [...current, { type: 'photo', url: response.data.url }]);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error(error);
      setSubmitError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!rating || !comment.trim()) {
      setSubmitError('Please provide both a rating and a comment.');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError('');
    setSuccessMessage('');
    
    try {
      const response = await api.post('/social-proof/reviews', {
        type: 'product',
        referenceId: productId,
        ratings: { overall: rating },
        comment: comment.trim(),
        media: mediaList
      });

      if (!response.data?.success || !response.data?.data) {
        throw new Error('The review could not be saved');
      }

      setLocalReviews((current) => [response.data.data, ...current]);
      
      setIsModalOpen(false);
      setComment('');
      setRating(5);
      setMediaList([]);
      setSuccessMessage('Thank you. Your review is now published.');
    } catch (error) {
      console.error(error);
      setSubmitError(error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId) => {
    if (!user) {
      navigate('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }
    if (!reviewId || helpfulLoading[reviewId]) return;

    setHelpfulLoading((current) => ({ ...current, [reviewId]: true }));
    try {
      const response = await api.post(`/social-proof/reviews/${reviewId}/helpful`);
      const update = response.data?.data;
      if (response.data?.success && update) {
        setLocalReviews((current) => current.map((review) => review._id === reviewId
          ? { ...review, helpfulCount: update.helpfulCount, viewerFoundHelpful: update.helpful }
          : review));
      }
    } catch (error) {
      setSuccessMessage('');
      setSubmitError(error.response?.data?.message || 'Unable to update this review');
    } finally {
      setHelpfulLoading((current) => ({ ...current, [reviewId]: false }));
    }
  };

  return (
    <div className="review-section mt-14 sm:mt-20 relative font-sans text-stone-200 select-none">
      
      {/* ========================================================================= */}
      {/* 1. TOP EXECUTIVE DASHBOARD: Score, Star Histogram & Primary CTA           */}
      {/* ========================================================================= */}
      <div className="relative mb-10 rounded-2xl bg-gradient-to-b from-[#14120e]/90 via-[#0d0b09]/90 to-[#070605] border border-[#c9a35b]/25 p-6 sm:p-8 lg:p-10 shadow-[0_15px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Left Column: Big Numeric Score & Overall Status */}
          <div className="lg:col-span-4 text-center lg:text-left flex flex-col items-center lg:items-start justify-center">
            <span className="inline-block text-[10px] uppercase tracking-[0.25em] font-semibold text-[#c9a35b] mb-2">
              Patron Feedback & Ratings
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-white font-bold tracking-tight mb-3">
              Customer Reviews
            </h2>

            <div className="flex items-baseline gap-3 my-2">
              <span className="text-5xl sm:text-6xl font-serif font-bold text-white tracking-tight">
                {Number(summary.average).toFixed(1)}
              </span>
              <span className="text-sm sm:text-base text-stone-400 font-light">
                out of 5.0
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[#f5c242] my-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  size={20} 
                  className="drop-shadow-[0_0_8px_rgba(245,194,66,0.4)]"
                  fill={i < Math.round(summary.average) ? "currentColor" : "none"} 
                />
              ))}
            </div>

            <p className="text-xs sm:text-sm text-stone-400 mt-2 font-light">
              Based on <strong className="text-stone-200 font-medium">{summary.count}</strong> verified patron {summary.count === 1 ? 'review' : 'reviews'}
            </p>

            <button 
              onClick={handleWriteReviewClick}
              className="mt-6 w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#f5c242] via-[#c99742] to-[#a67c2e] hover:brightness-110 active:brightness-95 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#c9a35b]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles size={15} /> Write a Review
            </button>
          </div>

          {/* Center Column: Interactive Star Histogram (Apple Store Pattern) */}
          <div className="lg:col-span-8 flex flex-col justify-center space-y-2.5 sm:space-y-3 border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-10">
            <p className="text-xs uppercase tracking-widest text-[#c9a35b] font-semibold mb-1">
              Rating Breakdown
            </p>

            {ratingDistribution.map(({ star, count, percentage }) => {
              const isSelected = filter === String(star);
              return (
                <button
                  key={star}
                  onClick={() => setFilter(isSelected ? 'all' : String(star))}
                  className={`w-full flex items-center gap-3 text-xs sm:text-sm transition-all group py-1 px-2 rounded-lg cursor-pointer ${
                    isSelected ? 'bg-[#c9a35b]/15 border border-[#c9a35b]/40' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-1 w-14 shrink-0 font-medium text-stone-300 group-hover:text-white">
                    <span>{star}</span>
                    <Star size={13} className="text-[#f5c242]" fill="currentColor" />
                  </div>

                  {/* Progress track */}
                  <div className="flex-1 h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/10 relative">
                    <div 
                      className="h-full bg-gradient-to-r from-[#c99742] via-[#f5c242] to-[#e6c987] rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(201,163,91,0.3)]"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <span className="w-12 text-right font-mono text-[11px] sm:text-xs text-stone-400 group-hover:text-stone-200">
                    {percentage}%
                  </span>
                  <span className="w-8 text-right text-[11px] text-stone-500 font-light">
                    ({count})
                  </span>
                </button>
              );
            })}

          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CUSTOMER PHOTO REEL (Amazon Luxury & Farfetch Pattern)                 */}
      {/* ========================================================================= */}
      {allCustomerMedia.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg sm:text-xl text-white font-medium flex items-center gap-2">
              <ImageIcon size={18} className="text-[#c9a35b]" />
              Patron Photos & Unboxings
              <span className="text-xs font-mono text-stone-400 font-normal">({allCustomerMedia.length})</span>
            </h3>
          </div>

          <div className="flex gap-3.5 overflow-x-auto pb-3 scrollbar-none snap-x">
            {allCustomerMedia.map((media, idx) => (
              <div 
                key={idx}
                onClick={() => setActiveLightbox(media)}
                className="snap-start shrink-0 relative group w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-[#c9a35b]/20 hover:border-[#c9a35b] transition-all cursor-pointer bg-black/80 shadow-md"
              >
                <img 
                  src={media.url} 
                  alt={media.caption || 'Patron review photograph'} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 opacity-85 group-hover:opacity-100" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2">
                  <span className="text-[10px] text-white font-medium truncate max-w-[70px]">
                    {media.authorName}
                  </span>
                  <Maximize2 size={12} className="text-[#f5c242]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. FILTER & SORT TOOLBAR                                                 */}
      {/* ========================================================================= */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <span className="text-xs uppercase tracking-widest text-[#c9a35b] font-semibold mr-1">
            Filter:
          </span>
          <button 
            onClick={() => setFilter('all')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
              filter === 'all' 
                ? 'bg-gradient-to-r from-[#c99742] to-[#f5c242] text-black font-bold shadow-md shadow-[#c9a35b]/20' 
                : 'bg-white/[0.05] text-stone-400 hover:text-white border border-white/10 hover:border-white/30'
            }`}
          >
            All ({localReviews.length})
          </button>
          
          <button 
            onClick={() => setFilter('with_media')}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              filter === 'with_media' 
                ? 'bg-gradient-to-r from-[#c99742] to-[#f5c242] text-black font-bold shadow-md shadow-[#c9a35b]/20' 
                : 'bg-white/[0.05] text-stone-400 hover:text-white border border-white/10 hover:border-white/30'
            }`}
          >
            <ImageIcon size={13} /> With Photos ({allCustomerMedia.length})
          </button>

        </div>

        {/* Sort Select Dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs uppercase tracking-widest text-stone-400 font-medium">
            Sort:
          </span>
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none bg-black/80 border border-white/15 focus:border-[#c9a35b] text-white text-xs rounded-xl pl-3 pr-8 py-2 outline-none cursor-pointer transition-colors"
            >
              <option value="newest">Most Recent</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
              <option value="helpful">Most Helpful</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          </div>
        </div>

      </div>

      {successMessage && (
        <div className="mb-6 border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300 rounded-xl flex items-center gap-2 animate-in fade-in" role="status">
          <CheckCircle size={16} className="text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ELEVATED REVIEW CARDS (Big-Tech & Luxury E-Commerce Standard)          */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        {displayReviews.length === 0 ? (
          <div className="py-16 text-center border border-white/10 rounded-2xl bg-white/[0.02]">
            <Quote className="w-10 h-10 mx-auto text-stone-600 mb-3 opacity-50" />
            <p className="text-stone-400 italic text-sm">
              No customer reviews found matching your current filter.
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="mt-3 text-xs text-[#c9a35b] hover:underline cursor-pointer font-medium"
              >
                Reset filters to view all reviews
              </button>
            )}
          </div>
        ) : (
          displayReviews.map((review) => {
            const authorName = review.author?.name || 'Grand Store Patron';
            const authorInitial = authorName.charAt(0).toUpperCase();
            const isAdmin = authorName.toLowerCase().includes('admin') || review.author?.role === 'admin';
            const formattedDate = new Date(review.createdAt || Date.now()).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            });

            return (
              <article 
                key={review._id} 
                className="relative rounded-2xl bg-gradient-to-b from-[#14120e]/95 via-[#0d0b09]/95 to-[#070605] border border-[#c9a35b]/20 hover:border-[#c9a35b]/45 transition-all duration-300 p-5 sm:p-7 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl group overflow-hidden"
              >
                {/* Decorative background watermark */}
                <Quote className="absolute right-4 bottom-4 w-28 h-28 text-[#c9a35b]/[0.03] pointer-events-none select-none" />

                {/* Header Row: Author + Rating */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  
                  {/* Left: Avatar + Identity Badges */}
                  <div className="flex items-center gap-3.5">
                    {/* Ring-Halo Avatar */}
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-[#c99742] via-[#f5d77f] to-[#9a722a] p-[1.5px] shrink-0 shadow-md">
                      <div className="w-full h-full rounded-full bg-[#12100d] flex items-center justify-center font-serif text-base sm:text-lg font-bold text-[#f5d77f]">
                        {authorInitial}
                      </div>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-serif text-[15px] sm:text-[16px] font-semibold text-white tracking-tight break-words">
                          {authorName}
                        </h4>

                        {/* Admin / Sommelier Badge */}
                        {isAdmin && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#c9a35b]/15 border border-[#c9a35b]/40 text-[#f5d77f]">
                            <ShieldCheck size={11} className="text-[#f5d77f]" /> Sommelier / Staff
                          </span>
                        )}

                        {/* Verified Purchase Badge */}
                        {review.isVerifiedPurchase && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                            <CheckCircle size={11} /> Verified Buyer
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] sm:text-xs text-stone-400 mt-0.5 font-light">
                        Reviewed on {formattedDate}
                      </p>
                    </div>
                  </div>

                  {/* Right: Stars Rating + Numeric Pill */}
                  <div className="flex items-center gap-2.5 sm:self-start">
                    <div className="flex text-[#f5c242]">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={15} 
                          className="drop-shadow-[0_0_6px_rgba(245,194,66,0.35)]"
                          fill={i < (review.ratings?.overall || 5) ? "currentColor" : "none"} 
                        />
                      ))}
                    </div>
                    <span className="font-mono text-xs font-bold text-[#f5c242] bg-[#f5c242]/10 border border-[#f5c242]/25 px-2 py-0.5 rounded-md">
                      {Number(review.ratings?.overall || 5).toFixed(1)}
                    </span>
                  </div>

                </div>

                {/* Body: Comment Text (Clean Editorial Style - NO harsh quotes) */}
                <div className="my-4 pl-1">
                  <p className="text-[14.5px] sm:text-[15.5px] text-stone-200 font-sans leading-relaxed tracking-normal break-words whitespace-pre-line">
                    {review.comment}
                  </p>
                </div>

                {/* Media Gallery (Interactive Photo Thumbnails with Lightbox Trigger) */}
                {Array.isArray(review.media) && review.media.length > 0 && (
                  <div className="my-5 flex flex-wrap gap-3">
                    {review.media.map((item, idx) => (
                      <div 
                        key={idx}
                        onClick={() => setActiveLightbox({
                          ...item,
                          authorName,
                          rating: review.ratings?.overall || 5,
                          comment: review.comment,
                          createdAt: review.createdAt
                        })}
                        className="group/thumb relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-white/15 hover:border-[#c9a35b] transition-all cursor-pointer bg-black shadow-md"
                      >
                        {item.type === 'photo' ? (
                          <>
                            <img 
                              src={item.url} 
                              alt={item.caption || 'Review attachment'} 
                              className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300 opacity-90 group-hover/thumb:opacity-100" 
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                              <Maximize2 size={16} className="text-[#f5c242]" />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 rounded border border-white/10">
                            <Video size={24} className="text-[#c9a35b] mb-1.5" />
                            <span className="text-[10.5px] text-stone-300">Video</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer: Helpful Action + Trust Seal */}
                <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={Boolean(helpfulLoading[review._id])}
                    onClick={() => handleHelpful(review._id)}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      review.viewerFoundHelpful 
                        ? 'bg-[#c9a35b]/20 border border-[#c9a35b]/50 text-[#f5d77f] shadow-[0_0_12px_rgba(201,163,91,0.25)]' 
                        : 'bg-white/[0.04] border border-white/10 text-stone-400 hover:text-white hover:border-white/25 hover:bg-white/[0.08]'
                    }`}
                  >
                    <ThumbsUp 
                      size={13} 
                      fill={review.viewerFoundHelpful ? "currentColor" : "none"} 
                      className={review.viewerFoundHelpful ? "text-[#f5d77f]" : ""}
                    />
                    <span>Helpful ({review.helpfulCount || 0})</span>
                  </button>

                  <span className="text-[11px] text-stone-500 font-mono hidden sm:flex items-center gap-1.5">
                    <ShieldCheck size={12} className="text-[#c9a35b]/70" />
                    Grand Store Verified Review
                  </span>
                </div>

              </article>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. FULL-SCREEN LIGHTBOX MODAL (Customer Photo Viewer)                     */}
      {/* ========================================================================= */}
      {activeLightbox && (
        <div 
          onClick={() => setActiveLightbox(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full bg-[#0d0b09] border border-[#c9a35b]/35 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Lightbox Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/60">
              <div className="flex items-center gap-3">
                <span className="font-serif font-semibold text-white text-sm">
                  {activeLightbox.authorName}
                </span>
                <div className="flex text-[#f5c242]">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={13} 
                      fill={i < activeLightbox.rating ? "currentColor" : "none"} 
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={() => setActiveLightbox(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                aria-label="Close photo preview"
              >
                <X size={18} />
              </button>
            </div>

            {/* Lightbox Main Image */}
            <div className="relative flex items-center justify-center bg-black/90 p-2 sm:p-4 min-h-[300px] max-h-[70vh]">
              <img 
                src={activeLightbox.url} 
                alt="Full resolution patron photo" 
                className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg shadow-xl"
              />
            </div>

            {/* Lightbox Caption / Comment Snippet */}
            {activeLightbox.comment && (
              <div className="p-4 bg-black/70 border-t border-white/10 text-xs sm:text-sm text-stone-300 leading-relaxed font-sans">
                <p className="line-clamp-3">"{activeLightbox.comment}"</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. WRITE REVIEW MODAL (Obsidian & Gold Luxury Experience)                */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-gradient-to-b from-[#14120e] via-[#0d0b09] to-[#070605] border border-[#c9a35b]/35 rounded-2xl p-6 sm:p-8 relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-white transition-colors p-1"
            >
              <X size={20} />
            </button>
            
            <div className="mb-6">
              <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#c9a35b] block mb-1">
                Patron Review & Tasting Notes
              </span>
              <h3 className="text-2xl font-serif text-white font-bold tracking-tight">
                Write a Review
              </h3>
            </div>
            
            {submitError && (
              <div className="mb-4 p-3 bg-red-950/60 border border-red-800/60 text-red-300 rounded-xl text-xs flex items-center gap-2">
                <span>⚠️</span> {submitError}
              </div>
            )}
            
            <form onSubmit={handleSubmitReview} className="space-y-5">
              {/* Star Selector */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#c9a35b] font-semibold mb-2">
                  Your Overall Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110 cursor-pointer p-1"
                      >
                        <Star 
                          size={28} 
                          fill={isFilled ? "#f5c242" : "none"} 
                          className={isFilled ? "text-[#f5c242] drop-shadow-[0_0_8px_rgba(245,194,66,0.5)]" : "text-white/25"} 
                        />
                      </button>
                    );
                  })}
                  <span className="ml-2 font-mono text-xs text-stone-400 font-semibold">
                    {hoverRating || rating} of 5 Stars
                  </span>
                </div>
              </div>
              
              {/* Comment Textarea */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#c9a35b] font-semibold mb-2">
                  Your Review & Tasting Notes
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this vintage, nose, palate, finish, or packaging..."
                  className="w-full bg-black/70 border border-white/15 focus:border-[#c9a35b] focus:ring-1 focus:ring-[#c9a35b]/30 rounded-xl p-4 text-white text-xs sm:text-sm placeholder-stone-600 outline-none min-h-[120px] transition-all"
                  required
                />
              </div>
              
              {/* Add Photo */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#c9a35b] font-semibold mb-2">
                  Add Unboxing / Bottle Photo (Optional)
                </label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center justify-center gap-2 p-3.5 border border-dashed border-white/20 hover:border-[#c9a35b]/50 rounded-xl bg-black/40 text-stone-400 hover:text-white text-xs cursor-pointer transition-colors">
                    <ImageIcon size={16} className="text-[#c9a35b]" />
                    <span>{isUploading ? 'Uploading photograph...' : 'Choose a photograph from your device'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                    />
                  </label>
                </div>

                {mediaList.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 mt-3">
                    {mediaList.map((media, idx) => (
                      <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-[#c9a35b]/40">
                        <img src={media.url} alt="Review upload" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setMediaList(mediaList.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/80 text-white flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Submit CTA */}
              <button 
                type="submit" 
                disabled={isSubmitting || isUploading}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-[#f5c242] via-[#c99742] to-[#a67c2e] hover:brightness-110 active:brightness-95 text-black font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#c9a35b]/25 disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center gap-2 cursor-pointer mt-2"
              >
                {isSubmitting ? 'Publishing Review...' : 'PUBLISH REVIEW'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ReviewSection;
