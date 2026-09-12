const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
  getAnswer,
  getPublicFAQs,
  getAllFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
} = require('../controllers/chatbotController');
const { protect, admin } = require('../middleware/authMiddleware');

const chatbotLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many chat requests. Please wait a few minutes and try again.' },
  validate: { trustProxy: false, xForwardedForHeader: false },
});

// Public routes
router.post('/message', chatbotLimiter, getAnswer);
router.get('/faqs', getPublicFAQs);

// Admin routes
router.get('/admin/faqs', protect, admin, getAllFAQs);
router.post('/admin/faqs', protect, admin, createFAQ);
router.put('/admin/faqs/:id', protect, admin, updateFAQ);
router.delete('/admin/faqs/:id', protect, admin, deleteFAQ);

module.exports = router;
