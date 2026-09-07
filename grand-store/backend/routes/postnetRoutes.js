const express = require('express');
const router = express.Router();
const { getNearestStores } = require('../controllers/postnetController');
const { optionalAuth } = require('../middleware/authMiddleware');

// Get nearest postnet stores based on address
router.get('/locator', optionalAuth, getNearestStores);

module.exports = router;
