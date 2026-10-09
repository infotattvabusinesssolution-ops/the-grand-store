const express = require('express');
const router  = express.Router();
const {
  submitApplication,
  listApplications,
  getApplication,
  approveApplication,
  rejectApplication,
  revokeAccess,
} = require('../controllers/hostApplicationController');
const { protect } = require('../middleware/authMiddleware');

// Admin-only guard
const isAdmin = (req, res, next) => {
  if (req.user && ['admin', 'super_admin'].includes(req.user.role)) return next();
  res.status(403).json({ message: 'Admin access required' });
};

// ── Public ────────────────────────────────────────────────────
router.post('/', submitApplication);

// ── Admin ─────────────────────────────────────────────────────
router.get('/',           protect, isAdmin, listApplications);
router.get('/:id',        protect, isAdmin, getApplication);
router.put('/:id/approve',protect, isAdmin, approveApplication);
router.put('/:id/reject', protect, isAdmin, rejectApplication);
router.delete('/:id/revoke', protect, isAdmin, revokeAccess);

module.exports = router;
