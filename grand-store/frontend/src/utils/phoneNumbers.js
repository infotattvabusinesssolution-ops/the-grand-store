import { getCountryCallingCode, isSupportedCountry, parsePhoneNumberFromString } from 'libphonenumber-js/min';
import countries from './phoneCountries.json';

export const PHONE_COUNTRIES = countries;
export const DEFAULT_PHONE_COUNTRY = 'ZA';

// Separate saved international numbers from the code shown in the selector.
export const splitPhoneNumber = (value = '', defaultCountry = DEFAULT_PHONE_COUNTRY) => {
  const country = isSupportedCountry(defaultCountry) ? defaultCountry : DEFAULT_PHONE_COUNTRY;
  const raw = String(value || '').trim().replace(/^00/, '+');
  const parsed = parsePhoneNumberFromString(raw, { defaultCountry: country, extract: false });
  if (parsed) {
    const phoneCountry = parsed.country ||
      (getCountryCallingCode(country) === parsed.countryCallingCode ? country : parsed.getPossibleCountries()[0]) ||
      countries.find((option) => option.dialCode === `+${parsed.countryCallingCode}`)?.country;
    if (phoneCountry) return { phoneCountry, phone: parsed.nationalNumber };
  }
  return { phoneCountry: country, phone: raw };
};

export const getCheckoutPhone = (phone, phoneCountry) => {
  if (!isSupportedCountry(phoneCountry) || typeof phone !== 'string' || !phone.trim()) return null;
  const parsed = parsePhoneNumberFromString(phone.trim(), { defaultCountry: phoneCountry, extract: false });
  if (!parsed || parsed.ext || !parsed.isPossible() || parsed.countryCallingCode !== getCountryCallingCode(phoneCountry)) return null;
  return {
    phone: parsed.number,
    phoneNumber: parsed.number,
    phoneCountry,
    phoneCountryCode: `+${parsed.countryCallingCode}`,
  };
};
