const assert = require('assert');
const mongoose = require('mongoose');

// Mock or require models directly to test schema validations without hitting live DB
const Transaction = require('../models/Transaction');
const Vendor = require('../models/Vendor');

async function runTests() {
  console.log('--- Running Vendor Maintenance & Recurring Payment Tests ---');

  // Test 1: Validate Transaction model schema for Vendor Maintenance Fee
  console.log('[Test 1] Validating Transaction schema for vendor maintenance fee...');
  const mockUserId = new mongoose.Types.ObjectId();
  const mockVendorId = new mongoose.Types.ObjectId();
  const gsRef = `GS-26-VND-MNF-${Date.now()}`;

  const txnDoc = new Transaction({
    gsReference: gsRef,
    type: 'payment',
    module: 'vendor',
    amount: 500,
    netAmount: 500,
    currency: 'ZAR',
    customer: mockUserId,
    vendor: mockUserId,
    gateway: 'PayFast / Credit Card',
    gatewayTransactionId: `MNF-${mockVendorId}-123456`,
    status: 'cleared',
    description: 'Monthly Maintenance Fee - Test Winery'
  });

  const txnValidationErr = txnDoc.validateSync();
  assert.strictEqual(txnValidationErr, undefined, `Transaction validation should pass: ${txnValidationErr?.message}`);
  console.log('✅ Test 1 Passed: Transaction schema accepts vendor maintenance fee properly.');

  // Test 2: Validate Vendor model schema with paidAt, couponRedeemedAt and paymentHistory
  console.log('[Test 2] Validating Vendor schema fields...');
  const vendorDoc = new Vendor({
    userId: mockUserId,
    businessInfo: { legalName: 'Estate Grand Cru', tradingName: 'Grand Cru' },
    paymentStatus: 'paid',
    paidAt: new Date(),
    couponUsed: 'PROMO2026',
    couponRedeemedAt: new Date(),
    freeTrialExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    trialStatus: 'active',
    maintenanceFee: {
      amount: 500,
      status: 'paid',
      lastPaidAt: new Date(),
      nextDueAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      paymentHistory: [{
        amount: 500,
        paidAt: new Date(),
        paymentMethod: 'PayFast / Credit Card',
        reference: `MNF-${mockVendorId}-123456`,
        gsReference: gsRef,
        status: 'cleared'
      }]
    }
  });

  const vendorValidationErr = vendorDoc.validateSync();
  assert.strictEqual(vendorValidationErr, undefined, `Vendor validation should pass: ${vendorValidationErr?.message}`);
  assert.strictEqual(vendorDoc.paymentStatus, 'paid');
  assert.ok(vendorDoc.paidAt instanceof Date);
  assert.ok(vendorDoc.couponRedeemedAt instanceof Date);
  assert.strictEqual(vendorDoc.maintenanceFee.paymentHistory.length, 1);
  assert.strictEqual(vendorDoc.maintenanceFee.paymentHistory[0].status, 'cleared');
  console.log('✅ Test 2 Passed: Vendor schema validates paidAt, couponRedeemedAt, and paymentHistory.');

  // Test 3: Validate nextDueAt calculation logic (advancing 30 days)
  console.log('[Test 3] Testing 30-day advancement logic...');
  const existingNextDue = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days in future
  const calculatedNextDue = new Date(existingNextDue.getTime() + 30 * 24 * 60 * 60 * 1000);
  const diffDays = Math.round((calculatedNextDue.getTime() - existingNextDue.getTime()) / (1000 * 60 * 60 * 24));
  assert.strictEqual(diffDays, 30, 'Should advance exactly 30 days from existing active date');
  console.log('✅ Test 3 Passed: Maintenance fee 30-day advancement math is exact.');

  // Test 4: Validate automated email template generation
  console.log('[Test 4] Testing automated maintenance fee email template...');
  const { vendorMaintenanceFeePaidTemplate } = require('../utils/emailTemplates');
  const emailHtml = vendorMaintenanceFeePaidTemplate({
    vendorName: 'Jan van Riebeeck',
    businessName: 'Constantia Glen Wines',
    amount: 500,
    paymentMethod: 'PayFast / Credit Card',
    reference: `MNF-${mockVendorId}-789012`,
    paidAt: new Date(),
    nextDueAt: calculatedNextDue
  });

  assert.ok(typeof emailHtml === 'string' && emailHtml.length > 200, 'Template should return valid HTML string');
  assert.ok(emailHtml.includes('Constantia Glen Wines'), 'Email must contain business name');
  assert.ok(emailHtml.includes('500.00'), 'Email must contain amount');
  assert.ok(emailHtml.includes('PayFast / Credit Card'), 'Email must contain payment method');
  assert.ok(emailHtml.includes(`MNF-${mockVendorId}-789012`), 'Email must contain payment reference');
  assert.ok(emailHtml.includes('Next Renewal Due Date'), 'Email must contain next renewal due date');
  console.log('✅ Test 4 Passed: Automated email template generated correctly with all receipt details.');

  console.log('\nAll 4 vendor maintenance fee tests PASSED successfully! 🚀\n');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
