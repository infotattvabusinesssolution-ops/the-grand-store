import React, { useState, useEffect } from 'react';
import { Search, X, Check, Filter, Sparkles, AlertCircle, ShoppingBag } from 'lucide-react';
import { crmApi } from '../../services/crmApi';

export default function ProductSelectorModal({
  isOpen,
  onClose,
  selectedProducts = [],
  onSelectProducts,
  maxSelectable = 6
}) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [tempSelected, setTempSelected] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setTempSelected([...selectedProducts]);
      fetchAdminProducts();
    }
  }, [isOpen]);

  const fetchAdminProducts = async () => {
    try {
      setLoading(true);
      const res = await crmApi.getMarketingProducts({
        search: searchTerm,
        category: selectedCategory !== 'all' ? selectedCategory : undefined
      });
      if (res.data && res.data.success) {
        setProducts(res.data.products || []);
        if (res.data.categories && res.data.categories.length > 0) {
          setCategories(res.data.categories);
        }
      }
    } catch (err) {
      console.error('Error fetching admin marketing products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const delay = setTimeout(() => {
        fetchAdminProducts();
      }, 300);
      return () => clearTimeout(delay);
    }
  }, [searchTerm, selectedCategory]);

  if (!isOpen) return null;

  const isSelected = (id) => tempSelected.some(p => p.id === id || p.productId === id);

  const toggleProduct = (prod) => {
    const existingIndex = tempSelected.findIndex(p => p.id === prod.id || p.productId === prod.id);
    if (existingIndex > -1) {
      setTempSelected(tempSelected.filter((_, idx) => idx !== existingIndex));
    } else {
      if (tempSelected.length >= maxSelectable) {
        return;
      }
      setTempSelected([...tempSelected, {
        id: prod.id,
        productId: prod.id,
        productRef: prod._id,
        name: prod.name,
        price: prod.price,
        image: prod.image,
        category: prod.category,
        slug: prod.slug
      }]);
    }
  };

  const handleConfirm = () => {
    onSelectProducts(tempSelected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-slate-900 text-base">Select Admin Bottles to Market</h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Admin Products Only (343 Available)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose up to {maxSelectable} direct luxury bottles to feature in your campaign copy, email cards, and customer vouchers.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by bottle name, brand, or vintage..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={14} className="text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Categories ({products.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Tray */}
        {tempSelected.length > 0 && (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Selected Bottles ({tempSelected.length}/{maxSelectable}):
              </span>
              <button
                onClick={() => setTempSelected([])}
                className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer"
              >
                Clear all
              </button>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {tempSelected.map((prod) => (
                <div
                  key={prod.id || prod.productId}
                  className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shrink-0 text-xs shadow-2xs group"
                >
                  {prod.image && (
                    <img src={prod.image} alt={prod.name} className="w-5 h-6 object-contain rounded" />
                  )}
                  <div className="max-w-[140px] truncate font-medium text-slate-800">
                    {prod.name}
                  </div>
                  <span className="font-bold text-emerald-700 text-[11px]">
                    R {Number(prod.price || 0).toLocaleString()}
                  </span>
                  <button
                    onClick={() => toggleProduct(prod)}
                    className="text-slate-400 hover:text-rose-600 cursor-pointer ml-1"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto pr-1 min-h-[320px]">
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
              Loading Grand Store Admin Products...
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              No matching Admin bottles found. Try adjusting your search query.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {products.map((prod) => {
                const selected = isSelected(prod.id);
                return (
                  <div
                    key={prod.id}
                    onClick={() => toggleProduct(prod)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex gap-3 items-center ${
                      selected
                        ? 'border-blue-500 bg-blue-50/40 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="w-12 h-14 bg-slate-100 rounded-lg flex items-center justify-center p-1 shrink-0">
                      {prod.image ? (
                        <img src={prod.image} alt={prod.name} className="max-h-full max-w-full object-contain" />
                      ) : (
                        <ShoppingBag size={20} className="text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate leading-tight" title={prod.name}>
                        {prod.name}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{prod.category}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-extrabold text-xs text-slate-900">
                          R {Number(prod.price).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400">Stock: {prod.stock}</span>
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 ${
                      selected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                    }`}>
                      {selected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            {tempSelected.length} of {maxSelectable} bottles chosen
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
            >
              Confirm Selection ({tempSelected.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
