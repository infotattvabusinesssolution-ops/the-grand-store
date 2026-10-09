import React, { useState, useEffect } from 'react';
import api from '../../api';
import { Search, Plus, Edit2, Trash2, X, Loader2, Bot, Tag, ToggleLeft, ToggleRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = [
  'Orders', 'Payments', 'Shipping', 'Returns & Refunds',
  'Products', 'Account', 'Vendors', 'Auctions', 'Events',
  'Age Policy', 'Contact', 'General',
];

const emptyForm = {
  category: 'Orders',
  keywords: '',
  question: '',
  answer: '',
  isActive: true,
  priority: 0,
};

export default function AdminChatbot() {
  const { user } = useAuth();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);

  const authConfig = {
    headers: { Authorization: `Bearer ${user.token}` },
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/chatbot/admin/faqs', authConfig);
      setFaqs(res.data);
    } catch (err) {
      setError('Failed to load chatbot FAQs');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (faq = null) => {
    if (faq) {
      setEditingFaq(faq);
      setFormData({
        category: faq.category,
        keywords: Array.isArray(faq.keywords) ? faq.keywords.join(', ') : faq.keywords,
        question: faq.question,
        answer: faq.answer,
        isActive: faq.isActive,
        priority: faq.priority,
      });
    } else {
      setEditingFaq(null);
      setFormData(emptyForm);
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFaq(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      ...formData,
      keywords: formData.keywords.split(',').map((k) => k.trim()).filter(Boolean),
      priority: parseInt(formData.priority) || 0,
    };

    try {
      if (editingFaq) {
        await api.put(`/chatbot/admin/faqs/${editingFaq._id}`, payload, authConfig);
      } else {
        await api.post('/chatbot/admin/faqs', payload, authConfig);
      }
      await fetchFaqs();
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving FAQ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this FAQ entry?')) return;
    try {
      await api.delete(`/chatbot/admin/faqs/${id}`, authConfig);
      fetchFaqs();
    } catch {
      alert('Failed to delete');
    }
  };

  const handleToggle = async (faq) => {
    try {
      await api.put(
        `/chatbot/admin/faqs/${faq._id}`,
        { ...faq, isActive: !faq.isActive, keywords: faq.keywords },
        authConfig
      );
      fetchFaqs();
    } catch {
      alert('Failed to toggle status');
    }
  };

  const filtered = faqs.filter((f) => {
    const matchCat = filterCategory === 'All' || f.category === filterCategory;
    const matchSearch =
      !searchTerm ||
      f.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(f.keywords) ? f.keywords.join(' ') : f.keywords)
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const categories = ['All', ...CATEGORIES];

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-serif text-[var(--color-ivory)] uppercase tracking-widest flex items-center gap-3">
            <Bot className="text-[var(--color-gold)]" size={32} />
            Chatbot Management
          </h1>
          <p className="text-[var(--color-ivory-muted)] mt-2">
            Manage the knowledge base that powers the customer chatbot assistant.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-gradient-to-r from-[var(--color-gold)] to-yellow-700 text-black px-6 py-2.5 rounded-lg font-medium hover:scale-105 transition-transform uppercase tracking-widest text-sm"
        >
          <Plus size={18} />
          Add FAQ
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#111] border border-white/5 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-[var(--color-gold)]">{faqs.length}</div>
          <div className="text-xs text-[var(--color-ivory-muted)] uppercase tracking-widest mt-1">Total FAQs</div>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{faqs.filter((f) => f.isActive).length}</div>
          <div className="text-xs text-[var(--color-ivory-muted)] uppercase tracking-widest mt-1">Active</div>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{faqs.filter((f) => !f.isActive).length}</div>
          <div className="text-xs text-[var(--color-ivory-muted)] uppercase tracking-widest mt-1">Inactive</div>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-[var(--color-ivory)]">
            {[...new Set(faqs.map((f) => f.category))].length}
          </div>
          <div className="text-xs text-[var(--color-ivory-muted)] uppercase tracking-widest mt-1">Categories</div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-[#111] border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-1/2 h-32 bg-[var(--color-gold)]/5 blur-[100px] pointer-events-none" />

        <div className="flex flex-col md:flex-row gap-4 mb-6 relative z-10">
          {/* Search */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search questions, answers, keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-sm text-[var(--color-ivory)] focus:border-[var(--color-gold)] focus:outline-none transition-colors"
            />
            <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
          </div>
          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[var(--color-ivory)] focus:border-[var(--color-gold)] focus:outline-none transition-colors"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-[var(--color-gold)] w-8 h-8" />
          </div>
        ) : (
          <div className="space-y-3 relative z-10">
            {filtered.map((faq) => (
              <div
                key={faq._id}
                className="bg-[#0d0d0d] border border-white/5 rounded-xl overflow-hidden transition-all"
              >
                <div className="flex items-center gap-3 p-4">
                  {/* Active Toggle */}
                  <button onClick={() => handleToggle(faq)} title="Toggle active">
                    {faq.isActive ? (
                      <ToggleRight size={22} className="text-green-400" />
                    ) : (
                      <ToggleLeft size={22} className="text-gray-500" />
                    )}
                  </button>
                  {/* Category Badge */}
                  <span className="bg-[#1a1a1a] border border-white/10 text-[var(--color-gold)] px-2.5 py-0.5 rounded-md text-xs font-medium whitespace-nowrap">
                    {faq.category}
                  </span>
                  {/* Question */}
                  <div className="flex-1 text-sm text-[var(--color-ivory)] font-medium truncate">
                    {faq.question}
                  </div>
                  {/* Priority */}
                  <span className="text-xs text-gray-500 whitespace-nowrap hidden md:block">
                    Priority: {faq.priority}
                  </span>
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setExpandedRow(expandedRow === faq._id ? null : faq._id)}
                      className="p-1.5 text-gray-500 hover:text-white rounded-lg transition-colors"
                    >
                      {expandedRow === faq._id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                    <button
                      onClick={() => handleOpenModal(faq)}
                      className="p-1.5 text-gray-500 hover:text-[var(--color-gold)] rounded-lg transition-colors"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(faq._id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 rounded-lg transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedRow === faq._id && (
                  <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-3">
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1 flex items-center gap-1">
                        <Tag size={10} /> Keywords
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(Array.isArray(faq.keywords) ? faq.keywords : [faq.keywords]).map((kw, i) => (
                          <span key={i} className="bg-[var(--color-gold)]/10 text-[var(--color-gold)] border border-[var(--color-gold)]/20 text-xs px-2 py-0.5 rounded-full">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">Answer</div>
                      <p className="text-sm text-[var(--color-ivory-muted)] leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-500">No FAQ entries found.</div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-[#1a1a1a] flex-shrink-0">
              <h2 className="text-xl font-serif text-[var(--color-ivory)] uppercase tracking-widest">
                {editingFaq ? 'Edit FAQ' : 'Add FAQ'}
              </h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[var(--color-ivory)] focus:border-[var(--color-gold)] focus:outline-none"
                  >
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Priority</label>
                  <input
                    type="number"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    min={0}
                    max={20}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[var(--color-ivory)] focus:border-[var(--color-gold)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">
                  Keywords <span className="normal-case text-gray-500">(comma separated)</span>
                </label>
                <input
                  type="text"
                  name="keywords"
                  required
                  value={formData.keywords}
                  onChange={handleChange}
                  placeholder="e.g. track, order status, where is my order"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[var(--color-ivory)] focus:border-[var(--color-gold)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Question</label>
                <input
                  type="text"
                  name="question"
                  required
                  value={formData.question}
                  onChange={handleChange}
                  placeholder="e.g. How do I track my order?"
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[var(--color-ivory)] focus:border-[var(--color-gold)] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-2">Answer</label>
                <textarea
                  name="answer"
                  required
                  rows="5"
                  value={formData.answer}
                  onChange={handleChange}
                  placeholder="Type the chatbot's response here..."
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-[var(--color-ivory)] focus:border-[var(--color-gold)] focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className="accent-[var(--color-gold)] w-4 h-4"
                />
                <label htmlFor="isActive" className="text-sm text-[var(--color-ivory-muted)] cursor-pointer">
                  Active (bot will use this entry)
                </label>
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
                  {saving ? <Loader2 size={18} className="animate-spin" /> : 'Save FAQ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
