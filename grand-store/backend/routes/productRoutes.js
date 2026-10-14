const express = require('express');
const router = express.Router();
const { 
  getProducts, 
  getProductById, 
  getProductBySlug,
  createProduct, 
  getVendorProducts, 
  updateProduct, 
  deleteProduct,
  uploadBarcodeImage,
  getMosiPricing,
  updateMosiPricing,
  bulkUpdateMosiPricing
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

const { storage } = require('../config/cloudinary');
const upload = multer({ storage });

router.route('/')
  .get(getProducts)
  .post(protect, upload.fields([
    { name: 'images', maxCount: 5 }, 
    { name: 'factSheetPdf', maxCount: 1 },
    { name: 'barcodeImage', maxCount: 1 }
  ]), createProduct);

router.route('/vendor/me').get(protect, getVendorProducts);

// =========================================================================
// Mosi Oa Tunya Dynamic Pricing System Routes (Admin Internal Only)
// =========================================================================
router.route('/mosi/pricing')
  .get(protect, getMosiPricing);

router.route('/mosi/pricing/bulk')
  .post(protect, bulkUpdateMosiPricing);

router.route('/mosi/pricing/:id')
  .put(protect, updateMosiPricing);

// =========================================================================
// NEW: Dedicated, isolated endpoint for SEO lookups (2 URL segments)
// Cannot collide with 1-segment /:id route used by mobile app
// =========================================================================
router.route('/slugs/:slug')
  .get(getProductBySlug);

// Dedicated route for uploading/updating barcode image to Cloudinary
router.route('/:id/barcode-image')
  .post(protect, upload.single('barcodeImage'), uploadBarcodeImage);

// =========================================================================
// EXISTING: Untouched for React Native Mobile App & Admin CRUD
// =========================================================================
router.route('/:id')
  .get(getProductById)
  .put(protect, upload.fields([
    { name: 'images', maxCount: 5 }, 
    { name: 'factSheetPdf', maxCount: 1 },
    { name: 'barcodeImage', maxCount: 1 }
  ]), updateProduct)
  .delete(protect, deleteProduct);

module.exports = router;
