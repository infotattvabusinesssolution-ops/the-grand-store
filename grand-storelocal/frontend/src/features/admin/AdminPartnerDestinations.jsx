import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, ExternalLink, Compass, Loader2, Sparkles } from 'lucide-react'
import api from '../../api'

export default function AdminPartnerDestinations({ onNotify }) {
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [currentId, setCurrentId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    eyebrow: '',
    description: '',
    href: '',
    image: '',
    label: 'Explore the club',
    order: 0,
    isVisible: true,
  })

  const notify = (message, type = 'success') => {
    if (typeof onNotify === 'function') {
      onNotify(message, type)
    } else {
      alert(message)
    }
  }

  const fetchDestinations = async () => {
    try {
      setLoading(true)
      const res = await api.get('/partners/admin')
      setDestinations(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      console.error('Failed to fetch partner destinations:', error)
      notify('Failed to load partner destinations', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDestinations()
  }, [])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditMode(true)
      setCurrentId(item._id)
      setFormData({
        title: item.title || '',
        eyebrow: item.eyebrow || '',
        description: item.description || '',
        href: item.href || '',
        image: item.image || '',
        label: item.label || 'Explore the club',
        order: item.order ?? 0,
        isVisible: item.isVisible !== false,
      })
    } else {
      setEditMode(false)
      setCurrentId(null)
      setFormData({
        title: '',
        eyebrow: '',
        description: '',
        href: '',
        image: '',
        label: 'Explore the club',
        order: destinations.length,
        isVisible: true,
      })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (editMode) {
        await api.put(`/partners/${currentId}`, formData)
        notify('Partner destination updated successfully')
      } else {
        await api.post('/partners', formData)
        notify('Partner destination created successfully')
      }
      setShowModal(false)
      fetchDestinations()
    } catch (error) {
      console.error('Error saving partner destination:', error)
      notify(error.response?.data?.message || 'Failed to save partner destination', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await api.delete(`/partners/${id}`)
        notify('Partner destination deleted')
        fetchDestinations()
      } catch (error) {
        console.error('Error deleting partner destination:', error)
        notify(error.response?.data?.message || 'Failed to delete partner destination', 'error')
      }
    }
  }

  const toggleVisibility = async (item) => {
    try {
      const updated = !item.isVisible
      await api.put(`/partners/${item._id}`, { isVisible: updated })
      setDestinations((prev) =>
        prev.map((d) => (d._id === item._id ? { ...d, isVisible: updated } : d))
      )
      notify(`Destination is now ${updated ? 'visible' : 'hidden'}`)
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
            <Compass className="text-[var(--color-gold)]" /> Partner Destinations
          </h1>
          <p className="text-sm text-[var(--color-ivory-muted)] mt-1">
            Manage luxury partner houses featured in the "Partner Destinations" section of the store homepage.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--color-gold)] text-black font-semibold rounded-xl hover:brightness-110 transition-all self-start sm:self-auto text-sm"
        >
          <Plus size={18} /> Add Partner Destination
        </button>
      </div>

      <div className="bg-[#14120e] border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-[var(--color-gold)]">
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : destinations.length === 0 ? (
          <div className="text-center p-12 text-[var(--color-ivory-muted)]">
            <Sparkles className="mx-auto mb-3 text-[var(--color-gold)] opacity-40" size={36} />
            <p className="text-base font-serif text-white">No partner destinations found</p>
            <p className="text-xs mt-1">Click the button above to add your first partner house.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-black/40 text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)]">
                  <th className="p-4">Destination</th>
                  <th className="p-4">Eyebrow</th>
                  <th className="p-4">Link URL</th>
                  <th className="p-4 text-center">Order</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {destinations.map((item) => (
                  <tr key={item._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-black/60 border border-white/10 shrink-0">
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
                          <div className="font-semibold text-white text-sm">{item.title}</div>
                          <div className="text-xs text-[var(--color-ivory-muted)] line-clamp-1 max-w-sm">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-[var(--color-gold)]">
                      {item.eyebrow || '—'}
                    </td>
                    <td className="p-4 text-xs text-[var(--color-ivory-muted)]">
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 underline"
                      >
                        <span className="max-w-[200px] truncate">{item.href}</span>
                        <ExternalLink size={12} />
                      </a>
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
          <div className="bg-[#14120e] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-[#14120e] z-10">
              <h2 className="text-xl font-serif text-[var(--color-ivory)] uppercase tracking-widest">
                {editMode ? 'Edit Partner Destination' : 'Add Partner Destination'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">
                    Title *
                  </label>
                  <input
                    required
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Cigar Connoisseur Club"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[var(--color-gold)]"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">
                    Eyebrow *
                  </label>
                  <input
                    required
                    name="eyebrow"
                    value={formData.eyebrow}
                    onChange={handleInputChange}
                    placeholder="e.g. The Smoking Room"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[var(--color-gold)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="e.g. African tobacco, rich heritage, and exceptional cigars for the considered collector."
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[var(--color-gold)]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">
                    Destination URL (Href) *
                  </label>
                  <input
                    required
                    type="url"
                    name="href"
                    value={formData.href}
                    onChange={handleInputChange}
                    placeholder="https://cigar.yogapranafitness.com/"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[var(--color-gold)]"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">
                    Button Label
                  </label>
                  <input
                    name="label"
                    value={formData.label}
                    onChange={handleInputChange}
                    placeholder="e.g. Explore the club"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[var(--color-gold)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--color-ivory-muted)] mb-1">
                  Image URL / Asset Path *
                </label>
                <input
                  required
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="/assets/partners/cigar-connoisseur.webp"
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-[var(--color-gold)]"
                />
                {formData.image && (
                  <div className="mt-2 w-32 h-20 rounded-lg overflow-hidden border border-white/10 bg-black/40">
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

              <div className="grid grid-cols-2 gap-4">
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
                <div className="flex items-center pt-6">
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
                  {editMode ? 'Save Changes' : 'Create Destination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
