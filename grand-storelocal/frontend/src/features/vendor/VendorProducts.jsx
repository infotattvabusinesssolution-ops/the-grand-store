import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { 
  Package, PlusCircle, Clock, CheckCircle2, XCircle, Eye, Edit, Trash2, 
  Search, X, Filter, Barcode, Copy, Check, LayoutGrid, List, RefreshCw, 
  AlertTriangle, AlertCircle, TrendingUp, DollarSign, Layers, ChevronLeft, 
  ChevronRight, ArrowUpDown, Sparkles
} from 'lucide-react';
import Price from '../../components/ui/Price';

/**
 * Standard GS1 EAN-13 & ITF-14 barcode derivation helper.
 * If product already has barcode attributes, uses them directly.
 * Otherwise, deterministically computes GS1 Modulo-10 checksum-verified barcodes.
 */
const getProductBarcodes = (product) => {
  // 1. Single Bottle Barcode (EAN-13: 13 digits)
  let single = product.barcode || product.ean || product.ean13 || product.identity?.barcode || product.identity?.ean;
  if (!single) {
    const idStr = String(product.id || product._id || 'prod_0000');
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) {
      hash = ((hash << 5) - hash) + idStr.charCodeAt(i);
      hash |= 0;
    }
    const positiveHash = Math.abs(hash).toString().padStart(6, '0').slice(-6);
    // Grand Store registered merchant prefix: 6009800
    const base12 = `6009800${positiveHash}`.slice(0, 12);
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(base12[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    single = `${base12}${checkDigit}`;
  }

  // 2. Carton / Case Barcode (ITF-14: 14 digits)
  let carton = product.cartonBarcode || product.caseBarcode || product.itf14;
  if (!carton) {
    const base12 = single.slice(0, 12);
    // Indicator '1' (Case of 6) + base 12 digits
    const base13 = `1${base12}`;
    let sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(base13[i], 10) * (i % 2 === 0 ? 3 : 1);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    carton = `${base13}${checkDigit}`;
  }

  return { single, carton };
};

export default function VendorProducts() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Primary data states
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Search & Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStockFilter, setSelectedStockFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Presentation states
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [copiedBarcode, setCopiedBarcode] = useState(null);

  // Auth Protection & Initial Fetch
  const fetchProducts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await api.get('/products/vendor/me');
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load vendor products', err);
      setError('Unable to load your retail products. Please check your connection and try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!user || (user.role !== 'vendor_active' && user.role !== 'admin' && user.role !== 'super_admin')) {
      navigate('/login');
      return;
    }
    fetchProducts();
  }, [user, navigate, fetchProducts]);

  // Safe Delete Handler
  const handleDeleteProduct = async (id, productName) => {
    const displayName = productName || 'this product';
    if (!window.confirm(`Are you sure you want to remove "${displayName}" from your retail catalog? This cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    setError(null);
    try {
      await api.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p._id !== id && p.id !== id));
      setSuccessMsg(`"${displayName}" has been permanently removed.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Delete product error:', err);
      setError(err?.response?.data?.message || 'Failed to delete product. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  // Copy Barcode to Clipboard
  const handleCopyBarcode = (code, type) => {
    navigator.clipboard.writeText(code);
    setCopiedBarcode(code);
    setSuccessMsg(`Copied ${type === 'single' ? 'Single EAN-13' : 'Carton ITF-14'} Barcode: ${code}`);
    setTimeout(() => {
      setCopiedBarcode(null);
      setSuccessMsg(null);
    }, 2500);
  };

  // Categories list extracted from data
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach(p => {
      if (p.type) set.add(p.type);
      if (p.category && p.category !== p.type) set.add(p.category);
      if (p.subcategory) set.add(p.subcategory);
    });
    return ['All', ...Array.from(set).sort()];
  }, [products]);

  // Executive KPI Metrics
  const stats = useMemo(() => {
    const total = products.length;
    const approved = products.filter(p => !p.approvalStatus || p.approvalStatus === 'approved' || p.approvalStatus === 'live').length;
    const pending = products.filter(p => p.approvalStatus === 'pending' || p.approvalStatus === 'pending_approval').length;
    const totalStock = products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
    const lowStock = products.filter(p => {
      const stock = Number(p.stock) || 0;
      return stock > 0 && stock <= 10;
    }).length;
    const outOfStock = products.filter(p => (Number(p.stock) || 0) === 0).length;
    const catalogValue = products.reduce((acc, p) => acc + ((Number(p.price) || 0) * (Number(p.stock) || 0)), 0);

    return { total, approved, pending, totalStock, lowStock, outOfStock, catalogValue };
  }, [products]);

  // Filtering & Sorting Logic
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];

    // 1. Search Query
    const query = searchTerm.trim().toLowerCase();
    if (query) {
      result = result.filter(p => {
        const { single, carton } = getProductBarcodes(p);
        const searchables = [
          p.name,
          p.brand,
          p.type,
          p.category,
          p.subcategory,
          p.country,
          p.id,
          p._id,
          single,
          carton,
          ...(Array.isArray(p.tags) ? p.tags : []),
        ].map(v => String(v || '').toLowerCase());

        return searchables.some(field => field.includes(query));
      });
    }

    // 2. Category Filter
    if (selectedCategory !== 'All') {
      result = result.filter(p => 
        p.type === selectedCategory || 
        p.category === selectedCategory || 
        p.subcategory === selectedCategory
      );
    }

    // 3. Stock Level Filter
    if (selectedStockFilter === 'in_stock') {
      result = result.filter(p => (Number(p.stock) || 0) > 10);
    } else if (selectedStockFilter === 'low_stock') {
      result = result.filter(p => {
        const stock = Number(p.stock) || 0;
        return stock > 0 && stock <= 10;
      });
    } else if (selectedStockFilter === 'out_of_stock') {
      result = result.filter(p => (Number(p.stock) || 0) === 0);
    }

    // 4. Approval Status Filter
    if (selectedStatusFilter === 'approved') {
      result = result.filter(p => !p.approvalStatus || p.approvalStatus === 'approved' || p.approvalStatus === 'live');
    } else if (selectedStatusFilter === 'pending') {
      result = result.filter(p => p.approvalStatus === 'pending' || p.approvalStatus === 'pending_approval');
    } else if (selectedStatusFilter === 'rejected') {
      result = result.filter(p => p.approvalStatus === 'rejected');
    }

    // 5. Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return String(a.name || '').localeCompare(String(b.name || ''));
        case 'name_desc':
          return String(b.name || '').localeCompare(String(a.name || ''));
        case 'price_asc':
          return (Number(a.price) || 0) - (Number(b.price) || 0);
        case 'price_desc':
          return (Number(b.price) || 0) - (Number(a.price) || 0);
        case 'stock_asc':
          return (Number(a.stock) || 0) - (Number(b.stock) || 0);
        case 'stock_desc':
          return (Number(b.stock) || 0) - (Number(a.stock) || 0);
        case 'newest':
        default:
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });

    return result;
  }, [products, searchTerm, selectedCategory, selectedStockFilter, selectedStatusFilter, sortBy]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedStockFilter, selectedStatusFilter, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedProducts.slice(start, start + itemsPerPage);
  }, [filteredAndSortedProducts, currentPage, itemsPerPage]);

  // Status Badge Component
  const renderStatusBadge = (status) => {
    const norm = String(status || 'approved').toLowerCase();
    if (norm === 'approved' || norm === 'live') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 tracking-wide">
          <CheckCircle2 size={12} className="text-emerald-400" /> Live in Cellar
        </span>
      );
    }
    if (norm === 'pending' || norm === 'pending_approval' || norm === 'upcoming') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25 tracking-wide">
          <Clock size={12} className="text-amber-400 animate-pulse" /> Pending Review
        </span>
      );
    }
    if (norm === 'rejected' || norm === 'closed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/25 tracking-wide">
          <XCircle size={12} className="text-rose-400" /> Action Required
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-stone-500/10 text-stone-400 border border-stone-500/20">
        {status}
      </span>
    );
  };

  // Stock Badge Component
  const renderStockBadge = (stock) => {
    const num = Number(stock) || 0;
    if (num === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <AlertTriangle size={11} /> 0 Units (Out of Stock)
        </span>
      );
    }
    if (num <= 10) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <AlertCircle size={11} /> {num} units (Low Stock)
        </span>
      );
    }
    return (
      <span className="text-[#e1bd70] font-sans font-semibold tracking-wide text-sm">
        {num.toLocaleString()} units
      </span>
    );
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedStockFilter('all');
    setSelectedStatusFilter('all');
    setSortBy('newest');
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-16">
      
      {/* ========================================================================= */}
      {/* 1. HEADER SECTION                                                         */}
      {/* ========================================================================= */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest bg-[var(--color-gold)]/10 text-[#e1bd70] border border-[var(--color-gold)]/30">
              Cellar Management
            </span>
            <span className="text-xs text-stone-500">•</span>
            <span className="text-xs text-stone-400">GS Verified Barcodes & Inventory</span>
          </div>
          <h1 className="text-[var(--color-ivory)] font-serif text-3xl sm:text-4xl">
            Retail <span className="text-[#e1bd70] italic">Products</span>
          </h1>
          <p className="text-[var(--color-ivory-muted)] text-sm sm:text-base font-light mt-1 max-w-2xl">
            Manage your retail portfolio, track live bottle inventory, verify EAN-13 & ITF-14 barcodes, and adjust cellar pricing.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={() => fetchProducts(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-stone-400 hover:text-[#e1bd70] hover:border-[#c9a35b]/30 transition-all cursor-pointer disabled:opacity-50"
            title="Refresh Catalog"
          >
            <RefreshCw size={17} className={refreshing ? 'animate-spin text-[#c9a35b]' : ''} />
          </button>
          
          <button
            onClick={() => navigate('/vendor/product-add')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5c242] via-[#c99742] to-[#a67c2e] hover:brightness-110 active:brightness-95 text-black font-bold text-xs uppercase tracking-widest shadow-lg shadow-[#c9a35b]/20 transition-all cursor-pointer"
          >
            <PlusCircle size={16} />
            <span>+ Add New Product</span>
          </button>
        </div>
      </section>

      {/* Notifications / Feedback Toasts */}
      {successMsg && (
        <div className="flex items-center justify-between gap-3 bg-emerald-950/40 backdrop-blur-md border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400/60 hover:text-emerald-300">
            <X size={15} />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between gap-3 bg-red-950/40 backdrop-blur-md border border-red-500/30 text-red-300 px-4 py-3 rounded-xl shadow-lg">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-400/60 hover:text-red-300">
            <X size={15} />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EXECUTIVE KPI METRICS RIBBON                                           */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total SKUs */}
        <div className="bg-[#0e0e0e] border border-white/5 hover:border-white/10 rounded-2xl p-4 sm:p-5 transition-all">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Total SKUs</span>
            <div className="p-2 rounded-lg bg-[var(--color-gold)]/10 text-[#e1bd70]">
              <Package size={17} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-[var(--color-ivory)] font-bold">
            {stats.total}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Catalogued products</p>
        </div>

        {/* Live in Cellar */}
        <div className="bg-[#0e0e0e] border border-white/5 hover:border-white/10 rounded-2xl p-4 sm:p-5 transition-all">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Active & Live</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 size={17} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-emerald-400 font-bold">
            {stats.approved}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {stats.pending > 0 ? `${stats.pending} under review` : '100% catalog approved'}
          </p>
        </div>

        {/* Total Stock Units */}
        <div className="bg-[#0e0e0e] border border-white/5 hover:border-white/10 rounded-2xl p-4 sm:p-5 transition-all">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Inventory Units</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Layers size={17} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-serif text-[#e1bd70] font-bold">
            {stats.totalStock.toLocaleString()}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Total physical bottles</p>
        </div>

        {/* Low / Out of Stock Alert */}
        <div className="bg-[#0e0e0e] border border-white/5 hover:border-white/10 rounded-2xl p-4 sm:p-5 transition-all">
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold">Stock Alerts</span>
            <div className={`p-2 rounded-lg ${stats.lowStock > 0 || stats.outOfStock > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-stone-500/10 text-stone-400'}`}>
              <AlertTriangle size={17} />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-serif font-bold ${stats.outOfStock > 0 ? 'text-rose-400' : stats.lowStock > 0 ? 'text-amber-400' : 'text-stone-300'}`}>
            {stats.lowStock + stats.outOfStock}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {stats.outOfStock > 0 ? `${stats.outOfStock} out of stock` : stats.lowStock > 0 ? `${stats.lowStock} low stock` : 'Optimal stock levels'}
          </p>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. CONTROLS & FILTER BAR                                                  */}
      {/* ========================================================================= */}
      <section className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col gap-4">
        
        {/* Top Filter Row: Search & Actions */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <div className="flex items-center gap-3 bg-[#141414] border border-white/10 rounded-xl px-3.5 py-2.5 transition-colors focus-within:border-[#c9a35b]/70 focus-within:ring-2 focus-within:ring-[#c9a35b]/10">
              <Search size={17} className="text-stone-400 shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products by name, varietal, barcode (EAN/ITF), or SKU..."
                className="w-full bg-transparent text-sm text-[#eee8dd] placeholder:text-stone-500 outline-none"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="text-stone-500 hover:text-white transition-colors"
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Selects & View Toggle */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Category / Varietal Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-[#141414] border border-white/10 text-stone-200 text-xs sm:text-sm rounded-xl px-3 py-2.5 outline-none focus:border-[#c9a35b] transition-colors cursor-pointer"
            >
              {categories.map(cat => (
                <option key={cat} value={cat} className="bg-[#141414] text-white">
                  {cat === 'All' ? 'All Categories' : cat}
                </option>
              ))}
            </select>

            {/* Stock Level Dropdown */}
            <select
              value={selectedStockFilter}
              onChange={(e) => setSelectedStockFilter(e.target.value)}
              className="bg-[#141414] border border-white/10 text-stone-200 text-xs sm:text-sm rounded-xl px-3 py-2.5 outline-none focus:border-[#c9a35b] transition-colors cursor-pointer"
            >
              <option value="all" className="bg-[#141414]">All Stock Levels</option>
              <option value="in_stock" className="bg-[#141414]">In Stock (&gt;10)</option>
              <option value="low_stock" className="bg-[#141414]">Low Stock (1-10)</option>
              <option value="out_of_stock" className="bg-[#141414]">Out of Stock (0)</option>
            </select>

            {/* Status Dropdown */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-[#141414] border border-white/10 text-stone-200 text-xs sm:text-sm rounded-xl px-3 py-2.5 outline-none focus:border-[#c9a35b] transition-colors cursor-pointer"
            >
              <option value="all" className="bg-[#141414]">All Statuses</option>
              <option value="approved" className="bg-[#141414]">Live in Cellar</option>
              <option value="pending" className="bg-[#141414]">Pending Review</option>
              <option value="rejected" className="bg-[#141414]">Action Needed</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#141414] border border-white/10 text-stone-200 text-xs sm:text-sm rounded-xl px-3 py-2.5 outline-none focus:border-[#c9a35b] transition-colors cursor-pointer"
            >
              <option value="newest" className="bg-[#141414]">Sort: Newest Added</option>
              <option value="name_asc" className="bg-[#141414]">Sort: Name (A-Z)</option>
              <option value="name_desc" className="bg-[#141414]">Sort: Name (Z-A)</option>
              <option value="price_desc" className="bg-[#141414]">Sort: Price High to Low</option>
              <option value="price_asc" className="bg-[#141414]">Sort: Price Low to High</option>
              <option value="stock_desc" className="bg-[#141414]">Sort: Stock High to Low</option>
              <option value="stock_asc" className="bg-[#141414]">Sort: Stock Low to High</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#141414] border border-white/10 rounded-xl p-1 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-[#c9a35b] text-black shadow' : 'text-stone-400 hover:text-white'}`}
                title="Table View (Full Barcodes & Specs)"
              >
                <List size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#c9a35b] text-black shadow' : 'text-stone-400 hover:text-white'}`}
                title="Grid Cards View"
              >
                <LayoutGrid size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Summary & Result Count */}
        <div className="flex flex-wrap items-center justify-between text-xs text-stone-400 pt-2 border-t border-white/[0.04]">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-white">{filteredAndSortedProducts.length}</strong> of{' '}
              <strong className="text-stone-300">{products.length}</strong> products
            </span>
            {(searchTerm || selectedCategory !== 'All' || selectedStockFilter !== 'all' || selectedStatusFilter !== 'all') && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-[#e1bd70] hover:underline ml-2 cursor-pointer font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span>Per page:</span>
            {[10, 25, 50].map(size => (
              <button
                key={size}
                type="button"
                onClick={() => setItemsPerPage(size)}
                className={`px-2 py-0.5 rounded transition-colors ${itemsPerPage === size ? 'bg-[#c9a35b]/20 text-[#e1bd70] font-bold border border-[#c9a35b]/40' : 'text-stone-500 hover:text-stone-300'}`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. MAIN PRODUCT DISPLAY (TABLE OR GRID)                                  */}
      {/* ========================================================================= */}
      {loading ? (
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl py-24 text-center">
          <div className="w-12 h-12 border-2 border-[#c9a35b] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--color-ivory-muted)] font-serif text-lg">Loading your retail cellar...</p>
          <p className="text-stone-500 text-xs mt-1">Retrieving product catalog, live stock, and GS barcodes</p>
        </div>
      ) : products.length === 0 ? (
        /* Empty State: Vendor has no products at all */
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl py-20 px-6 text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-[var(--color-gold)]/10 text-[#e1bd70] flex items-center justify-center mb-5 border border-[var(--color-gold)]/20 shadow-inner">
            <Package size={36} />
          </div>
          <h3 className="text-[var(--color-ivory)] font-serif text-2xl sm:text-3xl mb-2">No Products in Your Cellar Yet</h3>
          <p className="text-[var(--color-ivory-muted)] mb-8 max-w-md font-light text-sm sm:text-base">
            Your retail store is currently empty. Add your first wine allocation or retail spirit to start receiving orders on Grand Store.
          </p>
          <button
            onClick={() => navigate('/vendor/product-add')}
            className="px-8 py-3.5 rounded-full bg-gradient-to-r from-[#f5c242] via-[#c99742] to-[#a67c2e] text-black font-extrabold uppercase tracking-widest text-xs transition-all shadow-xl shadow-[#c9a35b]/20 hover:scale-105"
          >
            + Add Your First Retail Product
          </button>
        </div>
      ) : filteredAndSortedProducts.length === 0 ? (
        /* Empty State: Search/Filter returned 0 matches */
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl py-16 px-6 text-center flex flex-col items-center">
          <Search size={36} className="text-stone-600 mb-4" />
          <h3 className="text-[var(--color-ivory)] font-serif text-2xl mb-2">No matching products found</h3>
          <p className="text-stone-400 mb-6 text-sm max-w-md">
            No products match the criteria: <span className="text-[#e1bd70]">"{searchTerm || selectedCategory}"</span>. Try adjusting your search query or clearing active filters.
          </p>
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-6 py-2 rounded-full border border-[var(--color-gold)]/30 text-[#e1bd70] text-xs font-semibold uppercase tracking-widest hover:bg-[var(--color-gold)]/10 transition-colors"
          >
            Clear all filters
          </button>
        </div>
      ) : viewMode === 'table' ? (
        
        /* ----------------------------------------------------------------------- */
        /* MODE A: FULL DETAILED TABLE WITH BARCODES                               */
        /* ----------------------------------------------------------------------- */
        <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="py-4 px-5 text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                    Product & Varietal
                  </th>
                  <th className="py-4 px-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                    GS Barcodes (Single / Carton)
                  </th>
                  <th className="py-4 px-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                    Stock Level
                  </th>
                  <th className="py-4 px-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                    Retail Price
                  </th>
                  <th className="py-4 px-4 text-[11px] font-bold text-stone-400 uppercase tracking-widest">
                    Cellar Status
                  </th>
                  <th className="py-4 px-5 text-[11px] font-bold text-stone-400 uppercase tracking-widest text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedProducts.map((product) => {
                  const barcodes = getProductBarcodes(product);
                  const prodId = product.id || product._id;

                  return (
                    <tr key={product._id || product.id} className="hover:bg-white/[0.02] transition-colors group">
                      
                      {/* 1. Product Details */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3.5">
                          <div className="relative w-14 h-14 bg-black/60 rounded-xl flex items-center justify-center p-1.5 border border-white/10 shadow-inner group-hover:border-[#c9a35b]/30 transition-all shrink-0 overflow-hidden">
                            <img
                              src={product.image || '/assets/auction/macallan-25.png'}
                              alt={product.name}
                              onError={(e) => { e.target.src = '/assets/auction/macallan-25.png'; }}
                              className="max-w-full max-h-full object-contain mix-blend-screen transition-transform duration-300 group-hover:scale-110"
                            />
                            {product.featured && (
                              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#f5c242] shadow-[0_0_8px_#f5c242]" title="Featured Allocation" />
                            )}
                          </div>
                          
                          <div className="min-w-0 max-w-sm">
                            <Link
                              to={`/product/${product.slug || prodId}`}
                              className="text-[#eee8dd] font-medium font-serif text-base tracking-wide hover:text-[#e1bd70] transition-colors line-clamp-1 block"
                              title={product.name}
                            >
                              {product.name}
                            </Link>
                            
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              {product.subcategory && (
                                <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold bg-white/5 text-[#c9a35b] border border-white/5">
                                  {product.subcategory}
                                </span>
                              )}
                              {product.size && (
                                <span className="text-[10px] text-stone-400 tracking-wider">
                                  {product.size}
                                </span>
                              )}
                              {product.identity?.abv && (
                                <span className="text-[10px] text-stone-400 tracking-wider">
                                  • {product.identity.abv}
                                </span>
                              )}
                            </div>
                            
                            <span className="text-[10px] font-mono text-stone-500 mt-0.5 block truncate">
                              SKU: {prodId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. GS Barcodes (Single & Carton) */}
                      <td className="py-4 px-4 text-xs font-mono">
                        <div className="flex flex-col gap-1.5 min-w-[210px]">
                          
                          {/* Single EAN-13 */}
                          <div className="flex items-center justify-between gap-2 bg-[#121212] px-2.5 py-1 rounded-lg border border-white/5 hover:border-[#c9a35b]/30 transition-colors">
                            <div className="flex items-center gap-1.5 truncate">
                              <Barcode size={13} className="text-[#c9a35b] shrink-0" />
                              <span className="text-[9.5px] text-stone-400 uppercase font-sans font-bold">Single</span>
                              <span className="text-stone-200 tracking-wider text-[11px] truncate">{barcodes.single}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyBarcode(barcodes.single, 'single')}
                              title="Copy EAN-13 Single Barcode"
                              className="text-stone-500 hover:text-[#c9a35b] transition-colors p-0.5 shrink-0"
                            >
                              {copiedBarcode === barcodes.single ? (
                                <Check size={12} className="text-emerald-400" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>

                          {/* Carton ITF-14 */}
                          <div className="flex items-center justify-between gap-2 bg-[#121212] px-2.5 py-1 rounded-lg border border-white/5 hover:border-[#c9a35b]/30 transition-colors">
                            <div className="flex items-center gap-1.5 truncate">
                              <Package size={12} className="text-stone-400 shrink-0" />
                              <span className="text-[9.5px] text-stone-400 uppercase font-sans font-bold">Carton (6x)</span>
                              <span className="text-stone-300 tracking-wider text-[10.5px] truncate">{barcodes.carton}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyBarcode(barcodes.carton, 'carton')}
                              title="Copy ITF-14 Carton Barcode"
                              className="text-stone-500 hover:text-[#c9a35b] transition-colors p-0.5 shrink-0"
                            >
                              {copiedBarcode === barcodes.carton ? (
                                <Check size={12} className="text-emerald-400" />
                              ) : (
                                <Copy size={12} />
                              )}
                            </button>
                          </div>

                        </div>
                      </td>

                      {/* 3. Stock Level */}
                      <td className="py-4 px-4">
                        {renderStockBadge(product.stock)}
                      </td>

                      {/* 4. Retail Price */}
                      <td className="py-4 px-4 text-[var(--color-ivory)] font-sans font-semibold tracking-wide text-sm sm:text-base">
                        <Price amount={Number(product.price)} />
                      </td>

                      {/* 5. Cellar Approval Status */}
                      <td className="py-4 px-4">
                        {renderStatusBadge(product.approvalStatus)}
                      </td>

                      {/* 6. Quick Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* View in Store */}
                          <button
                            type="button"
                            onClick={() => navigate(`/product/${product.slug || prodId}`)}
                            className="p-2 rounded-lg border border-white/5 text-stone-400 hover:text-[#e1bd70] hover:bg-[#e1bd70]/10 hover:border-[#e1bd70]/30 transition-all cursor-pointer"
                            title="View Product in Customer Store"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Edit Details */}
                          <button
                            type="button"
                            onClick={() => navigate(`/vendor/product-edit/${prodId}`)}
                            className="p-2 rounded-lg border border-white/5 text-stone-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
                            title="Edit Product Details & Stock"
                          >
                            <Edit size={15} />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prodId, product.name)}
                            disabled={deletingId === prodId}
                            className="p-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 transition-all disabled:opacity-40 cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 size={15} className={deletingId === prodId ? 'animate-spin' : ''} />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        
        /* ----------------------------------------------------------------------- */
        /* MODE B: VISUAL GRID CARDS VIEW                                          */
        /* ----------------------------------------------------------------------- */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {paginatedProducts.map((product) => {
            const barcodes = getProductBarcodes(product);
            const prodId = product.id || product._id;

            return (
              <div 
                key={product._id || product.id}
                className="bg-[#0a0a0a] border border-white/5 hover:border-[#c9a35b]/30 rounded-2xl p-4 flex flex-col justify-between transition-all group shadow-xl relative"
              >
                {/* Top Header inside card */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex flex-col gap-1">
                    {renderStatusBadge(product.approvalStatus)}
                  </div>
                  {renderStockBadge(product.stock)}
                </div>

                {/* Bottle Image */}
                <div className="relative h-48 w-full bg-black/40 rounded-xl flex items-center justify-center p-3 mb-4 border border-white/5 overflow-hidden">
                  <img
                    src={product.image || '/assets/auction/macallan-25.png'}
                    alt={product.name}
                    onError={(e) => { e.target.src = '/assets/auction/macallan-25.png'; }}
                    className="max-h-full max-w-full object-contain mix-blend-screen transition-transform duration-300 group-hover:scale-105"
                  />
                  {product.featured && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#f5c242] text-black">
                      Featured
                    </span>
                  )}
                </div>

                {/* Wine Details */}
                <div className="mb-4">
                  <h4 className="text-[var(--color-ivory)] font-serif text-lg font-medium line-clamp-1 group-hover:text-[#e1bd70] transition-colors">
                    {product.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-[#c9a35b] font-semibold">{product.subcategory || product.type}</span>
                    <span className="text-stone-500 text-xs">•</span>
                    <span className="text-[11px] text-stone-400">{product.size}</span>
                  </div>
                  <div className="mt-2 text-xl font-sans font-bold text-[#f5c242]">
                    <Price amount={Number(product.price)} />
                  </div>
                </div>

                {/* Barcode Snippet */}
                <div className="bg-[#121212] p-2 rounded-xl border border-white/5 mb-4 font-mono text-[11px] text-stone-300 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <Barcode size={14} className="text-[#c9a35b]" />
                    <span className="truncate">{barcodes.single}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyBarcode(barcodes.single, 'single')}
                    className="text-stone-500 hover:text-[#c9a35b] p-1"
                    title="Copy Barcode"
                  >
                    {copiedBarcode === barcodes.single ? (
                      <Check size={12} className="text-emerald-400" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                </div>

                {/* Card Action Footer */}
                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => navigate(`/product/${product.slug || prodId}`)}
                    className="flex-1 py-2 rounded-lg border border-white/10 text-stone-300 hover:text-[#e1bd70] hover:border-[#e1bd70]/30 hover:bg-white/5 text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5"
                  >
                    <Eye size={13} /> View
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/vendor/product-edit/${prodId}`)}
                    className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold tracking-wider uppercase transition-all border border-white/10 flex items-center justify-center gap-1.5"
                  >
                    <Edit size={13} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(prodId, product.name)}
                    disabled={deletingId === prodId}
                    className="p-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all"
                    title="Delete product"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. PAGINATION BAR                                                         */}
      {/* ========================================================================= */}
      {!loading && filteredAndSortedProducts.length > itemsPerPage && (
        <section className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0a0a0a] border border-white/5 rounded-2xl px-5 py-4">
          <p className="text-xs text-stone-400">
            Showing <strong className="text-white">{(currentPage - 1) * itemsPerPage + 1}</strong> to{' '}
            <strong className="text-white">
              {Math.min(currentPage * itemsPerPage, filteredAndSortedProducts.length)}
            </strong>{' '}
            of <strong className="text-white">{filteredAndSortedProducts.length}</strong> products
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-white/10 text-stone-300 hover:text-[#e1bd70] hover:border-[#c9a35b]/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  currentPage === page
                    ? 'bg-[#c9a35b] text-black shadow-lg shadow-[#c9a35b]/25'
                    : 'border border-white/5 text-stone-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-white/10 text-stone-300 hover:text-[#e1bd70] hover:border-[#c9a35b]/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </section>
      )}

    </div>
  );
}
