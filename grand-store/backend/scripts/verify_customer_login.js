const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();

const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { loginUser } = require('../controllers/authController');

// Mock Express req and res
function createMockReqRes(body) {
  const req = {
    body,
    cookies: {},
    headers: {}
  };
  let resStatus = 200;
  let resJson = null;
  let resCookies = {};

  const res = {
    status(code) {
      resStatus = code;
      return res;
    },
    cookie(name, val, opts) {
      resCookies[name] = { val, opts };
      return res;
    },
    json(data) {
      resJson = data;
      return res;
    },
    getStatus: () => resStatus,
    getJson: () => resJson,
    getCookies: () => resCookies
  };

  return { req, res };
}

async function verifyMigrationAndLogin() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('--- 1. DATABASE AUDIT FOR MIGRATED CUSTOMERS ---');

  const legacyCustomers = await User.find({ legacyCustId: { $exists: true } });
  console.log(`Total migrated customers in MongoDB: ${legacyCustomers.length}`);

  let unverifiedEmailCount = 0;
  let unverifiedAgeCount = 0;
  let nonRetailTierCount = 0;
  let missingNameCount = 0;
  let missingCustCodeCount = 0;

  for (const u of legacyCustomers) {
    if (!u.isEmailVerified) unverifiedEmailCount++;
    if (!u.isAgeVerified) unverifiedAgeCount++;
    if (u.customerTier !== 'retail') nonRetailTierCount++;
    if (!u.name) missingNameCount++;
    if (!u.legacyCustCode) missingCustCodeCount++;
  }

  console.log(`Unverified emails: ${unverifiedEmailCount} (must be 0)`);
  console.log(`Unverified age:    ${unverifiedAgeCount} (must be 0)`);
  console.log(`Non-retail tier:   ${nonRetailTierCount} (must be 0)`);
  console.log(`Missing names:     ${missingNameCount} (must be 0)`);
  console.log(`Missing codes:     ${missingCustCodeCount} (must be 0)`);

  console.log('\n--- 2. SAMPLE MIGRATED CUSTOMER RECORD ---');
  const sample = await User.findOne({ legacyCustId: 1 }).lean();
  console.log('Customer ID 1:', {
    _id: sample._id,
    name: sample.name,
    email: sample.email,
    passwordType: sample.password ? (sample.password.startsWith('$2') ? 'bcrypt' : (/^[a-f0-9]{32}$/i.test(sample.password) ? 'md5' : 'other')) : 'none',
    passwordPreview: sample.password ? sample.password.substring(0, 10) + '...' : 'none',
    role: sample.role,
    customerTier: sample.customerTier,
    isEmailVerified: sample.isEmailVerified,
    isAgeVerified: sample.isAgeVerified,
    phone: sample.phone,
    phoneNumber: sample.phoneNumber,
    referralCode: sample.referralCode,
    legacyCustId: sample.legacyCustId,
    legacyCustCode: sample.legacyCustCode,
    legacySource: sample.legacySource,
    createdAt: sample.createdAt
  });

  console.log('\n--- 3. TEST AUTHENTICATION & SILENT BCRYPT UPGRADE ---');
  // Customer 1 in SQL dump:
  // id: 1, email: info@grandstore.co.za, password MD5: 542ba1a00d0de7b8aa0ea41d09f13692
  // Let's find what plain password generates 542ba1a00d0de7b8aa0ea41d09f13692 or test with a known test customer
  // Let's create a temporary migrated-style test user or set a known MD5 to verify end-to-end login flow:
  const testPlainPassword = 'PatronPassword2026!';
  const testMd5Hash = crypto.createHash('md5').update(testPlainPassword).digest('hex');

  // Let's create or update a dedicated test migrated customer account
  const testCustomerEmail = 'patron.test.legacy@grandstore.co.za';
  await User.deleteOne({ email: testCustomerEmail });

  await User.create({
    name: 'Test Legacy Patron',
    email: testCustomerEmail,
    password: testMd5Hash,
    phone: '+27824967256',
    phoneNumber: '+27824967256',
    isEmailVerified: true,
    isAgeVerified: true,
    customerTier: 'retail',
    role: 'customer',
    bidderApprovalStatus: 'unregistered',
    bidderLevel: 'level_1_registered',
    biddingLimit: 0,
    referralCode: 'TESTLEGACY01',
    superCoinsBalance: 0,
    rewardBalance: 0,
    totalReferrals: 0,
    legacyCustId: 99999,
    legacyCustCode: 'TESTLEGACY01',
    legacySource: 'website'
  });

  const beforeLoginUser = await User.findOne({ email: testCustomerEmail });
  console.log(`[Before Login] User password format: ${/^[a-f0-9]{32}$/i.test(beforeLoginUser.password) ? 'MD5 Hex (' + beforeLoginUser.password + ')' : 'Other'}`);

  console.log('\n--- Attempting Login via loginUser Controller ---');
  const { req: req1, res: res1 } = createMockReqRes({
    email: testCustomerEmail,
    password: testPlainPassword
  });

  await loginUser(req1, res1);

  console.log(`Login Response Status: ${res1.getStatus()}`);
  const jsonResponse1 = res1.getJson();
  console.log('Login Response JSON:', {
    _id: jsonResponse1._id,
    name: jsonResponse1.name,
    email: jsonResponse1.email,
    role: jsonResponse1.role,
    customerTier: jsonResponse1.customerTier,
    isAgeVerified: jsonResponse1.isAgeVerified,
    bidderLevel: jsonResponse1.bidderLevel,
    tokenGenerated: Boolean(jsonResponse1.token),
    tokenLength: jsonResponse1.token ? jsonResponse1.token.length : 0,
    referralCode: jsonResponse1.referralCode
  });

  if (res1.getStatus() !== 200) {
    console.error('FAILED: Login returned non-200 status!', jsonResponse1);
  } else {
    console.log('SUCCESS: First login succeeded seamlessly with MD5 password!');
  }

  // Verify password auto-upgraded in MongoDB to bcrypt
  const afterLoginUser = await User.findOne({ email: testCustomerEmail });
  const isBcrypt = afterLoginUser.password.startsWith('$2a$') || afterLoginUser.password.startsWith('$2b$');
  console.log(`[After Login] User password format in MongoDB: ${isBcrypt ? 'Bcrypt Hash (' + afterLoginUser.password.substring(0, 20) + '...)' : 'Not bcrypt: ' + afterLoginUser.password}`);

  console.log('\n--- Attempting Second Login with Upgraded Bcrypt Password ---');
  const { req: req2, res: res2 } = createMockReqRes({
    email: testCustomerEmail,
    password: testPlainPassword
  });

  await loginUser(req2, res2);
  console.log(`Second Login Response Status: ${res2.getStatus()}`);
  if (res2.getStatus() === 200) {
    console.log('SUCCESS: Second login succeeded seamlessly with auto-upgraded bcrypt hash!');
  } else {
    console.error('FAILED: Second login failed!', res2.getJson());
  }

  console.log('\n--- Testing Invalid Password Rejection ---');
  const { req: req3, res: res3 } = createMockReqRes({
    email: testCustomerEmail,
    password: 'WrongPassword123'
  });
  await loginUser(req3, res3);
  console.log(`Invalid Password Status: ${res3.getStatus()} (${res3.getJson()?.message})`);

  // Clean up test patron
  await User.deleteOne({ email: testCustomerEmail });
  console.log('Test patron cleaned up.');

  await mongoose.disconnect();
  console.log('\nAll checks completed.');
}

verifyMigrationAndLogin().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
