import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import api from '../api';
import { getCurrencyForCountry, getCountryFromTimezone, getCountryName } from '../utils/countryCurrencyMap';

const LocationContext = createContext();

const COUNTRY_CODES = `AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW`.split(' ');

const regionNames = typeof Intl !== 'undefined' && Intl.DisplayNames
  ? new Intl.DisplayNames(['en'], { type: 'region' })
  : null;

export const countries = COUNTRY_CODES
  .map((code) => ({ code, name: regionNames?.of(code) || code }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function useGeoLocation() {
  return useContext(LocationContext);
}

export function LocationProvider({ children }) {
  const [location, setLocation] = useState({
    country_code: null,
    country_name: null,
    currency: null,
    isLoading: true,
    isManual: false,
    error: null
  });

  useEffect(() => {
    let isMounted = true;

    const fetchLocation = async () => {
      // 1. Check if user previously manually selected a country
      const isManual = localStorage.getItem('userCountryManual') === 'true';
      const savedCountry = localStorage.getItem('userCountry');
      if (isManual && savedCountry) {
        try {
          const parsedCountry = JSON.parse(savedCountry);
          const matchedCountry = countries.find((c) => c.code === parsedCountry.country_code);
          if (matchedCountry && isMounted) {
            setLocation({
              country_code: matchedCountry.code,
              country_name: matchedCountry.name,
              currency: parsedCountry.currency || getCurrencyForCountry(matchedCountry.code),
              isLoading: false,
              isManual: true,
              error: null
            });
            return;
          }
        } catch {
          localStorage.removeItem('userCountry');
          localStorage.removeItem('userCountryManual');
        }
      }

      // 2. Perform automated geo-lookup
      // Primary: Direct client-side Cloudflare Anycast Trace (matches newsletter logic, ~30ms, never blocked, bypasses proxy/datacenter masking)
      try {
        let detected = null;

        // Step 1: Direct Cloudflare Anycast Trace from browser (fast, edge-based, ad-blocker immune)
        try {
          const cfResponse = await fetch('https://1.1.1.1/cdn-cgi/trace');
          const cfText = await cfResponse.text();
          const cfData = {};
          cfText.trim().split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) cfData[key.trim()] = value.trim();
          });

          if (cfData.loc && cfData.loc.length === 2) {
            const code = cfData.loc.toUpperCase();
            const matched = countries.find(c => c.code === code);
            const countryName = regionNames?.of(code) || matched?.name || getCountryName(code) || code;
            detected = {
              country_code: code,
              country_name: countryName,
              currency: getCurrencyForCountry(code),
              ip: cfData.ip || null,
              source: 'cloudflare_edge_client'
            };
          }
        } catch (cfErr) {
          // Cloudflare Anycast trace unreachable or blocked, proceed to fallback
        }

        // Step 2: Client-side fallback (matches Footer.jsx: ipapi.co or api.country.is)
        if (!detected) {
          try {
            const geoResponse = await fetch('https://ipapi.co/json/');
            const geoData = await geoResponse.json();
            if (geoData.country_code && geoData.country_code.length === 2) {
              const code = geoData.country_code.toUpperCase();
              const matched = countries.find(c => c.code === code);
              detected = {
                country_code: code,
                country_name: geoData.country_name || regionNames?.of(code) || matched?.name || code,
                currency: geoData.currency || getCurrencyForCountry(code),
                ip: geoData.ip || null,
                source: 'ipapi_client'
              };
            }
          } catch {
            try {
              const fallbackRes = await fetch('https://api.country.is');
              const fallbackData = await fallbackRes.json();
              if (fallbackData.country && fallbackData.country.length === 2) {
                const code = fallbackData.country.toUpperCase();
                const matched = countries.find(c => c.code === code);
                detected = {
                  country_code: code,
                  country_name: regionNames?.of(code) || matched?.name || code,
                  currency: getCurrencyForCountry(code),
                  ip: fallbackData.ip || null,
                  source: 'country_is_client'
                };
              }
            } catch {}
          }
        }

        // Step 3: First-party backend endpoint fallback
        if (!detected) {
          try {
            const res = await api.get('/config/geo-lookup', { timeout: 4000 });
            if (res.data && res.data.success && res.data.country_code) {
              const matched = countries.find((c) => c.code === res.data.country_code);
              detected = {
                country_code: res.data.country_code,
                country_name: res.data.country_name || matched?.name || res.data.country_code,
                currency: res.data.currency || getCurrencyForCountry(res.data.country_code),
                ip: res.data.ip || null,
                source: 'backend_geo_lookup'
              };
            }
          } catch (apiErr) {}
        }

        // Step 4: Instant Zero-Network Timezone Heuristic
        if (!detected) {
          const tzCountry = getCountryFromTimezone();
          if (tzCountry) {
            const matched = countries.find(c => c.code === tzCountry);
            detected = {
              country_code: tzCountry,
              country_name: matched ? matched.name : getCountryName(tzCountry),
              currency: getCurrencyForCountry(tzCountry),
              source: 'timezone_heuristic'
            };
          }
        }

        // Step 5: Save detected location or fallback to South Africa (ZA / ZAR)
        if (detected && detected.country_code && isMounted) {
          setLocation({
            country_code: detected.country_code,
            country_name: detected.country_name,
            currency: detected.currency,
            isLoading: false,
            isManual: false,
            error: null
          });
          localStorage.setItem('userCountry', JSON.stringify({
            country_code: detected.country_code,
            country_name: detected.country_name,
            currency: detected.currency
          }));
          return;
        }

        if (isMounted) {
          setLocation({
            country_code: 'ZA',
            country_name: 'South Africa',
            currency: 'ZAR',
            isLoading: false,
            isManual: false,
            error: null
          });
        }
      } catch (err) {
        if (isMounted) {
          setLocation({
            country_code: 'ZA',
            country_name: 'South Africa',
            currency: 'ZAR',
            isLoading: false,
            isManual: false,
            error: err.message
          });
        }
      }
    };

    fetchLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  const changeCountry = (countryCode) => {
    const selectedCountry = countries.find((country) => country.code === countryCode);
    if (!selectedCountry) return;

    const newCurrency = getCurrencyForCountry(selectedCountry.code);

    setLocation((current) => ({
      ...current,
      country_code: selectedCountry.code,
      country_name: selectedCountry.name,
      currency: newCurrency,
      isLoading: false,
      isManual: true,
      error: null
    }));

    localStorage.setItem('userCountryManual', 'true');
    localStorage.setItem('userCountry', JSON.stringify({
      country_code: selectedCountry.code,
      country_name: selectedCountry.name,
      currency: newCurrency
    }));

    // Dispatch event so other contexts (like CurrencyContext) know a country was manually chosen
    window.dispatchEvent(new CustomEvent('country-manual-changed', {
      detail: { country_code: selectedCountry.code, currency: newCurrency }
    }));
  };

  return (
    <LocationContext.Provider value={{ ...location, countries, changeCountry }}>
      {children}
    </LocationContext.Provider>
  );
}
