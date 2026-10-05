const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveChannel } = require('../utils/emailService');

test('resolveChannel routes explicit types', () => {
  assert.equal(resolveChannel({ type: 'billing' }), 'billing');
  assert.equal(resolveChannel({ channel: 'billing' }), 'billing');
  assert.equal(resolveChannel({ type: 'purchase' }), 'billing');
  assert.equal(resolveChannel({ type: 'order' }), 'billing');

  assert.equal(resolveChannel({ type: 'info' }), 'info');
  assert.equal(resolveChannel({ channel: 'info' }), 'info');
  assert.equal(resolveChannel({ type: 'query' }), 'info');
  assert.equal(resolveChannel({ type: 'general' }), 'info');

  assert.equal(resolveChannel({ type: 'vendor' }), 'vendor');
  assert.equal(resolveChannel({ channel: 'vendor' }), 'vendor');
  assert.equal(resolveChannel({ type: 'merchant' }), 'vendor');
});

test('resolveChannel auto-detects billing from subject keywords', () => {
  assert.equal(resolveChannel({ subject: 'Payment Receipt #INV-2026-001' }), 'billing');
  assert.equal(resolveChannel({ subject: 'Order Confirmation #ORD-8492' }), 'billing');
  assert.equal(resolveChannel({ subject: 'Your Tax Invoice' }), 'billing');
  assert.equal(resolveChannel({ subject: 'Bank Transfer Instructions' }), 'billing');
  assert.equal(resolveChannel({ subject: 'Refund Notification: Order #123' }), 'billing');
  assert.equal(resolveChannel({ subject: 'Event Ticket Booking Confirmed' }), 'billing');
});

test('resolveChannel auto-detects vendor from subject keywords', () => {
  assert.equal(resolveChannel({ subject: 'Vendor Dashboard — Monthly Maintenance Fee Notice' }), 'vendor');
  assert.equal(resolveChannel({ subject: 'Your Vendor Free Trial Has Expired' }), 'vendor');
  assert.equal(resolveChannel({ subject: 'Host Application Status Update' }), 'vendor');
  assert.equal(resolveChannel({ subject: 'Action Required: Pay Registration Fee to Activate Store' }), 'vendor');
  assert.equal(resolveChannel({ subject: 'Monthly Settlement Payout Notice' }), 'vendor');
});

test('resolveChannel defaults to info for queries, OTP, and general emails', () => {
  assert.equal(resolveChannel({ subject: 'We received your Mcigar enquiry' }), 'info');
  assert.equal(resolveChannel({ subject: 'Your One-Time Password (OTP)' }), 'info');
  assert.equal(resolveChannel({ subject: 'Reset Your Grand Store Password' }), 'info');
  assert.equal(resolveChannel({ subject: 'Welcome to The Grand Store' }), 'info');
  assert.equal(resolveChannel({ subject: 'Customer Question regarding Cohiba' }), 'info');
});
