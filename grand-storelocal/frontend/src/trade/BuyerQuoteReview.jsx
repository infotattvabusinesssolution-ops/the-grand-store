import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FileText, CheckCircle2, Globe, Truck, ShieldCheck, Printer, 
  ArrowLeft, Clock, AlertCircle, Building2, User, Send, Download, Package
} from 'lucide-react';
import api from '../api';
import './TradePortal.css';
import './TradeCatalogue.css';

export default function BuyerQuoteReview() {
  const { code } = useParams();
  const [loading, setLoading] = useState(true);
  const [enquiry, setEnquiry] = useState(null);
  const [tradeOrder, setTradeOrder] = useState(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptedSuccess, setAcceptedSuccess] = useState(null);
  const [error, setError] = useState(null);

  const [signerForm, setSignerForm] = useState({
    buyerName: '',
    buyerCompany: '',
    signatureNote: ''
  });

  useEffect(() => {
    fetchQuotation();
  }, [code]);

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/trade-enquiries/quote-review/${code}`);
      if (res.data?.success) {
        setEnquiry(res.data.enquiry);
        setTradeOrder(res.data.tradeOrder);
        setSignerForm({
          buyerName: res.data.enquiry?.buyer?.contactPerson || '',
          buyerCompany: res.data.enquiry?.buyer?.companyName || '',
          signatureNote: 'Accepting commercial pricing and payment terms for container allotment.'
        });
        if (res.data.tradeOrder) {
          setAcceptedSuccess(res.data.tradeOrder.orderCode);
        }
      } else {
        setError('Unable to load quotation details. Please verify your reference code.');
      }
    } catch (err) {
      console.error('Error loading quotation:', err);
      setError(err.response?.data?.message || 'Quotation reference not found or has expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuote = async (e) => {
    e.preventDefault();
    try {
      setAccepting(true);
      const res = await api.post(`/trade-enquiries/quote-accept/${code}`, signerForm);
      if (res.data?.success) {
        setAcceptedSuccess(res.data.tradeOrder?.orderCode || 'TO-CONFIRMED');
        setTradeOrder(res.data.tradeOrder);
        fetchQuotation();
      }
    } catch (err) {
      console.error('Error accepting quotation:', err);
      alert(err.response?.data?.message || 'Failed to accept quotation online. Please contact trade directorate.');
    } finally {
      setAccepting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080705] text-[#eee8dd] flex flex-col items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c9a35b] mb-4"></div>
        <p className="font-serif text-lg text-white">Loading Commercial Trade Quotation...</p>
      </div>
    );
  }

  if (error || !enquiry) {
    return (
      <div className="min-h-screen bg-[#080705] text-[#eee8dd] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle size={48} className="text-red-400 mb-4" />
        <h2 className="text-2xl font-serif text-white mb-2">Quotation Not Found</h2>
        <p className="text-sm text-stone-300 max-w-md mb-6">{error || 'Invalid quotation reference.'}</p>
        <Link 
          to="/trade/catalogue" 
          className="px-6 py-2.5 rounded-xl bg-[#c9a35b] text-black font-semibold text-xs uppercase tracking-wider inline-flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Return to Trade Catalogue
        </Link>
      </div>
    );
  }

  const items = enquiry.itemsRequested || [];
  const currency = enquiry.currency || 'USD';
  const incoterms = enquiry.incoterms || 'FOB';
  const quote = enquiry.quotation || {};

  const subtotal = items.reduce((acc, it) => {
    const unitP = it.targetPricePerCase || (quote.vendorQuoteAmount ? Math.round(quote.vendorQuoteAmount / items.length) : 450);
    return acc + (it.caseQuantity * unitP);
  }, 0);
  const freight = quote.freightAmount || 0;
  const insurance = quote.insuranceAmount || 0;
  const grandTotal = quote.totalQuoteAmount || (subtotal + freight + insurance);
  const totalCases = items.reduce((acc, it) => acc + (it.caseQuantity || 0), 0);

  const isConfirmed = enquiry.stage === 'confirmed_order' || Boolean(tradeOrder) || Boolean(acceptedSuccess);

  return (
    <main className="trade-subpage trade-catalogue-page min-h-screen pb-24 font-sans print:bg-white print:text-black print:p-0">
      <div className="shell max-w-5xl mx-auto px-4 pt-10">
        
        {/* Navigation / Header Actions */}
        <div className="flex items-center justify-between pb-6 border-b border-white/10 print:hidden">
          <Link 
            to="/trade/catalogue" 
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-300 hover:text-[#e1bd70] transition-colors"
          >
            <ArrowLeft size={16} /> Back to Trade Catalogue
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-stone-200 border border-white/15 text-xs font-semibold uppercase tracking-wider transition-all"
            >
              <Printer size={15} /> Print / Save Proforma (PDF)
            </button>
          </div>
        </div>

        {/* Status Confirmation Banner */}
        {isConfirmed && (
          <div className="my-6 p-4 sm:p-5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 flex items-center justify-between flex-wrap gap-4 shadow-xl print:hidden">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={24} className="text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-bold text-white text-sm">Commercial Order Confirmed & Signed</h4>
                <p className="text-xs text-emerald-300/80">
                  Reference: <span className="font-mono font-bold text-white">{tradeOrder?.orderCode || acceptedSuccess || 'CONFIRMED'}</span> • Production allocation and export cellar inventory have been reserved.
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
              Active Trade Order
            </span>
          </div>
        )}

        {/* Printable Proforma Sheet */}
        <div className="bg-[#11100e] border border-white/12 rounded-2xl p-6 sm:p-10 my-8 shadow-2xl relative overflow-hidden print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
          
          {/* Sheet Watermark / Seal */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b border-white/10 print:border-black/20">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#e1bd70] print:text-black">
                  The Grand Store Global
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-white border border-white/20 print:text-black print:border-black">
                  B2B Trade Directorate
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-medium text-white print:text-black mt-2">
                Official Commercial Proforma Quotation
              </h1>
              <p className="text-xs text-stone-400 print:text-stone-600 mt-1">
                Issued under international Incoterms® 2020 shipping and trade protocols.
              </p>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-[11px] uppercase tracking-wider text-stone-400 print:text-stone-600 font-bold">Quotation Code</div>
              <div className="font-mono text-xl font-bold text-[#e1bd70] print:text-black">{enquiry.enquiryCode}</div>
              <div className="text-xs text-stone-400 print:text-stone-600 mt-1">
                Date: {new Date(enquiry.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Parties: Buyer & Supplier Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 border-b border-white/10 print:border-black/20">
            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-[#e1bd70] print:text-black font-bold">
                Commercial Importer / Consignee
              </div>
              <h3 className="text-base font-bold text-white print:text-black">
                {enquiry.buyer?.companyName || 'International Purchasing Group'}
              </h3>
              <div className="text-xs text-stone-300 print:text-stone-800 space-y-1">
                <div>Contact: <strong>{enquiry.buyer?.contactPerson}</strong></div>
                <div>Email: {enquiry.buyer?.email}</div>
                {enquiry.buyer?.phone && <div>Phone: {enquiry.buyer?.phone}</div>}
                <div>Destination Country: <strong>{enquiry.destination?.country}</strong></div>
                <div>Discharge Port: <strong>{enquiry.destination?.destinationPort || 'Standard Commercial Port'}</strong></div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-[#e1bd70] print:text-black font-bold">
                Supplier & Trade Facilitator
              </div>
              <h3 className="text-base font-bold text-white print:text-black">
                The Grand Store Global Export Directorate
              </h3>
              <div className="text-xs text-stone-300 print:text-stone-800 space-y-1">
                <div>Export Network: <strong>South African & International Producers</strong></div>
                <div>Customs Clearance: Phytosanitary & Certificate of Origin Included</div>
                <div>Incoterms Agreed: <strong>{incoterms} ({enquiry.destination?.destinationPort || 'Port of Origin/Discharge'})</strong></div>
                <div>Target Dispatch: <strong>{quote.leadTimeDays || 14} working days</strong> from deposit confirmation</div>
              </div>
            </div>
          </div>

          {/* Allocation Items Table */}
          <div className="py-8">
            <h4 className="text-xs uppercase tracking-wider text-stone-300 print:text-black font-bold mb-4">
              Authorized Allocation & Container Cargo Manifest
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/15 print:border-black/20 text-stone-400 print:text-stone-600 uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-2">#</th>
                    <th className="py-3 px-2">Product Description</th>
                    <th className="py-3 px-2 text-center">Pack Format</th>
                    <th className="py-3 px-2 text-center">Case Qty</th>
                    <th className="py-3 px-2 text-right">Price / Case</th>
                    <th className="py-3 px-2 text-right">Line Total ({currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 print:divide-black/10">
                  {items.map((item, idx) => {
                    const unitP = item.targetPricePerCase || (quote.vendorQuoteAmount ? Math.round(quote.vendorQuoteAmount / items.length) : 450);
                    const lTot = item.caseQuantity * unitP;
                    return (
                      <tr key={idx} className="text-stone-200 print:text-black">
                        <td className="py-3 px-2 font-mono text-stone-500">{idx + 1}</td>
                        <td className="py-3 px-2">
                          <div className="font-semibold text-white print:text-black">{item.productName}</div>
                          {item.vintage && <div className="text-[11px] text-stone-400 print:text-stone-600">Vintage: {item.vintage}</div>}
                        </td>
                        <td className="py-3 px-2 text-center font-mono">
                          {item.bottlesPerCase || 6} btls / case
                        </td>
                        <td className="py-3 px-2 text-center font-mono font-bold text-[#e1bd70] print:text-black">
                          {item.caseQuantity} cs
                        </td>
                        <td className="py-3 px-2 text-right font-mono">
                          {currency} {unitP.toLocaleString()}
                        </td>
                        <td className="py-3 px-2 text-right font-mono font-bold text-white print:text-black">
                          {currency} {lTot.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financials & Commercial Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/10 print:border-black/20">
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-stone-300 print:text-black font-bold">
                Commercial Terms & Incoterms
              </h4>
              <div className="text-xs text-stone-300 print:text-stone-700 space-y-1.5 leading-relaxed bg-black/40 print:bg-stone-50 p-4 rounded-xl border border-white/10 print:border-black/10">
                <div>• <strong>Incoterms:</strong> {incoterms}</div>
                <div>• <strong>Payment Terms:</strong> 30% advance on proforma sign-off, 70% against Bill of Lading.</div>
                <div>• <strong>Quotation Validity:</strong> Valid for 14 calendar days from date of issue.</div>
                <div>• <strong>Packaging:</strong> Export certified cartons, heat-treated wooden pallets (ISPM-15 compliant).</div>
              </div>
            </div>

            <div className="space-y-2 bg-black/40 print:bg-stone-50 p-5 rounded-xl border border-white/10 print:border-black/10 text-xs">
              <div className="flex justify-between text-stone-300 print:text-stone-700">
                <span>Total Export Allocations ({totalCases} Cases):</span>
                <span className="font-mono font-semibold">{currency} {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-stone-300 print:text-stone-700">
                <span>Inland Freight & Port Handling:</span>
                <span className="font-mono font-semibold">{freight > 0 ? `${currency} ${freight.toLocaleString()}` : 'Included in Incoterms'}</span>
              </div>
              <div className="flex justify-between text-stone-300 print:text-stone-700">
                <span>Marine Transit Cargo Insurance:</span>
                <span className="font-mono font-semibold">{insurance > 0 ? `${currency} ${insurance.toLocaleString()}` : 'Included'}</span>
              </div>
              <div className="pt-3 border-t border-white/15 print:border-black/20 flex justify-between items-center text-sm font-bold text-white print:text-black">
                <span>Total Proforma Value ({currency}):</span>
                <span className="text-xl font-mono text-[#e1bd70] print:text-black">
                  {currency} {grandTotal.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Online Buyer Acceptance & Sign-Off Section */}
          {!isConfirmed ? (
            <div className="mt-10 pt-8 border-t border-white/10 print:hidden">
              <div className="bg-[#181612] border border-[#c9a35b]/40 rounded-2xl p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <ShieldCheck size={24} className="text-[#e1bd70]" />
                  <div>
                    <h3 className="text-base font-bold text-white">Online Proforma Acceptance & Sign-off</h3>
                    <p className="text-xs text-stone-300">
                      Confirm this quotation to lock cellar inventory and issue the commercial trade order.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAcceptQuote} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-stone-300 font-bold mb-1">
                        Authorized Signer Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={signerForm.buyerName}
                        onChange={e => setSignerForm({ ...signerForm, buyerName: e.target.value })}
                        className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c9a35b]"
                        placeholder="Full Legal Name"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-stone-300 font-bold mb-1">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={signerForm.buyerCompany}
                        onChange={e => setSignerForm({ ...signerForm, buyerCompany: e.target.value })}
                        className="w-full bg-black/60 border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c9a35b]"
                        placeholder="Company Name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-stone-300 font-bold mb-1">
                      Sign-Off Notes / Purchase Order Reference
                    </label>
                    <textarea
                      rows={2}
                      value={signerForm.signatureNote}
                      onChange={e => setSignerForm({ ...signerForm, signatureNote: e.target.value })}
                      className="w-full bg-black/60 border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#c9a35b]"
                      placeholder="e.g. PO-UK-2026-904. Please dispatch container booking details to our freight forwarder."
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[11px] text-stone-400">
                      By accepting, you confirm authority to execute this proforma invoice on behalf of the purchasing entity.
                    </span>

                    <button
                      type="submit"
                      disabled={accepting}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#c9a35b] hover:bg-[#e1bd70] text-black font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#c9a35b]/20 shrink-0"
                    >
                      {accepting ? (
                        <>
                          <Clock className="animate-spin" size={14} /> Processing Order...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} /> Accept & Confirm Proforma Order
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-stone-400 print:text-stone-700">
              <div>
                Digital Sign-Off Confirmed by: <strong className="text-white print:text-black">{enquiry.buyer?.contactPerson || 'Authorized Signer'}</strong>
              </div>
              <div className="font-mono text-emerald-400 print:text-black font-bold">
                Status: Commercial Order Active (ISPM-15 / CIF Clearance Pending)
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}
