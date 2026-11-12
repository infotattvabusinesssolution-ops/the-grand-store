const SOUTH_AFRICA_ALIASES = new Set(['south africa', 'za', 'rsa']);

export const isSouthAfricaCountry = (country) => {
  if (!country) return false;
  return SOUTH_AFRICA_ALIASES.has(String(country).trim().toLowerCase());
};

const INTERNATIONAL_VENDOR_PATTERNS = [
  'cantina del conte',
  'dogliotti',
  'giuliani',
  'bruno andreu',
  'maison dobb',
  'dobbe',
  'dobbé',
];

const LOCAL_VENDOR_PATTERNS = [
  'the grand store',
  'long dog',
  'tesselaarsdal',
  'hamilton russell',
  'mont rochelle',
  'crazy wine',
];

const inferInternationalOrigin = (item) => {
  const candidates = [
    item?.dispatchOrigin,
    item?.pickupCountry,
    item?.originCountry,
    item?.country,
  ];
  for (const c of candidates) {
    if (c && !isSouthAfricaCountry(c)) return String(c).trim();
  }
  const label = `${item?.storeName || ''} ${item?.brand || ''} ${item?.name || item?.fullName || ''}`.toLowerCase();
  if (label.includes('cantina del conte') || label.includes('dogliotti') || label.includes('giuliani')) {
    return 'Italy';
  }
  if (label.includes('bruno andreu') || label.includes('dobb')) {
    return 'France';
  }
  return 'International';
};

/**
 * Classifies a cart item as either Local (South Africa) or International dispatch.
 * Relies primarily on vendorType ('international' vs 'local'/'flagship'), preventing
 * false positives on Grand Store warehouse stock whose product `country` field records
 * beverage provenance (e.g. Germany, Belgium, Scotland, France).
 */
export const getCartItemOriginInfo = (item) => {
  if (!item) {
    return { scope: 'local', isInternational: false, originLabel: 'South Africa' };
  }

  const vendorType = String(item.vendorType || '').trim().toLowerCase();
  if (vendorType === 'international') {
    return {
      scope: 'international',
      isInternational: true,
      originLabel: inferInternationalOrigin(item),
    };
  }
  if (vendorType === 'local' || vendorType === 'flagship') {
    return {
      scope: 'local',
      isInternational: false,
      originLabel: 'South Africa',
    };
  }

  // Fallback for cached cart items loaded before product enrichment completes
  const storeName = String(item.storeName || item.vendor?.name || '').toLowerCase();
  const brandAndName = `${storeName} ${item.brand || ''} ${item.name || item.fullName || ''}`.toLowerCase();

  if (INTERNATIONAL_VENDOR_PATTERNS.some((pattern) => brandAndName.includes(pattern))) {
    return {
      scope: 'international',
      isInternational: true,
      originLabel: inferInternationalOrigin(item),
    };
  }

  const storeId = String(item.storeId || '').trim().toLowerCase();
  if (
    storeId === 'admin' ||
    (!item.vendorId && !item.storeId) ||
    LOCAL_VENDOR_PATTERNS.some((pattern) => brandAndName.includes(pattern))
  ) {
    return {
      scope: 'local',
      isInternational: false,
      originLabel: 'South Africa',
    };
  }

  if ((item.vendorId || item.storeId) && item.country && !isSouthAfricaCountry(item.country)) {
    return {
      scope: 'international',
      isInternational: true,
      originLabel: inferInternationalOrigin(item),
    };
  }

  return {
    scope: 'local',
    isInternational: false,
    originLabel: 'South Africa',
  };
};

/**
 * Evaluates whether the checkout cart mixes Local and International products and identifies
 * which items conflict with the customer's selected delivery mode.
 */
export const analyzeCartScopeConflict = (cartItems = [], destinationMode = 'domestic_sa') => {
  const localItems = [];
  const internationalItems = [];

  for (const item of cartItems) {
    const info = getCartItemOriginInfo(item);
    const classified = { ...item, ...info };
    if (info.isInternational) {
      internationalItems.push(classified);
    } else {
      localItems.push(classified);
    }
  }

  const hasMixedItems = localItems.length > 0 && internationalItems.length > 0;
  const hasIntlInDomesticMode =
    destinationMode === 'domestic_sa' &&
    localItems.length === 0 &&
    internationalItems.length > 0;
  const hasConflict = hasMixedItems || hasIntlInDomesticMode;

  const conflictReason = hasMixedItems
    ? 'mixed'
    : hasIntlInDomesticMode
      ? 'intl_in_domestic'
      : null;

  const recommendedRemoveScope =
    hasMixedItems
      ? (destinationMode === 'domestic_sa' ? 'international' : 'local')
      : hasIntlInDomesticMode
        ? 'international'
        : null;

  const conflictingItems = hasConflict
    ? (recommendedRemoveScope === 'international' ? internationalItems : localItems)
    : [];
  const keepingItems = hasMixedItems
    ? (recommendedRemoveScope === 'international' ? localItems : internationalItems)
    : [];

  let warningMessage = '';
  if (conflictReason === 'intl_in_domestic') {
    warningMessage =
      'International products require International Delivery — remove the highlighted item from Summary or switch to International Delivery.';
  } else if (conflictReason === 'mixed') {
    warningMessage =
      recommendedRemoveScope === 'international'
        ? 'Local & International products can’t be ordered together — remove the highlighted International item from Summary.'
        : 'Local & International products can’t be ordered together — remove the highlighted Local item from Summary.';
  }

  return {
    hasConflict,
    conflictReason,
    hasMixedItems,
    hasIntlInDomesticMode,
    localItems,
    internationalItems,
    recommendedRemoveScope,
    conflictingItems,
    keepingItems,
    warningMessage,
  };
};

