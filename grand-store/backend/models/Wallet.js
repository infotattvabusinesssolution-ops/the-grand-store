const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Available funds ready to be withdrawn by the vendor
  availableBalance: { type: Number, default: 0 },
  
  // Funds from recent sales that have not cleared yet (e.g. pending delivery)
  pendingBalance: { type: Number, default: 0 },
  
  // Funds currently queued in pending withdrawal/payout requests
  pendingWithdrawalAmount: { type: Number, default: 0 },
  
  // Lifetime stats
  totalEarned: { type: Number, default: 0 },
  totalWithdrawn: { type: Number, default: 0 },
  
  // Preferred payout method (e.g., EFT details)
  payoutDetails: {
    bankName: { type: String },
    accountName: { type: String },
    accountNumber: { type: String },
    branchCode: { type: String },
    accountType: { type: String },
    swiftCode: { type: String },
    bankConfirmationUrl: { type: String },
    isVerified: { type: Boolean, default: false },
    updatedAt: { type: Date }
  }
}, { timestamps: true });

module.exports = mongoose.model('Wallet', walletSchema);
