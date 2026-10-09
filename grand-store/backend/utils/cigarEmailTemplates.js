const CIGAR_SITE_URL = (process.env.CIGAR_SITE_URL || 'https://cigarconnoisseurclub.com').replace(/\/$/, '');
const CIGAR_LOGO_URL = process.env.CIGAR_LOGO_URL || `${CIGAR_SITE_URL}/images/cigar-connoisseur-logo.png`;

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const absoluteCigarUrl = (value) => {
  const url = String(value || '').trim();
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${CIGAR_SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const detailRow = (label, value) => value ? `
  <tr>
    <td style="padding:8px 12px;color:#9f9588;font-size:12px;text-transform:uppercase;letter-spacing:1px;vertical-align:top;">${escapeHtml(label)}</td>
    <td style="padding:8px 12px;color:#f2ece3;font-size:14px;text-align:right;">${escapeHtml(value)}</td>
  </tr>` : '';

const cigarShell = (previewText, content) => `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(previewText)}</title></head>
<body style="margin:0;padding:0;background:#100c09;color:#eee7dc;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(previewText)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#100c09;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#17110d;border:1px solid #4c3825;box-shadow:0 24px 60px rgba(0,0,0,.35);">
        <tr><td style="height:4px;background:#bd925d;"></td></tr>
        <tr><td align="center" style="padding:34px 24px 28px;border-bottom:1px solid #35271c;">
          <img src="${CIGAR_LOGO_URL}" width="190" alt="Mcigar — Cigar Connoisseur Club" style="display:block;width:190px;max-width:80%;height:auto;margin:0 auto 12px;">
          <div style="color:#bd925d;font-size:10px;font-weight:bold;letter-spacing:3px;text-transform:uppercase;">Private cigar concierge</div>
        </td></tr>
        <tr><td style="padding:38px 34px;">${content}</td></tr>
        <tr><td style="padding:24px 30px;background:#0d0a08;border-top:1px solid #35271c;text-align:center;color:#81776d;font-size:11px;line-height:1.7;">
          <div style="margin-bottom:7px;color:#b99668;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Mcigar · Cigar Connoisseur Club</div>
          Personal assistance for considered cigar selections.<br>
          <a href="${CIGAR_SITE_URL}" style="color:#bd925d;text-decoration:none;">Visit Mcigar</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const cigarEnquiryAcknowledgementTemplate = (enquiry) => {
  const imageUrl = absoluteCigarUrl(enquiry.product?.image);
  return cigarShell(`We have received your enquiry about ${enquiry.product?.name}.`, `
    <div style="color:#bd925d;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Enquiry received · ${escapeHtml(enquiry.reference)}</div>
    <h1 style="margin:15px 0 18px;color:#f4ede3;font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:normal;line-height:1.15;">Thank you for contacting Mcigar.</h1>
    <p style="margin:0;color:#c9c0b5;font-size:15px;line-height:1.8;">Dear ${escapeHtml(enquiry.customerName)},</p>
    <p style="color:#c9c0b5;font-size:15px;line-height:1.8;">Your product enquiry has reached our cigar concierge team. We will review availability and the details below, then respond personally using your preferred contact method.</p>
    ${imageUrl ? `<div style="margin:25px 0;text-align:center;background:#0f0c09;border:1px solid #35271c;padding:18px;"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(enquiry.product?.name)}" width="190" style="display:block;width:190px;max-width:100%;height:auto;margin:auto;object-fit:contain;"></div>` : ''}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;background:#110d0a;border:1px solid #3f2f21;">
      ${detailRow('Cigar', enquiry.product?.name)}
      ${detailRow('Brand', enquiry.product?.brand)}
      ${detailRow('SKU', enquiry.product?.sku)}
      ${detailRow('Quantity', enquiry.quantity)}
      ${detailRow('Preferred contact', enquiry.preferredContact)}
      ${detailRow('Reference', enquiry.reference)}
    </table>
    <p style="margin:24px 0 0;color:#9f9588;font-size:13px;line-height:1.7;">Please keep reference <strong style="color:#d0ad7d;">${escapeHtml(enquiry.reference)}</strong> for any follow-up. There is no need to submit the enquiry again—our team will reach out as soon as possible.</p>
  `);
};

const cigarEnquiryReplyTemplate = (enquiry, reply) => cigarShell(`A reply from Mcigar regarding ${enquiry.product?.name}.`, `
  <div style="color:#bd925d;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">A personal response · ${escapeHtml(enquiry.reference)}</div>
  <h1 style="margin:15px 0 18px;color:#f4ede3;font-family:Georgia,'Times New Roman',serif;font-size:34px;font-weight:normal;line-height:1.15;">${escapeHtml(reply.subject)}</h1>
  <p style="margin:0 0 18px;color:#c9c0b5;font-size:15px;line-height:1.8;">Dear ${escapeHtml(enquiry.customerName)},</p>
  <div style="color:#d7cec3;font-size:15px;line-height:1.85;white-space:normal;">${escapeHtml(reply.message).replace(/\r?\n/g, '<br>')}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:28px 0 20px;background:#110d0a;border:1px solid #3f2f21;">
    ${detailRow('Enquiry', enquiry.product?.name)}
    ${detailRow('Quantity', enquiry.quantity)}
    ${detailRow('Reference', enquiry.reference)}
  </table>
  <p style="margin:0;color:#9f9588;font-size:13px;line-height:1.7;">Simply reply to this email if you would like to continue the conversation with our concierge team.</p>
`);

module.exports = {
  cigarEnquiryAcknowledgementTemplate,
  cigarEnquiryReplyTemplate,
};
