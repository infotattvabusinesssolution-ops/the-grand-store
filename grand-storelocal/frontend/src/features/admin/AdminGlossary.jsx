import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Search, Plus, Edit2, Trash2, X, Loader2, BookA } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminGlossary() {
  const { user } = useAuth();
  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  
  const [formData, setFormData] = useState({
    term: '',
    definition: ''
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/glossary`);
      setTerms(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load terms');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (term = null) => {
    if (term) {
      setEditingTerm(term);
      setFormData({
        term: term.term,
        definition: term.definition
      });
    } else {
      setEditingTerm(null);
      setFormData({
        term: '',
        definition: ''
      });
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTerm(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      };

      if (editingTerm) {
        await api.put(`/glossary/${editingTerm._id}`, formData, config);
      } else {
        await api.post(`/glossary`, formData, config);
      }

      await fetchTerms();
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving term');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this term?')) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      await api.delete(`/glossary/${id}`, config);
      fetchTerms();
    } catch (err) {
      alert('Failed to delete term');
    }
  };

  const filteredTerms = terms.filter(item => 
    item.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-serif text-[var(--color-ivory)] uppercase tracking-widest flex items-center gap-3">
            <BookA className="text-[var(--color-gold)]" size={32} />
            Glossary Management
          </h1>
          <p className="text-[var(--color-ivory-muted)] mt-2">Manage terms and definitions used in the platform glossary.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-gradient-to-r from-[var(--color-gold)] to-yellow-700 text-black px-6 py-2.5 rounded-lg font-medium hover:scale-105 transition-transform uppercase tracking-widest text-sm"
        >
          <Plus size={18} />
          Add Term
        </button>
      </div>

      <div className="bg-[#111] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 left-1/4 w-1/2 h-32 bg-[var(--color-gold)]/5 blur-[100px] pointer-events-none"></div>

        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 relative z-10">
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Search terms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-[var(--color-ivory)] focus:border-[var(--color-gold)] focus:outline-none transition-colors"
            />
            <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
          </div>
          <div className="text-sm text-[var(--color-ivory-muted)] bg-[#1a1a1a] px-4 py-2.5 rounded-lg border border-white/10">
            Total Terms: <span className="text-[var(--color-gold)] font-bold">{terms.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-[var(--color-gold)] w-8 h-8" />
          </div>
        ) : (
          <div className="overflow-x-auto relative z-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-widest text-[var(--color-ivory-muted)]">
                  <th className="p-4 font-medium">Term</th>
                  <th className="p-4 font-medium">Definition</th>
                  <th className="p-4 font-medium">Letter</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTerms.map((term) => (
                  <tr key={term._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 text-[var(--color-ivory)] font-serif text-lg">
                      {term.term}
                    </td>
                    <td className="p-4 text-[var(--color-ivory-muted)] text-sm max-w-md truncate">
                      {term.definition}
                    </td>
                    <td className="p-4">
                      <span className="bg-[#1a1a1a] border border-white/10 text-[var(--color-gold)] px-3 py-1 rounded-md text-xs font-bold">
                        {term.letter}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(term)}
                          className="p-2 text-gray-400 hover:text-[var(--color-gold)] hover:bg-[#1a1a1a] rounded-lg transition-colors border border-transparent hover:border-white/10"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(term._id)}
                          className="p-2 text-gray-400 hover:text-red-400 hover:bg-[#1a1a1a] rounded-lg transition-colors border border-transparent hover:border-white/10"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredTerms.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-12 text-gray-500">
                      No terms found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#1a1a1a]">
              <h2 className="text-xl font-serif text-[var(--color-ivory)] uppercase tracking-widest">
                {editingTerm ? 'Edit Term' : 'Add Term'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Term</label>
                <input
                  type="text"
                  name="term"
                  required
                  value={formData.term}
                  onChange={handleChange}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-[var(--color-ivory)] focus:border-[var(--color-gold)] focus:outline-none transition-colors"
                  placeholder="e.g. Acidity"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Definition</label>
                <textarea
                  name="definition"
                  required
                  rows="4"
                  value={formData.definition}
                  onChange={handleChange}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-3 text-[var(--color-ivory)] focus:border-[var(--color-gold)] focus:outline-none transition-colors resize-none"
                  placeholder="Describe the term..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-gradient-to-r from-[var(--color-gold)] to-yellow-700 text-black px-6 py-2.5 rounded-lg font-medium hover:scale-105 transition-transform disabled:opacity-70 disabled:hover:scale-100 flex items-center gap-2"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : 'Save Term'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
