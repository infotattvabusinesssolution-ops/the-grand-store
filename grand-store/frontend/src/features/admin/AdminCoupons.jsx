import React, { useState, useEffect } from "react";
import { Plus, Trash2, Tag, Calendar, Users, X, ShoppingBag, Check, Search, ShieldCheck } from "lucide-react";
import Modal from "../../components/ui/Modal";
import api from "../../api";

export default function AdminCoupons() {
  const [activeTab, setActiveTab] = useState("customer"); // 'customer' | 'vendor'
  const [loading, setLoading] = useState(true);

  // Customer Product Vouchers State
  const [customerCoupons, setCustomerCoupons] = useState([]);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerFormData, setCustomerFormData] = useState({
    code: "",
    title: "",
    discountType: "percentage",
    discountValue: "10",
    expiryDays: "14",
    minSpendZar: "",
    usageLimit: ""
  });
  const [adminProducts, setAdminProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);

  // Vendor Trial Coupons State
  const [vendorCoupons, setVendorCoupons] = useState([]);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorFormData, setVendorFormData] = useState({ code: "", freeMonths: 1, usageLimit: "" });

  const fetchAllCoupons = async () => {
    try {
      setLoading(true);
      const [custRes, vendRes] = await Promise.all([
        api.get("/coupons/admin-product").catch(() => ({ data: { coupons: [] } })),
        api.get("/coupons/vendor").catch(() => ({ data: [] }))
      ]);

      if (custRes.data && custRes.data.coupons) {
        setCustomerCoupons(custRes.data.coupons);
      }
      if (Array.isArray(vendRes.data)) {
        setVendorCoupons(vendRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch coupons", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminProducts = async () => {
    try {
      const res = await api.get("/coupons/eligible-admin-products");
      if (res.data && res.data.products) {
        setAdminProducts(res.data.products);
      }
    } catch (error) {
      console.error("Failed to fetch admin products", error);
    }
  };

  useEffect(() => {
    fetchAllCoupons();
    fetchAdminProducts();
  }, []);

  // --- Customer Product Voucher Handlers ---
  const handleCreateCustomerCoupon = async (e) => {
    e.preventDefault();
    if (!customerFormData.code.trim()) {
      alert("Coupon code is required");
      return;
    }
    if (!customerFormData.discountValue || Number(customerFormData.discountValue) <= 0) {
      alert("A valid discount value is required");
      return;
    }

    try {
      const expiryDate = new Date(Date.now() + Number(customerFormData.expiryDays || 14) * 24 * 60 * 60 * 1000);
      await api.post("/coupons/admin-product", {
        code: customerFormData.code.trim().toUpperCase(),
        title: customerFormData.title.trim(),
        discountType: customerFormData.discountType,
        discountValue: Number(customerFormData.discountValue),
        expiryDate: expiryDate.toISOString(),
        productIds: selectedProductIds,
        minSpendZar: customerFormData.minSpendZar ? Number(customerFormData.minSpendZar) : 0,
        usageLimit: customerFormData.usageLimit ? Number(customerFormData.usageLimit) : null
      });

      setIsCustomerModalOpen(false);
      setCustomerFormData({
        code: "",
        title: "",
        discountType: "percentage",
        discountValue: "10",
        expiryDays: "14",
        minSpendZar: "",
        usageLimit: ""
      });
      setSelectedProductIds([]);
      fetchAllCoupons();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create customer product coupon");
    }
  };

  const toggleCustomerCoupon = async (id) => {
    try {
      await api.put(`/coupons/admin-product/${id}/toggle`);
      fetchAllCoupons();
    } catch (error) {
      alert("Failed to toggle coupon status");
    }
  };

  const handleDeleteCustomerCoupon = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer voucher?")) return;
    try {
      await api.delete(`/coupons/admin-product/${id}`);
      fetchAllCoupons();
    } catch (error) {
      alert("Failed to delete coupon");
    }
  };

  // --- Vendor Trial Coupon Handlers ---
  const handleCreateVendorCoupon = async (e) => {
    e.preventDefault();
    try {
      await api.post("/coupons/vendor", {
        ...vendorFormData,
        usageLimit: vendorFormData.usageLimit ? parseInt(vendorFormData.usageLimit) : null
      });
      setIsVendorModalOpen(false);
      setVendorFormData({ code: "", freeMonths: 1, usageLimit: "" });
      fetchAllCoupons();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create vendor coupon");
    }
  };

  const toggleVendorCoupon = async (id, currentStatus) => {
    try {
      await api.put(`/coupons/vendor/${id}`, { isActive: !currentStatus });
      fetchAllCoupons();
    } catch (error) {
      alert("Failed to update status");
    }
  };

  const handleDeleteVendorCoupon = async (id) => {
    if (!window.confirm("Are you sure you want to delete this vendor coupon?")) return;
    try {
      await api.delete(`/coupons/vendor/${id}`);
      fetchAllCoupons();
    } catch (error) {
      alert("Failed to delete coupon");
    }
  };

  const filteredAdminProducts = adminProducts.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(productSearch.toLowerCase()))
  );

  if (loading) return <div className="p-8 text-white">Loading promo & coupon engine...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-light text-white mb-1">Promotional Vouchers & Coupons</h1>
          <p className="text-white/40 text-sm">
            Manage customer promo codes for Grand Store Admin bottles, plus vendor trial subscriptions.
          </p>
        </div>

        {activeTab === "customer" ? (
          <button
            onClick={() => setIsCustomerModalOpen(true)}
            className="flex items-center gap-2 bg-[#c9a35b] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#d4b069] transition-colors cursor-pointer"
          >
            <Plus size={18} />
            Create Customer Voucher
          </button>
        ) : (
          <button
            onClick={() => setIsVendorModalOpen(true)}
            className="flex items-center gap-2 bg-[#c9a35b] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#d4b069] transition-colors cursor-pointer"
          >
            <Plus size={18} />
            Create Vendor Trial Coupon
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-white/10 mb-6 text-sm">
        <button
          onClick={() => setActiveTab("customer")}
          className={`pb-3 px-1 font-medium transition-colors cursor-pointer border-b-2 ${
            activeTab === "customer"
              ? "border-[#c9a35b] text-[#c9a35b]"
              : "border-transparent text-white/50 hover:text-white"
          }`}
        >
          Customer Product Vouchers ({customerCoupons.length})
        </button>
        <button
          onClick={() => setActiveTab("vendor")}
          className={`pb-3 px-1 font-medium transition-colors cursor-pointer border-b-2 ${
            activeTab === "vendor"
              ? "border-[#c9a35b] text-[#c9a35b]"
              : "border-transparent text-white/50 hover:text-white"
          }`}
        >
          Vendor Trial Coupons ({vendorCoupons.length})
        </button>
      </div>

      {/* TAB 1: CUSTOMER PRODUCT VOUCHERS (ADMIN PRODUCTS ONLY) */}
      {activeTab === "customer" && (
        <div className="space-y-4">
          <div className="bg-[#0a0a0a] border border-white/10 p-4 rounded-xl flex items-center justify-between text-xs text-white/70">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#c9a35b]" />
              <span>
                <strong>Admin Product Guard:</strong> Customer vouchers can only be applied to direct Grand Store inventory ({adminProducts.length} bottles). 3rd-party vendor items are strictly excluded.
              </span>
            </div>
            <span className="text-[#c9a35b] font-medium">Syncs with Web & Mobile App</span>
          </div>

          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-white/40 text-xs">
                  <th className="p-4 font-medium">VOUCHER CODE</th>
                  <th className="p-4 font-medium">TARGETED ADMIN BOTTLES</th>
                  <th className="p-4 font-medium">DISCOUNT</th>
                  <th className="p-4 font-medium">USAGE / CAP</th>
                  <th className="p-4 font-medium">EXPIRY</th>
                  <th className="p-4 font-medium">STATUS</th>
                  <th className="p-4 font-medium text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {customerCoupons.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-[#c9a35b] font-mono font-bold tracking-wider">
                        <Tag size={15} />
                        {coupon.code}
                      </div>
                      {coupon.title && (
                        <p className="text-white/40 text-xs mt-0.5">{coupon.title}</p>
                      )}
                    </td>
                    <td className="p-4">
                      {coupon.applicableProducts && coupon.applicableProducts.length > 0 ? (
                        <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                          {coupon.applicableProducts.map((p, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-xs text-white/80"
                            >
                              {p.image && <img src={p.image} alt={p.name} className="w-3.5 h-4 object-contain" />}
                              <span className="max-w-[120px] truncate">{p.name}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-white/40 italic text-xs">All Admin Bottles</span>
                      )}
                    </td>
                    <td className="p-4 text-white font-medium">
                      {coupon.discountType === "percentage" ? `${coupon.discountValue}% OFF` : `R ${coupon.discountValue} OFF`}
                    </td>
                    <td className="p-4 text-white/80 font-mono">
                      {coupon.usedCount || 0} / {coupon.usageLimit || "∞"}
                    </td>
                    <td className="p-4 text-white/60 text-xs">
                      {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : "No expiry"}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleCustomerCoupon(coupon._id)}
                        className={`px-3 py-1 rounded text-xs uppercase tracking-wider font-bold cursor-pointer transition-colors ${
                          coupon.isActive
                            ? "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                        }`}
                      >
                        {coupon.isActive ? "Active" : "Paused"}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteCustomerCoupon(coupon._id)}
                        className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete Voucher"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {customerCoupons.length === 0 && (
                  <tr>
                    <td colSpan="7" className="p-12 text-center text-white/40">
                      No customer product vouchers found. Create one to issue a discount code.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: VENDOR TRIAL COUPONS (PRESERVED) */}
      {activeTab === "vendor" && (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-white/40 text-xs">
                <th className="p-4 font-medium">CODE</th>
                <th className="p-4 font-medium">FREE MONTHS</th>
                <th className="p-4 font-medium">USAGE</th>
                <th className="p-4 font-medium">STATUS</th>
                <th className="p-4 font-medium text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {vendorCoupons.map((coupon) => (
                <tr key={coupon._id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-[#c9a35b] font-mono font-medium tracking-wide">
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
                      {coupon.usedCount} / {coupon.usageLimit || "∞"}
                    </div>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => toggleVendorCoupon(coupon._id, coupon.isActive)}
                      className={`px-3 py-1 rounded text-xs uppercase tracking-wider font-bold cursor-pointer transition-colors ${
                        coupon.isActive
                          ? "bg-green-500/10 text-green-500 border border-green-500/20"
                          : "bg-red-500/10 text-red-500 border border-red-500/20"
                      }`}
                    >
                      {coupon.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDeleteVendorCoupon(coupon._id)}
                      className="p-2 text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {vendorCoupons.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-white/40">
                    No vendor coupons found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL 1: CREATE CUSTOMER VOUCHER (ADMIN PRODUCTS ONLY) */}
      <Modal isOpen={isCustomerModalOpen} onClose={() => setIsCustomerModalOpen(false)}>
        <div className="bg-[#111] border border-white/10 p-6 rounded-xl w-[500px] max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-medium text-white">Create Customer Voucher</h2>
              <p className="text-xs text-white/40">Strictly applicable to Grand Store Admin products</p>
            </div>
            <button onClick={() => setIsCustomerModalOpen(false)} className="text-white/40 hover:text-white cursor-pointer">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleCreateCustomerCoupon} className="space-y-4 text-xs">
            <div>
              <label className="block text-white/60 mb-1 font-medium">Voucher Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. KRUG10, VIP15"
                value={customerFormData.code}
                onChange={(e) => setCustomerFormData({ ...customerFormData, code: e.target.value.toUpperCase() })}
                className="w-full bg-[#050505] border border-white/10 rounded-lg px-3 py-2 text-white uppercase font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-white/60 mb-1 font-medium">Voucher Title / Memo</label>
              <input
                type="text"
                placeholder="e.g. 10% Off Krug Champagne Allocation"
                value={customerFormData.title}
                onChange={(e) => setCustomerFormData({ ...customerFormData, title: e.target.value })}
                className="w-full bg-[#050505] border border-white/10 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-white/60 mb-1 font-medium">Discount Type</label>
                <select
                  value={customerFormData.discountType}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, discountType: e.target.value })}
                  className="w-full bg-[#050505] border border-white/10 rounded-lg px-3 py-2 text-white"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed_amount">Fixed Rand (R)</option>
                </select>
              </div>
              <div>
                <label className="block text-white/60 mb-1 font-medium">Discount Value *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={customerFormData.discountValue}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, discountValue: e.target.value })}
                  className="w-full bg-[#050505] border border-white/10 rounded-lg px-3 py-2 text-white font-bold"
                />
              </div>
            </div>

            {/* Targeted Admin Bottles Selection */}
            <div className="border border-white/10 rounded-lg p-3 space-y-2 bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white font-medium block">Target Admin Bottles</span>
                  <span className="text-[10px] text-white/40">Lock voucher to specific cellar bottles</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProductPickerOpen(!isProductPickerOpen)}
                  className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-[11px] cursor-pointer"
                >
                  {isProductPickerOpen ? "Hide Selector" : `Select Bottles (${selectedProductIds.length})`}
                </button>
              </div>

              {selectedProductIds.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {selectedProductIds.map((pId) => {
                    const prod = adminProducts.find(p => p.id === pId || p._id === pId);
                    return (
                      <span
                        key={pId}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-white/80 text-[10px]"
                      >
                        {prod ? prod.name : pId}
                        <button
                          type="button"
                          onClick={() => setSelectedProductIds(selectedProductIds.filter(id => id !== pId))}
                          className="hover:text-red-400 cursor-pointer"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {isProductPickerOpen && (
                <div className="pt-2 space-y-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="text"
                      placeholder="Search Admin bottles..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full bg-[#050505] border border-white/10 rounded-md pl-8 pr-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {filteredAdminProducts.slice(0, 30).map((prod) => {
                      const selected = selectedProductIds.includes(prod.id);
                      return (
                        <div
                          key={prod.id}
                          onClick={() => {
                            if (selected) {
                              setSelectedProductIds(selectedProductIds.filter(id => id !== prod.id));
                            } else {
                              setSelectedProductIds([...selectedProductIds, prod.id]);
                            }
                          }}
                          className={`flex items-center justify-between p-1.5 rounded cursor-pointer text-[11px] ${
                            selected ? "bg-[#c9a35b]/20 text-[#c9a35b]" : "hover:bg-white/5 text-white/70"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {prod.image && <img src={prod.image} alt={prod.name} className="w-4 h-5 object-contain" />}
                            <span className="truncate">{prod.name}</span>
                          </div>
                          <span className="shrink-0 font-medium">R {Number(prod.price).toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-white/60 mb-1 font-medium">Expiry (Days)</label>
                <input
                  type="number"
                  min="1"
                  value={customerFormData.expiryDays}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, expiryDays: e.target.value })}
                  className="w-full bg-[#050505] border border-white/10 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-white/60 mb-1 font-medium">Min Spend (R)</label>
                <input
                  type="number"
                  placeholder="Optional"
                  value={customerFormData.minSpendZar}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, minSpendZar: e.target.value })}
                  className="w-full bg-[#050505] border border-white/10 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-white/60 mb-1 font-medium">Usage Cap</label>
                <input
                  type="number"
                  placeholder="Unlimited"
                  value={customerFormData.usageLimit}
                  onChange={(e) => setCustomerFormData({ ...customerFormData, usageLimit: e.target.value })}
                  className="w-full bg-[#050505] border border-white/10 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#c9a35b] text-black font-semibold py-2.5 rounded-lg mt-4 hover:bg-[#d4b069] transition-colors cursor-pointer"
            >
              Create & Activate Customer Voucher
            </button>
          </form>
        </div>
      </Modal>

      {/* MODAL 2: CREATE VENDOR TRIAL COUPON */}
      <Modal isOpen={isVendorModalOpen} onClose={() => setIsVendorModalOpen(false)}>
        <div className="bg-[#111] border border-white/10 p-6 rounded-xl w-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-light text-white">Create Vendor Trial Coupon</h2>
            <button onClick={() => setIsVendorModalOpen(false)} className="text-white/40 hover:text-white cursor-pointer">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleCreateVendorCoupon} className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Coupon Code</label>
              <input
                type="text"
                required
                placeholder="e.g. SUMMER2026"
                value={vendorFormData.code}
                onChange={(e) => setVendorFormData({ ...vendorFormData, code: e.target.value.toUpperCase() })}
                className="w-full bg-[#050505] border border-white/10 rounded-lg px-4 py-2.5 text-white uppercase"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Free Trial Duration (Months)</label>
              <input
                type="number"
                required
                min="1"
                value={vendorFormData.freeMonths}
                onChange={(e) => setVendorFormData({ ...vendorFormData, freeMonths: parseInt(e.target.value) })}
                className="w-full bg-[#050505] border border-white/10 rounded-lg px-4 py-2.5 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Usage Limit (Optional)</label>
              <input
                type="number"
                min="1"
                placeholder="Leave blank for unlimited"
                value={vendorFormData.usageLimit}
                onChange={(e) => setVendorFormData({ ...vendorFormData, usageLimit: e.target.value })}
                className="w-full bg-[#050505] border border-white/10 rounded-lg px-4 py-2.5 text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#c9a35b] text-black font-medium py-3 rounded-lg mt-6 hover:bg-[#d4b069] transition-colors cursor-pointer"
            >
              Create Vendor Coupon
            </button>
          </form>
        </div>
      </Modal>
    </div>
  );
}
