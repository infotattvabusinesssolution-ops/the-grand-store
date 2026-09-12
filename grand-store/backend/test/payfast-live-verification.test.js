const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const axios = require('axios');
require('dotenv').config();

const payfastUrlEncode = (value) => encodeURIComponent(String(value))
  .replace(/[!'()*~]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)
  .replace(/%20/g, '+');

const generateSignature = (data, passphrase = null) => {
  let pfOutput = '';
  for (const key in data) {
    if (data.hasOwnProperty(key) && data[key] !== undefined && data[key] !== null && data[key] !== '') {
      pfOutput += `${key}=${payfastUrlEncode(data[key].toString().trim())}&`;
    }
  }
  let getString = pfOutput.slice(0, -1);
  if (passphrase) {
    getString += `&passphrase=${payfastUrlEncode(passphrase.trim())}`;
  }
  return crypto.createHash('md5').update(getString).digest('hex');
};

test('1. Environment Configuration: Production Credentials Check', () => {
  assert.equal(process.env.PAYFAST_IS_LIVE, 'true', 'PAYFAST_IS_LIVE must be "true"');
  assert.equal(process.env.PAYFAST_LIVE_MERCHANT_ID, '16418805', 'Live Merchant ID must match client merchant account');
  assert.equal(process.env.PAYFAST_LIVE_MERCHANT_KEY, 'bztmsqgf9ecrv', 'Live Merchant Key must match client merchant account');
  assert.ok(process.env.PAYFAST_LIVE_PASSPHRASE && process.env.PAYFAST_LIVE_PASSPHRASE.length > 5, 'Live Passphrase must be set');
  assert.equal(process.env.BACKEND_URL, 'https://api.grandstoreglobal.com', 'BACKEND_URL must point to production API domain');
  assert.equal(process.env.FRONTEND_URL, 'https://grandstoreglobal.com', 'FRONTEND_URL must point to production store domain');
});

test('2. Signature Generation: Strict RFC 1738 Compliance', () => {
  const sampleData = {
    merchant_id: '16418805',
    merchant_key: 'bztmsqgf9ecrv',
    return_url: 'https://grandstoreglobal.com/order-success?ref=123',
    cancel_url: 'https://grandstoreglobal.com/cart',
    notify_url: 'https://api.grandstoreglobal.com/api/payfast/itn',
    name_first: "O'Connor & Sons",
    item_name: 'Reserve Vintage Wine (2018)',
    amount: '1250.00'
  };

  const sig = generateSignature(sampleData, 'Grand0843001074');
  assert.equal(typeof sig, 'string');
  assert.equal(sig.length, 32, 'MD5 signature must be a 32-character hexadecimal string');

  // Verify that spaces are converted to +, and special characters are percent-encoded
  const encodedName = payfastUrlEncode("O'Connor & Sons");
  assert.equal(encodedName, 'O%27Connor+%26+Sons');
});

test('3. Live PayFast Production Gateway Handshake', async () => {
  const testPayload = {
    merchant_id: process.env.PAYFAST_LIVE_MERCHANT_ID,
    merchant_key: process.env.PAYFAST_LIVE_MERCHANT_KEY,
    return_url: `${process.env.FRONTEND_URL}/order-success`,
    cancel_url: `${process.env.FRONTEND_URL}/cart`,
    notify_url: `${process.env.BACKEND_URL}/api/payfast/itn`,
    name_first: 'Verified',
    name_last: 'Shopper',
    email_address: 'live-test@grandstoreglobal.com',
    m_payment_id: `VERIFY-CHECK-${Date.now()}`,
    amount: '5.00',
    item_name: 'Production Gateway Verification R5'
  };

  testPayload.signature = generateSignature(testPayload, process.env.PAYFAST_LIVE_PASSPHRASE);

  const response = await axios.post(
    'https://www.payfast.co.za/eng/process',
    new URLSearchParams(testPayload).toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'GrandStore-PaymentVerifier/1.0'
      },
      maxRedirects: 0,
      validateStatus: (status) => status >= 200 && status < 400
    }
  );

  assert.equal(response.status, 302, 'PayFast live server should accept payload and respond with 302 redirect to checkout session');
  assert.ok(
    response.headers.location && response.headers.location.includes('payment.payfast.io'),
    `Expected redirection location to payment.payfast.io, got: ${response.headers.location}`
  );
});

test('4. Live PayFast Query/Validate Endpoint Reachability', async () => {
  // Directly ping PayFast production validation endpoint
  const valRes = await axios.post(
    'https://www.payfast.co.za/eng/query/validate',
    'test_ping=1',
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      validateStatus: () => true
    }
  );

  assert.equal(valRes.status, 200, 'PayFast query/validate must return HTTP 200');
  assert.equal(valRes.data.trim(), 'INVALID', 'Arbitrary ping should evaluate to INVALID');
});

test('5. Live Production ITN Endpoint Security Validation', async () => {
  // Test public production webhook rejects unauthorized probe
  const probeResponse = await axios.post(
    'https://api.grandstoreglobal.com/api/payfast/itn',
    'm_payment_id=DUMMY-PROBE&payment_status=CANCELLED&signature=invalid',
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      validateStatus: () => true
    }
  );

  assert.equal(probeResponse.status, 400, 'Live ITN webhook must reject forged signature');
  assert.ok(probeResponse.data.includes('Invalid signature'), 'Error message must reflect signature verification failure');
});
