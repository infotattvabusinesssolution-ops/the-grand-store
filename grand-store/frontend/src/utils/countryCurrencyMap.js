// Authoritative mapping of ISO 3166-1 alpha-2 country codes to default currency
export const COUNTRY_TO_CURRENCY = {
  // North America
  US: 'USD', CA: 'CAD', MX: 'MXN',
  // Europe (Eurozone)
  AD: 'EUR', AT: 'EUR', BE: 'EUR', CY: 'EUR', DE: 'EUR', EE: 'EUR', ES: 'EUR',
  FI: 'EUR', FR: 'EUR', GR: 'EUR', HR: 'EUR', IE: 'EUR', IT: 'EUR', LT: 'EUR',
  LU: 'EUR', LV: 'EUR', MC: 'EUR', ME: 'EUR', MT: 'EUR', NL: 'EUR', PT: 'EUR',
  SK: 'EUR', SI: 'EUR', SM: 'EUR', VA: 'EUR', AX: 'EUR',
  // Non-Euro Europe
  GB: 'GBP', IM: 'GBP', GG: 'GBP', JE: 'GBP',
  CH: 'CHF', LI: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK',
  PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON', BG: 'BGN', IS: 'ISK',
  AL: 'ALL', BA: 'BAM', MD: 'MDL', MK: 'MKD', RS: 'RSD', UA: 'UAH',
  // Africa
  ZA: 'ZAR', LS: 'ZAR', SZ: 'ZAR', NA: 'NAD', BW: 'BWP', NG: 'NGN',
  KE: 'KES', GH: 'GHS', EG: 'EGP', MU: 'MUR', MA: 'MAD', TZ: 'TZS',
  UG: 'UGX', RW: 'RWF', ET: 'ETB', ZM: 'ZMW', AO: 'AOA', DZ: 'DZD',
  // Middle East
  AE: 'AED', SA: 'SAR', QA: 'QAR', KW: 'KWD', BH: 'BHD', OM: 'OMR',
  IL: 'ILS', JO: 'JOD', LB: 'LBP', TR: 'TRY',
  // Asia / Pacific
  IN: 'INR', BT: 'INR', AU: 'AUD', NZ: 'NZD', SG: 'SGD', HK: 'HKD', JP: 'JPY',
  CN: 'CNY', KR: 'KRW', TW: 'TWD', TH: 'THB', MY: 'MYR', ID: 'IDR',
  PH: 'PHP', VN: 'VND', PK: 'PKR', BD: 'BDT', LK: 'LKR', NP: 'NPR',
  // Latin America & Caribbean
  BR: 'BRL', AR: 'ARS', CL: 'CLP', CO: 'COP', PE: 'PEN', UY: 'UYU',
  BO: 'BOB', CR: 'CRC', DO: 'DOP', GT: 'GTQ', JM: 'JMD', PA: 'USD',
  // Dollarized / Territories
  EC: 'USD', SV: 'USD', PR: 'USD', GU: 'USD', VI: 'USD',
  TC: 'USD', VG: 'USD', ZW: 'USD', BM: 'BMD', KY: 'KYD'
};

const displayNames = typeof Intl !== 'undefined' && Intl.DisplayNames
  ? new Intl.DisplayNames(['en'], { type: 'region' })
  : null;

export function getCountryName(countryCode) {
  if (!countryCode) return 'South Africa';
  try {
    return displayNames?.of(countryCode) || countryCode;
  } catch {
    return countryCode;
  }
}

export function getCurrencyForCountry(countryCode) {
  if (!countryCode) return 'ZAR';
  const code = String(countryCode).trim().toUpperCase();
  return COUNTRY_TO_CURRENCY[code] || (code === 'ZA' ? 'ZAR' : 'USD');
}

// Timezone to primary ISO-2 country code mapping (Instant, zero-network fallback)
const TIMEZONE_TO_COUNTRY = {
  'Asia/Calcutta': 'IN', 'Asia/Kolkata': 'IN',
  'Europe/London': 'GB',
  'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US',
  'America/Los_Angeles': 'US', 'America/Phoenix': 'US', 'America/Detroit': 'US',
  'America/Anchorage': 'US', 'Pacific/Honolulu': 'US',
  'Europe/Paris': 'FR', 'Europe/Berlin': 'DE', 'Europe/Rome': 'IT', 'Europe/Madrid': 'ES',
  'Europe/Amsterdam': 'NL', 'Europe/Brussels': 'BE', 'Europe/Vienna': 'AT',
  'Europe/Dublin': 'IE', 'Europe/Lisbon': 'PT', 'Europe/Helsinki': 'FI',
  'Europe/Athens': 'GR', 'Europe/Zurich': 'CH', 'Europe/Stockholm': 'SE',
  'Europe/Oslo': 'NO', 'Europe/Copenhagen': 'DK', 'Europe/Warsaw': 'PL',
  'Europe/Prague': 'CZ', 'Europe/Budapest': 'HU', 'Europe/Bucharest': 'RO',
  'Asia/Dubai': 'AE', 'Asia/Riyadh': 'SA', 'Asia/Qatar': 'QA', 'Asia/Kuwait': 'KW',
  'Asia/Singapore': 'SG', 'Asia/Hong_Kong': 'HK', 'Asia/Tokyo': 'JP',
  'Asia/Seoul': 'KR', 'Asia/Shanghai': 'CN', 'Asia/Chongqing': 'CN',
  'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU', 'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU', 'Australia/Adelaide': 'AU',
  'Pacific/Auckland': 'NZ',
  'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'America/Montreal': 'CA',
  'America/Edmonton': 'CA', 'America/Winnipeg': 'CA', 'America/Halifax': 'CA',
  'Africa/Johannesburg': 'ZA', 'Africa/Lagos': 'NG', 'Africa/Nairobi': 'KE',
  'Africa/Cairo': 'EG', 'Africa/Accra': 'GH', 'Africa/Gaborone': 'BW',
  'America/Sao_Paulo': 'BR', 'America/Mexico_City': 'MX', 'America/Buenos_Aires': 'AR',
  'America/Santiago': 'CL', 'America/Bogota': 'CO', 'America/Lima': 'PE'
};

export function getCountryFromTimezone() {
  try {
    const tz = Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone;
    if (!tz) return null;
    if (TIMEZONE_TO_COUNTRY[tz]) return TIMEZONE_TO_COUNTRY[tz];
    if (tz.startsWith('America/Indiana/')) return 'US';
    if (tz.startsWith('America/Kentucky/')) return 'US';
    if (tz.startsWith('Australia/')) return 'AU';
    if (tz.startsWith('Canada/')) return 'CA';
    if (tz.startsWith('US/')) return 'US';
    return null;
  } catch {
    return null;
  }
}

