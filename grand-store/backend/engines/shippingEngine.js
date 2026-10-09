/**
 * GS Shipping & Courier Engine
 * Simulates shipping options, rates, and landed costs based on vendor profiles and destinations.
 */

const axios = require('axios');
const Vendor = require('../models/Vendor');
const PlatformSettings = require('../models/PlatformSettings');
const { tcgService } = require('../services/tcgService');
const { calculateDoorDeliveryRate, calculatePudoLockerRate, determinePudoLockerSize } = require('./tcgRateCardEngine');

const isSouthAfrica = (country) => {
  if (!country) return false;
  const c = country.toLowerCase();
  return c === 'south africa' || c === 'za' || c === 'rsa';
};

const getShippingQuotes = async (vendorId, customerAddress, shipmentItemsSubtotal, totalWeightKg, options = {}) => {
  try {
    let vendor = null;
    if (vendorId && /^[0-9a-fA-F]{24}$/.test(vendorId.toString())) {
      vendor = await Vendor.findById(vendorId);
    }
    const originCountry = vendor?.shippingProfile?.pickupAddress?.country || 'South Africa';
    const destCountry = customerAddress.country || 'South Africa';

    const originSA = isSouthAfrica(originCountry);
    const destSA = isSouthAfrica(destCountry);

    let quotes = [];
    let isInternational = false;
    let estimatedDuties = 0;
    let estimatedTaxes = 0;
    let customsFees = 0;

    // Load admin platform settings if not provided
    let platformSettings = options.settings;
    if (!platformSettings) {
      try {
        platformSettings = await PlatformSettings.findOne();
      } catch (err) {
        platformSettings = null;
      }
    }

    // SIMULATED COURIER API LOGIC

    // 1. DOMESTIC SA (The Courier Guy & PUDO Live Dynamic Engine + PostNet)
    if (originSA && destSA) {
      // Determine parcel box dimensions dynamically from items specifications
      let maxLen = 0, maxWid = 0, maxHgt = 0, totalItemsCount = 0;
      if (options.items && Array.isArray(options.items) && options.items.length > 0) {
        options.items.forEach(it => {
          const l = Number(it.shipping?.length_cm || 12);
          const w = Number(it.shipping?.width_cm || 12);
          const h = Number(it.shipping?.height_cm || 34);
          const q = Number(it.quantity || it.qty || 1);
          totalItemsCount += q;
          maxLen = Math.max(maxLen, l);
          maxWid = Math.max(maxWid, w);
          maxHgt = Math.max(maxHgt, h);
        });
      }

      let parcelDims = { length: 35, width: 12, height: 12 };
      if (maxLen > 0 && maxWid > 0 && maxHgt > 0) {
        const cols = Math.ceil(Math.sqrt(totalItemsCount || 1));
        const rows = Math.ceil((totalItemsCount || 1) / cols);
        parcelDims = {
          length: Number((maxLen * cols).toFixed(1)),
          width: Number((maxWid * rows).toFixed(1)),
          height: Number(maxHgt.toFixed(1))
        };
      } else if (totalWeightKg > 10) {
        parcelDims = { length: 45, width: 35, height: 30 };
      } else if (totalWeightKg > 5) {
        parcelDims = { length: 38, width: 28, height: 24 };
      } else if (totalWeightKg > 2) {
        parcelDims = { length: 35, width: 24, height: 14 };
      }

      let tcgRates = null;

      // 1. Attempt Live TCG REST API if configured
      if (tcgService.isConfigured()) {
        try {
          const originAddr = vendor?.shippingProfile?.pickupAddress || { city: 'Stellenbosch', province: 'Western Cape', country: 'ZA' };
          const tcgResponse = await tcgService.getRates({
            collectionAddress: originAddr,
            deliveryAddress: customerAddress,
            parcels: [{
              submitted_length_cm: parcelDims.length,
              submitted_width_cm: parcelDims.width,
              submitted_height_cm: parcelDims.height,
              submitted_weight_kg: Math.max(0.5, totalWeightKg)
            }],
            declaredValue: shipmentItemsSubtotal
          });

          if (tcgResponse && Array.isArray(tcgResponse.rates)) {
            tcgRates = tcgResponse.rates;
          }
        } catch (apiErr) {
          console.warn('TCG Live API Quote notice (using contractual Rate Card fallback):', apiErr.message);
        }
      }

      // 2. Compute Contractual Rate Card Quotes (Zero-latency fallback & benchmark)
      const calculatedEco = calculateDoorDeliveryRate({
        originCity: vendor?.shippingProfile?.pickupAddress?.city || 'Stellenbosch',
        destCity: customerAddress.city || 'Cape Town',
        weightKg: totalWeightKg,
        dimensions: parcelDims,
        serviceCode: 'ECO',
        declaredValue: shipmentItemsSubtotal
      });

      const calculatedPri = calculateDoorDeliveryRate({
        originCity: vendor?.shippingProfile?.pickupAddress?.city || 'Stellenbosch',
        destCity: customerAddress.city || 'Cape Town',
        weightKg: totalWeightKg,
        dimensions: parcelDims,
        serviceCode: 'PRI',
        declaredValue: shipmentItemsSubtotal
      });

      const lockerSize = determinePudoLockerSize(parcelDims, totalWeightKg) || 'M';
      const calculatedPudo = calculatePudoLockerRate({
        lockerSize,
        deliveryType: 'doorToLocker',
        declaredValue: shipmentItemsSubtotal
      });

      // Match live API rates if available, else use contractual calculation
      let ecoTotalCost = calculatedEco.cost;
      let priTotalCost = calculatedPri.cost;

      if (tcgRates && tcgRates.length > 0) {
        const liveEco = tcgRates.find(r => (r.service_level_code === 'ECO' || r.service_level_code === 'ECOR'));
        const livePri = tcgRates.find(r => r.service_level_code === 'PRI');
        if (liveEco && Number(liveEco.total) > 0) ecoTotalCost = Number(liveEco.total);
        if (livePri && Number(livePri.total) > 0) priTotalCost = Number(livePri.total);
      }

      // PostNet Store Collection fee
      const postnetCollectionCost = Number(platformSettings?.postnetPickupFee !== undefined ? platformSettings.postnetPickupFee : 100);

      // 1A. The Courier Guy - Economy Road (Standard Door-to-Door)
      // Uses 0.001 so legacy client filters checking `cost > 0` pass, while displaying R0.00 / Free
      const promoEcoCost = 0.001;
      quotes.push({
        courierName: 'The Courier Guy',
        serviceLevel: 'The Courier Guy - Economy Road',
        serviceCode: 'ECO',
        deliveryType: 'home',
        cost: promoEcoCost,
        originalCost: ecoTotalCost,
        isFreeDelivery: true,
        estimatedDays: calculatedEco.estimatedDays,
        description: 'Direct door-to-door road courier across South Africa',
        legs: [
          {
            courierName: 'The Courier Guy Road Network',
            origin: originCountry,
            destination: customerAddress.city || destCountry,
            cost: 0
          }
        ]
      });

      // 1B. The Courier Guy - Priority Overnight (Next-Day Door Delivery)
      quotes.push({
        courierName: 'The Courier Guy',
        serviceLevel: 'The Courier Guy - Priority Overnight',
        serviceCode: 'PRI',
        deliveryType: 'home',
        cost: priTotalCost,
        originalCost: priTotalCost,
        isFreeDelivery: false,
        estimatedDays: calculatedPri.estimatedDays,
        description: 'Priority overnight express air delivery to your door',
        legs: [
          {
            courierName: 'The Courier Guy Express Air',
            origin: originCountry,
            destination: customerAddress.city || destCountry,
            cost: Number((priTotalCost * 0.75).toFixed(2))
          }
        ]
      });

      // 1C. The Courier Guy (PUDO) - Smart Locker / Kiosk Collection
      quotes.push({
        courierName: 'The Courier Guy (PUDO)',
        serviceLevel: 'PUDO Smart Locker Collection',
        serviceCode: 'D2L',
        deliveryType: 'pickup',
        cost: calculatedPudo.cost,
        originalCost: calculatedPudo.cost,
        isFreeDelivery: false,
        estimatedDays: calculatedPudo.estimatedDays,
        description: `Collect 24/7 at a secure PUDO smart locker station (Size: ${lockerSize})`,
        lockerSize,
        legs: [
          {
            courierName: 'The Courier Guy PUDO Locker Network',
            origin: originCountry,
            destination: customerAddress.city || destCountry,
            cost: Number((calculatedPudo.cost * 0.75).toFixed(2))
          }
        ]
      });

      // 1D. PostNet Branch Collection (PostNet-to-PostNet)
      const postnetLookup = options.postnetLookup || {};
      const isPostnetFree = postnetCollectionCost <= 0;
      quotes.push({
        courierName: 'PostNet',
        serviceLevel: 'PostNet Store Collection',
        deliveryType: 'pickup',
        cost: postnetCollectionCost,
        originalCost: postnetCollectionCost,
        isFreeDelivery: isPostnetFree,
        estimatedDays: '2–3 business days',
        description: isPostnetFree
          ? 'Complimentary pickup at your preferred PostNet branch counter'
          : 'Collect at your preferred PostNet branch counter',
        stores: postnetLookup.stores || [],
        searchedCity: postnetLookup.searchedCity || customerAddress.city || '',
        hasCityMatch: Boolean(postnetLookup.hasCityMatch),
        usingNearestCity: Boolean(postnetLookup.usingNearestCity),
        storeLookupError: postnetLookup.error || '',
        legs: [
          {
            courierName: 'PostNet Network',
            origin: originCountry,
            destination: customerAddress.city || 'Customer',
            cost: Number((postnetCollectionCost * 0.7).toFixed(2))
          }
        ]
      });

      // 1E. Aramex South Africa - Live Rate Engine (Overnight ONP & Economy Road PEC)
      // Calculated dynamically from product package box specs & actual chargeable weight
      const aramexVolumetricWeight = parseFloat(((parcelDims.length * parcelDims.width * parcelDims.height) / 5000).toFixed(2));
      const aramexChargeableWeight = Math.max(Number(totalWeightKg.toFixed(2)), aramexVolumetricWeight);
      const isRegionalDest = Boolean(customerAddress.isRegional || false);
      const regionalFee = isRegionalDest ? 65.00 : 0.00;

      // Aramex Overnight Express (ONP)
      const onpBase = 125.00 + Math.max(0, aramexChargeableWeight - 2) * 28.00 + regionalFee;
      const onpFuel = Number((onpBase * 0.125).toFixed(2));
      const onpSecurity = 5.00;
      const onpSubtotal = onpBase + onpFuel + onpSecurity;
      const onpTotal = parseFloat((onpSubtotal * 1.15).toFixed(2));

      // Aramex Economy Road (PEC)
      const pecBase = 75.00 + Math.max(0, aramexChargeableWeight - 2) * 16.00 + regionalFee;
      const pecFuel = Number((pecBase * 0.125).toFixed(2));
      const pecSecurity = 3.50;
      const pecSubtotal = pecBase + pecFuel + pecSecurity;
      const pecTotal = parseFloat((pecSubtotal * 1.15).toFixed(2));

      quotes.push({
        courierName: 'Aramex',
        serviceLevel: 'Aramex Overnight Express (ONP)',
        serviceCode: 'ONP',
        deliveryType: 'home',
        cost: onpTotal,
        originalCost: onpTotal,
        isFreeDelivery: false,
        estimatedDays: 'Next business day by 11:00 AM',
        description: `Aramex Priority Door-to-Door Overnight Air Express (Box: ${parcelDims.length}x${parcelDims.width}x${parcelDims.height}cm, Wt: ${aramexChargeableWeight}kg)`,
        boxDetails: {
          length_cm: parcelDims.length,
          width_cm: parcelDims.width,
          height_cm: parcelDims.height,
          actual_weight_kg: Number(totalWeightKg.toFixed(2)),
          volumetric_weight_kg: aramexVolumetricWeight,
          chargeable_weight_kg: aramexChargeableWeight
        },
        legs: [
          {
            courierName: 'Aramex SA Express Hub',
            origin: originCountry,
            destination: customerAddress.city || destCountry,
            cost: Number((onpTotal * 0.8).toFixed(2))
          }
        ]
      });

      quotes.push({
        courierName: 'Aramex',
        serviceLevel: 'Aramex Economy Road (PEC)',
        serviceCode: 'PEC',
        deliveryType: 'home',
        cost: pecTotal,
        originalCost: pecTotal,
        isFreeDelivery: false,
        estimatedDays: '2–3 business days',
        description: `Aramex Economy Road Express (Box: ${parcelDims.length}x${parcelDims.width}x${parcelDims.height}cm, Wt: ${aramexChargeableWeight}kg)`,
        boxDetails: {
          length_cm: parcelDims.length,
          width_cm: parcelDims.width,
          height_cm: parcelDims.height,
          actual_weight_kg: Number(totalWeightKg.toFixed(2)),
          volumetric_weight_kg: aramexVolumetricWeight,
          chargeable_weight_kg: aramexChargeableWeight
        },
        legs: [
          {
            courierName: 'Aramex SA Road Network',
            origin: originCountry,
            destination: customerAddress.city || destCountry,
            cost: Number((pecTotal * 0.8).toFixed(2))
          }
        ]
      });
    } 
    // 2. EXPORT (SA -> Intl, e.g. India, UAE, UK, USA)
    else if (originSA && !destSA) {
      isInternational = true;

      // Determine parcel box dimensions and weights dynamically from items
      let maxLen = 12, maxWid = 12, maxHgt = 34, totalActualWeight = totalWeightKg || 1.85;
      let totalVolumetric = 0;
      let isFragileParcel = true;
      let totalItemQty = 0;

      if (options.items && Array.isArray(options.items) && options.items.length > 0) {
        options.items.forEach(it => {
          const l = Number(it.shipping?.length_cm || 12);
          const w = Number(it.shipping?.width_cm || 12);
          const h = Number(it.shipping?.height_cm || 34);
          const wt = Number(it.shipping?.weight_kg || 1.85);
          const q = Number(it.quantity || it.qty || 1);
          totalItemQty += q;
          maxLen = Math.max(maxLen, l);
          maxWid = Math.max(maxWid, w);
          maxHgt = Math.max(maxHgt, h);
          totalVolumetric += ((l * w * h) / 5000) * q;
          if (it.shipping?.is_fragile !== undefined) isFragileParcel = it.shipping.is_fragile;
        });
      } else {
        totalVolumetric = (maxLen * maxWid * maxHgt) / 5000;
      }

      // Chargeable weight is the greater of actual weight and volumetric weight
      const chargeableWeight = Math.max(totalActualWeight, totalVolumetric);
      const roundedChargeable = Math.max(0.5, Math.ceil(chargeableWeight * 2) / 2); // 0.5kg brackets

      let liveAramexRate = null;
      let aramexEta = '4-7 business days';

      // 1. Attempt Live Aramex Rate Calculator API (https://nservice.aramex.co.za/Json/JsonV1/GetRate)
      const aramexEmail = process.env.ARAMEX_EMAIL || 'shipping@grandstoreglobal.com';
      const aramexPassword = process.env.ARAMEX_PASSWORD;
      const aramexAccount = process.env.ARAMEX_ACCOUNT_NUMBER || 'ZA123456';

      if (aramexPassword) {
        try {
          const destCountryCode = customerAddress.countryCode || (destCountry.toLowerCase() === 'india' ? 'IN' : 'US');
          const aramexPayload = {
            email_address: aramexEmail,
            password: aramexPassword,
            account_number: aramexAccount,
            sender_country_code: 'ZA',
            sender_country_name: 'South Africa',
            sender_suburb: 'Sandton',
            sender_postal_code: '2196',
            receiver_country_code: destCountryCode,
            receiver_country_name: destCountry,
            receiver_suburb: customerAddress.city || 'Metro',
            receiver_postal_code: customerAddress.postalCode || '0000',
            payment_type: 'P',
            service_type: 'PPX',
            is_documents: false,
            require_insurance: false,
            insurance_value: 0,
            parcels: [
              {
                parcel_value: shipmentItemsSubtotal,
                quantity: Math.max(1, totalItemQty || 1),
                length: Math.round(maxLen),
                width: Math.round(maxWid),
                height: Math.round(maxHgt),
                weight: Number(chargeableWeight.toFixed(2))
              }
            ],
            additonalservices: [{ service_code: '' }]
          };

          const aramexRes = await axios.post('https://nservice.aramex.co.za/Json/JsonV1/GetRate', aramexPayload, { timeout: 4000 });
          if (aramexRes.data && aramexRes.data.status_code === 0 && Number(aramexRes.data.rate) > 0) {
            liveAramexRate = Number(aramexRes.data.rate);
            if (aramexRes.data.expected_delivery_date) {
              aramexEta = `Delivery by ${aramexRes.data.expected_delivery_date}`;
            }
          }
        } catch (aramexErr) {
          console.warn('Aramex live JSON API rate call failed, using dynamic tariff:', aramexErr.message);
        }
      }

      // 2. Dynamic Tariff Formula for Aramex International Export (Zone 6 / Asia-Indian Subcontinent)
      let dynamicRate = liveAramexRate;
      if (!dynamicRate) {
        const base05Kg = 450.0;
        const additionalHalfKgs = Math.max(0, Math.round((roundedChargeable - 0.5) / 0.5));
        const freightBase = base05Kg + (additionalHalfKgs * 120.0);
        const fuelSurcharge = Number((freightBase * 0.125).toFixed(2));
        const securityFee = 65.0;
        const fragileCare = isFragileParcel ? 85.0 : 0.0;
        dynamicRate = Number((freightBase + fuelSurcharge + securityFee + fragileCare).toFixed(2));
      }

      quotes.push({
        courierName: 'Aramex',
        serviceLevel: 'Aramex Worldwide Express',
        serviceCode: 'EPX',
        deliveryType: 'home',
        cost: dynamicRate,
        estimatedDays: aramexEta,
        description: `Aramex Worldwide Express (Box: ${maxLen}x${maxWid}x${maxHgt}cm, Wt: ${Number(chargeableWeight.toFixed(2))}kg)`,
        boxDetails: {
          length_cm: maxLen,
          width_cm: maxWid,
          height_cm: maxHgt,
          actual_weight_kg: Number(totalActualWeight.toFixed(2)),
          volumetric_weight_kg: Number(totalVolumetric.toFixed(2)),
          chargeable_weight_kg: Number(chargeableWeight.toFixed(2))
        },
        legs: [
          {
            courierName: 'Aramex Local Partner Hub',
            origin: originCountry,
            destination: 'Aramex JNB Air Cargo Gateway',
            cost: Number((dynamicRate * 0.15).toFixed(2))
          },
          {
            courierName: 'Aramex International Air Transport',
            origin: 'Aramex JNB Air Cargo Gateway',
            destination: `${destCountry} Aramex International Hub`,
            cost: Number((dynamicRate * 0.70).toFixed(2))
          },
          {
            courierName: 'Aramex Last-Mile Courier Partner',
            origin: `${destCountry} Aramex International Hub`,
            destination: customerAddress.city || destCountry,
            cost: Number((dynamicRate * 0.15).toFixed(2))
          }
        ]
      });

      estimatedDuties = parseFloat((shipmentItemsSubtotal * 0.15).toFixed(2));
      estimatedTaxes = parseFloat((shipmentItemsSubtotal * 0.20).toFixed(2));
      customsFees = 250; 
    } 
    // 3. IMPORT (Intl -> SA) or CROSS-BORDER
    else {
      isInternational = true;
      let baseRate = 2500;
      quotes.push({
        courierName: 'Aramex',
        serviceLevel: 'Aramex International Priority',
        serviceCode: 'EPX',
        deliveryType: 'home',
        cost: baseRate,
        estimatedDays: '5-10 business days',
        legs: [
          {
            courierName: 'Aramex Global Air Freight',
            origin: originCountry,
            destination: 'Aramex SA Import Hub (JNB/CPT)',
            cost: baseRate * 0.65
          },
          {
            courierName: 'Aramex South Africa Domestic Delivery',
            origin: 'Aramex SA Import Hub (JNB/CPT)',
            destination: customerAddress.city || 'Customer',
            cost: baseRate * 0.15
          }
        ]
      });
      estimatedDuties = parseFloat((shipmentItemsSubtotal * 0.20).toFixed(2));
      estimatedTaxes = parseFloat((shipmentItemsSubtotal * 0.15).toFixed(2)); // SA VAT is 15% on imports
      customsFees = 300;
    }

    return {
      originCountry,
      destCountry,
      isInternational,
      quotes,
      landedCostEstimates: isInternational ? {
        estimatedDuties,
        estimatedTaxes,
        customsFees,
        totalImportCharges: estimatedDuties + estimatedTaxes + customsFees
      } : null
    };

  } catch (error) {
    console.error("Shipping Engine Error:", error);
    throw error;
  }
};

module.exports = { getShippingQuotes };
