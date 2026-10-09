import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, AlertTriangle, Layers, X } from 'lucide-react';
import api from '../../api';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: '', description: '', isActive: true, brandLogos: [] });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/categories/admin');
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setFormData({ id: null, name: '', description: '', isActive: true, brandLogos: [] });
    setMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setFormData({
      id: category._id,
      name: category.name,
      description: category.description || '',
      isActive: category.isActive,
      brandLogos: category.brandLogos || []
    });
    setMessage('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      if (formData.id) {
        await api.put(`/categories/${formData.id}`, formData);
      } else {
        await api.post('/categories', formData);
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error saving category');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this category? This will not delete products in the category, but they may lose their category label.")) {
      try {
        await api.delete(`/categories/${id}`);
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('image', file);

    setUploadingLogo(true);
    try {
      const res = await api.post('/categories/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({
        ...prev,
        brandLogos: [...prev.brandLogos, { url: res.data.url, public_id: res.data.public_id }]
      }));
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error uploading logo');
    } finally {
      setUploadingLogo(false);
      // Reset input
      e.target.value = null;
    }
  };

  const removeLogo = (index) => {
    setFormData(prev => {
      const newLogos = [...prev.brandLogos];
      newLogos.splice(index, 1);
      return { ...prev, brandLogos: newLogos };
    });
  };

  const filtered = categories.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif text-[var(--color-ivory)] flex items-center gap-2">
            <Layers className="text-[var(--color-gold)]" /> Configure Categories
          </h1>
          <p className="text-sm text-[var(--color-ivory-muted)] mt-1">Manage product categories (Wine, Rum, Whiskey, etc.)</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-[#c9a35b] text-black px-4 py-2 font-bold text-xs uppercase tracking-widest hover:bg-white transition-colors rounded"
        >
          <Plus size={16} /> Add Category
        </button>
      </div>

      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-4 flex items-center gap-3 mb-6">
        <Search size={16} className="text-[var(--color-ivory-muted)]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search categories..."
          className="bg-transparent text-sm text-white outline-none placeholder:text-white/30 w-full"
        />
      </div>

      <div className="overflow-x-auto bg-[#0a0a0a] border border-white/5 rounded-2xl">
        {loading ? (
          <div className="p-12 text-center text-[var(--color-ivory-muted)] animate-pulse">Loading categories...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-ivory-muted)]">No categories found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] bg-black/20">
                <th className="py-4 pl-6 font-semibold">Name</th>
                <th className="py-4 font-semibold">Slug</th>
                <th className="py-4 font-semibold">Status</th>
                <th className="py-4 font-semibold text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 pl-6 text-sm text-[var(--color-ivory)] font-serif">{c.name}</td>
                  <td className="py-4 text-sm text-[var(--color-ivory-muted)]">{c.slug}</td>
                  <td className="py-4">
                    <span className={`px-2 py-1 text-[10px] uppercase tracking-widest rounded ${c.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 text-right pr-6">
                    <button onClick={() => openEditModal(c)} className="text-[var(--color-ivory-muted)] hover:text-white transition-colors p-2">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(c._id)} className="text-[var(--color-ivory-muted)] hover:text-red-400 transition-colors p-2">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111] border border-white/10 p-6 rounded-xl w-full max-w-md relative">
            <h2 className="text-2xl font-serif text-white mb-6">{formData.id ? "Edit Category" : "Add New Category"}</h2>
            {message && <p className="text-yellow-500 text-sm mb-4"><AlertTriangle className="inline mr-1" size={14}/>{message}</p>}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1">Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-[var(--color-gold)] transition-colors" placeholder="e.g. Wine" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-black border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-[var(--color-gold)] transition-colors h-24" placeholder="Optional description" />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="accent-[var(--color-gold)]" />
                <label htmlFor="isActive" className="text-sm text-white">Active (Visible in Store)</label>
              </div>


              <div className="flex justify-end gap-2 mt-4 border-t border-white/10 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-white/20 text-white rounded hover:bg-white/5 transition-colors text-xs uppercase tracking-widest">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-[var(--color-gold)] text-black font-bold rounded hover:bg-white transition-colors text-xs uppercase tracking-widest">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
