const User = require('../models/User');
const Vendor = require('../models/Vendor');

const ADMIN_STORE_PROFILE = {
  vendorType: 'flagship',
  onboardingStep: 10,
  status: 'approved',
  paymentStatus: 'paid',
  registrationFee: 0,
  verificationScore: {
    businessVerified: true,
    identityVerified: true,
    licenceVerified: true,
    taxVerified: true,
    bankVerified: true
  },
  businessInfo: {
    legalName: 'The Grand Store International (Pty) Ltd',
    tradingName: 'The Grand Store',
    registrationNumber: 'GS-VAULT-2026-001',
    businessType: 'Flagship Luxury House & Spirits Merchant',
    address: 'The Grand Store Flagship Vaults, Cape Town & Global',
    bannerUrl: '/assets/grand-store-whisky-banner.jpg',
    logoUrl: '/grand-store-logo.png',
    story: 'The Grand Store is an exclusive sanctuary for rare whiskies, aged cognacs, historic vintages, and bespoke cellar allocations. Curated by master sommeliers, our flagship collection presents the finest single malts, aged rums, rare cognacs, and iconic estate wines—sourced directly from private vaults, heritage distilleries, and distinguished estates worldwide.'
  },
  storyInfo: {
    brandStory: 'Curating the world’s most coveted spirits, rare single cask releases, and legendary vintage wines.',
    winemakerBio: 'Curated by The Grand Store Master Sommelier & Spirits Directorate.'
  },
  shippingProfile: {
    pickupAddress: {
      addressLine1: 'The Grand Store Flagship Vaults',
      city: 'Cape Town',
      state: 'Western Cape',
      postalCode: '8001',
      country: 'South Africa & Global'
    }
  },
  productCategories: ['Whisky', 'Cognac', 'Scotch', 'Spirits', 'Champagne', 'Wine']
};

async function seedAdminStore() {
  try {
    // Locate primary admin account
    let adminUser = await User.findOne({
      $or: [
        { email: 'admin@grandstore.com' },
        { role: 'admin' },
        { role: 'super_admin' }
      ]
    });

    if (!adminUser) {
      console.log('Admin user not found. Skipping admin store seed until admin user is created.');
      return;
    }

    let vendor = await Vendor.findOne({ userId: adminUser._id });

    if (!vendor) {
      vendor = await Vendor.create({
        userId: adminUser._id,
        ...ADMIN_STORE_PROFILE
      });
      console.log(`✅ Created Admin Flagship Store profile for: ${adminUser.email}`);
    } else {
      // Update store profile to ensure flagship store details are current
      vendor.status = 'approved';
      vendor.paymentStatus = 'paid';
      vendor.vendorType = 'flagship';
      
      // Preserve custom banner/logo if already customized, otherwise ensure default flagship assets
      vendor.businessInfo = {
        ...ADMIN_STORE_PROFILE.businessInfo,
        ...vendor.businessInfo,
        tradingName: vendor.businessInfo?.tradingName || 'The Grand Store',
        bannerUrl: vendor.businessInfo?.bannerUrl || '/assets/grand-store-whisky-banner.jpg',
        logoUrl: vendor.businessInfo?.logoUrl || '/grand-store-logo.png',
        story: vendor.businessInfo?.story || ADMIN_STORE_PROFILE.businessInfo.story
      };

      vendor.shippingProfile = {
        ...ADMIN_STORE_PROFILE.shippingProfile,
        ...vendor.shippingProfile
      };

      vendor.verificationScore = {
        ...ADMIN_STORE_PROFILE.verificationScore,
        ...vendor.verificationScore
      };

      await vendor.save();
      console.log(`✅ Updated Admin Flagship Store profile for: ${adminUser.email}`);
    }

    return vendor;
  } catch (error) {
    console.error('❌ Error seeding Admin Store profile:', error);
  }
}

// Allow direct CLI execution: node backend/services/seedAdminStore.js
if (require.main === module) {
  const dns = require('dns');
  dns.setServers(['8.8.8.8', '8.8.4.4']);
  const mongoose = require('mongoose');
  const path = require('path');
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

  mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
      console.log('Connected to MongoDB.');
      await seedAdminStore();
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seedAdminStore;
