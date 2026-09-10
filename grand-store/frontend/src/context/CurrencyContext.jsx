import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import api from '../api';
import { useGeoLocation } from './LocationContext';


const CurrencyContext = createContext();

export const useCurrency = () => {
  return useContext(CurrencyContext);
};

// Common currency symbols map
export const CURRENCY_SYMBOLS = {
  ZAR: 'R',
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  AUD: 'A$',
  CAD: 'C$',
  JPY: '¥',
  CNY: '¥',
  CHF: 'CHF',
  AED: 'AED',
  SGD: 'S$',
  HKD: 'HK$',
  NZD: 'NZ$',
  BRL: 'R$',
  KRW: '₩',
  THB: '฿',
  NGN: '₦',
  KES: 'KSh',
  GHS: 'GH₵',
  CLP: '$',
  COP: '$',
  MXN: '$',
  ARS: '$',
  PHP: '₱',
  VND: '₫',
  IDR: 'Rp',
  MYR: 'RM',
  PLN: 'zł',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  CZK: 'Kč',
  HUF: 'Ft',
  ILS: '₪',
  TRY: '₺',
  RUB: '₽',
  SAR: '﷼',
  BWP: 'P',
  NAD: 'N$',
  MUR: '₨',
  EGP: 'E£',
};

// Currencies that conventionally do not use fractional/decimal subdivisions
export const ZERO_DECIMAL_CURRENCIES = new Set(['JPY', 'KRW', 'VND', 'CLP', 'PYG', 'UGX']);

// Mapping from 3-letter currency code to 2-letter ISO country code for flags
export const CURRENCY_TO_COUNTRY = {
  AED: 'AE', AFN: 'AF', ALL: 'AL', AMD: 'AM', ANG: 'CW', AOA: 'AO', ARS: 'AR', AUD: 'AU',
  AWG: 'AW', AZN: 'AZ', BAM: 'BA', BBD: 'BB', BDT: 'BD', BGN: 'BG', BHD: 'BH', BIF: 'BI',
  BMD: 'BM', BND: 'BN', BOB: 'BO', BRL: 'BR', BSD: 'BS', BTN: 'BT', BWP: 'BW', BYN: 'BY',
  BZD: 'BZ', CAD: 'CA', CDF: 'CD', CHF: 'CH', CLP: 'CL', CNY: 'CN', COP: 'CO', CRC: 'CR',
  CUP: 'CU', CVE: 'CV', CZK: 'CZ', DJF: 'DJ', DKK: 'DK', DOP: 'DO', DZD: 'DZ', EGP: 'EG',
  ERN: 'ER', ETB: 'ET', EUR: 'EU', FJD: 'FJ', FKP: 'FK', GBP: 'GB', GEL: 'GE', GHS: 'GH',
  GIP: 'GI', GMD: 'GM', GNF: 'GN', GTQ: 'GT', GYD: 'GY', HKD: 'HK', HNL: 'HN', HRK: 'HR',
  HTG: 'HT', HUF: 'HU', IDR: 'ID', ILS: 'IL', INR: 'IN', IQD: 'IQ', IRR: 'IR', ISK: 'IS',
  JMD: 'JM', JOD: 'JO', JPY: 'JP', KES: 'KE', KGS: 'KG', KHR: 'KH', KMF: 'KM', KRW: 'KR',
  KWD: 'KW', KYD: 'KY', KZT: 'KZ', LAK: 'LA', LBP: 'LB', LKR: 'LK', LRD: 'LR', LSL: 'LS',
  LYD: 'LY', MAD: 'MA', MDL: 'MD', MGA: 'MG', MKD: 'MK', MMK: 'MM', MNT: 'MN', MOP: 'MO',
  MRU: 'MR', MUR: 'MU', MVR: 'MV', MWK: 'MW', MXN: 'MX', MYR: 'MY', MZN: 'MZ', NAD: 'NA',
  NGN: 'NG', NIO: 'NI', NOK: 'NO', NPR: 'NP', NZD: 'NZ', OMR: 'OM', PAB: 'PA', PEN: 'PE',
  PGK: 'PG', PHP: 'PH', PKR: 'PK', PLN: 'PL', PYG: 'PY', QAR: 'QA', RON: 'RO', RSD: 'RS',
  RUB: 'RU', RWF: 'RW', SAR: 'SA', SBD: 'SB', SCR: 'SC', SDG: 'SD', SEK: 'SE', SGD: 'SG',
  SHP: 'SH', SLL: 'SL', SOS: 'SO', SRD: 'SR', SSP: 'SS', STN: 'ST', SVC: 'SV', SYP: 'SY',
  SZL: 'SZ', THB: 'TH', TJS: 'TJ', TMT: 'TM', TND: 'TN', TOP: 'TO', TRY: 'TR', TTD: 'TT',
  TWD: 'TW', TZS: 'TZ', UAH: 'UA', UGX: 'UG', USD: 'US', UYU: 'UY', UZS: 'UZ', VES: 'VE',
  VND: 'VN', VUV: 'VU', WST: 'WS', XAF: 'CM', XCD: 'AG', XOF: 'SN', XPF: 'PF', YER: 'YE',
  ZAR: 'ZA', ZMW: 'ZM', ZWL: 'ZW',
};

export function getCountryForCurrency(currencyCode) {
  if (!currencyCode) return 'ZA';
  const upper = String(currencyCode).trim().toUpperCase();
  if (CURRENCY_TO_COUNTRY[upper]) return CURRENCY_TO_COUNTRY[upper];
  return upper.slice(0, 2);
}

export function getCurrencySymbol(currencyCode) {
  if (!currencyCode) return 'R';
  return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
}

const formatCurrencyAmount = (amount, currencyCode) => {
  const isZeroDec = ZERO_DECIMAL_CURRENCIES.has(currencyCode);
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: isZeroDec ? 0 : 2,
    maximumFractionDigits: isZeroDec ? 0 : 2
  }).format(amount);

  const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;
  // Use non-breaking space (\u00A0) so the symbol and digits can never break across lines
  return `${symbol}\u00A0${formatted}`;
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('ZAR'); // Default is ZAR
  const [rates, setRates] = useState(null);
  const [loading, setLoading] = useState(true);
  const { currency: geoCurrency, isLoading: geoLoading } = useGeoLocation();

  useEffect(() => {
    const initCurrency = async () => {
      try {
        // 1. Fetch Exchange Rates
        const ratesRes = await api.get(`/config/currency-rates`);
        if (ratesRes.data && ratesRes.data.rates) {
          setRates(ratesRes.data.rates);
        }
      } catch (error) {
        console.error('Error initializing currency context:', error);
      } finally {
        setLoading(false);
      }
    };

    initCurrency();
  }, []);

  useEffect(() => {
    if (!geoLoading && rates) {
      const isManual = localStorage.getItem('userCurrencyManual') === 'true';
      const savedCurrency = localStorage.getItem('userCurrency');

      if (isManual && savedCurrency && (savedCurrency === 'ZAR' || rates[savedCurrency])) {
        // User explicitly picked this currency in the past; respect their choice
        setCurrency(savedCurrency);
      } else if (geoCurrency && (geoCurrency === 'ZAR' || rates[geoCurrency])) {
        // First-time or non-manual visitor: auto-adopt detected geo currency
        setCurrency(geoCurrency);
        localStorage.setItem('userCurrency', geoCurrency);
      } else if (savedCurrency && (savedCurrency === 'ZAR' || rates[savedCurrency])) {
        setCurrency(savedCurrency);
      }
    }
  }, [geoLoading, geoCurrency, rates]);

  // Listen for manual country changes from LocationContext / Header
  useEffect(() => {
    const handleCountryChanged = (e) => {
      const targetCurrency = e.detail?.currency;
      if (targetCurrency && (targetCurrency === 'ZAR' || rates?.[targetCurrency])) {
        setCurrency(targetCurrency);
        localStorage.setItem('userCurrency', targetCurrency);
      }
    };

    window.addEventListener('country-manual-changed', handleCountryChanged);
    return () => {
      window.removeEventListener('country-manual-changed', handleCountryChanged);
    };
  }, [rates]);

  const changeCurrency = (newCurrency) => {
    if (newCurrency === 'ZAR' || rates?.[newCurrency]) {
      setCurrency(newCurrency);
      localStorage.setItem('userCurrency', newCurrency);
      localStorage.setItem('userCurrencyManual', 'true');
    }
  };

  const convertAndFormat = (amountInZar) => {
    if (!amountInZar && amountInZar !== 0) return '';
    const numericStr = String(amountInZar).replace(/[^0-9.-]/g, '');
    const num = parseFloat(numericStr);
    if (isNaN(num)) return amountInZar;

    // If no rates loaded or viewing in base currency or missing rates, fallback to base ZAR
    if (!rates || currency === 'ZAR' || !rates['ZAR'] || !rates[currency]) {
      return formatCurrencyAmount(num, 'ZAR');
    }

    // Convert: ZAR -> USD -> Target Currency
    // Since rates are based in USD (1 USD = X ZAR, 1 USD = Y Currency)
    const rateZarToUsd = 1 / rates['ZAR'];
    const amountInUsd = num * rateZarToUsd;
    const amountInTarget = amountInUsd * rates[currency];

    return formatCurrencyAmount(amountInTarget, currency);
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      rates,
      loading,
      changeCurrency,
      formatPrice: convertAndFormat,
      availableCurrencies: rates
        ? Array.from(new Set(['ZAR', ...Object.keys(rates)])).sort()
        : ['ZAR']
    }}>
      {children}
    </CurrencyContext.Provider>
  );
};
