const path = require('node:path');

const EMAIL_LOGO_CID = 'grandstore-logo@grandstoreglobal.com';
const EMAIL_LOGO_PATH = path.join(__dirname, '../assets/grand-store-email-logo.png');

// Unified email header: authentic circular medallion crest on the left, luxury typography on the right
const emailLogoHeader = () => `
  <table role="presentation" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;margin:0 auto;background-color:#050505;border-bottom:2px solid #c9a35b;">
    <tr>
      <td align="center" bgcolor="#050505" style="padding:22px 20px;background-color:#050505;">
        <table border="0" cellpadding="0" cellspacing="0" style="margin:0 auto;text-align:center;">
          <tr>
            <td align="center" valign="middle" style="padding-right:14px;">
              <img src="cid:${EMAIL_LOGO_CID}" alt="The Grand Store" width="52" height="52" style="display:block;width:52px;height:52px;border-radius:50%;border:0;outline:none;" />
            </td>
            <td align="left" valign="middle">
              <span style="font-family:'Times New Roman',Times,serif;font-size:24px;font-weight:bold;color:#f5f5f5;text-transform:uppercase;letter-spacing:4px;display:inline-block;vertical-align:middle;">
                The <span style="color:#c9a35b;">Grand</span> Store
              </span>
            </td>
          </tr>
        </table>
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
