const express = require('express');
const router = express.Router();
const {
  subscribeNewsletter,
  getSubscribers,
  sendBulkNewsletter,
  drawGiveawayWinner,
  resetGiveawayWinner,
} = require('../controllers/newsletterController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/subscribe', subscribeNewsletter);
router.get('/subscribers', protect, admin, getSubscribers);
router.post('/send', protect, admin, sendBulkNewsletter);

// M Collection Giveaway & Draw
router.post('/mcollection/draw-winner', protect, admin, drawGiveawayWinner);
router.post('/mcollection/reset-winner/:id', protect, admin, resetGiveawayWinner);

module.exports = router;
