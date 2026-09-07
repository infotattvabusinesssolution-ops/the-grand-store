const axios = require('axios');

const POSTNET_LOCATOR_URL = 'https://pnsa.restapis.co.za/public/store/locator';
const POSTNET_NETWORK_URL = 'https://storelocator.postnet.co.za/cart_store-json_list/';
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';
const NETWORK_CACHE_MS = 15 * 60 * 1000;

let networkStoreCache = { expiresAt: 0, stores: [] };

const cleanText = (value) => String(value || '').trim();

const normaliseText = (value) => cleanText(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const readStoreAddress = (store) => {
  const rawAddress = store.address
    || store.physicalAddress
    || store.physical_address
    || store.streetAddress
    || store.location?.address
    || '';

  if (typeof rawAddress === 'string') return rawAddress.trim();
  if (rawAddress && typeof rawAddress === 'object') {
    return [
      rawAddress.line1,
      rawAddress.line2,
      rawAddress.suburb,
      rawAddress.city || rawAddress.town,
      rawAddress.postalCode || rawAddress.postcode
    ].filter(Boolean).join(', ');
  }

  return '';
};

const inferStoreCity = (store, name, address) => {
  const explicitCity = store.city
    || store.town
    || store.suburb
    || store.location?.city
    || store.location?.town;
  if (explicitCity) return cleanText(explicitCity);

  const postnetName = cleanText(name).replace(/^postnet\s+/i, '');
  if (postnetName && postnetName !== name) return postnetName;

  const addressParts = cleanText(address).split(',').map((part) => part.trim()).filter(Boolean);
  return addressParts.length >= 2 ? addressParts[addressParts.length - 2].replace(/\b\d{4}\b/g, '').trim() : '';
};

const storeMatchesCity = (store, city) => {
  const wantedCity = normaliseText(city);
  if (!wantedCity) return false;

  const explicitCity = normaliseText(store.town || store.city || store.location?.city || store.location?.town);
  if (explicitCity) return explicitCity === wantedCity;

  const searchable = normaliseText([
    store.name,
    store.address,
    store.city,
    store.suburb
  ].filter(Boolean).join(' '));

  return searchable.includes(wantedCity);
};

const normaliseStore = (store, index, selectedCity) => {
  const name = cleanText(store.name || store.store || store.storeName || store.store_name || store.branchName) || 'PostNet branch';
  const address = readStoreAddress(store);
  const city = inferStoreCity(store, name, address);
  const distanceValue = Number.parseFloat(store.distance ?? store.distanceKm ?? store.distance_km);
  const distance = Number.isFinite(distanceValue) ? Number(distanceValue.toFixed(1)) : null;
  const isInSelectedCity = storeMatchesCity({ ...store, name, address }, selectedCity);
  const identity = normaliseText(`${name}-${address}`).replace(/\s+/g, '-').slice(0, 80);

  return {
    id: cleanText(store.id || store._id || store.storeId || store.storeCode || store.code) || `postnet-${identity || index}`,
    name,
    store: name,
    address,
    city,
    postalCode: cleanText(
      store.postalCode
      || store.postcode
      || store.zip
      || store.postal_code
      || store.location?.postalCode
      || address.match(/\b\d{4}\b/)?.[0]
    ),
    telephone: cleanText(store.telephone || store.phone || store.phoneNumber),
    distance,
    isInSelectedCity,
    isNearestAlternative: Boolean(selectedCity) && !isInSelectedCity
  };
};

const getResponseStores = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.stores)) return payload.stores;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const calculateDistanceKm = (origin, store) => {
  const storeLat = Number(store.latitude ?? store.lat ?? store.location?.lat);
  const storeLng = Number(store.longitude ?? store.lng ?? store.lon ?? store.location?.lng);
  if (!Number.isFinite(storeLat) || !Number.isFinite(storeLng)) return null;

  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const latDelta = toRadians(storeLat - origin.lat);
  const lngDelta = toRadians(storeLng - origin.lng);
  const originLat = toRadians(origin.lat);
  const destinationLat = toRadians(storeLat);
  const haversine = Math.sin(latDelta / 2) ** 2
    + Math.cos(originLat) * Math.cos(destinationLat) * Math.sin(lngDelta / 2) ** 2;

  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const getNetworkStores = async () => {
  if (networkStoreCache.expiresAt > Date.now() && networkStoreCache.stores.length > 0) {
    return networkStoreCache.stores;
  }

  const response = await axios.get(POSTNET_NETWORK_URL, { timeout: 10000 });
  const stores = getResponseStores(response.data);
  if (stores.length > 0) {
    networkStoreCache = { expiresAt: Date.now() + NETWORK_CACHE_MS, stores };
  }
  return stores;
};

const resolveCoordinates = async ({ address, lat, lng }) => {
  const numericLat = Number(lat);
  const numericLng = Number(lng);
  const hasCoordinates = lat !== null && lat !== undefined && lat !== ''
    && lng !== null && lng !== undefined && lng !== ''
    && Number.isFinite(numericLat) && Number.isFinite(numericLng);
  if (hasCoordinates) {
    return { lat: numericLat, lng: numericLng };
  }

  if (!cleanText(address)) {
    const error = new Error('Address or coordinates are required');
    error.statusCode = 400;
    throw error;
  }

  const response = await axios.get(NOMINATIM_SEARCH_URL, {
    params: {
      q: address,
      format: 'json',
      limit: 1,
      countrycodes: 'za'
    },
    headers: { 'User-Agent': 'GrandStoreApp/1.0 (checkout store locator)' },
    timeout: 8000
  });
  const result = Array.isArray(response.data) ? response.data[0] : null;
  if (!result || !result.lat || !result.lon) {
    // Default to central South Africa coordinates (Johannesburg) so quoting/lookup does not fail
    return { lat: -26.2041, lng: 28.0473 };
  }

  return { lat: Number(result.lat), lng: Number(result.lon) };
};

const findNearestPostnetStores = async ({ address, lat, lng, city, limit = 6 }) => {
  const coordinates = await resolveCoordinates({ address, lat, lng });
  let rawStores = [];

  try {
    rawStores = await getNetworkStores();
    if (rawStores.length === 0) throw new Error('PostNet network list was empty');
  } catch (networkError) {
    const response = await axios.get(POSTNET_LOCATOR_URL, {
      params: { latitude: coordinates.lat, longitude: coordinates.lng },
      timeout: 10000
    });
    rawStores = getResponseStores(response.data);
  }

  const allStores = rawStores
    .map((store) => ({
      ...store,
      distance: Number.isFinite(Number.parseFloat(store.distance))
        ? Number.parseFloat(store.distance)
        : calculateDistanceKm(coordinates, store)
    }))
    .map((store, index) => normaliseStore(store, index, city))
    .filter((store) => store.name || store.address)
    .sort((left, right) => (left.distance ?? Number.MAX_SAFE_INTEGER) - (right.distance ?? Number.MAX_SAFE_INTEGER));

  const cityStores = allStores.filter((store) => store.isInSelectedCity);
  const hasCityMatch = cityStores.length > 0;
  const stores = (hasCityMatch ? cityStores : allStores).slice(0, Math.max(1, Number(limit) || 6));

  return {
    stores,
    coordinates,
    searchedCity: cleanText(city),
    hasCityMatch,
    usingNearestCity: Boolean(city) && !hasCityMatch && stores.length > 0
  };
};

module.exports = {
  findNearestPostnetStores,
  normaliseStore,
  storeMatchesCity
};
