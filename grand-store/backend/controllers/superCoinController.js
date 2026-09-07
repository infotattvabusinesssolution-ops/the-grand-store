const User = require('../models/User');
const PlatformSettings = require('../models/PlatformSettings');
const SuperCoinLedger = require('../models/SuperCoinLedger');

// @desc    Get customer Super Coins wallet, balance, and transaction history
// @route   GET /api/super-coins/wallet
// @access  Private
const getWallet = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('name email superCoinsBalance pendingSuperCoins');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let settings = await PlatformSettings.findOne();
    if (!settings) settings = await PlatformSettings.create({});
    const coinValue = Number(settings.superCoinValue !== undefined ? settings.superCoinValue : 0.10);

    // Fetch transactions from ledger
    const transactions = await SuperCoinLedger.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    // Calculate coins expiring soon (within next 30 days)
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const expiringSoonLedgers = await SuperCoinLedger.find({
      userId: req.user._id,
      type: 'earned',
      status: 'available',
      expiryDate: { $gt: new Date(), $lte: thirtyDaysFromNow }
    });
    const expiringSoonCoins = expiringSoonLedgers.reduce((sum, item) => sum + (item.amount || 0), 0);

    const availableBalance = Math.max(0, Number(user.superCoinsBalance) || 0);
    const pendingBalance = Math.max(0, Number(user.pendingSuperCoins) || 0);

    res.json({
      availableCoins: availableBalance,
      availableRandValue: parseFloat((availableBalance * coinValue).toFixed(2)),
      pendingCoins: pendingBalance,
      pendingRandValue: parseFloat((pendingBalance * coinValue).toFixed(2)),
      expiringSoonCoins,
      coinValue,
      transactions
    });
  } catch (error) {
    console.error('Super Coins getWallet error:', error);
    res.status(500).json({ message: 'Server error loading Super Coins wallet' });
  }
};

// @desc    Get public Super Coins settings (earn rates, coin value, rules)
// @route   GET /api/super-coins/settings
// @access  Public
const getPublicSettings = async (req, res) => {
  try {
    let settings = await PlatformSettings.findOne();
    if (!settings) settings = await PlatformSettings.create({});

    res.json({
      enabled: settings.superCoinsEnabled !== undefined ? settings.superCoinsEnabled : true,
      coinValue: settings.superCoinValue !== undefined ? settings.superCoinValue : 0.10,
      earnRatePer100: settings.superCoinsEarnRatePer100 !== undefined ? settings.superCoinsEarnRatePer100 : 10,
      maxRedemptionPct: settings.superCoinsMaxRedemptionPct !== undefined ? settings.superCoinsMaxRedemptionPct : 10,
      minPlatformMarginPct: settings.superCoinsMinPlatformMarginPct !== undefined ? settings.superCoinsMinPlatformMarginPct : 15,
      registrationReward: settings.superCoinsRegistrationReward !== undefined ? settings.superCoinsRegistrationReward : 100,
      firstPurchaseReward: settings.superCoinsFirstPurchaseReward !== undefined ? settings.superCoinsFirstPurchaseReward : 500,
      reviewReward: settings.superCoinsReviewReward !== undefined ? settings.superCoinsReviewReward : 50,
      referralReward: settings.superCoinsReferralReward !== undefined ? settings.superCoinsReferralReward : 500
    });
  } catch (error) {
    console.error('Super Coins getPublicSettings error:', error);
    res.status(500).json({ message: 'Server error loading Super Coin settings' });
  }
};

// @desc    Admin manual adjustment of a user's Super Coins
// @route   POST /api/super-coins/admin/adjust
// @access  Private/Admin
const adminAdjustCoins = async (req, res) => {
  try {
    const { targetUserId, amount, reason } = req.body;
    if (!targetUserId || amount === undefined || Number.isNaN(Number(amount))) {
      return res.status(400).json({ message: 'targetUserId and valid amount are required' });
    }

    const numAmount = Number(amount);
    if (numAmount === 0) {
      return res.status(400).json({ message: 'Adjustment amount cannot be zero' });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    const newBalance = Math.max(0, (Number(user.superCoinsBalance) || 0) + numAmount);
    user.superCoinsBalance = newBalance;
    await user.save();

    const ledger = new SuperCoinLedger({
      userId: user._id,
      amount: numAmount,
      type: 'admin_adjustment',
      activity: 'admin_manual',
      status: 'completed',
      description: reason || `Admin adjustment by ${req.user.email || 'Admin'}`,
      balanceSnapshot: newBalance
    });
    await ledger.save();

    res.json({
      message: `Adjusted user coins by ${numAmount > 0 ? `+${numAmount}` : numAmount}. New balance: ${newBalance}`,
      user: {
        id: user._id,
        email: user.email,
        superCoinsBalance: user.superCoinsBalance
      },
      ledger
    });
  } catch (error) {
    console.error('Admin adjust coins error:', error);
    res.status(500).json({ message: 'Server error adjusting user coins' });
  }
};

module.exports = {
  getWallet,
  getPublicSettings,
  adminAdjustCoins
};
