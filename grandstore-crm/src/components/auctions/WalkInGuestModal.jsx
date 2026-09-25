import React, { useState } from 'react';
import { X, UserPlus, CreditCard, DollarSign, CheckCircle2, Ticket } from 'lucide-react';

export default function WalkInGuestModal({ isOpen, onClose, onRegister, event }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    ticketType: event?.ticketTiers?.[0]?.name || 'General Admission',
    price: event?.ticketTiers?.[0]?.price || 350,
    quantity: 1,
    paymentMethod: 'Cash'
  });

  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !event) return null;

  const handleTierChange = (e) => {
    const selectedName = e.target.value;
    const tier = event.ticketTiers?.find(t => t.name === selectedName);
    setFormData({
      ...formData,
      ticketType: selectedName,
      price: tier ? tier.price : 350
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please provide the guest name.');
      return;
    }

    try {
      setRegistering(true);
      setError('');
      await onRegister({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        ticketType: formData.ticketType,
        price: Number(formData.price),
        quantity: Number(formData.quantity) || 1,
        paymentMethod: formData.paymentMethod
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to register walk-in guest');
    } finally {
      setRegistering(false);
    }
  };

  const total = (Number(formData.price) || 0) * (Number(formData.quantity) || 1);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
              <UserPlus size={18} className="text-blue-600" />
              Register Door Walk-In
            </h3>
            <p className="text-xs text-slate-500">
              Immediate ticket issuance & automated check-in admission
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Guest Full Name *</label>
            <input 
              type="text"
              required
              placeholder="e.g. David van der Merwe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Email (Optional)</label>
              <input 
                type="email"
                placeholder="guest@domain.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Mobile (Optional)</label>
              <input 
                type="text"
                placeholder="+27 82 000 0000"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Ticket Tier</label>
              <select
                value={formData.ticketType}
                onChange={handleTierChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {(event.ticketTiers || []).map((t) => (
                  <option key={t._id || t.name} value={t.name}>
                    {t.name} (R {t.price})
                  </option>
                ))}
                <option value="Complimentary VIP Guest">Complimentary VIP</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Quantity</label>
              <input 
                type="number"
                min="1"
                max="10"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="Cash">Cash at Door</option>
                <option value="Card Terminal">Speedpoint / POS Terminal</option>
                <option value="Bank Transfer">Direct Wire / Instant EFT</option>
                <option value="Complimentary">Complimentary / House Account</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Unit Price (ZAR)</label>
              <input 
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold"
              />
            </div>
          </div>

          {/* Total Box */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
            <div className="text-slate-600">
              <span className="font-semibold">Admission Summary:</span>
              <div className="text-[11px] text-slate-500">{formData.quantity}x {formData.ticketType}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-blue-700 uppercase font-bold tracking-wider">Total Received</div>
              <div className="text-base font-extrabold text-blue-900">R {total.toLocaleString()}</div>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={registering}
              className="px-5 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-xl font-semibold shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Ticket size={14} />
              {registering ? 'Processing...' : 'Admit & Check In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
