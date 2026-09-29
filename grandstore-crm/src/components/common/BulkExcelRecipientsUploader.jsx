import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, Upload, Download, CheckCircle2, 
  AlertTriangle, X, Trash2, Users, Search, 
  FileText, Sparkles, Filter, RefreshCw
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

async function getExcelJS() {
  try {
    const ExcelModule = await import('exceljs/dist/exceljs.min.js');
    return ExcelModule.default || ExcelModule;
  } catch {
    const ExcelModule = await import('exceljs');
    return ExcelModule.default || ExcelModule;
  }
}

export default function BulkExcelRecipientsUploader({
  channel = 'email', // 'email' | 'whatsapp' | 'phone_call'
  onRecipientsChange,
  className = ''
}) {
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'paste'
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [rawPastedText, setRawPastedText] = useState('');
  
  const [recipients, setRecipients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'valid' | 'invalid'

  // Clean and normalize phone numbers (e.g. 082 123 4567 -> +27821234567)
  const normalizePhoneNumber = (rawPhone) => {
    if (!rawPhone) return '';
    let cleaned = String(rawPhone).trim().replace(/[\s\-\(\)\.]/g, '');
    if (!cleaned) return '';

    // If starts with single 0 (South Africa local), replace with +27
    if (/^0[1-9]\d{8}$/.test(cleaned)) {
      cleaned = '+27' + cleaned.substring(1);
    } else if (/^27[1-9]\d{8}$/.test(cleaned)) {
      cleaned = '+' + cleaned;
    } else if (!cleaned.startsWith('+') && cleaned.length >= 7) {
      cleaned = '+' + cleaned;
    }
    return cleaned;
  };

  const isValidEmail = (email) => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim().toLowerCase());
  };

  const isValidPhone = (phone) => {
    if (!phone) return false;
    const cleaned = String(phone).replace(/[^\d+]/g, '');
    const digitsOnly = cleaned.replace(/\D/g, '');
    return digitsOnly.length >= 7 && digitsOnly.length <= 15;
  };

  // Process and validate array of extracted rows
  const processExtractedRows = (rows, sourceName = 'Uploaded File') => {
    if (!rows || rows.length === 0) {
      setRecipients([]);
      if (onRecipientsChange) onRecipientsChange([], []);
      return;
    }

    const seenEmails = new Set();
    const seenPhones = new Set();

    const processed = rows.map((row, index) => {
      const email = String(row.email || '').trim().toLowerCase();
      const rawPhone = String(row.phone || '').trim();
      const phone = normalizePhoneNumber(rawPhone);
      const name = String(row.name || '').trim() || (email ? email.split('@')[0] : `Recipient #${index + 1}`);
      const company = String(row.company || '').trim();
      const notes = String(row.notes || '').trim();

      const validEmail = isValidEmail(email);
      const validPhone = isValidPhone(phone);

      // Duplicate check based on channel
      let isDuplicate = false;
      if (channel === 'email') {
        if (validEmail) {
          if (seenEmails.has(email)) isDuplicate = true;
          else seenEmails.add(email);
        }
      } else {
        if (validPhone) {
          if (seenPhones.has(phone)) isDuplicate = true;
          else seenPhones.add(phone);
        }
      }

      // Validity check according to active channel
      let isValid = false;
      let errorReason = '';

      if (channel === 'email') {
        if (!email) errorReason = 'Missing email address';
        else if (!validEmail) errorReason = 'Invalid email syntax';
        else if (isDuplicate) errorReason = 'Duplicate email skipped';
        else isValid = true;
      } else {
        // WhatsApp or SMS / Phone
        if (!phone) errorReason = 'Missing phone number';
        else if (!validPhone) errorReason = 'Invalid phone number format';
        else if (isDuplicate) errorReason = 'Duplicate phone number';
        else isValid = true;
      }

      return {
        id: `rec-${index}-${Date.now()}`,
        name,
        email,
        phone,
        company,
        notes,
        isValid,
        isDuplicate,
        errorReason
      };
    });

    setRecipients(processed);
    const validOnes = processed.filter(r => r.isValid);
    if (onRecipientsChange) {
      onRecipientsChange(validOnes, processed);
    }

    toast.info(`Parsed ${processed.length} rows (${validOnes.length} ready for ${channel === 'email' ? 'email' : 'phone'} dispatch)`);
  };

  // Robust CSV parser supporting quotes, delimiters, newlines
  const parseCSVText = (text) => {
    if (!text || !text.trim()) return [];

    const lines = [];
    let curLine = [];
    let curVal = '';
    let inQuotes = false;
    const cleanedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    for (let i = 0; i < cleanedText.length; i++) {
      const char = cleanedText[i];
      const nextChar = cleanedText[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
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
        if (curLine.some(c => c.length > 0)) lines.push(curLine);
        curLine = [];
        curVal = '';
      } else {
        curVal += char;
      }
    }

    if (curVal.length > 0 || curLine.length > 0) {
      curLine.push(curVal.trim());
      if (curLine.some(c => c.length > 0)) lines.push(curLine);
    }

    if (lines.length === 0) return [];

    // Header normalization
    const headers = lines[0].map(h => String(h || '').toLowerCase().replace(/[^a-z0-9]/g, ''));
    const colIndex = {
      name: headers.findIndex(h => h.includes('name') || h.includes('contact') || h.includes('patron') || h.includes('customer')),
      email: headers.findIndex(h => h.includes('email') || h.includes('mail')),
      phone: headers.findIndex(h => h.includes('phone') || h.includes('mobile') || h.includes('tel') || h.includes('cell') || h.includes('whatsapp')),
      company: headers.findIndex(h => h.includes('company') || h.includes('org') || h.includes('estate') || h.includes('winery') || h.includes('business')),
      notes: headers.findIndex(h => h.includes('note') || h.includes('comment') || h.includes('segment') || h.includes('tag'))
    };

    // If only one column or no recognized header, inspect first row
    const startRow = (colIndex.email !== -1 || colIndex.phone !== -1 || colIndex.name !== -1) ? 1 : 0;
    const rows = [];

    for (let r = startRow; r < lines.length; r++) {
      const row = lines[r];
      if (!row || row.length === 0) continue;

      let email = colIndex.email !== -1 ? (row[colIndex.email] || '') : '';
      let phone = colIndex.phone !== -1 ? (row[colIndex.phone] || '') : '';
      let name = colIndex.name !== -1 ? (row[colIndex.name] || '') : '';
      let company = colIndex.company !== -1 ? (row[colIndex.company] || '') : '';
      let notes = colIndex.notes !== -1 ? (row[colIndex.notes] || '') : '';

      // Fallback heuristics if columns weren't matched
      if (colIndex.email === -1 && colIndex.phone === -1) {
        row.forEach(cell => {
          const val = String(cell || '').trim();
          if (isValidEmail(val)) email = val;
          else if (isValidPhone(val)) phone = val;
          else if (!name && val.length > 1) name = val;
        });
      }

      if (email || phone || name) {
        rows.push({ name, email, phone, company, notes });
      }
    }

    return rows;
  };

  // Parse Excel (.xlsx, .xls) using ExcelJS
  const parseExcelFile = async (arrayBuffer) => {
    const ExcelJS = await getExcelJS();
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) return [];

    const headers = [];
    const firstRow = worksheet.getRow(1);
    firstRow.eachCell((cell, colNumber) => {
      headers[colNumber] = String(cell.value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    });

    const colIndex = {
      name: headers.findIndex(h => h && (h.includes('name') || h.includes('contact') || h.includes('patron'))),
      email: headers.findIndex(h => h && (h.includes('email') || h.includes('mail'))),
      phone: headers.findIndex(h => h && (h.includes('phone') || h.includes('mobile') || h.includes('tel') || h.includes('cell') || h.includes('whatsapp'))),
      company: headers.findIndex(h => h && (h.includes('company') || h.includes('org') || h.includes('estate') || h.includes('business'))),
      notes: headers.findIndex(h => h && (h.includes('note') || h.includes('comment') || h.includes('segment')))
    };

    const rows = [];
    for (let r = 2; r <= worksheet.rowCount; r++) {
      const row = worksheet.getRow(r);
      if (!row || !row.hasValues) continue;

      const getVal = (idx) => {
        if (idx === -1) return '';
        const cell = row.getCell(idx);
        if (!cell || cell.value === null || cell.value === undefined) return '';
        if (typeof cell.value === 'object' && cell.value.text) return cell.value.text;
        return String(cell.value);
      };

      let email = getVal(colIndex.email);
      let phone = getVal(colIndex.phone);
      let name = getVal(colIndex.name);
      let company = getVal(colIndex.company);
      let notes = getVal(colIndex.notes);

      // Fallback heuristics across all cells if headers weren't mapped
      if (colIndex.email === -1 && colIndex.phone === -1) {
        row.eachCell(cell => {
          const val = typeof cell.value === 'object' && cell.value?.text ? cell.value.text : String(cell.value || '');
          if (isValidEmail(val)) email = val;
          else if (isValidPhone(val)) phone = val;
          else if (!name && val.length > 2) name = val;
        });
      }

      if (email || phone || name) {
        rows.push({ name, email, phone, company, notes });
      }
    }

    return rows;
  };

  // Handle uploaded file
  const handleFileUpload = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setIsParsing(true);

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let extractedRows = [];

      if (extension === 'xlsx' || extension === 'xls') {
        const arrayBuffer = await file.arrayBuffer();
        extractedRows = await parseExcelFile(arrayBuffer);
      } else {
        // Assume CSV / Text
        const text = await file.text();
        extractedRows = parseCSVText(text);
      }

      if (extractedRows.length === 0) {
        toast.warning('No valid rows or contacts could be extracted from this file.');
      }
      processExtractedRows(extractedRows, file.name);
    } catch (err) {
      console.error('File parsing error:', err);
      toast.error('Failed to parse Excel file: ' + err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  // Handle Pasted Raw Text
  const handlePastedTextSubmit = () => {
    if (!rawPastedText.trim()) return;
    setIsParsing(true);
    try {
      const rows = parseCSVText(rawPastedText);
      processExtractedRows(rows, 'Pasted List');
    } finally {
      setIsParsing(false);
    }
  };

  // Generate & Download Excel Template
  const handleDownloadTemplate = async () => {
    try {
      const ExcelJS = await getExcelJS();
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'The Grand Store Operations Command';

      const worksheet = workbook.addWorksheet('Recipients');

      const headers = ['Full Name', 'Email Address', 'Phone Number', 'Company / Estate', 'Segment Notes'];
      worksheet.addRow(headers);

      // Sample pre-filled data
      const sampleData = [
        ['Pieter van der Merwe', 'pieter.vdm@stellenboschvintners.co.za', '+27 82 555 1234', 'Stellenbosch Cellars', 'VIP Wine Collector'],
        ['Elena Rostova', 'elena.r@dubaitrade.ae', '+971 50 123 4567', 'Emirates Luxury Trading', 'GCC B2B Export Buyer'],
        ['Kagiso Mokoena', 'kmokoena@grandstore.co.za', '+27 71 987 6543', 'Cape Fine Spirits Ltd', 'Wholesale Trade Partner']
      ];
      sampleData.forEach(row => worksheet.addRow(row));

      // Style Header
      const headerRow = worksheet.getRow(1);
      headerRow.height = 24;
      headerRow.eachCell(cell => {
        cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1E3A8A' } // Grand Store Navy
        };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      });

      // Style Sample Rows
      for (let r = 2; r <= 4; r++) {
        const row = worksheet.getRow(r);
        row.height = 20;
        row.eachCell(cell => {
          cell.font = { name: 'Calibri', size: 10 };
          cell.alignment = { vertical: 'middle' };
        });
      }

      worksheet.views = [{ state: 'frozen', ySplit: 1 }];
      worksheet.columns = [
        { width: 26 },
        { width: 36 },
        { width: 22 },
        { width: 28 },
        { width: 24 }
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'GrandStore_Bulk_Recipients_Template.xlsx';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);

      toast.success('Sample Excel template downloaded');
    } catch (err) {
      console.error('Failed to generate Excel template:', err);
      toast.error('Could not generate template: ' + err.message);
    }
  };

  // Remove a single recipient
  const handleRemoveRecipient = (id) => {
    const updated = recipients.filter(r => r.id !== id);
    setRecipients(updated);
    const validOnes = updated.filter(r => r.isValid);
    if (onRecipientsChange) onRecipientsChange(validOnes, updated);
  };

  // Clear all recipients
  const handleClearAll = () => {
    setRecipients([]);
    setFileName('');
    setRawPastedText('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onRecipientsChange) onRecipientsChange([], []);
    toast.info('Recipients list cleared');
  };

  // Filter recipients for preview
  const filteredRecipients = recipients.filter(r => {
    if (filterMode === 'valid' && !r.isValid) return false;
    if (filterMode === 'invalid' && r.isValid) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        r.company.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const validCount = recipients.filter(r => r.isValid).length;
  const invalidCount = recipients.length - validCount;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Upload & Template Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'upload' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet size={13} />
            <span>Excel / Spreadsheet (.xlsx, .csv)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'paste' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={13} />
            <span>Paste Numbers / Emails</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          title="Download pre-formatted Excel template with sample columns"
        >
          <Download size={13} />
          <span>Download Sample Excel Template</span>
        </button>
      </div>

      {/* Tab 1: File Dropzone */}
      {activeTab === 'upload' && (
        <div>
          <input
            type="file"
            ref={fileInputRef}
            accept=".xlsx, .xls, .csv, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={(e) => handleFileUpload(e.target.files?.[0])}
            className="hidden"
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20'
            }`}
          >
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-full mb-0.5">
                <Upload size={18} />
              </div>
              <p className="font-bold text-slate-800 text-xs">
                {fileName ? `Loaded: ${fileName}` : `Click to Upload Excel (.xlsx) or CSV containing ${channel === 'email' ? 'Emails' : 'Phone Numbers'}`}
              </p>
              <p className="text-[11px] text-slate-500">
                Drag & drop spreadsheet or click to browse. Automatically extracts Name, {channel === 'email' ? 'Email' : 'Phone (+27...)'}, and Company.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Paste List */}
      {activeTab === 'paste' && (
        <div className="space-y-2">
          <textarea
            rows={4}
            placeholder={`Paste comma, tab, or newline separated list:\ne.g. John Doe, john@example.com, +27821234567\nor simply one email or phone number per line...`}
            value={rawPastedText}
            onChange={(e) => setRawPastedText(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handlePastedTextSubmit}
              disabled={!rawPastedText.trim() || isParsing}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Sparkles size={12} /> Parse & Apply Pasted List
            </button>
          </div>
        </div>
      )}

      {/* Recipients Statistics & Summary */}
      {recipients.length > 0 && (
        <div className="space-y-2.5 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-extrabold border border-emerald-200">
                <CheckCircle2 size={13} />
                <span>{validCount} Ready for {channel === 'email' ? 'Email' : 'WhatsApp'}</span>
              </span>

              {invalidCount > 0 && (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold border border-amber-200">
                  <AlertTriangle size={13} />
                  <span>{invalidCount} Skipped (Invalid/Duplicate)</span>
                </span>
              )}

              <span className="text-[11px] text-slate-500">
                Total Rows: <strong className="text-slate-800">{recipients.length}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearAll}
                className="flex items-center gap-1 text-[11px] text-red-600 hover:text-red-700 font-bold px-2 py-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
              >
                <Trash2 size={12} /> Clear List
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex items-center justify-between gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search recipients by name, email, phone, company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2 py-1 rounded font-semibold cursor-pointer ${
                  filterMode === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                All ({recipients.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('valid')}
                className={`px-2 py-1 rounded font-semibold cursor-pointer ${
                  filterMode === 'valid' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Valid ({validCount})
              </button>
              {invalidCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilterMode('invalid')}
                  className={`px-2 py-1 rounded font-semibold cursor-pointer ${
                    filterMode === 'invalid' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Invalid ({invalidCount})
                </button>
              )}
            </div>
          </div>

          {/* Recipient Chips / Table View */}
          <div className="max-h-44 overflow-y-auto crm-scrollbar border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
            {filteredRecipients.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs">
                No matching recipients found.
              </div>
            ) : (
              filteredRecipients.map(r => (
                <div key={r.id} className="flex items-center justify-between px-3 py-2 text-xs hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${r.isValid ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 truncate">{r.name}</span>
                        {r.company && (
                          <span className="text-[10px] text-slate-400 truncate">({r.company})</span>
                        )}
                        {!r.isValid && (
                          <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-semibold">
                            {r.errorReason}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                        {r.email && <span>{r.email}</span>}
                        {r.phone && <span>{r.phone}</span>}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveRecipient(r.id)}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                    title="Remove recipient"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
