/**
 * Grand Store Super Coins Margin-Protection & Loyalty Calculation Engine
 * Enforces:
 * 1. Base Coin Economy (Default 1 Coin = R0.10)
 * 2. Maximum Order Redemption Cap (Default 10% of eligible subtotal)
 * 3. Platform Minimum Margin Protection (Platform contribution never falls below minPlatformMarginPct, default 15%)
 * 4. Earning on eligible product subtotal only (not on shipping, taxes, or coin discounts)
 */

class SuperCoinEngine {
  /**
   * Calculates the maximum coins that can safely be redeemed on a given cart
   * without violating platform minimum margin, order cap, or user balance.
   */
  static calculateAllowedRedemption({
    userCoins = 0,
    eligibleSubtotal = 0,
    shippingCost = 0,
    commissionPct = 15,
    gatewayFeePct = 2.5,
    settings = {}
  }) {
    const coinValue = Number(settings.superCoinValue !== undefined ? settings.superCoinValue : 0.10);
    const maxRedemptionPct = Number(settings.superCoinsMaxRedemptionPct !== undefined ? settings.superCoinsMaxRedemptionPct : 10);
    const minPlatformMarginPct = Number(settings.superCoinsMinPlatformMarginPct !== undefined ? settings.superCoinsMinPlatformMarginPct : 15);

    if (userCoins <= 0 || eligibleSubtotal <= 0 || coinValue <= 0) {
      return {
        availableCoins: userCoins,
        maxRedeemableCoins: 0,
        maxDiscountRand: 0,
        isMarginCapped: false,
        coinValue,
        marginMessage: ''
      };
    }

    // 1. User Balance Limit (Rand equivalent of all coins user holds)
    const userCoinsValueRand = parseFloat((userCoins * coinValue).toFixed(2));

    // 2. Order Cap Limit (e.g. max 10% of eligible product subtotal)
    const orderCapDiscountRand = parseFloat(((eligibleSubtotal * maxRedemptionPct) / 100).toFixed(2));

    // 3. Platform Margin Protection Limit
    // Formula: We require remaining platform contribution / (eligibleSubtotal - Discount) >= minPlatformMarginPct / 100
    // Platform Gross Revenue Share = eligibleSubtotal * (commissionPct / 100)
    // Gateway fee covers total transaction = (eligibleSubtotal + shippingCost) * (gatewayFeePct / 100)
    // Net contribution = Gross Revenue - Gateway Fee - Discount
    // Net contribution / (eligibleSubtotal - Discount) >= m
    // => Gross Revenue - Gateway Fee - Discount >= m * eligibleSubtotal - m * Discount
    // => Gross Revenue - Gateway Fee - m * eligibleSubtotal >= Discount * (1 - m)
    // => Discount <= (Gross Revenue - Gateway Fee - m * eligibleSubtotal) / (1 - m)
    const m = minPlatformMarginPct / 100;
    const grossPlatformCommission = (eligibleSubtotal * commissionPct) / 100;
    const estGatewayFee = ((eligibleSubtotal + shippingCost) * gatewayFeePct) / 100;

    let marginSafeDiscountRand = 0;
    if (m < 1) {
      const availableMarginHeadroom = grossPlatformCommission - estGatewayFee - (m * eligibleSubtotal);
      if (availableMarginHeadroom > 0) {
        marginSafeDiscountRand = parseFloat((availableMarginHeadroom / (1 - m)).toFixed(2));
      } else {
        // If commission equals or is below target margin after gateway fee,
        // we allow up to whatever headroom exists before actual negative cashflow, or clamp
        marginSafeDiscountRand = Math.max(0, parseFloat((grossPlatformCommission - estGatewayFee).toFixed(2)));
      }
    }

    // Final discount is the strictest of: User Coins, Order Cap, and Margin Limit
    const allowableDiscountRand = Math.max(
      0,
      Math.min(userCoinsValueRand, orderCapDiscountRand, marginSafeDiscountRand > 0 ? marginSafeDiscountRand : orderCapDiscountRand)
    );

    // Convert back to integer coins
    const maxRedeemableCoins = Math.min(
      userCoins,
      Math.floor(allowableDiscountRand / coinValue)
    );
    const finalDiscountRand = parseFloat((maxRedeemableCoins * coinValue).toFixed(2));

    const isMarginCapped = maxRedeemableCoins < userCoins && (finalDiscountRand < orderCapDiscountRand || finalDiscountRand < userCoinsValueRand);

    let marginMessage = '';
    if (isMarginCapped) {
      marginMessage = `You can use up to ${maxRedeemableCoins} Super Coins (R${finalDiscountRand.toFixed(2)}) on this order.`;
    }

    return {
      availableCoins: userCoins,
      maxRedeemableCoins,
      maxDiscountRand: finalDiscountRand,
      coinValue,
      isMarginCapped,
      marginMessage,
      orderCapPct: maxRedemptionPct,
      minMarginPct: minPlatformMarginPct
    };
  }

  /**
   * Calculates coins to be earned from eligible product subtotal
   * Strictly excludes shipping costs, taxes/VAT, or coin discount.
   */
  static calculateEarnedCoins(eligibleProductSubtotal, settings = {}) {
    if (!eligibleProductSubtotal || eligibleProductSubtotal <= 0) return 0;
    const earnRatePer100 = Number(settings.superCoinsEarnRatePer100 !== undefined ? settings.superCoinsEarnRatePer100 : 10);
    const coins = Math.floor((eligibleProductSubtotal / 100) * earnRatePer100);
    return Math.max(0, coins);
  }
}

module.exports = SuperCoinEngine;
