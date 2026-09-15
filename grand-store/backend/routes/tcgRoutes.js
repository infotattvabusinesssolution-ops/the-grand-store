const express = require('express');
const router = express.Router();
const { getLockers, getRates } = require('../controllers/tcgController');
const { optionalAuth } = require('../middleware/authMiddleware');

// Get PUDO Smart Lockers / TCG pickup points
router.get('/lockers', optionalAuth, getLockers);
router.get('/pickup-points', optionalAuth, getLockers);

// Calculate rates
router.post('/rates', optionalAuth, getRates);

module.exports = router;
