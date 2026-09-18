import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, Trash2, Tag, Calendar, Users, X } from "lucide-react";
import Modal from "../../components/ui/Modal";
import api from "../../api";

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ code: "", freeMonths: 1, usageLimit: "" });

  const fetchCoupons = async () => {
    try {
      const { data } = await api.get("/coupons/vendor");
      setCoupons(data);
    } catch (error) {
      console.error("Failed to fetch coupons", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/coupons/vendor", {
        ...formData,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null
      });
      setIsModalOpen(false);
      setFormData({ code: "", freeMonths: 1, usageLimit: "" });
      fetchCoupons();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create coupon");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await api.delete(`/coupons/vendor/${id}`);
      fetchCoupons();
    } catch (error) {
      alert("Failed to delete coupon");
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      await api.put(`/coupons/vendor/${id}`, { isActive: !currentStatus });
      fetchCoupons();
    } catch (error) {
      alert("Failed to update status");
    }
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-light text-white mb-2">Vendor Trial Coupons</h1>
          <p className="text-white/40">Manage free trial codes for new vendors.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#c9a35b] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#d4b069] transition-colors"
        >
          <Plus size={18} />
          Create Coupon
        </button>
      </div>

      <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10 text-white/40 text-sm">
              <th className="p-4 font-medium">CODE</th>
              <th className="p-4 font-medium">FREE MONTHS</th>
              <th className="p-4 font-medium">USAGE</th>
              <th className="p-4 font-medium">STATUS</th>
              <th className="p-4 font-medium text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(coupon => (
              <tr key={coupon._id} className="border-b border-white/10 hover:bg-white/[0.02] transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-2 text-[#c9a35b] font-medium tracking-wide">
                    <Tag size={16} />
                    {coupon.code}
                  </div>
                </td>
                <td className="p-4 text-white/80">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-white/40" />
                    {coupon.freeMonths} Months
                  </div>
                </td>
                <td className="p-4 text-white/80">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-white/40" />
                    {coupon.usedCount} / {coupon.usageLimit || '∞'}
                  </div>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => toggleStatus(coupon._id, coupon.isActive)}
                    className={`px-3 py-1 rounded text-xs uppercase tracking-wider font-bold ${
                      coupon.isActive 
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                    }`}
                  >
                    {coupon.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => handleDelete(coupon._id)}
                    className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-white/40">
                  No coupons found. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="bg-[#111] border border-white/10 p-6 rounded-xl w-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-light text-white">Create Coupon</h2>
            <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Coupon Code</label>
              <input 
                type="text" 
                required
                placeholder="e.g. SUMMER2026"
                value={formData.code}
                onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                className="w-full bg-[#050505] border border-white/10 rounded-lg px-4 py-2.5 text-white uppercase"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Free Trial Duration (Months)</label>
              <input 
                type="number" 
                required
                min="1"
                value={formData.freeMonths}
                onChange={e => setFormData({...formData, freeMonths: parseInt(e.target.value)})}
                className="w-full bg-[#050505] border border-white/10 rounded-lg px-4 py-2.5 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Usage Limit (Optional)</label>
              <input 
                type="number" 
                min="1"
                placeholder="Leave blank for unlimited"
                value={formData.usageLimit}
                onChange={e => setFormData({...formData, usageLimit: e.target.value})}
                className="w-full bg-[#050505] border border-white/10 rounded-lg px-4 py-2.5 text-white"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-[#c9a35b] text-black font-medium py-3 rounded-lg mt-6 hover:bg-[#d4b069] transition-colors"
            >
              Create Coupon
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
}
