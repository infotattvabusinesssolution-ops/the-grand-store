const { jsPDF } = require("jspdf");
require("jspdf-autotable");
const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");

const generateOrderReceiptBuffer = async (order, user) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.width; // 210mm
    const pageHeight = doc.internal.pageSize.height; // 297mm
    const margin = 14;
    const contentWidth = pageWidth - margin * 2; // 182mm

    // Format Invoice Number and Order Reference cleanly
    const rawOrderRef = order.orderReference || order.orderNumber || order.orderId;
    const rawInvoiceNo = order.invoiceNumber;
    
    // Check if raw values are raw 24-character hexadecimal MongoDB ObjectIds
    const isMongoId = (val) => typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val.trim());
    
    const orderDate = new Date(order.paidAt || order.createdAt || Date.now());
    const orderYear = orderDate.getFullYear() || 2026;
    const shortOrderHex = String(order._id || '984201').slice(-6).toUpperCase();

    // Clean order reference (e.g. GS-2026-9842 or GS-984201)
    let orderRef;
    if (rawOrderRef && !isMongoId(rawOrderRef)) {
      orderRef = String(rawOrderRef).replace(/^#+/, '').toUpperCase();
    } else {
      orderRef = `GS-${orderYear}-${shortOrderHex}`;
    }

    // Clean Tax Invoice number (e.g. INV-2026-9842 or INV-984201)
    let invoiceNo;
    if (rawInvoiceNo && !isMongoId(rawInvoiceNo)) {
      invoiceNo = String(rawInvoiceNo).replace(/^#+/, '').toUpperCase();
    } else {
      invoiceNo = `INV-${orderYear}-${shortOrderHex}`;
    }

    // Theme palette
    const darkObsidian = [18, 16, 14];
    const goldAccent = [201, 151, 66];
    const goldLight = [245, 238, 222];
    const textMain = [20, 20, 20];
    const textMuted = [95, 90, 85];
    const emeraldGreen = [16, 138, 77];

    const formatPrice = (amount) => `R ${Number(amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const pdfPrice = (amount) => formatPrice(amount).replace(/\u00A0/g, ' ').replace(/[^\x20-\x7E]/g, '');

    // --- 1. LUXURY TOP BRAND HEADER ---
    doc.setFillColor(...darkObsidian);
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Gold accent trim under header
    doc.setFillColor(...goldAccent);
    doc.rect(0, 28, pageWidth, 1.8, 'F');

    // Store Title
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...goldAccent);
    doc.text('THE GRAND STORE', margin, 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(220, 215, 205);
    doc.text('CURATORS OF FINE VINTAGES, RARE SPIRITS & LUXURY CONSIGNMENTS', margin, 21);

    // Document Title (Right)
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('TAX INVOICE & DISPATCH DOCKET', pageWidth - margin, 13, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...goldAccent);
    doc.text(`ORIGINAL COMMERCIAL DOCUMENT • SAST`, pageWidth - margin, 20, { align: 'right' });

    // --- 2. INVOICE META & STATUS BAR ---
    let curY = 36;
    doc.setFillColor(248, 246, 242);
    doc.roundedRect(margin, curY, contentWidth, 20, 1.5, 1.5, 'F');
    doc.setDrawColor(225, 218, 205);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, curY, contentWidth, 20, 1.5, 1.5, 'S');

    // Metadata items across the bar (Content width = 182mm)
    const col1X = margin + 5;   // 19mm
    const col2X = margin + 52;  // 66mm
    const col3X = margin + 100; // 114mm

    const displayInvoiceNo = invoiceNo.startsWith('#') ? invoiceNo : `#${invoiceNo}`;
    const displayOrderRef = orderRef.startsWith('#') ? orderRef : `#${orderRef}`;
    
    // Col 1: Invoice No
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text('TAX INVOICE NUMBER', col1X, curY + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(displayInvoiceNo.length > 18 ? 7.5 : 8.5);
    doc.setTextColor(...darkObsidian);
    doc.text(displayInvoiceNo, col1X, curY + 13, { maxWidth: 44 });

    // Col 2: Order Reference
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text('ORDER REFERENCE', col2X, curY + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(displayOrderRef.length > 18 ? 7.5 : 8.5);
    doc.setTextColor(...darkObsidian);
    doc.text(displayOrderRef, col2X, curY + 13, { maxWidth: 44 });

    // Col 3: Date & Time
    const issueDate = order.paidAt || order.createdAt || Date.now();
    const formattedDate = new Date(issueDate).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text('TAX POINT / DATE', col3X, curY + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...darkObsidian);
    doc.text(formattedDate, col3X, curY + 13, { maxWidth: 36 });

    // Col 4: Payment Status Pill
    const isPaid = Boolean(
      order.isPaid || 
      String(order.paymentStatus || '').toLowerCase() === 'paid' || 
      String(order.status || '').toLowerCase() === 'paid'
    );
    const pillW = 34;
    const pillH = 11;
    const pillX = pageWidth - margin - pillW - 4;
    const pillY = curY + 4.5;

    doc.setFillColor(isPaid ? 235 : 255, isPaid ? 247 : 243, isPaid ? 238 : 230);
    doc.roundedRect(pillX, pillY, pillW, pillH, 1, 1, 'F');
    doc.setDrawColor(isPaid ? 40 : 200, isPaid ? 167 : 120, isPaid ? 69 : 30);
    doc.setLineWidth(0.4);
    doc.roundedRect(pillX, pillY, pillW, pillH, 1, 1, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(isPaid ? emeraldGreen[0] : 180, isPaid ? emeraldGreen[1] : 60, isPaid ? emeraldGreen[2] : 20);
    doc.text(isPaid ? 'PAID & VERIFIED' : 'PAYMENT PENDING', pillX + pillW / 2, pillY + 7.5, { align: 'center' });

    curY += 25;

    // --- 3. TWO-COLUMN ENTITY CARDS (MERCHANT / CONSIGNEE) ---
    const halfW = (contentWidth - 6) / 2;

    // CARD A: MERCHANT & VAULT GATEWAY
    doc.setFillColor(252, 251, 249);
    doc.roundedRect(margin, curY, halfW, 38, 1, 1, 'F');
    doc.setDrawColor(230, 225, 215);
    doc.roundedRect(margin, curY, halfW, 38, 1, 1, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...goldAccent);
    doc.text('FROM (SELLER & FULFILLMENT VAULT):', margin + 4, curY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...darkObsidian);
    doc.text('NIVARP INTERNATIONAL PTY LTD', margin + 4, curY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    doc.text('Reg No: 2015/268820/07  |  VAT No: 4040275077', margin + 4, curY + 17.5);
    doc.text('1st Floor, Block E, The Pivot, Montecasino', margin + 4, curY + 23);
    doc.text('Fourways, Johannesburg, 2191, South Africa', margin + 4, curY + 28);
    doc.text('Tel: +27 82 496 7256  |  Email: concierge@grandstoreglobal.com', margin + 4, curY + 33.5);

    // CARD B: CONSIGNEE / BUYER
    const custX = margin + halfW + 6;
    doc.setFillColor(252, 251, 249);
    doc.roundedRect(custX, curY, halfW, 38, 1, 1, 'F');
    doc.setDrawColor(230, 225, 215);
    doc.roundedRect(custX, curY, halfW, 38, 1, 1, 'S');

    const customerName = (user && user.name) || order.shippingAddress?.name || (order.guestInfo && order.guestInfo.name) || 'Valued Customer';
    const customerEmail = (user && user.email) || order.shippingAddress?.email || (order.guestInfo && order.guestInfo.email) || '';
    const customerPhone = order.shippingAddress?.phone || order.shippingAddress?.phoneNumber || (user && user.phone) || '';
    const destCity = order.shippingAddress?.city || '';
    const destPostal = order.shippingAddress?.postalCode || '';
    const destCountry = order.shippingAddress?.country || 'South Africa';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...goldAccent);
    doc.text('DELIVER TO (BUYER & CONSIGNEE):', custX + 4, curY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...darkObsidian);
    doc.text(customerName.substring(0, 38), custX + 4, curY + 11.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...textMuted);
    if (customerEmail) doc.text(`Email: ${customerEmail.substring(0, 38)}`, custX + 4, curY + 16);
    if (customerPhone) doc.text(`Contact: ${customerPhone}`, custX + 4, curY + 20.5);

    const addrStr = order.shippingAddress?.address || 'Standard Delivery Address';
    const splitAddr = doc.splitTextToSize(addrStr, halfW - 8);
    doc.text(splitAddr.slice(0, 2), custX + 4, curY + 25);
    doc.text(`${destCity}${destCity ? ', ' : ''}${destPostal}  •  ${destCountry}`, custX + 4, curY + 31);

    curY += 43;

    // --- 4. COURIER LOGISTICS & WAYBILL CONSIGNMENT STRIP ---
    const waybillNumber = String(
      order.driver?.waybillNumber ||
      order.aramexWaybillNumber ||
      (Array.isArray(order.shipments) && order.shipments[0]?.aramexWaybillNumber) ||
      'TCG-ZA-9928104'
    );
    
    // Normalize courier brand name cleanly without truncating
    const rawCourier = String(order.driver?.courierCompany || order.deliveryPreference || '').toLowerCase();
    let courierCompany = 'The Courier Guy';
    if (rawCourier.includes('postnet')) {
      courierCompany = 'PostNet South Africa';
    } else if (rawCourier.includes('aramex')) {
      courierCompany = 'Aramex South Africa';
    } else if (rawCourier.includes('dhl')) {
      courierCompany = 'DHL Express Air';
    } else if (rawCourier.includes('courier guy') || rawCourier.includes('tcg')) {
      courierCompany = 'The Courier Guy';
    } else if (order.driver?.courierCompany) {
      // Remove any parenthetical descriptions like "(Door-to-Door...)" so the main brand name is clean
      courierCompany = order.driver.courierCompany.replace(/\s*\([^)]*\)/g, '').trim() || 'The Courier Guy';
    }

    const serviceType = order.driver?.serviceType || 'ONP Priority Express';
    const packagingObj = order.packaging || {};
    const weightKg = Number(packagingObj.weightKg || 1.85).toFixed(2);
    const dimsStr = packagingObj.dimensions?.lengthCm 
      ? `${packagingObj.dimensions.lengthCm} × ${packagingObj.dimensions.widthCm} × ${packagingObj.dimensions.heightCm} CM`
      : '12.0 × 12.0 × 34.0 CM';
    const boxType = packagingObj.boxType || 'Standard Luxury Bottle Box (Single)';

    doc.setFillColor(242, 239, 232);
    doc.roundedRect(margin, curY, contentWidth, 15, 1, 1, 'F');
    doc.setDrawColor(210, 200, 185);
    doc.roundedRect(margin, curY, contentWidth, 15, 1, 1, 'S');

    // 4 Distinct, proportional columns with guaranteed margins
    const logCol1X = margin + 5;   // Col 1: Carrier (width 46mm)
    const logCol2X = margin + 53;  // Col 2: Waybill (width 40mm)
    const logCol3X = margin + 96;  // Col 3: Package Dims (width 46mm)
    const logCol4X = margin + 144; // Col 4: Security Badge (width 34mm, 4mm safe margin from right edge)

    // Headers (size 6.5 bold goldAccent)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...goldAccent);
    doc.text('LOGISTICS CARRIER:', logCol1X, curY + 5);
    doc.text('WAYBILL / TRACKING:', logCol2X, curY + 5);
    doc.text('PACKAGE DIMS & WEIGHT:', logCol3X, curY + 5);
    doc.text('SECURITY & HANDLING:', logCol4X, curY + 5);

    // Values (size 8 bold)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...darkObsidian);
    doc.text(courierCompany, logCol1X, curY + 10.5, { maxWidth: 45 });

    doc.setFont('courier', 'bold');
    doc.setFontSize(7.5);
    doc.text(waybillNumber, logCol2X, curY + 10.5, { maxWidth: 40 });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(`${weightKg} KG (${dimsStr})`, logCol3X, curY + 10.5, { maxWidth: 45 });

    // Clean handling badge with comfortable margin from edge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(185, 28, 28);
    doc.text('FRAGILE LUXURY GLASS', logCol4X, curY + 10.5, { maxWidth: 35 });

    curY += 20;

    // --- 5. ITEMIZED PRODUCTS AUTOTABLE ---
    const rawItems = (Array.isArray(order.orderItems) && order.orderItems.length > 0)
      ? order.orderItems
      : (Array.isArray(order.items) && order.items.length > 0 ? order.items : []);

    const tableItems = rawItems.map((item) => {
      const qty = Number(item.qty || item.quantity || 1);
      const total = Number(item.price || 0) * qty;
      const unitExclVat = total / 1.15 / qty;
      const itemVat = (total - (total / 1.15));
      const vintageStr = item.vintage || item.option || 'Grand Reserve';

      return [
        `${item.name}\nVintage / Release: ${vintageStr}${item.category ? ` • Category: ${item.category}` : ''}`,
        `${boxType}\n${dimsStr} • Gross ${weightKg}kg`,
        qty.toString(),
        pdfPrice(unitExclVat),
        pdfPrice(itemVat),
        pdfPrice(total)
      ];
    });

    const autoTable = require('jspdf-autotable').default || require('jspdf-autotable');
    autoTable(doc, {
      startY: curY,
      margin: { left: margin, right: margin },
      head: [["Item Description & Vintage", "Packaging Specifications", "Qty", "Unit (Excl VAT)", "VAT (15%)", "Total (ZAR)"]],
      body: tableItems,
      theme: 'plain',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        textColor: [25, 25, 25],
        cellPadding: { top: 4.5, right: 3, bottom: 4.5, left: 3 },
        valign: 'middle'
      },
      headStyles: {
        fillColor: darkObsidian,
        textColor: goldAccent,
        font: 'times',
        fontStyle: 'bold',
        fontSize: 8.5
      },
      bodyStyles: {
        lineWidth: { bottom: 0.2 },
        lineColor: [225, 220, 212]
      },
      columnStyles: {
        0: { cellWidth: 58, fontStyle: 'bold' },
        1: { cellWidth: 42, fontSize: 7.2, textColor: [90, 85, 80] },
        2: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 24, halign: 'right' },
        4: { cellWidth: 22, halign: 'right' },
        5: { cellWidth: 24, halign: 'right', fontStyle: 'bold', textColor: [15, 15, 15] }
      }
    });

    const finalY = doc.lastAutoTable.finalY + 6;

    // --- 6. FINANCIAL TOTALS & DRIVER HANDOVER QR SECTION ---
    const totalOrder = Number(order.totalPrice || 0);
    const shippingCost = Number(order.shippingCost || 0);
    const productsSubtotal = Math.max(0, totalOrder - shippingCost);
    const vatAmount = Number(order.vatAmount || (productsSubtotal > 0 ? (productsSubtotal * (15 / 115)).toFixed(2) : 0));
    const subTotalExclVat = Math.max(0, Number((productsSubtotal - vatAmount).toFixed(2)));

    // Generate high-resolution authentic QR Code for driver & carrier handover
    const trackingUrl = `https://grandstoreglobal.com/customer/orders?ref=driver_scan&order=${order.orderId || order._id}&wb=${waybillNumber}`;
    let qrDataUrl = null;
    try {
      qrDataUrl = await QRCode.toDataURL(trackingUrl, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 220
      });
    } catch (qrErr) {
      console.warn('Failed to generate invoice QR code:', qrErr);
    }

    // Left Block: Driver Handover QR Card
    const qrCardW = 100;
    doc.setFillColor(252, 251, 248);
    doc.roundedRect(margin, finalY, qrCardW, 38, 1, 1, 'F');
    doc.setDrawColor(215, 205, 190);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, finalY, qrCardW, 38, 1, 1, 'S');

    if (qrDataUrl) {
      doc.addImage(qrDataUrl, 'PNG', margin + 3, finalY + 4, 30, 30);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...goldAccent);
    doc.text('DRIVER HANDOVER QR DOCKET', margin + 36, finalY + 7);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...darkObsidian);
    doc.text('SCAN TO VERIFY CONSIGNMENT', margin + 36, finalY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...textMuted);
    const driverInstructions = doc.splitTextToSize(
      'Aramex Courier / Vault Staff: Scan this QR code at parcel handover to verify seal integrity, confirm manifest custody, and activate live GPS tracking.',
      60
    );
    doc.text(driverInstructions, margin + 36, finalY + 16.5);

    doc.setFont('courier', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...darkObsidian);
    doc.text(`*${waybillNumber}*`, margin + 36, finalY + 34);

    // Right Block: Financial Summary
    const totalsX = margin + qrCardW + 6;
    const totalsW = contentWidth - qrCardW - 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.text('SUBTOTAL (EXCL. VAT):', totalsX, finalY + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMain);
    doc.text(pdfPrice(subTotalExclVat), pageWidth - margin, finalY + 6, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textMuted);
    doc.text('SOUTH AFRICAN VAT (15%):', totalsX, finalY + 12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMain);
    doc.text(pdfPrice(vatAmount), pageWidth - margin, finalY + 12, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...textMuted);
    doc.text('FREIGHT & COURIER:', totalsX, finalY + 18);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textMain);
    doc.text(shippingCost > 0 ? pdfPrice(shippingCost) : 'Complimentary', pageWidth - margin, finalY + 18, { align: 'right' });

    // GRAND TOTAL ACCENT PILL
    doc.setFillColor(...darkObsidian);
    doc.roundedRect(totalsX - 2, finalY + 23, totalsW + 2, 14, 1, 1, 'F');
    doc.setDrawColor(...goldAccent);
    doc.setLineWidth(0.4);
    doc.roundedRect(totalsX - 2, finalY + 23, totalsW + 2, 14, 1, 1, 'S');

    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...goldAccent);
    doc.text('TOTAL PAID:', totalsX + 4, finalY + 32);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(pdfPrice(totalOrder), pageWidth - margin - 3, finalY + 32, { align: 'right' });

    // --- 7. PERFORATED CONSIGNMENT POUCH ATTACHMENT SLIP ---
    const slipY = pageHeight - 44;

    // Perforated line
    doc.setDrawColor(180, 170, 155);
    doc.setLineWidth(0.3);
    doc.setLineDash([2, 1.5], 0);
    doc.line(margin, slipY, pageWidth - margin, slipY);
    doc.setLineDash([]); // Reset to solid

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...goldAccent);
    doc.text('--- ATTACH TO CONSIGNMENT: CUSTOMS, CARRIER & WAREHOUSE DISPATCH COPY ---', pageWidth / 2, slipY + 4, { align: 'center' });

    // Outer Slip Container
    doc.setFillColor(250, 248, 244);
    doc.rect(margin, slipY + 6, contentWidth, 26, 'F');
    doc.setDrawColor(215, 205, 190);
    doc.setLineWidth(0.3);
    doc.rect(margin, slipY + 6, contentWidth, 26, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...darkObsidian);
    const waybillLabel = courierCompany.includes('Courier Guy') ? 'TCG WAYBILL' : (courierCompany.includes('PostNet') ? 'POSTNET REF' : 'WAYBILL');
    doc.text(`CONSIGNMENT: ${orderRef}`, margin + 4, slipY + 12);
    doc.text(`${waybillLabel}: ${waybillNumber}`, margin + 65, slipY + 12);
    doc.text(`PIECES: 1 of 1  •  WT: ${weightKg} KG`, margin + 130, slipY + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...textMuted);
    doc.text(`Consignee: ${customerName} | Dest: ${destCity}, ${destCountry} | Phone: ${customerPhone}`, margin + 4, slipY + 18);
    doc.text(`Carrier: ${courierCompany} (${serviceType}) | Security: Tamper-Evident Seal Verified`, margin + 4, slipY + 23);
    doc.text('Declared Luxury Alcoholic Beverage (Tax & Excise Cleared) • NIVARP INTERNATIONAL PTY LTD (VAT No: 4040275077)', margin + 4, slipY + 28);

    // Return Node Buffer
    const buffer = Buffer.from(doc.output('arraybuffer'));
    return buffer;
  } catch (error) {
    console.error('generateOrderReceiptBuffer error:', error);
    throw error;
  }
};

/**
 * Generates the auction acquisition certificate with Grandstore branding,
 * a subtle logo watermark and a print-ready ivory and gold layout.
 */
const generateAuctionCertificateBuffer = async (lot, winner = {}, order = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const crypto = require("crypto");
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = doc.internal.pageSize.width; // 297mm
      const pageHeight = doc.internal.pageSize.height; // 210mm
      const centerX = pageWidth / 2; // 148.5mm

      // Extract and sanitize lot & winner data
      const winnerName = (winner && (winner.legalFullName || winner.name)) ||
                         (order && order.shippingAddress && (order.shippingAddress.name || `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim())) ||
                         "Distinguished Patron";
      const bidderNumber = (winner && (winner.bidderNumber || (winner._id && String(winner._id).slice(-6).toUpperCase()))) || "VIP-PATRON";
      const lotTitle = (lot && lot.title) || "Exclusive Grand Store Auction Masterpiece";
      const lotNumber = (lot && (lot.lotNumber || (lot._id && String(lot._id).slice(-6).toUpperCase()))) || "GS-LOT";
      const winningBid = (lot && (lot.winningBid || lot.currentBid)) || (order && order.subTotal) || 0;
      const hammerDate = (lot && (lot.endDate || lot.updatedAt))
        ? new Date(lot.endDate || lot.updatedAt).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })
        : new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" });
      const certRef = lot.gsReference || (order && order.transactionId) || `GS-AUC-CERT-${lot._id ? String(lot._id).slice(-8).toUpperCase() : Date.now().toString().slice(-8)}`;

      // Generate cryptographically unique verification hash
      const hashSeed = `${lot._id || ""}-${winner._id || ""}-${winningBid}-${certRef}`;
      const authHash = crypto.createHash("sha256").update(hashSeed).digest("hex").slice(0, 16).toUpperCase();
      const authCode = `GSC-${authHash.slice(0, 4)}-${authHash.slice(4, 8)}-${authHash.slice(8, 12)}`;

      // Shared Grandstore palette and restrained, print-ready certificate layout.
      const ink = [41, 38, 31];
      const gold = [151, 116, 57];
      const muted = [117, 109, 94];
      const line = [215, 197, 161];
      const label = (text, x, y, align = "left") => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(...gold);
        doc.text(String(text), x, y, { align, charSpace: 0.35 });
      };
      // Fit complete variable-length values within their allotted area.
      const fittedText = (text, x, y, width, size, maxLines = 1, align = "left") => {
        let lines;
        do {
          doc.setFontSize(size);
          lines = doc.splitTextToSize(String(text), width);
          if (lines.length <= maxLines || size <= 6) break;
          size -= 0.5;
        } while (true);
        doc.text(lines, x, y, { align, lineHeightFactor: 1.2 });
      };

      doc.setFillColor(251, 248, 241);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
      doc.setDrawColor(185, 155, 96);
      doc.setLineWidth(0.6);
      doc.rect(9, 9, pageWidth - 18, pageHeight - 18);
      doc.setDrawColor(...line);
      doc.setLineWidth(0.25);
      doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

      // Fine corner details keep the document frame quiet and balanced.
      doc.setDrawColor(...gold);
      doc.setLineWidth(0.7);
      [[14, 14, 1, 1], [pageWidth - 14, 14, -1, 1],
        [14, pageHeight - 14, 1, -1], [pageWidth - 14, pageHeight - 14, -1, -1]]
        .forEach(([x, y, dx, dy]) => {
          doc.line(x, y, x + dx * 8, y);
          doc.line(x, y, x, y + dy * 8);
        });

      let logoData = null;
      let logoRatio = 4257 / 1350;
      try {
        const logoPath = path.join(__dirname, "../../frontend/public/logo.png");
        if (fs.existsSync(logoPath)) {
          const candidate = `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`;
          const properties = doc.getImageProperties(candidate);
          logoRatio = properties.width / properties.height;
          logoData = candidate;
        }
      } catch (err) {
        console.warn("Could not load Grandstore logo for certificate generation:", err);
      }

      // The watermark uses the actual brand artwork at low opacity.
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity: 0.065 }));
      if (logoData) {
        doc.addImage(logoData, "PNG", centerX - 87, 69, 174, 174 / logoRatio, "grandstoreCertificateLogo", "FAST");
      }
      doc.setFont("times", "bold");
      doc.setFontSize(39);
      doc.setTextColor(...gold);
      doc.text("THE GRAND STORE", centerX, 124, { align: "center", charSpace: 1.4 });
      doc.restoreGraphicsState();

      if (logoData) {
        doc.addImage(logoData, "PNG", centerX - 34, 18, 68, 68 / logoRatio, "grandstoreCertificateLogo", "FAST");
      } else {
        doc.setFont("times", "bold");
        doc.setFontSize(22);
        doc.setTextColor(...gold);
        doc.text("THE GRAND STORE", centerX, 29, { align: "center" });
        doc.setFont("times", "italic");
        doc.setFontSize(9);
        doc.text("Crafting Moments, Raising Spirits", centerX, 35, { align: "center" });
      }

      label("THE AUCTION COLLECTION", centerX, 45, "center");
      doc.setDrawColor(...line);
      doc.setLineWidth(0.25);
      doc.line(centerX - 50, 44, centerX - 31, 44);
      doc.line(centerX + 31, 44, centerX + 50, 44);

      doc.setFont("times", "normal");
      doc.setFontSize(34);
      doc.setTextColor(...ink);
      doc.text("Certificate", centerX, 60, { align: "center" });
      label("OF ACQUISITION", centerX, 67, "center");
      label("PROUDLY PRESENTED TO", centerX, 78, "center");

      doc.setFont("times", "normal");
      doc.setTextColor(...ink);
      fittedText(winnerName, centerX, 88, 220, 25, 2, "center");
      doc.setDrawColor(185, 155, 96);
      doc.line(centerX - 18, 99, centerX + 18, 99);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...muted);
      fittedText(`Registered Vault Patron Account #${bidderNumber}  |  Status: Verified Acquisition`, centerX, 104, 220, 7, 1, "center");

      doc.setFont("times", "normal");
      doc.setFontSize(10);
      doc.setTextColor(95, 88, 75);
      doc.text("In recognition of your successful bid and acquisition in The Grand Store Auction.", centerX, 112, { align: "center" });
      doc.text("Your passion for exceptional spirits and rare collections is truly appreciated.", centerX, 117, { align: "center" });

      const boxX = 30;
      const boxY = 124;
      const boxWidth = pageWidth - 60;
      const dividerX = 190;
      doc.setFillColor(245, 240, 230);
      doc.rect(boxX, boxY, boxWidth, 38, "F");
      doc.setDrawColor(...line);
      doc.setLineWidth(0.3);
      doc.line(boxX, boxY, boxX + boxWidth, boxY);
      doc.line(boxX, boxY + 38, boxX + boxWidth, boxY + 38);
      doc.line(dividerX, boxY + 5, dividerX, boxY + 26);

      label(`CATALOGUE LOT #${lotNumber}`, boxX + 7, boxY + 7);
      doc.setFont("times", "normal");
      doc.setTextColor(...ink);
      fittedText(lotTitle, boxX + 7, boxY + 14, 144, 15, 3);

      label("WINNING HAMMER BID", dividerX + 8, boxY + 7);
      doc.setFont("times", "normal");
      doc.setTextColor(...ink);
      fittedText(`R ${Number(winningBid).toLocaleString("en-ZA", { minimumFractionDigits: 2 }).replace(/\u00a0|\u202f/g, " ")}`, dividerX + 8, boxY + 17, 60, 23);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...muted);
      doc.text("Currency: ZAR (Rand)", dividerX + 8, boxY + 24);

      doc.line(boxX + 7, boxY + 29, boxX + boxWidth - 7, boxY + 29);
      doc.setFontSize(6.8);
      doc.text("Authentication: The Grand Store Private Vault Archive Provenance", boxX + 7, boxY + 34.5);
      doc.setTextColor(88, 101, 76);
      doc.text("South African CPA Section 45 Trust Protected", boxX + boxWidth - 7, boxY + 34.5, { align: "right" });

      label("DATE OF ISSUE", 37, 172);
      doc.setFont("times", "normal");
      doc.setTextColor(...ink);
      fittedText(hammerDate, 37, 179, 72, 11);
      doc.setDrawColor(...line);
      doc.line(37, 183, 108, 183);

      label("CERTIFICATE REFERENCE", 198, 171);
      doc.setFont("courier", "normal");
      doc.setTextColor(...ink);
      fittedText(certRef, 198, 177, 62, 8);
      doc.setTextColor(...muted);
      fittedText(`Certificate no. ${authCode}`, 198, 183, 62, 7);

      // Vector seal avoids font-dependent decorative symbols in the PDF.
      const sealY = 175;
      doc.setDrawColor(...line);
      doc.setLineWidth(0.25);
      doc.circle(centerX, sealY, 8.5);
      doc.setDrawColor(...gold);
      doc.circle(centerX, sealY, 7);
      doc.setLineWidth(0.45);
      doc.lines([[3.5, 1.5], [0, 3], [-3.5, 3], [-3.5, -3], [0, -3], [3.5, -1.5]], centerX, sealY - 4, [1, 1], "S", true);
      doc.line(centerX - 1.8, sealY, centerX - 0.3, sealY + 1.5);
      doc.line(centerX - 0.3, sealY + 1.5, centerX + 2.2, sealY - 1.5);
      label("CERTIFIED PROVENANCE", centerX, 188, "center");

      doc.setFont("times", "italic");
      doc.setFontSize(9);
      doc.setTextColor(...gold);
      doc.text("Cheers to Great Choices!", 37, 191);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...muted);
      doc.text("THE GRAND STORE  |  VAULT ARCHIVE", pageWidth - 37, 192, { align: "right" });


      // Output arraybuffer -> Node Buffer
      const buffer = Buffer.from(doc.output("arraybuffer"));
      resolve(buffer);
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = {
  generateOrderReceiptBuffer,
  generateAuctionCertificateBuffer
};
