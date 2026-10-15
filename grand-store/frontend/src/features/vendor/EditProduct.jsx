import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Building2, Package, UploadCloud, CheckCircle2, AlertCircle, PlusCircle, User, Coins, Gift, Truck, Layers, X } from 'lucide-react';
import { useCategories } from '../../context/CategoryContext';
import DynamicIcon from '../../components/DynamicIcon';
import CatalogHierarchyFields from '../../components/CatalogHierarchyFields';
import ProductImageManager, { existingImageEntries } from '../../components/ProductImageManager';
import ProductCostingCard from '../../components/ProductCostingCard';
import BarcodeSection from '../../components/BarcodeSection';

export default function EditProduct({ onNotify }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isInternalProductManager = ['admin', 'super_admin', 'product_manager'].includes(user?.role);
  const { id } = useParams();
  const { categories } = useCategories();
  const storeCategories = categories.map(c => c.name);
  
  const [costingData, setCostingData] = useState(null);

  const handleCostingChange = useCallback((costing) => {
    setCostingData(costing);
  }, []);

  const handlePriceChange = useCallback((newPrice) => {
    setFormData(prev => ({ ...prev, price: newPrice }));
  }, []);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
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
    exportReady: false,
    bottlesPerCase: '6',
    casesPerPallet: '56',
    hsCode: '2204.21',
    palletsPer20ft: '10',
    palletsPer40ft: '20',
    leadTimeDays: '14',
    isSuperCoinEligible: true,
    maxSuperCoinDiscountPct: 10,
    isReferralEligible: true,
    referralDiscountPct: 5,
    weight_kg: '1.85',
    length_cm: '12',
    width_cm: '12',
    height_cm: '34',
    box_type: 'Standard Luxury Bottle Box',
    is_fragile: true,
    aramexServiceType: 'ONP',
    barcode: '',
    cartonBarcode: '',
    barcodeImage: '',
    volumeTiers: []
  });

  const handleAddTier = () => {
    setFormData(prev => ({
      ...prev,
      volumeTiers: [
        ...(prev.volumeTiers || []),
        { minCases: '', maxCases: '', pricePerCase: '', notes: '' }
      ]
    }));
  };

  const handleRemoveTier = (index) => {
    setFormData(prev => ({
      ...prev,
      volumeTiers: (prev.volumeTiers || []).filter((_, i) => i !== index)
    }));
  };

  const handleTierChange = (index, field, value) => {
    setFormData(prev => {
      const nextTiers = [...(prev.volumeTiers || [])];
      nextTiers[index] = { ...nextTiers[index], [field]: value };
      return { ...prev, volumeTiers: nextTiers };
    });
  };

  const handleLoadPresetTiers = () => {
    const casePrice = Number(formData.tradePrice) || (Number(formData.price) ? Number(formData.price) * (Number(formData.bottlesPerCase) || 6) * 0.75 : 1200);
    setFormData(prev => ({
      ...prev,
      volumeTiers: [
        { minCases: '10', maxCases: '49', pricePerCase: Math.round(casePrice).toString(), notes: '10-49 Cases Standard Wholesale' },
        { minCases: '50', maxCases: '99', pricePerCase: Math.round(casePrice * 0.92).toString(), notes: 'Pallet Allocation (8% Volume Rebate)' },
        { minCases: '100', maxCases: '', pricePerCase: Math.round(casePrice * 0.85).toString(), notes: 'Direct Export FOB / Container Load (15% Bulk Rebate)' }
      ]
    }));
  };
  
  const [imageEntries, setImageEntries] = useState([]);
  const [barcodeFile, setBarcodeFile] = useState(null);
  const [barcodePreview, setBarcodePreview] = useState('');
  const [pdfFile, setPdfFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (!user || (user.role !== 'vendor_active' && !isInternalProductManager)) {
      return;
    }
    const fetchProduct = async () => {
      try {
        const res = await api.get(`/products/${id}`);
        const product = res.data;
        if (product) {
          setFormData({
            name: product.name || '',
            type: product.category || product.type || '',
            country: product.country || '',
            subcategory: product.subcategory || '',
            brand: product.brand || '',
            size: product.size || product.identity?.bottleSize || '',
            abv: product.identity?.abv || '',
            production: product.identity?.production || '',
            origin: product.identity?.origin || product.country || '',
            description: product.description || '',
            price: product.price || '',
            options: product.options ? product.options.join(', ') : '',
            tags: product.tags ? product.tags.join(', ') : '',
            tastingNotes: product.tastingNotes ? product.tastingNotes.join(', ') : '',
            flavorProfile: product.flavorProfile || [],
            foodPairing: product.foodPairing || [],
            stock: product.stock !== undefined ? product.stock.toString() : '0',
            tradePrice: product.tradePrice || product.channelSettings?.trade?.volumePricingTiers?.[0]?.pricePerBottle || '',
            minOrderQuantity: product.minOrderQuantity || product.channelSettings?.trade?.minimumOrderQuantityBottles || '',
            exportReady: product.channelSettings?.trade?.enabled || product.exportReady || false,
            bottlesPerCase: (product.channelSettings?.trade?.bottlesPerCase || 6).toString(),
            casesPerPallet: (product.channelSettings?.trade?.casesPerPallet || 56).toString(),
            hsCode: product.channelSettings?.trade?.hsCode || '2204.21',
            palletsPer20ft: (product.channelSettings?.trade?.palletsPer20ftContainer || 10).toString(),
            palletsPer40ft: (product.channelSettings?.trade?.palletsPer40ftContainer || 20).toString(),
            leadTimeDays: (product.channelSettings?.trade?.leadTimeDays || 14).toString(),
            volumeTiers: (product.channelSettings?.trade?.volumeTiers && Array.isArray(product.channelSettings.trade.volumeTiers) && product.channelSettings.trade.volumeTiers.length > 0)
              ? product.channelSettings.trade.volumeTiers.map(vt => ({
                  minCases: vt.minCases !== undefined && vt.minCases !== null ? vt.minCases.toString() : '',
                  maxCases: vt.maxCases !== undefined && vt.maxCases !== null ? vt.maxCases.toString() : '',
                  pricePerCase: vt.pricePerCase !== undefined && vt.pricePerCase !== null ? vt.pricePerCase.toString() : '',
                  notes: vt.notes || ''
                }))
              : [],
            isSuperCoinEligible: product.isSuperCoinEligible !== undefined ? product.isSuperCoinEligible : true,
            maxSuperCoinDiscountPct: product.maxSuperCoinDiscountPct !== undefined ? product.maxSuperCoinDiscountPct : 10,
            isReferralEligible: product.isReferralEligible !== undefined ? product.isReferralEligible : true,
            referralDiscountPct: product.referralDiscountPct !== undefined ? product.referralDiscountPct : 5,
            weight_kg: (product.shipping?.weight_kg || product.weight_kg || '1.85').toString(),
            length_cm: (product.shipping?.length_cm || product.length_cm || '12').toString(),
            width_cm: (product.shipping?.width_cm || product.width_cm || '12').toString(),
            height_cm: (product.shipping?.height_cm || product.height_cm || '34').toString(),
            box_type: product.shipping?.box_type || product.box_type || 'Standard Luxury Bottle Box',
            is_fragile: product.shipping?.is_fragile !== undefined ? product.shipping.is_fragile : true,
            aramexServiceType: product.shipping?.aramexServiceType || 'ONP',
            barcode: product.barcode || product.identity?.barcode || '',
            cartonBarcode: product.cartonBarcode || product.identity?.cartonBarcode || '',
            barcodeImage: product.barcodeImage || product.identity?.barcodeImage || ''
          });
          const existingBarcode = product.barcodeImage || product.identity?.barcodeImage;
          if (existingBarcode) {
            setBarcodePreview(existingBarcode);
          }
          if (product.costing) {
            setCostingData(product.costing);
          }
          setImageEntries(existingImageEntries(product.image, product.gallery));
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch product details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [user, id, isInternalProductManager]);

  if (!user || (user.role !== 'vendor_active' && !isInternalProductManager)) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="p-8 border border-red-500/20 bg-red-950/10 text-[var(--color-ivory)] max-w-md w-full flex items-center gap-4">
          <AlertCircle size={32} className="text-red-400 shrink-0" />
          <p className="font-light leading-relaxed">Only approved vendors can edit regular products in the store.</p>
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
        abv: formData.abv,
        barcode: formData.barcode,
        cartonBarcode: formData.cartonBarcode,
        barcodeImage: barcodeFile ? undefined : formData.barcodeImage
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

      const validVolumeTiers = (formData.volumeTiers || [])
        .filter(t => (t.minCases !== '' && t.minCases !== undefined) && t.pricePerCase)
        .map(t => ({
          minCases: Number(t.minCases) || 0,
          maxCases: t.maxCases !== '' && t.maxCases !== null && t.maxCases !== undefined ? Number(t.maxCases) : null,
          pricePerCase: Number(t.pricePerCase) || 0,
          notes: t.notes || ''
        }));

      const channelSettings = {
        retail: {
          enabled: true,
          minOrderQuantity: 1,
          maxOrderQuantity: 120
        },
        trade: {
          enabled: Boolean(formData.exportReady || formData.tradePrice || validVolumeTiers.length > 0),
          minimumOrderQuantityBottles: Number(formData.minOrderQuantity) || (validVolumeTiers[0]?.minCases ? validVolumeTiers[0].minCases * (Number(formData.bottlesPerCase) || 6) : 60),
          bottlesPerCase: Number(formData.bottlesPerCase) || 6,
          casesPerPallet: Number(formData.casesPerPallet) || 56,
          palletsPer20ftContainer: Number(formData.palletsPer20ft) || 10,
          palletsPer40ftContainer: Number(formData.palletsPer40ft) || 20,
          leadTimeDays: Number(formData.leadTimeDays) || 14,
          hsCode: formData.hsCode || '2204.21',
          volumeTiers: validVolumeTiers,
          volumePricingTiers: validVolumeTiers.length > 0
            ? validVolumeTiers.map(vt => ({
                minQuantity: vt.minCases * (Number(formData.bottlesPerCase) || 6),
                pricePerBottle: Math.round(vt.pricePerCase / (Number(formData.bottlesPerCase) || 6)),
                currency: 'ZAR'
              }))
            : (formData.tradePrice ? [
                { minQuantity: Number(formData.minOrderQuantity) || 60, pricePerBottle: Number(formData.tradePrice), currency: 'ZAR' }
              ] : [])
        }
      };
      payload.append('channelSettings', JSON.stringify(channelSettings));
      payload.append('isSuperCoinEligible', formData.isSuperCoinEligible);
      payload.append('maxSuperCoinDiscountPct', formData.maxSuperCoinDiscountPct);
      payload.append('isReferralEligible', formData.isReferralEligible);
      payload.append('referralDiscountPct', formData.referralDiscountPct);

      payload.append('shipping', JSON.stringify({
        weight_kg: Number(formData.weight_kg) || 1.85,
        length_cm: Number(formData.length_cm) || 12,
        width_cm: Number(formData.width_cm) || 12,
        height_cm: Number(formData.height_cm) || 34,
        box_type: formData.box_type || 'Standard Luxury Bottle Box',
        is_fragile: formData.is_fragile,
        aramexServiceType: formData.aramexServiceType || 'ONP'
      }));
      payload.append('weight_kg', formData.weight_kg);
      payload.append('length_cm', formData.length_cm);
      payload.append('width_cm', formData.width_cm);
      payload.append('height_cm', formData.height_cm);
      payload.append('box_type', formData.box_type);

      let uploadIndex = 0;
      const imageOrder = imageEntries.map((entry) => {
        if (entry.kind === 'existing') return { kind: 'existing', url: entry.url };
        const orderEntry = { kind: 'upload', index: uploadIndex };
        uploadIndex += 1;
        payload.append('images', entry.file);
        return orderEntry;
      });
      payload.append('imageOrder', JSON.stringify(imageOrder));
      if (pdfFile) {
        payload.append('factSheetPdf', pdfFile);
      }
      if (formData.barcode) {
        payload.append('barcode', formData.barcode);
      }
      if (formData.cartonBarcode) {
        payload.append('cartonBarcode', formData.cartonBarcode);
      }
      if (barcodeFile) {
        payload.append('barcodeImage', barcodeFile);
      } else if (formData.barcodeImage) {
        payload.append('barcodeImage', formData.barcodeImage);
      }

      await api.put(`/products/${id}`, payload, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess(true);
      if (onNotify) onNotify('Product updated successfully!');
      if (['admin', 'super_admin', 'product_manager'].includes(user.role)) {
        setTimeout(() => navigate('/admin/products'), 2000);
      } else {
        setTimeout(() => navigate('/vendor/products'), 2000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to update product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto">
      <div className="max-w-4xl w-full">
        <section className="mb-4">
              <h1 className="text-[var(--color-ivory)] font-serif text-5xl mb-4">
                Edit <span className="text-5xl md:text-7xl text-[#e1bd70] font-normal ml-2 tracking-wide ">Retail Product</span>
              </h1>
              <p className="text-[var(--color-ivory-muted)] text-lg max-w-2xl font-light leading-relaxed">
                Update the details of your retail product. The image and fact sheet will remain unchanged unless you upload new ones.
              </p>
            </section>

            {success && (
              <div className="bg-green-900/20 backdrop-blur-md border border-green-500/20 text-green-400 p-6 rounded-2xl shadow-lg flex items-center gap-4 mb-8">
                <CheckCircle2 size={24} className="text-green-500" />
                <div className="text-lg font-medium">Product updated successfully!</div>
              </div>
            )}

            {error && !success && (
              <div className="bg-red-950/20 backdrop-blur-md border border-red-500/20 text-red-400 p-4 rounded-xl shadow-lg mb-8">
                {error}
              </div>
            )}

            {!loading && (
            <form onSubmit={handleSubmit} className="w-full mt-12 space-y-16">
              
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
                    <label className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-[#e1bd70] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Product Name *</label>
                  </div>
                  
                  <div className="w-full group">
                    <label className="block text-sm uppercase tracking-widest text-[var(--color-ivory-muted)] font-medium mb-3">Category / Type *</label>
                    <select 
                      name="type" 
                      id="type"
                      value={formData.type} 
                      onChange={handleChange}
                      required
                      className="block w-full px-4 py-3 text-base text-[var(--color-ivory)] bg-black/20 border border-[var(--color-gold)]/50 rounded-lg appearance-none focus:outline-none focus:border-[var(--color-gold)] focus:bg-black/40 transition-colors"
                    >
                      {storeCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <CatalogHierarchyFields
                  formData={formData}
                  onChange={handleChange}
                  idPrefix="edit-product"
                />

                <div className="w-full group mt-8">
                  <label className="block text-sm uppercase tracking-widest text-[var(--color-ivory-muted)] font-medium mb-3">Detailed Description *</label>
                  <textarea 
                    name="description" 
                    id="description"
                    value={formData.description} 
                    onChange={handleChange} 
                    rows="4"
                    className="block w-full px-4 py-3 text-base text-[var(--color-ivory)] bg-black/20 border border-[var(--color-gold)]/50 rounded-lg focus:outline-none focus:border-[var(--color-gold)] focus:bg-black/40 transition-colors resize-none" 
                    required 
                  />
                </div>
                
                {/* Section 300-344 Vendor Product Costing & Protected Margin Calculator */}
                <ProductCostingCard
                  initialCosting={costingData}
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
                    <label className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-[#e1bd70] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">
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
                    <label className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-[#e1bd70] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Stock Quantity *</label>
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
                    <label className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-[#e1bd70] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Tags (Comma separated)</label>
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
                    <label className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-[#e1bd70] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6">Tasting Notes (Comma separated)</label>
                  </div>
                </div>

                {/* SuperCoins & Refer and Earn Discount Settings */}
                <div className="bg-black/40 border border-white/10 rounded-2xl p-6 space-y-6 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-2">
                    <div>
                      <h3 className="text-white font-serif text-xl flex items-center gap-2">
                        <Coins className="text-[var(--color-gold)]" size={22} />
                        SuperCoins & Refer & Earn Discount Eligibility
                      </h3>
                      <p className="text-xs text-white/50 mt-1 font-light">
                        Configure customer loyalty rewards, SuperCoins redemption limits, and referral discount eligibility for this retail bottle.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* SuperCoins Card */}
                    <div className={`p-5 rounded-xl border transition-all ${formData.isSuperCoinEligible ? 'bg-[var(--color-gold)]/[0.03] border-[var(--color-gold)]/30' : 'bg-white/[0.02] border-white/10 opacity-70'}`}>
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 flex items-center justify-center text-[var(--color-gold)]">
                            <Coins size={17} />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-white">SuperCoins Program</h4>
                            <span className="text-[11px] text-white/50 block">Earn on purchase & redeem at checkout</span>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox"
                            name="isSuperCoinEligible"
                            checked={formData.isSuperCoinEligible}
                            onChange={(e) => setFormData(prev => ({ ...prev, isSuperCoinEligible: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-gold)]"></div>
                        </label>
                      </div>

                      {formData.isSuperCoinEligible ? (
                        <div className="space-y-3 pt-3 border-t border-white/10">
                          <div>
                            <label className="block text-xs uppercase tracking-wider text-white/70 mb-1 font-mono">
                              Max SuperCoin Discount Cap (%) *
                            </label>
                            <div className="relative">
                              <input 
                                type="number" 
                                name="maxSuperCoinDiscountPct" 
                                value={formData.maxSuperCoinDiscountPct} 
                                onChange={handleChange} 
                                min="0" 
                                max="100" 
                                step="1" 
                                className="w-full bg-black/50 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:border-[var(--color-gold)] focus:outline-none pr-8 font-mono" 
                                placeholder="10" 
                              />
                              <span className="absolute right-3 top-2.5 text-xs text-white/40 font-mono">%</span>
                            </div>
                          </div>

                          <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-[11px] text-white/60 space-y-1">
                            <div className="flex justify-between">
                              <span>Max discount at current price:</span>
                              <span className="text-[var(--color-gold)] font-mono font-medium">
                                R{((parseFloat(formData.price || 0) * (parseFloat(formData.maxSuperCoinDiscountPct) || 0)) / 100).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Max coins customer can redeem:</span>
                              <span className="text-white/80 font-mono">
                                {Math.round(((parseFloat(formData.price || 0) * (parseFloat(formData.maxSuperCoinDiscountPct) || 0)) / 100) / 0.10)} coins
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-amber-400/80 pt-2 border-t border-white/5 font-mono">
                          ⚠️ SuperCoins cannot be redeemed against this product at checkout.
                        </p>
                      )}
                    </div>

                    {/* Refer & Earn Card */}
                    <div className={`p-5 rounded-xl border transition-all ${formData.isReferralEligible ? 'bg-purple-500/[0.03] border-purple-500/30' : 'bg-white/[0.02] border-white/10 opacity-70'}`}>
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                            <Gift size={17} />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-white">Refer & Earn Program</h4>
                            <span className="text-[11px] text-white/50 block">Customer credits & reward commissions</span>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox"
                            name="isReferralEligible"
                            checked={formData.isReferralEligible}
                            onChange={(e) => setFormData(prev => ({ ...prev, isReferralEligible: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                        </label>
                      </div>

                      {formData.isReferralEligible ? (
                        <div className="space-y-3 pt-3 border-t border-white/10">
                          <div>
                            <label className="block text-xs uppercase tracking-wider text-white/70 mb-1 font-mono">
                              Referral Discount / Reward Value (%) *
                            </label>
                            <div className="relative">
                              <input 
                                type="number" 
                                name="referralDiscountPct" 
                                value={formData.referralDiscountPct} 
                                onChange={handleChange} 
                                min="0" 
                                max="100" 
                                step="1" 
                                className="w-full bg-black/50 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-400 focus:outline-none pr-8 font-mono" 
                                placeholder="5" 
                              />
                              <span className="absolute right-3 top-2.5 text-xs text-white/40 font-mono">%</span>
                            </div>
                          </div>

                          <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-[11px] text-white/60 space-y-1">
                            <div className="flex justify-between">
                              <span>Referral reward allocation:</span>
                              <span className="text-purple-300 font-mono font-medium">
                                R{((parseFloat(formData.price || 0) * (parseFloat(formData.referralDiscountPct) || 0)) / 100).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Wallet discount eligible:</span>
                              <span className="text-emerald-400 font-mono">Active on Checkout</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-amber-400/80 pt-2 border-t border-white/5 font-mono">
                          ⚠️ Referral wallet credits & reward discounts cannot be applied to this product.
                        </p>
                      )}
                    </div>
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

                  {/* Multi-Tier Volume Pricing (B2B Bulk Export Tiers) */}
                  <div className="mt-8 pt-6 border-t border-white/[0.08]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div>
                        <h4 className="text-sm font-serif font-bold text-[var(--color-ivory)] flex items-center gap-2">
                          <Layers size={16} className="text-[#e1bd70]" />
                          B2B Multi-Tier Volume Pricing (Cases)
                        </h4>
                        <p className="text-xs text-[var(--color-ivory-muted)] font-light mt-0.5">
                          Define tiered case pricing bands for international distributors, importers, and bulk trade buyers.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleLoadPresetTiers}
                          className="px-3 py-1.5 text-[11px] font-semibold text-[#e1bd70] border border-[#e1bd70]/30 hover:border-[#e1bd70] bg-[#e1bd70]/5 rounded-lg transition-colors cursor-pointer"
                        >
                          Load Preset Tiers
                        </button>
                        <button
                          type="button"
                          onClick={handleAddTier}
                          className="px-3 py-1.5 text-[11px] font-semibold text-black bg-[#e1bd70] hover:bg-[#d6a03f] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <PlusCircle size={13} /> Add Tier
                        </button>
                      </div>
                    </div>

                    {(!formData.volumeTiers || formData.volumeTiers.length === 0) ? (
                      <div className="p-6 border border-dashed border-white/10 rounded-xl text-center bg-white/[0.01]">
                        <p className="text-xs text-[var(--color-ivory-muted)]">No volume discount tiers specified yet.</p>
                        <button
                          type="button"
                          onClick={handleAddTier}
                          className="mt-2 text-xs text-[#e1bd70] hover:underline cursor-pointer inline-flex items-center gap-1"
                        >
                          <PlusCircle size={12} /> Add your first pricing tier (e.g. 10 - 49 cases)
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/30">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-white/[0.04] text-[var(--color-ivory-muted)] uppercase tracking-wider font-semibold border-b border-white/10">
                            <tr>
                              <th className="px-4 py-3">Min Cases</th>
                              <th className="px-4 py-3">Max Cases</th>
                              <th className="px-4 py-3">Price / Case (ZAR)</th>
                              <th className="px-4 py-3">Equivalent / Bottle</th>
                              <th className="px-4 py-3">Notes & Terms</th>
                              <th className="px-3 py-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {formData.volumeTiers.map((tier, idx) => {
                              const bpc = Number(formData.bottlesPerCase) || 6;
                              const price = Number(tier.pricePerCase) || 0;
                              const perBottle = price > 0 ? (price / bpc).toFixed(2) : '-';
                              return (
                                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                  <td className="px-4 py-2.5">
                                    <input
                                      type="number"
                                      min="1"
                                      placeholder="10"
                                      value={tier.minCases}
                                      onChange={(e) => handleTierChange(idx, 'minCases', e.target.value)}
                                      className="w-24 bg-black/50 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#e1bd70]"
                                    />
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <input
                                      type="number"
                                      min="1"
                                      placeholder="49 (or blank for +)"
                                      value={tier.maxCases}
                                      onChange={(e) => handleTierChange(idx, 'maxCases', e.target.value)}
                                      className="w-28 bg-black/50 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#e1bd70]"
                                    />
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <div className="relative">
                                      <span className="absolute left-2.5 top-1.5 text-white/40 text-xs">R</span>
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="950.00"
                                        value={tier.pricePerCase}
                                        onChange={(e) => handleTierChange(idx, 'pricePerCase', e.target.value)}
                                        className="w-32 bg-black/50 border border-white/15 rounded-lg pl-6 pr-2.5 py-1.5 text-xs text-white font-mono font-bold focus:outline-none focus:border-[#e1bd70]"
                                      />
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5 font-mono text-[var(--color-ivory-muted)]">
                                    {price > 0 ? `R ${perBottle}` : '—'}
                                  </td>
                                  <td className="px-4 py-2.5">
                                    <input
                                      type="text"
                                      placeholder="e.g. Pallet tier / FOB Cape Town"
                                      value={tier.notes}
                                      onChange={(e) => handleTierChange(idx, 'notes', e.target.value)}
                                      className="w-full min-w-[160px] bg-black/50 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#e1bd70]"
                                    />
                                  </td>
                                  <td className="px-3 py-2.5 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveTier(idx)}
                                      className="p-1.5 text-red-400/80 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                                      title="Remove Tier"
                                    >
                                      <X size={14} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
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

                {formData.exportReady && (
                  <div className="p-5 rounded-xl bg-black/40 border border-[#c9a35b]/30 space-y-4 animate-in fade-in">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#e1bd70] uppercase tracking-wider">
                      <Truck size={16} /> Container Loading & Export Packing Specifications
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-[#bdb5a6] font-bold mb-1.5">
                          Bottles Per Case
                        </label>
                        <select
                          name="bottlesPerCase"
                          value={formData.bottlesPerCase}
                          onChange={handleChange}
                          className="w-full bg-black/50 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a35b]"
                        >
                          <option value="6">6 bottles / case (Standard)</option>
                          <option value="12">12 bottles / case (Full Dozen)</option>
                          <option value="3">3 bottles / case (Magnums/Presents)</option>
                          <option value="1">1 bottle / case (Single Gift)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-[#bdb5a6] font-bold mb-1.5">
                          Cases Per Pallet
                        </label>
                        <input
                          type="number"
                          name="casesPerPallet"
                          value={formData.casesPerPallet}
                          onChange={handleChange}
                          className="w-full bg-black/50 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a35b]"
                          placeholder="56"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-[#bdb5a6] font-bold mb-1.5">
                          HS Tariff Code
                        </label>
                        <input
                          type="text"
                          name="hsCode"
                          value={formData.hsCode}
                          onChange={handleChange}
                          className="w-full bg-black/50 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a35b]"
                          placeholder="2204.21"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-[#bdb5a6] font-bold mb-1.5">
                          Pallets per 20ft Container
                        </label>
                        <input
                          type="number"
                          name="palletsPer20ft"
                          value={formData.palletsPer20ft}
                          onChange={handleChange}
                          className="w-full bg-black/50 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a35b]"
                          placeholder="10"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-[#bdb5a6] font-bold mb-1.5">
                          Pallets per 40ft Container
                        </label>
                        <input
                          type="number"
                          name="palletsPer40ft"
                          value={formData.palletsPer40ft}
                          onChange={handleChange}
                          className="w-full bg-black/50 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a35b]"
                          placeholder="20"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-[#bdb5a6] font-bold mb-1.5">
                          Dispatch Lead Time (Days)
                        </label>
                        <input
                          type="number"
                          name="leadTimeDays"
                          value={formData.leadTimeDays}
                          onChange={handleChange}
                          className="w-full bg-black/50 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a35b]"
                          placeholder="14"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Packaging & Courier Logistics Specs */}
              <div className="space-y-8 pt-6">
                <h2 className="text-[var(--color-ivory)] font-serif text-3xl flex items-center gap-4 border-b border-white/[0.05] pb-4">
                  <Package size={24} className="text-[#e1bd70]" />
                  Logistics & Packaging (Live Courier Rates)
                </h2>
                <p className="text-xs uppercase tracking-widest text-[#e1bd70]/80">
                  Accurate dimensions allow Aramex and live freight engines to calculate exact courier rates dynamically.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="relative z-0 w-full group">
                    <input 
                      type="number" 
                      step="0.01"
                      name="weight_kg" 
                      id="weight_kg"
                      value={formData.weight_kg} 
                      onChange={handleChange} 
                      required
                      min="0.1"
                      className="block py-3 px-0 w-full text-base text-[var(--color-ivory)] bg-transparent border-0 border-b border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[var(--color-gold)] peer" 
                      placeholder=" " 
                    />
                    <label 
                      htmlFor="weight_kg" 
                      className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-[#e1bd70] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                    >
                      Weight (KG) *
                    </label>
                  </div>

                  <div className="relative z-0 w-full group">
                    <input 
                      type="number" 
                      step="0.1"
                      name="length_cm" 
                      id="length_cm"
                      value={formData.length_cm} 
                      onChange={handleChange} 
                      required
                      min="1"
                      className="block py-3 px-0 w-full text-base text-[var(--color-ivory)] bg-transparent border-0 border-b border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[var(--color-gold)] peer" 
                      placeholder=" " 
                    />
                    <label 
                      htmlFor="length_cm" 
                      className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-[#e1bd70] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                    >
                      Length (CM) *
                    </label>
                  </div>

                  <div className="relative z-0 w-full group">
                    <input 
                      type="number" 
                      step="0.1"
                      name="width_cm" 
                      id="width_cm"
                      value={formData.width_cm} 
                      onChange={handleChange} 
                      required
                      min="1"
                      className="block py-3 px-0 w-full text-base text-[var(--color-ivory)] bg-transparent border-0 border-b border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[var(--color-gold)] peer" 
                      placeholder=" " 
                    />
                    <label 
                      htmlFor="width_cm" 
                      className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-[#e1bd70] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                    >
                      Width (CM) *
                    </label>
                  </div>

                  <div className="relative z-0 w-full group">
                    <input 
                      type="number" 
                      step="0.1"
                      name="height_cm" 
                      id="height_cm"
                      value={formData.height_cm} 
                      onChange={handleChange} 
                      required
                      min="1"
                      className="block py-3 px-0 w-full text-base text-[var(--color-ivory)] bg-transparent border-0 border-b border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[var(--color-gold)] peer" 
                      placeholder=" " 
                    />
                    <label 
                      htmlFor="height_cm" 
                      className="peer-focus:font-medium absolute text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 peer-focus:text-[#e1bd70] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
                    >
                      Height (CM) *
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Box / Packaging Type</label>
                    <input 
                      type="text" 
                      name="box_type" 
                      value={formData.box_type} 
                      onChange={handleChange} 
                      placeholder="e.g. Standard Luxury Bottle Box"
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded text-[var(--color-ivory)] focus:outline-none focus:border-[var(--color-gold)] text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Default Courier Service</label>
                    <select
                      name="aramexServiceType"
                      value={formData.aramexServiceType}
                      onChange={handleChange}
                      className="w-full bg-[#111] border border-white/10 px-4 py-3 rounded text-[var(--color-ivory)] focus:outline-none focus:border-[var(--color-gold)] text-sm"
                    >
                      <option value="ONP">ONP - Overnight Express (Next Day)</option>
                      <option value="PEC">PEC - Economy Road (2-3 Days)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        name="is_fragile" 
                        checked={formData.is_fragile} 
                        onChange={handleChange} 
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#c9a35b]"></div>
                    </label>
                    <span className="text-sm text-[var(--color-ivory)]">Fragile Glass / Liquid Parcel</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-10 pt-6">
                <h2 className="text-[var(--color-ivory)] font-serif text-3xl flex items-center gap-4 border-b border-white/[0.05] pb-4">
                  <UploadCloud size={24} className="text-[#e1bd70]" />
                  Media & Documents
                </h2>
                
                <ProductImageManager entries={imageEntries} onChange={setImageEntries} required />

                <BarcodeSection
                  barcode={formData.barcode}
                  cartonBarcode={formData.cartonBarcode}
                  barcodePreview={barcodePreview}
                  onBarcodeChange={(val) => setFormData(prev => ({ ...prev, barcode: val }))}
                  onCartonBarcodeChange={(val) => setFormData(prev => ({ ...prev, cartonBarcode: val }))}
                  onBarcodeFileSelect={(file) => {
                    setBarcodeFile(file);
                    setBarcodePreview(URL.createObjectURL(file));
                  }}
                  onRemoveBarcodeImage={() => {
                    setBarcodeFile(null);
                    setBarcodePreview('');
                    setFormData(prev => ({ ...prev, barcodeImage: '' }));
                  }}
                />

                {formData.type.toLowerCase() === 'wine' && (
                  <div className="border border-[var(--color-gold)]/20 p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-gold)]/40"></div>
                    <label className="block text-[10px] uppercase tracking-widest text-[#e1bd70] mb-2 font-bold">
                      Fact Sheet PDF {isInternalProductManager ? '(Optional for internal catalog)' : '(Required for Wine) *'}
                    </label>
                    <p className="text-sm text-[var(--color-ivory-muted)] mb-6 font-light">Please upload a new official vineyard fact sheet or authentication document.</p>
                    <input 
                      type="file" 
                      accept="application/pdf"
                      onChange={handlePdfChange}
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
                  {submitting ? 'Updating Product...' : <><CheckCircle2 size={20} /> Update Product</>}
                </button>
              </div>
            </form>
            )}
          </div>
    </div>
  );
}
