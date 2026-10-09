const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
require('dotenv').config();

const mongoose = require('mongoose');
const fs = require('fs');
const readline = require('readline');
const path = require('path');

// Import the actual User model
const User = require('../models/User');

function parseCustomersFromSql(filePath) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      crlfDelay: Infinity
    });

    const customers = [];
    let inInsert = false;
    let buffer = '';

    rl.on('line', (line) => {
      if (line.startsWith('INSERT INTO `xyz_customers`')) {
        inInsert = true;
        const valuesIndex = line.indexOf('VALUES');
        if (valuesIndex !== -1) {
          buffer = line.slice(valuesIndex + 6);
        } else {
          buffer = '';
        }
      } else if (inInsert) {
        buffer += ' ' + line;
      }

      if (inInsert && line.trim().endsWith(';')) {
        inInsert = false;
        parseBuffer(buffer, customers);
        buffer = '';
      }
    });

    rl.on('close', () => {
      if (buffer) parseBuffer(buffer, customers);
      resolve(customers);
    });

    rl.on('error', reject);
  });
}

function parseBuffer(str, list) {
  let inTuple = false;
  let inString = false;
  let escape = false;
  let curVal = '';
  let tupleVals = [];

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (escape) {
      curVal += char;
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === "'") {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '(') {
        inTuple = true;
        tupleVals = [];
        curVal = '';
        continue;
      } else if (char === ')') {
        if (inTuple) {
          tupleVals.push(curVal.trim());
          inTuple = false;
          curVal = '';
          if (tupleVals.length >= 15) {
            list.push({
              id: tupleVals[0],
              title: tupleVals[1],
              fname: tupleVals[2],
              lname: tupleVals[3],
              email: tupleVals[4],
              phone: tupleVals[5],
              custCode: tupleVals[6],
              referralCode: tupleVals[7],
              password: tupleVals[8],
              created: tupleVals[9],
              updated: tupleVals[10],
              custStatus: tupleVals[11],
              wallet: tupleVals[12],
              comment: tupleVals[13],
              source: tupleVals[14]
            });
          }
        }
        continue;
      } else if (char === ',') {
        if (inTuple) {
          tupleVals.push(curVal.trim());
          curVal = '';
          continue;
        }
      }
    }
    curVal += char;
  }
}

function normalizePhone(rawPhone) {
  if (!rawPhone) return '';
  const digits = String(rawPhone).replace(/\D/g, '');
  if (!digits) return '';

  // South African numbers:
  // e.g. 824967256 (9 digits) -> +27824967256
  // e.g. 0824967256 (10 digits starting with 0) -> +27824967256
  // e.g. 27824967256 (11 digits starting with 27) -> +27824967256
  if (digits.length === 9) {
    return `+27${digits}`;
  } else if (digits.length === 10 && digits.startsWith('0')) {
    return `+27${digits.slice(1)}`;
  } else if (digits.length === 11 && digits.startsWith('27')) {
    return `+${digits}`;
  }
  return `+${digits}`;
}

function formatCustomerName(fname, lname, title) {
  let cleanFname = String(fname || '').trim();
  let cleanLname = String(lname || '').trim();

  let name = `${cleanFname} ${cleanLname}`.trim();
  if (!name) {
    name = 'Valued Patron';
  }
  return name;
}

async function migrateRetailCustomers() {
  const sqlFilePath = 'c:/office/store-new/TheGrandStore/grandsto_codedb (2).sql';
  console.log(`[Migration] Reading and parsing retail customers from: ${sqlFilePath}...`);

  const rawCustomers = await parseCustomersFromSql(sqlFilePath);
  console.log(`[Migration] Total customers found in SQL dump: ${rawCustomers.length}`);

  // Deduplicate emails:
  // alka.thakur2016@gmail.com has ID 535 (real patron) and ID 740 (test data). Prioritize ID 535.
  const emailMap = new Map();
  const filteredCustomers = [];
  let skippedDuplicates = 0;

  for (const c of rawCustomers) {
    const cleanEmail = String(c.email || '').toLowerCase().trim();
    if (emailMap.has(cleanEmail)) {
      console.log(`[Migration] Skipping duplicate email '${cleanEmail}' (ID: ${c.id}, previous ID: ${emailMap.get(cleanEmail)})`);
      skippedDuplicates++;
      continue;
    }
    emailMap.set(cleanEmail, c.id);
    filteredCustomers.push(c);
  }

  console.log(`[Migration] Deduplicated customer count to import: ${filteredCustomers.length} (Skipped duplicates: ${skippedDuplicates})`);

  console.log('[Migration] Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('[Migration] Connected successfully to MongoDB.');

  let insertedCount = 0;
  let updatedExistingCount = 0;
  let errorCount = 0;

  for (const c of filteredCustomers) {
    try {
      const cleanEmail = String(c.email || '').toLowerCase().trim();
      const legacyId = Number(c.id);
      const name = formatCustomerName(c.fname, c.lname, c.title);
      const normalizedPhone = normalizePhone(c.phone);

      // Check if user already exists in MongoDB by email
      const existingUser = await User.findOne({ email: cleanEmail });

      if (existingUser) {
        // User already exists in MongoDB (e.g. dfnokh@gmail.com)
        // Update legacy tracking fields without overwriting role or active password
        let modified = false;
        if (!existingUser.legacyCustId) {
          existingUser.legacyCustId = legacyId;
          modified = true;
        }
        if (!existingUser.legacyCustCode) {
          existingUser.legacyCustCode = c.custCode;
          modified = true;
        }
        if (!existingUser.legacySource) {
          existingUser.legacySource = c.source;
          modified = true;
        }
        // Ensure email & age verification are true so they have no login anomalies
        if (!existingUser.isEmailVerified) {
          existingUser.isEmailVerified = true;
          modified = true;
        }
        if (!existingUser.isAgeVerified) {
          existingUser.isAgeVerified = true;
          modified = true;
        }
        if (normalizedPhone && !existingUser.phone) {
          existingUser.phone = normalizedPhone;
          existingUser.phoneNumber = normalizedPhone;
          modified = true;
        }

        if (modified) {
          await existingUser.save();
        }
        updatedExistingCount++;
      } else {
        // New user creation
        const isMd5 = c.password && /^[a-f0-9]{32}$/i.test(c.password);
        const userPassword = isMd5 ? c.password.toLowerCase() : undefined;

        let createdDate = new Date();
        if (c.created && c.created !== '0000-00-00') {
          const parsedDate = new Date(c.created);
          if (!isNaN(parsedDate.getTime())) {
            createdDate = parsedDate;
          }
        }

        const newUserDoc = {
          name,
          email: cleanEmail,
          password: userPassword,
          phone: normalizedPhone,
          phoneNumber: normalizedPhone,
          isEmailVerified: true, // Prevents email verification block on login
          isAgeVerified: true,   // Grants age-verified access immediately
          customerTier: 'retail',
          role: 'customer',
          bidderApprovalStatus: 'unregistered',
          bidderLevel: 'level_1_registered',
          biddingLimit: 0,
          referralCode: c.custCode, // Unique legacy customer code as referralCode
          superCoinsBalance: 0,
          rewardBalance: 0,
          totalReferrals: 0,
          legacyCustId: legacyId,
          legacyCustCode: c.custCode,
          legacySource: c.source,
          createdAt: createdDate
        };

        await User.create(newUserDoc);
        insertedCount++;
      }
    } catch (err) {
      console.error(`[Migration Error] Failed to import customer ID ${c.id} (${c.email}):`, err.message);
      errorCount++;
    }
  }

  console.log('\n=============================================');
  console.log('--- RETAIL CUSTOMERS MIGRATION SUMMARY ---');
  console.log(`Total parsed from SQL:     ${rawCustomers.length}`);
  console.log(`Duplicates skipped:        ${skippedDuplicates}`);
  console.log(`New customers inserted:    ${insertedCount}`);
  console.log(`Existing users updated:    ${updatedExistingCount}`);
  console.log(`Errors encountered:        ${errorCount}`);
  console.log(`Total Mongo users now:     ${await User.countDocuments()}`);
  console.log('=============================================\n');

  await mongoose.disconnect();
  console.log('[Migration] Database connection closed.');
}

migrateRetailCustomers().catch(err => {
  console.error('[Migration Fatal Error]:', err);
  process.exit(1);
});
