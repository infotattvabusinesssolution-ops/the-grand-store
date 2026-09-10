const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const vendorController = require('../controllers/vendorController');
const vendorShippingController = require('../controllers/vendorShippingController');
const financeController = require('../controllers/financeController');
const { protect } = require('../middleware/authMiddleware');

const { storage } = require('../config/cloudinary');

const allowedDocumentExtensions = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.heic', '.heif', '.doc', '.docx']);
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const isAllowedExt = allowedDocumentExtensions.has(extension);
    const isAllowedMime = file.mimetype && (
      file.mimetype === 'application/pdf' ||
      file.mimetype.startsWith('image/') ||
      file.mimetype.includes('pdf') ||
      file.mimetype.includes('msword') ||
      file.mimetype.includes('document')
    );
    if (!isAllowedExt && !isAllowedMime) {
      return callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname || 'file'));
    }
    return callback(null, true);
  },
});

const uploadSingleDocument = (req, res, next) => {
  upload.any()(req, res, (error) => {
    if (!error) {
      if (req.files && req.files.length > 0) {
        req.file = req.files[0];
      }
      return next();
    }
    console.error('Vendor document upload error:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'The selected file is larger than 10 MB.' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ message: 'Unsupported file type. Upload an image (PNG, JPG, WEBP) or PDF file up to 10MB.' });
    }
    return res.status(400).json({ message: 'The document could not be uploaded.', error: error.message || String(error) });
  });
};

// Unauthenticated routes for public vendor onboarding
router.post('/register-full', vendorController.registerFullVendor);
router.post('/upload-public', uploadSingleDocument, vendorController.uploadDocument);

// All vendor routes below should be protected
router.use(protect);

router.get('/onboarding', vendorController.getOnboardingProgress);
router.post('/onboarding', vendorController.saveOnboardingProgress);
router.post('/onboarding/upload', uploadSingleDocument, vendorController.uploadDocument);
router.post('/onboarding/submit', vendorController.submitApplication);
router.post('/onboarding/submit-proof', vendorController.submitProof);
router.post('/apply-coupon', vendorController.applyCoupon);

// Store Profile Routes
router.get('/store-profile', vendorController.getStoreProfile);
router.put('/store-profile', vendorController.updateStoreProfile);

// Shipping Profile Routes
router.get('/shipping-profile', vendorShippingController.getShippingProfile);
router.put('/shipping-profile', vendorShippingController.updateShippingProfile);

// Financial / Wallet Routes
router.get('/wallet', financeController.getVendorWallet);
router.post('/wallet/payout-request', financeController.requestVendorPayout);
router.get('/wallet/payout-history', financeController.getVendorPayoutHistory);

// Banking Details Routes
router.get('/banking', vendorController.getVendorBanking);
router.put('/banking', vendorController.updateVendorBanking);
router.post('/banking/upload', uploadSingleDocument, vendorController.uploadDocument);

// Maintenance Fee Routes
router.get('/maintenance-fee', vendorController.getMaintenanceFeeStatus);
router.post('/maintenance-fee/pay', vendorController.payMaintenanceFee);
router.post('/maintenance-fee/submit-proof', vendorController.submitMaintenanceFeeProof);

module.exports = router;
