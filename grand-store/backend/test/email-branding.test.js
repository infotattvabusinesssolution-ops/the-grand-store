const assert = require('node:assert/strict');
const fs = require('node:fs');
const { test } = require('node:test');
const nodemailer = require('nodemailer');
const templates = require('../utils/emailTemplates');
const { EMAIL_LOGO_CID, EMAIL_LOGO_PATH, prepareEmailBranding } = require('../utils/emailBranding');

const order = { _id: 'order123', orderId: 'GS-123', totalPrice: 150, orderItems: [], shippingAddress: {}, guestInfo: { name: 'Alex' } };
const event = { _id: 'event123', title: 'Tasting evening', date: '2026-10-01', time: '18:00', location: 'Cape Town' };
const booking = { _id: 'booking123', ticketId: 'TICKET-123', totalPrice: 150, quantity: 1 };
const samples = [
  ['generateEmailTemplate', ['A message', '<p>Email content</p>']],
  ['welcomeEmailTemplate', ['Alex']],
  ['verificationEmailTemplate', ['Alex', 'https://example.invalid/verify']],
  ['passwordResetTemplate', ['Alex', 'https://example.invalid/reset']],
  ['newsletterWelcomeTemplate', []],
  ['orderConfirmationTemplate', [order]],
  ['bankTransferInstructionsTemplate', [order, {}]],
  ['eventBankTransferInstructionsTemplate', [booking, event, {}]],
  ['vendorApprovalTemplate', ['Alex', 100]],
  ['vendorMaintenanceFeePaidTemplate', [{ vendorName: 'Alex', amount: 100, invoiceNumber: 'VND-1', periodStart: new Date('2026-10-01'), periodEnd: new Date('2026-10-31') }]],
  ['hostApplicationApprovalTemplate', ['Alex', 'alex@example.invalid', 'sample-password', 'auction']],
  ['hostApplicationRejectionTemplate', ['Alex', 'auction', 'Sample reason']],
  ['eventReminderTemplate', ['Alex', event.title, event.date, event.time, event.location]],
  ['auctionReminderTemplate', ['Alex', 'Rare finds', event.date, 'LOT-1']],
  ['auctionWinTemplate', ['Alex', 'Rare finds', 'LOT-1', 150, 'https://example.invalid/checkout']],
  ['bulkNewsletterTemplate', ['Collection update', '<p>New arrivals</p>']],
  ['genericNotificationTemplate', ['Order update', 'Ready for delivery']],
  ['birthdayCelebrationEmailTemplate', [{ name: 'Alex' }]],
  ['eventTicketConfirmationTemplate', [{ booking, event, user: { name: 'Alex' }, qrCodeCid: 'cid:ticketqrcode' }]],
  ['adminOrderMessageEmailTemplate', [{ orderReference: 'GS-123', customerName: 'Alex', message: 'Ready for delivery' }]],
  ['giftOrderAdminNotificationTemplate', [order]],
];

test('every shared email template contains exactly one complete original logo before its content', () => {
  assert.deepEqual(samples.map(([name]) => name).sort(), Object.keys(templates).sort());
  const logo = fs.readFileSync(EMAIL_LOGO_PATH);
  assert.ok(logo.readUInt32BE(16) > 3 * logo.readUInt32BE(20), 'use the complete horizontal artwork');
  for (const [name, args] of samples) {
    const html = templates[name](...args);
    const prepared = prepareEmailBranding(html);
    assert.equal(prepared.html, html, `${name}: header must not be duplicated`);
    assert.equal(html.split(`cid:${EMAIL_LOGO_CID}`).length - 1, 1, name);
    assert.ok(html.indexOf(`cid:${EMAIL_LOGO_CID}`) < html.indexOf('<div class="content">'), name);
    assert.ok(html.includes('width="360" height="97"'), name);
    assert.ok(!html.includes('grandstore-emblem.png'), name);
    assert.equal(prepared.attachments.length, 1, name);
  }
});

test('custom HTML fragments and full documents keep their content and gain one header', () => {
  const content = '<div class="email-container"><p>Custom update</p><img src="https://example.invalid/logo.png"></div>';
  const fragment = prepareEmailBranding(content);
  assert.ok(fragment.html.endsWith(content), 'unrelated images and content stay unchanged');
  assert.ok(fragment.html.indexOf(`cid:${EMAIL_LOGO_CID}`) < fragment.html.indexOf(content));
  const document = `<!DOCTYPE html><html><head><title>Update</title></head><body class="notice">${content}</body></html>`;
  const prepared = prepareEmailBranding(document);
  assert.ok(prepared.html.startsWith('<!DOCTYPE html>'));
  assert.ok(prepared.html.indexOf('<body class="notice">') < prepared.html.indexOf(`cid:${EMAIL_LOGO_CID}`));
  assert.ok(prepared.html.endsWith(`${content}</body></html>`));
  assert.deepEqual(prepareEmailBranding(prepared.html, prepared.attachments), prepared);
});

test('PDF and ticket QR attachments survive without mutating the caller or duplicating the logo', () => {
  const pdf = { filename: 'invoice.pdf', content: Buffer.from('%PDF-1.4\nSample invoice') };
  const qr = { filename: 'ticket-qr.png', content: Buffer.from('Sample QR'), cid: 'ticketqrcode' };
  const attachments = Object.freeze([pdf, qr]);
  const prepared = prepareEmailBranding('<p>Your ticket</p><img src="cid:ticketqrcode">', attachments);
  assert.equal(prepared.attachments[0], pdf);
  assert.equal(prepared.attachments[1], qr);
  assert.equal(attachments.length, 2);
  assert.equal(prepared.attachments[2].cid, EMAIL_LOGO_CID);
  assert.equal(prepared.attachments[2].contentDisposition, 'inline');
  assert.equal(prepareEmailBranding(prepared.html, prepared.attachments).attachments.length, 3);
});

test('text-only and separate Mcigar emails retain their existing format', () => {
  assert.deepEqual(prepareEmailBranding(undefined), { html: undefined, attachments: [] });
  const html = '<p>Private cigar concierge</p><img src="https://example.invalid/cigar-connoisseur-logo.png">';
  assert.deepEqual(prepareEmailBranding(html), { html, attachments: [] });
  const grandStoreEmail = templates.genericNotificationTemplate('Your order', 'Your Mcigar product is ready.');
  assert.equal(prepareEmailBranding(grandStoreEmail).attachments[0].cid, EMAIL_LOGO_CID);
});

test('real Nodemailer output embeds the logo alongside the QR and PDF without sending an email', async (t) => {
  const localTransport = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: 'unix' });
  t.mock.method(nodemailer, 'createTransport', () => localTransport);
  t.mock.method(console, 'log', () => {});
  const servicePath = require.resolve('../utils/emailService');
  delete require.cache[servicePath];
  t.after(() => { delete require.cache[servicePath]; });
  const { sendEmail } = require(servicePath);
  const info = await sendEmail({
    to: 'preview@example.invalid', subject: 'Grand Store logo preview',
    html: templates.eventTicketConfirmationTemplate({ booking, event, user: { name: 'Alex' }, qrCodeCid: 'cid:ticketqrcode' }),
    text: 'Your ticket and invoice.',
    attachments: [
      { filename: 'ticket-qr.png', content: Buffer.from('Sample QR'), contentType: 'image/png', cid: 'ticketqrcode' },
      { filename: 'invoice.pdf', content: Buffer.from('%PDF-1.4\nSample invoice'), contentType: 'application/pdf' },
    ],
  });
  const mime = info.message.toString();
  assert.ok(mime.includes('multipart/related'));
  assert.equal(mime.split(`Content-ID: <${EMAIL_LOGO_CID}>`).length - 1, 1);
  assert.ok(mime.includes(`cid:${EMAIL_LOGO_CID}`));
  assert.ok(mime.includes('Content-Disposition: inline; filename=grand-store-logo.png'));
  assert.ok(mime.includes('Content-ID: <ticketqrcode>'));
  assert.ok(mime.includes('Content-Type: application/pdf; name=invoice.pdf'));
  assert.ok(mime.includes(fs.readFileSync(EMAIL_LOGO_PATH).toString('base64').slice(0, 76)));
  assert.ok(mime.includes('Your ticket and invoice.'));
});
