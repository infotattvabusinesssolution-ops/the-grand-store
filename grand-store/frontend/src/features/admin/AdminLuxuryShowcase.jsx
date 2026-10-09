import React, { useState, useEffect } from 'react';
import { Crown, Sparkles, Save, RefreshCw, CheckCircle2, AlertCircle, Eye, ArrowUpRight, Wine, ShieldCheck, Tag, Layers } from 'lucide-react';
import api from '../../api';

export default function AdminLuxuryShowcase() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [productData, setProductData] = useState(null);

  const [formData, setFormData] = useState({
    isEnabled: true,
    badge: 'HAUTE CUVÉE • MÉTHODE CAP CLASSIQUE',
    heading: 'M Collection',
    edition: 'The Brut Reserve',
    tagline: 'Born for the Grandest Moments.',
    story:
      'The “M” stands for Millionaire—a symbol of status, select taste, and timeless sophistication. Hand-selected Chardonnay and Pinot Noir undergo 36 months of patient cellar maturation on the lees in silent French oak cellars. An African masterpiece in every bead.',
    estateQuote:
      '“Harvested selectively at peak ripeness to capture tension, purity, and magnificent crystalline length from vine to flute.”',
    cellarMaster: 'Private Cellar Master Reserve',
    specs: {
      leesAgeing: '36 Months on Lees',
      blend: '60% Chardonnay, 40% Pinot Noir',
      press: '0.4 Bar Whole-Bunch Press',
      dosage: 'Brut Nature • Hand Disgorged',
      abv: '12.0% ABV',
      origin: 'Western Cape, South Africa',
      bottleSize: '750ml',
    },
    tastingNotes: {
      nose: 'Crisp Green Apple, White Truffle, Citrus Blossom',
      palate: 'Toasted Brioche, Creamy Lemon Curd, Roasted Hazelnut',
      finish: 'Enduring Crystalline Minerality & Fine Persistent Bead',
    },
    price: 850,
    offerPrice: 795,
    bottleImage: '/assets/mcollection/mcollection-brut.png',
    ctaText: 'Reserve Allocation',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/luxury-showcase');
      if (res.data?.showcase) {
        setFormData((prev) => ({
          ...prev,
          ...res.data.showcase,
          specs: { ...prev.specs, ...(res.data.showcase.specs || {}) },
          tastingNotes: { ...prev.tastingNotes, ...(res.data.showcase.tastingNotes || {}) },
        }));
      }
      if (res.data?.product) {
        setProductData(res.data.product);
      }
    } catch (err) {
      console.error('Failed to load showcase config:', err);
      setError('Could not load luxury showcase settings from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      setError(null);
      await api.put('/luxury-showcase', formData);
      setMessage('Luxury poster configuration successfully updated!');
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSeedProduct = async () => {
    if (!window.confirm('This will seed or update "M Collection The Brut Reserve" as an official Retail Product in your catalog. Proceed?')) {
      return;
    }
    try {
      setSeeding(true);
      setMessage(null);
      setError(null);
      const res = await api.post('/luxury-showcase/seed');
      setMessage(res.data?.message || 'The Brut Reserve successfully seeded as Retail Product!');
      await fetchData();
      setTimeout(() => setMessage(null), 5000);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-[#d4af37]" size={32} />
          <p className="text-sm tracking-widest text-[#d4af37] uppercase">Loading M Collection Master Controls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30 flex items-center gap-1.5">
              <Crown size={12} /> Editorial Showcase
            </span>
            <span className="text-white/40 text-xs">•</span>
            <span className="text-white/60 text-xs font-mono">Position: Immediately Below New Arrivals</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-serif text-[var(--color-ivory)]">
            M Collection <span className="text-[#d4af37]">Brut Reserve</span> Poster
          </h1>
          <p className="text-xs md:text-sm text-white/60 mt-1 max-w-2xl">
            Manage the high-fashion editorial poster section rendered directly below New Arrivals on Web Production, Web Local, and the React Native Mobile App.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSeedProduct}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-white border border-white/15 text-xs font-medium uppercase tracking-wider transition-all disabled:opacity-50"
            title="Seed/Sync The Brut Reserve directly into Retail Products catalog"
          >
            <RefreshCw size={14} className={seeding ? 'animate-spin text-[#d4af37]' : 'text-[#d4af37]'} />
            {seeding ? 'Seeding...' : 'Seed Retail Product'}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8972e] text-black font-semibold text-xs uppercase tracking-wider shadow-lg shadow-[#d4af37]/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
          >
            <Save size={15} />
            {saving ? 'Saving...' : 'Save Poster Changes'}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Retail Product Sync Card */}
      <div className="p-6 rounded-2xl bg-[#110f0c] border border-[#d4af37]/25 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#d4af37]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-20 rounded-xl bg-[#090807] border border-white/10 flex items-center justify-center p-2 shrink-0">
              <img
                src={formData.bottleImage}
                alt="Bottle thumbnail"
                className="max-h-full max-w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#d4af37] bg-[#d4af37]/10 px-2 py-0.5 rounded border border-[#d4af37]/20">
                  Retail Product Synced
                </span>
                <span className="text-[11px] text-white/40">SKU: mcollection-brut-reserve</span>
              </div>
              <h3 className="text-lg font-serif text-white">{formData.edition} (750ml)</h3>
              <p className="text-xs text-white/60">
                Category: <strong className="text-white/80">Champagne / Méthode Cap Classique</strong> • Stock:{' '}
                <strong className="text-emerald-400">{productData?.stock || formData.stock} bottles</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs text-white/50 uppercase tracking-widest">Store Price</div>
              <div className="text-xl font-serif text-[#d4af37] font-bold">
                R {formData.offerPrice || formData.price}
                {formData.offerPrice && formData.offerPrice < formData.price && (
                  <span className="text-xs text-white/40 line-through ml-2 font-normal">R {formData.price}</span>
                )}
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer bg-white/[0.04] px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 transition-all">
              <input
                type="checkbox"
                checked={formData.isEnabled}
                onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                className="w-4 h-4 rounded text-[#d4af37] focus:ring-[#d4af37] bg-black/60 border-white/20 cursor-pointer"
              />
              <span className="text-xs font-semibold uppercase tracking-wider text-white">
                {formData.isEnabled ? 'Live on Store' : 'Section Hidden'}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Main Form Tabs & Editors */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Editorial & Storytelling */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="p-6 rounded-2xl bg-[#0c0b09] border border-white/10 flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-[#d4af37] flex items-center gap-2 border-b border-white/10 pb-3">
              <Sparkles size={14} /> Poster Editorial Copy
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/60 mb-1.5 font-medium">
                  Eyebrow Badge
                </label>
                <input
                  type="text"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/60 mb-1.5 font-medium">
                  Main Brand Title
                </label>
                <input
                  type="text"
                  value={formData.heading}
                  onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:border-[#d4af37] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/60 mb-1.5 font-medium">
                  Cuvée Edition Name
                </label>
                <input
                  type="text"
                  value={formData.edition}
                  onChange={(e) => setFormData({ ...formData, edition: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/60 mb-1.5 font-medium">
                  Hero Headline
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:border-[#d4af37] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-white/60 mb-1.5 font-medium">
                Editorial Story Narrative
              </label>
              <textarea
                rows={3}
                value={formData.story}
                onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs leading-relaxed focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/60 mb-1.5 font-medium">
                  Cellarmaster Quote
                </label>
                <textarea
                  rows={2}
                  value={formData.estateQuote}
                  onChange={(e) => setFormData({ ...formData, estateQuote: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs leading-relaxed focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/60 mb-1.5 font-medium">
                  Quote Attribution / Author
                </label>
                <input
                  type="text"
                  value={formData.cellarMaster}
                  onChange={(e) => setFormData({ ...formData, cellarMaster: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:border-[#d4af37] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Technical Specs & Tasting Flight */}
          <div className="p-6 rounded-2xl bg-[#0c0b09] border border-white/10 flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-[#d4af37] flex items-center gap-2 border-b border-white/10 pb-3">
              <Wine size={14} /> Sommelier Specs & Tasting Notes
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/60 mb-1.5 font-medium">
                  Lees Ageing
                </label>
                <input
                  type="text"
                  value={formData.specs?.leesAgeing || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      specs: { ...formData.specs, leesAgeing: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/60 mb-1.5 font-medium">
                  Grape Blend
                </label>
                <input
                  type="text"
                  value={formData.specs?.blend || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      specs: { ...formData.specs, blend: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/60 mb-1.5 font-medium">
                  Pressing Method
                </label>
                <input
                  type="text"
                  value={formData.specs?.press || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      specs: { ...formData.specs, press: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:border-[#d4af37] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/60 mb-1 font-medium">
                  Aromas & Nose
                </label>
                <input
                  type="text"
                  value={formData.tastingNotes?.nose || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tastingNotes: { ...formData.tastingNotes, nose: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/60 mb-1 font-medium">
                  Palate & Texture
                </label>
                <input
                  type="text"
                  value={formData.tastingNotes?.palate || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tastingNotes: { ...formData.tastingNotes, palate: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:border-[#d4af37] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-white/60 mb-1 font-medium">
                  Finish & Length
                </label>
                <input
                  type="text"
                  value={formData.tastingNotes?.finish || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tastingNotes: { ...formData.tastingNotes, finish: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:border-[#d4af37] focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing, Bottle Image & Action Preview */}
        <div className="flex flex-col gap-6">
          {/* Price & Allocation Box */}
          <div className="p-6 rounded-2xl bg-[#0c0b09] border border-white/10 flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-[#d4af37] flex items-center gap-2 border-b border-white/10 pb-3">
              <Tag size={14} /> Allocation & Pricing
            </h2>

            <div>
              <label className="block text-xs uppercase tracking-wider text-white/60 mb-1.5 font-medium">
                Original Price (ZAR)
              </label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-white/60 mb-1.5 font-medium">
                Offer / Member Price (ZAR)
              </label>
              <input
                type="number"
                value={formData.offerPrice}
                onChange={(e) => setFormData({ ...formData, offerPrice: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-white/60 mb-1.5 font-medium">
                Button CTA Label
              </label>
              <input
                type="text"
                value={formData.ctaText}
                onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:border-[#d4af37] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-white/60 mb-1.5 font-medium">
                Bottle Image Path
              </label>
              <input
                type="text"
                value={formData.bottleImage}
                onChange={(e) => setFormData({ ...formData, bottleImage: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-xs focus:border-[#d4af37] focus:outline-none"
              />
            </div>
          </div>

          {/* Quick Preview Card */}
          <div className="p-6 rounded-2xl bg-[#090807] border border-[#d4af37]/20 flex flex-col items-center text-center relative overflow-hidden">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#d4af37] mb-2">Live Graphic Poster Preview</div>
            <div className="h-56 w-full flex items-center justify-center my-3 relative">
              <div className="absolute inset-0 bg-[#d4af37]/10 rounded-full blur-2xl" />
              <img
                src={formData.bottleImage}
                alt="Brut Reserve"
                className="h-full object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] relative z-10"
              />
            </div>
            <h4 className="font-serif text-lg text-white font-medium">{formData.edition}</h4>
            <p className="text-xs text-[#d4af37] font-mono mt-1">R {formData.offerPrice || formData.price} ZAR</p>
            <button
              type="submit"
              disabled={saving}
              className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8972e] text-black font-semibold text-xs uppercase tracking-wider transition-all hover:brightness-110"
            >
              {saving ? 'Updating...' : 'Save Live Poster'}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
