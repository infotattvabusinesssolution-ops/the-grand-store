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
                         (order && order.shippingAddress && order.shippingAddress.name) ||
                         "Distinguished Patron";
      const bidderNumber = (winner && (winner.bidderNumber || (winner._id && String(winner._id).slice(-6).toUpperCase()))) || "VIP-PATRON";
      const lotTitle = (lot && lot.title) || "Exclusive Grand Store Auction Masterpiece";
      const lotNumber = (lot && (lot.lotNumber || (lot._id && String(lot._id).slice(-6).toUpperCase()))) || "GS-LOT";
      const winningBid = (lot && (lot.winningBid || lot.currentBid)) || (order && order.subTotal) || 0;
      const hammerDate = (lot && (lot.endDate || lot.updatedAt))
        ? new Date(lot.endDate || lot.updatedAt).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })
        : new Date().toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" });
      const certRef = lot.gsReference || (order && order.transactionId) || `GS-AUC-CERT-${lot._id ? String(lot._id).slice(-8).toUpperCase() : Date.now().toString().slice(-8)}`;
      const category = (lot && (lot.category || lot.subcategory)) || "The Grand Store Private Vault Reserve";

      // Generate cryptographically unique verification hash
      const hashSeed = `${lot._id || ""}-${winner._id || ""}-${winningBid}-${certRef}`;
      const authHash = crypto.createHash("sha256").update(hashSeed).digest("hex").slice(0, 16).toUpperCase();
      const authCode = `GSC-${authHash.slice(0, 4)}-${authHash.slice(4, 8)}-${authHash.slice(8, 12)}`;

      // --- 1. LUXURY PARCHMENT BACKGROUND ---
      doc.setFillColor(253, 251, 246); // Rich warm ivory
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // --- 2. LOGO HANDLING ---
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

      // --- 3. GRAND STORE SECURITY WATERMARK ---
      try {
        doc.setGState(new doc.GState({ opacity: 0.05 }));
      } catch (e) {
        // Fallback if GState is not available
      }

      if (logoData) {
        doc.addImage(logoData, "PNG", centerX - 60, 68, 120, 42, "certWatermarkLogo", "FAST");
      }

      doc.setFont("times", "bold");
      doc.setFontSize(38);
      doc.setTextColor(180, 140, 50);
      doc.text("THE GRAND STORE", centerX, 115, { align: "center" });
      doc.setFontSize(13);
      doc.text("• OFFICIAL VAULT ARCHIVE • CERTIFIED AUTHENTIC PROVENANCE •", centerX, 125, { align: "center" });

      try {
        doc.setGState(new doc.GState({ opacity: 1.0 }));
      } catch (e) {}

      // --- 4. ORNATE DOUBLE GOLD SECURITY BORDERS ---
      // Outer border (Solid Gold)
      doc.setDrawColor(201, 163, 75);
      doc.setLineWidth(1.6);
      doc.rect(9, 9, pageWidth - 18, pageHeight - 18);

      // Inner border (Fine Gold Filigree)
      doc.setDrawColor(228, 195, 115);
      doc.setLineWidth(0.6);
      doc.rect(13, 13, pageWidth - 26, pageHeight - 26);

      // Corner Rosettes/Diamonds
      const corners = [
        [11, 11],
        [pageWidth - 11, 11],
        [11, pageHeight - 11],
        [pageWidth - 11, pageHeight - 11]
      ];
      doc.setFillColor(201, 163, 75);
      corners.forEach(([cx, cy]) => {
        doc.rect(cx - 1.5, cy - 1.5, 3, 3, "F");
      });

      // --- 5. TOP HERALDIC HEADER ---
      doc.setFont("times", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(185, 140, 45);
      doc.text("• THE GRAND STORE OF SOUTH AFRICA •", centerX, 22, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(125, 110, 85);
      doc.text("CURATORIAL AUCTION ARCHIVE & PROVENANCE REGISTRY", centerX, 26.5, { align: "center" });

      // Fine golden divider with center diamond
      doc.setDrawColor(201, 163, 75);
      doc.setLineWidth(0.4);
      doc.line(65, 29.5, centerX - 8, 29.5);
      doc.line(centerX + 8, 29.5, pageWidth - 65, 29.5);
      doc.setFont("times", "bold");
      doc.setFontSize(8);
      doc.setTextColor(201, 163, 75);
      doc.text("◆", centerX, 30.5, { align: "center" });

      // --- 6. MAIN CERTIFICATE TITLE ---
      doc.setFont("times", "bold");
      doc.setFontSize(23);
      doc.setTextColor(24, 22, 18);
      doc.text("CERTIFICATE OF ACQUISITION", centerX, 39, { align: "center" });

      doc.setFont("times", "italic");
      doc.setFontSize(10.5);
      doc.setTextColor(175, 130, 45);
      doc.text("And Verified Authenticity & Legal Ownership Transfer", centerX, 44.5, { align: "center" });

      doc.setFont("courier", "bold");
      doc.setFontSize(8);
      doc.setTextColor(120, 105, 80);
      doc.text(`ARCHIVE REGISTRY REF: ${certRef}`, centerX, 49.5, { align: "center" });

      // --- 7. FORMAL PROCLAMATION ---
      doc.setFont("times", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(65, 60, 50);
      doc.text(
        "Be it officially proclaimed that under the rules of auction gavel fall, full legal title and authenticated ownership",
        centerX,
        56.5,
        { align: "center" }
      );
      doc.text(
        "of the singular reserve piece described herein has been awarded to the registered patron:",
        centerX,
        61,
        { align: "center" }
      );

      // --- 8. WINNER PATRON BLOCK ---
      doc.setFont("times", "bold");
      doc.setFontSize(19);
      doc.setTextColor(180, 130, 30);
      doc.text(winnerName.toUpperCase(), centerX, 70, { align: "center" });

      doc.setDrawColor(201, 163, 75);
      doc.setLineWidth(0.7);
      doc.line(75, 72.5, pageWidth - 75, 72.5);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(115, 105, 90);
      doc.text(
        `Registered Vault Patron: ${bidderNumber}   •   Title: Permanent Private Collector   •   Status: Verified Acquisition`,
        centerX,
        77,
        { align: "center" }
      );

      // --- 9. LOT SPECIFICATION TABLE / FRAMED BOX ---
      const boxX = 22;
      const boxY = 82;
      const boxW = pageWidth - 44; // 253mm
      const boxH = 46;

      doc.setFillColor(247, 244, 236);
      doc.rect(boxX, boxY, boxW, boxH, "F");
      doc.setDrawColor(218, 185, 110);
      doc.setLineWidth(0.5);
      doc.rect(boxX, boxY, boxW, boxH, "S");

      // Left Section: Lot Particulars
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(175, 130, 45);
      doc.text(`CATALOGUE LOT #${lotNumber}`, boxX + 8, boxY + 8);

      doc.setFont("times", "bold");
      doc.setFontSize(13);
      doc.setTextColor(20, 20, 20);
      const titleLines = doc.splitTextToSize(lotTitle, 142);
      doc.text(titleLines.slice(0, 2), boxX + 8, boxY + 15);

      doc.setFont("times", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(85, 75, 60);
      doc.text(`Classification: ${category}`, boxX + 8, boxY + 26);
      doc.text("Statutory Protection: South African CPA Section 45 Escrow Trust Certified", boxX + 8, boxY + 32);
      doc.text("Provenance: Authenticated & Sealed via The Grand Store Private Vault", boxX + 8, boxY + 38);

      // Divider inside box
      doc.setDrawColor(220, 210, 190);
      doc.setLineWidth(0.4);
      doc.line(boxX + 160, boxY + 4, boxX + 160, boxY + boxH - 4);

      // Right Section: Financial & Security Record
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(175, 130, 45);
      doc.text("OFFICIAL HAMMER PRICE", boxX + 168, boxY + 8);

      doc.setFont("times", "bold");
      doc.setFontSize(16);
      doc.setTextColor(25, 25, 25);
      doc.text(
        `R ${Number(winningBid).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`,
        boxX + 168,
        boxY + 17
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(95, 85, 70);
      doc.text(`Date of Hammer Fall: ${hammerDate}`, boxX + 168, boxY + 25);
      doc.text(`Currency: ZAR (South African Rand)`, boxX + 168, boxY + 30.5);
      doc.setFont("courier", "bold");
      doc.setFontSize(7.5);
      doc.text(`Security Token: ${authCode}`, boxX + 168, boxY + 37);

      // --- 10. OFFICIAL GOLD EMBOSSED SEAL ---
      const sealX = 42;
      const sealY = 153;

      // Outer gold circle
      doc.setFillColor(216, 175, 75);
      doc.circle(sealX, sealY, 13, "F");
      // Inner cream ring
      doc.setFillColor(248, 235, 185);
      doc.circle(sealX, sealY, 11, "F");
      // Inner gold disc
      doc.setFillColor(205, 160, 55);
      doc.circle(sealX, sealY, 9.5, "F");

      doc.setFont("times", "bold");
      doc.setFontSize(6);
      doc.setTextColor(255, 255, 255);
      doc.text("THE GRAND STORE", sealX, sealY - 2.5, { align: "center" });
      doc.setFontSize(5.5);
      doc.text("SEAL OF AUTHENTICITY", sealX, sealY + 1.2, { align: "center" });
      doc.setFontSize(6.5);
      doc.text("★  ★  ★", sealX, sealY + 4.8, { align: "center" });

      // Ribbon tails below seal
      doc.setFillColor(185, 140, 45);
      doc.triangle(sealX - 7, sealY + 11, sealX - 2, sealY + 11, sealX - 5, sealY + 18, "F");
      doc.triangle(sealX + 2, sealY + 11, sealX + 7, sealY + 11, sealX + 5, sealY + 18, "F");

      // --- 11. DUAL CURATORIAL SIGNATURES ---
      // Left Signatory: Director of Curatorial Acquisitions
      const sig1X = 100;
      const sig1Y = 157;
      doc.setFont("times", "italic");
      doc.setFontSize(13);
      doc.setTextColor(35, 35, 35);
      doc.text("Julian Vance-Montgomery", sig1X, sig1Y - 3);

      doc.setDrawColor(185, 150, 80);
      doc.setLineWidth(0.6);
      doc.line(sig1X - 25, sig1Y, sig1X + 48, sig1Y);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(175, 130, 45);
      doc.text("DIRECTOR OF CURATORIAL ACQUISITIONS", sig1X - 25, sig1Y + 4.2);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(115, 105, 90);
      doc.text("The Grand Store Vault Archives", sig1X - 25, sig1Y + 8);

      // Right Signatory: Registrar of Escrow Trust
      const sig2X = 215;
      const sig2Y = 157;
      doc.setFont("times", "italic");
      doc.setFontSize(13);
      doc.setTextColor(35, 35, 35);
      doc.text("Eleanor St. Claire", sig2X, sig2Y - 3);

      doc.setDrawColor(185, 150, 80);
      doc.setLineWidth(0.6);
      doc.line(sig2X - 25, sig2Y, sig2X + 48, sig2Y);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(175, 130, 45);
      doc.text("CHIEF REGISTRAR & ESCROW TRUSTEE", sig2X - 25, sig2Y + 4.2);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.8);
      doc.setTextColor(115, 105, 90);
      doc.text("South African CPA Section 45 Division", sig2X - 25, sig2Y + 8);

      // --- 12. BOTTOM LEGAL FOOTNOTE & CRYPTOGRAPHIC VERIFICATION ---
      doc.setFont("times", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(135, 125, 110);
      doc.text(
        "This certificate constitutes an immutable instrument of provenance and ownership issued under the corporate authority of The Grand Store (Pty) Ltd.",
        centerX,
        181,
        { align: "center" }
      );
      doc.text(
        "Recorded pursuant to Section 45 of the South African Consumer Protection Act 68 of 2008. All archive records are sealed in the Grand Store Vault Ledger.",
        centerX,
        185,
        { align: "center" }
      );

      doc.setFont("courier", "normal");
      doc.setFontSize(6);
      doc.text(
        `Digital Vault Hash: ${authCode}  •  Issued: ${new Date().toISOString()}  •  grandstoreglobal.com`,
        centerX,
        189,
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
