/**
 * Calendar Utilities for Grand Store Luxury Auctions & Events
 * Supports Google Calendar web links and universal .ics downloads (Apple Calendar, Outlook, Phone Cal)
 */

function formatIcsDate(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Format date for Google Calendar URL (YYYYMMDDTHHmmssZ)
 */
function formatGoogleCalDate(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Build rich multi-line minute details for an auction lot calendar event
 */
export function buildAuctionCalendarDetails(lot, options = {}) {
  const { isSettled = false, orderRef = '' } = options;
  const lotNum = lot.lotNumber || lot._id?.slice(-6)?.toUpperCase() || 'N/A';
  const regRef = lot.gsReference || orderRef || 'GS-26-AUC-VAULT';
  const hammerPrice = lot.winningBid ? `R${Number(lot.winningBid).toLocaleString('en-ZA')}` : 'Pending';
  const totalPaid = lot.totalPaidByBuyer ? `R${Number(lot.totalPaidByBuyer).toLocaleString('en-ZA')}` : hammerPrice;
  const buyerPrem = lot.buyerPremiumAmount ? `R${Number(lot.buyerPremiumAmount).toLocaleString('en-ZA')}` : 'R0';
  const barCharge = lot.barChargeAmount ? `R${Number(lot.barChargeAmount).toLocaleString('en-ZA')}` : 'R0';
  const vat = lot.vatAmount ? `R${Number(lot.vatAmount).toLocaleString('en-ZA')} (${lot.vatPct || 15}%)` : 'R0';
  const shipping = lot.shippingCost ? `R${Number(lot.shippingCost).toLocaleString('en-ZA')}` : 'Included / Handover';

  const specs = [];
  if (lot.distillery) specs.push(`• Distillery: ${lot.distillery}`);
  if (lot.expression) specs.push(`• Expression: ${lot.expression}`);
  if (lot.vintage) specs.push(`• Vintage: ${lot.vintage}`);
  if (lot.bottlingYear) specs.push(`• Bottling Year: ${lot.bottlingYear}`);
  if (lot.ageStatement) specs.push(`• Age Statement: ${lot.ageStatement}`);
  if (lot.bottleNumber) specs.push(`• Bottle Number: ${lot.bottleNumber}`);
  if (lot.caskNumber) specs.push(`• Cask Number: ${lot.caskNumber}`);
  if (lot.abv) specs.push(`• ABV: ${lot.abv}%`);
  if (lot.bottleSizeMl) specs.push(`• Volume: ${lot.bottleSizeMl}ml`);
  if (lot.boxCondition) specs.push(`• Box / Case: ${lot.boxCondition}`);
  if (lot.sealCondition) specs.push(`• Seal Integrity: ${lot.sealCondition}`);

  const lines = [
    `👑 GRAND STORE LUXURY AUCTION - OFFICIAL VAULT SCHEDULE`,
    `==================================================`,
    `Lot Title: ${lot.title}`,
    `Registry Ref: ${regRef}`,
    `Lot Number: #${lotNum}`,
    `Category: ${lot.category || 'Fine Spirits & Wine'}`,
    `Status: ${isSettled ? 'Acquisition Settled • Vault Handover Scheduled' : 'Auction Won • Pending Settlement'}`,
    ``,
    `FINANCIAL BREAKDOWN:`,
    `--------------------------------------------------`,
    `• Winning Hammer Bid: ${hammerPrice}`,
    `• Buyer's Premium: ${buyerPrem}`,
    `• B.A.R. Vault Surcharge: ${barCharge}`,
    `• Value Added Tax (VAT): ${vat}`,
    `• White-Glove Courier / Security: ${shipping}`,
    `• Total Settled Acquisition: ${totalPaid}`,
    ``,
    `VAULT CUSTODY & REGULATORY COMPLIANCE:`,
    `--------------------------------------------------`,
    `• Legal Compliance: CPA Section 45 Escrow Protection`,
    `• Trust Account Custody: Dedicated Escrow Trust Account`,
    `• Authenticated Verification: Grand Store Specialist Liquid & Seal Audit Completed`,
    `• Current Custody Location: ${lot.custodyLocation || 'Grand Store High-Security Vault, Cape Town'}`,
    ``,
    ...(specs.length > 0 ? [`PIECE SPECIFICATIONS:`, `--------------------------------------------------`, ...specs, ``] : []),
    `DIRECT VAULT ACCESS:`,
    `--------------------------------------------------`,
    `• View Digital Certificate: https://grandstore.yogapranafitness.com/auction/${lot._id}`,
    `• Order & Logistics Hub: https://grandstore.yogapranafitness.com/customer/orders`,
    `• Grand Store Private Concierge: +27 (0) 21 000 0000 | concierge@grandstore.com`,
    `• Hours: 08:00 - 18:00 SAST (Monday - Saturday)`
  ];

  return lines.join('\n');
}

/**
 * Generate Google Calendar URL
 */
export function createGoogleCalendarUrl({ title, description, location, startTime, endTime }) {
  const start = formatGoogleCalDate(startTime);
  const end = formatGoogleCalDate(endTime || new Date(new Date(startTime).getTime() + 60 * 60 * 1000));
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title || 'Grand Store Auction Event',
    dates: `${start}/${end}`,
    details: description || '',
    location: location || 'Grand Store Vault, Cape Town'
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Download universal .ics calendar file
 */
export function downloadIcsFile({ filename = 'grand-store-event.ics', title, description, location, startTime, endTime, reminderMinutes = 30 }) {
  const start = formatIcsDate(startTime);
  const end = formatIcsDate(endTime || new Date(new Date(startTime).getTime() + 60 * 60 * 1000));
  const now = formatIcsDate(new Date());

  // Escape special characters in description for iCalendar RFC 5545
  const cleanDescription = (description || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');

  const cleanTitle = (title || 'Grand Store Event').replace(/[,;\\]/g, ' ');
  const cleanLocation = (location || 'Grand Store Vault, Cape Town').replace(/[,;\\]/g, ' ');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Grand Store//Luxury Auction Vault System//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:GS-CAL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@grandstore.com`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanDescription}`,
    `LOCATION:${cleanLocation}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${cleanTitle} Reminder`,
    `TRIGGER:-PT${reminderMinutes}M`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
