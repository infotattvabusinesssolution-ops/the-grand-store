const express = require('express');
const router = express.Router();
const {
  getPublicAcademy,
  getAdminAcademy,
  createLesson,
  updateLesson,
  deleteLesson,
  updateConfig,
  seedDefaults,
} = require('../controllers/vendorAcademyController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public/Vendor accessible endpoints
router.get('/', getPublicAcademy);

// Admin-managed endpoints
router.get('/admin', protect, admin, getAdminAcademy);
router.post('/admin', protect, admin, createLesson);
router.put('/admin/config', protect, admin, updateConfig);
router.post('/admin/seed', protect, admin, seedDefaults);
router.put('/admin/:id', protect, admin, updateLesson);
router.delete('/admin/:id', protect, admin, deleteLesson);

module.exports = router;
