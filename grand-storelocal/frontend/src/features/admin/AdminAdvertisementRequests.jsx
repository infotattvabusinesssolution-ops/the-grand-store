import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, Plus, Edit2, Trash2, Eye } from 'lucide-react';
import api from '../../api';

export default function AdminAdvertisementRequests() {
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [productModal, setProductModal] = useState({ show: false, editingId: null, data: {} });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqRes, prodRes] = await Promise.all([
        api.get('/advertisements/requests'),
        api.get('/advertisements/products/all')
      ]);
      setRequests(reqRes.data);
      setProducts(prodRes.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/advertisements/requests/${id}`, { status });
      setRequests(requests.map(req => req._id === id ? { ...req, status } : req));
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  // Product Management
  const openProductModal = (product = null, fromRequest = null) => {
    if (product) {
      setProductModal({
        show: true,
        editingId: product._id,
        data: {
          title: product.title,
          brand: product.brand || '',
          images: product.images || [],
          description: product.description,
          linkUrl: product.linkUrl || '',
          price: product.price || '',
          category: product.category || '',
          tagline: product.tagline || '',
          features: product.features ? product.features.join(', ') : '',
          isActive: product.isActive
        },
        files: []
      });
    } else if (fromRequest) {
      setProductModal({
        show: true,
        editingId: null,
        data: {
          title: fromRequest.productName,
          brand: fromRequest.companyName,
          images: [],
          description: fromRequest.description,
          linkUrl: '',
          price: '',
          category: '',
          tagline: '',
          features: '',
          isActive: true
        },
        files: []
      });
    } else {
      setProductModal({
        show: true,
        editingId: null,
        data: { title: '', brand: '', images: [], description: '', linkUrl: '', price: '', category: '', tagline: '', features: '', isActive: true },
        files: []
      });
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', productModal.data.title);
      formData.append('brand', productModal.data.brand);
      formData.append('description', productModal.data.description);
      formData.append('linkUrl', productModal.data.linkUrl);
      formData.append('price', productModal.data.price);
      formData.append('category', productModal.data.category);
      formData.append('tagline', productModal.data.tagline);
      formData.append('features', productModal.data.features);
      formData.append('isActive', productModal.data.isActive);
      
      // Append retained images if editing
      if (productModal.editingId) {
        formData.append('retainedImages', JSON.stringify(productModal.data.images));
      }

      // Append files
      if (productModal.files && productModal.files.length > 0) {
        for (let i = 0; i < productModal.files.length; i++) {
          formData.append('images', productModal.files[i]);
        }
      }

      if (productModal.editingId) {
        await api.put(`/advertisements/products/${productModal.editingId}`, formData);
      } else {
        await api.post('/advertisements/products', formData);
      }
      setProductModal({ show: false, editingId: null, data: {}, files: [] });
      fetchData(); // Refresh both lists
    } catch (err) {
      alert('Error saving product: ' + err.message);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const totalCurrentImages = (productModal.data.images?.length || 0) + productModal.files.length;
    
    if (totalCurrentImages + selectedFiles.length > 5) {
      alert('You can only have up to 5 images total.');
      return;
    }

    setProductModal({
      ...productModal,
      files: [...productModal.files, ...selectedFiles]
    });
    // Reset file input value so same files can be selected again if needed
    e.target.value = '';
  };

  const removeExistingImage = (index) => {
    const newImages = [...productModal.data.images];
    newImages.splice(index, 1);
    setProductModal({
      ...productModal,
      data: { ...productModal.data, images: newImages }
    });
  };

  const removeNewFile = (index) => {
    const newFiles = [...productModal.files];
    newFiles.splice(index, 1);
    setProductModal({
      ...productModal,
      files: newFiles
    });
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this advertised product?')) {
      try {
        await api.delete(`/advertisements/products/${id}`);
        fetchData();
      } catch (err) {
        alert('Error deleting product: ' + err.message);
      }
    }
  };

  if (loading && requests.length === 0) return <div className="p-8 text-[var(--color-ivory)]">Loading data...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;

  return (
    <div className="p-8 w-full">
      <h1 className="text-[#d8b76d] font-serif text-3xl mb-8">Advertisement Management</h1>
      
      {/* ------------------- REQUESTS SECTION ------------------- */}
      <h2 className="text-2xl font-serif text-[var(--color-ivory)] mb-4">Inbound Requests</h2>
      <div className="bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden mb-12">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-white/10 bg-white/[0.02]">
              <tr>
                <th className="p-4 text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)]">Company</th>
                <th className="p-4 text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)]">Contact</th>
                <th className="p-4 text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)]">Product Info</th>
                <th className="p-4 text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)]">Date</th>
                <th className="p-4 text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)]">Status</th>
                <th className="p-4 text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {requests.map((req) => (
                <tr key={req._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="text-[var(--color-ivory)] text-sm">{req.companyName}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-[var(--color-ivory)] text-sm">{req.contactName}</div>
                    <div className="text-[var(--color-ivory-muted)] text-xs">{req.email}</div>
                    <div className="text-[var(--color-ivory-muted)] text-xs">{req.phone}</div>
                  </td>
                  <td className="p-4 max-w-xs">
                    <div className="text-[var(--color-ivory)] text-sm font-bold">{req.productName}</div>
                  </td>
                  <td className="p-4">
                    <div className="text-[var(--color-ivory-muted)] text-xs whitespace-nowrap">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-[var(--color-ivory-muted)] text-xs whitespace-nowrap opacity-50">
                      {new Date(req.createdAt).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-[10px] uppercase tracking-widest rounded-full ${
                      req.status === 'pending' ? 'bg-yellow-500/20 text-yellow-500' :
                      req.status === 'approved' ? 'bg-green-500/20 text-green-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link 
                        to={`/admin/advertisement-requests/${req._id}`}
                        className="px-3 py-1.5 bg-[#c9a35b]/10 text-[#c9a35b] hover:bg-[#c9a35b]/20 border border-[#c9a35b]/20 rounded-lg text-[10px] uppercase tracking-widest font-bold flex items-center gap-1 transition-colors"
                        title="View More"
                      >
                        <Eye size={14} /> View More
                      </Link>
                      {req.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleUpdateStatus(req._id, 'approved')}
                            className="p-2 text-green-500 hover:bg-green-500/20 rounded-lg transition-colors"
                            title="Approve"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(req._id, 'rejected')}
                            className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      )}
                      {req.status === 'approved' && (
                        <button
                          onClick={() => openProductModal(null, req)}
                          className="px-3 py-1.5 bg-[#c9a35b]/10 text-[#c9a35b] hover:bg-[#c9a35b]/20 border border-[#c9a35b]/20 rounded-lg text-[10px] uppercase tracking-widest font-bold flex items-center gap-1 transition-colors"
                          title="Create Ad Product"
                        >
                          <Plus size={14} /> Add Product
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-[var(--color-ivory-muted)] text-sm">
                    No requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------- PRODUCTS SECTION ------------------- */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-serif text-[var(--color-ivory)]">Live Advertised Products</h2>
        <button 
          onClick={() => openProductModal()}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 text-[var(--color-ivory)] hover:text-black border border-white/10 font-bold uppercase tracking-widest text-[10px] rounded-lg hover:bg-white transition-colors"
        >
          <Plus size={16} /> Add Custom Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product._id} className="bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden relative group flex flex-col">
            <div className="aspect-video relative overflow-hidden bg-black">
              {product.images && product.images.length > 0 ? (
                <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover opacity-80" />
              ) : (
                <div className="w-full h-full bg-black/50 flex items-center justify-center text-xs text-white/50">No Image</div>
              )}
              <div className="absolute top-2 right-2 flex gap-2">
                <button 
                  onClick={() => openProductModal(product)}
                  className="p-2 bg-black/50 hover:bg-black/80 text-white rounded-lg backdrop-blur-md transition-colors"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => handleDeleteProduct(product._id)}
                  className="p-2 bg-red-500/50 hover:bg-red-500/80 text-white rounded-lg backdrop-blur-md transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-[var(--color-ivory)] font-serif text-lg leading-tight">{product.title}</h3>
                {product.isActive ? (
                  <CheckCircle size={16} className="text-green-500 shrink-0" title="Active" />
                ) : (
                  <XCircle size={16} className="text-red-500 shrink-0" title="Inactive" />
                )}
              </div>
              <p className="text-[10px] text-[var(--color-ivory-muted)] uppercase tracking-widest mb-4">
                {product.brand}
              </p>
              <p className="text-xs text-[var(--color-ivory-muted)] line-clamp-3 mb-4 flex-1">
                {product.description}
              </p>
              {product.linkUrl && (
                <div className="text-[10px] text-[#c9a35b] truncate pt-2 border-t border-white/5" title={product.linkUrl}>
                  {product.linkUrl}
                </div>
              )}
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="col-span-full p-8 bg-[#0a0a0a] border border-white/5 rounded-xl text-center text-[var(--color-ivory-muted)] text-sm">
            No live advertised products found.
          </div>
        )}
      </div>

      {/* ------------------- VIEW PITCH MODAL REMOVED (Now a separate route) ------------------- */}

      {/* ------------------- ADD/EDIT PRODUCT MODAL ------------------- */}
      {productModal.show && createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-[#d8b76d] font-serif text-2xl">
                {productModal.editingId ? 'Edit Product' : 'Create Advertised Product'}
              </h2>
              <button onClick={() => setProductModal({ show: false, editingId: null, data: {}, files: [] })} className="text-white/50 hover:text-white">
                <XCircle size={24} />
              </button>
            </div>
            <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Title</label>
                  <input 
                    type="text" required 
                    value={productModal.data.title} onChange={(e) => setProductModal({ ...productModal, data: { ...productModal.data, title: e.target.value } })}
                    className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Brand</label>
                  <input 
                    type="text" 
                    value={productModal.data.brand} onChange={(e) => setProductModal({ ...productModal, data: { ...productModal.data, brand: e.target.value } })}
                    className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Price (Optional)</label>
                  <input 
                    type="text" 
                    value={productModal.data.price} onChange={(e) => setProductModal({ ...productModal, data: { ...productModal.data, price: e.target.value } })}
                    className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm"
                    placeholder="e.g. $150.00"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Category (Optional)</label>
                  <input 
                    type="text" 
                    value={productModal.data.category} onChange={(e) => setProductModal({ ...productModal, data: { ...productModal.data, category: e.target.value } })}
                    className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm"
                    placeholder="e.g. Whisky"
                  />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Tagline (Optional)</label>
                <input 
                  type="text" 
                  value={productModal.data.tagline} onChange={(e) => setProductModal({ ...productModal, data: { ...productModal.data, tagline: e.target.value } })}
                  className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm"
                  placeholder="e.g. A limited edition single malt"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Images (Max 5)</label>
                
                {/* Previews Grid */}
                {((productModal.data.images && productModal.data.images.length > 0) || productModal.files.length > 0) && (
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {/* Existing Images */}
                    {productModal.data.images?.map((url, index) => (
                      <div key={`existing-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
                        <img src={url} alt={`Existing ${index}`} className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => removeExistingImage(index)}
                          className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                    ))}
                    
                    {/* New Local Files */}
                    {productModal.files.map((file, index) => {
                      const url = URL.createObjectURL(file);
                      return (
                        <div key={`new-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-green-500/30 group">
                          <img src={url} alt={`New ${index}`} className="w-full h-full object-cover" />
                          <div className="absolute top-1 left-1 text-[8px] bg-green-500 text-black px-1 rounded font-bold uppercase tracking-widest">New</div>
                          <button 
                            type="button" 
                            onClick={() => removeNewFile(index)}
                            className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded hover:bg-red-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* File Input */}
                {((productModal.data.images?.length || 0) + productModal.files.length) < 5 && (
                  <input 
                    type="file" multiple accept="image/*"
                    onChange={handleFileChange}
                    className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm"
                    required={!productModal.editingId && productModal.files.length === 0} 
                  />
                )}
                {((productModal.data.images?.length || 0) + productModal.files.length) >= 5 && (
                  <div className="text-xs text-yellow-500/80 mt-2">Maximum of 5 images reached.</div>
                )}
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Description</label>
                <textarea 
                  required rows={4}
                  value={productModal.data.description} onChange={(e) => setProductModal({ ...productModal, data: { ...productModal.data, description: e.target.value } })}
                  className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Features (Optional, comma-separated)</label>
                <input 
                  type="text" 
                  value={productModal.data.features} onChange={(e) => setProductModal({ ...productModal, data: { ...productModal.data, features: e.target.value } })}
                  className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm"
                  placeholder="e.g. 12 Years Old, 40% ABV, Speyside"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">External Link URL</label>
                <input 
                  type="url" 
                  value={productModal.data.linkUrl} onChange={(e) => setProductModal({ ...productModal, data: { ...productModal.data, linkUrl: e.target.value } })}
                  className="w-full bg-black border border-white/10 rounded-lg p-3 text-white text-sm"
                  placeholder="https://their-store.com/product"
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="isActive"
                  checked={productModal.data.isActive} onChange={(e) => setProductModal({ ...productModal, data: { ...productModal.data, isActive: e.target.checked } })}
                  className="w-4 h-4 rounded bg-black border-white/10 text-[#c9a35b]"
                />
                <label htmlFor="isActive" className="text-sm text-[var(--color-ivory)]">Active (visible on home page)</label>
              </div>
              <div className="pt-6 flex justify-end gap-4">
                <button 
                  type="button" onClick={() => setProductModal({ show: false, editingId: null, data: {}, files: [] })}
                  className="px-6 py-3 text-sm text-[var(--color-ivory-muted)] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 bg-[#c9a35b] text-black font-bold uppercase tracking-widest text-[10px] rounded-lg hover:bg-[#e1bd70] transition-colors"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
