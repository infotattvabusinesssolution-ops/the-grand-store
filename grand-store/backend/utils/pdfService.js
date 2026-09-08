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

      if (order.isGift) {
        doc.setFont("helvetica", "bold");
        doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.text("Gift Order:", 14, finalY + 22);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60);
        if (order.giftRecipientName) {
          doc.text(`Recipient: ${order.giftRecipientName}`, 14, finalY + 27);
        }
        if (order.giftMessage) {
          const splitMsg = doc.splitTextToSize(`"${order.giftMessage}"`, 90);
          doc.text(splitMsg, 14, finalY + (order.giftRecipientName ? 32 : 27));
        }
      }

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
