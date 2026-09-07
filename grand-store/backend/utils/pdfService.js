const { jsPDF } = require("jspdf");
require("jspdf-autotable");
const fs = require("fs");
const path = require("path");

const generateOrderReceiptBuffer = async (order, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF();
      const invoiceNo = order.invoiceNumber || order._id.toString();

      // --- THEME COLORS ---
      const themeColor = [15, 15, 15]; // Charcoal/Black
      const accentColor = [216, 183, 109]; // Grand Store Gold

      // Format price helper
      const formatPrice = (amount) => {
        return `R ${Number(amount).toFixed(2)}`;
      };

      const pdfPrice = (amount) => {
        return formatPrice(amount).replace(/\u00A0/g, ' ').replace(/[^\x20-\x7E]/g, '');
      };

      // --- LOGO Handling ---
      let logoData = null;
      let logoExt = 'PNG';
      try {
        const logoPath = path.join(__dirname, '../../frontend/public/logo.png');
        if (fs.existsSync(logoPath)) {
          const logoBuffer = fs.readFileSync(logoPath);
          logoData = `data:image/png;base64,${logoBuffer.toString('base64')}`;
        }
      } catch (err) {
        console.warn("Could not load logo.png for PDF generation:", err);
      }

      // --- WATERMARK ---
      if (logoData) {
        doc.setGState(new doc.GState({ opacity: 0.04 }));
        doc.addImage(logoData, logoExt, 35, 133, 140, 30, 'logo', 'FAST');
        doc.setGState(new doc.GState({ opacity: 1.0 }));
      }

      // --- LOGO (Top Left) ---
      if (logoData) {
        doc.addImage(logoData, logoExt, 14, 15, 45, 15, 'logo', 'FAST');
      } else {
        doc.setFont("times", "bold");
        doc.setFontSize(22);
        doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
        doc.text("THE GRAND STORE", 14, 25);
      }

      // --- HEADER (Top Right) ---
      doc.setFont("times", "bold");
      doc.setFontSize(26);
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]); // Gold
      doc.text("INVOICE", 196, 24, { align: "right" });
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text(new Date(order.createdAt || Date.now()).toLocaleDateString(), 196, 30, { align: "right" });
      doc.text(`Ref: #${invoiceNo.toUpperCase()}`, 196, 35, { align: "right" });

      // --- ADDRESSES ---
      // Left: Store Address
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(0);
      doc.text("Office Address", 14, 50);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60);
      doc.text("The Grand Store", 14, 55);
      doc.text("Premium Goods & Accessories", 14, 60);
      doc.text("VAT No: 123456789", 14, 65);

      // Right: Customer Address
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text("To :", 120, 50);
      
      const customerName = (user && user.name) || order.shippingAddress?.name || "Customer";
      const customerEmail = (user && user.email) || "";
      
      doc.text(customerName, 120, 55);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60);
      doc.text(customerEmail, 120, 60);
      
      // Wrap Address so it doesn't overflow page
      const addressLines = doc.splitTextToSize(order.shippingAddress?.address || "", 76);
      doc.text(addressLines, 120, 65);
      const addressOffset = 65 + (addressLines.length * 4.5); // line height spacing

      doc.text(`${order.shippingAddress?.city || ""}, ${order.shippingAddress?.postalCode || ""}`, 120, addressOffset);
      doc.text(order.shippingAddress?.country || "", 120, addressOffset + 5);

      // --- TABLE ---
      const tableData = (order.orderItems || []).map((item) => [
        item.name,
        pdfPrice(item.price),
        item.qty || item.quantity || 1,
        pdfPrice(item.price * (item.qty || item.quantity || 1)),
      ]);

      const tableStartY = Math.max(85, addressOffset + 15);

      const autoTable = require('jspdf-autotable').default || require('jspdf-autotable');
      autoTable(doc, {
        startY: tableStartY,
        head: [["Items Description", "Unit Price", "Qnt", "Total"]],
        body: tableData,
        theme: "plain",
        styles: {
          font: "helvetica",
          fontSize: 9,
          textColor: [0, 0, 0],
          cellPadding: { top: 6, right: 4, bottom: 6, left: 4 },
        },
        headStyles: { 
          fillColor: themeColor,
          textColor: accentColor,
          font: "times",
          fontStyle: "bold",
        },
        bodyStyles: {
          lineWidth: { bottom: 0.5 },
          lineColor: [200, 200, 200],
        },
        columnStyles: {
          0: { cellWidth: 'auto', fontStyle: 'bold' },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'right' },
        }
      });

      const finalY = doc.lastAutoTable.finalY + 10;

      // --- NOTES (Left) ---
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0);
      doc.text("Note:", 14, finalY + 5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      doc.text("Payment Method:", 14, finalY + 10);
      doc.text(order.paymentMethod || "N/A", 14, finalY + 15);

      // --- TOTALS (Right) ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(0);
      doc.text("SUBTOTAL :", 150, finalY + 5, { align: "right" });
      doc.text(pdfPrice(order.totalPrice - order.shippingCost), 196, finalY + 5, { align: "right" });

      doc.text("SHIPPING :", 150, finalY + 12, { align: "right" });
      doc.text(order.shippingCost === 0 ? "Complimentary" : pdfPrice(order.shippingCost), 196, finalY + 12, { align: "right" });

      // TOTAL BLOCK
      doc.setFillColor(themeColor[0], themeColor[1], themeColor[2]);
      doc.rect(120, finalY + 18, 80, 12, "F");

      doc.setFont("times", "bold");
      doc.setFontSize(11);
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text("TOTAL DUE :", 130, finalY + 26);
      doc.setTextColor(255, 255, 255);
      doc.text(pdfPrice(order.totalPrice), 196, finalY + 26, { align: "right" });

      // --- THANK YOU ---
      doc.setFontSize(14);
      doc.setFont("times", "bold");
      doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.text("Thank you for your Business", 14, finalY + 45);

      // --- FOOTER DIVIDER ---
      const pageHeight = doc.internal.pageSize.height;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(14, pageHeight - 35, 196, pageHeight - 35);

      // --- FOOTER 3 COLUMNS ---
      doc.setFontSize(8);
      
      // Col 1
      doc.setFont("helvetica", "bold");
      doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
      doc.text("Questions?", 14, pageHeight - 25);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      doc.text("Email    : info@grandstore.com", 14, pageHeight - 20);
      doc.text("Call us  : +1 234 567 890", 14, pageHeight - 15);

      // Col 2
      doc.setFont("helvetica", "bold");
      doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
      doc.text("Payment Info :", 85, pageHeight - 25);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      doc.text(`Method   : ${order.paymentMethod}`, 85, pageHeight - 20);
      doc.text(`Status   : ${order.paymentStatus}`, 85, pageHeight - 15);

      // Col 3
      doc.setFont("helvetica", "bold");
      doc.setTextColor(themeColor[0], themeColor[1], themeColor[2]);
      doc.text("Terms & Conditions/Note:", 145, pageHeight - 25);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80);
      doc.text("All sales are final.", 145, pageHeight - 20);
      doc.text("Keep this receipt for your records.", 145, pageHeight - 15);

      // Output as Node Buffer
      const buffer = Buffer.from(doc.output('arraybuffer'));
      resolve(buffer);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Generates an official, museum-grade Certificate of Acquisition & Authenticity PDF
 * with Grand Store watermark, ornate double gold security borders, official seal,
 * provenance registry details, and dual executive signatures.
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

      // --- 1. CRISP WHITE / WARM LUXURY PARCHMENT BACKGROUND ---
      doc.setFillColor(254, 253, 250); // Official warm white parchment
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // --- 2. LOGO & WATERMARK HANDLING ---
      let logoData = null;
      try {
        const logoPath = path.join(__dirname, "../../frontend/public/logo.png");
        if (fs.existsSync(logoPath)) {
          const logoBuffer = fs.readFileSync(logoPath);
          logoData = `data:image/png;base64,${logoBuffer.toString("base64")}`;
        }
      } catch (err) {
        console.warn("Could not load logo.png for Certificate generation:", err);
      }

      // Central Royal Lifestyle Watermark
      try {
        doc.setGState(new doc.GState({ opacity: 0.04 }));
      } catch (e) {}

      if (logoData) {
        doc.addImage(logoData, "PNG", centerX - 55, 65, 110, 40, "certWatermarkLogo", "FAST");
      }

      doc.setFont("times", "bold");
      doc.setFontSize(44);
      doc.setTextColor(197, 160, 89);
      doc.text("ROYAL LIFESTYLE", centerX, 112, { align: "center" });
      doc.setFontSize(12);
      doc.text("• THE GRAND STORE • VAULT ARCHIVE • CERTIFIED PROVENANCE •", centerX, 122, { align: "center" });

      try {
        doc.setGState(new doc.GState({ opacity: 1.0 }));
      } catch (e) {}

      // --- 3. LUXURY DOUBLE BORDER (BLACK & GOLD) ---
      // Outer Black Frame
      doc.setDrawColor(22, 22, 22);
      doc.setLineWidth(1.4);
      doc.rect(8, 8, pageWidth - 16, pageHeight - 16);

      // Inner Gold Border
      doc.setDrawColor(197, 160, 89);
      doc.setLineWidth(0.8);
      doc.rect(11.5, 11.5, pageWidth - 23, pageHeight - 23);

      // Fine Gold Pinstripe
      doc.setDrawColor(225, 205, 150);
      doc.setLineWidth(0.3);
      doc.rect(13, 13, pageWidth - 26, pageHeight - 26);

      // Corner Gold Rosettes
      const corners = [
        [11.5, 11.5],
        [pageWidth - 11.5, 11.5],
        [11.5, pageHeight - 11.5],
        [pageWidth - 11.5, pageHeight - 11.5]
      ];
      doc.setFillColor(197, 160, 89);
      corners.forEach(([cx, cy]) => {
        doc.rect(cx - 1.2, cy - 1.2, 2.4, 2.4, "F");
      });

      // --- 4. CORNER MOTTO RIBBONS (TOP-RIGHT & BOTTOM-LEFT) ---
      // Top-Right Ribbon: "MORE THAN A DRINK A LEGACY"
      doc.setFillColor(18, 18, 18);
      doc.rect(pageWidth - 48, 13, 35, 18, "F");
      doc.setDrawColor(197, 160, 89);
      doc.setLineWidth(0.4);
      doc.rect(pageWidth - 48, 13, 35, 18, "S");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(220, 185, 105);
      doc.text("MORE", pageWidth - 30.5, 17, { align: "center" });
      doc.text("THAN A", pageWidth - 30.5, 20.5, { align: "center" });
      doc.text("DRINK", pageWidth - 30.5, 24, { align: "center" });
      doc.text("A LEGACY", pageWidth - 30.5, 27.5, { align: "center" });

      // Bottom-Left Ribbon: "COLLECT INVEST CELEBRATE"
      doc.setFillColor(18, 18, 18);
      doc.rect(13, pageHeight - 31, 35, 18, "F");
      doc.setDrawColor(197, 160, 89);
      doc.setLineWidth(0.4);
      doc.rect(13, pageHeight - 31, 35, 18, "S");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(220, 185, 105);
      doc.text("COLLECT", 30.5, pageHeight - 24.5, { align: "center" });
      doc.text("INVEST", 30.5, pageHeight - 20.5, { align: "center" });
      doc.text("CELEBRATE", 30.5, pageHeight - 16.5, { align: "center" });

      // --- 5. TOP HEADER: BRANDING & CURATORIAL PILLARS ---
      // Top-Left: True Royal Lifestyle Emblem Badge
      const emblemX = 28;
      const emblemY = 24;
      doc.setFillColor(20, 20, 20);
      doc.circle(emblemX, emblemY, 8.5, "F");
      doc.setDrawColor(197, 160, 89);
      doc.setLineWidth(0.7);
      doc.circle(emblemX, emblemY, 8.5, "S");
      doc.setDrawColor(225, 205, 150);
      doc.setLineWidth(0.3);
      doc.circle(emblemX, emblemY, 7.2, "S");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(4.2);
      doc.setTextColor(220, 185, 105);
      doc.text("ROYAL", emblemX, emblemY - 4.5, { align: "center" });
      doc.setFont("times", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      doc.text("♔", emblemX, emblemY - 0.5, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(4);
      doc.setTextColor(220, 185, 105);
      doc.text("LIFESTYLE", emblemX, emblemY + 3.2, { align: "center" });
      doc.setTextColor(220, 50, 50);
      doc.setFontSize(4.5);
      doc.text("★ ★ ★", emblemX, emblemY + 6.2, { align: "center" });

      // Top-Left Branding Text
      doc.setFont("times", "bold");
      doc.setFontSize(15);
      doc.setTextColor(180, 135, 45);
      doc.text("THE GRAND STORE", 40, 23);
      doc.setFont("times", "italic");
      doc.setFontSize(8);
      doc.setTextColor(115, 100, 80);
      doc.text("Crafting Moments, Raising Spirits", 40, 27.5);
      doc.setDrawColor(197, 160, 89);
      doc.setLineWidth(0.3);
      doc.line(40, 29, 88, 29);

      // Top-Right Curatorial Categories
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(110, 95, 75);
      doc.text("FINE SPIRITS", pageWidth - 108, 23, { align: "center" });
      doc.text("|", pageWidth - 91, 23, { align: "center" });
      doc.text("RARE COLLECTIONS", pageWidth - 74, 23, { align: "center" });
      doc.text("|", pageWidth - 57, 23, { align: "center" });
      doc.text("EXCLUSIVE AUCTIONS", pageWidth - 42, 23, { align: "center" });

      // --- 6. MAIN CERTIFICATE TITLE ---
      doc.setFont("times", "bold");
      doc.setFontSize(28);
      doc.setTextColor(20, 20, 20);
      doc.text("CERTIFICATE", centerX, 44, { align: "center" });

      // Gold Subtitle with Flanking Flourish Rules
      doc.setFont("times", "bold");
      doc.setFontSize(13);
      doc.setTextColor(185, 140, 45);
      doc.text("—  OF ACQUISITION  —", centerX, 50.5, { align: "center" });
      doc.setDrawColor(197, 160, 89);
      doc.setLineWidth(0.6);
      doc.line(centerX - 68, 50, centerX - 38, 50);
      doc.line(centerX + 38, 50, centerX + 68, 50);

      // --- 7. RECIPIENT PROCLAMATION ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(100, 85, 65);
      doc.text("THIS CERTIFICATE IS PROUDLY PRESENTED TO", centerX, 60, { align: "center" });

      // Winner Name with Gold Accent Underline
      doc.setFont("times", "bold");
      doc.setFontSize(21);
      doc.setTextColor(22, 22, 22);
      doc.text(winnerName.toUpperCase(), centerX, 70, { align: "center" });

      doc.setDrawColor(197, 160, 89);
      doc.setLineWidth(0.8);
      doc.line(centerX - 62, 73, centerX + 62, 73);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(120, 105, 85);
      doc.text(`Registered Vault Patron Account #${bidderNumber}  •  Status: Verified Acquisition`, centerX, 77.5, { align: "center" });

      // --- 8. OFFICIAL PROCLAMATION COPY ---
      doc.setFont("times", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(45, 40, 35);
      doc.text("In recognition of your successful bid and acquisition in The Grand Store Auction.", centerX, 86, { align: "center" });
      doc.text("Your passion for exceptional spirits and rare collections is truly appreciated.", centerX, 91.5, { align: "center" });
      doc.setFont("times", "italic");
      doc.setFontSize(11);
      doc.setTextColor(180, 135, 45);
      doc.text("Cheers to Great Choices!", centerX, 98, { align: "center" });

      // --- 9. LOT PARTICULARS & HAMMER RECORD BOX ---
      const boxX = 36;
      const boxY = 104;
      const boxW = pageWidth - 72; // 225mm
      const boxH = 34;

      doc.setFillColor(250, 248, 242);
      doc.rect(boxX, boxY, boxW, boxH, "F");
      doc.setDrawColor(218, 192, 135);
      doc.setLineWidth(0.5);
      doc.rect(boxX, boxY, boxW, boxH, "S");

      // Left Column: Lot details
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(180, 135, 45);
      doc.text(`CATALOGUE LOT #${lotNumber}`, boxX + 8, boxY + 8);

      doc.setFont("times", "bold");
      doc.setFontSize(12.5);
      doc.setTextColor(20, 20, 20);
      const titleLines = doc.splitTextToSize(lotTitle, 130);
      doc.text(titleLines.slice(0, 2), boxX + 8, boxY + 15);

      doc.setFont("times", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(100, 90, 75);
      doc.text("Authentication: The Grand Store Private Vault Archive Provenance", boxX + 8, boxY + 25);
      doc.text("Statutory Compliance: South African CPA Section 45 Trust Protected", boxX + 8, boxY + 30);

      // Vertical Divider
      doc.setDrawColor(220, 205, 175);
      doc.setLineWidth(0.4);
      doc.line(boxX + 145, boxY + 4, boxX + 145, boxY + boxH - 4);

      // Right Column: Hammer Price & Auth
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(180, 135, 45);
      doc.text("OFFICIAL HAMMER PRICE", boxX + 152, boxY + 8);

      doc.setFont("times", "bold");
      doc.setFontSize(15);
      doc.setTextColor(22, 22, 22);
      doc.text(`R ${Number(winningBid).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`, boxX + 152, boxY + 16.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 90, 75);
      doc.text(`Currency: ZAR (Rand)`, boxX + 152, boxY + 23);
      doc.setFont("courier", "bold");
      doc.setFontSize(7.5);
      doc.text(`Security Token: ${authCode}`, boxX + 152, boxY + 29);

      // --- 10. CENTER PROVENANCE CREST (LAUREL WREATH WITH GAVEL) ---
      const emblemCenterY = 154;
      doc.setFont("times", "bold");
      doc.setFontSize(16);
      doc.setTextColor(197, 160, 89);
      doc.text("⚜", centerX, emblemCenterY - 4, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(180, 135, 45);
      doc.text("CERTIFIED", centerX, emblemCenterY + 2, { align: "center" });
      doc.text("PROVENANCE", centerX, emblemCenterY + 6, { align: "center" });
      doc.setFontSize(7);
      doc.text("★  ★  ★", centerX, emblemCenterY + 10, { align: "center" });

      // --- 11. BOTTOM-RIGHT GOLD MEDALLION SEAL ---
      const sealX = pageWidth - 55;
      const sealY = 155;

      // Scalloped outer gold circle
      doc.setFillColor(220, 180, 75);
      doc.circle(sealX, sealY, 15, "F");
      // Inner cream circle
      doc.setFillColor(252, 245, 215);
      doc.circle(sealX, sealY, 13.5, "F");
      // Core gold disc
      doc.setFillColor(197, 155, 50);
      doc.circle(sealX, sealY, 12, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.setTextColor(255, 255, 255);
      doc.text("★  ★  ★", sealX, sealY - 5, { align: "center" });
      doc.setFontSize(5.8);
      doc.text("EXCEPTIONAL", sealX, sealY - 1.5, { align: "center" });
      doc.text("PEOPLE", sealX, sealY + 1.5, { align: "center" });
      doc.text("EXCEPTIONAL", sealX, sealY + 4.5, { align: "center" });
      doc.text("SPIRITS", sealX, sealY + 7.5, { align: "center" });
      doc.setFontSize(6.5);
      doc.text("∞", sealX, sealY + 10.5, { align: "center" });

      // --- 12. BOTTOM FIELDS: DATE OF ISSUE & CERTIFICATE NO. ---
      // (Two signatures explicitly omitted as commanded)
      const bottomFieldsY = 177;

      // Date of Issue
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 85, 65);
      doc.text("DATE OF ISSUE", 42, bottomFieldsY);
      doc.setDrawColor(197, 160, 89);
      doc.setLineWidth(0.4);
      doc.line(68, bottomFieldsY, 115, bottomFieldsY);
      doc.setFont("times", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(30, 30, 30);
      doc.text(hammerDate, 70, bottomFieldsY - 1);

      // Certificate No.
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 85, 65);
      doc.text("CERTIFICATE NO.", 130, bottomFieldsY);
      doc.setDrawColor(197, 160, 89);
      doc.setLineWidth(0.4);
      doc.line(160, bottomFieldsY, 215, bottomFieldsY);
      doc.setFont("courier", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(30, 30, 30);
      doc.text(authCode, 162, bottomFieldsY - 1);

      // --- 13. BOTTOM REGISTERED VAULT FOOTNOTE ---
      doc.setFont("times", "normal");
      doc.setFontSize(7);
      doc.setTextColor(125, 110, 90);
      doc.text(
        "THE GRAND STORE   •   VAULT ARCHIVE   •   CERTIFIED PROVENANCE",
        centerX,
        191,
        { align: "center" }
      );

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
