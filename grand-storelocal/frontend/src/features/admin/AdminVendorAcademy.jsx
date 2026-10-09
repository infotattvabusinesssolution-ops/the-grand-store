import React, { useState, useEffect } from 'react';
import api from '../../api';
import {
  GraduationCap, Plus, Edit2, Trash2, Video, FileText, CheckCircle2,
  AlertCircle, Loader2, PlayCircle, Eye, RefreshCw, MessageCircle,
  HelpCircle, BookOpen, PhoneCall, Save, ExternalLink, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = [
  'Getting Started',
  'Selling & Growth',
  'Photography & Presentation',
  'Payouts & Finance',
  'Fulfillment & Packaging',
  'Trade & B2B',
  'Auctions & Allocation',
  'General'
];

export default function AdminVendorAcademy() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('lessons'); // 'lessons' | 'support' | 'appearance'
  const [lessons, setLessons] = useState([]);
  const [config, setConfig] = useState({
    heroTitle: 'Vendor Academy',
    heroSubtitle: 'Master the marketplace. Learn how to optimize your store, photograph your products, and grow your sales.',
    sidebarLabel: 'Vendor Academy',
    sidebarBadge: '',
    isEnabled: true,
    whatsappNumber: '+27 82 000 0000',
    whatsappMessage: 'Hello Grand Store Partner Support, I am an active vendor and need guidance with...',
    ticketUrl: 'mailto:partners@grandstoreglobal.com?subject=Vendor%20Academy%20Support%20Ticket',
    helpCentreUrl: '/glossary',
    requestCallPhone: '+27 11 000 0000',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal State for adding/editing lesson
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Selling & Growth',
    videoUrl: '',
    duration: '5:00',
    thumbnail: '',
    articleContent: '',
    badge: '',
    sortOrder: 0,
    isPublished: true,
  });

  // Preview Modal
  const [previewLesson, setPreviewLesson] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/academy/admin');
      setLessons(res.data.lessons || []);
      if (res.data.config) {
        setConfig(res.data.config);
      }
    } catch (err) {
      console.error('Failed to load Vendor Academy admin data:', err);
      setError('Could not load Vendor Academy data.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (lesson = null) => {
    if (lesson) {
      setEditingLesson(lesson);
      setFormData({
        title: lesson.title || '',
        description: lesson.description || '',
        category: lesson.category || 'Selling & Growth',
        videoUrl: lesson.videoUrl || '',
        duration: lesson.duration || '5:00',
        thumbnail: lesson.thumbnail || '',
        articleContent: lesson.articleContent || '',
        badge: lesson.badge || '',
        sortOrder: lesson.sortOrder ?? 0,
        isPublished: lesson.isPublished !== false,
      });
    } else {
      setEditingLesson(null);
      setFormData({
        title: '',
        description: '',
        category: 'Selling & Growth',
        videoUrl: '',
        duration: '5:00',
        thumbnail: '',
        articleContent: '',
        badge: '',
        sortOrder: lessons.length + 1,
        isPublished: true,
      });
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLesson(null);
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Title is required.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      if (editingLesson) {
        const res = await api.put(`/academy/admin/${editingLesson._id}`, formData);
        setLessons(lessons.map((l) => (l._id === editingLesson._id ? res.data : l)));
        setSuccess('Lesson updated successfully.');
      } else {
        const res = await api.post('/academy/admin', formData);
        setLessons([...lessons, res.data]);
        setSuccess('New lesson created successfully.');
      }
      handleCloseModal();
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      console.error('Failed to save lesson:', err);
      setError(err.response?.data?.message || 'Failed to save lesson.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (id) => {
    if (!window.confirm('Are you sure you want to delete this module? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/academy/admin/${id}`);
      setLessons(lessons.filter((l) => l._id !== id));
      setSuccess('Module deleted.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Failed to delete lesson:', err);
      setError('Could not delete lesson.');
    }
  };

  const handleTogglePublished = async (lesson) => {
    try {
      const updated = { ...lesson, isPublished: !lesson.isPublished };
      const res = await api.put(`/academy/admin/${lesson._id}`, { isPublished: updated.isPublished });
      setLessons(lessons.map((l) => (l._id === lesson._id ? res.data : l)));
    } catch (err) {
      console.error('Failed to toggle publish status:', err);
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      const res = await api.put('/academy/admin/config', config);
      setConfig(res.data);
      setSuccess('Academy configuration updated.');
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      console.error('Failed to save config:', err);
      setError('Failed to update configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (!window.confirm('Reset all lessons to Grand Store default curriculum? Custom changes to existing lessons will be replaced.')) {
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/academy/admin/seed');
      setLessons(res.data.lessons || []);
      setSuccess('Curriculum reset to defaults.');
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      console.error('Failed to reset curriculum:', err);
      setError('Failed to reset curriculum.');
    } finally {
      setLoading(false);
    }
  };

  const filteredLessons = lessons.filter((l) => {
    const matchesSearch =
      l.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || l.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="p-2 bg-[var(--color-gold)]/10 text-[#c9a35b] rounded-lg">
              <GraduationCap size={24} />
            </span>
            <h1 className="text-3xl font-serif text-[var(--color-ivory)] tracking-wide">
              Vendor Academy <span className="text-[#c9a35b]">Control</span>
            </h1>
          </div>
          <p className="text-sm text-[var(--color-ivory-muted)]">
            Manage training videos, seller guides, and direct support channels served to partner stores in their vendor portal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-4 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] hover:text-white flex items-center gap-2 transition-all cursor-pointer"
            title="Restore standard 6 lessons"
          >
            <RefreshCw size={14} /> Reset Defaults
          </button>
          <button
            type="button"
            onClick={() => handleOpenModal()}
            className="px-5 py-2.5 rounded-xl bg-gold-gradient text-black font-bold text-xs uppercase tracking-widest hover:brightness-110 shadow-[0_0_15px_rgba(201,163,91,0.3)] flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus size={16} /> New Academy Module
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-3">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-3">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/10 gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('lessons')}
          className={`px-5 py-3 text-xs uppercase tracking-widest font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'lessons'
              ? 'border-[#c9a35b] text-[#c9a35b] bg-white/[0.02]'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <Video size={14} /> Courses & Tutorials ({lessons.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('support')}
          className={`px-5 py-3 text-xs uppercase tracking-widest font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'support'
              ? 'border-[#c9a35b] text-[#c9a35b] bg-white/[0.02]'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <MessageCircle size={14} /> Support Channels
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('appearance')}
          className={`px-5 py-3 text-xs uppercase tracking-widest font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'appearance'
              ? 'border-[#c9a35b] text-[#c9a35b] bg-white/[0.02]'
              : 'border-transparent text-white/50 hover:text-white'
          }`}
        >
          <FileText size={14} /> Academy Settings & Hero
        </button>
      </div>

      {/* TAB 1: LESSONS & COURSES */}
      {activeTab === 'lessons' && (
        <div className="space-y-6">
          {/* Filter / Search bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/[0.02] p-4 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-thin">
              {['All', ...CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#c9a35b] text-black font-bold'
                      : 'bg-black/40 text-white/70 hover:text-white border border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Search module title or topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 px-3.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#c9a35b]"
            />
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-white/50 gap-3">
              <Loader2 size={28} className="animate-spin text-[#c9a35b]" />
              <p className="text-xs uppercase tracking-widest">Loading modules...</p>
            </div>
          ) : filteredLessons.length === 0 ? (
            <div className="p-12 text-center bg-white/[0.01] rounded-2xl border border-white/5">
              <GraduationCap size={40} className="mx-auto text-white/20 mb-3" />
              <h3 className="text-lg font-serif text-white mb-1">No Modules Found</h3>
              <p className="text-xs text-white/50 mb-4">Create your first academy training video or guide for vendors.</p>
              <button
                type="button"
                onClick={() => handleOpenModal()}
                className="px-4 py-2 bg-[#c9a35b] text-black rounded-lg text-xs font-bold uppercase tracking-wider"
              >
                + Add Module
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLessons.map((lesson) => (
                <div
                  key={lesson._id}
                  className="group bg-[#0c0c0c] border border-white/10 hover:border-[#c9a35b]/40 rounded-2xl overflow-hidden transition-all flex flex-col justify-between shadow-lg"
                >
                  <div>
                    {/* Media Thumbnail */}
                    <div className="relative aspect-video bg-black/60 overflow-hidden flex items-center justify-center border-b border-white/5">
                      {lesson.thumbnail ? (
                        <img
                          src={lesson.thumbnail}
                          alt={lesson.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-black to-[#1a150c] flex items-center justify-center">
                          <Video size={36} className="text-white/20" />
                        </div>
                      )}

                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => setPreviewLesson(lesson)}
                          className="w-12 h-12 rounded-full bg-black/70 hover:bg-[#c9a35b] text-white hover:text-black flex items-center justify-center transition-all cursor-pointer shadow-xl group-hover:scale-110"
                          title="Preview module"
                        >
                          <PlayCircle size={24} />
                        </button>
                      </div>

                      {/* Duration Pill */}
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white/90">
                        {lesson.duration || '5:00'}
                      </span>

                      {/* Badge (if any) */}
                      {lesson.badge && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#c9a35b] text-black text-[9px] font-bold uppercase tracking-widest shadow">
                          {lesson.badge}
                        </span>
                      )}

                      {/* Published status */}
                      <button
                        type="button"
                        onClick={() => handleTogglePublished(lesson)}
                        className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest cursor-pointer ${
                          lesson.isPublished
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-red-500/20 text-red-300 border border-red-500/40'
                        }`}
                        title="Click to toggle status"
                      >
                        {lesson.isPublished ? 'Live' : 'Draft'}
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <span className="text-[9px] uppercase tracking-widest text-[#c9a35b] font-bold block mb-1">
                        {lesson.category}
                      </span>
                      <h3 className="text-base font-serif text-white mb-2 leading-snug group-hover:text-[#f5d77f] transition-colors">
                        {lesson.title}
                      </h3>
                      {lesson.description && (
                        <p className="text-xs text-white/60 line-clamp-2 leading-relaxed">
                          {lesson.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="px-5 py-3 border-t border-white/5 bg-black/40 flex items-center justify-between">
                    <span className="text-[10px] text-white/40 font-mono">
                      Order: #{lesson.sortOrder ?? 0}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPreviewLesson(lesson)}
                        className="p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                        title="Preview"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenModal(lesson)}
                        className="p-1.5 text-[#c9a35b] hover:bg-[#c9a35b]/10 rounded-lg transition-colors cursor-pointer"
                        title="Edit Module"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLesson(lesson._id)}
                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete Module"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SUPPORT CHANNELS */}
      {activeTab === 'support' && (
        <form onSubmit={handleSaveConfig} className="max-w-3xl bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-xl font-serif text-white mb-1">Direct Vendor Assistance Channels</h3>
            <p className="text-xs text-white/60">
              Configure the support endpoints displayed at the bottom of the Vendor Academy.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/80 font-bold mb-2 flex items-center gap-2">
                <MessageCircle size={14} className="text-green-400" /> WhatsApp Support Number
              </label>
              <input
                type="text"
                value={config.whatsappNumber}
                onChange={(e) => setConfig({ ...config, whatsappNumber: e.target.value })}
                placeholder="+27 82 123 4567"
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#c9a35b]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-white/80 font-bold mb-2">
                WhatsApp Default Message Pre-fill
              </label>
              <input
                type="text"
                value={config.whatsappMessage}
                onChange={(e) => setConfig({ ...config, whatsappMessage: e.target.value })}
                placeholder="Hello Grand Store Partner Support..."
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#c9a35b]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-white/80 font-bold mb-2 flex items-center gap-2">
                <HelpCircle size={14} className="text-[#c9a35b]" /> Support Ticket URL or Email
              </label>
              <input
                type="text"
                value={config.ticketUrl}
                onChange={(e) => setConfig({ ...config, ticketUrl: e.target.value })}
                placeholder="mailto:partners@grandstoreglobal.com or https://..."
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#c9a35b]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-white/80 font-bold mb-2 flex items-center gap-2">
                <BookOpen size={14} className="text-blue-400" /> Help Centre Docs URL
              </label>
              <input
                type="text"
                value={config.helpCentreUrl}
                onChange={(e) => setConfig({ ...config, helpCentreUrl: e.target.value })}
                placeholder="/glossary or documentation link"
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#c9a35b]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-white/80 font-bold mb-2 flex items-center gap-2">
                <PhoneCall size={14} className="text-purple-400" /> Request Call Phone Number
              </label>
              <input
                type="text"
                value={config.requestCallPhone}
                onChange={(e) => setConfig({ ...config, requestCallPhone: e.target.value })}
                placeholder="+27 11 000 0000"
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#c9a35b]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-gold-gradient text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:brightness-110 flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Support Channels
          </button>
        </form>
      )}

      {/* TAB 3: ACADEMY APPEARANCE & SETTINGS */}
      {activeTab === 'appearance' && (
        <form onSubmit={handleSaveConfig} className="max-w-3xl bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="text-xl font-serif text-white mb-1">Academy Presentation & Sidebar Link</h3>
            <p className="text-xs text-white/60">
              Customize how the academy introduces itself to vendors and how it appears in their left sidebar.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/80 font-bold mb-2">
                Page Main Title
              </label>
              <input
                type="text"
                value={config.heroTitle}
                onChange={(e) => setConfig({ ...config, heroTitle: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#c9a35b]"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-white/80 font-bold mb-2">
                Page Subtitle Description
              </label>
              <textarea
                rows={3}
                value={config.heroSubtitle}
                onChange={(e) => setConfig({ ...config, heroSubtitle: e.target.value })}
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#c9a35b]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/80 font-bold mb-2">
                  Vendor Sidebar Label
                </label>
                <input
                  type="text"
                  value={config.sidebarLabel}
                  onChange={(e) => setConfig({ ...config, sidebarLabel: e.target.value })}
                  placeholder="Vendor Academy"
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#c9a35b]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-white/80 font-bold mb-2">
                  Sidebar Optional Badge (e.g. "New" or "Live")
                </label>
                <input
                  type="text"
                  value={config.sidebarBadge}
                  onChange={(e) => setConfig({ ...config, sidebarBadge: e.target.value })}
                  placeholder="Optional badge"
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#c9a35b]"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.isEnabled}
                  onChange={(e) => setConfig({ ...config, isEnabled: e.target.checked })}
                  className="w-4 h-4 accent-[#c9a35b]"
                />
                <span className="text-xs uppercase tracking-wider text-white font-bold">
                  Enable Vendor Academy in Partner Navigation
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-gold-gradient text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:brightness-110 flex items-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Appearance
          </button>
        </form>
      )}

      {/* CREATE / EDIT LESSON MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0f0f0f] border border-white/20 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
            <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-xl font-serif text-white">
                {editingLesson ? 'Edit Academy Module' : 'Add Academy Module'}
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin">
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/80 font-bold mb-1">
                  Module Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. How to photograph wine bottles"
                  className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#c9a35b]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/80 font-bold mb-1">
                    Curriculum Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#c9a35b] [color-scheme:dark]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/80 font-bold mb-1">
                    Duration (MM:SS)
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="4:12"
                    className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#c9a35b]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-white/80 font-bold mb-1">
                  Video URL (YouTube, Vimeo, or direct MP4 link)
                </label>
                <input
                  type="text"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=... or embed URL"
                  className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#c9a35b]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-white/80 font-bold mb-1">
                  Thumbnail Image URL
                </label>
                <input
                  type="text"
                  value={formData.thumbnail}
                  onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#c9a35b]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/80 font-bold mb-1">
                    Badge / Tag (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="e.g. Essential, Featured, New"
                    className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#c9a35b]"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-white/80 font-bold mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                    className="w-full px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-[#c9a35b]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-white/80 font-bold mb-1">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Summary of what the vendor will learn..."
                  className="w-full px-4 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#c9a35b]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-white/80 font-bold mb-1">
                  Written Guide / Article Notes (Optional)
                </label>
                <textarea
                  rows={4}
                  value={formData.articleContent}
                  onChange={(e) => setFormData({ ...formData, articleContent: e.target.value })}
                  placeholder="Key takeaways, step-by-step instructions..."
                  className="w-full px-4 py-2 bg-black/60 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-[#c9a35b]"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                    className="w-4 h-4 accent-[#c9a35b]"
                  />
                  <span className="text-xs uppercase tracking-wider text-white font-bold">
                    Publish immediately to Vendor Academy
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl text-xs uppercase tracking-widest text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-gold-gradient text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:brightness-110 flex items-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {editingLesson ? 'Update Module' : 'Create Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LESSON PREVIEW MODAL */}
      {previewLesson && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f0f0f] border border-white/20 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-[#c9a35b] font-bold">
                  {previewLesson.category}
                </span>
                <h3 className="text-lg font-serif text-white">{previewLesson.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewLesson(null)}
                className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Video embed / placeholder */}
              <div className="aspect-video bg-black rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
                {previewLesson.videoUrl ? (
                  previewLesson.videoUrl.includes('youtube.com') || previewLesson.videoUrl.includes('youtu.be') ? (
                    <iframe
                      src={
                        previewLesson.videoUrl.includes('embed')
                          ? previewLesson.videoUrl
                          : `https://www.youtube.com/embed/${previewLesson.videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([\w-]{11})/i)?.[1] || ''}`
                      }
                      title={previewLesson.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video src={previewLesson.videoUrl} controls className="w-full h-full object-contain" />
                  )
                ) : (
                  <div className="text-center p-8">
                    <Video size={48} className="mx-auto text-white/20 mb-2" />
                    <p className="text-sm font-serif text-white">No video URL provided</p>
                    <p className="text-xs text-white/40 mt-1">This module currently serves as a written guide.</p>
                  </div>
                )}
              </div>

              {previewLesson.description && (
                <p className="text-sm text-white/80 leading-relaxed">
                  {previewLesson.description}
                </p>
              )}

              {previewLesson.articleContent && (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                  <h4 className="text-xs uppercase tracking-widest text-[#c9a35b] font-bold">Key Guidelines & Takeaways</h4>
                  <p className="text-xs text-white/70 whitespace-pre-line leading-relaxed">
                    {previewLesson.articleContent}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
