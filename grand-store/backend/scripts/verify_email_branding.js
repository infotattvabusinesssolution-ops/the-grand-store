const { prepareEmailBranding, EMAIL_LOGO_CID } = require('../utils/emailBranding');
const emailTemplates = require('../utils/emailTemplates');

console.log('Testing all email templates for branding consistency...');

const mockOrder = {
  _id: '66d0a1b2c3d4e5f6a7b8c9d0',
  invoiceNumber: 'INV-2026-0001',
  user: { name: 'John Doe', email: 'john@example.com', phone: '+27821234567' },
  shippingAddress: { address: '123 Luxury Lane', city: 'Sandton', postalCode: '2196', country: 'South Africa' },
  orderItems: [{ name: 'Macallan 18 Year Double Cask', quantity: 1, price: 5499.00 }],
  subTotal: 5499.00,
  shippingCost: 0,
  totalPrice: 5499.00,
  paymentMethod: 'PayFast / Instant EFT',
  deliveryPreference: 'door'
};

const templatesToTest = [
  { name: 'welcomeEmailTemplate', html: emailTemplates.welcomeEmailTemplate('John Doe') },
  { name: 'verificationEmailTemplate', html: emailTemplates.verificationEmailTemplate('John Doe', 'https://grandstoreglobal.com/verify?token=123') },
  { name: 'passwordResetTemplate', html: emailTemplates.passwordResetTemplate('John Doe', 'https://grandstoreglobal.com/reset?token=123') },
  { name: 'newsletterWelcomeTemplate', html: emailTemplates.newsletterWelcomeTemplate() },
  { name: 'orderConfirmationTemplate', html: emailTemplates.orderConfirmationTemplate(mockOrder) },
  { name: 'bankTransferInstructionsTemplate', html: emailTemplates.bankTransferInstructionsTemplate(mockOrder, { bankName: 'FNB', accountName: 'The Grand Store', accountNumber: '12345', branchCode: '250655' }) },
  { name: 'vendorApprovalTemplate', html: emailTemplates.vendorApprovalTemplate('Highland Distillers') },
  { name: 'vendorMaintenanceFeePaidTemplate', html: emailTemplates.vendorMaintenanceFeePaidTemplate({ vendorName: 'Highland Distillers', amount: 499, invoiceNumber: 'VND-001', periodStart: new Date(), periodEnd: new Date() }) },
  { name: 'giftOrderAdminNotificationTemplate', html: emailTemplates.giftOrderAdminNotificationTemplate({ ...mockOrder, isGift: true, giftRecipientName: 'Jane Doe', giftMessage: 'Happy Anniversary!' }) }
];

let allPassed = true;

for (const t of templatesToTest) {
  const branded = prepareEmailBranding(t.html);

  // 1. Count how many times the logo appears
  const logoMatches = (branded.html.match(new RegExp('cid:' + EMAIL_LOGO_CID, 'g')) || []).length;
  const headerMatches = (branded.html.match(/class=["']header["']/g) || []).length;
  const completeLogoMatches = (branded.html.match(/width=["']360["'] height=["']97["']/g) || []).length;

  if (logoMatches !== 1) {
    console.error(`FAIL: ${t.name} has ${logoMatches} logo occurrences (expected exactly 1)`);
    allPassed = false;
  }
  if (headerMatches !== 1) {
    console.error(`FAIL: ${t.name} has ${headerMatches} header occurrences (expected exactly 1)`);
    allPassed = false;
  }
  if (completeLogoMatches !== 1) {
    console.error(`FAIL: ${t.name} has ${completeLogoMatches} complete original logos (expected exactly 1)`);
    allPassed = false;
  }

  const hasAttachment = branded.attachments.some(a => a.cid === EMAIL_LOGO_CID && a.contentDisposition === 'inline');
  if (!hasAttachment) {
    console.error(`FAIL: ${t.name} is missing inline CID attachment`);
    allPassed = false;
  }
}

// Also test raw unbranded HTML
const rawHtml = '<p>Simple admin notification without template wrapper.</p>';
const brandedRaw = prepareEmailBranding(rawHtml);
const rawLogoMatches = (brandedRaw.html.match(new RegExp('cid:' + EMAIL_LOGO_CID, 'g')) || []).length;
if (rawLogoMatches !== 1) {
  console.error(`FAIL: raw unbranded HTML has ${rawLogoMatches} logo occurrences (expected 1)`);
  allPassed = false;
}

if (allPassed) {
  console.log('ALL TESTS PASSED: Exactly one complete original logo header and its inline CID attachment are present across the sampled templates.');
} else {
  process.exit(1);
}
