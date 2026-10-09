const express = require('express');
const router = express.Router();
const {
  getPublicPartners,
  getAdminPartners,
  createPartner,
  updatePartner,
  deletePartner
} = require('../controllers/partnerDestinationController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public route
router.get('/', getPublicPartners);

// Admin routes
router.get('/admin', protect, admin, getAdminPartners);
router.post('/', protect, admin, createPartner);
router.put('/:id', protect, admin, updatePartner);
router.delete('/:id', protect, admin, deletePartner);

module.exports = router;
