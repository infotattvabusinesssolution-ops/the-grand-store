const express = require('express');
const rateLimit = require('express-rate-limit');
const { protect, superAdmin } = require('../middleware/authMiddleware');
const controller = require('../controllers/cigarEnquiryController');

const router = express.Router();
const publicEnquiryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many enquiries have been submitted. Please wait a few minutes and try again.' },
  validate: { trustProxy: false, xForwardedForHeader: false },
});

// Product enquiries are intentionally guest-accessible. Keep both paths public
// for existing clients, while the explicit /public path prevents accidental
// coupling to customer authentication in future frontend integrations.
router.post('/public', publicEnquiryLimiter, controller.createEnquiry);
router.post('/', publicEnquiryLimiter, controller.createEnquiry);
router.get('/', protect, superAdmin, controller.listEnquiries);
router.get('/:id', protect, superAdmin, controller.getEnquiry);
router.post('/:id/replies', protect, superAdmin, controller.replyToEnquiry);
router.patch('/:id/status', protect, superAdmin, controller.updateStatus);

module.exports = router;
