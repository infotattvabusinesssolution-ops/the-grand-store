require('dotenv').config();
const { sendBillingEmail, sendInfoEmail, sendVendorEmail } = require('../utils/emailService');

async function testAllChannels() {
  const recipient = process.argv[2] || process.env.SMTP_USER || 'billing@grandstore.co.za';
  console.log(`\n========================================`);
  console.log(`Testing 3 Email Channels to: ${recipient}`);
  console.log(`========================================\n`);

  // 1. Test Billing Channel
  console.log('1. Testing Billing Channel (Purchases / Invoices)...');
  try {
    const res1 = await sendBillingEmail({
      to: recipient,
      subject: 'Test Order #1001 — Payment Receipt',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #c9a35b;">The Grand Store — Billing Notification</h2>
          <p>This is a test purchase receipt from <strong>billing@grandstore.co.za</strong>.</p>
          <p>Order Reference: <strong>#1001</strong></p>
          <p>Status: Verified</p>
        </div>
      `,
    });
    console.log(`   ✅ Billing email sent successfully! MessageId: ${res1.messageId}\n`);
  } catch (err) {
    console.error(`   ❌ Billing email failed:`, err.message, '\n');
  }

  // 2. Test Info Channel
  console.log('2. Testing Info Channel (Queries / OTP / General)...');
  try {
    const res2 = await sendInfoEmail({
      to: recipient,
      subject: 'Welcome to The Grand Store Concierge — Enquiry Received',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #c9a35b;">The Grand Store — Concierge Enquiry</h2>
          <p>This is a test customer support notification from <strong>info@grandstore.co.za</strong>.</p>
          <p>Thank you for reaching out to our concierge.</p>
        </div>
      `,
    });
    console.log(`   ✅ Info email sent successfully! MessageId: ${res2.messageId}\n`);
  } catch (err) {
    console.error(`   ❌ Info email failed:`, err.message, '\n');
  }

  // 3. Test Vendor Channel
  console.log('3. Testing Vendor Channel (Merchant / Onboarding)...');
  try {
    const res3 = await sendVendorEmail({
      to: recipient,
      subject: 'Vendor Dashboard — Monthly Maintenance Fee Notice',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #c9a35b;">The Grand Store — Vendor Partner Portal</h2>
          <p>This is a test merchant update from <strong>vendor@grandstore.co.za</strong>.</p>
          <p>Your partner account is active.</p>
        </div>
      `,
    });
    console.log(`   ✅ Vendor email sent successfully! MessageId: ${res3.messageId}\n`);
  } catch (err) {
    console.error(`   ❌ Vendor email failed:`, err.message, '\n');
  }

  console.log(`========================================`);
  console.log(`All tests complete! Check inbox of ${recipient}`);
  console.log(`========================================\n`);
}

testAllChannels();
