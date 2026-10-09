import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import api from '../../api';

export default function AdminTestimonials() {
  const { user } = useAuth();
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    image: '',
    bottle: '',
    text: '',
    rating: 5,
    date: 'Verified Client',
    isVisible: true
  });
  const [currentId, setCurrentId] = useState(null);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/testimonials/admin`);
      const data = res.data;
      setTestimonials(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch testimonials:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleOpenModal = (testimonial = null) => {
    if (testimonial) {
      setEditMode(true);
      setCurrentId(testimonial._id);
      setFormData({
        name: testimonial.name || '',
        location: testimonial.location || '',
        image: testimonial.image || '',
        bottle: testimonial.bottle || '',
        text: testimonial.text || '',
        rating: testimonial.rating || 5,
        date: testimonial.date || 'Verified Client',
        isVisible: testimonial.isVisible !== undefined ? testimonial.isVisible : true
      });
    } else {
      setEditMode(false);
      setCurrentId(null);
      setFormData({
        name: '',
        location: '',
        image: '',
        bottle: '',
        text: '',
        rating: 5,
        date: 'Verified Client',
        isVisible: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editMode ? 'put' : 'post';
      const endpoint = editMode ? `/testimonials/${currentId}` : `/testimonials`;
      
      await api[method](endpoint, formData);
      
      setShowModal(false);
      fetchTestimonials();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save testimonial');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this testimonial?')) {
      try {
        await api.delete(`/testimonials/${id}`);
        fetchTestimonials();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const toggleVisibility = async (t) => {
    try {
      await api.put(`/testimonials/${t._id}`, { isVisible: !t.isVisible });
      fetchTestimonials();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif text-[var(--color-ivory)] uppercase tracking-widest">Manage Testimonials</h1>
          <p className="text-[var(--color-ivory-muted)] mt-1 text-sm uppercase tracking-widest">Add, edit, or hide homepage testimonials</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-gold-gradient text-black px-4 py-2 rounded-xl font-bold uppercase tracking-widest text-xs hover:brightness-110 transition-all"
        >
          <Plus size={16} /> Add Testimonial
        </button>
      </div>

      <div className="bg-[#0a0a0a]/80 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-[var(--color-gold)]" size={32} /></div>
        ) : testimonials.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-ivory-muted)]">No testimonials found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-[var(--color-ivory-muted)]">Client</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-[var(--color-ivory-muted)]">Review Text</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-[var(--color-ivory-muted)]">Bottle Mentioned</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-[var(--color-ivory-muted)]">Visibility</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-[var(--color-ivory-muted)] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {testimonials.map(t => (
                  <tr key={t._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-[var(--color-ivory)]">{t.name}</div>
                      <div className="text-xs text-[var(--color-ivory-muted)]">{t.location}</div>
                    </td>
                    <td className="p-4 text-sm text-[var(--color-ivory-muted)] max-w-xs truncate">
                      {t.text}
                    </td>
                    <td className="p-4 text-sm text-[var(--color-ivory-muted)]">
                      {t.bottle || '-'}
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => toggleVisibility(t)}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md border ${t.isVisible ? 'bg-green-900/30 border-green-500/30 text-green-400' : 'bg-red-900/30 border-red-500/30 text-red-400'}`}
                      >
                        {t.isVisible ? <><Eye size={12}/> Visible</> : <><EyeOff size={12}/> Hidden</>}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleOpenModal(t)} className="p-2 hover:bg-white/10 rounded-lg text-blue-400 transition-colors">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(t._id)} className="p-2 hover:bg-white/10 rounded-lg text-red-400 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#111] z-10">
              <h2 className="text-xl font-serif text-[var(--color-ivory)] uppercase tracking-widest">{editMode ? 'Edit Testimonial' : 'Add Testimonial'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">Name</label>
                  <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[var(--color-gold)]" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">Location</label>
                  <input required name="location" value={formData.location} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[var(--color-gold)]" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">Image URL (Optional)</label>
                <input name="image" value={formData.image} onChange={handleInputChange} placeholder="/assets/testimonials/avatar.jpg" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[var(--color-gold)]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">Bottle Mentioned (Optional)</label>
                  <input name="bottle" value={formData.bottle} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[var(--color-gold)]" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">Date Text</label>
                  <input name="date" value={formData.date} onChange={handleInputChange} placeholder="Verified Client" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[var(--color-gold)]" />
                </div>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">Review Text</label>
                <textarea required name="text" value={formData.text} onChange={handleInputChange} rows={4} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[var(--color-gold)]" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="isVisible" checked={formData.isVisible} onChange={handleInputChange} className="w-4 h-4 accent-[var(--color-gold)]" />
                <label className="text-sm text-[var(--color-ivory)]">Visible on Homepage</label>
              </div>
              <div className="mt-4 flex justify-end gap-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2 border border-white/10 text-white rounded-xl hover:bg-white/5 uppercase text-xs tracking-widest">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-gold-gradient text-black font-bold rounded-xl hover:brightness-110 uppercase text-xs tracking-widest">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
