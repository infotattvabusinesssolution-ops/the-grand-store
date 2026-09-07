const assert = require('assert');
const SuperCoinEngine = require('../engines/superCoinEngine');

console.log('--- Running SuperCoinEngine Automated Unit Tests ---');

// Test 1: Standard Margin Protection (Sufficient headroom)
{
  const result = SuperCoinEngine.calculateAllowedRedemption({
    userCoins: 500, // R50
    eligibleSubtotal: 1000,
    shippingCost: 120,
    commissionPct: 25, // 25% platform commission = R250
    gatewayFeePct: 2.5, // 2.5% of (1000+120) = R28
    settings: {
      superCoinValue: 0.10,
      superCoinsMaxRedemptionPct: 10, // Max R100
      superCoinsMinPlatformMarginPct: 15 // Must keep at least 15% margin
    }
  });

  console.log('Test 1 (Standard Margin) Output:', result);
  assert.strictEqual(result.maxRedeemableCoins, 500, 'Should allow full 500 coins');
  assert.strictEqual(result.maxDiscountRand, 50, 'Should discount R50');
  console.log('✅ Test 1 Passed!');
}

// Test 2: Clamped Coins on Low Initial Margin
{
  const result = SuperCoinEngine.calculateAllowedRedemption({
    userCoins: 200, // R20
    eligibleSubtotal: 117.65,
    shippingCost: 0,
    commissionPct: 15, // 15% platform commission = R17.65 (exactly target margin)
    gatewayFeePct: 2.5, // R2.94
    settings: {
      superCoinValue: 0.10,
      superCoinsMaxRedemptionPct: 10,
      superCoinsMinPlatformMarginPct: 15
    }
  });

  console.log('Test 2 (Low Margin Clamping) Output:', result);
  assert(result.maxRedeemableCoins < 200, 'Coins should be clamped to protect margin');
  assert(result.isMarginCapped === true, 'isMarginCapped should be true');
  console.log('✅ Test 2 Passed!');
}

// Test 3: Order Cap Enforcement (10% limit)
{
  const result = SuperCoinEngine.calculateAllowedRedemption({
    userCoins: 10000, // R1,000 in coins
    eligibleSubtotal: 5000,
    shippingCost: 150,
    commissionPct: 30, // High commission, plenty of margin
    gatewayFeePct: 2.5,
    settings: {
      superCoinValue: 0.10,
      superCoinsMaxRedemptionPct: 10, // Max 10% of R5,000 = R500 = 5,000 coins
      superCoinsMinPlatformMarginPct: 15
    }
  });

  console.log('Test 3 (10% Order Cap) Output:', result);
  assert.strictEqual(result.maxRedeemableCoins, 5000, 'Should be capped at 5000 coins (R500)');
  assert.strictEqual(result.maxDiscountRand, 500, 'Should discount R500');
  console.log('✅ Test 3 Passed!');
}

// Test 4: Earning Accrual on Eligible Products
{
  const earned = SuperCoinEngine.calculateEarnedCoins(2000, {
    superCoinsEarnRatePer100: 10
  });
  console.log('Test 4 (Earning Accrual) Output:', earned);
  assert.strictEqual(earned, 200, 'Should earn 200 coins on R2,000 spend');
  console.log('✅ Test 4 Passed!');
}

console.log('🎉 ALL SuperCoinEngine TESTS PASSED SUCCESSFULLY!');
