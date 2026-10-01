const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function updatePartners() {
  await mongoose.connect(process.env.MONGO_URI);
  const PartnerDestination = require('../models/PartnerDestination');
  
  const r1 = await PartnerDestination.updateOne(
    { title: { $regex: 'cigar', $options: 'i' } },
    { $set: { href: 'https://cigarconnoisseurclub.com/' } }
  );
  console.log('Updated Cigar Partner:', r1);

  const r2 = await PartnerDestination.updateOne(
    { title: { $regex: 'millionaire', $options: 'i' } },
    { $set: { href: 'https://millionairescollection.com/' } }
  );
  console.log('Updated Millionaires Partner:', r2);

  const partners = await PartnerDestination.find({}).lean();
  console.log('--- UPDATED PARTNERS IN DB ---');
  console.log(JSON.stringify(partners, null, 2));

  await mongoose.disconnect();
}

updatePartners().catch(console.error);
