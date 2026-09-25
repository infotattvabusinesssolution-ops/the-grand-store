import jsPDFModule from 'jspdf';
import autoTableModule from 'jspdf-autotable';

const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default || jsPDFModule;
const autoTable = typeof autoTableModule === 'function' ? autoTableModule : (autoTableModule?.default || autoTableModule?.autoTable || autoTableModule);

/**
 * Executive PDF Generator for The Grand Store Vendor Remittance Advice Vouchers
 * Generates an official, luxury-grade PDF document containing complete consignment,
 * tax compliance (SARS 15% VAT / 0% SAD500 zero-rated export), escrow timeline,
 * beneficiary banking snapshot, and net financial disbursements.
 */
export function generateRemittancePdf(settlement) {
  if (!settlement) return null;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Palette
  const primaryNavy = [15, 23, 42];     // #0F172A
  const accentGold = [217, 119, 6];     // #D97706
  const slateDark = [30, 41, 59];       // #1E293B
  const slateMuted = [100, 116, 139];   // #64748B
  const slateBorder = [226, 232, 240];  // #E2E8F0
  const bgLight = [248, 250, 252];      // #F8FAFC

  // 1. Executive Top Header Banner
  doc.setFillColor(...primaryNavy);
  doc.rect(margin, 12, contentWidth, 26, 'F');

  // Gold accent accent bar on top
  doc.setFillColor(...accentGold);
  doc.rect(margin, 12, contentWidth, 2, 'F');

  // Header Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('THE GRAND STORE', margin + 6, 23);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text('EXECUTIVE TREASURY & VENDOR SETTLEMENT ESCROW CLEARING', margin + 6, 28);
  doc.text('Section 11 Financial Operations • Domestic & Global Cross-Border Remittance Advice', margin + 6, 33);

  // Voucher Ref & Timestamp (Right aligned)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('REMITTANCE ADVICE', pageWidth - margin - 6, 21, { align: 'right' });

  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(251, 191, 36); // Amber 400
  doc.text(settlement.reference || `SET-REF-${settlement.id?.slice(-8)}`, pageWidth - margin - 6, 27, { align: 'right' });

  const generatedDateStr = new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`Issued: ${generatedDateStr}`, pageWidth - margin - 6, 33, { align: 'right' });

  // 2. Escrow Status Milestone Bar
  let yPos = 42;
  const isSettled = settlement.status === 'settled';
  const isDue = settlement.status === 'due_for_payment';
  const isDisputed = settlement.status === 'disputed' || settlement.status === 'held';
  const isGlobal = settlement.orderType === 'global_export';

  let statusBg = [239, 246, 255]; // Blue 50
  let statusBorder = [191, 219, 254];
  let statusText = [29, 78, 216];
  let statusLabel = `PENDING 30-DAY INSPECTION ESCROW (${settlement.daysLeft || 0} DAYS REMAINING)`;

  if (isSettled) {
    statusBg = [236, 253, 245]; // Emerald 50
    statusBorder = [167, 243, 208];
    statusText = [4, 120, 87];
    statusLabel = `SETTLED & DISBURSED • REF: ${settlement.paymentReference || 'CONFIRMED'}`;
  } else if (isDue) {
    statusBg = [254, 243, 199]; // Amber 50
    statusBorder = [253, 230, 138];
    statusText = [180, 83, 9];
    statusLabel = 'MATURED — 30-DAY INSPECTION ELAPSED (DUE FOR IMMEDIATE PAYOUT)';
  } else if (isDisputed) {
    statusBg = [254, 242, 242]; // Red 50
    statusBorder = [254, 202, 202];
    statusText = [185, 28, 28];
    statusLabel = 'PAYOUT ON HOLD — ACTIVE CONSIGNMENT DISPUTE REGISTERED';
  }

  doc.setFillColor(...statusBg);
  doc.setDrawColor(...statusBorder);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, yPos, contentWidth, 8.5, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...statusText);
  doc.text(`MILESTONE STATUS: ${statusLabel}`, margin + 5, yPos + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text(
    isGlobal ? '🌍 GLOBAL DDP EXPORT (0% SARS ZERO-RATED)' : '🇿🇦 DOMESTIC ZA CONSIGNMENT (15% VAT INCLUDED)',
    pageWidth - margin - 5,
    yPos + 5.5,
    { align: 'right' }
  );

  yPos += 13;

  // 3. Dual Card Section: Beneficiary Details vs Consignment Particulars
  const cardWidth = (contentWidth - 6) / 2;
  const cardHeight = 54;

  // Left Card: Beneficiary Banking Snapshot
  doc.setFillColor(...bgLight);
  doc.setDrawColor(...slateBorder);
  doc.roundedRect(margin, yPos, cardWidth, cardHeight, 2, 2, 'FD');

  // Title Tab Left Card
  doc.setFillColor(...slateDark);
  doc.roundedRect(margin, yPos, cardWidth, 6.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('BENEFICIARY / VENDOR PARTICULARS', margin + 4, yPos + 4.5);

  const bank = settlement.bankDetails || settlement.bankDetailsSnapshot || {};
  const leftX = margin + 4;
  let cardY = yPos + 11.5;

  const renderField = (label, val, x, y, isMono = false) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...slateMuted);
    doc.text(label, x, y);

    doc.setFont(isMono ? 'courier' : 'helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...slateDark);
    doc.text(String(val || '—'), x, y + 3.8);
  };

  renderField('Vendor / Legal Partner:', settlement.vendorName, leftX, cardY);
  cardY += 9;
  renderField('Account Holder:', bank.accountHolder || settlement.vendorName, leftX, cardY);
  cardY += 9;
  renderField('Bank / Financial Institution:', bank.bankName || (isGlobal ? 'Standard Bank Corporate' : 'First National Bank (FNB)'), leftX, cardY);
  cardY += 9;
  renderField('Account Number:', bank.accountNumber || '—', leftX, cardY, true);
  renderField('Branch Code:', bank.branchCode || '—', leftX + 44, cardY, true);
  cardY += 9;
  renderField('SWIFT / BIC Routing:', isGlobal ? (bank.swiftCode || 'SBZAJJZA') : 'Domestic EFT Clearing (ZA)', leftX, cardY, true);
  renderField('Account Type:', bank.accountType || 'Current / Cheque', leftX + 44, cardY);

  // Right Card: Consignment & Escrow Particulars
  const rightX = margin + cardWidth + 6;
  doc.setFillColor(...bgLight);
  doc.setDrawColor(...slateBorder);
  doc.roundedRect(rightX, yPos, cardWidth, cardHeight, 2, 2, 'FD');

  // Title Tab Right Card
  doc.setFillColor(...slateDark);
  doc.roundedRect(rightX, yPos, cardWidth, 6.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('CONSIGNMENT & ESCROW PARTICULARS', rightX + 4, yPos + 4.5);

  let rightCardY = yPos + 11.5;
  renderField('Order Reference #:', `#${settlement.orderNumber}`, rightX + 4, rightCardY, true);
  renderField('Consignment Scope:', isGlobal ? 'Global Cross-Border Export' : 'Domestic South Africa', rightX + 48, rightCardY);
  rightCardY += 9;
  renderField('Destination Country:', settlement.destinationCountry || (isGlobal ? 'International' : 'South Africa'), rightX + 4, rightCardY);
  renderField('Tax Treatment:', settlement.vatRatePct === 0 ? '0% SARS Zero-Rated' : '15% SA VAT Included', rightX + 48, rightCardY);
  rightCardY += 9;
  renderField('Proof of Delivery (POD):', settlement.deliveredAt ? new Date(settlement.deliveredAt).toLocaleDateString() : 'Confirmed', rightX + 4, rightCardY);
  renderField('30-Day Escrow Maturity:', settlement.payoutDueDate ? new Date(settlement.payoutDueDate).toLocaleDateString() : 'Calculated', rightX + 48, rightCardY);
  rightCardY += 9;
  renderField('Customs Reference (SAD500):', settlement.customsDeclarationRef || (isGlobal ? 'SAD500-CUSTOMS-EXP' : 'N/A (Domestic SA)'), rightX + 4, rightCardY, true);
  renderField('Payout Mechanism:', settlement.payoutMethod === 'swift_wire' ? 'SWIFT Wire' : 'Domestic EFT', rightX + 48, rightCardY);
  rightCardY += 9;
  renderField('Dispute Status:', settlement.disputeReason ? 'Active Dispute Open' : 'Clear / Zero Claims Filed', rightX + 4, rightCardY);

  yPos += cardHeight + 6;

  // 4. Itemized Consignment & Settlement Ledger (autoTable)
  const currencySymbol = settlement.currency || 'ZAR';
  const tableData = [];

  // Line items if available
  if (settlement.orderItems && settlement.orderItems.length > 0) {
    settlement.orderItems.forEach((item, idx) => {
      const price = Number(item.price || 0);
      const qty = Number(item.quantity || item.qty || 1);
      const lineTotal = price * qty;
      tableData.push([
        `0${idx + 1}.`,
        item.name || item.title || 'Curated Fine Wine / Spirit Line Item',
        qty.toString(),
        `R ${price.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        `R ${lineTotal.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ]);
    });
  } else {
    tableData.push([
      '01.',
      `Consignment Lot for Order #${settlement.orderNumber} (${settlement.destinationCountry || 'South Africa'})`,
      '1',
      `R ${Number(settlement.orderTotal || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `R ${Number(settlement.orderTotal || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ]);
  }

  // Financial Breakdown summary rows
  const grossVal = Number(settlement.orderTotal || 0);
  const commRate = settlement.commissionRatePct || 15;
  const commAmt = Number(settlement.commissionAmount || (grossVal * commRate) / 100);
  const payoutVal = Number(settlement.payoutAmount || (grossVal - commAmt));

  tableData.push([
    '',
    'Gross Consignment Subtotal (Gross Order Value)',
    '',
    '',
    `R ${grossVal.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  ]);
  tableData.push([
    '',
    `Less: Grand Store Platform Escrow & Commission (${commRate}%)`,
    '',
    '',
    `- R ${commAmt.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  ]);
  tableData.push([
    '',
    `Tax Adjustment: ${settlement.vatRatePct === 0 ? '0% Export Zero-Rated (SAD500)' : '15% SA VAT Included'}`,
    '',
    '',
    'R 0.00'
  ]);
  tableData.push([
    '',
    'NET PAYABLE TO VENDOR BENEFICIARY',
    '',
    '',
    `R ${payoutVal.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  ]);

  autoTable(doc, {
    startY: yPos,
    margin: { left: margin, right: margin },
    head: [['#', 'Item / Particulars Description', 'Qty', 'Unit Price', 'Total (ZAR)']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      textColor: slateDark,
      lineColor: slateBorder,
      lineWidth: 0.2,
      cellPadding: 2.2
    },
    headStyles: {
      fillColor: slateDark,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 34, halign: 'right' }
    },
    didParseCell: (data) => {
      // Highlight summary rows
      const rowIndex = data.row.index;
      const totalRows = tableData.length;
      if (rowIndex === totalRows - 1) { // Net payable
        data.cell.styles.fillColor = [240, 253, 244]; // Emerald 50
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [5, 150, 105]; // Emerald 600
        data.cell.styles.fontSize = 8.5;
      } else if (rowIndex >= totalRows - 4) { // Other summary rows
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [248, 250, 252];
      }
    }
  });

  yPos = doc.lastAutoTable.finalY + 6;

  // 5. Settlement Clearance / Disbursement Proof (if settled)
  if (isSettled && settlement.paymentReference) {
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(margin, yPos, contentWidth, 13, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(4, 120, 87);
    doc.text('TREASURY CLEARANCE DISCHARGE CONFIRMATION', margin + 4, yPos + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(30, 41, 59);
    const settledDateStr = settlement.settledAt ? new Date(settlement.settledAt).toLocaleDateString() : 'Completed';
    doc.text(
      `Disbursed on ${settledDateStr} via ${settlement.payoutMethod === 'swift_wire' ? 'SWIFT Interbank Wire' : 'Domestic Electronic Funds Transfer (EFT)'}. Authorized Payment Reference: ${settlement.paymentReference}`,
      margin + 4,
      yPos + 9.5
    );

    yPos += 17;
  }

  // Dispute Note if present
  if (settlement.disputeReason) {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
    doc.roundedRect(margin, yPos, contentWidth, 12, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(185, 28, 28);
    doc.text('CONSIGNMENT CLAIM / DISPUTE NOTATION:', margin + 4, yPos + 5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(153, 27, 27);
    doc.text(String(settlement.disputeReason), margin + 4, yPos + 9);

    yPos += 16;
  }

  // 6. Section 11 Legal Charter & Authorized Signatures
  // Ensure we don't overflow the A4 page
  if (yPos > pageHeight - 50) {
    doc.addPage();
    yPos = 16;
  }

  doc.setFillColor(...bgLight);
  doc.setDrawColor(...slateBorder);
  doc.roundedRect(margin, yPos, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...slateDark);
  doc.text('STATUTORY ESCROW CHARTER & GOVERNANCE (SECTION 11):', margin + 4, yPos + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(...slateMuted);
  const charterText =
    'This remittance advice certifies that consignment orders are governed under The Grand Store 30-Day Escrow Buffer Protocol. Domestic consignments comply with the South African Value Added Tax Act (15% VAT). International exports are zero-rated under SARS SAD500 Section 11(1)(a). Inspection claims must be registered within 30 days of POD. Once matured, payouts are unconditionally released.';
  const splitCharter = doc.splitTextToSize(charterText, contentWidth - 8);
  doc.text(splitCharter, margin + 4, yPos + 8.5);

  // Digital Signature & Treasury Verification Seal
  const sigY = yPos + 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...slateDark);
  doc.text('CERTIFIED BY: Executive Treasury Escrow Desk', margin + 4, sigY);

  doc.setFont('courier', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...accentGold);
  doc.text('[ ELECTRONIC CLEARANCE SEAL: GS-TREASURY-AUTHENTICATED ]', pageWidth - margin - 4, sigY, { align: 'right' });

  // 7. Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...slateMuted);
  doc.text('The Grand Store International (Pty) Ltd • Operations Command Center • Stellenbosch & Johannesburg', margin, pageHeight - 7);
  doc.text('Page 1 of 1 • Official Executive Remittance Voucher', pageWidth - margin, pageHeight - 7, { align: 'right' });

  return doc;
}

/**
 * Downloads a single settlement remittance advice voucher as a .pdf file
 */
export function downloadRemittancePdf(settlement) {
  try {
    const doc = generateRemittancePdf(settlement);
    if (!doc) throw new Error('Could not create PDF document');

    const cleanRef = (settlement.reference || settlement.orderNumber || 'voucher').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Remittance_Advice_${cleanRef}.pdf`;
    doc.save(filename);
    return { success: true, filename };
  } catch (err) {
    console.error('Error downloading remittance PDF:', err);
    throw err;
  }
}

/**
 * Generates and downloads a consolidated Remittance Batch Report (PDF)
 */
export function downloadRemittanceBatchPdf(settlements, scope = 'all') {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;

    // Header banner
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, 10, pageWidth - margin * 2, 20, 'F');
    doc.setFillColor(217, 119, 6);
    doc.rect(margin, 10, pageWidth - margin * 2, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('THE GRAND STORE — VENDOR REMITTANCE BATCH STATEMENT', margin + 6, 21);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`Consolidated Settlement Audit Report • Scope: ${scope.toUpperCase()} • Generated: ${new Date().toLocaleDateString('en-ZA')}`, margin + 6, 26);

    const rows = settlements.map((s, idx) => [
      String(idx + 1),
      s.reference || '—',
      s.vendorName || '—',
      `#${s.orderNumber || '—'}`,
      s.destinationCountry || (s.orderType === 'global_export' ? 'Global' : 'South Africa'),
      s.orderType === 'global_export' ? 'Global Export' : 'Domestic ZA',
      `R ${Number(s.orderTotal || 0).toLocaleString('en-ZA')}`,
      `${s.commissionRatePct || 15}%`,
      `R ${Number(s.payoutAmount || 0).toLocaleString('en-ZA')}`,
      s.status === 'settled' ? 'Settled' : (s.status === 'due_for_payment' ? 'Due Today' : (s.status?.startsWith('disp') ? 'Disputed' : `${s.daysLeft || 0}d Escrow`)),
      s.payoutMethod === 'swift_wire' ? 'SWIFT Wire' : 'Domestic EFT',
      s.paymentReference || 'Pending'
    ]);

    autoTable(doc, {
      startY: 34,
      margin: { left: margin, right: margin },
      head: [['#', 'Settlement Ref', 'Vendor / Estate', 'Order #', 'Destination', 'Scope', 'Gross (ZAR)', 'Comm %', 'Net Payout', 'Status', 'Method', 'Payment Ref']],
      body: rows,
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' }
    });

    const filename = `GrandStore_Remittance_Batch_${scope}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
    return { success: true, filename };
  } catch (err) {
    console.error('Error generating batch remittance PDF:', err);
    throw err;
  }
}
