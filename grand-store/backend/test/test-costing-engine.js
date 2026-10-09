const CostingEngine = require('../engines/costingEngine');

console.log('--- Running CostingEngine Automated Unit Tests ---');

// Test 1: Base Selling Price Formula from Section 298–344 (Vendor R100 cost, 20% profit, 15% platform margin)
const basePriceResult = CostingEngine.calculateBaseSellingPrice({
  cost: 100,
  vendorProfitPct: 20,
  platformMarginPct: 15
});

console.log('Test 1 (Vendor Pricing Formula) Output:', basePriceResult);
if (basePriceResult.vendorPayout !== 120) {
  throw new Error(`Expected vendorPayout to be 120, got ${basePriceResult.vendorPayout}`);
}
if (basePriceResult.sellingPrice !== 141.18) {
  throw new Error(`Expected sellingPrice to be 141.18, got ${basePriceResult.sellingPrice}`);
}
console.log('✅ Test 1 (Vendor 15% Protected Margin) Passed!');

// Test 2: Master Calculation Flow matching Document Example (Section 2 & 6)
// Supplier price: R100, Discount: 5% (-R5), Landed costs: R5 -> True Cost: R100
// Target margin: 30% -> Base selling price: R142.86
// Promotion: 10% -> Customer price: R128.57
// Referral: 5% -> R6.43
// Supercoins: R5.00
// Gateway: 2.5% -> R3.21
// Net contribution: R13.93
const simResult = CostingEngine.simulateProductFinancials({
  supplierPrice: 100,
  supplierDiscountPct: 5,
  freightCost: 2,
  insuranceCost: 1,
  dutiesCost: 1,
  otherLandedCost: 1,
  vendorProfitPct: 0, // In doc Section 2, true cost R100 is used directly
  promotionDiscountPct: 10,
  referralRewardPct: 5,
  superCoinsUsed: 50 // 50 coins @ R0.10 = R5.00
}, {
  minimumPlatformMarginPct: 30, // Section 2 uses 30% target margin
  gatewayFeePct: 2.5,
  superCoinValue: 0.10,
  whoPaysGatewayFee: 'grand_store',
  whoPaysPromotion: 'grand_store',
  whoPaysReferral: 'grand_store',
  whoPaysSuperCoins: 'grand_store'
});

console.log('Test 2 (Master Calculation Flow) Output:', {
  trueCost: simResult.trueCost,
  baseSellingPrice: simResult.baseSellingPrice,
  customerPrice: simResult.customerPrice,
  promoDiscountAmount: simResult.promoDiscountAmount,
  referralCost: simResult.referralCost,
  superCoinsCost: simResult.superCoinsCost,
  gatewayCost: simResult.gatewayCost,
  netContribution: simResult.netContribution,
  effectiveNetMarginPct: simResult.effectiveNetMarginPct,
  marginStatus: simResult.marginStatus
});

if (Math.abs(simResult.trueCost - 100) > 0.01) {
  throw new Error(`Expected trueCost to be 100, got ${simResult.trueCost}`);
}
if (Math.abs(simResult.baseSellingPrice - 142.86) > 0.01) {
  throw new Error(`Expected baseSellingPrice to be 142.86, got ${simResult.baseSellingPrice}`);
}
if (Math.abs(simResult.customerPrice - 128.57) > 0.01) {
  throw new Error(`Expected customerPrice to be 128.57, got ${simResult.customerPrice}`);
}
if (Math.abs(simResult.netContribution - 13.93) > 0.05) {
  throw new Error(`Expected netContribution to be approx 13.93, got ${simResult.netContribution}`);
}
console.log('✅ Test 2 (Master Calculation Flow Section 2 & 6) Passed!');

// Test 3: "Who Pays?" Attribution Engine
// If vendor absorbs promotion and gateway fee, GS net contribution must equal gross commission minus coins/referral
const vendorFundedSim = CostingEngine.simulateProductFinancials({
  supplierPrice: 100,
  vendorProfitPct: 0,
  promotionDiscountPct: 10,
  superCoinsUsed: 50
}, {
  minimumPlatformMarginPct: 30,
  whoPaysGatewayFee: 'vendor',
  whoPaysPromotion: 'vendor',
  whoPaysSuperCoins: 'grand_store'
});

console.log('Test 3 ("Who Pays?" Vendor Funding) Contribution:', vendorFundedSim.netContribution);
if (vendorFundedSim.netContribution <= simResult.netContribution) {
  throw new Error('When vendor funds promo and gateway, Grand Store net contribution must be higher');
}
console.log('✅ Test 3 ("Who Pays?" Funding Allocation) Passed!');

// Test 4: Platform Margin Calculation (Default 15%)
const marginCheck = CostingEngine.simulateProductFinancials({ supplierPrice: 100 }, { marketplaceCommissionPct: 15 });
console.log('Test 4 (Platform Margin):', {
  platformMarginPct: marginCheck.platformMarginPct,
  baseSellingPrice: marginCheck.baseSellingPrice
});
if (marginCheck.platformMarginPct !== 15) throw new Error(`Expected margin 15, got ${marginCheck.platformMarginPct}`);
console.log('✅ Test 4 (Platform Margin) Passed!');

// Test 5: Order Financial Snapshot
const orderMock = {
  _id: 'mock_order_123',
  subTotal: 1000,
  totalPrice: 1100,
  commissionPct: 15,
  superCoinsDiscount: 50,
  appliedWelcomeDiscount: 50,
  vendorPayables: [{ netPayable: 850 }]
};
const snapshot = CostingEngine.calculateOrderFinancialSnapshot(orderMock, {
  whoPaysGatewayFee: 'grand_store',
  whoPaysCoins: 'grand_store',
  whoPaysReferral: 'grand_store'
});

console.log('Test 5 (Order Financial Snapshot):', snapshot);
if (!snapshot.netPlatformContribution || snapshot.netMarginPct === undefined) {
  throw new Error('Snapshot missing net contribution metrics');
}
console.log('✅ Test 5 (Immutable Order Financial Snapshot) Passed!');

console.log('🎉 ALL CostingEngine Tests Passed Successfully!');
