import React, { useEffect, useState } from 'react';
import { Heart, CheckCircle, Video, Star } from 'lucide-react';

export const CommunityPage = () => {
  const [wallOfLove, setWallOfLove] = useState([]);

  useEffect(() => {
    // In a real implementation, fetch from /api/social-proof/wall-of-love
    document.title = 'Wall of Love — The Grand Store Community';
    
    // Mock data
    setWallOfLove([
      {
        _id: '1',
        author: { name: 'Eleanor R.' },
        ratings: { overall: 5 },
        comment: 'The packaging was immaculate and the delivery was incredibly swift. Very impressed with the Grand Store experience!',
        isVerifiedPurchase: true,
        media: [{ type: 'photo', url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=500&auto=format&fit=crop&q=60' }],
        createdAt: new Date().toISOString()
      },
      {
        _id: '2',
        author: { name: 'Michael T.' },
        ratings: { overall: 5 },
        comment: 'I recently attended the Whisky Masterclass and it was phenomenal. The host was deeply knowledgeable.',
        isVerifiedPurchase: true,
        media: [],
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        _id: '3',
        author: { name: 'Sophia L.' },
        ratings: { overall: 5 },
        comment: 'Found my favorite vintage here. The provenance documentation gave me complete peace of mind.',
        isVerifiedPurchase: true,
        media: [{ type: 'photo', url: 'https://images.unsplash.com/photo-1559551460-7059db9df845?w=500&auto=format&fit=crop&q=60' }],
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
      },
      {
        _id: '4',
        author: { name: 'David W.' },
        ratings: { overall: 5 },
        comment: 'The auction platform is seamless. I won a rare lot and it was shipped fully insured without any hassle.',
        isVerifiedPurchase: true,
        media: [{ type: 'video_link', url: '#' }],
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
      }
    ]);

    return () => { document.title = 'The Grand Store — Luxury Wines & Spirits'; };
  }, []);

  return (
    <main className="min-h-screen bg-[#0a0907] pt-24 pb-16 px-4 md:px-8 lg:px-12 text-[#eee8dd] font-sans">
      
      <section className="max-w-4xl mx-auto text-center mb-16">
        <Heart className="text-pink-500 mx-auto mb-6" size={48} />
        <h1 className="text-4xl md:text-5xl lg:text-[54px] font-serif leading-[1.1] mb-6">
          The Grand Store Community
        </h1>
        <p className="text-[#918a7f] text-lg max-w-2xl mx-auto">
          We pride ourselves on delivering extraordinary experiences. Here is what collectors, connoisseurs, and casual enthusiasts are saying about us.
        </p>
      </section>

      <section className="max-w-7xl mx-auto">
        <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
          {wallOfLove.map((item) => (
            <div key={item._id} className="break-inside-avoid shell p-6 bg-white/5 border border-white/10 relative overflow-hidden transition-transform hover:-translate-y-1">
              {item.media && item.media.length > 0 && (
                <div className="mb-4 rounded overflow-hidden aspect-video relative bg-black">
                  {item.media[0].type === 'photo' ? (
                    <img src={item.media[0].url} alt="Customer photo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-white/10">
                      <Video size={32} className="text-gold-400" />
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex text-gold-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" />
                ))}
              </div>
              
              <p className="text-[var(--color-ivory)] leading-relaxed italic mb-4">"{item.comment}"</p>
              
              <div className="flex items-center gap-3 border-t border-white/10 pt-4 mt-auto">
                <div className="w-8 h-8 bg-gold-gradient rounded-full flex items-center justify-center font-serif text-black text-sm font-bold">
                  {item.author.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium">{item.author.name}</p>
                  {item.isVerifiedPurchase && (
                    <p className="text-[10px] text-gold-400 flex items-center gap-1 uppercase tracking-widest">
                      <CheckCircle size={10} /> Verified
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      <section className="max-w-3xl mx-auto text-center mt-24">
        <h2 className="text-2xl font-serif mb-4">Share Your Experience</h2>
        <p className="text-[#918a7f] mb-8">
          Have you purchased from a vendor, attended a tasting, or won an auction? We'd love to hear your story.
        </p>
        <button className="button button-gold px-8 py-3">Submit a Story</button>
      </section>

    </main>
  );
};

export default CommunityPage;
