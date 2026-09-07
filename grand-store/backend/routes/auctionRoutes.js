const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });
const auctionController = require('../controllers/auctionController');
const { protect } = require('../middleware/authMiddleware');

// 1. Static Public
router.get('/', auctionController.getAuctionLots);
router.get('/live-status', auctionController.getLiveAuctionStatus);

// 2. Bidder Qualification, Verification & Deposits (Phase 4 & Section 19)
router.post('/bidder/verify', protect, auctionController.registerBidder);
router.get('/bidder/status', protect, auctionController.getBidderStatus);
router.post('/bidder/deposit', protect, upload.single('proof'), auctionController.createBidderDeposit);

// 3. User & Dashboard
router.get('/user/dashboard', protect, auctionController.getUserBids);

// 4. Vendor Submissions
const handleAuctionUpload = (req, res, next) => {
  upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'video', maxCount: 1 }
  ])(req, res, (err) => {
    if (!err) return next();
    console.error('Auction media upload error:', err);
    
    const errText = err ? (err.message || String(err)) : '';
    let errorMessage = 'Failed to upload auction media. Please ensure images are valid formats (JPEG, PNG, WEBP) and videos are under 60MB.';
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      errorMessage = 'One or more files exceed the maximum allowed size.';
    } else if (errText.includes('api_key') || errText.includes('Must supply')) {
      errorMessage = 'Cloudinary storage service configuration error. Missing or invalid API key.';
    } else if (errText) {
      errorMessage = errText;
    }

    return res.status(400).json({ 
      message: errorMessage, 
      error: errorMessage 
    });
  });
};

router.post('/', protect, handleAuctionUpload, auctionController.submitLot);
router.get('/vendor/lots', protect, auctionController.getVendorLots);

// 5. Admin Controls & Compliance (Phases 3, 7, 9, 10 & Bidder Approvals)
router.get('/admin/bidders', protect, auctionController.getAdminBidders);
router.put('/admin/bidders/:id/approve', protect, auctionController.approveBidder);
router.put('/admin/bidders/:id/reject', protect, auctionController.rejectBidder);
router.put('/admin/bidders/:id/limit', protect, auctionController.updateBidderLimit);
router.get('/admin/deposits', protect, auctionController.getAdminDeposits);
router.put('/admin/deposits/:id/verify', protect, auctionController.verifyAdminDeposit);

router.get('/admin/lots', protect, auctionController.getAdminPendingLots);
router.get('/admin/all', protect, auctionController.getAllLots);
router.put('/admin/lots/:id/authenticate', protect, auctionController.updateLotAuthentication);
router.put('/admin/:id/authenticate', protect, auctionController.updateLotAuthentication); // alias
router.get('/admin/fraud-alerts', protect, auctionController.getAuctionFraudAlerts);
router.put('/admin/fraud-alerts/:id/resolve', protect, auctionController.resolveFraudAlert);
router.get('/admin/ledger', protect, auctionController.getAuctionLedger);

// 6. Lot-Specific Parametrized Routes
router.get('/:id', auctionController.getLotDetails);
router.get('/:id/certificate', auctionController.getAuctionLotCertificate);
router.post('/:id/bid', protect, auctionController.placeBid);
router.post('/:id/watchlist', protect, auctionController.toggleWatchlist);
router.post('/:id/pay', protect, auctionController.payAuction);
router.put('/:id/resubmit', protect, auctionController.resubmitLot);
router.put('/:id/approve', protect, auctionController.approveLot);
router.put('/:id/close', protect, auctionController.closeAuction);

module.exports = router;

