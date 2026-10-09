import React, { useState, useEffect } from 'react';
import { X, Tag, Sparkles, ShoppingBag, Plus } from 'lucide-react';
import { crmApi } from '../../services/crmApi';
import { useToast } from '../../context/ToastContext';
import ProductSelectorModal from './ProductSelectorModal';

export default function CreateVoucherModal({
  isOpen,
  onClose,
  onVoucherCreated
}) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    code: '',
    title: '',
    discountType: 'percentage',
    discountValue: '10',
    expiryDays: '14',
    minSpendZar: '',
    usageLimit: ''
  });
  const [selectedBottles, setSelectedBottles] = useState([]);
  const [isBottlePickerOpen, setIsBottlePickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        code: '',
        title: '',
        discountType: 'percentage',
        discountValue: '10',
        expiryDays: '14',
        minSpendZar: '',
        usageLimit: ''
      });
      setSelectedBottles([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error('Voucher code is required');
      return;
    }
    if (!formData.discountValue || Number(formData.discountValue) <= 0) {
      toast.error('Valid discount value is required');
      return;
    }

    setSubmitting(true);
    try {
      const expiryDate = new Date(Date.now() + Number(formData.expiryDays || 14) * 24 * 60 * 60 * 1000);

      const payload = {
        code: formData.code.trim().toUpperCase(),
        title: formData.title.trim() || `${formData.code.trim().toUpperCase()} Patron Voucher`,
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        expiryDate: expiryDate.toISOString(),
        productIds: selectedBottles.map(b => b.id || b.productId),
        minSpendZar: formData.minSpendZar ? Number(formData.minSpendZar) : 0,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null
      };

      const res = await crmApi.createProductCoupon(payload);
      if (res.data && res.data.success) {
        toast.success(`Customer voucher "${payload.code}" created and activated!`);
        if (onVoucherCreated) onVoucherCreated();
        onClose();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create customer voucher');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">Create Customer Product Voucher</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  Admin Products Only
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Issue promo vouchers redeemable by store customers exclusively on Grand Store Admin bottles.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Voucher Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. KRUG10, BORDEAUX200, VIP15"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold tracking-wider"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Voucher Title / Campaign Label</label>
              <input
                type="text"
                placeholder="e.g. Spring Reserve Wine Allocation Voucher"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Discount Type</label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="percentage">Percentage Off (%)</option>
                  <option value="fixed_amount">Fixed Rand Off (R)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Discount Value {formData.discountType === 'percentage' ? '(%)' : '(ZAR)'} *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={formData.discountType === 'percentage' ? '100' : '50000'}
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                />
              </div>
            </div>

            {/* Targeted Admin Bottles Selection */}
            <div className="border border-slate-200 rounded-xl p-3.5 space-y-2 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-bold text-slate-800 block text-xs">
                    Targeted Admin Bottle(s)
                  </label>
                  <p className="text-[10px] text-slate-500">
                    Voucher only applies when customer buys these direct bottles (Optional: if none selected, applies to all admin items).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBottlePickerOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 cursor-pointer"
                >
                  <Plus size={13} /> Select Bottles ({selectedBottles.length})
                </button>
              </div>

              {selectedBottles.length > 0 ? (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {selectedBottles.map((b) => (
                    <span
                      key={b.id || b.productId}
                      className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-800 shadow-2xs"
                    >
                      {b.image && <img src={b.image} alt={b.name} className="w-4 h-5 object-contain" />}
                      <span className="max-w-[120px] truncate">{b.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedBottles(selectedBottles.filter(x => x.id !== b.id))}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">No specific bottle locked. Voucher will apply to all Grand Store Admin products in basket.</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Validity (Days)</label>
                <input
                  type="number"
                  min="1"
                  value={formData.expiryDays}
                  onChange={(e) => setFormData({ ...formData, expiryDays: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Min Spend (ZAR)</label>
                <input
                  type="number"
                  placeholder="Optional"
                  value={formData.minSpendZar}
                  onChange={(e) => setFormData({ ...formData, minSpendZar: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Usage Cap</label>
                <input
                  type="number"
                  placeholder="Unlimited"
                  value={formData.usageLimit}
                  onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
              >
                {submitting ? 'Creating...' : 'Create & Activate Voucher'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ProductSelectorModal
        isOpen={isBottlePickerOpen}
        onClose={() => setIsBottlePickerOpen(false)}
        selectedProducts={selectedBottles}
        onSelectProducts={setSelectedBottles}
        maxSelectable={4}
      />
    </>
  );
}
