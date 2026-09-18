import React, { useEffect, useState } from "react";
import api from '../../api';
import { useAuth } from "../../context/AuthContext";
import { Search, Shield, User as UserIcon, Plus, Edit2 } from "lucide-react";

export default function AdminStaff() {
  const { user } = useAuth();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ id: null, name: "", email: "", role: "accountant", password: "" });
  const [message, setMessage] = useState("");

  const goldText = "text-[#c9a35b]";

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/staff`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setStaff(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [user]);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
      case 'super_admin': return <span className="px-2 py-1 bg-[var(--color-gold)]/20 text-[var(--color-gold)] border border-[var(--color-gold)]/30 rounded text-[10px] uppercase font-bold tracking-widest flex items-center gap-1 w-max"><Shield size={12}/> Admin</span>;
      case 'accountant': return <span className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded text-[10px] uppercase font-bold tracking-widest flex items-center gap-1 w-max"><Shield size={12}/> Accountant</span>;
      case 'product_manager': return <span className="px-2 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded text-[10px] uppercase font-bold tracking-widest flex items-center gap-1 w-max"><Shield size={12}/> Product Manager</span>;
      default: return <span className="px-2 py-1 bg-white/5 text-white/50 border border-white/10 rounded text-[10px] uppercase font-bold tracking-widest flex items-center gap-1 w-max"><UserIcon size={12}/> Staff</span>;
    }
  };

  const filtered = staff.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      if (formData.id) {
        // Update
        await api.put(`/admin/staff/${formData.id}`, formData, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setMessage("Staff updated successfully.");
      } else {
        // Create
        await api.post(`/admin/staff`, formData, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setMessage("Staff created successfully.");
      }
      fetchStaff();
      setTimeout(() => setIsModalOpen(false), 1500);
    } catch (err) {
      setMessage(err.response?.data?.message || "An error occurred.");
    }
  };

  const openEditModal = (staffMember) => {
    setFormData({
      id: staffMember._id,
      name: staffMember.name,
      email: staffMember.email,
      role: staffMember.role,
      password: ""
    });
    setMessage("");
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setFormData({ id: null, name: "", email: "", role: "accountant", password: "" });
    setMessage("");
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto pb-10">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[var(--color-ivory)] font-serif text-5xl mb-4 leading-tight">
            Staff <span className={goldText} >Directory</span>
          </h1>
          <p className="text-[var(--color-ivory-muted)] text-lg font-light">
            Manage roles and access for internal staff members.
          </p>
        </div>
        <button onClick={openCreateModal} className="bg-[var(--color-gold)] text-black px-4 py-2 rounded uppercase tracking-widest text-xs font-bold hover:bg-white transition-colors flex items-center gap-2 h-max">
          <Plus size={16} /> New Staff
        </button>
      </section>

      <div className="flex items-center gap-2 bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 w-full md:w-96">
        <Search size={16} className="text-[var(--color-ivory-muted)]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or role..."
          className="bg-transparent text-sm text-white outline-none placeholder:text-white/30 w-full"
        />
      </div>

      <div className="overflow-x-auto bg-[#0a0a0a] border border-white/5 rounded-2xl">
        {loading ? (
          <div className="p-12 text-center text-[var(--color-ivory-muted)] animate-pulse">Loading staff...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-ivory-muted)]">No staff members found.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-[var(--color-ivory-muted)] bg-black/20">
                <th className="py-4 pl-6 font-semibold">Name</th>
                <th className="py-4 font-semibold">Email</th>
                <th className="py-4 font-semibold">Role</th>
                <th className="py-4 font-semibold text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 pl-6 text-sm text-[var(--color-ivory)] font-serif">{u.name}</td>
                  <td className="py-4 text-sm text-[var(--color-ivory-muted)]">{u.email}</td>
                  <td className="py-4">{getRoleBadge(u.role)}</td>
                  <td className="py-4 text-right pr-6">
                    <button onClick={() => openEditModal(u)} className="text-[var(--color-ivory-muted)] hover:text-white transition-colors p-2">
                      <Edit2 size={16} />
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
            <h2 className="text-2xl font-serif text-white mb-6">{formData.id ? "Edit Staff" : "Add New Staff"}</h2>
            {message && <p className="text-yellow-500 text-sm mb-4">{message}</p>}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1">Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-[var(--color-gold)] transition-colors" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1">Email</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-black border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-[var(--color-gold)] transition-colors" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1">Role</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-black border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-[var(--color-gold)] transition-colors appearance-none">
                  <option value="accountant">Accountant</option>
                  <option value="product_manager">Product Manager</option>
                  <option value="admin">System Administrator</option>
                </select>
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-gray-400 mb-1">
                  {formData.id ? "New Password (Optional)" : "Password"}
                </label>
                <input type="password" required={!formData.id} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-black border border-white/10 rounded px-3 py-2 text-white outline-none focus:border-[var(--color-gold)] transition-colors" />
              </div>
              <div className="flex justify-end gap-2 mt-4">
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
