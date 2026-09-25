import React, { useState, useRef } from 'react';
import { 
  Upload, FileText, CheckCircle2, AlertTriangle, X, 
  Download, ShieldCheck, Users, RefreshCw, FileSpreadsheet, ArrowRight
} from 'lucide-react';
import { crmApi } from '../../services/crmApi';
import { useToast } from '../../context/ToastContext';

// Target Audience Options matching Section 8 cohorts
const AUDIENCE_COHORTS = [
  { id: 'auto', label: 'Auto-detect from CSV (or default)', type: 'retail', tag: '' },
  { id: 'wine_buyers', label: 'Fine Wine Collectors & Bordeaux Patrons', type: 'vip_collector', tag: 'wine_buyers' },
  { id: 'whisky_buyers', label: 'Rare Whisky & Spirits Enthusiasts', type: 'vip_collector', tag: 'whisky_buyers' },
  { id: 'international_buyers', label: 'International B2B Importers (GCC / EU / UK)', type: 'trade_buyer', tag: 'international_buyers' },
  { id: 'trade_wholesale', label: 'B2B Trade Wholesale & Sommeliers', type: 'trade_buyer', tag: 'trade_wholesale' },
  { id: 'auction_participants', label: 'Live Auction Bidders & Droplist Patrons', type: 'vip_collector', tag: 'auction_participants' },
  { id: 'tasting_attendees', label: 'Cellar Tasting & Masterclass Attendees', type: 'retail', tag: 'tasting_attendees' },
  { id: 'retail', label: 'Standard Retail Patrons (General)', type: 'retail', tag: '' }
];

export default function BulkImportCustomersModal({ isOpen, onClose, onSuccess, initialCohortId = 'auto' }) {
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [selectedCohort, setSelectedCohort] = useState(initialCohortId || 'auto');
  const [isAgeVerifiedDefault, setIsAgeVerifiedDefault] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [customTags, setCustomTags] = useState('');
  
  const [inputMode, setInputMode] = useState('file'); // 'file' | 'paste'
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const [parsedRows, setParsedRows] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  if (!isOpen) return null;

  // Robust CSV parser supporting quotes, delimiters, newlines
  const parseCSV = (text) => {
    if (!text || !text.trim()) return [];

    const lines = [];
    let curLine = [];
    let curVal = '';
    let inQuotes = false;

    // Normalize Windows CRLF to LF
    const cleanedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < cleanedText.length; i++) {
      const char = cleanedText[i];
      const nextChar = cleanedText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote "" -> "
          curVal += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if ((char === ',' || char === '\t' || char === ';') && !inQuotes) {
        curLine.push(curVal.trim());
        curVal = '';
      } else if (char === '\n' && !inQuotes) {
        curLine.push(curVal.trim());
        if (curLine.some(c => c.length > 0)) {
          lines.push(curLine);
        }
        curLine = [];
        curVal = '';
      } else {
        curVal += char;
      }
    }

    if (curVal.length > 0 || curLine.length > 0) {
      curLine.push(curVal.trim());
      if (curLine.some(c => c.length > 0)) {
        lines.push(curLine);
      }
    }

    if (lines.length < 2) return [];

    // Header normalization
    const rawHeaders = lines[0].map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
    
    // Map column indices
    const colIndex = {
      name: rawHeaders.findIndex(h => h.includes('name') || h.includes('patron') || h.includes('contact')),
      email: rawHeaders.findIndex(h => h.includes('email') || h.includes('mail')),
      phone: rawHeaders.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('tel') || h.includes('cell')),
      type: rawHeaders.findIndex(h => h.includes('tier') || h.includes('type') || h.includes('segment') || h.includes('cohort')),
      age: rawHeaders.findIndex(h => h.includes('age') || h.includes('18') || h.includes('adult') || h.includes('verified')),
      tags: rawHeaders.findIndex(h => h.includes('tag') || h.includes('interest') || h.includes('category')),
      notes: rawHeaders.findIndex(h => h.includes('note') || h.includes('comment') || h.includes('dossier'))
    };

    const records = [];
    for (let r = 1; r < lines.length; r++) {
      const row = lines[r];
      if (!row || row.length === 0) continue;

      const email = colIndex.email !== -1 ? (row[colIndex.email] || '') : (row[1] || '');
      const name = colIndex.name !== -1 ? (row[colIndex.name] || '') : (row[0] || '');
      const phone = colIndex.phone !== -1 ? (row[colIndex.phone] || '') : (row[2] || '');
      const type = colIndex.type !== -1 ? (row[colIndex.type] || '') : '';
      const ageVal = colIndex.age !== -1 ? (row[colIndex.age] || '') : '';
      const tags = colIndex.tags !== -1 ? (row[colIndex.tags] || '') : '';
      const notes = colIndex.notes !== -1 ? (row[colIndex.notes] || '') : '';

      const isValidEmail = email && email.includes('@') && email.includes('.');

      records.push({
        name: name || (email ? email.split('@')[0] : 'Valued Patron'),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        customerType: type,
        isAgeVerified: ageVal ? ['yes', 'true', '1', 'y', 'verified'].includes(ageVal.toLowerCase()) : isAgeVerifiedDefault,
        tags: tags,
        notes: notes,
        isValid: Boolean(isValidEmail)
      });
    }

    return records;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        const rows = parseCSV(text);
        setParsedRows(rows);
        if (rows.length === 0) {
          toast.warning('No valid rows found in the CSV. Please verify column headers.');
        } else {
          toast.info(`Parsed ${rows.length} rows (${rows.filter(r => r.isValid).length} valid).`);
        }
      } catch (err) {
        toast.error('Failed to parse CSV file: ' + err.message);
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsText(file);
  };

  const handlePastedTextChange = (text) => {
    setPastedText(text);
    if (!text.trim()) {
      setParsedRows([]);
      return;
    }
    const rows = parseCSV(text);
    setParsedRows(rows);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFileName(file.name);
      setIsParsing(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result;
          const rows = parseCSV(text);
          setParsedRows(rows);
        } catch (err) {
          toast.error('Failed to parse dropped CSV file');
        } finally {
          setIsParsing(false);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleDownloadSampleCsv = () => {
    const headers = ['Full Name', 'Email Address', 'Phone Number', 'Customer Tier', '18+ Verified', 'Tags', 'Notes'];
    const sampleRows = [
      ['"James Sterling"', '"james.sterling@example.com"', '"+27821234567"', '"vip_collector"', '"yes"', '"wine_buyers,bordeaux"', '"Bordeaux reserve allocation member"'],
      ['"Elena Rostova"', '"elena.r@luxurytrade.co.za"', '"+27839876543"', '"trade_buyer"', '"yes"', '"trade_wholesale,international"', '"Sommelier at Cape Town Grand Hotel"'],
      ['"Arthur Pendelton"', '"arthur.p@whiskycellar.co.za"', '"+27845550192"', '"vip_collector"', '"yes"', '"whisky_buyers,single_malt"', '"Rare Japanese single malt collector"'],
      ['"Claire De Villiers"', '"claire.dv@gmail.com"', '"+27824449811"', '"retail"', '"yes"', '"tasting_attendees,stellenbosch"', '"Attended Stellenbosch masterclass"']
    ];
    const csvContent = [headers.join(','), ...sampleRows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'grandstore_bulk_customers_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sample CSV template downloaded!');
  };

  const handleSubmitImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      toast.error('No valid rows with email addresses found to import.');
      return;
    }

    const cohortObj = AUDIENCE_COHORTS.find(c => c.id === selectedCohort);
    const defaultTagsList = customTags
      ? customTags.split(',').map(t => t.trim()).filter(Boolean)
      : [];
    if (cohortObj && cohortObj.tag) {
      defaultTagsList.push(cohortObj.tag);
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customers: validRows.map(r => ({
          name: r.name,
          email: r.email,
          phone: r.phone,
          customerType: r.customerType || cohortObj?.type || 'retail',
          isAgeVerified: isAgeVerifiedDefault,
          tags: r.tags ? r.tags.split(',').map(t => t.trim()).concat(defaultTagsList) : defaultTagsList,
          notes: r.notes
        })),
        defaultCustomerType: cohortObj?.type || 'retail',
        defaultAgeVerified: isAgeVerifiedDefault,
        defaultTags: defaultTagsList,
        targetSegment: cohortObj?.id !== 'auto' ? cohortObj?.id : '',
        updateExisting
      };

      const res = await crmApi.bulkImportCustomers(payload);
      if (res.data && res.data.success) {
        setImportResult(res.data.summary);
        toast.success(res.data.message || 'Customers imported successfully!');
        if (onSuccess) onSuccess(res.data);
      } else {
        toast.error(res.data?.message || 'Failed to complete bulk import');
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Bulk import failed. Please check data format.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-3xl w-full p-6 shadow-2xl space-y-5 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Upload size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Import Bulk Customers (CSV)</h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck size={12} /> 18+ Age Gated
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Bulk onboard patrons, wine club allocations, and B2B wholesale buyers with automated compliance validation.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Import Results View (if completed) */}
        {importResult ? (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 size={18} className="text-emerald-600" />
                Import Completed Successfully!
              </div>
              <p className="text-xs text-emerald-800">
                All records have been synchronized with statutory 18+ age verification and cohort classifications.
              </p>
            </div>

            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block">Total Processed</span>
                <span className="text-lg font-bold text-slate-900">{importResult.total}</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[11px] text-emerald-700 block">New Created</span>
                <span className="text-lg font-bold text-emerald-700">{importResult.created}</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <span className="text-[11px] text-blue-700 block">Profiles Updated</span>
                <span className="text-lg font-bold text-blue-700">{importResult.updated}</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="text-[11px] text-amber-700 block">Skipped / Ignored</span>
                <span className="text-lg font-bold text-amber-700">{importResult.skipped}</span>
              </div>
            </div>

            {importResult.errors && importResult.errors.length > 0 && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs space-y-1 max-h-32 overflow-y-auto">
                <span className="font-bold text-amber-800 block">Warnings & Skipped Rows:</span>
                {importResult.errors.map((err, idx) => (
                  <p key={idx} className="text-amber-700 text-[11px]">
                    Row {err.row}: {err.reason} ({err.email || 'N/A'})
                  </p>
                ))}
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer shadow-sm"
              >
                Done & Return to Marketing
              </button>
            </div>
          </div>
        ) : (
          /* Main Import Form */
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Template Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-blue-600 shrink-0" />
                <span className="text-xs text-slate-700">
                  Supported columns: <strong>Name, Email*, Phone, Customer Tier, 18+ Verified, Tags, Notes</strong>
                </span>
              </div>
              <button
                onClick={handleDownloadSampleCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <Download size={13} />
                Download Template CSV
              </button>
            </div>

            {/* Target Cohort & Configuration Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/50 p-3.5 rounded-xl border border-slate-200 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Assign to Audience Cohort
                </label>
                <select
                  value={selectedCohort}
                  onChange={(e) => setSelectedCohort(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                >
                  {AUDIENCE_COHORTS.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Additional Tags (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. stellenbosch_2026, cape_tasting"
                  value={customTags}
                  onChange={(e) => setCustomTags(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2 pt-1 flex flex-wrap gap-4 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={isAgeVerifiedDefault}
                    onChange={(e) => setIsAgeVerifiedDefault(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span>Mark imported patrons as <strong>18+ Statutory Verified</strong> (Section 8 Alcohol Compliance)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span>Update existing customers if email matches (merges tags & updates details)</span>
                </label>
              </div>
            </div>

            {/* Input Mode Selector */}
            <div className="flex items-center gap-2 border-b border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setInputMode('file')}
                className={`pb-2 px-2 font-bold border-b-2 transition-all cursor-pointer ${
                  inputMode === 'file' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Upload CSV File
              </button>
              <button
                type="button"
                onClick={() => setInputMode('paste')}
                className={`pb-2 px-2 font-bold border-b-2 transition-all cursor-pointer ${
                  inputMode === 'paste' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                Paste CSV / Excel Text
              </button>
            </div>

            {/* Upload Zone */}
            {inputMode === 'file' ? (
              <div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept=".csv,text/csv,text/plain" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                    isDragging 
                      ? 'border-blue-500 bg-blue-50/50' 
                      : fileName 
                      ? 'border-emerald-300 bg-emerald-50/20' 
                      : 'border-slate-300 hover:border-blue-400 bg-slate-50/40 hover:bg-slate-50'
                  }`}
                >
                  <Upload size={28} className={`mx-auto mb-2 ${fileName ? 'text-emerald-600' : 'text-slate-400'}`} />
                  {fileName ? (
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{fileName}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Click or drag a different file to replace</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-slate-800 text-xs">
                        Drag and drop your customer CSV file here, or <span className="text-blue-600 underline">browse</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">Supports standard CSV with UTF-8 encoding</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <textarea
                  rows={4}
                  placeholder={`Name,Email,Phone,Customer Tier,18+ Verified,Tags\n"Arthur Pendelton",arthur@whisky.co.za,+27821234567,vip_collector,yes,"whisky_buyers"`}
                  value={pastedText}
                  onChange={(e) => handlePastedTextChange(e.target.value)}
                  className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            )}

            {/* Data Validation Preview */}
            {parsedRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">Parsed Preview ({parsedRows.length} rows)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {validCount} Ready
                    </span>
                    {invalidCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {invalidCount} Missing Email
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">Showing first 10 rows</span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="px-3 py-1.5">#</th>
                        <th className="px-3 py-1.5">Name</th>
                        <th className="px-3 py-1.5">Email</th>
                        <th className="px-3 py-1.5">Phone</th>
                        <th className="px-3 py-1.5">Cohort / Tier</th>
                        <th className="px-3 py-1.5">18+</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.slice(0, 10).map((r, i) => (
                        <tr key={i} className={r.isValid ? 'hover:bg-slate-50/50' : 'bg-rose-50/30'}>
                          <td className="px-3 py-1.5 text-slate-400 font-mono text-[10px]">{i + 1}</td>
                          <td className="px-3 py-1.5 font-medium text-slate-900">{r.name}</td>
                          <td className="px-3 py-1.5">
                            {r.isValid ? (
                              <span className="text-slate-700 font-mono">{r.email}</span>
                            ) : (
                              <span className="text-rose-600 font-semibold flex items-center gap-1">
                                <AlertTriangle size={11} /> Invalid Email
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-1.5 text-slate-500">{r.phone || '—'}</td>
                          <td className="px-3 py-1.5">
                            <span className="capitalize px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                              {(r.customerType || selectedCohort).replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-3 py-1.5">
                            <span className="text-emerald-700 font-bold text-[10px]">18+ OK</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {validCount > 0 ? `${validCount} customer records will be imported.` : 'Upload a CSV to begin.'}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={validCount === 0 || isSubmitting}
                  onClick={handleSubmitImport}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-all cursor-pointer ${
                    validCount === 0 || isSubmitting 
                      ? 'bg-slate-300 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      Importing {validCount} Customers...
                    </>
                  ) : (
                    <>
                      <Upload size={13} />
                      Import {validCount > 0 ? `${validCount} ` : ''}Customers Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
