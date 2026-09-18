import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, BookOpen, Loader2, Sparkles, Star, Calendar, Clock, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../api'

export default function AdminBlogs({ onNotify }) {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentId, setCurrentId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    titleBefore: '',
    titleAccent: '',
    titleAfter: '',
    slug: '',
    category: 'The Grand Edit',
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    readTime: '5 min read',
    image: '',
    excerpt: '',
    content: '',
    order: 0,
    isVisible: true,
    isFeatured: false,
  })

  const notify = (message, type = 'success') => {
    if (typeof onNotify === 'function') {
      onNotify(message, type)
    } else {
      alert(message)
    }
  }

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      const res = await api.get('/blogs/admin/all')
      setBlogs(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      console.error('Failed to fetch blogs:', error)
      notify('Failed to load blog posts', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBlogs()
  }, [])

  const generateSlug = (text) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }
      if (name === 'title' && !editMode && (!prev.slug || prev.slug === generateSlug(prev.title))) {
        updated.slug = generateSlug(value)
      }
      return updated
    })
  }

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditMode(true)
      setCurrentId(item._id)
      setFormData({
        title: item.title || '',
        titleBefore: item.titleBefore || '',
        titleAccent: item.titleAccent || '',
        titleAfter: item.titleAfter || '',
        slug: item.slug || '',
        category: item.category || 'The Grand Edit',
        date: item.date || '',
        readTime: item.readTime || '5 min read',
        image: item.image || '',
        excerpt: item.excerpt || '',
        content: item.content || '',
        order: item.order ?? 0,
        isVisible: item.isVisible !== false,
        isFeatured: Boolean(item.isFeatured),
      })
    } else {
      setEditMode(false)
      setCurrentId(null)
      const nowFormatted = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      setFormData({
        title: '',
        titleBefore: '',
        titleAccent: '',
        titleAfter: '',
        slug: '',
        category: 'The Grand Edit',
        date: nowFormatted,
        readTime: '5 min read',
        image: '',
        excerpt: '',
        content: '',
        order: blogs.length,
        isVisible: true,
        isFeatured: false,
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editMode) {
        await api.put(`/blogs/${currentId}`, formData)
        notify('Blog post updated successfully')
      } else {
        await api.post('/blogs', formData)
        notify('Blog post created successfully')
      }
      setShowModal(false)
      fetchBlogs()
    } catch (error) {
      console.error('Error saving blog post:', error)
      notify(error.response?.data?.message || 'Failed to save blog post', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await api.delete(`/blogs/${id}`)
        notify('Blog post deleted')
        fetchBlogs()
      } catch (error) {
        console.error('Error deleting blog post:', error)
        notify(error.response?.data?.message || 'Failed to delete blog post', 'error')
      }
    }
  }

  const toggleVisibility = async (item) => {
    try {
      const updated = !item.isVisible
      await api.put(`/blogs/${item._id}`, { isVisible: updated })
      setBlogs((prev) =>
        prev.map((b) => (b._id === item._id ? { ...b, isVisible: updated } : b))
      )
      notify(`Article is now ${updated ? 'visible' : 'hidden'}`)
    } catch (error) {
      console.error('Error updating visibility:', error)
      notify('Failed to update visibility', 'error')
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-serif text-[var(--color-ivory)] flex items-center gap-2">
            <BookOpen className="text-[var(--color-gold)]" /> Journal & Blog Posts
          </h1>
          <p className="text-sm text-[var(--color-ivory-muted)] mt-1">
            Publish and curate stories from the cellar featured in the "Explore the Journal" section on the homepage.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-gold)] text-black font-semibold rounded-xl hover:brightness-110 transition-all self-start sm:self-auto text-sm"
        >
          <Plus size={18} /> Add New Article
        </button>
      </div>

      <div className="bg-[#14120e] border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-[var(--color-gold)]">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center p-12 text-[var(--color-ivory-muted)]">
            <Sparkles className="mx-auto mb-3 text-[var(--color-gold)] opacity-40" size={36} />
            <p className="text-base font-serif text-white">No articles published yet</p>
            <p className="text-xs mt-1">Click the button above to publish your first story.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-black/40 text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)]">
                  <th className="p-4">Article</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Published</th>
                  <th className="p-4 text-center">Order</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {blogs.map((item) => (
                  <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-12 rounded-lg overflow-hidden bg-black/60 border border-white/10 shrink-0">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-white/30">
                              No image
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-sm flex items-center gap-2">
                            <span>{item.title}</span>
                            {item.isFeatured && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wider bg-[#d8b56c]/20 text-[#dfbd72] px-1.5 py-0.5 rounded border border-[#dfbd72]/30">
                                <Star size={9} fill="currentColor" /> Featured
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[var(--color-ivory-muted)] line-clamp-1 max-w-sm">
                            {item.excerpt}
                          </div>
                          <div className="text-[11px] text-white/40 mt-0.5 font-mono">
                            /blog/{item.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-serif italic text-[#c9bda9]">
                      {item.category || 'General'}
                    </td>
                    <td className="p-4 text-xs text-[var(--color-ivory-muted)]">
                      <div className="flex items-center gap-1.5 text-white/70">
                        <Calendar size={12} /> {item.date || '—'}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-white/40 mt-0.5">
                        <Clock size={11} /> {item.readTime || '—'}
                      </div>
                    </td>
                    <td className="p-4 text-xs text-center text-white/70">
                      {item.order ?? 0}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleVisibility(item)}
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border ${
                          item.isVisible
                            ? 'bg-green-900/30 border-green-500/30 text-green-400'
                            : 'bg-red-900/30 border-red-500/30 text-red-400'
                        }`}
                      >
                        {item.isVisible ? (
                          <>
                            <Eye size={12} /> Visible
                          </>
                        ) : (
                          <>
                            <EyeOff size={12} /> Hidden
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/blog/${item.slug}`}
                          target="_blank"
                          className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                          title="View on site"
                        >
                          <ExternalLink size={16} />
                        </Link>
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-2 hover:bg-white/10 rounded-lg text-blue-400 transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id, item.title)}
                          className="p-2 hover:bg-white/10 rounded-lg text-red-400 transition-colors"
                          title="Delete"
                        >
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
          <div className="bg-[#14120e] border border-white/10 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#14120e] z-10">
              <h2 className="text-xl font-serif text-[var(--color-ivory)] uppercase tracking-widest">
                {editMode ? 'Edit Article' : 'New Article'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">
                  Full Article Title *
                </label>
                <input
                  required
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Top 10 Must-Try Premium Liquors Available at The Grand Store"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[var(--color-gold)]"
                />
              </div>

              <div className="p-4 bg-black/30 border border-white/5 rounded-xl">
                <div className="text-xs uppercase tracking-widest text-[var(--color-gold)] mb-2 font-semibold">
                  Gold Accent Headline Breakdown (Optional)
                </div>
                <p className="text-[11px] text-[var(--color-ivory-muted)] mb-3">
                  Allows highlighting key words in shimmering gold on the homepage editorial grid.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1">
                      Text Before Accent
                    </label>
                    <input
                      name="titleBefore"
                      value={formData.titleBefore}
                      onChange={handleInputChange}
                      placeholder="e.g. Top 10 Must-Try "
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[var(--color-gold)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-[var(--color-gold)] mb-1">
                      Golden Accent Phrase
                    </label>
                    <input
                      name="titleAccent"
                      value={formData.titleAccent}
                      onChange={handleInputChange}
                      placeholder="e.g. Premium Liquors"
                      className="w-full bg-black/60 border border-[var(--color-gold)]/40 rounded-lg px-3 py-1.5 text-xs text-[#dfbd72] outline-none focus:border-[var(--color-gold)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-white/50 mb-1">
                      Text After Accent
                    </label>
                    <input
                      name="titleAfter"
                      value={formData.titleAfter}
                      onChange={handleInputChange}
                      placeholder="e.g.  Available at Store"
                      className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-[var(--color-gold)]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">
                    Slug (URL Key) *
                  </label>
                  <input
                    required
                    name="slug"
                    value={formData.slug}
                    onChange={handleInputChange}
                    placeholder="top-10-must-try-premium-liquors"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white font-mono text-xs outline-none focus:border-[var(--color-gold)]"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">
                    Category *
                  </label>
                  <input
                    required
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="e.g. The Grand Edit, Whisky Journal, Brandy Journal"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[var(--color-gold)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">
                    Display Date
                  </label>
                  <input
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    placeholder="e.g. 14 Apr 2025"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[var(--color-gold)]"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">
                    Read Time
                  </label>
                  <input
                    name="readTime"
                    value={formData.readTime}
                    onChange={handleInputChange}
                    placeholder="e.g. 5 min read"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[var(--color-gold)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">
                  Cover Image URL / Asset Path *
                </label>
                <input
                  required
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="/assets/blogs/premium-liquors.jpg"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[var(--color-gold)]"
                />
                {formData.image && (
                  <div className="mt-2 w-36 h-24 rounded-lg overflow-hidden border border-white/10 bg-black/40">
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">
                  Excerpt (Summary) *
                </label>
                <textarea
                  required
                  rows={2}
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleInputChange}
                  placeholder="Short editorial teaser displayed under the title on the homepage..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[var(--color-gold)]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">
                  Full Article Body (Optional / Markdown or HTML)
                </label>
                <textarea
                  rows={6}
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Full text of the blog article..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[var(--color-gold)] font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="order"
                    value={formData.order}
                    onChange={handleInputChange}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[var(--color-gold)]"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-sm text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="isVisible"
                      checked={formData.isVisible}
                      onChange={handleInputChange}
                      className="rounded accent-[var(--color-gold)] w-4 h-4"
                    />
                    <span>Visible on Website</span>
                  </label>
                </div>
                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-sm text-white cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleInputChange}
                      className="rounded accent-[var(--color-gold)] w-4 h-4"
                    />
                    <span>Featured Article</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 rounded-xl border border-white/10 text-white hover:bg-white/5 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2 bg-[var(--color-gold)] text-black font-semibold rounded-xl hover:brightness-110 transition-all text-sm disabled:opacity-50"
                >
                  {submitting && <Loader2 className="animate-spin" size={16} />}
                  {editMode ? 'Save Changes' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
