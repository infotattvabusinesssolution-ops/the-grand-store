import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Building2, PlusCircle, Package, Clock, CheckCircle2, XCircle, User } from 'lucide-react';
import Price from '../../components/ui/Price';

export default function VendorProducts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || (user.role !== 'vendor_active' && user.role !== 'admin')) {
      navigate('/login');
      return;
    }

    const fetchProducts = async () => {
      try {
        const res = await api.get('/products/vendor/me');
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
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token || user?.token;
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
        <div className="pb-6 border-b border-white/[0.05] flex items-center justify-between">
          <h3 className="text-[var(--color-ivory)] font-serif text-2xl flex items-center gap-4">
            <div className="p-2 rounded-lg bg-[var(--color-gold)]/10 text-[#e1bd70]">
              <Package size={20} />
            </div>
            My Retail Products
          </h3>
          <button onClick={() => navigate('/vendor/product-add')} className="px-6 py-2.5 rounded-full bg-[var(--color-gold)]/10 text-[#e1bd70] border border-[var(--color-gold)]/30 font-semibold uppercase tracking-widest text-xs transition-all hover:bg-[#c9a35b] hover:text-black ">
            + New Product
          </button>
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
              onClick={() => navigate('/vendor/product-add')}
              className="px-8 py-3 rounded-full bg-[#c9a35b] text-black font-bold uppercase tracking-widest text-sm  transition-all"
            >
              Add your first product
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
                {products.map((product) => (
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
                    <td className="py-5 px-5 text-right">
                      <button
                        onClick={() => navigate(`/product/${product.slug || product.id || product._id}`)}
                        className="px-4 py-1.5 rounded-full border border-[var(--color-gold)]/30 text-[#e1bd70] hover:bg-[var(--color-gold)]/10 transition-all text-[10px] uppercase tracking-widest mr-2"
                      >
                        View
                      </button>
                      <button
                        onClick={() => navigate(`/vendor/product-edit/${product.id || product._id}`)}
                        className="px-4 py-1.5 rounded-full border border-white/10 text-white hover:bg-white/10 transition-all text-[10px] uppercase tracking-widest"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id || product._id)}
                        className="px-4 py-1.5 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-[10px] uppercase tracking-widest ml-2"
                      >
                        Delete
                      </button>
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

