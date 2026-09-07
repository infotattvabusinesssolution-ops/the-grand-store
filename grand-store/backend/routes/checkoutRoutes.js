const express = require('express');
const router = express.Router();
const checkoutController = require('../controllers/checkoutController');
const { optionalAuth } = require('../middleware/authMiddleware');
const multer = require('multer');
const { storage } = require('../config/cloudinary');

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const handleGuestDocUpload = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      console.error('Multer upload error for guest document:', err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File size exceeds 10MB limit. Please upload a smaller image or PDF.' });
      }
      return res.status(400).json({ message: 'Error uploading document file.', error: err.message });
    }
    if (req.files && req.files.length > 0) {
      req.file = req.files[0];
    }
    next();
  });
};

router.post('/quote', optionalAuth, checkoutController.generateQuote);
router.post('/upload-guest-document', optionalAuth, handleGuestDocUpload, checkoutController.uploadGuestDocument);

module.exports = router;

