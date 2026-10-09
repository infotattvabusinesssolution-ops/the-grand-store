const mongoose = require('mongoose');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const User = require('../models/User');
const seedAdminStore = require('../services/seedAdminStore');

// @desc    Fetch store details and products
// @route   GET /api/shop/stores/:id
// @access  Public
const getStoreById = async (req, res) => {
  try {
    const storeId = String(req.params.id || '').trim();
    const lowerId = storeId.toLowerCase();
    const isObjectId = mongoose.Types.ObjectId.isValid(storeId);

    // Check if this is the Grand Store Admin flagship storefront
    let isAdminStore = ['admin', 'grandstore', 'grand-store', 'thegrandstore'].includes(lowerId);
    let adminUser = null;

    if (!isAdminStore && isObjectId) {
      adminUser = await User.findOne({ _id: storeId, role: { $in: ['admin', 'super_admin'] } });
      if (adminUser) {
        isAdminStore = true;
      }
    }

    if (isAdminStore) {
      if (!adminUser) {
        adminUser = await User.findOne({
          $or: [
            { email: 'admin@grandstore.com' },
            { role: 'admin' },
            { role: 'super_admin' }
          ]
        });
      }

      let vendor = adminUser ? await Vendor.findOne({ userId: adminUser._id }).populate('userId', 'name email') : null;
      if (!vendor) {
        vendor = await seedAdminStore();
      }

      // Flagship store data
      const storeData = {
        _id: 'admin',
        businessName: vendor?.businessInfo?.tradingName || 'The Grand Store',
        country: vendor?.shippingProfile?.pickupAddress?.country || 'South Africa & Global',
        type: 'Flagship House',
        bannerUrl: vendor?.businessInfo?.bannerUrl || '/assets/grand-store-whisky-banner.jpg',
        logoUrl: vendor?.businessInfo?.logoUrl || '/grand-store-logo.png',
        story: vendor?.businessInfo?.story || 'The Grand Store is an exclusive sanctuary for rare whiskies, aged cognacs, historic vintages, and bespoke cellar allocations. Curated by master sommeliers, our flagship collection presents the finest single malts, aged rums, rare cognacs, and iconic estate wines—sourced directly from private vaults, heritage distilleries, and distinguished estates worldwide.',
        isVerified: true
      };

      // Fetch all approved house products (where vendorId is null/unassigned, or belongs to admin)
      const products = await Product.find({
        $or: [
          { vendorId: null },
          { vendorId: { $exists: false } },
          ...(adminUser ? [{ vendorId: adminUser._id }] : [])
        ],
        approvalStatus: 'approved',
        isCatalogDuplicate: { $ne: true }
      }).sort({ createdAt: -1 });

      return res.json({ storeData, products });
    }

    // Standard vendor store lookup
    if (!isObjectId) {
      return res.status(404).json({ message: 'Store not found' });
    }

    const vendor = await Vendor.findOne({ 
      $or: [
        { userId: storeId },
        { _id: storeId }
      ]
    }).populate('userId', 'name email');
    
    if (!vendor) {
      return res.status(404).json({ message: 'Store not found' });
    }
    
    // Fetch products using the vendor's userId, since product.vendorId points to User
    const products = await Product.find({
      vendorId: vendor.userId._id || vendor.userId,
      approvalStatus: 'approved',
      isCatalogDuplicate: { $ne: true }
    }).sort({ createdAt: -1 });
    
    // Map data
    const storeData = {
      _id: storeId,
      businessName: vendor.businessInfo?.tradingName || vendor.businessInfo?.legalName || (vendor.userId && vendor.userId.name) || 'Unknown Store',
      country: vendor.shippingProfile?.pickupAddress?.country || 'South Africa',
      type: vendor.vendorType,
      bannerUrl: vendor.businessInfo?.bannerUrl || 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=2000&auto=format&fit=crop',
      logoUrl: vendor.businessInfo?.logoUrl || 'https://images.unsplash.com/photo-1559564109-ce879bd2925b?q=80&w=200&auto=format&fit=crop',
      story: vendor.businessInfo?.story || vendor.storyInfo?.brandStory || vendor.storyInfo?.winemakerBio || 'Welcome to our store.',
      isVerified: vendor.status === 'approved'
    };

    res.json({ storeData, products });
  } catch (error) {
    console.error('Error fetching store:', error);
    res.status(500).json({ message: 'Server error fetching store' });
  }
};

module.exports = {
  getStoreById
};
