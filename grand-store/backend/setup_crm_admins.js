const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const MONGO_URI = 'mongodb+srv://crmisa1000_db_user:Ug5sH8m4vxCjmZHN@cluster0.8snrppp.mongodb.net/test?retryWrites=true&w=majority';

async function setupAdminAccounts() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB Atlas...');
  const passwordHash = await bcrypt.hash('Admin123!', 12);

  const usersCollection = mongoose.connection.collection('users');

  // 1. Primary Store Admin
  await usersCollection.updateOne(
    { email: 'admin@grandstore.com' },
    { $set: { password: passwordHash, role: 'admin', isEmailVerified: true } },
    { upsert: true }
  );

  // 2. Personal Admin (ritesh)
  await usersCollection.updateOne(
    { email: 'admin1@grandstore.com' },
    { $set: { password: passwordHash, role: 'admin', isEmailVerified: true } },
    { upsert: true }
  );

  // 3. Dedicated CRM Admin
  await usersCollection.updateOne(
    { email: 'crmadmin@grandstore.com' },
    { $set: { name: 'CRM Executive Administrator', password: passwordHash, role: 'super_admin', isEmailVerified: true } },
    { upsert: true }
  );

  console.log('SUCCESS: Set Admin123! for:');
  console.log(' - admin@grandstore.com (Store Administrator)');
  console.log(' - admin1@grandstore.com (ritesh)');
  console.log(' - crmadmin@grandstore.com (CRM Executive Administrator)');

  await mongoose.disconnect();
}

setupAdminAccounts().catch(console.error);
