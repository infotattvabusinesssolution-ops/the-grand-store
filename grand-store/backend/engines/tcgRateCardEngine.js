/**
 * The Courier Guy (TCG) & PUDO Rate Card Calculation Engine
 * Implements contractual rates and formulas from:
 * "Courier_Rate_Card_1_Sep_2026_v14.xlsx" (Effective 1 September 2026)
 *
 * Provides offline calculation and fallback quoting for The Grand Store.
 */

// Global Tax & Surcharges (Contractual Defaults)
const DEFAULT_VAT_RATE = 0.15; // 15% South African VAT
const DEFAULT_FUEL_LEVY_RATE = 0.165; // 16.5% standard fuel levy
const DEFAULT_LOCKER_DOOR_FUEL_LEVY_RATE = 0.0825; // Half fuel levy for Door<->Locker
const FREE_INSURANCE_THRESHOLD = 1000.00; // First R1000 value covered free
const INSURANCE_RATE = 0.02; // 2% on value above threshold
const MIN_INSURANCE_CHARGE_INCL_VAT = 57.50; // Minimum insurance charge (R50 + VAT)

// Volumetric Divisors
const VOLUMETRIC_DIVISOR_ROAD = 4000; // Economy Road (ECO, ECOR, ECORR)
const VOLUMETRIC_DIVISOR_EXPRESS = 5000; // Priority & Local (PRI, PRIR, LPF, LPP)

/**
 * PUDO Smart Locker Tier Specifications & Rates (Excl. VAT)
 * Locker Dimensions: Max length, width, height (cm) and weight (kg)
 */
const PUDO_LOCKER_TIERS = {
  XS: {
    name: 'Extra Small',
    maxWeightKg: 2,
    internalDimensions: { length: 60, width: 17, height: 8 },
    maxParcelDimensions: { length: 58, width: 15, height: 6 },
    ratesExclVat: {
      lockerToLocker: 51.30,
      doorToLocker: 68.70,
      lockerToKiosk: 60.00,
      kioskToDoor: 80.87
    }
  },
  S: {
    name: 'Small',
    maxWeightKg: 5,
    internalDimensions: { length: 60, width: 41, height: 8 },
    maxParcelDimensions: { length: 58, width: 39, height: 6 },
    ratesExclVat: {
      lockerToLocker: 60.00,
      doorToLocker: 77.39,
      lockerToKiosk: 68.70,
      kioskToDoor: 91.30
    }
  },
  M: {
    name: 'Medium',
    maxWeightKg: 10,
    internalDimensions: { length: 60, width: 41, height: 19 },
    maxParcelDimensions: { length: 58, width: 39, height: 17 },
    ratesExclVat: {
      lockerToLocker: 68.70,
      doorToLocker: 103.48,
      lockerToKiosk: 77.39,
      kioskToDoor: 117.39
    }
  },
  L: {
    name: 'Large',
    maxWeightKg: 15,
    internalDimensions: { length: 60, width: 41, height: 41 },
    maxParcelDimensions: { length: 58, width: 39, height: 39 },
    ratesExclVat: {
      lockerToLocker: 94.78,
      doorToLocker: 153.04,
      lockerToKiosk: 112.17,
      kioskToDoor: 182.61
    }
  },
  XL: {
    name: 'Extra Large',
    maxWeightKg: 20,
    internalDimensions: { length: 60, width: 41, height: 69 },
    maxParcelDimensions: { length: 58, width: 39, height: 67 },
    ratesExclVat: {
      lockerToLocker: 129.57,
      doorToLocker: 207.83,
      lockerToKiosk: 146.96,
      kioskToDoor: 243.48
    }
  }
};

/**
 * Standard Door Delivery Base Rates (Excl. VAT) - 1 September 2026 Rate Card
 */
const DOOR_RATES_EXCL_VAT = {
  // Local Priority Flyer (up to 5kg, R13.04/kg thereafter)
  LPF: {
    baseWeightKg: 5,
    baseRateExclVat: 94.96,
    perKgThereafterExclVat: 13.04
  },
  // Local Priority Parcel (up to 15kg, R13.04/kg thereafter)
  LPP: {
    baseWeightKg: 15,
    baseRateExclVat: 109.20,
    perKgThereafterExclVat: 13.04
  },
  // National Economy Road (6 Weight Tiers up to 35kg)
  ECO: {
    tiers: [
      { upToKg: 2, rateExclVat: 94.96 },
      { upToKg: 5, rateExclVat: 104.00 },
      { upToKg: 10, rateExclVat: 149.22 },
      { upToKg: 15, rateExclVat: 180.87 },
      { upToKg: 25, rateExclVat: 257.74 },
      { upToKg: 35, rateExclVat: 453.39 }
    ],
    perKgThereafterExclVat: 17.39
  },
  // Regional Economy Road (6 Weight Tiers up to 35kg)
  ECOR: {
    tiers: [
      { upToKg: 2, rateExclVat: 104.09 },
      { upToKg: 5, rateExclVat: 106.00 },
      { upToKg: 10, rateExclVat: 152.80 },
      { upToKg: 15, rateExclVat: 185.22 },
      { upToKg: 25, rateExclVat: 263.93 },
      { upToKg: 35, rateExclVat: 459.59 }
    ],
    perKgThereafterExclVat: 21.39
  },
  // Regional to Regional Economy Road
  ECORR: {
    tiers: [
      { upToKg: 2, rateExclVat: 108.65 },
      { upToKg: 5, rateExclVat: 110.57 },
      { upToKg: 10, rateExclVat: 157.37 },
      { upToKg: 15, rateExclVat: 189.78 },
      { upToKg: 25, rateExclVat: 268.50 },
      { upToKg: 35, rateExclVat: 464.15 }
    ],
    perKgThereafterExclVat: 21.39
  },
  // Priority Courier - National (formerly OVN, up to 2kg)
  PRI: {
    baseWeightKg: 2,
    baseRateExclVat: 151.93,
    perKgThereafterExclVat: 48.00
  },
  // Priority Courier - Regional (formerly OVNR, up to 2kg)
  PRIR: {
    baseWeightKg: 2,
    baseRateExclVat: 166.54,
    perKgThereafterExclVat: 48.00
  }
};

/**
 * Major South African Metro Centers (Used for Local vs National/Regional routing)
 */
const MAJOR_METROS = [
  'johannesburg', 'pretoria', 'sandton', 'midrand', 'centurion', 'east rand', 'west rand',
  'cape town', 'bellville', 'stellenbosch', 'somerset west', 'paarl',
  'durban', 'umhlanga', 'pinetown',
  'port elizabeth', 'gqeberha',
  'bloemfontein',
  'east london'
];

/**
 * Calculate Chargeable Weight per TCG Rules
 * Chargeable weight = max(actualWeight, volumetricWeight), rounded per decimal 0.4 rule
 *
 * @param {Object} dimensions - { length, width, height } in cm
 * @param {number} actualWeightKg - Physical weight in kg
 * @param {string} serviceCategory - 'road' (ECO) or 'express' (PRI/LPF)
 * @returns {number} Chargeable weight in kg
 */
function calculateChargeableWeight(dimensions = {}, actualWeightKg = 1, serviceCategory = 'road') {
  const l = Math.max(1, Number(dimensions.length || dimensions.submitted_length_cm || 30));
  const w = Math.max(1, Number(dimensions.width || dimensions.submitted_width_cm || 20));
  const h = Math.max(1, Number(dimensions.height || dimensions.submitted_height_cm || 10));
  const actual = Math.max(0.1, Number(actualWeightKg || 1));

  const divisor = serviceCategory === 'express' ? VOLUMETRIC_DIVISOR_EXPRESS : VOLUMETRIC_DIVISOR_ROAD;
  const volumetric = (l * w * h) / divisor;

  const rawWeight = Math.max(actual, volumetric);

  // Rate card rounding rule: once decimal part reaches >= 0.4, round up to next integer
  const integerPart = Math.floor(rawWeight);
  const decimalPart = rawWeight - integerPart;

  if (integerPart === 0) {
    return decimalPart >= 0.4 ? 1.0 : Math.max(0.5, Math.ceil(decimalPart * 10) / 10);
  }

  return decimalPart >= 0.4 ? integerPart + 1 : integerPart;
}

/**
 * Determine the smallest PUDO Locker size that will fit the parcel
 *
 * @param {Object} dimensions - { length, width, height } in cm
 * @param {number} weightKg - Weight in kg
 * @returns {string|null} Locker tier code ('XS', 'S', 'M', 'L', 'XL') or null if oversized
 */
function determinePudoLockerSize(dimensions = {}, weightKg = 1) {
  const l = Math.max(1, Number(dimensions.length || dimensions.submitted_length_cm || 30));
  const w = Math.max(1, Number(dimensions.width || dimensions.submitted_width_cm || 20));
  const h = Math.max(1, Number(dimensions.height || dimensions.submitted_height_cm || 10));
  const wt = Math.max(0.1, Number(weightKg || 1));

  // Sort dimensions ascending so we can orient parcel into locker compartment
  const sortedDims = [l, w, h].sort((a, b) => a - b);

  for (const tierKey of ['XS', 'S', 'M', 'L', 'XL']) {
    const tier = PUDO_LOCKER_TIERS[tierKey];
    if (wt > tier.maxWeightKg) continue;

    const lockerDims = [
      tier.maxParcelDimensions.length,
      tier.maxParcelDimensions.width,
      tier.maxParcelDimensions.height
    ].sort((a, b) => a - b);

    if (
      sortedDims[0] <= lockerDims[0] &&
      sortedDims[1] <= lockerDims[1] &&
      sortedDims[2] <= lockerDims[2]
    ) {
      return tierKey;
    }
  }

  return null; // Exceeds XL locker dimensions or 20kg limit
}

/**
 * Calculate Insurance Surcharge
 *
 * @param {number} declaredValue - Total value of goods in ZAR
 * @returns {Object} { insuranceExclVat, insuranceInclVat, isInsured }
 */
function calculateInsurance(declaredValue = 0) {
  const value = Math.max(0, Number(declaredValue) || 0);
  if (value <= FREE_INSURANCE_THRESHOLD) {
    return {
      insuranceExclVat: 0,
      insuranceInclVat: 0,
      isInsured: value > 0
    };
  }

  const excess = value - FREE_INSURANCE_THRESHOLD;
  const calculatedChargeExcl = excess * INSURANCE_RATE;
  const minChargeExcl = Number((MIN_INSURANCE_CHARGE_INCL_VAT / (1 + DEFAULT_VAT_RATE)).toFixed(2));
  const finalChargeExcl = Math.max(minChargeExcl, calculatedChargeExcl);
  const finalChargeIncl = Number((finalChargeExcl * (1 + DEFAULT_VAT_RATE)).toFixed(2));

  return {
    insuranceExclVat: Number(finalChargeExcl.toFixed(2)),
    insuranceInclVat: finalChargeIncl,
    isInsured: true
  };
}

/**
 * Calculate Door-to-Door Delivery Rate
 *
 * @param {Object} params
 * @param {string} params.originCity
 * @param {string} params.destCity
 * @param {number} params.weightKg
 * @param {Object} params.dimensions - { length, width, height }
 * @param {string} [params.serviceCode='ECO'] - 'ECO', 'ECOR', 'ECORR', 'PRI', 'PRIR', 'LPF', 'LPP'
 * @param {number} [params.declaredValue=0]
 * @param {number} [params.fuelLevyRate=0.165]
 * @param {number} [params.vatRate=0.15]
 * @returns {Object} Complete pricing breakdown (base, fuel, insurance, VAT, total)
 */
function calculateDoorDeliveryRate(params = {}) {
  const {
    originCity = '',
    destCity = '',
    weightKg = 1,
    dimensions = { length: 30, width: 20, height: 10 },
    serviceCode = 'ECO',
    declaredValue = 0,
    fuelLevyRate = DEFAULT_FUEL_LEVY_RATE,
    vatRate = DEFAULT_VAT_RATE
  } = params;

  const isExpress = ['PRI', 'PRIR', 'LPF'].includes(serviceCode);
  const chargeableWeight = calculateChargeableWeight(
    dimensions,
    weightKg,
    isExpress ? 'express' : 'road'
  );

  let baseRateExclVat = 0;

  // 1. Tiered Services (ECO, ECOR, ECORR)
  if (['ECO', 'ECOR', 'ECORR'].includes(serviceCode)) {
    const config = DOOR_RATES_EXCL_VAT[serviceCode] || DOOR_RATES_EXCL_VAT.ECO;
    const tier = config.tiers.find(t => chargeableWeight <= t.upToKg);

    if (tier) {
      baseRateExclVat = tier.rateExclVat;
    } else {
      // Exceeds 35kg - calculate per kg thereafter
      const maxTier = config.tiers[config.tiers.length - 1];
      const excessWeight = Math.ceil(chargeableWeight - maxTier.upToKg);
      baseRateExclVat = Number((maxTier.rateExclVat + (excessWeight * config.perKgThereafterExclVat)).toFixed(2));
    }
  }
  // 2. Base + Per-Kg Services (PRI, PRIR, LPF, LPP)
  else if (['PRI', 'PRIR', 'LPF', 'LPP'].includes(serviceCode)) {
    const config = DOOR_RATES_EXCL_VAT[serviceCode] || DOOR_RATES_EXCL_VAT.PRI;
    baseRateExclVat = config.baseRateExclVat;

    if (chargeableWeight > config.baseWeightKg) {
      const excessWeight = Math.ceil(chargeableWeight - config.baseWeightKg);
      baseRateExclVat = Number((baseRateExclVat + (excessWeight * config.perKgThereafterExclVat)).toFixed(2));
    }
  } else {
    // Fallback standard ECO
    baseRateExclVat = 94.96;
  }

  // Insurance
  const insurance = calculateInsurance(declaredValue);

  // Surcharges (Fuel Levy applied to base rate)
  const fuelSurchargeAmount = Number((baseRateExclVat * fuelLevyRate).toFixed(2));
  const subtotalExclVat = Number((baseRateExclVat + fuelSurchargeAmount + insurance.insuranceExclVat).toFixed(2));
  const vatAmount = Number((subtotalExclVat * vatRate).toFixed(2));
  const totalCost = Number((subtotalExclVat + vatAmount).toFixed(2));

  return {
    courierName: 'The Courier Guy',
    serviceCode,
    serviceLevel: serviceCode === 'PRI' || serviceCode === 'PRIR'
      ? 'The Courier Guy - Priority Overnight'
      : 'The Courier Guy - Economy Road',
    deliveryType: 'home',
    estimatedDays: serviceCode === 'PRI' || serviceCode === 'PRIR' ? '1–2 business days' : '2–4 business days',
    chargeableWeightKg: chargeableWeight,
    actualWeightKg: Number(weightKg),
    breakdown: {
      baseRateExclVat,
      fuelSurchargeAmount,
      insuranceExclVat: insurance.insuranceExclVat,
      subtotalExclVat,
      vatAmount
    },
    cost: (serviceCode === 'ECO' || serviceCode === 'ECOR' || serviceCode === 'ECORR') ? 0 : totalCost,
    originalCost: totalCost,
    isFreeDelivery: (serviceCode === 'ECO' || serviceCode === 'ECOR' || serviceCode === 'ECORR'),
    currency: 'ZAR'
  };
}

/**
 * Calculate PUDO Smart Locker Delivery Rate
 *
 * @param {Object} params
 * @param {string} [params.lockerSize='S'] - 'XS', 'S', 'M', 'L', 'XL'
 * @param {string} [params.deliveryType='doorToLocker'] - 'lockerToLocker' or 'doorToLocker'
 * @param {number} [params.declaredValue=0]
 * @param {number} [params.vatRate=0.15]
 * @returns {Object} Complete pricing breakdown
 */
function calculatePudoLockerRate(params = {}) {
  const {
    lockerSize = 'S',
    deliveryType = 'doorToLocker', // Most common for e-commerce (Vendor Door -> PUDO Locker)
    declaredValue = 0,
    vatRate = DEFAULT_VAT_RATE
  } = params;

  const tierKey = PUDO_LOCKER_TIERS[lockerSize] ? lockerSize : 'S';
  const tier = PUDO_LOCKER_TIERS[tierKey];

  const rateKey = deliveryType === 'lockerToLocker' ? 'lockerToLocker' : 'doorToLocker';
  const baseRateExclVat = tier.ratesExclVat[rateKey] || tier.ratesExclVat.doorToLocker;

  // PUDO fuel surcharge rule:
  // Locker<->Locker = 0% fuel surcharge
  // Door<->Locker = Half standard fuel levy (8.25%)
  const fuelLevyRate = deliveryType === 'lockerToLocker' ? 0 : DEFAULT_LOCKER_DOOR_FUEL_LEVY_RATE;
  const fuelSurchargeAmount = Number((baseRateExclVat * fuelLevyRate).toFixed(2));

  // Insurance
  const insurance = calculateInsurance(declaredValue);

  const subtotalExclVat = Number((baseRateExclVat + fuelSurchargeAmount + insurance.insuranceExclVat).toFixed(2));
  const vatAmount = Number((subtotalExclVat * vatRate).toFixed(2));
  const totalCost = Number((subtotalExclVat + vatAmount).toFixed(2));

  return {
    courierName: 'The Courier Guy (PUDO)',
    serviceCode: deliveryType === 'lockerToLocker' ? 'L2L' : 'D2L',
    serviceLevel: `PUDO Smart Locker (${tier.name} - Box Size ${tierKey})`,
    deliveryType: 'pickup',
    estimatedDays: '2–3 business days',
    lockerSize: tierKey,
    maxWeightKg: tier.maxWeightKg,
    maxDimensions: tier.maxParcelDimensions,
    breakdown: {
      baseRateExclVat,
      fuelSurchargeAmount,
      insuranceExclVat: insurance.insuranceExclVat,
      subtotalExclVat,
      vatAmount
    },
    cost: totalCost,
    currency: 'ZAR'
  };
}

module.exports = {
  calculateChargeableWeight,
  determinePudoLockerSize,
  calculateInsurance,
  calculateDoorDeliveryRate,
  calculatePudoLockerRate,
  PUDO_LOCKER_TIERS,
  DOOR_RATES_EXCL_VAT,
  DEFAULT_VAT_RATE,
  DEFAULT_FUEL_LEVY_RATE,
  DEFAULT_LOCKER_DOOR_FUEL_LEVY_RATE
};
