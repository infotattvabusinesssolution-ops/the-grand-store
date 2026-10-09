const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function grantAllRights() {
  await mongoose.connect(process.env.MONGO_URI);
  const User = require('./models/User');
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  const emails = ['crmadmin@grandstore.com', 'admin@grandstore.com', 'admin1@grandstore.com'];
  for (const email of emails) {
    const updated = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          role: 'super_admin',
          password: hashedPassword,
          isAgeVerified: true,
          kycVerified: true,
          isEmailVerified: true,
          customerTier: 'trade_wholesale',
          bidderLevel: 'level_3_unlimited',
          bidderApprovalStatus: 'approved',
          crmCustomerType: 'vip_collector',
          mustChangePassword: false,
          'crmPreferences.isAgeVerified': true
        }
      },
      { returnDocument: 'after', upsert: true }
    );
    console.log(`Updated ${email} to super_admin with ALL rights.`);
  }

  process.exit(0);
}

grantAllRights().catch(e => { console.error('Error updating admins:', e); process.exit(1); });
