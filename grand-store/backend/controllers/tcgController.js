const { tcgService } = require('../services/tcgService');
const { calculateDoorDeliveryRate, calculatePudoLockerRate, determinePudoLockerSize } = require('../engines/tcgRateCardEngine');

// Curated South African PUDO Smart Locker Locations
const FALLBACK_PUDO_LOCKERS = [
  // Johannesburg & Sandton
  {
    id: 'pudo-sandton-city',
    name: 'PUDO Locker - Sandton City Mall',
    provider: 'tcg-locker',
    address: 'Sandton City, Rivonia Rd & 5th St, Sandton (Level 4, Near Woolworths Court)',
    suburb: 'Sandton Central',
    city: 'Sandton',
    province: 'Gauteng',
    postalCode: '2196',
    lat: -26.1076,
    lng: 28.0567,
    hours: '24/7 Access',
    availableSizes: ['XS', 'S', 'M', 'L', 'XL']
  },
  {
    id: 'pudo-rosebank-mall',
    name: 'PUDO Locker - Rosebank Mall',
    provider: 'tcg-locker',
    address: 'Rosebank Mall, 50 Bath Ave, Rosebank (Parkade Level 2, Near Pick n Pay)',
    suburb: 'Rosebank',
    city: 'Johannesburg',
    province: 'Gauteng',
    postalCode: '2196',
    lat: -26.1462,
    lng: 28.0416,
    hours: '24/7 Access',
    availableSizes: ['XS', 'S', 'M', 'L', 'XL']
  },
  {
    id: 'pudo-mall-of-africa',
    name: 'PUDO Locker - Mall of Africa',
    provider: 'tcg-locker',
    address: 'Mall of Africa, Magwa Cres, Waterfall City, Midrand (Entrance 5 Underground)',
    suburb: 'Midrand',
    city: 'Johannesburg',
    province: 'Gauteng',
    postalCode: '1686',
    lat: -26.0153,
    lng: 28.1074,
    hours: '24/7 Access',
    availableSizes: ['XS', 'S', 'M', 'L', 'XL']
  },
  {
    id: 'pudo-fourways-mall',
    name: 'PUDO Locker - Fourways Mall',
    provider: 'tcg-locker',
    address: 'Fourways Mall, Cnr William Nicol & Witkoppen, Fourways (Basement Green Zone)',
    suburb: 'Fourways',
    city: 'Johannesburg',
    province: 'Gauteng',
    postalCode: '2055',
    lat: -26.0185,
    lng: 28.0064,
    hours: '24/7 Access',
    availableSizes: ['XS', 'S', 'M', 'L']
  },
  {
    id: 'pudo-bedford-centre',
    name: 'PUDO Locker - Bedford Centre',
    provider: 'tcg-locker',
    address: 'Bedford Centre, Smith Rd & Van der Linde Rd, Bedfordview',
    suburb: 'Bedfordview',
    city: 'Johannesburg',
    province: 'Gauteng',
    postalCode: '2008',
    lat: -26.1882,
    lng: 28.1255,
    hours: '24/7 Access',
    availableSizes: ['XS', 'S', 'M', 'L', 'XL']
  },
  {
    id: 'pudo-clearwater-mall',
    name: 'PUDO Locker - Clearwater Mall',
    provider: 'tcg-locker',
    address: 'Clearwater Mall, Hendrik Potgieter Rd & Christiaan de Wet Rd, Strubensvalley',
    suburb: 'Roodepoort',
    city: 'Johannesburg',
    province: 'Gauteng',
    postalCode: '1735',
    lat: -26.1265,
    lng: 27.9048,
    hours: '24/7 Access',
    availableSizes: ['XS', 'S', 'M', 'L']
  },

  // Pretoria & Centurion
  {
    id: 'pudo-menlyn-park',
    name: 'PUDO Locker - Menlyn Park Shopping Centre',
    provider: 'tcg-locker',
    address: 'Menlyn Park, Atterbury Rd & Lois Ave, Menlyn (Parking Level P1)',
    suburb: 'Menlyn',
    city: 'Pretoria',
    province: 'Gauteng',
    postalCode: '0181',
    lat: -25.7828,
    lng: 28.2753,
    hours: '24/7 Access',
    availableSizes: ['XS', 'S', 'M', 'L', 'XL']
  },
  {
    id: 'pudo-brooklyn-mall',
    name: 'PUDO Locker - Brooklyn Mall',
    provider: 'tcg-locker',
    address: 'Brooklyn Mall, Veale St & Fehrsen St, Nieuw Muckleneuk',
    suburb: 'Brooklyn',
    city: 'Preoria',
    province: 'Gauteng',
    postalCode: '0181',
    lat: -25.7720,
    lng: 28.2368,
    hours: '24/7 Access',
    availableSizes: ['XS', 'S', 'M', 'L']
  },
  {
    id: 'pudo-centurion-mall',
    name: 'PUDO Locker - Centurion Mall',
    provider: 'tcg-locker',
    address: 'Centurion Mall, Heuwel Ave, Centurion Central (Near Entrance 2)',
    suburb: 'Centurion',
    city: 'Centurion',
    province: 'Gauteng',
    postalCode: '0157',
    lat: -25.8596,
    lng: 28.1887,
    hours: '24/7 Access',
    availableSizes: ['XS', 'S', 'M', 'L', 'XL']
  },

  // Cape Town & Winelands
  {
    id: 'pudo-va-waterfront',
    name: 'PUDO Locker - V&A Waterfront',
    provider: 'tcg-locker',
    address: 'V&A Waterfront, Breakwater Blvd, Cape Town (Breakwater Parking Garage Level 1)',
    suburb: 'Waterfront',
    city: 'Cape Town',
    province: 'Western Cape',
    postalCode: '8001',
    lat: -33.9056,
    lng: 18.4208,
    hours: '24/7 Access',
    availableSizes: ['XS', 'S', 'M', 'L', 'XL']
  },
  {
    id: 'pudo-canal-walk',
    name: 'PUDO Locker - Canal Walk Shopping Centre',
    provider: 'tcg-locker',
    address: 'Canal Walk, Century Blvd, Century City (Entrance 4 Undercover Parking)',
    suburb: 'Century City',
    city: 'Cape Town',
    province: 'Western Cape',
    postalCode: '7441',
    lat: -33.8929,
    lng: 18.5126,
    hours: '24/7 Access',
    availableSizes: ['XS', 'S', 'M', 'L', 'XL']
  },
  {
    id: 'pudo-gardens-centre',
    name: 'PUDO Locker - Gardens Shopping Centre',
    provider: 'tcg-locker',
    address: 'Gardens Shopping Centre, Mill St, Gardens, Cape Town (Ground Level)',
    suburb: 'Gardens',
    city: 'Cape Town',
    province: 'Western Cape',
    postalCode: '8001',
    lat: -33.9332,
    lng: 18.4116,
    hours: '24/7 Access',
    availableSizes: ['XS', 'S', 'M', 'L']
  },
  {
    id: 'pudo-cavendish-square',
    name: 'PUDO Locker - Cavendish Square',
    provider: 'tcg-locker',
    address: 'Cavendish Square, Dreyer St, Claremont (P2 Parking)',
    suburb: 'Claremont',
    city: 'Cape Town',
    province: 'Western Cape',
    postalCode: '7708',
    lat: -33.9806,
    lng: 18.4647,
    hours: '24/7 Access',
    availableSizes: ['XS', 'S', 'M', 'L', 'XL']
  },
  {
    id: 'pudo-stellenbosch-square',
    name: 'PUDO Locker - Stellenbosch Square',
    provider: 'tcg-locker',
    address: 'Stellenbosch Square, Cnr R44 & Webersvallei Rd, Stellenbosch',
    suburb: 'Jamestown',
    city: 'Stellenbosch',
    province: 'Western Cape',
    postalCode: '7600',
    lat: -33.9782,
    lng: 18.8475,
    hours: '24/7 Access',
    availableSizes: ['XS', 'S', 'M', 'L', 'XL']
  },
  {
    id: 'pudo-eikestad-mall',
    name: 'PUDO Locker - Eikestad Mall',
    provider: 'tcg-locker',
    address: 'Eikestad Mall, 43 Andringa St, Stellenbosch Central (Lower Level Parking)',
    suburb: 'Stellenbosch Central',
    city: 'Stellenbosch',
    province: 'Western Cape',
    postalCode: '7600',
    lat: -33.9374,
    lng: 18.8617,
    hours: '24/7 Access',
    availableSizes: ['XS', 'S', 'M', 'L']
  },

  // Durban & KwaZulu-Natal
  {
    id: 'pudo-gateway-theatre',
    name: 'PUDO Locker - Gateway Theatre of Shopping',
    provider: 'tcg-locker',
    address: 'Gateway Theatre of Shopping, 1 Palm Blvd, Umhlanga Ridge (Entrance 3)',
    suburb: 'Umhlanga',
    city: 'Durban',
    province: 'KwaZulu-Natal',
    postalCode: '4319',
    lat: -29.7247,
    lng: 31.0664,
    hours: '24/7 Access',
    availableSizes: ['XS', 'S', 'M', 'L', 'XL']
  },
  {
    id: 'pudo-pavilion-mall',
    name: 'PUDO Locker - The Pavilion Shopping Centre',
    provider: 'tcg-locker',
    address: 'The Pavilion, Jack Martens Dr, Dawncliffe, Westville (Roof Level Parking)',
    suburb: 'Westville',
    city: 'Durban',
    province: 'KwaZulu-Natal',
    postalCode: '3629',
    lat: -29.8516,
    lng: 30.9328,
    hours: '24/7 Access',
    availableSizes: ['XS', 'S', 'M', 'L', 'XL']
  },
  {
    id: 'pudo-ballito-junction',
    name: 'PUDO Locker - Ballito Junction Regional Mall',
    provider: 'tcg-locker',
    address: 'Ballito Junction, Leonora Dr, Ballito',
    suburb: 'Ballito',
    city: 'Durban',
    province: 'KwaZulu-Natal',
    postalCode: '4399',
    lat: -29.5358,
    lng: 31.2131,
    hours: '24/7 Access',
    availableSizes: ['XS', 'S', 'M', 'L']
  },

  // Gqeberha (Port Elizabeth)
  {
    id: 'pudo-walmer-park',
    name: 'PUDO Locker - Walmer Park Shopping Centre',
    provider: 'tcg-locker',
    address: 'Walmer Park, 16th Ave & Main Rd, Walmer, Gqeberha',
    suburb: 'Walmer',
    city: 'Gqeberha',
    province: 'Eastern Cape',
    postalCode: '6070',
    lat: -33.9789,
    lng: 25.5786,
    hours: '24/7 Access',
    availableSizes: ['XS', 'S', 'M', 'L', 'XL']
  },

  // Bloemfontein
  {
    id: 'pudo-mimosa-mall',
    name: 'PUDO Locker - Mimosa Mall',
    provider: 'tcg-locker',
    address: 'Mimosa Mall, 131 Kellner St, Brandwag, Bloemfontein',
    suburb: 'Brandwag',
    city: 'Bloemfontein',
    province: 'Free State',
    postalCode: '9301',
    lat: -29.1087,
    lng: 26.2023,
    hours: '24/7 Access',
    availableSizes: ['XS', 'S', 'M', 'L', 'XL']
  }
];

// @desc    Get PUDO Smart Lockers / TCG pickup points
// @route   GET /api/tcg/lockers?search=...&city=...&lat=...&lng=...
// @access  Public / Optional Auth
const getLockers = async (req, res) => {
  try {
    const { search, city, lat, lng } = req.query;
    const queryTerm = (search || city || '').trim().toLowerCase();

    // 1. Attempt live TCG API search if configured
    if (tcgService.isConfigured()) {
      try {
        const queryParams = { type: 'locker' };
        if (queryTerm) queryParams.search = queryTerm;
        if (lat && lng) {
          queryParams.lat = parseFloat(lat);
          queryParams.lng = parseFloat(lng);
        }

        const liveData = await tcgService.getPickupPoints(queryParams);
        const points = Array.isArray(liveData) ? liveData : (liveData.pickup_points || liveData.data || []);

        if (points && points.length > 0) {
          const formatted = points.map(pt => ({
            id: pt.id || pt.pickup_point_id,
            name: pt.name || `PUDO Locker - ${pt.suburb || pt.city}`,
            provider: 'tcg-locker',
            address: pt.address || pt.street_address || `${pt.suburb || ''}, ${pt.city || ''}`,
            suburb: pt.suburb || pt.local_area || '',
            city: pt.city || '',
            province: pt.province || pt.zone || '',
            postalCode: pt.postal_code || pt.code || '',
            lat: pt.latitude || pt.lat,
            lng: pt.longitude || pt.lng,
            hours: pt.operating_hours || '24/7 Access',
            availableSizes: pt.available_sizes || ['XS', 'S', 'M', 'L', 'XL']
          }));

          return res.json({
            source: 'tcg_live_api',
            lockers: formatted,
            count: formatted.length,
            searchQuery: queryTerm
          });
        }
      } catch (apiErr) {
        console.warn('TCG Live Locker search notice (using curated fallback):', apiErr.message);
      }
    }

    // 2. Filter curated fallback lockers based on query term or coordinates
    let matched = FALLBACK_PUDO_LOCKERS;
    if (queryTerm) {
      matched = FALLBACK_PUDO_LOCKERS.filter(l =>
        l.city.toLowerCase().includes(queryTerm) ||
        l.suburb.toLowerCase().includes(queryTerm) ||
        l.name.toLowerCase().includes(queryTerm) ||
        l.address.toLowerCase().includes(queryTerm) ||
        l.postalCode.includes(queryTerm)
      );

      // If no exact substring match, return all lockers so customer still has options
      if (matched.length === 0) {
        matched = FALLBACK_PUDO_LOCKERS;
      }
    }

    res.json({
      source: 'curated_fallback',
      lockers: matched,
      count: matched.length,
      searchQuery: queryTerm
    });
  } catch (error) {
    console.error('Error fetching PUDO lockers:', error);
    res.status(500).json({
      message: 'Failed to retrieve PUDO lockers',
      error: error.message
    });
  }
};

// @desc    Calculate TCG Contractual Rate Card & PUDO Rates
// @route   POST /api/tcg/rates
// @access  Public / Optional Auth
const getRates = async (req, res) => {
  try {
    const { originCity, destCity, weightKg, dimensions, declaredValue } = req.body;

    const eco = calculateDoorDeliveryRate({
      originCity: originCity || 'Stellenbosch',
      destCity: destCity || 'Cape Town',
      weightKg: Number(weightKg) || 2,
      dimensions: dimensions || { length: 35, width: 20, height: 12 },
      serviceCode: 'ECO',
      declaredValue: Number(declaredValue) || 0
    });

    const pri = calculateDoorDeliveryRate({
      originCity: originCity || 'Stellenbosch',
      destCity: destCity || 'Cape Town',
      weightKg: Number(weightKg) || 2,
      dimensions: dimensions || { length: 35, width: 20, height: 12 },
      serviceCode: 'PRI',
      declaredValue: Number(declaredValue) || 0
    });

    const lockerSize = determinePudoLockerSize(dimensions, Number(weightKg) || 2);
    const pudoL2L = calculatePudoLockerRate({ lockerSize, deliveryType: 'lockerToLocker', declaredValue });
    const pudoD2L = calculatePudoLockerRate({ lockerSize, deliveryType: 'doorToLocker', declaredValue });

    res.json({
      economyRoad: eco,
      priorityOvernight: pri,
      pudoLockerToLocker: pudoL2L,
      pudoDoorToLocker: pudoD2L,
      recommendedLockerSize: lockerSize
    });
  } catch (error) {
    console.error('Error calculating TCG rates:', error);
    res.status(500).json({ message: 'Failed to calculate rates', error: error.message });
  }
};

module.exports = {
  getLockers,
  getRates,
  FALLBACK_PUDO_LOCKERS
};
