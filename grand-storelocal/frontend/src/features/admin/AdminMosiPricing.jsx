import React, { useState, useEffect } from 'react';
import api from '../../api';
import { 
  Flame, 
  DollarSign, 
  Lock, 
  ShieldCheck, 
  Save, 
  TrendingUp, 
  RefreshCw, 
  Percent, 
  Package, 
  CheckCircle2, 
  AlertCircle,
  EyeOff,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';

export default function AdminMosiPricing({ onNotify }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [savingBulk, setSavingBulk] = useState(false);
  const [bulkPercent, setBulkPercent] = useState('');
  const [bulkRounding, setBulkRounding] = useState('none');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedShape, setSelectedShape] = useState('all');

  const fetchMosiProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products/mosi/pricing');
      setProducts(res.data || []);
    } catch (err) {
      console.error('Failed to load Mosi pricing:', err);
      if (onNotify) onNotify('Failed to fetch Mosi Oa Tunya pricing data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMosiProducts();
  }, []);

  const handleFieldChange = (id, field, value) => {
    setProducts(prev => prev.map(p => {
      if (p._id !== id) return p;
      const updated = { ...p };
      if (!updated.cigarPricing) updated.cigarPricing = {};
      
      if (field === 'singlePrice') {
        const val = Number(value) || 0;
        updated.cigarPricing.singlePrice = val;
        updated.price = String(val);
      } else if (field === 'box10Price') {
        updated.cigarPricing.box10Price = Number(value) || 0;
      } else if (field === 'box25Price') {
        updated.cigarPricing.box25Price = Number(value) || 0;
      } else if (field === 'tradePrice') {
        updated.cigarPricing.tradePrice = Number(value) || 0;
      } else if (field === 'dynamicMarginPct') {
        updated.cigarPricing.dynamicMarginPct = Number(value) || 0;
      } else if (field === 'stock') {
        updated.stock = Number(value) || 0;
      }
      return updated;
    }));
  };

  const autoComputeBox10 = (id) => {
    setProducts(prev => prev.map(p => {
      if (p._id !== id) return p;
      const single = p.cigarPricing?.singlePrice || Number(p.price) || 0;
      const box10 = Math.round(single * 10 * 0.95); // 5% box discount
      return {
        ...p,
        cigarPricing: { ...p.cigarPricing, box10Price: box10 }
      };
    }));
  };

  const autoComputeBox25 = (id) => {
    setProducts(prev => prev.map(p => {
      if (p._id !== id) return p;
      const single = p.cigarPricing?.singlePrice || Number(p.price) || 0;
      const box25 = Math.round(single * 25 * 0.90); // 10% box discount
      return {
        ...p,
        cigarPricing: { ...p.cigarPricing, box25Price: box25 }
      };
    }));
  };

  const autoComputeTrade = (id) => {
    setProducts(prev => prev.map(p => {
      if (p._id !== id) return p;
      const single = p.cigarPricing?.singlePrice || Number(p.price) || 0;
      const trade = Math.round(single * 0.70); // 30% trade discount
      return {
        ...p,
        cigarPricing: { ...p.cigarPricing, tradePrice: trade }
      };
    }));
  };

  const saveProduct = async (product) => {
    try {
      setSavingId(product._id);
      const payload = {
        singlePrice: product.cigarPricing?.singlePrice || Number(product.price) || 0,
        box10Price: product.cigarPricing?.box10Price || 0,
        box25Price: product.cigarPricing?.box25Price || 0,
        tradePrice: product.cigarPricing?.tradePrice || 0,
        dynamicMarginPct: product.cigarPricing?.dynamicMarginPct || 35,
        stock: product.stock,
        hidePriceOnFrontend: true // Always locked as confidential
      };

      await api.put(`/products/mosi/pricing/${product._id}`, payload);
      if (onNotify) onNotify(`Saved pricing for ${product.name}`);
    } catch (err) {
      console.error('Error saving pricing:', err);
      if (onNotify) onNotify(`Failed to save pricing for ${product.name}`);
    } finally {
      setSavingId(null);
    }
  };

  const applyBulkAdjustment = async () => {
    if (!bulkPercent || isNaN(bulkPercent)) {
      if (onNotify) onNotify('Please enter a valid percentage number (e.g. 5 or -5)');
      return;
    }

    try {
      setSavingBulk(true);
      const res = await api.post('/products/mosi/pricing/bulk', {
        percentageChange: Number(bulkPercent),
        rounding: bulkRounding
      });

      if (res.data?.products) {
        setProducts(res.data.products);
      } else {
        await fetchMosiProducts();
      }
      if (onNotify) onNotify(`Successfully applied ${bulkPercent}% dynamic price adjustment to all Mosi products`);
      setBulkPercent('');
    } catch (err) {
      console.error('Bulk adjustment error:', err);
      if (onNotify) onNotify('Failed to apply bulk adjustment');
    } finally {
      setSavingBulk(false);
    }
  };

  const saveAllChanges = async () => {
    try {
      setSavingBulk(true);
      const items = products.map(p => ({
        _id: p._id,
        singlePrice: p.cigarPricing?.singlePrice || Number(p.price) || 0,
        box10Price: p.cigarPricing?.box10Price || 0,
        box25Price: p.cigarPricing?.box25Price || 0,
        tradePrice: p.cigarPricing?.tradePrice || 0,
        dynamicMarginPct: p.cigarPricing?.dynamicMarginPct || 35,
        stock: p.stock,
        hidePriceOnFrontend: true
      }));

      await api.post('/products/mosi/pricing/bulk', { items });
      if (onNotify) onNotify('All Mosi Oa Tunya pricing and inventory changes saved successfully!');
    } catch (err) {
      console.error('Save all error:', err);
      if (onNotify) onNotify('Failed to save all changes');
    } finally {
      setSavingBulk(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = !searchQuery || 
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.cigarSpecs?.wrapper?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const shape = p.cigarSpecs?.shape?.toLowerCase() || '';
    const matchesShape = selectedShape === 'all' || shape.includes(selectedShape.toLowerCase());

    return matchesSearch && matchesShape;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header & Confidentiality Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Flame size={24} />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif text-[var(--color-ivory)]">
                Mosi Oa Tunya Dynamic Pricing Engine
              </h1>
              <p className="text-xs sm:text-sm text-[var(--color-ivory-muted)] mt-1">
                Internal administrator control for single stick, box-of-10, box-of-25, and trade pricing tiers.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchMosiProducts}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold uppercase tracking-wider text-[var(--color-ivory)] hover:bg-white/10 transition-all"
            title="Refresh Pricing"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button
            onClick={saveAllChanges}
            disabled={savingBulk}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38f2a] text-black text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)]"
          >
            <Save size={15} /> {savingBulk ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* Website Price Protection Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/[0.08] border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 text-amber-400">
            <Lock size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wider">
                Cigar Store Price Shield Active
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                STRICTLY ENFORCED
              </span>
            </div>
            <p className="text-xs text-[var(--color-ivory-muted)] mt-0.5">
              Prices set here are dynamically stored in the system for admin invoicing, trade orders, and quotations. 
              <strong> Prices are completely hidden on the cigar store frontend</strong> (visitors only see "Enquire Now" / Private Inquiry).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 text-xs text-amber-300/80 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
          <EyeOff size={14} />
          <span>Hidden from Public Store</span>
        </div>
      </div>

      {/* Bulk Dynamic Adjustment Card */}
      <div className="p-6 rounded-2xl bg-[#0f0f0f] border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-gold)]">
            <Sliders size={16} /> Dynamic Formula & Global Bulk Adjustment
          </div>
          <span className="text-[11px] text-[var(--color-ivory-muted)]">
            Instantly adjust all 10 Mosi products by inflation, currency exchange, or duty
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1.5 font-bold">
              Percentage Delta (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                placeholder="e.g. 5 for +5%, -5 for -5%"
                value={bulkPercent}
                onChange={e => setBulkPercent(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-[var(--color-ivory)] focus:border-gold/50 focus:outline-none"
              />
              <span className="absolute right-3 top-2.5 text-xs text-white/40 font-bold">%</span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1.5 font-bold">
              Rounding Preference
            </label>
            <select
              value={bulkRounding}
              onChange={e => setBulkRounding(e.target.value)}
              className="w-full bg-[#181818] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-[var(--color-ivory)] focus:border-gold/50 focus:outline-none"
            >
              <option value="none">Standard Integer (Exact Round)</option>
              <option value="99">Retail Charm (End in 9, e.g. R399)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1.5 font-bold">
              Quick Preset Buttons
            </label>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setBulkPercent('5')}
                className="flex-1 py-2 px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] font-bold text-white transition-all"
              >
                +5%
              </button>
              <button
                type="button"
                onClick={() => setBulkPercent('10')}
                className="flex-1 py-2 px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] font-bold text-white transition-all"
              >
                +10%
              </button>
              <button
                type="button"
                onClick={() => setBulkPercent('-5')}
                className="flex-1 py-2 px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] font-bold text-white transition-all"
              >
                -5%
              </button>
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={applyBulkAdjustment}
              disabled={savingBulk || !bulkPercent}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <TrendingUp size={14} /> Apply Bulk Adjustment
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search Mosi cigar by name, wrapper, gauge..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2 text-xs text-[var(--color-ivory)] w-full sm:w-72 focus:outline-none focus:border-gold/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-[11px] uppercase tracking-wider text-[var(--color-ivory-muted)] font-bold">Shape:</span>
          {['all', 'robusto', 'toro', 'torpedo', 'corona', 'cigarillo'].map(shape => (
            <button
              key={shape}
              onClick={() => setSelectedShape(shape)}
              className={`px-3 py-1 rounded-lg text-[11px] uppercase font-bold tracking-wider transition-all ${
                selectedShape === shape 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                  : 'bg-white/5 text-white/60 hover:text-white border border-transparent'
              }`}
            >
              {shape}
            </button>
          ))}
        </div>
      </div>

      {/* Products Pricing Table */}
      <div className="rounded-2xl border border-white/10 bg-[#0c0c0c] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-[10px] uppercase tracking-wider text-[var(--color-ivory-muted)] font-bold">
                <th className="py-4 px-4">Cigar Product</th>
                <th className="py-4 px-3">Specs</th>
                <th className="py-4 px-3 text-center">Single Stick (ZAR)</th>
                <th className="py-4 px-3 text-center">Box of 10 (ZAR)</th>
                <th className="py-4 px-3 text-center">Box of 25 (ZAR)</th>
                <th className="py-4 px-3 text-center">Trade / B2B (ZAR)</th>
                <th className="py-4 px-3 text-center">Stock</th>
                <th className="py-4 px-3 text-center">Cigar Store Visibility</th>
                <th className="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-[var(--color-ivory-muted)]">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-amber-400" />
                    Loading Mosi Oa Tunya pricing catalog...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-[var(--color-ivory-muted)]">
                    No matching Mosi Oa Tunya products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map(product => {
                  const pricing = product.cigarPricing || {};
                  const specs = product.cigarSpecs || {};
                  const isSaving = savingId === product._id;

                  return (
                    <tr key={product._id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Product Name & SKU */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image || '/images/products/mot-robusto-zebra.webp'}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-xl border border-white/10 bg-black shrink-0"
                            onError={e => { e.target.src = '/images/mosi-oa-tunya.jpeg'; }}
                          />
                          <div>
                            <div className="font-bold text-sm text-[var(--color-ivory)] hover:text-amber-400 transition-colors">
                              {product.name}
                            </div>
                            <div className="text-[10px] text-amber-400 font-mono tracking-wider">
                              SKU: {product.slug?.toUpperCase() || product.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Specs */}
                      <td className="py-4 px-3">
                        <div className="space-y-0.5 text-[11px]">
                          <span className="text-white/80 font-medium block">
                            {specs.shape || product.size}
                          </span>
                          <span className="text-white/50 text-[10px] block">
                            Wrapper: {specs.wrapper || 'Ecuadorian'}
                          </span>
                          <span className="inline-block px-1.5 py-0.2 rounded text-[9px] bg-white/10 text-white/80 uppercase tracking-widest font-bold">
                            {specs.flavor || 'Premium'}
                          </span>
                        </div>
                      </td>

                      {/* Single Stick Price */}
                      <td className="py-4 px-3">
                        <div className="flex flex-col items-center">
                          <div className="relative w-24">
                            <span className="absolute left-2.5 top-2 text-[11px] text-white/40 font-bold">R</span>
                            <input
                              type="number"
                              value={pricing.singlePrice ?? product.price ?? 0}
                              onChange={e => handleFieldChange(product._id, 'singlePrice', e.target.value)}
                              className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-6 pr-2 py-1.5 text-center text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                            />
                          </div>
                          <span className="text-[9px] text-white/40 mt-1 uppercase font-bold">Per Stick</span>
                        </div>
                      </td>

                      {/* Box of 10 Price */}
                      <td className="py-4 px-3">
                        <div className="flex flex-col items-center">
                          <div className="relative w-24">
                            <span className="absolute left-2.5 top-2 text-[11px] text-white/40 font-bold">R</span>
                            <input
                              type="number"
                              value={pricing.box10Price ?? 0}
                              onChange={e => handleFieldChange(product._id, 'box10Price', e.target.value)}
                              className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-6 pr-2 py-1.5 text-center text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => autoComputeBox10(product._id)}
                            className="text-[9px] text-amber-400/80 hover:text-amber-300 underline mt-1 cursor-pointer"
                            title="Auto 5% box discount"
                          >
                            Auto -5%
                          </button>
                        </div>
                      </td>

                      {/* Box of 25 Price */}
                      <td className="py-4 px-3">
                        <div className="flex flex-col items-center">
                          <div className="relative w-24">
                            <span className="absolute left-2.5 top-2 text-[11px] text-white/40 font-bold">R</span>
                            <input
                              type="number"
                              value={pricing.box25Price ?? 0}
                              onChange={e => handleFieldChange(product._id, 'box25Price', e.target.value)}
                              className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-6 pr-2 py-1.5 text-center text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => autoComputeBox25(product._id)}
                            className="text-[9px] text-amber-400/80 hover:text-amber-300 underline mt-1 cursor-pointer"
                            title="Auto 10% box discount"
                          >
                            Auto -10%
                          </button>
                        </div>
                      </td>

                      {/* Trade / B2B Price */}
                      <td className="py-4 px-3">
                        <div className="flex flex-col items-center">
                          <div className="relative w-24">
                            <span className="absolute left-2.5 top-2 text-[11px] text-white/40 font-bold">R</span>
                            <input
                              type="number"
                              value={pricing.tradePrice ?? 0}
                              onChange={e => handleFieldChange(product._id, 'tradePrice', e.target.value)}
                              className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-6 pr-2 py-1.5 text-center text-xs font-bold text-emerald-400 focus:outline-none focus:border-emerald-400"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => autoComputeTrade(product._id)}
                            className="text-[9px] text-emerald-400/80 hover:text-emerald-300 underline mt-1 cursor-pointer"
                            title="Auto 30% trade discount"
                          >
                            Auto -30%
                          </button>
                        </div>
                      </td>

                      {/* Stock */}
                      <td className="py-4 px-3 text-center">
                        <input
                          type="number"
                          value={product.stock ?? 0}
                          onChange={e => handleFieldChange(product._id, 'stock', e.target.value)}
                          className="w-16 bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1.5 text-center text-xs font-semibold text-white focus:outline-none focus:border-gold/50"
                        />
                      </td>

                      {/* Visibility Status Badge */}
                      <td className="py-4 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                          <Lock size={11} />
                          <span>Hidden on Cigar Store</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => saveProduct(product)}
                          disabled={isSaving}
                          className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/40 border border-white/10 text-xs font-bold transition-all disabled:opacity-40 inline-flex items-center gap-1.5"
                        >
                          <Save size={13} /> {isSaving ? 'Saving...' : 'Save'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
