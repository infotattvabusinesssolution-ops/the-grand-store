const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const VendorCoupon = require('../models/VendorCoupon');
const ProductCoupon = require('../models/ProductCoupon');
const Product = require('../models/Product');

// Staff access check middleware: allow admin, super_admin, accountant, product_manager
const staffOrAdmin = (req, res, next) => {
  if (req.user && ['admin', 'super_admin', 'accountant', 'product_manager'].includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Staff or Administrator permissions required' });
};

// =========================================================================
// 1. UNIVERSAL OMNICHANNEL COUPON VALIDATION (WEB GLOBAL, LOCAL & MOBILE APP)
// =========================================================================
// @desc    Validate a customer coupon code against cart items
// @route   POST /api/coupons/validate
// @access  Public / Customer
router.post('/validate', async (req, res) => {
  try {
    const { code, cartItems, subtotal } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ valid: false, message: 'Please enter a voucher code' });
    }

    const cleanCode = code.trim().toUpperCase();
    const coupon = await ProductCoupon.findOne({ code: cleanCode, isActive: true });

    if (!coupon) {
      return res.status(404).json({ valid: false, message: 'Invalid or inactive voucher code' });
    }

    if (!coupon.isValid()) {
      const now = new Date();
      if (coupon.expiryDate && now > coupon.expiryDate) {
        return res.status(400).json({ valid: false, message: 'This voucher code has expired' });
      }
      if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
        return res.status(400).json({ valid: false, message: 'This voucher code has reached its maximum redemption limit' });
      }
      return res.status(400).json({ valid: false, message: 'This voucher is currently inactive' });
    }

    // Check minimum spend threshold
    const orderSubtotal = Number(subtotal) || (Array.isArray(cartItems) 
      ? cartItems.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 1)), 0)
      : 0);

    if (coupon.minSpendZar && coupon.minSpendZar > 0 && orderSubtotal < coupon.minSpendZar) {
      return res.status(400).json({
        valid: false,
        message: `Minimum order spend of R ${coupon.minSpendZar.toLocaleString()} required to use this voucher`
      });
    }

    // Verify targeted Admin Products in cart
    const targetProductIds = new Set(
      (coupon.applicableProducts || []).flatMap(p => [
        p.productId ? String(p.productId) : null,
        p.productRef ? String(p.productRef) : null,
        p._id ? String(p._id) : null,
        p.id ? String(p.id) : null
      ]).filter(Boolean)
    );
    const targetProductNames = new Set(
      (coupon.applicableProducts || []).map(p => (p.name || '').trim().toLowerCase()).filter(Boolean)
    );
    const items = Array.isArray(cartItems) ? cartItems : [];

    let matchingLineTotal = 0;
    let matchedItem = null;

    if (targetProductIds.size > 0 || targetProductNames.size > 0) {
      for (const item of items) {
        const itemIds = [
          item.product ? String(item.product) : null,
          item.id ? String(item.id) : null,
          item._id ? String(item._id) : null,
          item.productId ? String(item.productId) : null
        ].filter(Boolean);
        const itemName = (item.name || item.fullName || '').trim().toLowerCase();

        const isMatch = itemIds.some(id => targetProductIds.has(id)) ||
                        (itemName && targetProductNames.has(itemName));

        if (isMatch) {
          const itemPrice = Number(item.price) || 0;
          const itemQty = Number(item.quantity) || 1;
          matchingLineTotal += itemPrice * itemQty;
          if (!matchedItem) matchedItem = item;
        }
      }

      if (matchingLineTotal <= 0) {
        const bottleNames = (coupon.applicableProducts || []).map(p => p.name).filter(Boolean).join(', ');
        return res.status(400).json({
          valid: false,
          message: `This voucher is exclusively valid for: ${bottleNames || 'selected Admin Products'}. Add the item to your cart to redeem.`
        });
      }
    } else {
      // If no specific product locked, applies across cart
      matchingLineTotal = orderSubtotal;
    }

    // Calculate discount amount
    let discountAmount = 0;
    let discountPercent = 0;

    if (coupon.discountType === 'percentage') {
      discountPercent = coupon.discountValue;
      discountAmount = parseFloat(((matchingLineTotal * coupon.discountValue) / 100).toFixed(2));
    } else {
      discountAmount = Math.min(matchingLineTotal, coupon.discountValue);
      discountPercent = matchingLineTotal > 0 ? Math.round((discountAmount / matchingLineTotal) * 100) : 0;
    }

    return res.json({
      valid: true,
      code: coupon.code,
      couponId: coupon._id,
      title: coupon.title,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountPercent,
      discountAmount,
      appliedProductId: matchedItem ? (matchedItem.product || matchedItem.id) : (coupon.applicableProducts[0]?.productId || ''),
      productName: coupon.applicableProducts[0]?.name || 'Grand Store Selection',
      message: `🎉 Voucher applied! Saved R ${discountAmount.toFixed(2)} (${discountPercent}% off)`
    });
  } catch (error) {
    console.error('Error validating coupon:', error);
    return res.status(500).json({ valid: false, message: 'Server error validating coupon', error: error.message });
  }
});

// Alias for backwards compatibility
router.post('/validate-product-coupon', async (req, res) => {
  req.url = '/validate';
  return router.handle(req, res);
});

// =========================================================================
// 2. CUSTOMER PRODUCT VOUCHERS (ADMIN PRODUCTS ONLY) - ADMIN & CRM
// =========================================================================

// @desc    Get all eligible Admin Products (strictly vendorId === null) for coupon picker
// @route   GET /api/coupons/eligible-admin-products
// @access  Staff / Admin
router.get('/eligible-admin-products', protect, staffOrAdmin, async (req, res) => {
  try {
    const { search, category } = req.query;
    const filter = {
      $or: [
        { vendorId: null },
        { vendorId: { $exists: false } }
      ]
    };

    if (search && search.trim()) {
      filter.name = { $regex: search.trim(), $options: 'i' };
    }
    if (category && category !== 'all') {
      filter.category = { $regex: category.trim(), $options: 'i' };
    }

    const products = await Product.find(filter)
      .select('id _id name category price image stock slug brand')
      .sort({ name: 1 })
      .limit(400);

    res.json({
      success: true,
      count: products.length,
      products: products.map(p => ({
        id: p.id,
        _id: p._id,
        name: p.name,
        category: p.category || 'Luxury Spirits & Wine',
        price: Number(p.price) || 0,
        stock: p.stock || 0,
        image: p.image || '',
        slug: p.slug || ''
      }))
    });
  } catch (error) {
    console.error('Error fetching coupon-eligible admin products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin products', error: error.message });
  }
});

// @desc    Get all customer product vouchers
// @route   GET /api/coupons/admin-product
// @access  Staff / Admin
router.get('/admin-product', protect, staffOrAdmin, async (req, res) => {
  try {
    const coupons = await ProductCoupon.find({}).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: coupons.length,
      coupons
    });
  } catch (error) {
    console.error('Error fetching admin product coupons:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch coupons', error: error.message });
  }
});

// @desc    Create a customer product voucher (strictly restricted to Admin products)
// @route   POST /api/coupons/admin-product
// @access  Staff / Admin
router.post('/admin-product', protect, staffOrAdmin, async (req, res) => {
  try {
    const {
      code,
      title,
      discountType,
      discountValue,
      productIds, // array of product string IDs or ObjectIds
      minSpendZar,
      expiryDate,
      usageLimit,
      perCustomerLimit,
      campaignId,
      campaignName
    } = req.body;

    if (!code || !code.trim()) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }
    if (!discountValue || Number(discountValue) <= 0) {
      return res.status(400).json({ success: false, message: 'A valid discount value is required' });
    }
    if (!expiryDate) {
      return res.status(400).json({ success: false, message: 'An expiry date is required' });
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await ProductCoupon.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({ success: false, message: `Coupon code "${cleanCode}" already exists` });
    }

    // Resolve products and strictly verify they are Admin Products (vendorId === null)
    let applicableProducts = [];
    const pIds = Array.isArray(productIds) ? productIds : (productIds ? [productIds] : []);

    if (pIds.length > 0) {
      const foundProducts = await Product.find({
        $or: [
          { id: { $in: pIds } },
          { _id: { $in: pIds.filter(id => /^[0-9a-fA-F]{24}$/.test(id)) } }
        ]
      });

      for (const p of foundProducts) {
        if (p.vendorId) {
          return res.status(400).json({
            success: false,
            message: `Product "${p.name}" is a vendor-owned product. Coupons can only be issued for Grand Store Admin Products.`
          });
        }
        applicableProducts.push({
          productId: p.id,
          productRef: p._id,
          name: p.name,
          image: p.image || '',
          price: Number(p.price) || 0,
          category: p.category || ''
        });
      }
    }

    const coupon = new ProductCoupon({
      code: cleanCode,
      title: title || `${cleanCode} Voucher`,
      discountType: discountType === 'fixed_amount' ? 'fixed_amount' : 'percentage',
      discountValue: Number(discountValue),
      applicableProducts,
      minSpendZar: Number(minSpendZar) || 0,
      campaignId: campaignId || null,
      campaignName: campaignName || '',
      startDate: new Date(),
      expiryDate: new Date(expiryDate),
      usageLimit: usageLimit ? Number(usageLimit) : null,
      perCustomerLimit: perCustomerLimit ? Number(perCustomerLimit) : 1,
      isActive: true,
      createdBy: req.user?._id,
      createdByName: req.user?.name || 'Grand Store Administrator'
    });

    await coupon.save();

    res.status(201).json({
      success: true,
      message: `Product coupon "${coupon.code}" created successfully`,
      coupon
    });
  } catch (error) {
    console.error('Error creating admin product coupon:', error);
    res.status(500).json({ success: false, message: 'Failed to create coupon', error: error.message });
  }
});

// @desc    Toggle a customer product voucher status
// @route   PUT /api/coupons/admin-product/:id/toggle
// @access  Staff / Admin
router.put('/admin-product/:id/toggle', protect, staffOrAdmin, async (req, res) => {
  try {
    const coupon = await ProductCoupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.json({
      success: true,
      message: `Coupon "${coupon.code}" is now ${coupon.isActive ? 'Active' : 'Paused'}`,
      coupon
    });
  } catch (error) {
    console.error('Error toggling coupon status:', error);
    res.status(500).json({ success: false, message: 'Failed to update coupon status', error: error.message });
  }
});

// @desc    Delete a customer product voucher
// @route   DELETE /api/coupons/admin-product/:id
// @access  Staff / Admin
router.delete('/admin-product/:id', protect, staffOrAdmin, async (req, res) => {
  try {
    const coupon = await ProductCoupon.findById(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    await coupon.deleteOne();
    res.json({ success: true, message: `Coupon "${coupon.code}" removed successfully` });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ success: false, message: 'Failed to delete coupon', error: error.message });
  }
});

// =========================================================================
// 3. LEGACY VENDOR REGISTRATION TRIAL COUPONS (PRESERVED)
// =========================================================================

// @desc    Get all vendor trial coupons
// @route   GET /api/coupons/vendor
// @access  Private/Admin
router.get('/vendor', protect, staffOrAdmin, async (req, res) => {
  try {
    const coupons = await VendorCoupon.find({}).sort({ createdAt: -1 });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch vendor coupons', error: error.message });
  }
});

// @desc    Create a vendor trial coupon
// @route   POST /api/coupons/vendor
// @access  Private/Admin
router.post('/vendor', protect, staffOrAdmin, async (req, res) => {
  try {
    const { code, freeMonths, usageLimit } = req.body;
    const couponExists = await VendorCoupon.findOne({ code: code.toUpperCase() });
    if (couponExists) {
      return res.status(400).json({ message: 'Vendor coupon code already exists' });
    }

    const coupon = await VendorCoupon.create({
      code: code.toUpperCase(),
      freeMonths,
      usageLimit
    });

    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create vendor coupon', error: error.message });
  }
});

// @desc    Update a vendor trial coupon
// @route   PUT /api/coupons/vendor/:id
// @access  Private/Admin
router.put('/vendor/:id', protect, staffOrAdmin, async (req, res) => {
  try {
    const { isActive, freeMonths, usageLimit } = req.body;
    const coupon = await VendorCoupon.findById(req.params.id);
    if (coupon) {
      if (isActive !== undefined) coupon.isActive = isActive;
      if (freeMonths !== undefined) coupon.freeMonths = freeMonths;
      if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
      const updatedCoupon = await coupon.save();
      res.json(updatedCoupon);
    } else {
      res.status(404).json({ message: 'Vendor coupon not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to update vendor coupon', error: error.message });
  }
});

// @desc    Delete a vendor trial coupon
// @route   DELETE /api/coupons/vendor/:id
// @access  Private/Admin
router.delete('/vendor/:id', protect, staffOrAdmin, async (req, res) => {
  try {
    const coupon = await VendorCoupon.findById(req.params.id);
    if (coupon) {
      await coupon.deleteOne();
      res.json({ message: 'Vendor coupon removed' });
    } else {
      res.status(404).json({ message: 'Vendor coupon not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete vendor coupon', error: error.message });
  }
});

module.exports = router;
