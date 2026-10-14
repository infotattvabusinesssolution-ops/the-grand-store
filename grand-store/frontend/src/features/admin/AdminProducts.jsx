import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { 
  Package, Clock, CheckCircle2, XCircle, Eye, Edit, Trash2, Search, X,
  Barcode, Copy, Check, UploadCloud, Image as ImageIcon, Flame
} from 'lucide-react';
import Price from '../../components/ui/Price';
import BarcodeImageModal from '../../components/BarcodeImageModal';

const getProductBarcodes = (product) => {
  let single = product.barcode || product.ean || product.ean13 || product.identity?.barcode || product.identity?.ean;
  if (!single) {
    const idStr = String(product.id || product._id || 'prod_0000');
    let hash = 0;
    for (let i = 0; i < idStr.length; i++) {
      hash = ((hash << 5) - hash) + idStr.charCodeAt(i);
      hash |= 0;
    }
    const positiveHash = Math.abs(hash).toString().padStart(6, '0').slice(-6);
    const base12 = `6009800${positiveHash}`.slice(0, 12);
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(base12[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    single = `${base12}${checkDigit}`;
  }

  let carton = product.cartonBarcode || product.caseBarcode || product.itf14 || product.identity?.cartonBarcode;
  if (!carton) {
    const base12 = single.slice(0, 12);
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
    product.barcode,
    product.identity?.barcode,
    ...(Array.isArray(product.tags) ? product.tags : []),
  ];

  return searchableFields.some((value) =>
    String(value || '').toLowerCase().includes(query)
  );
};

const getProductSearchRank = (product, query) => {
  const name = String(product.name || '').toLowerCase();
  const brand = String(product.brand || '').toLowerCase();
  const type = String(product.type || product.category || '').toLowerCase();
  const productId = String(product.id || product._id || '').toLowerCase();

  if (name === query) return 0;
  if (name.startsWith(query)) return 1;
  if (name.includes(query)) return 2;
  if (brand.startsWith(query)) return 3;
  if (brand.includes(query)) return 4;
  if (type.startsWith(query)) return 5;
  if (type.includes(query)) return 6;
  if (productId.startsWith(query)) return 7;
  return 8;
};

export default function AdminProducts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedBarcode, setCopiedBarcode] = useState(null);
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState(null);

  const categories = useMemo(
    () => ['All', ...new Set(products.map((product) => product.type || 'Other'))],
    [products]
  );

  const categoryProducts = useMemo(
    () => selectedCategory === 'All'
      ? products
      : products.filter((product) => (product.type || 'Other') === selectedCategory),
    [products, selectedCategory]
  );

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredProducts = useMemo(() => {
    if (!normalizedSearchTerm) return categoryProducts;

    return categoryProducts
      .filter((product) => matchesProductSearch(product, normalizedSearchTerm))
      .sort((first, second) => {
        const rankDifference = getProductSearchRank(first, normalizedSearchTerm)
          - getProductSearchRank(second, normalizedSearchTerm);
        return rankDifference || String(first.name || '').localeCompare(String(second.name || ''));
      });
  }, [categoryProducts, normalizedSearchTerm]);

  useEffect(() => {
    if (!user || !['admin', 'super_admin', 'product_manager'].includes(user.role)) {
      navigate('/login');
      return;
    }

    const fetchProducts = async () => {
      try {
        const res = await api.get(`/products/vendor/me`);
        setProducts(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load your retail products.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [user, navigate]);

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter(p => p._id !== id && p.id !== id));
    } catch (err) {
      console.error('Failed to delete product', err);
      alert('Failed to delete product');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending_approval':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20"><Clock size={12} /> Pending Review</span>;
      case 'upcoming':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20"><Package size={12} /> Upcoming</span>;
      case 'live':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20"><CheckCircle2 size={12} /> Live Auction</span>;
      case 'closed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 border border-red-500/20"><XCircle size={12} /> Closed</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-500/10 text-gray-400 border border-gray-500/20">{status}</span>;
    }
  };

  const handleProductBarcodeUpdated = (updated) => {
    setProducts((prev) => prev.map((p) => ((p.id === updated.id || p._id === updated._id) ? { ...p, ...updated } : p)));
    setSelectedBarcodeProduct(updated);
  };

  const handleCopyBarcode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedBarcode(code);
    setTimeout(() => setCopiedBarcode(null), 2000);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      {/* Welcome Section */}
      <section className="mb-2">
        <h1 className="text-[var(--color-ivory)] font-serif text-4xl mb-4">
          Retail <span className="text-5xl text-[#e1bd70] font-normal ml-2 tracking-wide ">Products</span>
        </h1>
        <p className="text-[var(--color-ivory-muted)] text-lg font-light">
          Manage your retail products, update stock and prices, verify GS1 barcodes, and upload Cloudinary barcode images.
        </p>
      </section>

      {error && (
        <div className="bg-red-950/20 backdrop-blur-md border border-red-500/20 text-red-400 p-4 rounded-xl shadow-lg">
          {error}
        </div>
      )}

      {/* Data Table Section */}
      <section className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 md:p-8 shadow-2xl">
        <div className="pb-6 border-b border-white/[0.05] flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <h3 className="text-[var(--color-ivory)] font-serif text-2xl flex items-center gap-4">
            <div className="p-2 rounded-lg bg-[var(--color-gold)]/10 text-[#e1bd70]">
              <Package size={20} />
            </div>
            My Retail Products
            <span className="bg-[#1a1917] text-[#918a7f] text-sm font-sans px-3 py-1 rounded-full border border-white/5">
              {filteredProducts.length} Total
            </span>
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full xl:w-auto">
            <button
              onClick={() => navigate('/admin/mosi-pricing')}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-xs font-bold uppercase tracking-wider transition-all shrink-0"
              title="Manage Mosi Oa Tunya Dynamic Pricing"
            >
              <Flame size={14} className="text-amber-400" />
              <span>Mosi Pricing Engine</span>
            </button>
            <div className="relative w-full sm:w-80">
              <div className="flex items-center gap-3 bg-[#1a1917] border border-white/10 rounded-lg px-3 transition-colors focus-within:border-[#c9a35b]/70 focus-within:ring-2 focus-within:ring-[#c9a35b]/10">
                <Search size={17} className="text-[#918a7f] shrink-0" aria-hidden="true" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search products or barcode..."
                  aria-label="Search products"
                  autoComplete="off"
                  className="w-full bg-transparent py-2.5 text-sm text-[#eee8dd] placeholder:text-white/30 outline-none [&::-webkit-search-cancel-button]:hidden"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="text-[#918a7f] hover:text-white transition-colors"
                    aria-label="Clear product search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              aria-label="Filter products by category"
              className="bg-[#1a1917] border border-white/10 text-[#eee8dd] text-sm rounded-lg focus:ring-[#c9a35b] focus:border-[#c9a35b] block p-2.5 transition-colors sm:max-w-48"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button onClick={() => navigate('/admin/product-add')} className="px-6 py-2.5 rounded-full bg-[var(--color-gold)]/10 text-[#e1bd70] border border-[var(--color-gold)]/30 font-semibold uppercase tracking-widest text-xs transition-all hover:bg-[#c9a35b] hover:text-black ">
              + New Product
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="py-24 text-center text-[var(--color-ivory-muted)] font-light tracking-wide">Loading your products...</div>
        ) : products.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6 shadow-inner">
              <Package size={32} className="text-[var(--color-ivory-muted)] opacity-50" />
            </div>
            <h3 className="text-[var(--color-ivory)] font-serif text-3xl mb-3">No Products Found</h3>
            <p className="text-[var(--color-ivory-muted)] mb-10 max-w-md mx-auto font-light">You haven't added any retail products yet. Start by adding your first item to our store.</p>
            <button
              onClick={() => navigate('/admin/product-add')}
              className="px-8 py-3 rounded-full bg-[#c9a35b] text-black font-bold uppercase tracking-widest text-sm  transition-all"
            >
              Add your first product
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center">
            <Search size={30} className="mb-4 text-white/20" />
            <h3 className="text-[var(--color-ivory)] font-serif text-2xl mb-2">No matching products</h3>
            <p className="text-[var(--color-ivory-muted)] mb-6 text-sm">
              Try another search term or category.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
              }}
              className="px-5 py-2 rounded-full border border-[var(--color-gold)]/30 text-[#e1bd70] text-xs font-semibold uppercase tracking-widest hover:bg-[var(--color-gold)]/10 transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto mt-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-4 md:p-5 text-xs font-bold text-[var(--color-ivory-muted)] uppercase tracking-widest">Product Details</th>
                  <th className="p-4 md:p-5 text-xs font-bold text-[var(--color-ivory-muted)] uppercase tracking-widest">Price</th>
                  <th className="p-4 md:p-5 text-xs font-bold text-[var(--color-ivory-muted)] uppercase tracking-widest">Stock</th>
                  <th className="p-4 md:p-5 text-xs font-bold text-[var(--color-ivory-muted)] uppercase tracking-widest">GS Barcodes & Image</th>
                  <th className="p-4 md:p-5 text-xs font-bold text-[var(--color-ivory-muted)] uppercase tracking-widest">Status</th>
                  <th className="p-4 md:p-5 text-xs font-bold text-[var(--color-ivory-muted)] uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map((product) => {
                  const barcodes = getProductBarcodes(product);
                  const barcodeImage = product.barcodeImage || product.identity?.barcodeImage;
                  return (
                    <tr key={product._id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="py-5 px-5">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-black/40 rounded-xl flex items-center justify-center p-2 border border-white/[0.05] shadow-inner group-hover:border-white/10 transition-colors shrink-0">
                            <img src={product.image || '/assets/auction/macallan-25.png'} alt={product.name} className="max-w-full max-h-full object-contain mix-blend-screen" />
                          </div>
                          <div>
                            <p className="text-[var(--color-ivory)] font-medium font-serif text-lg tracking-wide">{product.name}</p>
                            <p className="text-[10px] text-[var(--color-ivory-muted)] tracking-widest uppercase mt-1">{product.brand ? `${product.brand} • ` : ''}{product.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-5 text-[var(--color-ivory)] font-sans font-medium tracking-wide whitespace-nowrap"><Price amount={Number(product.price)} /></td>
                      <td className="py-5 px-5 text-[#e1bd70] font-sans font-semibold tracking-wide whitespace-nowrap">{product.stock} units</td>
                      
                      {/* GS Barcodes & Cloudinary Barcode Image */}
                      <td className="py-5 px-5">
                        <div className="flex flex-col gap-1.5 min-w-[220px]">
                          {/* Single EAN-13 */}
                          <div className="flex items-center justify-between gap-2 bg-[#121212] px-2.5 py-1 rounded-lg border border-white/5 hover:border-[#c9a35b]/30 transition-colors">
                            <div className="flex items-center gap-1.5 truncate">
                              <Barcode size={13} className="text-[#c9a35b] shrink-0" />
                              <span className="text-[9.5px] text-stone-400 uppercase font-sans font-bold">Single</span>
                              <span className="text-stone-200 tracking-wider text-[11px] font-mono truncate">{barcodes.single}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyBarcode(barcodes.single)}
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

                          {/* Barcode Image & Cloudinary Upload Button */}
                          <div className="flex items-center gap-2">
                            {barcodeImage ? (
                              <button
                                type="button"
                                onClick={() => setSelectedBarcodeProduct(product)}
                                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold hover:bg-emerald-500/20 transition-all"
                                title="View Cloudinary Barcode Image"
                              >
                                <ImageIcon size={11} />
                                Barcode Image
                              </button>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => setSelectedBarcodeProduct(product)}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#c9a35b]/10 border border-[#c9a35b]/20 text-[#e1bd70] text-[10px] font-semibold hover:bg-[#c9a35b] hover:text-black transition-all"
                              title="Upload Barcode Image to Cloudinary"
                            >
                              <UploadCloud size={11} />
                              {barcodeImage ? 'Update' : 'Upload Cloudinary'}
                            </button>
                          </div>
                        </div>
                      </td>

                      <td className="py-5 px-5">{getStatusBadge(product.approvalStatus)}</td>
                      <td className="py-5 px-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedBarcodeProduct(product)}
                            className="p-2 rounded-full text-[#c9a35b] hover:bg-[#c9a35b]/10 transition-all"
                            title="Barcode & Cloudinary Image"
                          >
                            <Barcode size={18} strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={() => navigate(`/product/${product.slug || product.id || product._id}`)}
                            className="p-2 rounded-full text-[#e1bd70] hover:bg-[#e1bd70]/10 hover:text-[#f4d699] transition-all"
                            title="View Product"
                          >
                            <Eye size={18} strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/product-edit/${product.id || product._id}`)}
                            className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
                            title="Edit Product"
                          >
                            <Edit size={18} strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(product.id || product._id)}
                            className="p-2 rounded-full text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            title="Delete Product"
                          >
                            <Trash2 size={18} strokeWidth={1.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Cloudinary Barcode Image Modal */}
      <BarcodeImageModal
        product={selectedBarcodeProduct}
        isOpen={!!selectedBarcodeProduct}
        onClose={() => setSelectedBarcodeProduct(null)}
        onUpdated={handleProductBarcodeUpdated}
      />
    </div>
  );
}
