/**
 * Automated Verification Test Suite for TCG Rate Card Engine & Service Client
 * Validates contractual formulas from "Courier_Rate_Card_1_Sep_2026_v14.xlsx"
 */

const {
  calculateChargeableWeight,
  determinePudoLockerSize,
  calculateInsurance,
  calculateDoorDeliveryRate,
  calculatePudoLockerRate,
  PUDO_LOCKER_TIERS,
  DOOR_RATES_EXCL_VAT,
  DEFAULT_FUEL_LEVY_RATE,
  DEFAULT_VAT_RATE
} = require('../engines/tcgRateCardEngine');

const { tcgService, TCG_ENDPOINTS } = require('../services/tcgService');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

function assertClose(actual, expected, message, tolerance = 0.05) {
  const diff = Math.abs(actual - expected);
  if (diff <= tolerance) {
    console.log(`  ✓ ${message} (${actual} ≈ ${expected})`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message} (Expected ${expected}, got ${actual}, diff ${diff})`);
    failed++;
  }
}

console.log('\n=== RUNNING TCG RATE CARD & SERVICE TEST SUITE ===\n');

// ----------------------------------------------------------------------------
// 1. VOLUMETRIC WEIGHT & CHARGEABLE WEIGHT TESTS
// ----------------------------------------------------------------------------
console.log('1. Testing Volumetric & Chargeable Weight Calculations:');

// Test 1A: Wine Bottle Box (35x12x12 cm, actual 1.5kg) on Road (/4000)
// Volumetric: (35 * 12 * 12) / 4000 = 5040 / 4000 = 1.26 kg
// Actual (1.5kg) > Volumetric (1.26kg) -> Chargeable weight = 1.5 rounded per 0.4 rule -> 2.0 kg
const wineBoxRoad = calculateChargeableWeight({ length: 35, width: 12, height: 12 }, 1.5, 'road');
assert(wineBoxRoad === 2, 'Single wine bottle box chargeable weight on Economy Road is 2kg');

// Test 1B: Bulky light gift hamper (50x40x30 cm, actual 2kg) on Road (/4000)
// Volumetric: (50 * 40 * 30) / 4000 = 60000 / 4000 = 15 kg
// Volumetric (15kg) > Actual (2kg) -> Chargeable weight = 15 kg
const bulkyHamperRoad = calculateChargeableWeight({ length: 50, width: 40, height: 30 }, 2, 'road');
assert(bulkyHamperRoad === 15, 'Bulky hamper volumetric weight (15kg) overrides actual weight (2kg)');

// Test 1C: Express Divisor (/5000)
// Hamper on Express: 60000 / 5000 = 12 kg
const bulkyHamperExpress = calculateChargeableWeight({ length: 50, width: 40, height: 30 }, 2, 'express');
assert(bulkyHamperExpress === 12, 'Express priority uses /5000 divisor yielding 12kg');

// ----------------------------------------------------------------------------
// 2. PUDO SMART LOCKER SIZING TESTS
// ----------------------------------------------------------------------------
console.log('\n2. Testing PUDO Smart Locker Sizing Algorithm:');

// Test 2A: Single slim item fits into XS locker (max 58x15x6 cm, 2kg)
const xsSize = determinePudoLockerSize({ length: 20, width: 14, height: 5 }, 1.0);
assert(xsSize === 'XS', 'Small book/accessory correctly assigned to XS locker');

// Test 2B: Standard wine bottle box (35x12x12 cm, 1.5kg)
// Height is 12cm, XS height limit is 6cm, so it requires Medium (M has height up to 17cm)
const wineLockerSize = determinePudoLockerSize({ length: 35, width: 12, height: 12 }, 1.5);
assert(wineLockerSize === 'M', 'Wine bottle box (12cm height) correctly assigned to Medium (M) locker');

// Test 2C: 6-Bottle Case (35x28x20 cm, 9kg)
// Dimensions fit in Large (L: 58x39x39 cm, max 15kg)
const case6Size = determinePudoLockerSize({ length: 35, width: 28, height: 20 }, 9);
assert(case6Size === 'L', '6-bottle wine case assigned to Large (L) locker');

// Test 2D: Over 20kg limit returns null (not accepted in lockers)
const heavyParcel = determinePudoLockerSize({ length: 30, width: 20, height: 10 }, 22);
assert(heavyParcel === null, 'Parcel over 20kg rejected from PUDO lockers (returns null)');

// ----------------------------------------------------------------------------
// 3. INSURANCE CALCULATION TESTS
// ----------------------------------------------------------------------------
console.log('\n3. Testing Goods in Transit Insurance Formulas:');

// Test 3A: Value <= R1000 is free
const insFree = calculateInsurance(850);
assert(insFree.insuranceExclVat === 0, 'Declared value under R1000 has R0 insurance charge');

// Test 3B: Value R5000 (Excess R4000 @ 2% = R80 excl VAT)
const ins5k = calculateInsurance(5000);
assertClose(ins5k.insuranceExclVat, 80.00, 'R5,000 item generates R80 excl VAT insurance');

// Test 3C: Minimum charge test (R1,500 item -> Excess R500 @ 2% = R10, but minimum is R50 excl / R57.50 incl)
const insMin = calculateInsurance(1500);
assertClose(insMin.insuranceInclVat, 57.50, 'Minimum insurance charge of R57.50 (incl. VAT) enforced');

// ----------------------------------------------------------------------------
// 4. RATE CARD CONTRACTUAL MATCH TESTS (September 2026 Sheet)
// ----------------------------------------------------------------------------
console.log('\n4. Testing Contractual Rate Card Match (Against Excel Figures):');

// Test 4A: Economy Road Tier 1 (up to 2kg)
// Base excl VAT: R94.96
// Fuel levy 16.5%: 94.96 * 0.165 = R15.67
// Subtotal excl VAT: 94.96 + 15.67 = R110.63
// VAT 15%: 110.63 * 0.15 = R16.59
// Total: R127.22
const ecoTier1 = calculateDoorDeliveryRate({
  weightKg: 1.5,
  dimensions: { length: 20, width: 15, height: 10 },
  serviceCode: 'ECO'
});
assertClose(ecoTier1.breakdown.baseRateExclVat, 94.96, 'ECO Tier 1 base rate is R94.96');
assertClose(ecoTier1.breakdown.fuelSurchargeAmount, 15.67, 'ECO Tier 1 fuel surcharge (16.5%) is R15.67');
assertClose(ecoTier1.cost, 127.22, 'ECO Tier 1 total price incl VAT is R127.22');

// Test 4B: PUDO Smart Locker (Locker to Locker, Size M)
// Rate Card Sheet 1 Row 509: M Locker<->Locker is R68.70 excl VAT
// Fuel Surcharge for Locker<->Locker: 0%
// VAT 15%: 68.70 * 0.15 = R10.31
// Total: R79.01 (Contractual R79.00 inclusive)
const pudoM = calculatePudoLockerRate({
  lockerSize: 'M',
  deliveryType: 'lockerToLocker'
});
assertClose(pudoM.breakdown.baseRateExclVat, 68.70, 'PUDO M locker base rate is R68.70 excl VAT');
assert(pudoM.breakdown.fuelSurchargeAmount === 0, 'PUDO Locker-to-Locker carries 0% fuel surcharge');
assertClose(pudoM.cost, 79.01, 'PUDO M locker total matches contractual R79.00 rate');

// Test 4C: PUDO Smart Locker (Door to Locker, Size S)
// Rate Card Sheet 1 Row 508: S Door<->Locker is R77.39 excl VAT
// Fuel surcharge: Half standard levy (8.25%) = 77.39 * 0.0825 = R6.38
// Subtotal excl VAT: 77.39 + 6.38 = R83.77
// VAT 15%: 83.77 * 0.15 = R12.57
// Total: R96.34
const pudoSDoor = calculatePudoLockerRate({
  lockerSize: 'S',
  deliveryType: 'doorToLocker'
});
assertClose(pudoSDoor.breakdown.baseRateExclVat, 77.39, 'PUDO S Door-to-Locker base is R77.39 excl VAT');
assertClose(pudoSDoor.breakdown.fuelSurchargeAmount, 6.38, 'Door-to-Locker carries 8.25% half-fuel levy');
assertClose(pudoSDoor.cost, 96.34, 'PUDO S Door-to-Locker total price is R96.34 incl VAT');

// ----------------------------------------------------------------------------
// 5. TCG SERVICE CLIENT INTEGRITY TESTS
// ----------------------------------------------------------------------------
console.log('\n5. Testing TCG Service Client Configuration & Rules:');

assert(TCG_ENDPOINTS.live === 'https://api.portal.thecourierguy.co.za', 'Live endpoint is api.portal.thecourierguy.co.za');
assert(TCG_ENDPOINTS.sandbox === 'https://api.shiplogic.com', 'Sandbox endpoint is api.shiplogic.com');

// Test clean address rules (Coordinates omitted when missing/zero)
const dirtyAddress = {
  street: '15 Main St',
  city: 'Sandton',
  province: 'Gauteng',
  postalCode: '2196',
  lat: 0, // Should be omitted
  lng: null // Should be omitted
};
const cleaned = tcgService.cleanAddress(dirtyAddress);
assert(cleaned.street_address === '15 Main St', 'Street address mapped correctly');
assert(cleaned.latitude === undefined && cleaned.longitude === undefined, 'Zero and null coordinates safely stripped to prevent 422 errors');

// Test phone cleaning rule
const dirtyPhone = '+27-82-123-4567';
const cleanPhone = tcgService.cleanPhoneNumber(dirtyPhone);
assert(cleanPhone === '+27821234567', 'Phone numbers stripped of hyphens and spaces');

console.log(`\n=== RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
