const isSouthAfrica = (c) =>
  Boolean(c && ['south africa', 'za', 'rsa'].includes(String(c).trim().toLowerCase()));

const DEFAULT_INTERNATIONAL_CASE_DISCOUNT_PCT = 3;

const parseCaseSizeFromOption = (option) => {
  const m = String(option || '').trim().match(/^case\s+of\s+(\d+)\b/i);
  return m ? Math.max(1, parseInt(m[1], 10)) : null;
};

/**
 * Determines whether a checkout/order line item represents a multi-bottle case purchase.
 * @param {object} item - Cart or shipment line item
 * @param {object} product - Authoritative Product document from MongoDB
 * @returns {boolean}
 */
const isCaseOrderItem = (item, product) => {
  if (product?.supplyType === 'case_only') return true;
  if (item?.isCase === true || item?.isCase === 'true') return true;
  const opt = String(item?.option || '').trim().toLowerCase();
  return opt.startsWith('case of ') || /\b\d+\s*[×x]\s*.*case\b/i.test(opt);
};

/**
 * Computes authoritative case pricing for a product.
 * Supports configurable case sizes (e.g. Case of 6, Case of 12, or product's default bottlesPerCase).
 * Only international vendors (`vendorType === 'international'`) receive the dynamic
 * case discount; local SA vendors and Grand Store house stock keep regular price * bottlesPerCase
 * unless a custom casePrice was explicitly configured on the product for its default case size.
 */
const computeCaseSummary = (
  product,
  vendorType = null,
  internationalCaseDiscountPct = DEFAULT_INTERNATIONAL_CASE_DISCOUNT_PCT,
  requestedBottlesPerCase = null
) => {
  const effectiveVendorType = String(vendorType || product?.vendorType || '').trim().toLowerCase();
  const isInternationalVendor = effectiveVendorType === 'international';
  const defaultBottlesPerCase = Math.max(
    1,
    Number(product?.bottlesPerCase || product?.channelSettings?.trade?.bottlesPerCase || 6)
  );
  const parsedRequested = requestedBottlesPerCase ? Math.max(1, Math.round(Number(requestedBottlesPerCase))) : null;
  const allowedCaseSizes = new Set([6, 12, defaultBottlesPerCase]);
  const bottlesPerCase = parsedRequested && allowedCaseSizes.has(parsedRequested)
    ? parsedRequested
    : defaultBottlesPerCase;

  const singleBottlePrice = Number(product?.price || 0);
  const regularCasePrice = Math.round(singleBottlePrice * bottlesPerCase);
  const matchesDefaultCaseSize = bottlesPerCase === defaultBottlesPerCase;
  const customCasePrice = matchesDefaultCaseSize ? Number(product?.casePrice) : NaN;

  let effectiveCasePrice = regularCasePrice;
  if (isInternationalVendor) {
    if (Number.isFinite(customCasePrice) && customCasePrice > 0 && customCasePrice < regularCasePrice) {
      effectiveCasePrice = customCasePrice;
    } else {
      const pct = Math.min(90, Math.max(0, Number(internationalCaseDiscountPct) || 0));
      effectiveCasePrice = pct > 0
        ? Math.round(regularCasePrice * (1 - pct / 100))
        : regularCasePrice;
    }
  } else if (Number.isFinite(customCasePrice) && customCasePrice > 0) {
    effectiveCasePrice = customCasePrice;
  }

  const caseDiscountAmount = isInternationalVendor
    ? Math.max(0, regularCasePrice - effectiveCasePrice)
    : 0;
  const caseDiscountPct = isInternationalVendor && regularCasePrice > 0 && caseDiscountAmount > 0
    ? Number(((caseDiscountAmount / regularCasePrice) * 100).toFixed(1))
    : 0;

  return {
    isInternationalVendor,
    defaultBottlesPerCase,
    bottlesPerCase,
    singleBottlePrice,
    regularCasePrice,
    effectiveCasePrice,
    caseDiscountAmount,
    caseDiscountPct,
  };
};

/**
 * Resolves authoritative server-side pricing, bottle count, weight, and box dimensions
 * for a single bottle, a Case of 6, or a Case of 12 purchase.
 */
const resolveCaseItemPricing = (item, product, options = {}) => {
  const isCase = isCaseOrderItem(item, product);

  if (!isCase) {
    return {
      isCase: false,
      bottlesPerCase: 1,
      unitPrice: Number(product.price || 0),
      regularCasePrice: Number(product.price || 0),
      caseDiscountAmount: 0,
      caseDiscountPct: 0,
      unitWeightKg: Number(product.shipping?.weight_kg || product.weight_kg || 1.85),
      dimensions: {
        length_cm: Number(product.shipping?.length_cm || product.length_cm || 12),
        width_cm: Number(product.shipping?.width_cm || product.width_cm || 12),
        height_cm: Number(product.shipping?.height_cm || product.height_cm || 34),
        box_type: product.shipping?.box_type || 'Standard Box',
      },
    };
  }

  const optionCaseSize = parseCaseSizeFromOption(item?.option);
  const explicitBpc = Number(item?.bottlesPerCase);
  const requestedCaseSize = optionCaseSize || (Number.isFinite(explicitBpc) && explicitBpc > 1 ? explicitBpc : null);

  const summary = computeCaseSummary(
    product,
    options.vendorType,
    options.internationalCaseDiscountPct !== undefined
      ? options.internationalCaseDiscountPct
      : DEFAULT_INTERNATIONAL_CASE_DISCOUNT_PCT,
    requestedCaseSize
  );

  const matchesDefaultSize = summary.bottlesPerCase === summary.defaultBottlesPerCase;
  const singleBottleWeight = Number(product.shipping?.weight_kg || product.weight_kg || 1.5);
  const unitWeightKg =
    matchesDefaultSize && product.caseWeight && Number(product.caseWeight) > 0
      ? Number(product.caseWeight)
      : Number((singleBottleWeight * summary.bottlesPerCase + 0.4).toFixed(2));

  const customDims = matchesDefaultSize ? product.caseDimensions : null;

  return {
    isCase: true,
    isInternationalVendor: summary.isInternationalVendor,
    bottlesPerCase: summary.bottlesPerCase,
    unitPrice: summary.effectiveCasePrice,
    regularCasePrice: summary.regularCasePrice,
    caseDiscountAmount: summary.caseDiscountAmount,
    caseDiscountPct: summary.caseDiscountPct,
    unitWeightKg,
    dimensions: {
      length_cm: Number(customDims?.length_cm || (summary.bottlesPerCase >= 12 ? 38 : 32)),
      width_cm: Number(customDims?.width_cm || (summary.bottlesPerCase >= 12 ? 30 : 26)),
      height_cm: Number(customDims?.height_cm || 35),
      box_type: `Certified Case Shipper (${summary.bottlesPerCase} Bottles)`,
    },
  };
};

module.exports = {
  DEFAULT_INTERNATIONAL_CASE_DISCOUNT_PCT,
  parseCaseSizeFromOption,
  isCaseOrderItem,
  computeCaseSummary,
  resolveCaseItemPricing,
  isSouthAfrica,
};
