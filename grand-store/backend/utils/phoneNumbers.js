const { getCountryCallingCode, isSupportedCountry, parsePhoneNumberFromString } = require('libphonenumber-js/min');

const getCheckoutPhone = (phone, phoneCountry) => {
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

module.exports = { getCheckoutPhone };
