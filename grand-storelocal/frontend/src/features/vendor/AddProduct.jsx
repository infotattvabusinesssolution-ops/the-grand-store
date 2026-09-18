import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Building2, Package, UploadCloud, CheckCircle2, AlertCircle, PlusCircle, User } from 'lucide-react';
import { useCategories } from '../../context/CategoryContext';
import api from '../../api';
import DynamicIcon from '../../components/DynamicIcon';
import CatalogHierarchyFields from '../../components/CatalogHierarchyFields';
import ProductImageManager from '../../components/ProductImageManager';
import ProductCostingCard from '../../components/ProductCostingCard';

export default function AddProduct({ onNotify }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { categories } = useCategories();
  const storeCategories = categories.map(c => c.name);
  const isInternalProductManager = ['admin', 'super_admin', 'product_manager'].includes(user?.role);
  
  const [costingData, setCostingData] = useState(null);

  const handleCostingChange = useCallback((costing) => {
    setCostingData(costing);
  }, []);

  const handlePriceChange = useCallback((newPrice) => {
    setFormData(prev => ({ ...prev, price: newPrice }));
  }, []);
  const [formData, setFormData] = useState({
    name: '',
    type: '', // Empty initially for floating label to work well
    country: '',
    subcategory: '',
    brand: '',
    size: '',
    abv: '',
    production: '',
    origin: '',
    description: '',
    price: '',
    stock: '',
    tags: '',
    tastingNotes: '',
    flavorProfile: [],
    foodPairing: [],
    options: 'Pack of 1',
    tradePrice: '',
    minOrderQuantity: '',
    exportReady: false
  });
  
  const [imageEntries, setImageEntries] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [attributes, setAttributes] = useState([]);

  useEffect(() => {
    const fetchAttributes = async () => {
      try {
        const res = await api.get(`/attributes`);
        const data = res.data;
        if (Array.isArray(data)) {
          setAttributes(data);
        }
      } catch (err) {
        console.error('Failed to fetch attributes', err);
      }
    };
    fetchAttributes();
  }, []);

  if (!user || (user.role !== 'vendor_active' && !isInternalProductManager)) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="p-8 border border-red-500/20 bg-red-950/10 text-[var(--color-ivory)] max-w-md w-full flex items-center gap-4">
          <AlertCircle size={32} className="text-red-400 shrink-0" />
          <p className="font-light leading-relaxed">Only approved vendors or admins can add regular products to the store.</p>
        </div>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFoodPairingChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      if (checked) {
        return { ...prev, foodPairing: [...prev.foodPairing, value] };
      } else {
        return { ...prev, foodPairing: prev.foodPairing.filter(item => item !== value) };
      }
    });
  };

  const handleFlavorProfileChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      if (checked) {
        return { ...prev, flavorProfile: [...prev.flavorProfile, value] };
      } else {
        return { ...prev, flavorProfile: prev.flavorProfile.filter(item => item !== value) };
      }
    });
  };

  const handlePdfChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const token = userInfo?.token || user?.token;

      if ((formData.type || '').toLowerCase() === 'wine' && !isInternalProductManager && !pdfFile) {
        throw new Error('Fact Sheet PDF is required for Wine products.');
      }
      if (imageEntries.length === 0) {
        throw new Error('At least one product image is required.');
      }

      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('type', formData.type || 'Whisky');
      payload.append('category', formData.type || 'Whisky');
      payload.append('country', formData.country);
      payload.append('subcategory', formData.subcategory);
      payload.append('brand', formData.brand);
      payload.append('size', formData.size);
      payload.append('identity', JSON.stringify({
        type: formData.type,
        style: formData.subcategory,
        production: formData.production,
        origin: formData.origin || formData.country,
        bottleSize: formData.size,
        abv: formData.abv
      }));
      payload.append('description', formData.description);
      payload.append('price', formData.price);
      if (costingData) {
        payload.append('costing', JSON.stringify(costingData));
      }
      payload.append('stock', formData.stock);
      
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
      payload.append('tags', JSON.stringify(tagsArray));
      
      const notesArray = formData.tastingNotes.split(',').map(t => t.trim()).filter(Boolean);
      payload.append('tastingNotes', JSON.stringify(notesArray));
      
      if (formData.flavorProfile && formData.flavorProfile.length > 0) {
        payload.append('flavorProfile', JSON.stringify(formData.flavorProfile));
      }
      if (formData.foodPairing && formData.foodPairing.length > 0) {
        payload.append('foodPairing', JSON.stringify(formData.foodPairing));
      }
      
      payload.append('options', JSON.stringify([formData.options]));

      if (formData.tradePrice) payload.append('tradePrice', formData.tradePrice);
      if (formData.minOrderQuantity) payload.append('minOrderQuantity', formData.minOrderQuantity);
      payload.append('exportReady', formData.exportReady);

      let uploadIndex = 0;
      const imageOrder = imageEntries.map((entry) => {
        const orderEntry = { kind: 'upload', index: uploadIndex };
        uploadIndex += 1;
        payload.append('images', entry.file);
        return orderEntry;
      });
      payload.append('imageOrder', JSON.stringify(imageOrder));
      if (pdfFile) {
        payload.append('factSheetPdf', pdfFile);
      }

      const res = await api.post(`/products`, payload, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });

      if (onNotify) onNotify('Product added successfully!');
      if (user.role === 'admin') {
        setTimeout(() => navigate('/admin/products'), 2000);
      } else {
        setTimeout(() => navigate('/vendor/products'), 2000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to add product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      <div className="max-w-4xl w-full">
        {/* Welcome Section */}
        <section className="mb-4">
              <h1 className="text-[var(--color-ivory)] font-serif text-5xl mb-4">
                Add <span className="text-6xl text-[#e1bd70] font-normal ml-2 tracking-wide ">Retail Product</span>
              </h1>
              <p className="text-[var(--color-ivory-muted)] text-lg max-w-2xl font-light">
                List a standard product for direct sale in The Grand Store.
              </p>
              
              <div className="mt-6 flex items-center gap-3 p-4 bg-black/40 border border-white/10 rounded-xl inline-flex">
                <Building2 size={20} className="text-[#e1bd70]" />
                <div>
                  <p className="text-xs text-[var(--color-ivory-muted)] uppercase tracking-widest font-bold">Listing Destination</p>
                  <p className="text-sm text-white mt-1">
                    This product will appear publicly in: <strong className="text-[#e1bd70]">{user.name}'s Store</strong>
                  </p>
                </div>
              </div>
            </section>

            {error && (
              <div className="bg-red-950/20 backdrop-blur-md border border-red-500/20 text-red-400 p-4 rounded-xl shadow-lg mb-8">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="w-full mt-12 space-y-16">
              
              {/* General Information */}
              <div className="space-y-10">
                <h2 className="text-[var(--color-ivory)] font-serif text-3xl flex items-center gap-4 border-b border-white/[0.05] pb-4">
                  <Package size={24} className="text-[#e1bd70]" />
                  General Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                  <div className="relative z-0 w-full group">
                    <input 
                      type="text" 
                      name="name" 
                      id="name"
                      value={formData.name} 
                      onChange={handleChange} 
                      className="block py-3 px-0 w-full text-base text-[var(--color-ivory)] bg-transparent border-0 border-b border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[var(--color-gold)] peer" 
                      placeholder=" " 
                      required 
                    />
                    <label 
                      htmlFor="name" 
                      className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-[#e1bd70] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                    >
                      Product Name *
                    </label>
                  </div>
                  
                  <div className="w-full group">
                    <label 
                      htmlFor="type" 
                      className="block text-sm uppercase tracking-widest text-[var(--color-ivory-muted)] font-medium mb-3"
                    >
                      Category / Type *
                    </label>
                    <select 
                      name="type" 
                      id="type"
                      value={formData.type} 
                      onChange={handleChange}
                      required
                      className="block w-full px-4 py-3 text-base text-[var(--color-ivory)] bg-black/20 border border-[var(--color-gold)]/50 rounded-lg appearance-none focus:outline-none focus:border-[var(--color-gold)] focus:bg-black/40 transition-colors"
                    >
                      <option value="" disabled hidden>Select Category</option>
                      {storeCategories.map(cat => (
                        <option key={cat} className="bg-[#1a1a1a]" value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <CatalogHierarchyFields
                  formData={formData}
                  onChange={handleChange}
                  idPrefix="add-product"
                />

                <div className="w-full group mt-8">
                  <label 
                    htmlFor="description" 
                    className="block text-sm uppercase tracking-widest text-[var(--color-ivory-muted)] font-medium mb-3"
                  >
                    Detailed Description *
                  </label>
                  <textarea 
                    name="description" 
                    id="description"
                    value={formData.description} 
                    onChange={handleChange} 
                    rows="4"
                    className="block w-full px-4 py-3 text-base text-[var(--color-ivory)] bg-black/20 border border-[var(--color-gold)]/50 rounded-lg focus:outline-none focus:border-[var(--color-gold)] focus:bg-black/40 transition-colors resize-none" 
                    placeholder="Enter detailed description..." 
                    required 
                  />
                </div>
                
                {/* Section 300-344 Vendor Product Costing & Protected Margin Calculator */}
                <ProductCostingCard
                  initialCosting={null}
                  currentPrice={formData.price}
                  onPriceChange={handlePriceChange}
                  onCostingChange={handleCostingChange}
                  isInternalProductManager={isInternalProductManager}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                  <div className="relative z-0 w-full group">
                    <input 
                      type="number" 
                      name="price" 
                      id="price"
                      value={formData.price} 
                      onChange={handleChange} 
                      min="0"
                      step="any"
                      className="block py-3 px-0 w-full text-base text-[var(--color-ivory)] bg-transparent border-0 border-b border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[var(--color-gold)] peer font-mono" 
                      placeholder=" " 
                      required 
                    />
                    <label 
                      htmlFor="price" 
                      className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-[#e1bd70] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                    >
                      Retail Selling Price (ZAR - 15% VAT Inclusive) *
                    </label>
                    <div className="mt-2 space-y-1">
                      <p className="text-[10px] text-white/40">
                        ⚖️ South African law requires VAT-inclusive customer retail pricing.
                      </p>
                      {parseFloat(formData.price) > 0 && (
                        <div className="text-[11px] font-mono flex items-center justify-between text-white/80 bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/25 px-2.5 py-1 rounded-md">
                          <span className="text-[var(--color-gold)] font-medium">Net Vendor Payout (70%):</span>
                          <span className="text-emerald-400 font-bold font-mono">
                            R{(parseFloat(formData.price) * 0.70).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="relative z-0 w-full group">
                    <input 
                      type="number" 
                      name="stock" 
                      id="stock"
                      value={formData.stock} 
                      onChange={handleChange} 
                      min="0"
                      className="block py-3 px-0 w-full text-base text-[var(--color-ivory)] bg-transparent border-0 border-b border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[var(--color-gold)] peer" 
                      placeholder=" " 
                      required 
                    />
                    <label 
                      htmlFor="stock" 
                      className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-[#e1bd70] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                    >
                      Stock Quantity *
                    </label>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                  <div className="relative z-0 w-full group">
                    <input 
                      type="text" 
                      name="tags" 
                      id="tags"
                      value={formData.tags} 
                      onChange={handleChange} 
                      className="block py-3 px-0 w-full text-base text-[var(--color-ivory)] bg-transparent border-0 border-b border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[var(--color-gold)] peer" 
                      placeholder=" " 
                    />
                    <label 
                      htmlFor="tags" 
                      className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-[#e1bd70] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                    >
                      Tags (Comma separated)
                    </label>
                  </div>
                  
                  <div className="relative z-0 w-full group">
                    <input 
                      type="text" 
                      name="tastingNotes" 
                      id="tastingNotes"
                      value={formData.tastingNotes} 
                      onChange={handleChange} 
                      className="block py-3 px-0 w-full text-base text-[var(--color-ivory)] bg-transparent border-0 border-b border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[var(--color-gold)] peer" 
                      placeholder=" " 
                    />
                    <label 
                      htmlFor="tastingNotes" 
                      className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-[#e1bd70] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                    >
                      Tasting Notes (Comma separated)
                    </label>
                  </div>
                </div>

                {/* Dynamic SEO Filters UI */}
                <div className="grid grid-cols-1 mt-10">
                  <label className="text-xs uppercase tracking-widest text-[#e1bd70] mb-4">Flavor Profile (Whisky Finder)</label>
                  <div className="flex flex-wrap gap-4">
                    {attributes.filter(a => a.type === 'flavor').map((flavor) => (
                      <label key={flavor._id} className="flex items-center gap-2 cursor-pointer border border-white/10 px-4 py-2 rounded-full hover:border-[#e1bd70] transition-colors">
                        <input 
                          type="checkbox" 
                          value={flavor.value} 
                          checked={formData.flavorProfile.includes(flavor.value)} 
                          onChange={handleFlavorProfileChange} 
                          className="w-4 h-4 text-[#d6a03f] bg-transparent border-white/20 rounded focus:ring-0 focus:ring-offset-0 cursor-pointer" 
                        />
                        <span className="text-[var(--color-ivory)] capitalize flex items-center gap-1.5">
                          <DynamicIcon name={flavor.icon} size={14} className="opacity-70" /> {flavor.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 mt-10">
                  <label className="text-xs uppercase tracking-widest text-[#e1bd70] mb-4">Food Pairing (Wine Pairing Tool)</label>
                  <div className="flex flex-wrap gap-4">
                    {attributes.filter(a => a.type === 'pairing').map((food) => (
                      <label key={food._id} className="flex items-center gap-2 cursor-pointer border border-white/10 px-4 py-2 rounded-full hover:border-[#e1bd70] transition-colors">
                        <input 
                          type="checkbox" 
                          value={food.value} 
                          checked={formData.foodPairing.includes(food.value)} 
                          onChange={handleFoodPairingChange} 
                          className="w-4 h-4 text-[#d6a03f] bg-transparent border-white/20 rounded focus:ring-0 focus:ring-offset-0 cursor-pointer" 
                        />
                        <span className="text-[var(--color-ivory)] capitalize flex items-center gap-1.5">
                          <DynamicIcon name={food.icon} size={14} className="opacity-70" /> {food.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Advanced Channels */}
              <div className="space-y-10 pt-6">
                <h2 className="text-[var(--color-ivory)] font-serif text-3xl flex items-center gap-4 border-b border-white/[0.05] pb-4">
                  <Building2 size={24} className="text-[#e1bd70]" />
                  Advanced Channels
                </h2>
                                <div className="border-b border-white/10 pb-6">
                  <h3 className="text-lg font-serif text-[var(--color-ivory)] mb-6">Wholesale & Trade Pricing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                    <div className="relative z-0 w-full group">
                      <input 
                        type="number" 
                        name="tradePrice" 
                        id="tradePrice"
                        value={formData.tradePrice} 
                        onChange={handleChange} 
                        min="0"
                        className="block py-3 px-0 w-full text-base text-[var(--color-ivory)] bg-transparent border-0 border-b border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[var(--color-gold)] peer" 
                        placeholder=" " 
                      />
                      <label 
                        htmlFor="tradePrice" 
                        className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-[#e1bd70] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                      >
                        Trade Price (ZAR)
                      </label>
                    </div>
                    <div className="relative z-0 w-full group">
                      <input 
                        type="number" 
                        name="minOrderQuantity" 
                        id="minOrderQuantity"
                        value={formData.minOrderQuantity} 
                        onChange={handleChange} 
                        min="0"
                        className="block py-3 px-0 w-full text-base text-[var(--color-ivory)] bg-transparent border-0 border-b border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[var(--color-gold)] peer" 
                        placeholder=" " 
                      />
                      <label 
                        htmlFor="minOrderQuantity" 
                        className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-[#e1bd70] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                      >
                        Min. Order Quantity (Wholesale)
                      </label>
                    </div>
                  </div>
                </div>

                <div className="py-6 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-serif text-[var(--color-ivory)] mb-1">International Export</h3>
                    <p className="text-sm text-[var(--color-ivory-muted)] font-light">Make this product available for international purchase enquiries.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="exportReady" checked={formData.exportReady} onChange={handleChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c9a35b]"></div>
                  </label>
                </div>
              </div>
              
              {/* File Uploads */}
              <div className="space-y-10 pt-6">
                <h2 className="text-[var(--color-ivory)] font-serif text-3xl flex items-center gap-4 border-b border-white/[0.05] pb-4">
                  <UploadCloud size={24} className="text-[#e1bd70]" />
                  Media & Documents
                </h2>
                
                <ProductImageManager entries={imageEntries} onChange={setImageEntries} required />

                {formData.type.toLowerCase() === 'wine' && (
                  <div className="border border-[var(--color-gold)]/20 p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-gold)]/40"></div>
                    <label className="block text-[10px] uppercase tracking-widest text-[#e1bd70] mb-2 font-bold">
                      Fact Sheet PDF {isInternalProductManager ? '(Optional for internal catalog)' : '(Required for Wine) *'}
                    </label>
                    <p className="text-sm text-[var(--color-ivory-muted)] mb-6 font-light">Please upload the official vineyard fact sheet or authentication document when available.</p>
                    <input 
                      type="file" 
                      accept="application/pdf"
                      onChange={handlePdfChange}
                      required={!isInternalProductManager}
                      className="w-full text-sm text-[var(--color-ivory-muted)] file:mr-6 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-[10px] file:uppercase file:tracking-widest file:font-bold file:bg-white/10 file:text-[var(--color-ivory)] hover:file:bg-white/20 transition-all cursor-pointer"
                    />
                  </div>
                )}
              </div>

              <div className="pt-8">
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-[#c9a35b] text-black font-bold uppercase tracking-widest text-sm px-10 py-4 rounded-full  transition-all disabled:opacity-50 inline-flex items-center justify-center gap-3"
                >
                  {submitting ? 'Adding Product...' : <><CheckCircle2 size={20} /> Add Product to Store</>}
                </button>
              </div>
            </form>
          </div>
    </div>
  );
}
