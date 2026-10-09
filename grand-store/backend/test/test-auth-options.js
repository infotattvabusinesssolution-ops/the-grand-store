const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config();

const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4']); } catch (e) {}

const mongoose = require('mongoose');
const User = require('../models/User');
const { 
  sendOtp, 
  verifyOtp, 
  sendMagicLink, 
  verifyMagicLink, 
  appleAuth 
} = require('../controllers/authController');

// Mock Express req/res
const createMockRes = () => {
  const res = {
    statusCode: 200,
    headers: {},
    cookies: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    cookie(name, val, opts) {
      this.cookies[name] = { val, opts };
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
};

async function runTests() {
  console.log('=== RUNNING AUTH OPTIONS TEST SUITE ===\n');
  let passed = 0;
  let failed = 0;

  // Connect to Mongo
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri);
      console.log('Connected to MongoDB successfully');
    } catch (err) {
      console.warn('MongoDB connection error:', err.message);
    }
  }

  // --- TEST 1: Send SMS OTP to SA mobile number ---
  try {
    const req = { body: { phone: '0821234567' } };
    const res = createMockRes();
    await sendOtp(req, res);

    if (res.statusCode === 200 && res.body.phone === '+27821234567' && res.body.devOtp) {
      console.log('✅ TEST 1 PASSED: SMS OTP successfully generated and normalized for SA (+27821234567). Dev OTP:', res.body.devOtp);
      passed++;
    } else {
      throw new Error(`Unexpected response: ${JSON.stringify(res.body)}`);
    }
  } catch (err) {
    console.error('❌ TEST 1 FAILED:', err.message);
    failed++;
  }

  // --- TEST 2: Verify SMS OTP and auto-authenticate customer ---
  try {
    const testPhone = '+27829998877';
    // First send OTP
    const sendReq = { body: { phone: testPhone } };
    const sendRes = createMockRes();
    await sendOtp(sendReq, sendRes);
    const otp = sendRes.body.devOtp;

    // Now verify
    const verifyReq = {
      body: {
        phone: testPhone,
        otp: otp,
        name: 'Test Patron',
        dateOfBirth: '1995-05-15',
        isAgeVerified: true
      }
    };
    const verifyRes = createMockRes();
    await verifyOtp(verifyReq, verifyRes);

    if (verifyRes.statusCode === 200 && verifyRes.body.token && verifyRes.body.customerTier === 'retail' && verifyRes.body.isAgeVerified === true) {
      console.log('✅ TEST 2 PASSED: SMS OTP verified, user authenticated with token, retail tier & verified age status.');
      passed++;
    } else {
      throw new Error(`Unexpected verify response: ${JSON.stringify(verifyRes.body)}`);
    }
  } catch (err) {
    console.error('❌ TEST 2 FAILED:', err.message);
    failed++;
  }

  // --- TEST 3: Email Magic Link Generation & Verification ---
  try {
    const testEmail = `magic_test_${Date.now()}@grandstore.co.za`;
    const magicReq = { body: { email: testEmail } };
    const magicRes = createMockRes();
    await sendMagicLink(magicReq, magicRes);

    if (magicRes.statusCode !== 200 || !magicRes.body.devToken) {
      throw new Error(`Magic link send failed: ${JSON.stringify(magicRes.body)}`);
    }
    const token = magicRes.body.devToken;

    // Verify magic link
    const verifyMagicReq = { body: { token, email: testEmail } };
    const verifyMagicRes = createMockRes();
    await verifyMagicLink(verifyMagicReq, verifyMagicRes);

    if (verifyMagicRes.statusCode === 200 && verifyMagicRes.body.token && verifyMagicRes.body.email === testEmail) {
      console.log('✅ TEST 3 PASSED: Email Magic Link successfully dispatched and verified with passwordless JWT session.');
      passed++;
    } else {
      throw new Error(`Magic link verify failed: ${JSON.stringify(verifyMagicRes.body)}`);
    }
  } catch (err) {
    console.error('❌ TEST 3 FAILED:', err.message);
    failed++;
  }

  // --- TEST 4: Apple Sign-In Endpoint ---
  try {
    const testAppleId = `apple_sub_${Date.now()}`;
    const testAppleEmail = `apple_${Date.now()}@privaterelay.appleid.com`;
    const appleReq = {
      body: {
        appleId: testAppleId,
        email: testAppleEmail,
        name: 'Apple Patron'
      }
    };
    const appleRes = createMockRes();
    await appleAuth(appleReq, appleRes);

    if (appleRes.statusCode === 200 && appleRes.body.token && appleRes.body.email === testAppleEmail) {
      console.log('✅ TEST 4 PASSED: Apple Sign-In authenticated user, issued session token, and linked account.');
      passed++;
    } else {
      throw new Error(`Apple auth failed: ${JSON.stringify(appleRes.body)}`);
    }
  } catch (err) {
    console.error('❌ TEST 4 FAILED:', err.message);
    failed++;
  }

  // --- TEST 5: Verify NO Facebook and NO WhatsApp routes/channels are active ---
  try {
    const authRoutes = require('../routes/authRoutes');
    const routePaths = authRoutes.stack.map(r => r.route?.path).filter(Boolean);
    const hasFacebook = routePaths.some(p => p.includes('facebook'));
    const hasWhatsAppRoute = routePaths.some(p => p.includes('whatsapp'));

    if (!hasFacebook && !hasWhatsAppRoute) {
      console.log('✅ TEST 5 PASSED: Strict compliance verified - No Facebook and No WhatsApp routes exist.');
      passed++;
    } else {
      throw new Error(`Disallowed routes found! facebook: ${hasFacebook}, whatsapp: ${hasWhatsAppRoute}`);
    }
  } catch (err) {
    console.error('❌ TEST 5 FAILED:', err.message);
    failed++;
  }

  // Automated Cleanup of Test Accounts from Database
  try {
    const User = require('../models/User');
    await User.deleteMany({
      $or: [
        { email: /^magic_test_/i },
        { email: /@privaterelay\.appleid\.com$/i },
      ]
    });
    console.log('🧹 Cleaned up temporary test accounts from database.');
  } catch (cleanErr) {
    console.warn('Test cleanup warning:', cleanErr.message);
  }

  console.log(`\n=== TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
