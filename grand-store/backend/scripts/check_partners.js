const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function checkPartners() {
  await mongoose.connect(process.env.MONGO_URI);
  const PartnerDestination = require('../models/PartnerDestination');
  const partners = await PartnerDestination.find({}).lean();
  console.log('--- PARTNERS IN DB ---');
  console.log(JSON.stringify(partners, null, 2));
  await mongoose.disconnect();
}

checkPartners().catch(console.error);
