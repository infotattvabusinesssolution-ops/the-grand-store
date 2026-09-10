/**
 * Grand Store Costing, Pricing & "Who Pays?" Profit Engine
 * Implements:
 * 1. Master Calculation Flow (Section 1–6)
 * 2. Vendor 15% Platform Protected Margin (Section 298–344)
 * 3. "Who Pays?" Funding Source Engine (Section 8)
 * 4. Profit Guard Minimum Selling Price & Thresholds (Section 9)
 * 5. Immutable Order Financial Snapshot (Section 14 & 251)
 */

class CostingEngine {
  /**
   * Calculates base customer selling price protecting Grand Store's minimum 15% margin
   * Selling Price = (Product Cost * (1 + Vendor Profit %)) / (1 - Platform Margin %)
   */
  static calculateBaseSellingPrice({ cost = 0, vendorProfitPct = 0, platformMarginPct = 15 }) {
    const numericCost = Math.max(0, Number(cost) || 0);
    const profitPct = Math.max(0, Number(vendorProfitPct) || 0);
    const marginPct = Math.min(99, Math.max(0, Number(platformMarginPct) || 15));

    // Vendor's price to platform (Vendor Payout)
    const vendorProfitAmount = parseFloat(((numericCost * profitPct) / 100).toFixed(2));
    const vendorPayout = parseFloat((numericCost + vendorProfitAmount).toFixed(2));

    // Platform gross margin formula: Payout / (1 - m)
    const marginRatio = marginPct / 100;
    const sellingPrice = marginRatio < 1
      ? parseFloat((vendorPayout / (1 - marginRatio)).toFixed(2))
      : vendorPayout;

    const platformMarginAmount = parseFloat((sellingPrice - vendorPayout).toFixed(2));

    return {
      productCost: numericCost,
      vendorProfitPct: profitPct,
      vendorProfitAmount,
      vendorPayout,
      platformMarginPct: marginPct,
      platformMarginAmount,
      sellingPrice
    };
  }

  /**
   * Simulates full product financials, incentives, and contribution status
   */
  static simulateProductFinancials(input = {}, settings = {}) {
    const supplierPrice = Math.max(0, Number(input.supplierPrice || input.cost || 0));
    const supplierDiscountPct = Math.max(0, Number(input.supplierDiscountPct || 0));
    const supplierDiscountAmount = parseFloat(((supplierPrice * supplierDiscountPct) / 100).toFixed(2));
    const netSupplierCost = parseFloat((supplierPrice - supplierDiscountAmount).toFixed(2));

    const freightCost = Math.max(0, Number(input.freightCost || 0));
    const insuranceCost = Math.max(0, Number(input.insuranceCost || 0));
    const dutiesCost = Math.max(0, Number(input.dutiesCost || 0));
    const otherLandedCost = Math.max(0, Number(input.otherLandedCost || 0));
    const totalLandedCost = parseFloat((freightCost + insuranceCost + dutiesCost + otherLandedCost).toFixed(2));

    const trueCost = parseFloat((netSupplierCost + totalLandedCost).toFixed(2));

    const vendorProfitPct = Math.max(0, Number(input.vendorProfitPct || 0));
    const vendorProfitAmount = parseFloat(((trueCost * vendorProfitPct) / 100).toFixed(2));
    const vendorPayout = parseFloat((trueCost + vendorProfitAmount).toFixed(2));

    const platformMarginPct = Number(settings.minimumPlatformMarginPct !== undefined ? settings.minimumPlatformMarginPct : 15);
    const marginRatio = platformMarginPct / 100;
    const baseSellingPrice = marginRatio < 1
      ? parseFloat((vendorPayout / (1 - marginRatio)).toFixed(2))
      : vendorPayout;

    const promotionDiscountPct = Math.max(0, Number(input.promotionDiscountPct || 0));
    const promoDiscountAmount = parseFloat(((baseSellingPrice * promotionDiscountPct) / 100).toFixed(2));
    const customerPrice = parseFloat(Math.max(0, baseSellingPrice - promoDiscountAmount).toFixed(2));

    const referralRewardPct = Math.max(0, Number(input.referralRewardPct || 0));
    const referralCost = parseFloat(((customerPrice * referralRewardPct) / 100).toFixed(2));

    const superCoinValue = Number(settings.superCoinValue !== undefined ? settings.superCoinValue : 0.10);
    const superCoinsUsed = Math.max(0, Number(input.superCoinsUsed || 0));
    const superCoinsCost = parseFloat((superCoinsUsed * superCoinValue).toFixed(2));

    const gatewayFeePct = Number(settings.gatewayFeePct !== undefined ? settings.gatewayFeePct : 2.5);
    const gatewayCost = parseFloat(((customerPrice * gatewayFeePct) / 100).toFixed(2));

    // Base Gross Margin before promotion
    const baseGrossMargin = parseFloat((baseSellingPrice - vendorPayout).toFixed(2));

    // "Who Pays?" Funding attribution rules
    const whoPaysGateway = settings.whoPaysGatewayFee || 'grand_store';
    const whoPaysPromo = settings.whoPaysPromotion || 'grand_store';
    const whoPaysReferral = settings.whoPaysReferral || 'grand_store';
    const whoPaysCoins = settings.whoPaysSuperCoins || 'grand_store';

    const getGsShare = (amount, whoPays) => {
      if (whoPays === 'vendor') return 0;
      if (whoPays === 'split') return parseFloat((amount * 0.5).toFixed(2));
      return amount; // default: grand_store
    };

    const gsPromoShare = getGsShare(promoDiscountAmount, whoPaysPromo);
    const gsReferralShare = getGsShare(referralCost, whoPaysReferral);
    const gsCoinsShare = getGsShare(superCoinsCost, whoPaysCoins);
    const gsGatewayShare = getGsShare(gatewayCost, whoPaysGateway);

    // Gross contribution after promotional discount absorption
    // When GS funds promo, Gross Margin = (customerPrice - vendorPayout) = baseGrossMargin - promoDiscountAmount
    // When Vendor funds promo, GS retains baseGrossMargin
    const grossContribution = parseFloat((baseGrossMargin - gsPromoShare).toFixed(2));

    const totalGsCosts = parseFloat((gsReferralShare + gsCoinsShare + gsGatewayShare).toFixed(2));
    const netContribution = parseFloat((grossContribution - totalGsCosts).toFixed(2));
    const effectiveNetMarginPct = customerPrice > 0
      ? parseFloat(((netContribution / customerPrice) * 100).toFixed(2))
      : 0;

    // Margin status thresholds (Section 9)
    const healthyThreshold = Number(settings.marginHealthyThresholdPct !== undefined ? settings.marginHealthyThresholdPct : 15);
    const warningThreshold = Number(settings.marginWarningThresholdPct !== undefined ? settings.marginWarningThresholdPct : 10);

    let marginStatus = 'healthy';
    if (effectiveNetMarginPct < warningThreshold) {
      marginStatus = 'blocked';
    } else if (effectiveNetMarginPct < healthyThreshold) {
      marginStatus = 'warning';
    }

    return {
      supplierPrice,
      supplierDiscountPct,
      supplierDiscountAmount,
      netSupplierCost,
      totalLandedCost,
      trueCost,
      vendorProfitPct,
      vendorProfitAmount,
      vendorPayout,
      platformMarginPct,
      baseSellingPrice,
      promotionDiscountPct,
      promoDiscountAmount,
      customerPrice,
      referralCost,
      superCoinsCost,
      gatewayCost,
      grossContribution,
      grossPlatformCommission: grossContribution,
      netContribution,
      effectiveNetMarginPct,
      marginStatus,
      whoPays: {
        gateway: whoPaysGateway,
        promotion: whoPaysPromo,
        referral: whoPaysReferral,
        superCoins: whoPaysCoins
      }
    };
  }

  /**
   * Generates the immutable order financial snapshot for Section 14 & 251.
   * Captures exact monetary contributions at checkout without risk of historical recalculation.
   */
  static calculateOrderFinancialSnapshot(order = {}, settings = {}) {
    const subTotal = Number(order.subTotal || order.totalPrice || 0);
    const commissionPct = Number(order.commissionPct || settings.marketplaceCommissionPct || 15);
    const grossPlatformCommission = parseFloat(((subTotal * commissionPct) / 100).toFixed(2));

    const gatewayFeePct = Number(order.gatewayFeePct || settings.gatewayFeePct || 2.5);
    const rawGatewayFee = parseFloat(((order.totalPrice * gatewayFeePct) / 100).toFixed(2));

    const superCoinsDiscount = Number(order.superCoinsDiscount || 0);
    const referralDiscount = Number(order.appliedWelcomeDiscount || 0) + Number(order.appliedRewards || 0);

    const whoPaysGateway = settings.whoPaysGatewayFee || 'grand_store';
    const whoPaysPromo = settings.whoPaysPromotion || 'grand_store';
    const whoPaysReferral = settings.whoPaysReferral || 'grand_store';
    const whoPaysCoins = settings.whoPaysSuperCoins || 'grand_store';

    const getGsDeduction = (amount, whoPays) => {
      if (whoPays === 'vendor') return 0;
      if (whoPays === 'split') return parseFloat((amount * 0.5).toFixed(2));
      return amount;
    };

    const gsGatewayAbsorbed = getGsDeduction(rawGatewayFee, whoPaysGateway);
    const gsCoinsAbsorbed = getGsDeduction(superCoinsDiscount, whoPaysCoins);
    const gsReferralAbsorbed = getGsDeduction(referralDiscount, whoPaysReferral);

    const netPlatformContribution = parseFloat((grossPlatformCommission - gsGatewayAbsorbed - gsCoinsAbsorbed - gsReferralAbsorbed).toFixed(2));
    const netMarginPct = subTotal > 0
      ? parseFloat(((netPlatformContribution / subTotal) * 100).toFixed(2))
      : 0;

    const healthyThreshold = Number(settings.marginHealthyThresholdPct !== undefined ? settings.marginHealthyThresholdPct : 15);
    const warningThreshold = Number(settings.marginWarningThresholdPct !== undefined ? settings.marginWarningThresholdPct : 10);

    let marginStatus = 'healthy';
    if (netMarginPct < warningThreshold) {
      marginStatus = 'blocked';
    } else if (netMarginPct < healthyThreshold) {
      marginStatus = 'warning';
    }

    const totalVendorPayouts = (order.vendorPayables || [])
      .filter(vp => Boolean(vp.vendorId))
      .reduce(
        (sum, vp) => sum + (Number(vp.netPayable) || 0),
        0
      );

    return {
      orderId: order._id || order.orderId,
      createdAt: new Date(),
      subTotal,
      totalPrice: order.totalPrice,
      grossPlatformCommission,
      totalVendorPayouts: totalVendorPayouts,
      gatewayFeeTotal: rawGatewayFee,
      gatewayFeeAbsorbedByGS: gsGatewayAbsorbed,
      superCoinsDiscountTotal: superCoinsDiscount,
      superCoinsAbsorbedByGS: gsCoinsAbsorbed,
      referralDiscountTotal: referralDiscount,
      referralAbsorbedByGS: gsReferralAbsorbed,
      netPlatformContribution,
      netMarginPct,
      marginStatus,
      fundingSourceSnapshot: {
        whoPaysGateway,
        whoPaysPromo,
        whoPaysReferral,
        whoPaysCoins
      }
    };
  }
}

module.exports = CostingEngine;
