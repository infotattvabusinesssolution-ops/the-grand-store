import React, { useEffect, useState } from "react";
import api from '../../api';
import { useAuth } from "../../context/AuthContext";
import { Search, Plus, Edit2, Trash2 } from "lucide-react";
import Price from '../../components/ui/Price';

export default function AdminAccessories() {
  const { user } = useAuth();
  const [accessories, setAccessories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    stock: "0"
  });

  const goldText = "text-[#c9a35b]";

  const fetchAccessories = async () => {
    try {
      const res = await api.get(`/products?type=accessory`);
      setAccessories(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccessories();
  }, []);

  const handleOpenModal = (acc = null) => {
    if (acc) {
      setEditingId(acc.id);
      setFormData({
        name: acc.name || "",
        description: acc.description || "",
        price: acc.price || "",
        image: acc.image || "",
        stock: acc.stock?.toString() || "0"
      });
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        image: "",
        stock: "0"
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        type: 'accessory',
        description: formData.description,
        price: formData.price,
        image: formData.image,
        stock: parseInt(formData.stock)
      };

      if (editingId) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/products/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/products`, payload, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
      }
      setShowModal(false);
      fetchAccessories();
    } catch (err) {
      console.error(err);
      alert("Failed to save accessory");
    }
  };

  const filtered = accessories.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto pb-10">
      <section className="flex justify-between items-end">
        <div>
          <h1 className="text-[var(--color-ivory)] font-serif text-5xl mb-4 leading-tight">
            Accessories <span className={goldText}>Manager</span>
          </h1>
          <p className="text-[var(--color-ivory-muted)] text-lg font-light">
            Manage physical internal products (e.g., glassware) sold directly by the platform.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-6 py-3 bg-[var(--color-gold)] text-black font-semibold rounded-lg hover:bg-yellow-600 transition flex items-center gap-2"
        >
          <Plus size={18} /> Add Accessory
        </button>
      </section>

      <div className="flex items-center gap-2 bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 w-full md:w-96">
        <Search size={16} className="text-[var(--color-ivory-muted)]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search accessories by name..."
          className="bg-transparent text-sm text-white outline-none placeholder:text-white/30 w-full"
        />
      </div>

      <div className="overflow-x-auto bg-[#0a0a0a] border border-white/5 rounded-2xl">
        {loading ? (
          <div className="p-12 text-center text-[var(--color-ivory-muted)] animate-pulse">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-ivory-muted)]">No accessories found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] bg-black/20">
                <th className="py-4 pl-6 font-semibold w-16">Image</th>
                <th className="py-4 font-semibold">Name</th>
                <th className="py-4 font-semibold">Price</th>
                <th className="py-4 font-semibold">Stock</th>
                <th className="py-4 font-semibold text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((acc) => (
                <tr key={acc.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 pl-6">
                    {acc.image ? (
                      <img src={acc.image} alt={acc.name} className="w-10 h-10 object-cover rounded border border-white/10" />
                    ) : (
                      <div className="w-10 h-10 bg-white/5 rounded border border-white/10 flex items-center justify-center text-xs text-white/30">N/A</div>
                    )}
                  </td>
                  <td className="py-4 text-sm text-[var(--color-ivory)] font-serif">{acc.name}</td>
                  <td className="py-4 text-sm text-[var(--color-gold)] font-mono"><Price amount={acc.price} /></td>
                  <td className="py-4 text-sm text-white/70">{acc.stock}</td>
                  <td className="py-4 pr-6 text-right space-x-3">
                    <button onClick={() => handleOpenModal(acc)} className="text-white/50 hover:text-white transition">
                      <Edit2 size={16} />
                    </button>
                    <button className="text-white/50 hover:text-red-400 transition">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg p-6 overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-serif text-[var(--color-ivory)] mb-6">
              {editingId ? "Edit Accessory" : "Add Accessory"}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-3 text-white text-sm" placeholder="e.g. Arcoroc Hi Ball Glass" />
              </div>
              
              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Image URL</label>
                <input value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-3 text-white text-sm" placeholder="https://..." />
                <p className="text-[10px] text-white/40 mt-1">Provide a direct link to the image (e.g. from an image hosting service or your site).</p>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Price (R)</label>
                  <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-3 text-white text-sm" placeholder="199.99" />
                </div>
                <div className="flex-1">
                  <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Stock</label>
                  <input required type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-3 text-white text-sm" placeholder="50" />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-white/50 mb-1">Description (HTML allowed)</label>
                <textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded p-3 text-white text-sm" placeholder="Product details..." />
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/10">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 text-white/60 hover:text-white transition text-sm">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-[var(--color-gold)] text-black font-semibold rounded text-sm hover:bg-yellow-600 transition">Save Accessory</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
