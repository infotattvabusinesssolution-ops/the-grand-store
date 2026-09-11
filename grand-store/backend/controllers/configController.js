const axios = require('axios');
const { lookup: ipLookup } = require('ip-location-api');
const geoip = require('geoip-lite');

let cachedRates = null;
let lastFetchTime = null;
const CACHE_TTL = 1000 * 60 * 60 * 2; // 2 hours

// Comprehensive ISO-2 country code to primary currency mapping
const COUNTRY_TO_CURRENCY = {
  // North America
  US: 'USD', CA: 'CAD', MX: 'MXN',
  // Europe (Eurozone)
  AD: 'EUR', AT: 'EUR', BE: 'EUR', CY: 'EUR', DE: 'EUR', EE: 'EUR', ES: 'EUR',
  FI: 'EUR', FR: 'EUR', GR: 'EUR', HR: 'EUR', IE: 'EUR', IT: 'EUR', LT: 'EUR',
  LU: 'EUR', LV: 'EUR', MC: 'EUR', ME: 'EUR', MT: 'EUR', NL: 'EUR', PT: 'EUR',
  SK: 'EUR', SI: 'EUR', SM: 'EUR', VA: 'EUR',
  // Non-Euro Europe
  GB: 'GBP', IM: 'GBP', GG: 'GBP', JE: 'GBP',
  CH: 'CHF', LI: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK',
  PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON', BG: 'BGN', IS: 'ISK',
  // Africa
  ZA: 'ZAR', LS: 'ZAR', SZ: 'ZAR', NA: 'NAD', BW: 'BWP', NG: 'NGN',
  KE: 'KES', GH: 'GHS', EG: 'EGP', MU: 'MUR', MA: 'MAD', TZ: 'TZS',
  UG: 'UGX', RW: 'RWF', ET: 'ETB', ZM: 'ZMW',
  // Middle East
  AE: 'AED', SA: 'SAR', QA: 'QAR', KW: 'KWD', BH: 'BHD', OM: 'OMR',
  IL: 'ILS', JO: 'JOD', LB: 'LBP', TR: 'TRY',
  // Asia / Pacific
  IN: 'INR', BT: 'INR', AU: 'AUD', NZ: 'NZD', SG: 'SGD', HK: 'HKD', JP: 'JPY',
  CN: 'CNY', KR: 'KRW', TW: 'TWD', TH: 'THB', MY: 'MYR', ID: 'IDR',
  PH: 'PHP', VN: 'VND', PK: 'PKR', BD: 'BDT', LK: 'LKR',
  // Latin America
  BR: 'BRL', AR: 'ARS', CL: 'CLP', CO: 'COP', PE: 'PEN', UY: 'UYU',
  // Dollarized / Caribbean / Territories
  EC: 'USD', PA: 'USD', SV: 'USD', PR: 'USD', GU: 'USD', VI: 'USD',
  TC: 'USD', VG: 'USD', ZW: 'USD'
};

const regionNames = typeof Intl !== 'undefined' && Intl.DisplayNames
  ? new Intl.DisplayNames(['en'], { type: 'region' })
  : null;

function getCountryName(countryCode) {
  if (!countryCode) return 'South Africa';
  try {
    return regionNames?.of(countryCode) || countryCode;
  } catch {
    return countryCode;
  }
}

function getCurrencyForCountry(countryCode) {
  if (!countryCode) return 'ZAR';
  const code = countryCode.toUpperCase();
  return COUNTRY_TO_CURRENCY[code] || (code === 'ZA' ? 'ZAR' : 'USD');
}

function isPrivateIp(ip) {
  if (!ip) return true;
  const cleanIp = String(ip).replace(/^::ffff:/, '').trim();
  return (
    cleanIp === '127.0.0.1' ||
    cleanIp === '::1' ||
    cleanIp === 'localhost' ||
    cleanIp.startsWith('10.') ||
    cleanIp.startsWith('192.168.') ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(cleanIp) ||
    cleanIp.startsWith('fc00:') ||
    cleanIp.startsWith('fe80:')
  );
}

// @desc    Get currency exchange rates
// @route   GET /api/config/currency-rates
// @access  Public
exports.getCurrencyRates = async (req, res) => {
  try {
    const now = new Date();
    
    // Return cached rates if valid
    if (cachedRates && lastFetchTime && (now - lastFetchTime < CACHE_TTL)) {
      return res.json(cachedRates);
    }
    
    // Fetch fresh rates
    const apiUrl = process.env.EXCHANGE_RATE_API_URL || 'https://api.exchangerate-api.com/v4/latest/USD';
    const response = await axios.get(apiUrl);
    
    if (response.data && response.data.rates) {
      cachedRates = response.data;
      lastFetchTime = now;
      return res.json(cachedRates);
    }
    
    res.status(500).json({ message: 'Invalid response from exchange rate API' });
  } catch (error) {
    console.error('Error fetching currency rates:', error.message);
    
    // Fallback to cached rates if available even if expired
    if (cachedRates) {
      return res.json(cachedRates);
    }
    
    res.status(500).json({ message: 'Server error fetching rates', error: error.message });
  }
};

// @desc    Lookup visitor's country and default currency via production edge headers / geoip
// @route   GET /api/config/geo-lookup
// @access  Public
exports.geoLookup = async (req, res) => {
  try {
    let countryCode = null;
    let city = null;
    let source = null;

    // 0. Developer / testing override (e.g. ?country=US or X-Mock-Country: US)
    const testCountry = req.headers['x-mock-country'] || req.query.country;
    if (testCountry && typeof testCountry === 'string' && testCountry.trim().length === 2) {
      countryCode = testCountry.trim().toUpperCase();
      source = 'mock_override';
    }

    // 1. Production Cloudflare Edge Header (100% accurate in live production behind Cloudflare)
    if (!countryCode) {
      const cfCountry = req.headers['cf-ipcountry'];
      if (cfCountry && typeof cfCountry === 'string' && cfCountry.length === 2 && cfCountry !== 'XX' && cfCountry !== 'T1') {
        countryCode = cfCountry.toUpperCase();
        source = 'cloudflare';
      }
    }

    // 2. Additional CDN / reverse proxy headers (CloudFront, Fastly, Vercel, NGINX geoip)
    if (!countryCode) {
      const proxyCountry = req.headers['x-country-code'] ||
        req.headers['cloudfront-viewer-country'] ||
        req.headers['x-vercel-ip-country'];
      if (proxyCountry && typeof proxyCountry === 'string' && proxyCountry.length === 2) {
        countryCode = proxyCountry.toUpperCase();
        source = 'proxy_header';
      }
    }

    // 3. Extract real client IP
    const rawIp = req.headers['cf-connecting-ip'] ||
      req.headers['x-real-ip'] ||
      (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0].trim() : '') ||
      req.socket?.remoteAddress ||
      req.ip;

    const cleanIp = rawIp ? String(rawIp).replace(/^::ffff:/, '').trim() : '';

    // 4. Primary: Ultra-fast in-memory sapics lookup (0.3 μs, native IPv4 & IPv6 coverage, updated daily)
    if (!countryCode && cleanIp && !isPrivateIp(cleanIp)) {
      try {
        const geo = ipLookup(cleanIp);
        if (geo && geo.country) {
          countryCode = geo.country.toUpperCase();
          city = geo.city || null;
          source = 'sapics_ip_location_db';
        }
      } catch (sapicsErr) {
        console.warn('[geoLookup] sapics lookup warning:', sapicsErr.message);
      }

      // Secondary offline fallback: geoip-lite
      if (!countryCode) {
        try {
          const legacyGeo = geoip.lookup(cleanIp);
          if (legacyGeo && legacyGeo.country) {
            countryCode = legacyGeo.country.toUpperCase();
            city = legacyGeo.city || null;
            source = 'geoip_lite';
          }
        } catch (legacyErr) {}
      }
    }

    // 5. Fallback for private IP / local development: fast server-side external query
    if (!countryCode && (!cleanIp || isPrivateIp(cleanIp))) {
      try {
        // Fast Cloudflare Anycast trace (50ms, never blocked, HTTPS)
        const cfTrace = await axios.get('https://1.1.1.1/cdn-cgi/trace', { timeout: 1500 });
        const match = typeof cfTrace.data === 'string' && cfTrace.data.match(/loc=([A-Z]{2})/);
        if (match && match[1]) {
          countryCode = match[1].toUpperCase();
          source = 'cloudflare_trace_server';
        }
      } catch {
        try {
          const extRes = await axios.get('https://api.country.is', { timeout: 1500 });
          if (extRes.data && extRes.data.country) {
            countryCode = extRes.data.country.toUpperCase();
            source = 'server_external';
          }
        } catch (extErr) {}
      }
    }

    // 6. Ultimate fallback if everything else fails: South Africa
    if (!countryCode) {
      countryCode = 'ZA';
      source = 'default_fallback';
    }

    const countryName = getCountryName(countryCode);
    const currency = getCurrencyForCountry(countryCode);

    return res.json({
      success: true,
      country_code: countryCode,
      country_name: countryName,
      currency: currency,
      city: city,
      ip: cleanIp || null,
      source: source
    });
  } catch (err) {
    console.error('Error in geoLookup:', err.message);
    return res.json({
      success: true,
      country_code: 'ZA',
      country_name: 'South Africa',
      currency: 'ZAR',
      city: null,
      ip: null,
      source: 'error_fallback'
    });
  }
};

