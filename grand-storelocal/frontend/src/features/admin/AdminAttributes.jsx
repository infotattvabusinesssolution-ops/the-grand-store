import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2, Loader2, Info } from 'lucide-react';
import DynamicIcon from '../../components/DynamicIcon';
import api from '../../api';

export default function AdminAttributes() {
  const { user } = useAuth();
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    type: 'flavor',
    icon: 'Star'
  });
  const [currentId, setCurrentId] = useState(null);

  const fetchAttributes = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/attributes`);
      const data = res.data;
      setAttributes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch attributes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  const handleInputChange = (e) => {
    let { name, value } = e.target;
    // Auto-generate value ID from name if it's empty
    if (name === 'name' && !editMode) {
      const suggestedValue = value.toLowerCase().replace(/[^a-z0-9]/g, '');
      setFormData(prev => ({ ...prev, [name]: value, value: suggestedValue }));
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleOpenModal = (attr = null) => {
    if (attr) {
      setEditMode(true);
      setCurrentId(attr._id);
      setFormData({
        name: attr.name,
        value: attr.value,
        type: attr.type,
        icon: attr.icon
      });
    } else {
      setEditMode(false);
      setCurrentId(null);
      setFormData({
        name: '',
        value: '',
        type: 'flavor',
        icon: 'Star'
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editMode ? 'put' : 'post';
      const endpoint = editMode ? `/attributes/${currentId}` : `/attributes`;
      
      await api[method](endpoint, formData);
      
      setShowModal(false);
      fetchAttributes();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save attribute');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this attribute? Products using it might lose this badge.')) {
      try {
        await api.delete(`/attributes/${id}`);
        fetchAttributes();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const flavors = attributes.filter(a => a.type === 'flavor');
  const pairings = attributes.filter(a => a.type === 'pairing');

  const renderTable = (data, title) => (
    <div className="bg-[#0a0a0a]/80 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden mb-8">
      <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-bold text-[var(--color-gold)] uppercase tracking-widest text-sm">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5">
              <th className="p-4 text-xs font-bold uppercase tracking-widest text-[var(--color-ivory-muted)]">Icon</th>
              <th className="p-4 text-xs font-bold uppercase tracking-widest text-[var(--color-ivory-muted)]">Display Name</th>
              <th className="p-4 text-xs font-bold uppercase tracking-widest text-[var(--color-ivory-muted)]">System Value</th>
              <th className="p-4 text-xs font-bold uppercase tracking-widest text-[var(--color-ivory-muted)] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && (
              <tr><td colSpan="4" className="p-4 text-center text-gray-500">No {title.toLowerCase()} found</td></tr>
            )}
            {data.map(attr => (
              <tr key={attr._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="p-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[var(--color-gold)]">
                    <DynamicIcon name={attr.icon} size={20} />
                  </div>
                </td>
                <td className="p-4 font-bold text-[var(--color-ivory)]">{attr.name}</td>
                <td className="p-4 text-xs text-[var(--color-ivory-muted)] font-mono">{attr.value}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleOpenModal(attr)} className="p-2 hover:bg-white/10 rounded-lg text-blue-400 transition-colors">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(attr._id)} className="p-2 hover:bg-white/10 rounded-lg text-red-400 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif text-[var(--color-ivory)] uppercase tracking-widest">Product Attributes</h1>
          <p className="text-[var(--color-ivory-muted)] mt-1 text-sm uppercase tracking-widest">Manage dynamic flavors and food pairings for products</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-gold-gradient text-black px-4 py-2 rounded-xl font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all"
        >
          <Plus size={16} /> Add Attribute
        </button>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-[var(--color-gold)]" size={32} /></div>
      ) : (
        <>
          {renderTable(flavors, 'Flavor Profiles')}
          {renderTable(pairings, 'Food Pairings')}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#111]">
              <h2 className="text-xl font-serif text-[var(--color-ivory)] uppercase tracking-widest">{editMode ? 'Edit Attribute' : 'Add Attribute'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">Type</label>
                <select 
                  name="type" 
                  value={formData.type} 
                  onChange={handleInputChange} 
                  disabled={editMode}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--color-gold)] disabled:opacity-50"
                >
                  <option value="flavor">Flavor Profile</option>
                  <option value="pairing">Food Pairing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">Display Name</label>
                <input required name="name" value={formData.name} onChange={handleInputChange} placeholder="e.g. Smoky & Peaty" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--color-gold)]" />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">System Value (Unique ID)</label>
                <input required name="value" value={formData.value} onChange={handleInputChange} placeholder="e.g. smoky" disabled={editMode} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-gray-400 outline-none focus:border-[var(--color-gold)] disabled:opacity-50 font-mono text-sm" />
                <p className="text-[10px] text-gray-500 mt-1">This is the backend ID. Changing this on an existing attribute may break existing products.</p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">Lucide Icon Name</label>
                <div className="flex gap-4 items-start">
                  <div className="flex-1">
                    <input required name="icon" value={formData.icon} onChange={handleInputChange} placeholder="e.g. Flame" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[var(--color-gold)]" />
                    <a href="https://lucide.dev/icons/" target="_blank" rel="noreferrer" className="text-[10px] text-[#e1bd70] hover:underline mt-1 inline-flex items-center gap-1">
                      <Info size={10} /> Browse available icons here
                    </a>
                  </div>
                  <div className="w-14 h-14 shrink-0 rounded-xl bg-white/5 border border-[var(--color-gold)]/50 flex flex-col items-center justify-center text-[var(--color-gold)]">
                    <DynamicIcon name={formData.icon} size={24} />
                    <span className="text-[8px] uppercase tracking-widest mt-1 opacity-50">Preview</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 border border-white/10 text-white rounded-xl hover:bg-white/5 uppercase text-xs tracking-widest">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-gold-gradient text-black font-bold rounded-xl hover:brightness-110 uppercase text-xs tracking-widest">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
