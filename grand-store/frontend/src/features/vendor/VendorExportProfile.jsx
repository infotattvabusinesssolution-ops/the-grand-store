import React, { useState, useEffect } from 'react';
import { 
  Globe, ShieldCheck, Clock, AlertTriangle, FileText, UploadCloud, 
  CheckCircle2, Building2, Package, Truck, ExternalLink, Save, Loader2, ArrowRight
} from 'lucide-react';
import api from '../../api';

export default function VendorExportProfile({ onNotify }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sellingCapabilities, setSellingCapabilities] = useState('domestic');
  const [exportProfile, setExportProfile] = useState({
    approvalStatus: 'not_applied',
    businessType: 'winery',
    exportExperience: 'first_time',
    customsExportCode: '',
    monthlyCapacityCases: 500,
    moqBottles: 120,
    packaging: {
      standardBottlesPerCase: 6,
      casesPerPallet: 56,
      palletsPer20ftContainer: 10,
      palletsPer40ftContainer: 20
    },
    markets: {
      targetMarkets: ['United Kingdom', 'European Union', 'United Arab Emirates'],
      restrictedMarkets: []
    },
    tradeTerms: {
      supportedIncoterms: ['FOB', 'EXW', 'CIF'],
      standardLeadTimeDays: 21,
      paymentTermsSupported: ['wire_transfer_advance', 'letter_of_credit']
    },
    documents: [],
    reviewerNotes: ''
  });

  const [docUploadState, setDocUploadState] = useState({
    docType: 'export_licence',
    docNumber: '',
    file: null,
    uploading: false
  });

  useEffect(() => {
    fetchExportProfile();
  }, []);

  const fetchExportProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/vendor/export-profile');
      if (res.data?.success) {
        setSellingCapabilities(res.data.sellingCapabilities || 'domestic');
        if (res.data.exportProfile) {
          setExportProfile(prev => ({
            ...prev,
            ...res.data.exportProfile,
            packaging: { ...prev.packaging, ...(res.data.exportProfile.packaging || {}) },
            markets: { ...prev.markets, ...(res.data.exportProfile.markets || {}) },
            tradeTerms: { ...prev.tradeTerms, ...(res.data.exportProfile.tradeTerms || {}) },
            documents: res.data.exportProfile.documents || []
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load export profile', err);
      if (onNotify) onNotify('Failed to load export capability profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const res = await api.put('/vendor/export-profile', {
        sellingCapabilities,
        exportProfile
      });
      if (res.data?.success) {
        if (onNotify) onNotify('Export capability profile updated successfully!');
        setExportProfile(prev => ({ ...prev, ...(res.data.exportProfile || {}) }));
      }
    } catch (err) {
      console.error('Error saving export profile:', err);
      if (onNotify) onNotify(err.response?.data?.message || 'Error saving profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!docUploadState.file) return;

    try {
      setDocUploadState(prev => ({ ...prev, uploading: true }));
      const formData = new FormData();
      formData.append('document', docUploadState.file);

      const uploadRes = await api.post('/vendor/export-profile/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const newDoc = {
        docType: docUploadState.docType,
        documentNumber: docUploadState.docNumber,
        fileUrl: uploadRes.data.url,
        uploadedAt: new Date(),
        verified: false
      };

      const updatedDocs = [...(exportProfile.documents || []), newDoc];
      const updatedProfile = { ...exportProfile, documents: updatedDocs };
      setExportProfile(updatedProfile);

      // Auto-save to backend
      await api.put('/vendor/export-profile', {
        sellingCapabilities,
        exportProfile: updatedProfile
      });

      setDocUploadState({
        docType: 'export_licence',
        docNumber: '',
        file: null,
        uploading: false
      });

      if (onNotify) onNotify('Export credential uploaded and saved to compliance vault!');
    } catch (err) {
      console.error('Error uploading export document:', err);
      if (onNotify) onNotify('Failed to upload document', 'error');
      setDocUploadState(prev => ({ ...prev, uploading: false }));
    }
  };

  const toggleIncoterm = (term) => {
    const current = exportProfile.tradeTerms?.supportedIncoterms || [];
    const next = current.includes(term)
      ? current.filter(t => t !== term)
      : [...current, term];
    setExportProfile({
      ...exportProfile,
      tradeTerms: { ...exportProfile.tradeTerms, supportedIncoterms: next }
    });
  };

  const toggleMarket = (market) => {
    const current = exportProfile.markets?.targetMarkets || [];
    const next = current.includes(market)
      ? current.filter(m => m !== market)
      : [...current, market];
    setExportProfile({
      ...exportProfile,
      markets: { ...exportProfile.markets, targetMarkets: next }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px] text-[#e1bd70]">
        <Loader2 className="animate-spin mr-3" size={24} />
        <span>Loading Export Capability Profile...</span>
      </div>
    );
  }

  const status = exportProfile.approvalStatus || 'not_applied';

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto pb-16 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-[#c9a35b]/10 text-[#e1bd70] border border-[#c9a35b]/20">
              <Globe size={24} />
            </span>
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif text-[var(--color-ivory)]">
                International Trade & Export Profile
              </h1>
              <p className="text-xs sm:text-sm text-[var(--color-ivory-muted)] mt-0.5">
                Manage your winery or distillery's export readiness, bulk capacities, Incoterms, and customs credentials.
              </p>
            </div>
          </div>
        </div>

        {/* Approval Status Badge */}
        <div className="flex items-center gap-3">
          {status === 'approved' && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck size={16} /> Verified Export Supplier
            </div>
          )}
          {status === 'pending_approval' && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider">
              <Clock size={16} /> Export Audit Pending
            </div>
          )}
          {status === 'not_applied' && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/70 text-xs font-semibold uppercase tracking-wider">
              Domestic Only
            </div>
          )}
          {status === 'rejected' && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold uppercase tracking-wider">
              <AlertTriangle size={16} /> Compliance Review Required
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c9a35b] hover:bg-[#e1bd70] text-black font-semibold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Reviewer Note Alert if present */}
      {exportProfile.reviewerNotes && (
        <div className="p-4 rounded-xl bg-[#c9a35b]/10 border border-[#c9a35b]/30 text-[#f5e6c8] text-xs leading-relaxed flex items-start gap-3">
          <AlertTriangle size={18} className="text-[#e1bd70] shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold uppercase tracking-wider text-[11px] text-[#e1bd70]">
              Trade Directorate Audit Notes
            </div>
            <p className="mt-1">{exportProfile.reviewerNotes}</p>
          </div>
        </div>
      )}

      {/* Section 1: Dual Sales Channels Setting */}
      <div className="bg-[#0e0d0a] border border-white/10 rounded-2xl p-6 sm:p-7 relative overflow-hidden">
        <h2 className="text-lg font-serif text-[var(--color-ivory)] mb-2 flex items-center gap-2">
          <Building2 size={18} className="text-[#e1bd70]" />
          Sales Channels & Market Reach
        </h2>
        <p className="text-xs text-[var(--color-ivory-muted)] mb-5">
          Choose whether your business operates exclusively for local retail, international B2B bulk export, or both connected channels.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              id: 'domestic',
              title: 'Domestic Retail Only',
              desc: 'Sell individual bottles and cases directly to South African consumers.',
              icon: Package
            },
            {
              id: 'both',
              title: 'Both Channels (Recommended)',
              desc: 'Sell bottles to local consumers AND bulk pallets/containers to overseas buyers.',
              icon: Globe
            },
            {
              id: 'international',
              title: 'International B2B Trade Only',
              desc: 'Dedicated to bulk export, wholesale pallet consignments, and container orders.',
              icon: Truck
            }
          ].map(option => {
            const isSelected = sellingCapabilities === option.id;
            const Icon = option.icon;
            return (
              <div
                key={option.id}
                onClick={() => setSellingCapabilities(option.id)}
                className={`p-5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#c9a35b]/10 border-[#c9a35b] text-[var(--color-ivory)] shadow-[0_0_15px_rgba(201,163,91,0.15)]'
                    : 'bg-black/30 border-white/10 text-white/60 hover:border-white/20 hover:text-white/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Icon size={20} className={isSelected ? 'text-[#e1bd70]' : 'text-white/40'} />
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-[#c9a35b] bg-[#c9a35b]' : 'border-white/20'}`}>
                      {isSelected && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                    </div>
                  </div>
                  <div className="font-semibold text-sm mb-1">{option.title}</div>
                  <div className="text-xs text-white/50 leading-relaxed">{option.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Export Capacity & Container Specs */}
      <div className="bg-[#0e0d0a] border border-white/10 rounded-2xl p-6 sm:p-7">
        <h2 className="text-lg font-serif text-[var(--color-ivory)] mb-2 flex items-center gap-2">
          <Truck size={18} className="text-[#e1bd70]" />
          Production Capacity & Container Specifications
        </h2>
        <p className="text-xs text-[var(--color-ivory-muted)] mb-5">
          These specifications enable our automated international trade matching engine to pair your inventory with overseas buyer RFQs.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#bdb5a6] font-bold mb-2">
              Monthly Capacity (Cases)
            </label>
            <input
              type="number"
              value={exportProfile.monthlyCapacityCases || ''}
              onChange={e => setExportProfile({ ...exportProfile, monthlyCapacityCases: Number(e.target.value) })}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a35b]"
              placeholder="e.g. 500"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#bdb5a6] font-bold mb-2">
              Export MOQ (Bottles)
            </label>
            <input
              type="number"
              value={exportProfile.moqBottles || ''}
              onChange={e => setExportProfile({ ...exportProfile, moqBottles: Number(e.target.value) })}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a35b]"
              placeholder="e.g. 120"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#bdb5a6] font-bold mb-2">
              Cases Per Pallet
            </label>
            <input
              type="number"
              value={exportProfile.packaging?.casesPerPallet || ''}
              onChange={e => setExportProfile({
                ...exportProfile,
                packaging: { ...exportProfile.packaging, casesPerPallet: Number(e.target.value) }
              })}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a35b]"
              placeholder="e.g. 56"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#bdb5a6] font-bold mb-2">
              Pallets Per 20ft Container
            </label>
            <input
              type="number"
              value={exportProfile.packaging?.palletsPer20ftContainer || ''}
              onChange={e => setExportProfile({
                ...exportProfile,
                packaging: { ...exportProfile.packaging, palletsPer20ftContainer: Number(e.target.value) }
              })}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a35b]"
              placeholder="e.g. 10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#bdb5a6] font-bold mb-2">
              Customs / Chamber of Commerce Export Code
            </label>
            <input
              type="text"
              value={exportProfile.customsExportCode || ''}
              onChange={e => setExportProfile({ ...exportProfile, customsExportCode: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a35b]"
              placeholder="e.g. ZA-EXP-49201"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-widest text-[#bdb5a6] font-bold mb-2">
              Standard Dispatch Lead Time (Days)
            </label>
            <input
              type="number"
              value={exportProfile.tradeTerms?.standardLeadTimeDays || ''}
              onChange={e => setExportProfile({
                ...exportProfile,
                tradeTerms: { ...exportProfile.tradeTerms, standardLeadTimeDays: Number(e.target.value) }
              })}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#c9a35b]"
              placeholder="e.g. 21"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Supported Incoterms & Target Markets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Incoterms */}
        <div className="bg-[#0e0d0a] border border-white/10 rounded-2xl p-6">
          <h3 className="text-base font-serif text-[var(--color-ivory)] mb-2">Supported Incoterms (2020)</h3>
          <p className="text-xs text-white/50 mb-4">Select the international shipping terms your winery supports:</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {['FOB', 'EXW', 'CIF', 'FCA', 'CFR', 'DAP'].map(term => {
              const active = exportProfile.tradeTerms?.supportedIncoterms?.includes(term);
              return (
                <button
                  type="button"
                  key={term}
                  onClick={() => toggleIncoterm(term)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold tracking-wider transition-all border ${
                    active
                      ? 'bg-[#c9a35b]/20 border-[#c9a35b] text-[#e1bd70]'
                      : 'bg-black/30 border-white/10 text-white/50 hover:border-white/20'
                  }`}
                >
                  {term}
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Markets */}
        <div className="bg-[#0e0d0a] border border-white/10 rounded-2xl p-6">
          <h3 className="text-base font-serif text-[var(--color-ivory)] mb-2">Target Export Continents & Markets</h3>
          <p className="text-xs text-white/50 mb-4">Countries and territories where your export rights are active:</p>
          <div className="flex flex-wrap gap-2">
            {[
              'United Kingdom', 'European Union', 'United States', 'United Arab Emirates', 
              'China / East Asia', 'Sub-Saharan Africa', 'Canada', 'Australia'
            ].map(market => {
              const active = exportProfile.markets?.targetMarkets?.includes(market);
              return (
                <button
                  type="button"
                  key={market}
                  onClick={() => toggleMarket(market)}
                  className={`py-1.5 px-3 rounded-full text-xs font-medium transition-all border ${
                    active
                      ? 'bg-[#c9a35b]/20 border-[#c9a35b] text-[#e1bd70]'
                      : 'bg-black/30 border-white/10 text-white/50 hover:border-white/20'
                  }`}
                >
                  {market}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 4: Export Compliance Document Vault */}
      <div className="bg-[#0e0d0a] border border-white/10 rounded-2xl p-6 sm:p-7">
        <h2 className="text-lg font-serif text-[var(--color-ivory)] mb-2 flex items-center gap-2">
          <FileText size={18} className="text-[#e1bd70]" />
          Verified Export Compliance Vault
        </h2>
        <p className="text-xs text-[var(--color-ivory-muted)] mb-5">
          Upload official government and port export certifications. All documents are stored securely in Grand Store's verified trade archive.
        </p>

        {/* Existing Documents */}
        <div className="space-y-3 mb-6">
          {exportProfile.documents && exportProfile.documents.length > 0 ? (
            exportProfile.documents.map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-black/40 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[#c9a35b]/10 text-[#e1bd70]">
                    <FileText size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white uppercase tracking-wider">
                      {doc.docType?.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[11px] text-white/50">
                      Ref: {doc.documentNumber || 'Official File'} · Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {doc.verified ? (
                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      Verified
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                      Pending Audit
                    </span>
                  )}
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg bg-white/5 text-white/60 hover:text-white transition-colors"
                    title="View Document"
                  >
                    <ExternalLink size={15} />
                  </a>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-white/40 italic p-4 rounded-xl bg-black/20 border border-dashed border-white/10 text-center">
              No export certificates uploaded yet. Upload your export permits and lab sheets below.
            </div>
          )}
        </div>

        {/* Upload New Document Form */}
        <form onSubmit={handleFileUpload} className="p-4 rounded-xl bg-black/30 border border-white/10 flex flex-col md:flex-row gap-3 items-end">
          <div className="w-full md:w-1/3">
            <label className="block text-[10px] uppercase tracking-widest text-[#bdb5a6] font-bold mb-1.5">
              Document Type
            </label>
            <select
              value={docUploadState.docType}
              onChange={e => setDocUploadState({ ...docUploadState, docType: e.target.value })}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c9a35b]"
            >
              <option value="export_licence">Export Permit / Licence</option>
              <option value="phytosanitary">Phytosanitary Clearance</option>
              <option value="certificate_of_origin">Certificate of Origin (SA)</option>
              <option value="lab_analysis">Lab Analysis / Certificate of Analysis</option>
              <option value="customs_registration">Customs Registration Certificate</option>
            </select>
          </div>

          <div className="w-full md:w-1/3">
            <label className="block text-[10px] uppercase tracking-widest text-[#bdb5a6] font-bold mb-1.5">
              Reference / Serial #
            </label>
            <input
              type="text"
              value={docUploadState.docNumber}
              onChange={e => setDocUploadState({ ...docUploadState, docNumber: e.target.value })}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c9a35b]"
              placeholder="e.g. DOC-2026-99"
            />
          </div>

          <div className="w-full md:w-1/3 flex items-center gap-2">
            <input
              type="file"
              id="exportDocInput"
              className="hidden"
              onChange={e => setDocUploadState({ ...docUploadState, file: e.target.files[0] })}
            />
            <label
              htmlFor="exportDocInput"
              className="flex-1 py-2 px-3 rounded-lg border border-dashed border-white/20 text-xs text-center cursor-pointer hover:border-[#c9a35b] text-white/70 truncate"
            >
              {docUploadState.file ? docUploadState.file.name : 'Choose File (PDF/JPG)'}
            </label>
            <button
              type="submit"
              disabled={!docUploadState.file || docUploadState.uploading}
              className="py-2 px-4 rounded-lg bg-[#c9a35b] hover:bg-[#e1bd70] text-black font-semibold text-xs tracking-wider uppercase transition-all disabled:opacity-40 shrink-0"
            >
              {docUploadState.uploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
