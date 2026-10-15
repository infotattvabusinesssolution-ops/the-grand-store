import jsPDFModule from 'jspdf';
import autoTableModule from 'jspdf-autotable';
import { GRAND_STORE_LOGO_BASE64 } from './grandStoreLogoBase64';

const jsPDF = jsPDFModule.jsPDF || jsPDFModule.default || jsPDFModule;
const autoTable = typeof autoTableModule === 'function' ? autoTableModule : (autoTableModule?.default || autoTableModule?.autoTable || autoTableModule);

/**
 * Official Commercial Proforma Invoice PDF Generator for Grand Store Global B2B International Trade.
 * @param {Object} enquiry - Export enquiry object with itemsRequested, buyer, quotation, and financials.
 */
export function generateProformaPdf(enquiry) {
  if (!enquiry) return null;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Luxury Corporate Palette
  const primaryNavy = [15, 23, 42];     // #0F172A
  const accentGold = [217, 119, 6];     // #D97706
  const slateDark = [30, 41, 59];       // #1E293B
  const slateMuted = [100, 116, 139];   // #64748B
  const slateBorder = [226, 232, 240];  // #E2E8F0
  const bgLight = [248, 250, 252];      // #F8FAFC

  // 1. Header & Logo
  try {
    if (GRAND_STORE_LOGO_BASE64) {
      doc.addImage(GRAND_STORE_LOGO_BASE64, 'PNG', margin, 10, 48, 15.2);
    }
  } catch (err) {
    doc.setTextColor(...primaryNavy);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text('THE GRAND STORE', margin, 20);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...primaryNavy);
  doc.text('GLOBAL TRADE & INTERNATIONAL EXPORT OPERATIONS', margin, 29);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...slateMuted);
  doc.text('Grand Store Global (Pty) Ltd • Customs Code: ZA-EXP-449102 • DAFF / SAWIS Bonded', margin, 33);

  // Document Title & Reference
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...primaryNavy);
  doc.text('COMMERCIAL PROFORMA INVOICE', pageWidth - margin, 17, { align: 'right' });

  doc.setFont('courier', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...accentGold);
  doc.text(enquiry.enquiryCode || 'PROFORMA-EXPORT', pageWidth - margin, 23, { align: 'right' });

  const todayStr = new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  const validUntilStr = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...slateMuted);
  doc.text(`Issue Date: ${todayStr}`, pageWidth - margin, 28, { align: 'right' });
  doc.text(`Quotation Validity: 30 Days (Until ${validUntilStr})`, pageWidth - margin, 32.5, { align: 'right' });

  // Gold Double Divider
  doc.setFillColor(...accentGold);
  doc.rect(margin, 36, contentWidth, 1.2, 'F');
  doc.setFillColor(...primaryNavy);
  doc.rect(margin, 37.2, contentWidth, 0.4, 'F');

  // 2. Buyer & Logistics Info Boxes
  let yPos = 42;

  // Box 1: Seller / Consignor
  const boxW = (contentWidth - 6) / 2;
  doc.setFillColor(...bgLight);
  doc.setDrawColor(...slateBorder);
  doc.roundedRect(margin, yPos, boxW, 35, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...accentGold);
  doc.text('EXPORTER / CONSIGNOR', margin + 4, yPos + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryNavy);
  doc.text('The Grand Store Global (Pty) Ltd', margin + 4, yPos + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...slateDark);
  doc.text('Bonded Warehouse 4, Port of Cape Town', margin + 4, yPos + 16);
  doc.text('Western Cape, 8001, South Africa', margin + 4, yPos + 20);
  doc.text('Phone: +27 21 555 0192 • export@thegrandstore.co.za', margin + 4, yPos + 24);
  doc.text('Excise Warehouse Reg: W-009841-CPT', margin + 4, yPos + 28);

  // Box 2: Buyer / Consignee
  const buyerX = margin + boxW + 6;
  doc.setFillColor(...bgLight);
  doc.roundedRect(buyerX, yPos, boxW, 35, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...accentGold);
  doc.text('BUYER / CONSIGNEE & DESTINATION', buyerX + 4, yPos + 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryNavy);
  doc.text(enquiry.buyer?.companyName || enquiry.buyer?.contactPerson || 'International Importer', buyerX + 4, yPos + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...slateDark);
  doc.text(`Contact: ${enquiry.buyer?.contactPerson || 'Procurement Officer'}`, buyerX + 4, yPos + 16);
  doc.text(`Email: ${enquiry.buyer?.email || '—'} • Tel: ${enquiry.buyer?.phone || '—'}`, buyerX + 4, yPos + 20);
  doc.text(`Destination: ${enquiry.destination?.country || 'Export Market'}`, buyerX + 4, yPos + 24);
  doc.text(`Discharge Port: ${enquiry.destination?.destinationPort || 'Major Seaport / Airport'}`, buyerX + 4, yPos + 28);

  yPos += 39;

  // Commercial Terms Strip
  doc.setFillColor(...primaryNavy);
  doc.roundedRect(margin, yPos, contentWidth, 8, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  
  const incoterm = enquiry.incoterms || 'CIF';
  const currency = enquiry.currency || 'USD';
  const paymentTerms = enquiry.financials?.paymentTerms || '30% Deposit upon Proforma Sign-off, 70% against Ocean Bill of Lading';

  doc.text(`INCOTERMS: ${incoterm} (${enquiry.destination?.destinationPort || 'Port of Discharge'})`, margin + 4, yPos + 5.2);
  doc.text(`PRICING CURRENCY: ${currency}`, margin + 65, yPos + 5.2);
  doc.text(`TERMS: ${paymentTerms}`, margin + 115, yPos + 5.2);

  yPos += 12;

  // 3. Line Items Table using autoTable
  let subtotal = 0;
  let totalCases = 0;
  let totalBottles = 0;

  const tableRows = (enquiry.itemsRequested || []).map(item => {
    const bpc = item.bottlesPerCase || 6;
    const cases = item.caseQuantity || 10;
    const itemBottles = cases * bpc;
    const unitPrice = item.targetPricePerCase || (enquiry.quotation?.vendorQuoteAmount ? enquiry.quotation.vendorQuoteAmount / (enquiry.itemsRequested.length || 1) : 450);
    const lineTotal = cases * unitPrice;

    subtotal += lineTotal;
    totalCases += cases;
    totalBottles += itemBottles;

    return [
      item.productName || 'Export Wine Allocation',
      item.vintage || 'NV',
      item.packFormat || `${bpc} btls/case`,
      cases.toString(),
      itemBottles.toString(),
      `${currency} ${Number(unitPrice).toFixed(2)}`,
      `${currency} ${Number(lineTotal).toFixed(2)}`
    ];
  });

  if (tableRows.length === 0) {
    tableRows.push([
      'South African Reserve Wine Collection',
      '2021',
      '6x750ml (6 btls/case)',
      '20',
      '120',
      `${currency} 450.00`,
      `${currency} 9,000.00`
    ]);
    subtotal = 9000;
    totalCases = 20;
    totalBottles = 120;
  }

  const freight = Number(enquiry.quotation?.freightAmount || enquiry.financials?.freightAmount || 0);
  const insurance = Number(enquiry.quotation?.insuranceAmount || enquiry.financials?.insuranceAmount || 0);
  const grandTotal = subtotal + freight + insurance;

  autoTable(doc, {
    startY: yPos,
    head: [['Item Description', 'Vintage', 'Packaging', 'Cases', 'Bottles', 'Unit Price', 'Line Total']],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: slateDark,
      lineColor: slateBorder,
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: primaryNavy,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5
    },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: 16, halign: 'center' },
      2: { cellWidth: 32 },
      3: { cellWidth: 16, halign: 'right' },
      4: { cellWidth: 18, halign: 'right' },
      5: { cellWidth: 23, halign: 'right' },
      6: { cellWidth: 22, halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: margin, right: margin }
  });

  yPos = doc.lastAutoTable.finalY + 4;

  // 4. Financial Breakdown & Banking Box Side-by-Side
  const summaryBoxW = 75;
  const bankBoxW = contentWidth - summaryBoxW - 4;

  // Banking Box (Left)
  doc.setFillColor(...bgLight);
  doc.setDrawColor(...slateBorder);
  doc.roundedRect(margin, yPos, bankBoxW, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...accentGold);
  doc.text('INTERNATIONAL WIRE ROUTING (SWIFT / IBAN)', margin + 4, yPos + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...slateDark);
  doc.text('Beneficiary: Grand Store Global (Pty) Ltd', margin + 4, yPos + 12);
  doc.text('Bank: First National Bank (FNB) • Global Corporate Services', margin + 4, yPos + 16.5);
  doc.text('Branch: FNB Corporate Cape Town (Branch Code: 250655)', margin + 4, yPos + 21);
  doc.text('SWIFT (BIC) Code: FIRNZAJJXXX', margin + 4, yPos + 25.5);
  doc.text('Account Number: 62899482103 (USD Foreign Currency Account)', margin + 4, yPos + 30);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryNavy);
  doc.text(`Wire Memo / Reference: ${enquiry.enquiryCode}`, margin + 4, yPos + 35);

  // Financial Summary Box (Right)
  const sumX = margin + bankBoxW + 4;
  doc.setFillColor(...bgLight);
  doc.roundedRect(sumX, yPos, summaryBoxW, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...slateMuted);
  doc.text('Cases / Bottles Total:', sumX + 4, yPos + 7);
  doc.text(`${totalCases} cs (${totalBottles} btls)`, sumX + summaryBoxW - 4, yPos + 7, { align: 'right' });

  doc.text('Consignment Subtotal:', sumX + 4, yPos + 13);
  doc.text(`${currency} ${subtotal.toFixed(2)}`, sumX + summaryBoxW - 4, yPos + 13, { align: 'right' });

  doc.text(`Freight (${incoterm}):`, sumX + 4, yPos + 18.5);
  doc.text(freight > 0 ? `${currency} ${freight.toFixed(2)}` : 'Included / EXW', sumX + summaryBoxW - 4, yPos + 18.5, { align: 'right' });

  doc.text('Marine Insurance:', sumX + 4, yPos + 24);
  doc.text(insurance > 0 ? `${currency} ${insurance.toFixed(2)}` : 'Declared Value Covered', sumX + summaryBoxW - 4, yPos + 24, { align: 'right' });

  doc.setFillColor(...primaryNavy);
  doc.rect(sumX + 4, yPos + 27, summaryBoxW - 8, 0.4, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryNavy);
  doc.text('TOTAL PAYABLE:', sumX + 4, yPos + 33);
  doc.setTextColor(...accentGold);
  doc.text(`${currency} ${grandTotal.toFixed(2)}`, sumX + summaryBoxW - 4, yPos + 33, { align: 'right' });

  yPos += 42;

  // 5. Statutory Export Certification & Acceptance Seal
  doc.setFillColor(254, 252, 232); // Amber light
  doc.setDrawColor(253, 230, 138);
  doc.roundedRect(margin, yPos, contentWidth, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...accentGold);
  doc.text('OFFICIAL EXPORT CLEARANCE & TEMPERATURE GUARANTEE', margin + 4, yPos + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...slateDark);
  doc.text('Goods guaranteed authentic South African origin, bottled at source and held under certified temperature control (14°C - 16°C).', margin + 4, yPos + 10);
  doc.text('All export documentation including DAFF phytosanitary certificates, SAWIS verification and export health certifications provided prior to port loading.', margin + 4, yPos + 14.5);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(...slateMuted);
  doc.text('Grand Store Global Export Portal • Computer-Generated Legal Proforma Invoice • Valid without Physical Seal', margin, pageHeight - 8);
  doc.text('Page 1 of 1', pageWidth - margin, pageHeight - 8, { align: 'right' });

  // Save to file
  doc.save(`PROFORMA_${enquiry.enquiryCode || 'EXPORT'}.pdf`);
  return doc;
}
