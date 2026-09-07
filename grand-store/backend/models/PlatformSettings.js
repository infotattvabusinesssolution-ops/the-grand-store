const mongoose = require("mongoose");

const platformSettingsSchema = new mongoose.Schema({
  shippingFee: { type: Number, default: 100 },
  marketplaceCommissionPct: { type: Number, default: 15 },
  auctionCommissionPct: { type: Number, default: 15 },
  buyerPremiumPct: { type: Number, default: 5 },
  barChargePct: { type: Number, default: 2 },
  auctionPremiumDepositAmount: { type: Number, default: 5000 },
  auctionStandardBiddingLimit: { type: Number, default: 25000 },
  auctionPremiumBiddingLimit: { type: Number, default: 250000 },
  eventCommissionPct: { type: Number, default: 10 },
  vatPct: { type: Number, default: 15 },
  gatewayFeePct: { type: Number, default: 2.5 },
  bankDetails: {
    bankName: { type: String, default: 'Standard Bank' },
    accountName: { type: String, default: 'The Grand Store PTY LTD' },
    accountNumber: { type: String, default: '0123456789' },
    branchCode: { type: String, default: '051001' },
    accountType: { type: String, default: 'Business Cheque' },
    swiftCode: { type: String, default: 'SBZAJJ' },
    referenceNote: { type: String, default: 'Use Order ID or Bidder Number as deposit reference' }
  },
  bankDetailsList: [
    {
      id: { type: String },
      key: { type: String, default: '' },
      value: { type: String, default: '' }
    }
  ],
  referralRewardAmount: { type: Number, default: 50 },
  referralRewardType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
  referralMaxRewardedUsers: { type: Number, default: 5 }, // Max friends/people a referrer can earn R50 from (0 = unlimited)
  referralWelcomeDiscountEnabled: { type: Boolean, default: false }, // Refer & earn only rewards the referrer who shared the link
  referralWelcomeDiscount: { type: Number, default: 0 },
  referralWelcomeDiscountType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },

  // Birthday Greeting & Promotion Settings (Admin Configurable)
  birthdayEmailEnabled: { type: Boolean, default: true },
  birthdayDiscountEnabled: { type: Boolean, default: true },
  birthdayDiscountPercent: { type: Number, default: 15 },
  birthdayPromoCode: { type: String, default: 'BDAY-LUXURY15' },
  birthdayCustomMessage: { type: String, default: 'To celebrate your special day, enjoy an exclusive luxury treat on us.' },

  // Vendor Fees Configuration (Admin Configurable)
  vendorMonthlyMaintenanceFee: { type: Number, default: 500 },
  vendorMaintenanceGraceDays: { type: Number, default: 7 },

  // 18+ Bidder Legal Qualification & KYC Requirement Settings (Admin Configurable)
  bidderKycMinAge: { type: Number, default: 18 },
  bidderKycRequireDocumentUpload: { type: Boolean, default: true },
  bidderKycIdTypes: {
    type: [String],
    default: ['National ID', 'Passport', 'Driver License']
  },
  bidderKycFields: [
    {
      id: { type: String },
      key: { type: String },
      label: { type: String },
      type: { type: String, default: 'text' },
      options: [String],
      placeholder: { type: String, default: '' },
      required: { type: Boolean, default: true },
      helpText: { type: String, default: '' },
      enabled: { type: Boolean, default: true }
    }
  ],
  // Super Coins Loyalty & Margin Protection Settings (Admin Configurable)
  superCoinsEnabled: { type: Boolean, default: true },
  superCoinValue: { type: Number, default: 0.10 }, // 1 Super Coin = R0.10
  superCoinsEarnRatePer100: { type: Number, default: 10 }, // e.g. 10 coins per R100 spent
  superCoinsMaxRedemptionPct: { type: Number, default: 10 }, // Max 10% of order value
  superCoinsMinPlatformMarginPct: { type: Number, default: 15 }, // Margin safety threshold: 15%
  superCoinsExpiryMonths: { type: Number, default: 12 }, // Coins expire after 12 months
  superCoinsRegistrationReward: { type: Number, default: 100 }, // Welcome bonus
  superCoinsProfileReward: { type: Number, default: 100 },
  superCoinsFirstPurchaseReward: { type: Number, default: 500 },
  superCoinsReviewReward: { type: Number, default: 50 },
  superCoinsReferralReward: { type: Number, default: 500 },
  superCoinsBirthdayReward: { type: Number, default: 200 },

  // PostNet Delivery Rates (Admin Configurable in ZAR)
  postnetStandardFee: { type: Number, default: 120 },
  postnetExpressFee: { type: Number, default: 180 },
  postnetPickupFee: { type: Number, default: 100 },

  // "Who Pays?" Funding Source Engine (Costing GS Understanding Section 8)
  whoPaysGatewayFee: { type: String, enum: ['grand_store', 'vendor', 'split'], default: 'grand_store' },
  whoPaysPromotion: { type: String, enum: ['grand_store', 'vendor', 'split'], default: 'grand_store' },
  whoPaysReferral: { type: String, enum: ['grand_store', 'vendor', 'split'], default: 'grand_store' },
  whoPaysSuperCoins: { type: String, enum: ['grand_store', 'vendor', 'split'], default: 'grand_store' },
  whoPaysCourier: { type: String, enum: ['customer', 'vendor', 'grand_store'], default: 'customer' },
  whoPaysInsurance: { type: String, enum: ['customer', 'vendor', 'grand_store'], default: 'customer' },

  // Platform Margin Targets & Profit Guard (Costing GS Understanding Section 9 & 13)
  targetPlatformMarginPct: { type: Number, default: 30 },
  minimumPlatformMarginPct: { type: Number, default: 15 },
  marginHealthyThresholdPct: { type: Number, default: 15 }, // 🟢 Healthy >= 15%
  marginWarningThresholdPct: { type: Number, default: 10 }, // 🟠 Warning 10% - 14.9%
  marginBlockedThresholdPct: { type: Number, default: 10 }  // 🔴 Blocked < 10%
}, { timestamps: true });

module.exports = mongoose.model("PlatformSettings", platformSettingsSchema);
