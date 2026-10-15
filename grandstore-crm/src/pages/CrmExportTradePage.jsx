import React, { useState, useEffect } from 'react';
import { useCrmExport } from '../hooks/useCrmExport';
import { useToast } from '../context/ToastContext';
import { crmApi } from '../services/crmApi';
import StatusBadge from '../components/common/StatusBadge';
import { 
  Globe, FileText, CheckCircle2, Clock, Plus, 
  ExternalLink, X, MapPin, Building, ShieldCheck, Printer,
  Wine, Package, Layers, Info, MessageSquare, Send, User, Check, FileCheck,
  Truck, Sparkles, Search, Award, Sliders, RefreshCw, AlertTriangle,
  BarChart3, TrendingUp, Download, Copy, ArrowUpRight, DollarSign, Calendar, FileBadge, CheckSquare
} from 'lucide-react';
import { generateProformaPdf } from '../utils/proformaPdfGenerator';

const EXPORT_CHECKLIST_DOCS = [
  { 
    key: 'commercialInvoice', 
    label: 'Commercial Invoice', 
    desc: 'Official valuation, tariff codes & SA export clearance invoice' 
  },
  { 
    key: 'packingList', 
    label: 'Packing List', 
    desc: 'Container manifest, carton & pallet count, tare/net/gross weights' 
  },
  { 
    key: 'labelInstructions', 
    label: 'Label Instructions / Compliance', 
    desc: 'Destination market health warning, importer back-label & barcode specs' 
  },
  { 
    key: 'certificateOfOrigin', 
    label: 'Certificate of Origin (SA)', 
    desc: 'South African Wine & Spirit Board official chamber certification' 
  },
  { 
    key: 'phytosanitaryCertificate', 
    label: 'Phytosanitary Health Certificate', 
    desc: 'Department of Agriculture biosecurity and port health clearance' 
  },
  { 
    key: 'billOfLading', 
    label: 'Ocean Bill of Lading / Airway Bill', 
    desc: 'Carrier transport manifest and title document for port discharge' 
  }
];

const STANDARD_PACK_FORMATS = [
  { label: '6*6 / 6x750ml (6 btls/case - Standard Export)', value: '6x750ml (6 btls/case)', bottles: 6 },
  { label: '12x750ml (12 btls/case - Full Dozen)', value: '12x750ml (12 btls/case)', bottles: 12 },
  { label: '6x1000ml (6 btls/case - Spirits 1L)', value: '6x1000ml (6 btls/case)', bottles: 6 },
  { label: '3x1.5L (3 Magnums/case)', value: '3x1.5L (3 magnums/case)', bottles: 3 },
  { label: 'Custom Pack Format (e.g. 6*6)', value: 'custom', bottles: 6 }
];

export default function CrmExportTradePage() {
  const toast = useToast();
  const { enquiries, loading, createEnquiry, updateDocumentation, updateStage, addNote } = useCrmExport();
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [modalTab, setModalTab] = useState('checklist'); // 'checklist' | 'notes' | 'packaging'
  const [newNoteText, setNewNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState([]);

  const [newEnquiryData, setNewEnquiryData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    destinationCountry: 'United Arab Emirates',
    destinationPort: 'Jebel Ali, Dubai',
    caseQuantity: 20,
    productName: 'South African Fine Wine Collection',
    packFormat: '6x750ml (6 btls/case)',
    customPackFormat: '',
    bottlesPerCase: 6,
    vintage: '2021',
    targetPricePerCase: '',
    incoterms: 'CIF',
    currency: 'USD'
  });
  const [submitting, setSubmitting] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState('pipeline'); // 'pipeline' | 'vendors' | 'matcher' | 'analytics'
  const [exportVendors, setExportVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [verificationModalVendor, setVerificationModalVendor] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('approved');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [submittingVerification, setSubmittingVerification] = useState(false);

  const [analyticsData, setAnalyticsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [expiringDocs, setExpiringDocs] = useState([]);
  const [tradeOrders, setTradeOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [convertingOrderId, setConvertingOrderId] = useState(null);

  const fetchAnalyticsAndOrders = async () => {
    setLoadingAnalytics(true);
    setLoadingOrders(true);
    try {
      const [anRes, expRes, ordRes] = await Promise.allSettled([
        crmApi.getTradeAnalytics(),
        crmApi.getExpiringDocuments(),
        crmApi.getTradeOrders()
      ]);
      if (anRes.status === 'fulfilled' && anRes.value?.data?.success) {
        setAnalyticsData(anRes.value.data.analytics);
      }
      if (expRes.status === 'fulfilled' && expRes.value?.data?.success) {
        setExpiringDocs(expRes.value.data.expiringDocuments || []);
      }
      if (ordRes.status === 'fulfilled' && ordRes.value?.data?.success) {
        setTradeOrders(ordRes.value.data.orders || []);
      }
    } catch (err) {
      console.error('Failed to load trade analytics:', err);
    } finally {
      setLoadingAnalytics(false);
      setLoadingOrders(false);
    }
  };

  const handleConvertToTradeOrder = async (enquiry) => {
    if (!enquiry) return;
    const confirmed = window.confirm(`Convert Quotation ${enquiry.enquiryCode} into an Official B2B Commercial Trade Order?\n\nThis will lock and reserve physical cellar inventory and create legal order milestone tracking.`);
    if (!confirmed) return;

    try {
      setConvertingOrderId(enquiry._id);
      const res = await crmApi.convertToTradeOrder(enquiry._id, {
        paymentTerms: enquiry.financials?.paymentTerms || '30% deposit upon proforma sign-off, 70% against Bill of Lading'
      });
      if (res.data?.success) {
        toast.success(`Trade Order Created: ${res.data.tradeOrder?.orderCode || 'Success'}`);
        setSelectedEnquiry(prev => ({
          ...prev,
          stage: 'confirmed_order',
          tradeOrderCode: res.data.tradeOrder?.orderCode
        }));
        fetchAnalyticsAndOrders();
      }
    } catch (err) {
      console.error('Failed to convert quotation to order:', err);
      toast.error(err.response?.data?.message || 'Failed to convert to trade order');
    } finally {
      setConvertingOrderId(null);
    }
  };

  const handleDownloadProforma = (enquiry) => {
    try {
      generateProformaPdf(enquiry);
      toast.success(`Generated official Proforma PDF for ${enquiry.enquiryCode}`);
    } catch (err) {
      console.error('Error generating Proforma PDF:', err);
      toast.error('Could not generate PDF. Please use the Print option.');
    }
  };

  const handleCopyBuyerLink = (enquiry) => {
    const host = window.location.origin.includes(':5181')
      ? window.location.origin.replace(':5181', ':5173')
      : window.location.origin;
    const url = `${host}/trade/quote/${enquiry.enquiryCode}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success(`Buyer Review URL copied: ${enquiry.enquiryCode}`);
    }).catch(() => {
      toast.info(`Review URL: ${url}`);
    });
  };

  const [matcherQuery, setMatcherQuery] = useState({
    category: 'Wine',
    destinationMarket: 'United Kingdom',
    volumeCases: 50,
    incoterm: 'FOB'
  });
  const [matcherResults, setMatcherResults] = useState(null);
  const [runningMatcher, setRunningMatcher] = useState(false);

  const fetchExportVendors = async () => {
    try {
      setLoadingVendors(true);
      const res = await crmApi.getExportVendors();
      if (res.data?.success) {
        setExportVendors(res.data.vendors || []);
      }
    } catch (err) {
      console.error('Failed to load export vendors:', err);
      toast.error('Failed to load export vendors');
    } finally {
      setLoadingVendors(false);
    }
  };

  const handleUpdateVendorVerification = async (e) => {
    if (e) e.preventDefault();
    if (!verificationModalVendor) return;

    try {
      setSubmittingVerification(true);
      const res = await crmApi.updateVendorExportVerification(verificationModalVendor._id, {
        status: verificationStatus,
        reviewerNotes
      });
      if (res.data?.success) {
        toast.success(`Vendor export capability set to ${verificationStatus}`);
        setVerificationModalVendor(null);
        fetchExportVendors();
      }
    } catch (err) {
      console.error('Failed to update vendor verification:', err);
      toast.error('Failed to update vendor status');
    } finally {
      setSubmittingVerification(false);
    }
  };

  const runSupplierMatcher = async (e) => {
    if (e) e.preventDefault();
    try {
      setRunningMatcher(true);
      const res = await crmApi.matchExportSuppliers(matcherQuery);
      if (res.data?.success) {
        setMatcherResults(res.data);
      }
    } catch (err) {
      console.error('Error matching suppliers:', err);
      toast.error('Supplier matching query failed');
    } finally {
      setRunningMatcher(false);
    }
  };

  // Load catalog products for quick autocomplete suggestion
  useEffect(() => {
    crmApi.getMarketingProducts({ limit: 50 })
      .then((res) => {
        if (res.data?.success && res.data?.products?.length > 0) {
          setCatalogProducts(res.data.products);
        }
      })
      .catch((err) => {
        console.warn('Could not load marketing products for export:', err);
      });
  }, []);

  const handlePackFormatChange = (value) => {
    const preset = STANDARD_PACK_FORMATS.find(p => p.value === value);
    if (preset && preset.value !== 'custom') {
      setNewEnquiryData(prev => ({
        ...prev,
        packFormat: preset.value,
        bottlesPerCase: preset.bottles
      }));
    } else {
      setNewEnquiryData(prev => ({
        ...prev,
        packFormat: 'custom'
      }));
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const bpc = Number(newEnquiryData.bottlesPerCase) || 6;
    const format = newEnquiryData.packFormat === 'custom'
      ? (newEnquiryData.customPackFormat.trim() || `${bpc} btls/case (Custom)`)
      : newEnquiryData.packFormat;

    const res = await createEnquiry({
      buyer: {
        companyName: newEnquiryData.companyName,
        contactPerson: newEnquiryData.contactPerson,
        email: newEnquiryData.email,
        phone: newEnquiryData.phone
      },
      destination: {
        country: newEnquiryData.destinationCountry,
        destinationPort: newEnquiryData.destinationPort
      },
      itemsRequested: [{
        productName: newEnquiryData.productName,
        vintage: newEnquiryData.vintage || '',
        bottlesPerCase: bpc,
        packFormat: format,
        caseQuantity: Number(newEnquiryData.caseQuantity),
        targetPricePerCase: newEnquiryData.targetPricePerCase ? Number(newEnquiryData.targetPricePerCase) : undefined
      }],
      incoterms: newEnquiryData.incoterms,
      currency: newEnquiryData.currency
    });

    setSubmitting(false);
    if (res?.success) {
      toast.success('International export lead created successfully');
      setIsCreateModalOpen(false);
      // Reset form
      setNewEnquiryData({
        companyName: '',
        contactPerson: '',
        email: '',
        phone: '',
        destinationCountry: 'United Arab Emirates',
        destinationPort: 'Jebel Ali, Dubai',
        caseQuantity: 20,
        productName: 'South African Fine Wine Collection',
        packFormat: '6x750ml (6 btls/case)',
        customPackFormat: '',
        bottlesPerCase: 6,
        vintage: '2021',
        targetPricePerCase: '',
        incoterms: 'CIF',
        currency: 'USD'
      });
    } else {
      toast.error(res?.message || 'Failed to create export lead');
    }
  };

  const getDocVerificationStatus = (enquiry, docKey) => {
    if (!enquiry?.documentationChecklist) return false;
    if (docKey === 'labelInstructions') {
      return Boolean(
        enquiry.documentationChecklist?.labelInstructions?.verified ?? 
        enquiry.documentationChecklist?.labelInstruction?.verified
      );
    }
    return Boolean(enquiry.documentationChecklist?.[docKey]?.verified);
  };

  const getVerifiedCount = (enquiry) => {
    if (!enquiry) return 0;
    return EXPORT_CHECKLIST_DOCS.filter(doc => getDocVerificationStatus(enquiry, doc.key)).length;
  };

  const openEnquiryModal = (enquiry, tab = 'checklist') => {
    setSelectedEnquiry(enquiry);
    setModalTab(tab);
    setNewNoteText('');
  };

  const handleDocToggle = async (enquiryId, docKey, currentStatus) => {
    const nextStatus = !currentStatus;
    // Optimistically update selectedEnquiry in state for instant feedback
    setSelectedEnquiry(prev => {
      if (!prev || prev._id !== enquiryId) return prev;
      return {
        ...prev,
        documentationChecklist: {
          ...(prev.documentationChecklist || {}),
          [docKey]: {
            ...(prev.documentationChecklist?.[docKey] || {}),
            verified: nextStatus
          }
        }
      };
    });

    const res = await updateDocumentation(enquiryId, docKey, nextStatus);
    if (res?.success && res.enquiry) {
      setSelectedEnquiry(res.enquiry);
    }
    toast.success(`Customs document status updated.`);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim() || !selectedEnquiry) return;
    setSubmittingNote(true);

    const noteContent = newNoteText.trim();
    try {
      const res = await addNote(selectedEnquiry._id, noteContent);
      if (res?.success) {
        toast.success(`Note saved for ${selectedEnquiry.buyer?.companyName || 'customer'}`);
        const newNoteItem = res.note || {
          note: noteContent,
          authorName: 'Trade Manager',
          createdAt: new Date().toISOString()
        };
        setSelectedEnquiry(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            internalNotes: [...(prev.internalNotes || []), newNoteItem]
          };
        });
        setNewNoteText('');
      } else {
        toast.error(res?.message || 'Failed to save note');
      }
    } catch (err) {
      toast.error('Failed to save customer note');
    } finally {
      setSubmittingNote(false);
    }
  };


  const handlePrintProforma = (enquiry) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popups blocked. Please allow popups to view printable proforma.');
      return;
    }
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Export Proforma Invoice - ${enquiry.enquiryCode}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #0f172a; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
          .logo { font-size: 22px; font-weight: 800; color: #1e3a8a; }
          .badge { background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: bold; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; font-size: 13px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 24px; font-size: 13px; }
          th { background: #f8fafc; text-align: left; padding: 10px; border-bottom: 2px solid #e2e8f0; }
          td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
          .wire-box { background: #f8fafc; border: 1px solid #cbd5e1; padding: 14px; border-radius: 8px; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">GRAND STORE GLOBAL</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 3px;">International Fine Wine & Cigar Export Operations</div>
            <div style="font-size: 11px; color: #94a3b8;">Franschhoek Cellars & Cape Town Marine Port, South Africa</div>
          </div>
          <div style="text-align: right;">
            <span class="badge">PROFORMA INVOICE</span>
            <div style="font-size: 16px; font-weight: bold; margin-top: 6px;">${enquiry.enquiryCode}</div>
            <div style="font-size: 12px; color: #64748b;">Issued: ${new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <div class="meta-grid">
          <div>
            <strong style="color: #475569; text-transform: uppercase; font-size: 11px;">CONSIGNEE / IMPORTER:</strong>
            <div style="font-size: 14px; font-weight: bold; margin-top: 4px;">${enquiry.buyer?.companyName}</div>
            <div>Attn: ${enquiry.buyer?.contactPerson}</div>
            <div>Email: ${enquiry.buyer?.email}</div>
            <div>Tel: ${enquiry.buyer?.phone || 'On File'}</div>
          </div>
          <div>
            <strong style="color: #475569; text-transform: uppercase; font-size: 11px;">DESTINATION & INCOTERMS:</strong>
            <div style="margin-top: 4px;"><strong>Country:</strong> ${enquiry.destination?.country}</div>
            <div><strong>Discharge Port:</strong> ${enquiry.destination?.destinationPort || 'International Commercial Port'}</div>
            <div><strong>Incoterms:</strong> ${enquiry.incoterms || 'CIF'}</div>
            <div><strong>Currency:</strong> ${enquiry.currency || 'USD'}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Item Description & Vintage</th>
              <th>Packaging Format</th>
              <th>Case Quantity</th>
              <th>Total Bottles</th>
              <th>Incoterms</th>
              <th style="text-align: right;">Allocation Status</th>
            </tr>
          </thead>
          <tbody>
            ${(enquiry.itemsRequested || [{ productName: 'South African Reserve Collection', caseQuantity: 20, bottlesPerCase: 6, packFormat: '6x750ml (6 btls/case)' }]).map(item => {
              const bpc = item.bottlesPerCase || 6;
              const cases = item.caseQuantity || 1;
              const totalBtls = cases * bpc;
              const format = item.packFormat || `${bpc}x750ml (${bpc} btls/case)`;
              return `
              <tr>
                <td><strong>${item.productName}</strong>${item.vintage ? ` (${item.vintage})` : ''}<br><span style="font-size: 11px; color: #64748b;">Certified Temperature-Controlled Export Packaging</span></td>
                <td><span class="badge">${format}</span></td>
                <td><strong>${cases}</strong> Cases</td>
                <td><strong>${totalBtls}</strong> Bottles</td>
                <td>${enquiry.incoterms || 'CIF'}</td>
                <td style="text-align: right; color: #16a34a; font-weight: bold;">Bonded Cellar Reserved</td>
              </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="wire-box">
          <strong>BANK WIRE (SWIFT / IBAN) PAYMENT ROUTING:</strong>
          <div style="margin-top: 4px;">Account Name: Grand Store Global (Pty) Ltd</div>
          <div>Bank: First National Bank (FNB) • Global Corporate Services</div>
          <div>SWIFT Code: FIRNZAJJXXX • Account: 62899482103</div>
          <div>Wire Reference: <strong>${enquiry.enquiryCode}</strong></div>
        </div>

        <div style="margin-top: 30px; text-align: center; font-size: 11px; color: #94a3b8;">
          Official Commercial Export Document • Grand Store Global Operations
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
    toast.success(`Generated Proforma Invoice for ${enquiry.enquiryCode}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Global Trade & Export Workspace
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 rounded-md border border-blue-200">
              Module 6
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dedicated B2B container and case export pipeline with Incoterms, product specifications, port destinations, and customs compliance
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-blue-500/25 transition-all cursor-pointer"
        >
          <Plus size={16} /> New Export Lead
        </button>
      </div>

      {/* 3 Main Integrated Operations Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveMainTab('pipeline')}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeMainTab === 'pipeline'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Globe size={15} />
          <span>Export RFQs & Trade Pipeline</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-mono text-slate-600">
            {enquiries.length}
          </span>
        </button>

        <button
          onClick={() => { setActiveMainTab('vendors'); fetchExportVendors(); }}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeMainTab === 'vendors'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck size={15} />
          <span>Vendor Export Verification</span>
          {exportVendors.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-mono text-slate-600">
              {exportVendors.length}
            </span>
          )}
        </button>

        <button
          onClick={() => { setActiveMainTab('matcher'); if (!matcherResults) runSupplierMatcher(); }}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeMainTab === 'matcher'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles size={15} />
          <span>Automated Supplier Matcher</span>
        </button>

        <button
          onClick={() => { setActiveMainTab('analytics'); fetchAnalyticsAndOrders(); }}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeMainTab === 'analytics'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart3 size={15} />
          <span>Trade Analytics & Funnel</span>
          {tradeOrders.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[10px] font-mono text-blue-700 border border-blue-200">
              {tradeOrders.length}
            </span>
          )}
        </button>
      </div>

      {/* Enquiries Table */}
      {activeMainTab === 'pipeline' && (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Enquiry ID</th>
                <th className="px-6 py-3.5">Buyer & Destination</th>
                <th className="px-6 py-3.5">Product & Packaging</th>
                <th className="px-6 py-3.5">Volume</th>
                <th className="px-6 py-3.5">Incoterms</th>
                <th className="px-6 py-3.5">Current Stage</th>
                <th className="px-6 py-3.5 text-right">Dossier / Checklist</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading export pipeline...</td>
                </tr>
              ) : enquiries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No active B2B export enquiries. Click "New Export Lead" to create one.
                  </td>
                </tr>
              ) : (
                enquiries.map((item) => {
                  const firstItem = item.itemsRequested?.[0] || {
                    productName: 'South African Reserve Collection',
                    caseQuantity: 20,
                    bottlesPerCase: 6,
                    packFormat: '6x750ml (6 btls/case)'
                  };
                  const totalCases = item.itemsRequested?.reduce((acc, curr) => acc + (curr.caseQuantity || 0), 0) || 0;
                  const totalBottles = item.itemsRequested?.reduce((acc, curr) => acc + ((curr.caseQuantity || 0) * (curr.bottlesPerCase || 6)), 0) || (totalCases * 6);
                  const pack = firstItem.packFormat || `${firstItem.bottlesPerCase || 6} btls/case (6x750ml)`;

                  return (
                    <tr 
                      key={item._id} 
                      onClick={() => openEnquiryModal(item, 'checklist')}
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                      title="Click to inspect export dossier and customer notes"
                    >
                      <td className="px-6 py-4 font-bold text-blue-700 group-hover:underline">
                        {item.enquiryCode}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{item.buyer?.companyName || item.buyer?.contactPerson}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Globe size={11} className="text-blue-500 shrink-0" /> {item.destination?.country} ({item.destination?.destinationPort || 'Port TBD'})
                          </span>
                          {item.internalNotes?.length > 0 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEnquiryModal(item, 'notes');
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 transition-colors cursor-pointer"
                              title="View customer notes"
                            >
                              <MessageSquare size={10} /> {item.internalNotes.length} note{item.internalNotes.length === 1 ? '' : 's'}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          {firstItem.productName}
                          {firstItem.vintage && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                              {firstItem.vintage}
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Package size={11} className="text-blue-500 shrink-0" /> {pack}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800">{totalCases} Cases</p>
                        <p className="text-[11px] text-slate-500 font-medium">{totalBottles} bottles</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 font-bold text-blue-700 bg-blue-50 rounded border border-blue-200">
                          {item.incoterms || 'CIF'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={item.stage} />
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEnquiryModal(item, 'notes')}
                            className="px-2.5 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl font-bold transition-all text-xs border border-slate-200 cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Add or view customer notes"
                          >
                            <MessageSquare size={12} /> Notes
                          </button>
                          <button
                            type="button"
                            onClick={() => openEnquiryModal(item, 'checklist')}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl font-bold transition-all text-xs cursor-pointer shadow-xs flex items-center gap-1"
                          >
                            <FileCheck size={12} /> Inspect Docs
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* TAB 2: Vendor Export Verification & Compliance Directory */}
      {activeMainTab === 'vendors' && (
        <div className="space-y-6">
          {/* Summary / Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Vendor Export Compliance & Customs Directory
                </h3>
                <p className="text-xs text-slate-500">
                  Centralized registry of wineries, distilleries, and producers with customs clearance and export capabilities
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchExportVendors}
                disabled={loadingVendors}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
              >
                <RefreshCw size={13} className={loadingVendors ? 'animate-spin' : ''} />
                Refresh Registry
              </button>
            </div>
          </div>

          {/* Vendors Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Producer / Vendor</th>
                    <th className="px-6 py-3.5">Customs Export Code</th>
                    <th className="px-6 py-3.5">Capabilities</th>
                    <th className="px-6 py-3.5">Export Status</th>
                    <th className="px-6 py-3.5">Monthly Capacity</th>
                    <th className="px-6 py-3.5">Trade Products</th>
                    <th className="px-6 py-3.5">Compliance Docs</th>
                    <th className="px-6 py-3.5 text-right">Audit & Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingVendors ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                        <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-500" />
                        Loading export vendors registry...
                      </td>
                    </tr>
                  ) : exportVendors.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                        <Building size={32} className="mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-600">No Export-Capable Vendors Registered Yet</p>
                        <p className="text-xs text-slate-400 mt-1">Vendors selecting 'International' or 'Both' capabilities will appear here for customs verification.</p>
                      </td>
                    </tr>
                  ) : (
                    exportVendors.map((vendor) => {
                      const ep = vendor.exportProfile || {};
                      const tradingName = vendor.businessInfo?.tradingName || vendor.businessInfo?.legalName || vendor.userId?.name || 'Producer';
                      const customsCode = ep.customsExportCode || vendor.customsInfo?.exportCode || 'Not Assigned';
                      const status = ep.isExportApproved || 'pending_approval';
                      const docCount = (ep.documents || []).length;

                      return (
                        <tr key={vendor._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900 text-sm">{tradingName}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span>{vendor.userId?.email || 'No email'}</span>
                              {vendor.businessInfo?.address?.country && (
                                <>
                                  <span>•</span>
                                  <span>{vendor.businessInfo.address.country}</span>
                                </>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                              {customsCode}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                              {vendor.sellingCapabilities === 'both' ? 'Domestic & Export' : (vendor.sellingCapabilities || 'Export')}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                              status === 'approved' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : status === 'rejected'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {status === 'approved' && <CheckCircle2 size={11} />}
                              {status === 'pending_approval' && <Clock size={11} />}
                              {status === 'rejected' && <AlertTriangle size={11} />}
                              {status === 'approved' ? 'Export Certified' : status === 'rejected' ? 'Rejected' : 'Audit Pending'}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-700">
                              {ep.monthlyCapacityCases ? `${ep.monthlyCapacityCases.toLocaleString()} cases/mo` : 'Unspecified'}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="font-bold text-blue-700 px-2 py-0.5 bg-blue-50 rounded-md border border-blue-200">
                              {vendor.tradeProductCount || 0} Ready
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                              <FileText size={12} className="text-slate-400" />
                              {docCount} File{docCount !== 1 ? 's' : ''}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setVerificationModalVendor(vendor);
                                setVerificationStatus(ep.isExportApproved || 'approved');
                                setReviewerNotes(ep.reviewerNotes || '');
                              }}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded-xl font-bold transition-all text-xs cursor-pointer shadow-2xs inline-flex items-center gap-1"
                            >
                              <ShieldCheck size={12} /> Audit & Verify
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Automated Supplier Matcher */}
      {activeMainTab === 'matcher' && (
        <div className="space-y-6">
          {/* Query Form */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Intelligent International Supplier & Product Matcher
                </h3>
                <p className="text-xs text-slate-500">
                  Instant algorithmic matching of RFQs to certified export wineries and bulk trade inventory
                </p>
              </div>
            </div>

            <form onSubmit={runSupplierMatcher} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Category</label>
                <select
                  value={matcherQuery.category}
                  onChange={(e) => setMatcherQuery({ ...matcherQuery, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                >
                  <option value="Wine">Wine (Red, White, Rosé, Cap Classique)</option>
                  <option value="Spirits">Spirits (Gin, Brandy, Whisky, Rum)</option>
                  <option value="Beer">Craft Beer & Ciders</option>
                  <option value="Cigars">Cigars & Tobacco</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Destination Market</label>
                <input
                  type="text"
                  placeholder="e.g. United Kingdom, UAE, USA"
                  value={matcherQuery.destinationMarket}
                  onChange={(e) => setMatcherQuery({ ...matcherQuery, destinationMarket: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Volume (Cases)</label>
                <input
                  type="number"
                  min="1"
                  value={matcherQuery.volumeCases}
                  onChange={(e) => setMatcherQuery({ ...matcherQuery, volumeCases: Number(e.target.value) || 10 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Required Incoterms</label>
                <div className="flex gap-2">
                  <select
                    value={matcherQuery.incoterm}
                    onChange={(e) => setMatcherQuery({ ...matcherQuery, incoterm: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="FOB">FOB (Free On Board)</option>
                    <option value="CIF">CIF (Cost, Ins, Freight)</option>
                    <option value="EXW">EXW (Ex Works)</option>
                    <option value="DDP">DDP (Delivered Duty Paid)</option>
                  </select>

                  <button
                    type="submit"
                    disabled={runningMatcher}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    <Sparkles size={14} className={runningMatcher ? 'animate-spin' : ''} />
                    {runningMatcher ? 'Matching...' : 'Match'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Match Results */}
          {matcherResults && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>Matched Producers & Inventory</span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200">
                    {matcherResults.totalMatches} Matches Found
                  </span>
                </h4>
              </div>

              {matcherResults.matches?.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
                  <AlertTriangle size={32} className="mx-auto mb-2 text-amber-500" />
                  <p className="font-semibold text-slate-700">No Direct Producer Match Found</p>
                  <p className="text-xs text-slate-400 mt-1">Try adjusting the destination market or volume criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {matcherResults.matches.map((item, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-extrabold text-slate-900 text-base">{item.vendor.businessName}</h5>
                            <span className="font-mono text-[10px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                              {item.vendor.exportCode}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Capacity: {typeof item.vendor.monthlyCapacityCases === 'number' ? `${item.vendor.monthlyCapacityCases.toLocaleString()} cases/mo` : item.vendor.monthlyCapacityCases}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border ${
                            item.matchScore >= 70
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : item.matchScore >= 40
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}>
                            <Sparkles size={11} /> {item.matchScore}% Match
                          </span>
                        </div>
                      </div>

                      {/* Match Reasons */}
                      <div className="flex flex-wrap gap-1.5">
                        {item.matchReasons?.map((reason, rIdx) => (
                          <span key={rIdx} className="text-[10px] font-semibold px-2 py-0.5 bg-slate-50 text-slate-600 rounded-md border border-slate-200 flex items-center gap-1">
                            <Check size={10} className="text-emerald-500" /> {reason}
                          </span>
                        ))}
                      </div>

                      {/* Matching Export Products */}
                      {item.matchingProducts?.length > 0 && (
                        <div className="border-t border-slate-100 pt-3 space-y-2">
                          <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Available Export Stock</p>
                          <div className="space-y-1.5">
                            {item.matchingProducts.slice(0, 3).map((prod) => (
                              <div key={prod._id} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl text-xs">
                                <div className="flex items-center gap-2">
                                  {prod.image && (
                                    <img src={prod.image} alt={prod.name} className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
                                  )}
                                  <div>
                                    <div className="font-bold text-slate-900">{prod.name}</div>
                                    <div className="text-[10px] text-slate-400">
                                      MOQ: {prod.moqBottles} btls • {prod.bottlesPerCase} btls/case
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="font-extrabold text-blue-700">R {prod.tradePrice}</div>
                                  <div className="text-[10px] text-slate-400">Wholesale / btl</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4th Tab: Trade Analytics, Funnel, Expiring Docs & Confirmed Orders */}
      {activeMainTab === 'analytics' && (
        <div className="space-y-6">
          {/* Executive KPI Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Trade Orders</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {analyticsData?.financials?.totalOrders ?? tradeOrders.length}
                </h3>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                  <ArrowUpRight size={13} /> Active B2B Consignments
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <FileBadge size={22} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Gross Export GMV</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  ${((analyticsData?.financials?.totalGMV || 0)).toLocaleString()}
                </h3>
                <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                  Export Contract Volume
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <DollarSign size={22} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Platform Commission</p>
                <h3 className="text-2xl font-black text-blue-700 mt-1">
                  ${((analyticsData?.financials?.totalCommissions || 0)).toLocaleString()}
                </h3>
                <span className="text-[10px] text-slate-400 font-mono mt-1 block">
                  Settled: ${((analyticsData?.financials?.settledCommissions || 0)).toLocaleString()} • Pending: ${((analyticsData?.financials?.pendingCommissions || 0)).toLocaleString()}
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                <Award size={22} />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reserved / Shipped Cases</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {((analyticsData?.financials?.totalCasesShipped || 0)).toLocaleString()}
                </h3>
                <span className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 mt-1">
                  <Package size={13} /> Cellar Allocated Stock
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Truck size={22} />
              </div>
            </div>
          </div>

          {/* Two-Column: Stage Conversion Funnel & Global Buyer Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversion Funnel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <TrendingUp size={16} className="text-blue-600" />
                    B2B Export Conversion Funnel
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Stage progression from enquiry received to customs delivered</p>
                </div>
                <button 
                  onClick={fetchAnalyticsAndOrders}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 cursor-pointer"
                  title="Refresh metrics"
                >
                  <RefreshCw size={14} className={loadingAnalytics ? 'animate-spin' : ''} />
                </button>
              </div>

              {(() => {
                const f = analyticsData?.funnel || {};
                const totalIn = Math.max(
                  (f.enquiry_received || 0) + (f.requirements_verified || 0) + (f.quote_prepared || 0) + (f.confirmed_order || 0) + (f.delivered_cleared || 0),
                  1
                );
                const stages = [
                  { label: '1. RFQ Enquiries Received', count: f.enquiry_received || 0, color: 'bg-blue-500' },
                  { label: '2. Specifications Verified', count: f.requirements_verified || 0, color: 'bg-indigo-500' },
                  { label: '3. Quotation Prepared & Sent', count: f.quote_prepared || 0, color: 'bg-purple-500' },
                  { label: '4. Commercial Negotiation', count: f.negotiation || 0, color: 'bg-amber-500' },
                  { label: '5. Confirmed Trade Orders', count: f.confirmed_order || 0, color: 'bg-emerald-500' },
                  { label: '6. In-Transit Ocean/Air', count: f.in_transit || 0, color: 'bg-cyan-500' },
                  { label: '7. Delivered & Customs Cleared', count: f.delivered_cleared || 0, color: 'bg-teal-500' },
                ];

                return (
                  <div className="space-y-3 pt-1">
                    {stages.map((st, idx) => {
                      const pct = Math.min(Math.round((st.count / totalIn) * 100), 100);
                      return (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700">{st.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{st.count}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({pct}%)</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full ${st.color} transition-all duration-500 rounded-full`} 
                              style={{ width: `${Math.max(pct, st.count > 0 ? 8 : 2)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Global Buyer Demand Heatmap */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Globe size={16} className="text-blue-600" />
                    Buyer Demand by Destination Country
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Top international export territories and case commitments</p>
                </div>
              </div>

              {(!analyticsData?.demandByCountry || analyticsData.demandByCountry.length === 0) ? (
                <div className="py-12 text-center text-slate-400">
                  <Globe size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs">No territory breakdown recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  {analyticsData.demandByCountry.map((item, idx) => {
                    const countryName = item._id || 'Unspecified Territory';
                    const cases = item.totalCases || 0;
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-mono font-bold text-[10px] flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900">{countryName}</div>
                            <div className="text-[10px] text-slate-400">{item.enquiryCount} Enquiries / Leads</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold text-blue-700">{cases} Cases</div>
                          <div className="text-[10px] text-slate-400">Total Demand</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Expiring Compliance Documents Alert Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-500" />
                  Customs & Vendor Document Expiry Monitor
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Automated detection of vendor export licenses, excise bonds & health certificates requiring renewal</p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                expiringDocs.length > 0
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {expiringDocs.length > 0 ? `${expiringDocs.length} Action Needed` : 'All Compliant'}
              </span>
            </div>

            {expiringDocs.length === 0 ? (
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/60 flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-900">Zero Impending Expirations Detected</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">All registered vendor export certificates, organic accreditations, and excise documents are valid for over 30 days.</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 uppercase">
                    <tr>
                      <th className="px-4 py-2.5">Producer</th>
                      <th className="px-4 py-2.5">Document Type</th>
                      <th className="px-4 py-2.5">Reference No</th>
                      <th className="px-4 py-2.5">Expiry Date</th>
                      <th className="px-4 py-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {expiringDocs.map((doc, dIdx) => (
                      <tr key={dIdx} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-bold text-slate-900">{doc.vendorName}</td>
                        <td className="px-4 py-3 text-slate-700">{doc.docName}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{doc.referenceNumber || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{new Date(doc.expiryDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                            doc.isExpired 
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {doc.isExpired ? 'EXPIRED' : `${doc.daysLeft} days left`}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Confirmed B2B Commercial Trade Orders Register */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileCheck size={16} className="text-blue-600" />
                  Official Commercial Trade Orders Register
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Legally converted orders with transactional cellar inventory reservations</p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                {tradeOrders.length} Converted
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Order Code</th>
                    <th className="px-6 py-3.5">Buyer & Destination</th>
                    <th className="px-6 py-3.5">Volume & Incoterm</th>
                    <th className="px-6 py-3.5">Contract Total</th>
                    <th className="px-6 py-3.5">Inventory Lock</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingOrders ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">Loading trade orders...</td>
                    </tr>
                  ) : tradeOrders.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-slate-400">
                        <Package size={32} className="mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-600">No Commercial Trade Orders Converted Yet</p>
                        <p className="text-xs text-slate-400 mt-1">Open an accepted enquiry in the pipeline and click "Convert to Trade Order" or have the buyer sign online.</p>
                      </td>
                    </tr>
                  ) : (
                    tradeOrders.map((ord) => (
                      <tr key={ord._id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                            {ord.orderCode}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{ord.buyer?.companyName || ord.buyer?.contactPerson}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Globe size={11} className="text-blue-500" />
                            {ord.destination?.country} ({ord.destination?.destinationPort || 'Port TBD'})
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-extrabold text-slate-800">{ord.reservedCasesCount || (ord.items || []).reduce((acc, i) => acc + (i.caseQuantity || 0), 0)} Cases</div>
                          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{ord.incoterms || 'CIF'}</div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-mono font-extrabold text-slate-900">
                            {ord.currency || 'USD'} {((ord.financials?.grandTotalAmount || 0)).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            Comm: {ord.currency || 'USD'} {((ord.financials?.platformCommissionAmount || 0)).toLocaleString()}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} /> Stock Reserved
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                            {ord.status?.replace('_', ' ') || 'ACTIVE'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Export Capability Audit Modal */}
      {verificationModalVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Audit Export Capability & Customs Compliance
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify customs registration, international documentation, and capacity
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setVerificationModalVendor(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateVendorVerification} className="space-y-4 text-xs">
              {/* Vendor summary card */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-bold text-slate-900 text-sm">
                  {verificationModalVendor.businessInfo?.tradingName || verificationModalVendor.businessInfo?.legalName || verificationModalVendor.userId?.name}
                </div>
                <div className="text-slate-500 flex flex-wrap gap-x-3 text-[11px]">
                  <span>Customs Code: <strong>{verificationModalVendor.exportProfile?.customsExportCode || 'None'}</strong></span>
                  <span>Contact: {verificationModalVendor.userId?.email}</span>
                </div>
              </div>

              {/* Status Select */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Export Approval Status *</label>
                <select
                  value={verificationStatus}
                  onChange={(e) => setVerificationStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                >
                  <option value="approved">Approved (Certified for International Export)</option>
                  <option value="pending_approval">Pending Approval (Under Compliance Audit)</option>
                  <option value="rejected">Rejected (Non-Compliant / Missing Customs Docs)</option>
                </select>
              </div>

              {/* Reviewer Notes */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Compliance Auditor Notes & Reason</label>
                <textarea
                  rows="3"
                  value={reviewerNotes}
                  onChange={(e) => setReviewerNotes(e.target.value)}
                  placeholder="Document review notes, verified permits, required revisions..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Uploaded Documents List */}
              {verificationModalVendor.exportProfile?.documents?.length > 0 && (
                <div className="space-y-1.5 border-t border-slate-100 pt-3">
                  <label className="block font-bold text-slate-700">Uploaded Compliance Documents</label>
                  <div className="space-y-1">
                    {verificationModalVendor.exportProfile.documents.map((doc, dIdx) => (
                      <div key={dIdx} className="flex items-center justify-between p-2 bg-blue-50/50 border border-blue-100 rounded-lg">
                        <span className="font-medium text-slate-700 text-[11px]">{doc.title || doc.documentType}</span>
                        {doc.fileUrl && (
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline inline-flex items-center gap-1">
                            View <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setVerificationModalVendor(null)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingVerification}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {submittingVerification ? 'Saving...' : 'Save Audit Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Checklist, Customer Notes & Details Modal */}
      {selectedEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-blue-700 text-sm tracking-tight">{selectedEnquiry.enquiryCode}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                    {selectedEnquiry.incoterms || 'CIF'} • {selectedEnquiry.currency || 'USD'}
                  </span>
                  <StatusBadge status={selectedEnquiry.stage} />
                </div>
                <h3 className="font-bold text-slate-900 text-base mt-1">
                  {selectedEnquiry.buyer?.companyName || selectedEnquiry.buyer?.contactPerson}
                </h3>
                <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                  <span>Contact: <strong className="text-slate-700">{selectedEnquiry.buyer?.contactPerson || 'Procurement Officer'}</strong></span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Globe size={11} className="text-blue-500 shrink-0" />
                    {selectedEnquiry.destination?.country} ({selectedEnquiry.destination?.destinationPort || 'Port TBD'})
                  </span>
                  {selectedEnquiry.buyer?.email && (
                    <>
                      <span>•</span>
                      <span className="text-slate-500">{selectedEnquiry.buyer.email}</span>
                    </>
                  )}
                  {selectedEnquiry.buyer?.phone && (
                    <>
                      <span>•</span>
                      <span className="text-slate-500">{selectedEnquiry.buyer.phone}</span>
                    </>
                  )}
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedEnquiry(null)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Tab Switcher */}
            <div className="flex border-b border-slate-200 gap-1">
              <button
                type="button"
                onClick={() => setModalTab('checklist')}
                className={`flex items-center gap-1.5 px-3.5 py-2 font-bold text-xs border-b-2 transition-all cursor-pointer ${
                  modalTab === 'checklist'
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileCheck size={14} />
                <span>Verified Checklist</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  modalTab === 'checklist' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {getVerifiedCount(selectedEnquiry)}/{EXPORT_CHECKLIST_DOCS.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('notes')}
                className={`flex items-center gap-1.5 px-3.5 py-2 font-bold text-xs border-b-2 transition-all cursor-pointer ${
                  modalTab === 'notes'
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <MessageSquare size={14} />
                <span>Customer Notes</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  modalTab === 'notes' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {selectedEnquiry.internalNotes?.length || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('packaging')}
                className={`flex items-center gap-1.5 px-3.5 py-2 font-bold text-xs border-b-2 transition-all cursor-pointer ${
                  modalTab === 'packaging'
                    ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Package size={14} />
                <span>Product & Packaging</span>
              </button>
            </div>

            {/* TAB 1: Verified Checklist */}
            {modalTab === 'checklist' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-blue-50/70 p-3 rounded-xl border border-blue-100">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-blue-600" /> Mandatory Customs & Export Documentation
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Verify commercial and port documents required for ocean/air freight customs clearance
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-extrabold text-blue-700">
                      {getVerifiedCount(selectedEnquiry)} of {EXPORT_CHECKLIST_DOCS.length}
                    </span>
                    <p className="text-[10px] text-slate-500 font-medium">Verified</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {EXPORT_CHECKLIST_DOCS.map((doc) => {
                    const isVerified = getDocVerificationStatus(selectedEnquiry, doc.key);
                    return (
                      <div 
                        key={doc.key} 
                        className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                          isVerified ? 'bg-emerald-50/40 border-emerald-200/70' : 'bg-slate-50 border-slate-200/70'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs">{doc.label}</span>
                            {isVerified ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300">
                                <CheckCircle2 size={11} /> Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md">
                                Pending Verification
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{doc.desc}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDocToggle(selectedEnquiry._id, doc.key, isVerified)}
                          className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer shrink-0 shadow-xs ${
                            isVerified 
                              ? 'bg-emerald-600 hover:bg-rose-600 text-white' 
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                          title={isVerified ? 'Click to unmark document' : 'Click to verify document'}
                        >
                          {isVerified ? '✓ Verified (Unmark)' : 'Mark Verified'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: Customer Notes */}
            {modalTab === 'notes' && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-blue-600" /> Customer Trade Notes & Instructions
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Log custom packing requests, buyer communications, tariff specifics, and inspection directives for {selectedEnquiry.buyer?.companyName || 'this customer'}
                  </p>
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Add Note for {selectedEnquiry.buyer?.companyName || 'Customer'}
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder={`e.g. Customer requested packing list with gross/net pallet breakdown and custom bilingual export labels (Arabic/English). Verified by trade desk...`}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Notes are permanently logged to this customer's dossier</span>
                    <button
                      type="submit"
                      disabled={submittingNote || !newNoteText.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
                    >
                      <Send size={13} /> {submittingNote ? 'Saving Note...' : 'Add Customer Note'}
                    </button>
                  </div>
                </form>

                {/* Notes Stream */}
                <div className="space-y-2.5 max-h-64 overflow-y-auto crm-scrollbar">
                  {(!selectedEnquiry.internalNotes || selectedEnquiry.internalNotes.length === 0) ? (
                    <div className="py-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      <MessageSquare size={28} className="mx-auto text-slate-300 mb-1.5" />
                      <p className="text-xs font-semibold">No notes recorded for this customer yet</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Use the box above to add notes, preferences, or packing instructions.</p>
                    </div>
                  ) : (
                    selectedEnquiry.internalNotes.slice().reverse().map((noteItem, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                          <span className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                            {noteItem.authorName || 'Trade Manager'}
                          </span>
                          <span className="flex items-center gap-1 text-slate-400">
                            <Clock size={11} /> {new Date(noteItem.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200/60 whitespace-pre-wrap leading-relaxed">
                          {noteItem.note}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Product & Packaging */}
            {modalTab === 'packaging' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Wine size={14} className="text-blue-600" /> Export Product & Packaging Specifications
                  </p>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md border border-blue-200">
                    {selectedEnquiry.incoterms || 'CIF'} • {selectedEnquiry.currency || 'USD'}
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-2">
                  {(selectedEnquiry.itemsRequested && selectedEnquiry.itemsRequested.length > 0
                    ? selectedEnquiry.itemsRequested
                    : [{
                        productName: 'South African Fine Wine Collection',
                        caseQuantity: 20,
                        bottlesPerCase: 6,
                        packFormat: '6x750ml (6 btls/case)'
                      }]
                  ).map((item, idx) => {
                    const bpc = item.bottlesPerCase || 6;
                    const cases = item.caseQuantity || 1;
                    const totalBottles = cases * bpc;
                    const pack = item.packFormat || `${bpc}x750ml (${bpc} btls/case)`;

                    return (
                      <div key={idx} className="p-2.5 bg-white rounded-lg border border-slate-200/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs truncate">{item.productName}</span>
                            {item.vintage && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                {item.vintage}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-1">
                            <span className="flex items-center gap-1">
                              <Package size={12} className="text-blue-500 shrink-0" />
                              Format: <strong className="text-slate-700">{pack}</strong>
                            </span>
                            <span>•</span>
                            <span>{bpc} btls/case</span>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-100 shrink-0">
                          <span className="text-xs font-extrabold text-blue-700">{cases} Cases</span>
                          <span className="text-[11px] text-slate-500 font-medium">({totalBottles} bottles)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadProforma(selectedEnquiry)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer transition-all"
                  title="Download Official Proforma PDF"
                >
                  <Download size={13} /> Proforma PDF
                </button>
                <button
                  type="button"
                  onClick={() => handlePrintProforma(selectedEnquiry)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  title="Open Printable Proforma View"
                >
                  <Printer size={13} /> Print Sheet
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyBuyerLink(selectedEnquiry)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  title="Copy buyer acceptance portal link"
                >
                  <Copy size={13} /> Copy Buyer Link
                </button>
              </div>

              <div className="flex items-center gap-2">
                {selectedEnquiry.stage === 'confirmed_order' ? (
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" /> Official Order Active
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={convertingOrderId === selectedEnquiry._id}
                    onClick={() => handleConvertToTradeOrder(selectedEnquiry)}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    <CheckSquare size={14} />
                    {convertingOrderId === selectedEnquiry._id ? 'Reserving Inventory...' : 'Convert to Trade Order'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedEnquiry(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Export Lead Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Create International B2B Export Lead</h3>
                <p className="text-[11px] text-slate-500">Add buyer details, product allocation, and case packaging configuration</p>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              {/* Buyer section */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Consignee & Destination</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Company / Importer Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Al-Maya Hospitality LLC"
                      value={newEnquiryData.companyName}
                      onChange={(e) => setNewEnquiryData({ ...newEnquiryData, companyName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contact Person *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Farhan Qureshi"
                      value={newEnquiryData.contactPerson}
                      onChange={(e) => setNewEnquiryData({ ...newEnquiryData, contactPerson: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="trade@company.ae"
                      value={newEnquiryData.email}
                      onChange={(e) => setNewEnquiryData({ ...newEnquiryData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="+971 4 332 9000"
                      value={newEnquiryData.phone}
                      onChange={(e) => setNewEnquiryData({ ...newEnquiryData, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Destination Country *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. United Arab Emirates"
                      value={newEnquiryData.destinationCountry}
                      onChange={(e) => setNewEnquiryData({ ...newEnquiryData, destinationCountry: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Destination Port</label>
                    <input
                      type="text"
                      placeholder="e.g. Jebel Ali, Dubai"
                      value={newEnquiryData.destinationPort}
                      onChange={(e) => setNewEnquiryData({ ...newEnquiryData, destinationPort: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Product and Packaging Section ("here also add prucdt and in which 6*6 or something") */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Wine size={13} className="text-blue-600" /> Product & Packaging Configuration
                </p>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Product Name / Allocation *</label>
                    <input
                      type="text"
                      required
                      list="export-products-list"
                      placeholder="e.g. South African Reserve Fine Wine"
                      value={newEnquiryData.productName}
                      onChange={(e) => setNewEnquiryData({ ...newEnquiryData, productName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                    />
                    <datalist id="export-products-list">
                      <option value="South African Fine Wine Collection" />
                      <option value="Haute Cabrière Chardonnay Pinot Noir" />
                      <option value="Bouchard Finlayson Galpin Peak Pinot Noir" />
                      <option value="Dobbe Cognac XO Rare Reserve" />
                      <option value="Franschhoek Cellars Private Reserve" />
                      {catalogProducts.map(p => (
                        <option key={p.id || p._id} value={p.name} />
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Vintage (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 2021 / NV"
                      value={newEnquiryData.vintage}
                      onChange={(e) => setNewEnquiryData({ ...newEnquiryData, vintage: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Packaging Format (e.g. 6*6)</label>
                    <select
                      value={newEnquiryData.packFormat}
                      onChange={(e) => handlePackFormatChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                    >
                      {STANDARD_PACK_FORMATS.map((fmt) => (
                        <option key={fmt.value} value={fmt.value}>{fmt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Bottles per Case *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newEnquiryData.bottlesPerCase}
                      onChange={(e) => setNewEnquiryData({ ...newEnquiryData, bottlesPerCase: Number(e.target.value) || 1 })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {newEnquiryData.packFormat === 'custom' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Custom Pack Specification (e.g. 6*6 pack)</label>
                    <input
                      type="text"
                      placeholder="e.g. 6*6 (36 bottles) or 6x750ml Gift Pack"
                      value={newEnquiryData.customPackFormat}
                      onChange={(e) => setNewEnquiryData({ ...newEnquiryData, customPackFormat: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* Commercial Terms Section */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Volume & Incoterms</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Case Quantity *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={newEnquiryData.caseQuantity}
                      onChange={(e) => setNewEnquiryData({ ...newEnquiryData, caseQuantity: Number(e.target.value) || 1 })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Incoterms</label>
                    <select
                      value={newEnquiryData.incoterms}
                      onChange={(e) => setNewEnquiryData({ ...newEnquiryData, incoterms: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                    >
                      <option value="CIF">CIF (Cost, Ins, Freight)</option>
                      <option value="FOB">FOB (Free On Board)</option>
                      <option value="EXW">EXW (Ex Works)</option>
                      <option value="DDP">DDP (Delivered Duty Paid)</option>
                      <option value="DAP">DAP (Delivered at Place)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Currency</label>
                    <select
                      value={newEnquiryData.currency}
                      onChange={(e) => setNewEnquiryData({ ...newEnquiryData, currency: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="ZAR">ZAR (R)</option>
                      <option value="AED">AED (د.إ)</option>
                    </select>
                  </div>
                </div>

                {/* Total Volume Live Preview */}
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package size={16} className="text-blue-600 shrink-0" />
                    <div>
                      <span className="font-bold text-slate-800 text-xs">Total Export Volume: </span>
                      <strong className="text-blue-700 text-xs">
                        {newEnquiryData.caseQuantity} Cases ({newEnquiryData.caseQuantity * (newEnquiryData.bottlesPerCase || 6)} Bottles)
                      </strong>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600">
                    Format: {newEnquiryData.packFormat === 'custom' ? (newEnquiryData.customPackFormat || 'Custom') : newEnquiryData.packFormat}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Export Dossier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
