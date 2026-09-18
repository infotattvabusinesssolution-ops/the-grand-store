import React, { useState, useEffect } from 'react';
import {
  PlayCircle, MessageCircle, HelpCircle, PhoneCall, BookOpen,
  Loader2, X, GraduationCap, Video, Search, ChevronRight, CheckCircle2
} from 'lucide-react';
import api from '../../api';

export default function VendorAcademy() {
  const goldTextClass = "text-[#c9a35b]";
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState([]);
  const [config, setConfig] = useState({
    heroTitle: 'Vendor Academy',
    heroSubtitle: 'Master the marketplace. Learn how to optimize your store, photograph your products, and grow your sales.',
    whatsappNumber: '+27 82 000 0000',
    whatsappMessage: 'Hello Grand Store Partner Support, I am an active vendor and need guidance with...',
    ticketUrl: 'mailto:partners@grandstoreglobal.com?subject=Vendor%20Academy%20Support%20Ticket',
    helpCentreUrl: '/glossary',
    requestCallPhone: '+27 11 000 0000',
  });

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLesson, setActiveLesson] = useState(null);

  useEffect(() => {
    fetchAcademy();
  }, []);

  const fetchAcademy = async () => {
    try {
      setLoading(true);
      const res = await api.get('/academy');
      if (res.data) {
        setLessons(res.data.lessons || []);
        if (res.data.config) {
          setConfig(res.data.config);
        }
      }
    } catch (err) {
      console.warn('Could not load dynamic academy data, using defaults:', err);
    } finally {
      setLoading(false);
    }
  };

  // Derive unique categories from lessons
  const categories = ['All', ...new Set(lessons.map((l) => l.category).filter(Boolean))];

  const filteredLessons = lessons.filter((l) => {
    const matchCat = activeCategory === 'All' || l.category === activeCategory;
    const matchSearch =
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const getEmbedUrl = (url) => {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/i);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/i);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    return url;
  };

  const cleanWhatsappDigits = (config.whatsappNumber || '').replace(/[^0-9]/g, '');
  const whatsappHref = cleanWhatsappDigits
    ? `https://wa.me/${cleanWhatsappDigits}?text=${encodeURIComponent(config.whatsappMessage || 'Hello Grand Store Support')}`
    : '#';

  return (
    <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto pb-12">
      {/* Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-[var(--color-gold)]/10 text-[#c9a35b] border border-[var(--color-gold)]/20">
              Partner Learning Hub
            </span>
          </div>
          <h1 className="text-[var(--color-ivory)] font-serif text-4xl sm:text-5xl mb-3 leading-tight">
            {config.heroTitle || 'Vendor'}{' '}
            <span className={goldTextClass}>
              {config.heroTitle?.includes('Academy') ? '' : 'Academy'}
            </span>
          </h1>
          <p className="text-[var(--color-ivory-muted)] text-base sm:text-lg max-w-2xl font-light leading-relaxed">
            {config.heroSubtitle ||
              'Master the marketplace. Learn how to optimize your store, photograph your products, and grow your sales.'}
          </p>
        </div>

        {/* Search input */}
        <div className="w-full md:w-72">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search tutorials & guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#c9a35b] transition-colors"
            />
          </div>
        </div>
      </section>

      {/* Category Pills */}
      {categories.length > 1 && (
        <section className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat
                  ? 'bg-gold-gradient text-black shadow-[0_0_15px_rgba(201,163,91,0.3)]'
                  : 'bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </section>
      )}

      {/* Video / Course Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-white/40 gap-3">
          <Loader2 size={32} className="animate-spin text-[#c9a35b]" />
          <p className="text-xs uppercase tracking-widest font-mono">Loading dynamic curriculum...</p>
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="py-16 px-6 rounded-2xl bg-white/[0.01] border border-white/5 text-center">
          <GraduationCap size={44} className="mx-auto text-white/20 mb-3" />
          <h3 className="text-xl font-serif text-white mb-2">No matching tutorials</h3>
          <p className="text-xs text-white/50 mb-4">Try clearing your search query or selecting another category.</p>
          <button
            type="button"
            onClick={() => { setActiveCategory('All'); setSearchQuery(''); }}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs uppercase tracking-widest"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLessons.map((lesson) => (
            <div
              key={lesson._id || lesson.title}
              onClick={() => setActiveLesson(lesson)}
              className="group cursor-pointer bg-[#0a0a0a] border border-white/5 hover:border-[var(--color-gold)]/40 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-lg hover:-translate-y-1"
            >
              <div>
                {/* Media stage */}
                <div className="relative w-full aspect-video bg-[#050505] overflow-hidden">
                  {lesson.thumbnail ? (
                    <img
                      src={lesson.thumbnail}
                      alt={lesson.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-black to-[#1c160c] flex items-center justify-center">
                      <Video size={40} className="text-white/20" />
                    </div>
                  )}

                  {/* Play Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors z-10">
                    <div className="w-14 h-14 rounded-full bg-black/70 group-hover:bg-[#c9a35b] text-white/80 group-hover:text-black flex items-center justify-center transition-all duration-300 shadow-xl group-hover:scale-110">
                      <PlayCircle size={28} />
                    </div>
                  </div>

                  {/* Badge */}
                  {lesson.badge && (
                    <span className="absolute top-3 left-3 bg-[#c9a35b] text-black text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shadow z-20">
                      {lesson.badge}
                    </span>
                  )}

                  {/* Duration Pill */}
                  <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md text-[10px] text-white font-mono z-20 border border-white/10">
                    {lesson.duration || 'Video'}
                  </div>
                </div>

                {/* Info */}
                <div className="p-5">
                  <span className="text-[9px] uppercase tracking-widest text-[#c9a35b] font-bold block mb-1.5">
                    {lesson.category}
                  </span>
                  <h4 className="text-[var(--color-ivory)] font-serif text-lg group-hover:text-[#e1bd70] transition-colors leading-snug mb-2">
                    {lesson.title}
                  </h4>
                  {lesson.description && (
                    <p className="text-xs text-[var(--color-ivory-muted)] line-clamp-2 leading-relaxed font-light">
                      {lesson.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between text-xs text-[var(--color-gold)] font-medium">
                <span>Start Module</span>
                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Support Section (Admin-Configurable Dynamic Endpoints) */}
      <section className="mt-8 border-t border-white/[0.05] pt-12">
        <h3 className="text-2xl font-serif text-[var(--color-ivory)] mb-2 text-center">
          Need Direct Guidance?
        </h3>
        <p className="text-xs text-[var(--color-ivory-muted)] text-center mb-8 max-w-lg mx-auto">
          Our partner success and compliance teams are available to support you through every stage of onboarding and fulfillment.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* WhatsApp Support */}
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="p-6 rounded-2xl bg-white/[0.01] hover:bg-white/[0.04] border border-white/5 hover:border-green-500/40 flex flex-col items-center text-center transition-all cursor-pointer group"
          >
            <div className="p-4 rounded-full bg-green-500/10 text-green-400 mb-4 group-hover:scale-110 transition-transform">
              <MessageCircle size={24} />
            </div>
            <h5 className="text-[var(--color-ivory)] font-medium mb-1">WhatsApp Support</h5>
            <span className="text-[10px] uppercase tracking-widest font-bold text-green-400 mt-1">
              Chat Now &rarr;
            </span>
          </a>

          {/* Ticket Support */}
          <a
            href={config.ticketUrl || 'mailto:partners@grandstoreglobal.com'}
            className="p-6 rounded-2xl bg-white/[0.01] hover:bg-white/[0.04] border border-white/5 hover:border-[var(--color-gold)]/40 flex flex-col items-center text-center transition-all cursor-pointer group"
          >
            <div className="p-4 rounded-full bg-[var(--color-gold)]/10 text-[#e1bd70] mb-4 group-hover:scale-110 transition-transform">
              <HelpCircle size={24} />
            </div>
            <h5 className="text-[var(--color-ivory)] font-medium mb-1">Create Ticket</h5>
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#e1bd70] mt-1">
              Submit Issue &rarr;
            </span>
          </a>

          {/* Help Centre */}
          <a
            href={config.helpCentreUrl || '/glossary'}
            className="p-6 rounded-2xl bg-white/[0.01] hover:bg-white/[0.04] border border-white/5 hover:border-blue-500/40 flex flex-col items-center text-center transition-all cursor-pointer group"
          >
            <div className="p-4 rounded-full bg-blue-500/10 text-blue-400 mb-4 group-hover:scale-110 transition-transform">
              <BookOpen size={24} />
            </div>
            <h5 className="text-[var(--color-ivory)] font-medium mb-1">Help Centre</h5>
            <span className="text-[10px] uppercase tracking-widest font-bold text-blue-400 mt-1">
              Read Docs &rarr;
            </span>
          </a>

          {/* Request Call */}
          <a
            href={`tel:${config.requestCallPhone || '+27110000000'}`}
            className="p-6 rounded-2xl bg-white/[0.01] hover:bg-white/[0.04] border border-white/5 hover:border-purple-500/40 flex flex-col items-center text-center transition-all cursor-pointer group"
          >
            <div className="p-4 rounded-full bg-purple-500/10 text-purple-400 mb-4 group-hover:scale-110 transition-transform">
              <PhoneCall size={24} />
            </div>
            <h5 className="text-[var(--color-ivory)] font-medium mb-1">Request a Call</h5>
            <span className="text-[10px] uppercase tracking-widest font-bold text-purple-400 mt-1">
              {config.requestCallPhone || 'Call Now'} &rarr;
            </span>
          </a>
        </div>
      </section>

      {/* Interactive Video & Guide Modal */}
      {activeLesson && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0e0e0e] border border-white/20 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-[#c9a35b] font-bold">
                  {activeLesson.category}
                </span>
                <h3 className="text-xl font-serif text-white">{activeLesson.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveLesson(null)}
                className="p-2 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Video Player or Image Showcase */}
            <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto scrollbar-thin">
              <div className="aspect-video bg-black rounded-xl overflow-hidden border border-white/10 flex items-center justify-center shadow-inner">
                {activeLesson.videoUrl ? (
                  activeLesson.videoUrl.includes('youtube.com') || activeLesson.videoUrl.includes('youtu.be') || activeLesson.videoUrl.includes('vimeo.com') ? (
                    <iframe
                      src={getEmbedUrl(activeLesson.videoUrl)}
                      title={activeLesson.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video src={activeLesson.videoUrl} controls autoPlay className="w-full h-full object-contain" />
                  )
                ) : (
                  <div className="text-center p-8">
                    <Video size={48} className="mx-auto text-[#c9a35b]/50 mb-3" />
                    <h4 className="text-lg font-serif text-white mb-1">Guide Document</h4>
                    <p className="text-xs text-white/50">Follow the written guidelines below.</p>
                  </div>
                )}
              </div>

              {activeLesson.description && (
                <p className="text-sm text-white/80 leading-relaxed font-light">
                  {activeLesson.description}
                </p>
              )}

              {activeLesson.articleContent && (
                <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 space-y-2">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#c9a35b] font-bold">
                    <CheckCircle2 size={14} /> Key Best Practices
                  </div>
                  <p className="text-xs text-white/70 whitespace-pre-line leading-relaxed font-light">
                    {activeLesson.articleContent}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
