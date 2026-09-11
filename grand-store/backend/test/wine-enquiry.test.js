const test = require('node:test');
const assert = require('node:assert/strict');
const WineEnquiry = require('../models/WineEnquiry');
const {
  wineEnquiryAcknowledgementTemplate,
  wineEnquiryReplyTemplate,
} = require('../utils/wineEmailTemplates');

test('WineEnquiry model schema validates required fields', () => {
  const enquiry = new WineEnquiry({});
  const error = enquiry.validateSync();
  assert.ok(error);
  assert.ok(error.errors.customerName);
  assert.ok(error.errors.email);
  assert.ok(error.errors.phone);
  assert.ok(error.errors.reference);
});

test('WineEnquiry model defaults are set correctly', () => {
  const enquiry = new WineEnquiry({
    reference: 'MLN-2026-000001',
    customerName: 'Eleanor Vance',
    email: 'eleanor@example.com',
    phone: '+44 7700 900123',
    referral: 'Sommelier recommendation',
  });
  assert.equal(enquiry.status, 'new');
  assert.equal(enquiry.preferredContact, 'email');
  assert.equal(enquiry.quantity, 1);
  assert.equal(enquiry.product.name, 'Millionaires Collection — 2021 Limited Edition');
  assert.equal(enquiry.product.expression, 'The 2021 Limited Edition');
  assert.equal(enquiry.acknowledgement.sent, false);
});

test('wineEnquiryAcknowledgementTemplate generates valid luxury HTML with reference and details', () => {
  const sampleEnquiry = {
    reference: 'MLN-2026-000042',
    customerName: 'Lord Sterling',
    email: 'sterling@mayfair.co.uk',
    phone: '+44 20 7946 0991',
    referral: 'Private club membership',
    message: 'Looking for a private allocation for our autumn celebration.',
    quantity: 12,
    preferredContact: 'phone',
    product: {
      name: 'Millionaires Collection — 2021 Limited Edition',
      expression: 'The Vintage Blanc',
    },
  };

  const html = wineEnquiryAcknowledgementTemplate(sampleEnquiry);
  assert.ok(html.includes('MLN-2026-000042'));
  assert.ok(html.includes('Lord Sterling'));
  assert.ok(html.includes('sterling@mayfair.co.uk'));
  assert.ok(html.includes('Private club membership'));
  assert.ok(html.includes('Millionaires Collection'));
  assert.ok(html.includes('Premium Sparkling Wine'));
});

test('wineEnquiryReplyTemplate generates branded reply with subject, body, and customer attribution', () => {
  const sampleEnquiry = {
    reference: 'MLN-2026-000042',
    customerName: 'Lord Sterling',
    email: 'sterling@mayfair.co.uk',
    product: { name: 'Millionaires Collection — 2021 Limited Edition' },
  };

  const reply = {
    subject: 'Your allocation for the 2021 Vintage Blanc',
    message: 'We are delighted to confirm that 12 bottles have been reserved for your autumn celebration.',
  };

  const html = wineEnquiryReplyTemplate(sampleEnquiry, reply);
  assert.ok(html.includes('MLN-2026-000042'));
  assert.ok(html.includes('Lord Sterling'));
  assert.ok(html.includes('Your allocation for the 2021 Vintage Blanc'));
  assert.ok(html.includes('We are delighted to confirm that 12 bottles have been reserved'));
  assert.ok(html.includes('Millionaires Collection'));
});
