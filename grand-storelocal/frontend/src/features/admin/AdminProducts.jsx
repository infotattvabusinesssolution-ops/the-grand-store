import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Package, Clock, CheckCircle2, XCircle, Eye, Edit, Trash2, Search, X } from 'lucide-react';
import Price from '../../components/ui/Price';

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

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      {/* Welcome Section */}
      <section className="mb-2">
        <h1 className="text-[var(--color-ivory)] font-serif text-4xl mb-4">
          Retail <span className="text-5xl text-[#e1bd70] font-normal ml-2 tracking-wide ">Products</span>
        </h1>
        <p className="text-[var(--color-ivory-muted)] text-lg font-light">
          Manage your retail products, update stock and prices, and add new items to your store.
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
            <div className="relative w-full sm:w-80">
              <div className="flex items-center gap-3 bg-[#1a1917] border border-white/10 rounded-lg px-3 transition-colors focus-within:border-[#c9a35b]/70 focus-within:ring-2 focus-within:ring-[#c9a35b]/10">
                <Search size={17} className="text-[#918a7f] shrink-0" aria-hidden="true" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search products..."
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
                  <th className="p-4 md:p-5 text-xs font-bold text-[var(--color-ivory-muted)] uppercase tracking-widest">Status</th>
                  <th className="p-4 md:p-5 text-xs font-bold text-[var(--color-ivory-muted)] uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-5 px-5">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-black/40 rounded-xl flex items-center justify-center p-2 border border-white/[0.05] shadow-inner group-hover:border-white/10 transition-colors">
                          <img src={product.image || '/assets/auction/macallan-25.png'} alt={product.name} className="max-w-full max-h-full object-contain mix-blend-screen" />
                        </div>
                        <div>
                          <p className="text-[var(--color-ivory)] font-medium font-serif text-lg tracking-wide">{product.name}</p>
                          <p className="text-[10px] text-[var(--color-ivory-muted)] tracking-widest uppercase mt-1">{product.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-5 text-[var(--color-ivory)] font-sans font-medium tracking-wide"><Price amount={Number(product.price)} /></td>
                    <td className="py-5 px-5 text-[#e1bd70] font-sans font-semibold tracking-wide">{product.stock} units</td>
                    <td className="py-5 px-5">{getStatusBadge(product.approvalStatus)}</td>
                    <td className="py-5 px-5">
                      <div className="flex items-center justify-end gap-3">
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
