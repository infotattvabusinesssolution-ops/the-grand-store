import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Calendar, Tag, AlertTriangle } from 'lucide-react';

export default function TaskModal({ 
  isOpen, 
  onClose, 
  mode = 'create', // 'create' or 'complete'
  task = null, 
  onSubmit 
}) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    category: task?.category || 'customer_enquiry',
    priority: task?.priority || 'medium',
    dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    description: task?.description || '',
    completionReason: '',
    resolutionOutcome: 'resolved_in_full'
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (mode === 'complete') {
      if (!formData.completionReason.trim()) {
        setError('A documented completion reason is required to close this task (Golden Staff Rule).');
        return;
      }
    } else {
      if (!formData.title.trim()) {
        setError('Please enter a task title.');
        return;
      }
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${mode === 'complete' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
              {mode === 'complete' ? <CheckCircle size={18} /> : <Calendar size={18} />}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                {mode === 'complete' ? 'Close & Resolve Task' : 'Schedule New Task'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {mode === 'complete' ? 'Record resolution outcome per Golden Staff Rule' : 'Assign operational work to staff'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'complete' ? (
            <>
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/60 rounded-xl">
                <p className="text-xs font-bold text-blue-900">{task?.title}</p>
                {task?.linkedEntity?.referenceCode && (
                  <p className="text-[11px] text-blue-700 mt-0.5">Reference: #{task.linkedEntity.referenceCode}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Resolution Outcome <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.resolutionOutcome}
                  onChange={(e) => setFormData({ ...formData, resolutionOutcome: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="quote_accepted">Quote Accepted & Converted to Order</option>
                  <option value="resolved_in_full">Enquiry Answered & Completed in Full</option>
                  <option value="alternative_chosen">Customer Chose Alternative Product</option>
                  <option value="out_of_stock">Sourcing Unavailable / Out of Stock</option>
                  <option value="unresponsive">Customer Unresponsive After 3 Attempts</option>
                  <option value="cancelled_by_customer">Cancelled by Customer / Vendor</option>
                  <option value="other">Other Documented Outcome</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Completion Reason / Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail the exact outcome achieved (Golden Staff Rule: mandatory)..."
                  value={formData.completionReason}
                  onChange={(e) => setFormData({ ...formData, completionReason: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Task Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow-up quote with Dubai importer"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="customer_enquiry">Customer Enquiry</option>
                    <option value="order_fulfilment">Order Fulfilment</option>
                    <option value="shipment_delay">Shipment Delay</option>
                    <option value="vendor_verification">Vendor KYC Check</option>
                    <option value="export_quote">Export Quotation</option>
                    <option value="auction_followup">Auction Follow-up</option>
                    <option value="tasting_event">Tasting Event</option>
                    <option value="scheduled_call">Phone Call</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="urgent">Urgent (High SLA)</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Due Date & Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description / Context
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional details, contact phone, or specific requirements..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`
                px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-all
                ${mode === 'complete'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'}
                ${submitting ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {submitting ? 'Processing...' : mode === 'complete' ? 'Mark Completed' : 'Schedule Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
