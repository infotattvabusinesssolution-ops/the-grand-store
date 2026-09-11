const WINE_SITE_URL = (process.env.MILLIONAIRES_SITE_URL || 'https://millionaires.yogapranafitness.com').replace(/\/$/, '');
const WINE_LOGO_URL = process.env.MILLIONAIRES_LOGO_URL || `${WINE_SITE_URL}/assets/footer-bottle.png`;

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

const detailRow = (label, value) => value ? `
  <tr>
    <td style="padding:10px 14px;color:#a8969b;font-size:12px;text-transform:uppercase;letter-spacing:1px;vertical-align:top;border-bottom:1px solid #2d1d23;">${escapeHtml(label)}</td>
    <td style="padding:10px 14px;color:#fdf9f4;font-size:14px;text-align:right;border-bottom:1px solid #2d1d23;">${escapeHtml(value)}</td>
  </tr>` : '';

const wineShell = (previewText, content) => `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(previewText)}</title></head>
<body style="margin:0;padding:0;background:#0d090b;color:#f5ede8;font-family:Georgia,'Times New Roman',serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(previewText)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0d090b;padding:32px 14px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#181215;border:1px solid #4a2b35;box-shadow:0 24px 60px rgba(0,0,0,.45);">
        <tr><td style="height:4px;background:linear-gradient(90deg, #7a263c 0%, #d4af37 50%, #7a263c 100%);"></td></tr>
        <tr><td align="center" style="padding:34px 24px 28px;border-bottom:1px solid #331e26;">
          <div style="font-family:Georgia,serif;font-size:24px;letter-spacing:3px;text-transform:uppercase;color:#f9f3ec;font-weight:normal;">Millionaires Collection</div>
          <div style="color:#d4af37;font-size:10px;font-weight:bold;letter-spacing:4px;text-transform:uppercase;margin-top:6px;font-family:Arial,sans-serif;">Premium Sparkling Wine · Private Concierge</div>
        </td></tr>
        <tr><td style="padding:38px 34px;font-family:Arial,Helvetica,sans-serif;">${content}</td></tr>
        <tr><td style="padding:24px 30px;background:#100b0d;border-top:1px solid #331e26;text-align:center;color:#8f7b81;font-size:11px;line-height:1.7;font-family:Arial,sans-serif;">
          <div style="margin-bottom:7px;color:#d4af37;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Millionaires Collection</div>
          Exceptional 2021 limited edition vintage sparkling wine.<br>
          <a href="${WINE_SITE_URL}" style="color:#d4af37;text-decoration:none;">Visit Millionaires Collection</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const wineEnquiryAcknowledgementTemplate = (enquiry) => {
  return wineShell(`We have received your enquiry — ${enquiry.reference}`, `
    <div style="color:#d4af37;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Enquiry received · ${escapeHtml(enquiry.reference)}</div>
    <h1 style="margin:15px 0 18px;color:#fbf6f0;font-family:Georgia,'Times New Roman',serif;font-size:32px;font-weight:normal;line-height:1.2;">Thank you for your enquiry.</h1>
    <p style="margin:0;color:#d6c8cd;font-size:15px;line-height:1.8;">Dear ${escapeHtml(enquiry.customerName)},</p>
    <p style="color:#d6c8cd;font-size:15px;line-height:1.8;">Your enquiry regarding the Millionaires Collection has been safely received by our private collection team. We review every request individually and will contact you via your preferred communication channel.</p>
    
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;background:#120c0f;border:1px solid #3d232c;">
      ${detailRow('Customer', enquiry.customerName)}
      ${detailRow('Email', enquiry.email)}
      ${detailRow('Phone', enquiry.phone)}
      ${detailRow('Preferred contact', enquiry.preferredContact)}
      ${detailRow('How did you find us', enquiry.referral)}
      ${detailRow('Collection', enquiry.product?.name || 'The 2021 Limited Edition')}
      ${enquiry.message ? detailRow('Occasion / Notes', enquiry.message) : ''}
      ${detailRow('Reference', enquiry.reference)}
    </table>

    <p style="margin:24px 0 0;color:#a8969b;font-size:13px;line-height:1.7;">Please retain your reference number <strong style="color:#d4af37;">${escapeHtml(enquiry.reference)}</strong> for all future correspondence. Our team will reach out to you shortly.</p>
  `);
};

const wineEnquiryReplyTemplate = (enquiry, reply) => wineShell(`A reply from Millionaires Collection regarding ${enquiry.reference}`, `
  <div style="color:#d4af37;font-size:11px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Private concierge response · ${escapeHtml(enquiry.reference)}</div>
  <h1 style="margin:15px 0 18px;color:#fbf6f0;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:normal;line-height:1.2;">${escapeHtml(reply.subject)}</h1>
  <p style="margin:0 0 18px;color:#d6c8cd;font-size:15px;line-height:1.8;">Dear ${escapeHtml(enquiry.customerName)},</p>
  <div style="color:#e8dee2;font-size:15px;line-height:1.85;white-space:normal;">${escapeHtml(reply.message).replace(/\r?\n/g, '<br>')}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:28px 0 20px;background:#120c0f;border:1px solid #3d232c;">
    ${detailRow('Enquiry', enquiry.product?.name || 'Millionaires Collection')}
    ${detailRow('Reference', enquiry.reference)}
  </table>
  <p style="margin:0;color:#a8969b;font-size:13px;line-height:1.7;">Simply reply to this email if you have any questions or wish to continue the conversation with our concierge team.</p>
`);

module.exports = {
  wineEnquiryAcknowledgementTemplate,
  wineEnquiryReplyTemplate,
};
