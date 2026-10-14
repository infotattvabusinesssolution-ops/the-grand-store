import React, { useState, useEffect } from 'react';
import { 
  Globe, Package, Truck, Filter, Search, ShoppingBag, 
  CheckCircle2, ArrowRight, X, Loader2, Send, ShieldCheck, 
  MapPin, AlertCircle, Plus, Minus, Trash2
} from 'lucide-react';
import api from '../api';
import './TradePortal.css';

export default function TradeCatalogue() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [rfqCart, setRfqCart] = useState([]);
  const [isRfqModalOpen, setIsRfqModalOpen] = useState(false);
  const [submittingRfq, setSubmittingRfq] = useState(false);
  const [rfqSuccess, setRfqSuccess] = useState(null);

  const [rfqForm, setRfqForm] = useState({
    fullname: '',
    email: '',
    phone: '',
    companyname: '',
    destinationCountry: 'United Kingdom',
    destinationPort: 'Felixstowe / London Gateway',
    incoterms: 'FOB',
    currency: 'USD',
    targetArrivalDate: '',
    message: ''
  });

  useEffect(() => {
    fetchTradeProducts();
  }, []);

  const fetchTradeProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products?limit=100');
      const allProducts = res.data?.products || (Array.isArray(res.data) ? res.data : []);
      // Filter products enabled for trade or exportReady
      const tradeItems = allProducts.filter(p => 
        p.channelSettings?.trade?.enabled === true || 
        p.exportReady === true || 
        p.tradePrice > 0
      );
      setProducts(tradeItems.length > 0 ? tradeItems : allProducts.slice(0, 12));
    } catch (err) {
      console.error('Failed to load trade products', err);
    } finally {
      setLoading(false);
    }
  };

  const addToRfqCart = (product) => {
    setRfqCart(prev => {
      const existing = prev.find(item => item._id === product._id);
      if (existing) {
        return prev.map(item => item._id === product._id ? { ...item, caseQuantity: item.caseQuantity + 5 } : item);
      }
      const bpc = product.channelSettings?.trade?.bottlesPerCase || 6;
      const moqBtls = product.channelSettings?.trade?.minimumOrderQuantityBottles || product.minOrderQuantity || 60;
      const initialCases = Math.max(5, Math.ceil(moqBtls / bpc));
      return [...prev, {
        _id: product._id,
        productId: product._id,
        vendorId: product.vendorId,
        name: product.name,
        category: product.category || product.type,
        brand: product.brand,
        image: product.image,
        bottlesPerCase: bpc,
        caseQuantity: initialCases,
        indicativeTradePrice: product.tradePrice || product.channelSettings?.trade?.volumePricingTiers?.[0]?.pricePerBottle || Math.round(product.price * 0.65)
      }];
    });
  };

  const updateCartQuantity = (id, delta) => {
    setRfqCart(prev => prev.map(item => {
      if (item._id === id) {
        const next = Math.max(1, item.caseQuantity + delta);
        return { ...item, caseQuantity: next };
      }
      return item;
    }));
  };

  const removeCartItem = (id) => {
    setRfqCart(prev => prev.filter(item => item._id !== id));
  };

  const handleSubmitRfq = async (e) => {
    e.preventDefault();
    if (rfqCart.length === 0) return;

    try {
      setSubmittingRfq(true);
      const payload = {
        fullname: rfqForm.fullname,
        email: rfqForm.email,
        phone: rfqForm.phone,
        companyname: rfqForm.companyname,
        destinationCountry: rfqForm.destinationCountry,
        destinationPort: rfqForm.destinationPort,
        incoterms: rfqForm.incoterms,
        currency: rfqForm.currency,
        targetArrivalDate: rfqForm.targetArrivalDate,
        message: rfqForm.message,
        source: 'trade_catalogue',
        itemsRequested: rfqCart.map(item => ({
          productId: item.productId,
          vendorId: item.vendorId,
          productName: item.name,
          bottlesPerCase: item.bottlesPerCase,
          caseQuantity: item.caseQuantity
        }))
      };

      const res = await api.post('/trade-enquiries', payload);
      if (res.data?.success) {
        setRfqSuccess(res.data.exportEnquiry?.enquiryCode || 'EXP-SUBMITTED');
        setRfqCart([]);
      }
    } catch (err) {
      console.error('Failed to submit RFQ:', err);
      alert(err.response?.data?.message || 'Error submitting RFQ. Please try again.');
    } finally {
      setSubmittingRfq(false);
    }
  };

  const filtered = products.filter(p => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = selectedCategory === 'All' || (p.category && p.category.toLowerCase() === selectedCategory.toLowerCase()) || (p.type && p.type.toLowerCase() === selectedCategory.toLowerCase());
    return matchesSearch && matchesCat;
  });

  const totalCartCases = rfqCart.reduce((sum, it) => sum + it.caseQuantity, 0);

  return (
    <main className="trade-subpage bg-[#080705] text-[#eee8dd] min-h-screen pb-24 font-sans">
      {/* Hero Header */}
      <section className="shell pt-32 pb-12 text-center max-w-4xl mx-auto">
        <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#c9a35b] block mb-3">
          Grand Store Global · B2B Trade Platform
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif font-medium text-white tracking-tight mb-4">
          Export Catalogue & Request For Quotation
        </h1>
        <p className="text-sm sm:text-base text-white/60 max-w-2xl mx-auto leading-relaxed">
          Source fine wines, spirits, and rare single malts in pallet and container loads directly from verified South African producers and international estates.
        </p>

        {/* Global Assurances */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-xs text-white/70">
          <span className="flex items-center gap-1.5"><ShieldCheck size={16} className="text-[#c9a35b]" /> Verified Export Suppliers</span>
          <span className="flex items-center gap-1.5"><Truck size={16} className="text-[#c9a35b]" /> FOB, CIF, EXW Shipping</span>
          <span className="flex items-center gap-1.5"><Globe size={16} className="text-[#c9a35b]" /> Phytosanitary & Customs Clearance</span>
        </div>
      </section>

      {/* Main Shell */}
      <div className="shell max-w-7xl mx-auto px-4">
        {/* Search, Filter & RFQ Cart Bar */}
        <div className="bg-[#11100e] border border-white/10 rounded-2xl p-4 sm:p-5 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-24 z-30 shadow-2xl backdrop-blur-md">
          <div className="flex flex-1 items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-3 text-white/40" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search winery, estate, variety, HS code..."
                className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#c9a35b]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
              {['All', 'Wine', 'Whisky', 'Spirits'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap border ${
                    selectedCategory === cat
                      ? 'bg-[#c9a35b] text-black border-[#c9a35b]'
                      : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* RFQ Cart Floating Trigger */}
          <button
            onClick={() => setIsRfqModalOpen(true)}
            className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-[#c9a35b] hover:bg-[#e1bd70] text-black font-semibold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#c9a35b]/20 shrink-0 w-full md:w-auto justify-center"
          >
            <ShoppingBag size={16} />
            <span>RFQ Cart ({totalCartCases} Cases)</span>
            {rfqCart.length > 0 && (
              <span className="bg-black text-[#e1bd70] text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                {rfqCart.length}
              </span>
            )}
          </button>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[400px] text-[#e1bd70]">
            <Loader2 className="animate-spin mr-3" size={24} />
            <span>Loading Export Portfolio...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
            <Package size={36} className="mx-auto text-white/20 mb-3" />
            <h3 className="text-base font-serif text-white/80">No matching products found</h3>
            <p className="text-xs text-white/40 mt-1">Try broadening your search or filter criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(product => {
              const trade = product.channelSettings?.trade || {};
              const moq = trade.minimumOrderQuantityBottles || product.minOrderQuantity || 60;
              const bpc = trade.bottlesPerCase || 6;
              const casesPerPallet = trade.casesPerPallet || 56;
              const tradePrice = product.tradePrice || trade.volumePricingTiers?.[0]?.pricePerBottle || Math.round(product.price * 0.65);
              const inCart = rfqCart.find(it => it._id === product._id);

              return (
                <div 
                  key={product._id}
                  className="bg-[#11100e] border border-white/10 hover:border-[#c9a35b]/40 rounded-2xl overflow-hidden transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Visual & Badges */}
                    <div className="h-56 bg-black/40 relative overflow-hidden flex items-center justify-center p-4">
                      {product.image ? (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-500" 
                        />
                      ) : (
                        <Package size={48} className="text-white/20" />
                      )}
                      <div className="absolute top-3 left-3 flex flex-col gap-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider bg-black/80 backdrop-blur-md text-[#e1bd70] px-2 py-0.5 rounded border border-[#c9a35b]/30">
                          {product.category || product.type || 'Wine'}
                        </span>
                        {product.country && (
                          <span className="text-[10px] uppercase tracking-wider bg-black/80 backdrop-blur-md text-white/70 px-2 py-0.5 rounded border border-white/10">
                            {product.country}
                          </span>
                        )}
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                          Export Ready
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="p-5 space-y-3">
                      <div>
                        {product.brand && (
                          <div className="text-[10px] uppercase tracking-widest text-[#c9a35b] font-bold">
                            {product.brand}
                          </div>
                        )}
                        <h3 className="text-base font-serif text-white font-medium line-clamp-1 group-hover:text-[#e1bd70] transition-colors">
                          {product.name}
                        </h3>
                      </div>

                      {/* Export Specs Table */}
                      <div className="bg-black/40 p-3 rounded-xl border border-white/5 text-[11px] space-y-1.5">
                        <div className="flex justify-between text-white/60">
                          <span>Packaging:</span>
                          <span className="text-white font-medium">{bpc} btls / case</span>
                        </div>
                        <div className="flex justify-between text-white/60">
                          <span>Pallet Load:</span>
                          <span className="text-white font-medium">{casesPerPallet} cases / pallet</span>
                        </div>
                        <div className="flex justify-between text-white/60">
                          <span>Export MOQ:</span>
                          <span className="text-[#e1bd70] font-medium">{moq} bottles ({Math.ceil(moq / bpc)} cases)</span>
                        </div>
                        <div className="flex justify-between text-white/60 pt-1 border-t border-white/5">
                          <span>Indicative Wholesale:</span>
                          <span className="text-emerald-400 font-mono font-semibold">R{tradePrice.toLocaleString()} / btl</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-5 pt-0">
                    <button
                      onClick={() => addToRfqCart(product)}
                      className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        inCart
                          ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20'
                          : 'bg-[#c9a35b]/10 hover:bg-[#c9a35b] text-[#e1bd70] hover:text-black border border-[#c9a35b]/30'
                      }`}
                    >
                      {inCart ? (
                        <>
                          <CheckCircle2 size={15} /> Added ({inCart.caseQuantity} cases)
                        </>
                      ) : (
                        <>
                          <Plus size={15} /> Add to RFQ
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* RFQ Drawer / Modal */}
      {isRfqModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#12110e] border border-[#c9a35b]/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative shadow-2xl">
            <button
              onClick={() => setIsRfqModalOpen(false)}
              className="absolute top-5 right-5 text-white/50 hover:text-white"
            >
              <X size={20} />
            </button>

            {rfqSuccess ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-2xl font-serif text-white">Quotation Request Dispatched</h3>
                <p className="text-xs text-white/60 max-w-md mx-auto leading-relaxed">
                  Your international trade enquiry has been assigned reference code{' '}
                  <span className="font-mono text-[#e1bd70] font-bold">{rfqSuccess}</span>. 
                  Our export directorate and verified producers are preparing proforma pricing.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => { setRfqSuccess(null); setIsRfqModalOpen(false); }}
                    className="px-6 py-2.5 rounded-xl bg-[#c9a35b] text-black font-semibold text-xs uppercase tracking-wider"
                  >
                    Return to Catalogue
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-2xl font-serif text-[var(--color-ivory)] mb-1">
                  Request Official Trade Quotation (RFQ)
                </h3>
                <p className="text-xs text-[var(--color-ivory-muted)] mb-6">
                  Review selected allocations and specify your shipping destination for port-delivered proforma pricing.
                </p>

                {/* Items in RFQ */}
                <div className="space-y-3 mb-6">
                  <div className="text-xs uppercase tracking-wider text-white/40 font-bold">
                    Requested Allocations ({rfqCart.length} Items · {totalCartCases} Total Cases)
                  </div>

                  {rfqCart.length === 0 ? (
                    <div className="text-xs text-white/40 italic p-4 rounded-xl bg-black/40 border border-dashed border-white/10 text-center">
                      No products added to RFQ yet. Select items from the catalogue.
                    </div>
                  ) : (
                    rfqCart.map(item => (
                      <div key={item._id} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 text-xs">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-10 h-10 object-contain rounded bg-black/40 shrink-0" />
                          ) : (
                            <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center shrink-0">
                              <Package size={16} className="text-white/40" />
                            </div>
                          )}
                          <div className="truncate">
                            <div className="font-medium text-white truncate">{item.name}</div>
                            <div className="text-[10px] text-white/50">{item.bottlesPerCase} btls/case · R{item.indicativeTradePrice}/btl</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center border border-white/10 rounded-lg bg-black/60">
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item._id, -5)}
                              className="px-2 py-1 text-white/60 hover:text-white"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="px-2 font-mono text-xs text-white font-semibold">{item.caseQuantity} cs</span>
                            <button
                              type="button"
                              onClick={() => updateCartQuantity(item._id, 5)}
                              className="px-2 py-1 text-white/60 hover:text-white"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeCartItem(item._id)}
                            className="text-red-400 hover:text-red-300 p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* RFQ Importer Form */}
                <form onSubmit={handleSubmitRfq} className="space-y-4 pt-4 border-t border-white/10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#bdb5a6] font-bold mb-1">
                        Procurement Contact Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={rfqForm.fullname}
                        onChange={e => setRfqForm({ ...rfqForm, fullname: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c9a35b]"
                        placeholder="e.g. Jean-Luc Moreau"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#bdb5a6] font-bold mb-1">
                        Company / Importer Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={rfqForm.companyname}
                        onChange={e => setRfqForm({ ...rfqForm, companyname: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c9a35b]"
                        placeholder="e.g. Apex Wine Merchants UK"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#bdb5a6] font-bold mb-1">
                        Corporate Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={rfqForm.email}
                        onChange={e => setRfqForm({ ...rfqForm, email: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c9a35b]"
                        placeholder="procurement@apexwine.co.uk"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#bdb5a6] font-bold mb-1">
                        Direct Phone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        value={rfqForm.phone}
                        onChange={e => setRfqForm({ ...rfqForm, phone: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c9a35b]"
                        placeholder="+44 20 7946 0991"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#bdb5a6] font-bold mb-1">
                        Destination Country *
                      </label>
                      <input
                        type="text"
                        required
                        value={rfqForm.destinationCountry}
                        onChange={e => setRfqForm({ ...rfqForm, destinationCountry: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c9a35b]"
                        placeholder="e.g. United Kingdom"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#bdb5a6] font-bold mb-1">
                        Destination Discharge Port
                      </label>
                      <input
                        type="text"
                        value={rfqForm.destinationPort}
                        onChange={e => setRfqForm({ ...rfqForm, destinationPort: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c9a35b]"
                        placeholder="e.g. London Gateway"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-[#bdb5a6] font-bold mb-1">
                        Preferred Incoterm
                      </label>
                      <select
                        value={rfqForm.incoterms}
                        onChange={e => setRfqForm({ ...rfqForm, incoterms: e.target.value })}
                        className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c9a35b]"
                      >
                        <option value="FOB">FOB (Free On Board - Cape Town / Durban)</option>
                        <option value="CIF">CIF (Cost, Insurance & Freight to Port)</option>
                        <option value="EXW">EXW (Ex-Cellar / Winery Warehouse)</option>
                        <option value="DAP">DAP (Delivered at Place)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-[#bdb5a6] font-bold mb-1">
                      Private Label, Custom Palletizing or Back-Label Notes
                    </label>
                    <textarea
                      rows={2}
                      value={rfqForm.message}
                      onChange={e => setRfqForm({ ...rfqForm, message: e.target.value })}
                      className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-[#c9a35b]"
                      placeholder="Specify required back-label health warnings, container temperature control (reefer), or custom certification requirements."
                    />
                  </div>

                  <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsRfqModalOpen(false)}
                      className="px-4 py-2 text-xs uppercase tracking-wider text-white/60 hover:text-white"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={submittingRfq || rfqCart.length === 0}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#c9a35b] hover:bg-[#e1bd70] text-black font-semibold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                    >
                      {submittingRfq ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      <span>Submit RFQ to Directorate</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
