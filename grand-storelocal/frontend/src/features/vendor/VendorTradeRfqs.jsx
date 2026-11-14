import React, { useState, useEffect } from 'react';
import { 
  FileText, Globe, Clock, CheckCircle2, DollarSign, Send, 
  MapPin, Package, Calendar, Loader2, AlertCircle, ChevronRight, X
} from 'lucide-react';
import api from '../../api';

export default function VendorTradeRfqs({ onNotify }) {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    quotedPricePerUnit: '',
    currency: 'USD',
    leadTimeDays: 14,
    notes: ''
  });

  useEffect(() => {
    fetchRfqs();
  }, []);

  const fetchRfqs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vendor/trade-rfqs');
      if (res.data?.success) {
        setRfqs(res.data.rfqs || []);
      }
    } catch (err) {
      console.error('Failed to load trade RFQs:', err);
      if (onNotify) onNotify('Failed to retrieve international trade RFQs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenQuoteModal = (rfq) => {
    setSelectedRfq(rfq);
    const existingQuote = rfq.vendorQuotes?.find(q => q.status === 'submitted');
    setQuoteForm({
      quotedPricePerUnit: existingQuote ? existingQuote.quotedPricePerUnit : '',
      currency: existingQuote ? existingQuote.currency : (rfq.currency || 'USD'),
      leadTimeDays: existingQuote ? existingQuote.leadTimeDays : 14,
      notes: existingQuote ? existingQuote.notes : ''
    });
  };

  const handleSubmitQuote = async (e) => {
    e.preventDefault();
    if (!selectedRfq) return;

    try {
      setSubmittingQuote(true);
      const res = await api.put(`/vendor/trade-rfqs/${selectedRfq._id}/quote`, quoteForm);
      if (res.data?.success) {
        if (onNotify) onNotify('Quotation submitted successfully to Trade Directorate!');
        setSelectedRfq(null);
        fetchRfqs();
      }
    } catch (err) {
      console.error('Error submitting quote:', err);
      if (onNotify) onNotify(err.response?.data?.message || 'Error submitting quote', 'error');
    } finally {
      setSubmittingQuote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-[#e1bd70]">
        <Loader2 className="animate-spin mr-3" size={24} />
        <span>Loading International Trade RFQs...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto pb-16 font-sans">
      {/* Header */}
      <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-[#c9a35b]/10 text-[#e1bd70] border border-[#c9a35b]/20">
              <Globe size={24} />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif text-[var(--color-ivory)]">
                Global Trade Quotation Requests (RFQs)
              </h1>
              <p className="text-xs sm:text-sm text-[var(--color-ivory-muted)] mt-0.5">
                Review bulk export enquiries from verified international importers and submit your wholesale pricing.
              </p>
            </div>
          </div>
        </div>

        <div className="text-xs text-white/50 bg-white/5 px-3 py-1.5 rounded-full border border-white/10 w-fit">
          Total Active RFQs: <span className="text-[#e1bd70] font-semibold">{rfqs.length}</span>
        </div>
      </div>

      {/* RFQ List */}
      {rfqs.length === 0 ? (
        <div className="bg-[#0e0d0a] border border-dashed border-white/15 rounded-2xl p-12 text-center">
          <Globe size={40} className="mx-auto text-white/20 mb-4" />
          <h3 className="text-lg font-serif text-white/80 mb-2">No International RFQs Pending</h3>
          <p className="text-xs text-white/40 max-w-md mx-auto">
            When international importers request bulk quotes for your wines or spirits, they will appear here with destination port and requested volume details.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {rfqs.map(rfq => {
            const hasQuote = rfq.vendorQuotes && rfq.vendorQuotes.length > 0;
            const itemsCount = rfq.itemsRequested?.length || 0;
            const totalCases = rfq.itemsRequested?.reduce((sum, it) => sum + (Number(it.caseQuantity) || 0), 0) || 0;

            return (
              <div 
                key={rfq._id}
                className="bg-[#0e0d0a] border border-white/10 hover:border-[#c9a35b]/40 rounded-2xl p-5 sm:p-6 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
              >
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs text-[#e1bd70] font-bold bg-[#c9a35b]/10 px-2.5 py-1 rounded-md border border-[#c9a35b]/20">
                      {rfq.enquiryCode || 'EXP-RFQ'}
                    </span>
                    <span className="text-xs font-semibold text-white/80">
                      {rfq.buyer?.companyName || 'International Importer'}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/60">
                      Incoterm: {rfq.incoterms || 'FOB'}
                    </span>
                    {hasQuote ? (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Quotation Submitted
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        Quote Awaiting
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-1">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-white/40">Destination</div>
                      <div className="text-white font-medium flex items-center gap-1 mt-0.5">
                        <MapPin size={12} className="text-[#e1bd70]" />
                        {rfq.destination?.country || 'Overseas'}
                        {rfq.destination?.destinationPort && ` (${rfq.destination.destinationPort})`}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-white/40">Total Volume</div>
                      <div className="text-white font-medium flex items-center gap-1 mt-0.5">
                        <Package size={12} className="text-[#e1bd70]" />
                        {totalCases} cases ({itemsCount} line items)
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-white/40">Target Arrival</div>
                      <div className="text-white font-medium flex items-center gap-1 mt-0.5">
                        <Calendar size={12} className="text-[#e1bd70]" />
                        {rfq.targetArrivalDate ? new Date(rfq.targetArrivalDate).toLocaleDateString() : 'Flexible'}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-white/40">Currency</div>
                      <div className="text-white font-medium mt-0.5">
                        {rfq.currency || 'USD'}
                      </div>
                    </div>
                  </div>

                  {/* Line Items Preview */}
                  {rfq.itemsRequested && (
                    <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-xs text-white/70 space-y-1">
                      {rfq.itemsRequested.map((it, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="font-medium text-white/90 truncate mr-2">
                            • {it.productName} ({it.packFormat || `${it.bottlesPerCase || 6} btls/case`})
                          </span>
                          <span className="shrink-0 text-white/50">{it.caseQuantity} cases</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="shrink-0 w-full lg:w-auto">
                  <button
                    onClick={() => handleOpenQuoteModal(rfq)}
                    className="w-full lg:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#c9a35b] hover:bg-[#e1bd70] text-black font-semibold text-xs uppercase tracking-wider transition-all"
                  >
                    <span>{hasQuote ? 'Update Quote' : 'Submit Quotation'}</span>
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quote Submission Modal */}
      {selectedRfq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#12110e] border border-[#c9a35b]/30 rounded-2xl w-full max-w-lg p-6 sm:p-7 relative shadow-2xl">
            <button
              onClick={() => setSelectedRfq(null)}
              className="absolute top-5 right-5 text-white/50 hover:text-white"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-serif text-[var(--color-ivory)] mb-1">
              Submit Wholesale Quotation
            </h3>
            <p className="text-xs text-[var(--color-ivory-muted)] mb-5">
              Enquiry: <span className="text-[#e1bd70] font-mono">{selectedRfq.enquiryCode}</span> · Destination: {selectedRfq.destination?.country}
            </p>

            <form onSubmit={handleSubmitQuote} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#bdb5a6] font-bold mb-1.5">
                    Quoted Price Per Bottle/Unit
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={quoteForm.quotedPricePerUnit}
                    onChange={e => setQuoteForm({ ...quoteForm, quotedPricePerUnit: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a35b]"
                    placeholder="e.g. 12.50"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-[#bdb5a6] font-bold mb-1.5">
                    Currency
                  </label>
                  <select
                    value={quoteForm.currency}
                    onChange={e => setQuoteForm({ ...quoteForm, currency: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a35b]"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="ZAR">ZAR (R)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#bdb5a6] font-bold mb-1.5">
                  Dispatch Lead Time (Days after PO)
                </label>
                <input
                  type="number"
                  required
                  value={quoteForm.leadTimeDays}
                  onChange={e => setQuoteForm({ ...quoteForm, leadTimeDays: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#c9a35b]"
                  placeholder="e.g. 14"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-[#bdb5a6] font-bold mb-1.5">
                  Production / Packaging Notes for Buyer
                </label>
                <textarea
                  rows={3}
                  value={quoteForm.notes}
                  onChange={e => setQuoteForm({ ...quoteForm, notes: e.target.value })}
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-[#c9a35b]"
                  placeholder="e.g. Export cartons on heat-treated ISPM-15 pallets. Vintage 2022 bottled under screwcap."
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRfq(null)}
                  className="px-4 py-2 text-xs uppercase tracking-wider text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingQuote}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c9a35b] hover:bg-[#e1bd70] text-black font-semibold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {submittingQuote ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>Submit to Trade Directorate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
