import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from '../../api';
import { useAuth } from "../../context/AuthContext";
import { 
  Users, Building2, TrendingUp, DollarSign, Activity, 
  Search, X, ExternalLink, Edit, Barcode, Copy, Check, 
  Package, Filter, ArrowRight, Sparkles, Trash2, Loader2 
} from "lucide-react";
import Price from "../../components/ui/Price";
import AdminFinancials from "./AdminFinancials"; // We reuse the detailed ledger here!

const getProductBarcode = (product) => {
  return product.barcode || product.ean || product.ean13 || product.identity?.barcode || product.identity?.ean || product.id || product._id || '';
};

const matchesProductSearch = (product, query) => {
  const searchableFields = [
    product.name,
    product.brand,
    product.type,
    product.category,
    product.subcategory,
    product.country,
    product.id,
    product._id,
    product.slug,
    product.barcode,
    product.identity?.barcode,
    product.sku,
    ...(Array.isArray(product.tags) ? product.tags : []),
  ];

  return searchableFields.some((value) =>
    String(value || '').toLowerCase().includes(query)
  );
};

const getProductSearchRank = (product, query) => {
  const name = String(product.name || '').toLowerCase();
  const brand = String(product.brand || '').toLowerCase();
  const barcode = String(product.barcode || product.identity?.barcode || '').toLowerCase();
  const category = String(product.type || product.category || '').toLowerCase();

  if (name === query) return 0;
  if (name.startsWith(query)) return 1;
  if (brand === query || brand.startsWith(query)) return 2;
  if (barcode === query || barcode.startsWith(query)) return 3;
  if (name.includes(query)) return 4;
  if (brand.includes(query)) return 5;
  if (category.includes(query)) return 6;
  return 7;
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Global Product Search state
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('All');
  const [copiedBarcode, setCopiedBarcode] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteToast, setDeleteToast] = useState(null);
  const searchInputRef = useRef(null);

  const handleDeleteProduct = async (e, prod) => {
    e.stopPropagation();
    const prodName = prod.fullName || prod.name || 'this product';
    const confirmed = window.confirm(
      `Are you sure you want to delete "${prodName}"?\n\nThis will permanently remove it from the catalog and store search.`
    );
    if (!confirmed) return;

    const prodId = prod.id || prod._id;
    try {
      setDeletingId(prodId);
      await api.delete(`/products/${prodId}`);
      setProducts((prev) => prev.filter((p) => p._id !== prod._id && p.id !== prod.id));
      setDeleteToast(`"${prodName}" has been successfully removed.`);
      setTimeout(() => setDeleteToast(null), 3500);
    } catch (err) {
      console.error('Failed to delete product:', err);
      alert(err.response?.data?.message || 'Failed to delete product. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const goldText = "text-[#c9a35b]";
  const formatR = (v) => `R${Number(v || 0).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get(`/admin/dashboard`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  // Load all products for instant dashboard searching
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        setLoadingProducts(true);
        const [resPublic, resVendor] = await Promise.allSettled([
          api.get('/products'),
          api.get('/products/vendor/me')
        ]);
        const merged = [];
        const seen = new Set();
        if (resPublic.status === 'fulfilled' && Array.isArray(resPublic.value.data)) {
          resPublic.value.data.forEach((p) => {
            const id = String(p._id || p.id);
            if (id && !seen.has(id)) {
              seen.add(id);
              merged.push(p);
            }
          });
        }
        if (resVendor.status === 'fulfilled' && Array.isArray(resVendor.value.data)) {
          resVendor.value.data.forEach((p) => {
            const id = String(p._id || p.id);
            if (id && !seen.has(id)) {
              seen.add(id);
              merged.push(p);
            }
          });
        }
        setProducts(merged);
      } catch (err) {
        console.error('Error fetching products for dashboard search:', err);
      } finally {
        setLoadingProducts(false);
      }
    };
    fetchAllProducts();
  }, []);

  // Keyboard shortcut: Ctrl+K or Cmd+K to focus search, Esc to clear
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  const categories = useMemo(() => {
    const cats = new Set();
    products.forEach((p) => {
      const c = p.category || p.type;
      if (c) cats.add(c);
    });
    return ['All', ...Array.from(cats).sort()];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    let list = products;
    if (searchCategory !== 'All') {
      list = list.filter((p) => (p.category || p.type) === searchCategory);
    }

    return list
      .filter((p) => matchesProductSearch(p, q))
      .sort((a, b) => {
        const rankDiff = getProductSearchRank(a, q) - getProductSearchRank(b, q);
        return rankDiff || String(a.name || '').localeCompare(String(b.name || ''));
      });
  }, [products, searchQuery, searchCategory]);

  const handleCopyBarcode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedBarcode(code);
    setTimeout(() => setCopiedBarcode(null), 2000);
  };

  if (loading || !stats) {
    return <div className="p-12 text-center text-[var(--color-ivory-muted)] animate-pulse">Loading Platform Matrix...</div>;
  }

  const kpis = [
    { label: "Total Platform Revenue", value: formatR(stats.totalRevenue), icon: TrendingUp, color: "text-green-400" },
    { label: "Total GS Commission", value: formatR(stats.totalCommission), icon: DollarSign, color: "text-[var(--color-gold)]" },
    { label: "Registered Users", value: stats.totalUsers, icon: Users, color: "text-blue-400" },
    { label: "Approved Vendors", value: stats.totalVendors, icon: Building2, color: "text-purple-400" },
  ];

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-10">
      {/* Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-[var(--color-ivory)] font-serif text-4xl md:text-5xl mb-2 leading-tight">
            Platform <span className={goldText}>Overview</span>
          </h1>
          <p className="text-[var(--color-ivory-muted)] text-base md:text-lg font-light">
            Real-time metrics and direct catalog search for The Grand Store.
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/products')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-[var(--color-ivory-muted)] hover:text-white hover:border-[var(--color-gold)]/40 transition-all font-mono"
        >
          <Package size={14} className="text-[var(--color-gold)]" />
          Retail Products Catalog ({products.length})
          <ArrowRight size={13} />
        </button>
      </section>

      {/* Global Product Search Bar */}
      <section className="relative z-30">
        {deleteToast && (
          <div className="mb-3 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between shadow-lg">
            <span className="flex items-center gap-2">
              <Check size={14} className="text-emerald-400 shrink-0" /> {deleteToast}
            </span>
            <button type="button" onClick={() => setDeleteToast(null)} className="text-emerald-400/60 hover:text-emerald-200">
              <X size={13} />
            </button>
          </div>
        )}
        <div className="relative">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center bg-[#0d0d0d] p-3 rounded-2xl border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.5)] focus-within:border-[var(--color-gold)]/60 focus-within:shadow-[0_0_25px_rgba(201,163,91,0.2)] transition-all">
            <div className="relative flex-1 flex items-center">
              <Search size={18} className="absolute left-4 text-[var(--color-gold)] pointer-events-none shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any product across catalog by name, brand, barcode, SKU or category..."
                className="w-full bg-transparent pl-11 pr-10 py-2.5 text-sm md:text-base text-[var(--color-ivory)] placeholder-white/30 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 p-1 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Category Filter Selector */}
            <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-white/10 pt-2 md:pt-0 md:pl-3">
              <Filter size={14} className="text-[var(--color-gold)] hidden md:block shrink-0" />
              <select
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className="bg-[#141414] text-xs text-[var(--color-ivory)] border border-white/10 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[var(--color-gold)]/50 [color-scheme:dark] cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Search Results Panel */}
        {searchQuery.trim() && (
          <div className="mt-4 bg-[#0d0d0d] border border-[var(--color-gold)]/30 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-md animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-4 border-b border-white/10 gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Sparkles size={16} className="text-[var(--color-gold)]" />
                <span className="text-xs uppercase tracking-widest font-bold text-[var(--color-ivory)]">
                  Products Found ({filteredProducts.length})
                </span>
                <span className="text-xs text-[var(--color-ivory-muted)]">
                  matching &ldquo;<span className="text-[var(--color-gold)] font-medium">{searchQuery.trim()}</span>&rdquo;
                  {searchCategory !== 'All' && ` in ${searchCategory}`}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/admin/products')}
                  className="text-[11px] uppercase tracking-wider text-[var(--color-gold)] hover:text-white transition-colors flex items-center gap-1 font-semibold"
                >
                  Open in Retail Products <ArrowRight size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-white/40 hover:text-white transition-colors px-2 py-1 rounded-md hover:bg-white/5"
                >
                  Close (Esc)
                </button>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-[var(--color-ivory-muted)]">
                <Package size={36} className="mx-auto mb-3 text-white/20" />
                <p className="text-base text-white/80 mb-1">No products match &ldquo;{searchQuery}&rdquo;</p>
                <p className="text-xs text-white/40 max-w-md mx-auto">
                  Try searching by brand name (e.g. Macallan, Ballantine&apos;s, Jack Daniel&apos;s), category, or exact barcode.
                </p>
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto space-y-2.5 pr-1 divide-y divide-white/5">
                {filteredProducts.slice(0, 25).map((prod) => {
                  const barcode = getProductBarcode(prod);
                  const isLowStock = prod.stock !== undefined && prod.stock > 0 && prod.stock <= 5;
                  const isOutOfStock = prod.stock !== undefined && prod.stock === 0;

                  return (
                    <div
                      key={prod._id || prod.id}
                      className="pt-2.5 first:pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 rounded-xl hover:bg-white/[0.03] transition-colors group"
                    >
                      {/* Product Thumbnail & Basic Info */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-14 h-14 bg-black/50 rounded-xl flex items-center justify-center p-1.5 border border-white/10 shrink-0 group-hover:border-[var(--color-gold)]/40 transition-colors">
                          <img
                            src={prod.image || '/assets/auction/macallan-25.png'}
                            alt={prod.name}
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = '/assets/auction/macallan-25.png';
                            }}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-[var(--color-ivory)] font-serif text-base font-medium truncate group-hover:text-[var(--color-gold)] transition-colors">
                              {prod.name}
                            </h4>
                            {prod.storeName && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-stone-300 font-mono">
                                {prod.storeName}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-[var(--color-ivory-muted)] mt-0.5 flex-wrap">
                            {prod.brand && <span className="font-medium text-white/70">{prod.brand}</span>}
                            {prod.brand && <span>•</span>}
                            <span className="text-white/50">{prod.category || prod.type || 'Product'}</span>
                            {prod.country && (
                              <>
                                <span>•</span>
                                <span className="text-white/40">{prod.country}</span>
                              </>
                            )}
                          </div>

                          {/* Barcode snippet */}
                          {barcode && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <Barcode size={11} className="text-[#c9a35b]" />
                              <span className="text-[10px] font-mono text-stone-400">{barcode}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyBarcode(barcode)}
                                title="Copy Barcode"
                                className="text-stone-500 hover:text-[var(--color-gold)] p-0.5 transition-colors"
                              >
                                {copiedBarcode === barcode ? (
                                  <Check size={11} className="text-emerald-400" />
                                ) : (
                                  <Copy size={11} />
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Price, Stock & Quick Actions */}
                      <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                        {/* Stock Badge */}
                        <div className="text-right">
                          <div className="text-sm font-serif font-bold text-white">
                            <Price amount={Number(prod.price || 0)} />
                          </div>
                          <div className="mt-0.5">
                            {isOutOfStock ? (
                              <span className="text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">
                                Out of Stock
                              </span>
                            ) : isLowStock ? (
                              <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                                Low: {prod.stock} left
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                {prod.stock !== undefined ? `${prod.stock} in stock` : 'Available'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => window.open(`/product/${prod.slug || prod.id || prod._id}`, '_blank')}
                            className="p-2 rounded-xl bg-white/5 border border-white/10 text-stone-300 hover:text-white hover:border-white/30 hover:bg-white/10 transition-all"
                            title="View product in store (opens in new tab)"
                          >
                            <ExternalLink size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/product-edit/${prod.id || prod._id}`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-gold)] text-black font-semibold text-xs hover:bg-[#e1bd70] hover:shadow-[0_0_15px_rgba(201,163,91,0.4)] transition-all"
                            title="Edit this product"
                          >
                            <Edit size={13} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteProduct(e, prod)}
                            disabled={deletingId === (prod.id || prod._id)}
                            className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/20 hover:border-red-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete this product"
                          >
                            {deletingId === (prod.id || prod._id) ? (
                              <Loader2 size={14} className="animate-spin text-red-400" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredProducts.length > 25 && (
                  <div className="text-center pt-4 pb-2 border-t border-white/5 text-xs text-[var(--color-ivory-muted)] flex items-center justify-center gap-2">
                    <span>Showing top 25 of {filteredProducts.length} matching products.</span>
                    <button
                      type="button"
                      onClick={() => navigate('/admin/products')}
                      className="text-[var(--color-gold)] underline hover:text-white transition-colors"
                    >
                      View all in Retail Products list →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* KPI Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="p-5 bg-[#0a0a0a] border border-white/10 rounded-2xl group hover:border-white/20 transition-all">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-3">
              <kpi.icon size={14} className={kpi.color} /> {kpi.label}
            </div>
            <div className={`text-2xl md:text-3xl font-serif ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </section>

      {/* Module Breakdown */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-[#0a0a0a] border border-[var(--color-gold)]/10 rounded-2xl">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-ivory)] mb-4">Retail Shop</h3>
          <div className="flex justify-between mb-2">
            <span className="text-xs text-[var(--color-ivory-muted)]">Revenue</span>
            <span className="text-sm text-white font-mono">{formatR(stats.breakdown.shop.revenue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-[var(--color-ivory-muted)]">Commission</span>
            <span className="text-sm text-[var(--color-gold)] font-mono">{formatR(stats.breakdown.shop.commission)}</span>
          </div>
        </div>
        <div className="p-6 bg-[#0a0a0a] border border-[var(--color-gold)]/10 rounded-2xl">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-ivory)] mb-4">Live Auctions</h3>
          <div className="flex justify-between mb-2">
            <span className="text-xs text-[var(--color-ivory-muted)]">Revenue</span>
            <span className="text-sm text-white font-mono">{formatR(stats.breakdown.auctions.revenue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-[var(--color-ivory-muted)]">Commission & BP</span>
            <span className="text-sm text-[var(--color-gold)] font-mono">{formatR(stats.breakdown.auctions.commission)}</span>
          </div>
        </div>
        <div className="p-6 bg-[#0a0a0a] border border-[var(--color-gold)]/10 rounded-2xl">
          <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--color-ivory)] mb-4">Events & Experiences</h3>
          <div className="flex justify-between mb-2">
            <span className="text-xs text-[var(--color-ivory-muted)]">Revenue</span>
            <span className="text-sm text-white font-mono">{formatR(stats.breakdown.events.revenue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs text-[var(--color-ivory-muted)]">Commission</span>
            <span className="text-sm text-[var(--color-gold)] font-mono">{formatR(stats.breakdown.events.commission)}</span>
          </div>
        </div>
      </section>

      {/* Detailed Ledger Component Reused */}
      <section className="pt-8 border-t border-white/10">
        <h2 className="text-2xl font-serif text-[var(--color-ivory)] mb-8 flex items-center gap-3">
          <Activity className="text-[var(--color-gold)]" /> Master Transaction Ledger
        </h2>
        <AdminFinancials hideHeader={true} />
      </section>
    </div>
  );
}
