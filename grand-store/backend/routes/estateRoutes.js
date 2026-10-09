const express = require('express');
const router = express.Router();
const {
  listEstates,
  getEstate,
  getMyProfile,
  upsertMyProfile,
  togglePublish,
  toggleFollow,
} = require('../controllers/estateController');

const { protect } = require('../middleware/authMiddleware');

// Inline vendor role check (project has no separate vendorMiddleware file)
const isVendor = (req, res, next) => {
  if (req.user && (req.user.role === 'vendor_active' || req.user.role === 'vendor_pending' || req.user.role === 'admin' || req.user.role === 'super_admin')) {
    return next();
  }
  res.status(403).json({ message: 'Access denied. Vendors only.' });
};

const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });

// ─── Vendor (authenticated) ─── must come BEFORE /:slug wildcard ─────────────
router.get('/vendor/my-profile', protect, isVendor, getMyProfile);
router.post('/vendor/my-profile', protect, isVendor, upsertMyProfile);
router.patch('/vendor/my-profile/publish', protect, isVendor, togglePublish);

// Single image upload route for Estate Builder (Cloudinary)
router.post('/vendor/upload-image', protect, isVendor, (req, res) => {
  upload.any()(req, res, (err) => {
    if (err) {
      console.error('Estate image upload error:', err);
      return res.status(400).json({ message: 'Failed to upload image', error: err.message });
    }
    const file = req.file || (req.files && req.files[0]);
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    res.json({ url: file.path, secure_url: file.path });
  });
});

// Image upload route
router.post('/vendor/upload-images', protect, isVendor, upload.array('images', 4), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ message: 'No files uploaded' });
  }
  const urls = req.files.map(file => file.path);
  res.json({ urls });
});

// ─── Customer (authenticated) — Follow/Unfollow ──────────────────────────────
router.post('/:id/follow', protect, toggleFollow);

// ─── Public — list and single estate (wildcard last) ─────────────────────────
router.get('/', listEstates);
router.get('/:slug', getEstate);

module.exports = router;

