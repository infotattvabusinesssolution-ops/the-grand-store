const express = require('express');
const router = express.Router();
const {
  getWallet,
  getPublicSettings,
  adminAdjustCoins
} = require('../controllers/superCoinController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public settings route
router.get('/settings', getPublicSettings);

// Protected customer wallet route
router.get('/wallet', protect, getWallet);

// Admin manual adjustment route
router.post('/admin/adjust', protect, admin, adminAdjustCoins);

module.exports = router;
