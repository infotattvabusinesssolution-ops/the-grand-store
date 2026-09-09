const path = require('node:path');

const EMAIL_LOGO_CID = 'grandstore-logo@grandstoreglobal.com';
const EMAIL_LOGO_PATH = path.join(__dirname, '../assets/grand-store-email-logo.png');

// Keep the complete supplied brand artwork together, with inline styles for email clients.
const emailLogoHeader = () => `
  <table role="presentation" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;margin:0 auto;background-color:#050505;border-bottom:2px solid #c9a35b;">
    <tr>
      <td align="center" bgcolor="#050505" style="padding:24px 20px;background-color:#050505;">
        <img src="cid:${EMAIL_LOGO_CID}" alt="The Grand Store - Crafting Moments, Raising Spirits" width="360" height="97" style="display:block;width:360px;max-width:100%;height:auto;margin:0 auto;border:0;outline:none;text-decoration:none;" />
      </td>
    </tr>
  </table>`;

const prepareEmailBranding = (html, attachments = []) => {
  if (typeof html !== 'string' || !html.trim()) return { html, attachments };

  // Shared templates already have this header; custom HTML gets the same branding.
  const logoReference = `cid:${EMAIL_LOGO_CID}`;
  let brandedHtml = html;
  if (!html.includes(logoReference)) {
    const bodyTag = /<body\b[^>]*>/i;
    brandedHtml = bodyTag.test(html)
      ? html.replace(bodyTag, (tag) => `${tag}${emailLogoHeader()}`)
      : `${emailLogoHeader()}\n${html}`;
  }

  return {
    html: brandedHtml,
    attachments: [
      ...(attachments || []).filter((attachment) => attachment.cid !== EMAIL_LOGO_CID),
      {
        filename: 'grand-store-logo.png',
        path: EMAIL_LOGO_PATH,
        cid: EMAIL_LOGO_CID,
        contentType: 'image/png',
        contentDisposition: 'inline',
      },
    ],
  };
};

module.exports = { EMAIL_LOGO_CID, EMAIL_LOGO_PATH, emailLogoHeader, prepareEmailBranding };
