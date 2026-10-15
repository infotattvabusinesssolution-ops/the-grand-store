const express = require('express');
const router = express.Router();
const { 
  createEnquiry, 
  getAdminEnquiries, 
  updateEnquiryStatus,
  getBuyerQuotationByCode,
  acceptBuyerQuotation
} = require('../controllers/tradeEnquiryController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public route for form submission
router.post('/', createEnquiry);

// Public routes for external Buyer Quotation Review & Online Acceptance
router.get('/quote-review/:code', getBuyerQuotationByCode);
router.post('/quote-accept/:code', acceptBuyerQuotation);

// Protected Admin routes
router.get('/', protect, admin, getAdminEnquiries);
router.put('/:id/status', protect, admin, updateEnquiryStatus);

module.exports = router;
