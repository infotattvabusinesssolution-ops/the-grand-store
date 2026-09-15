/**
 * GS Shipping & Courier Engine
 * Simulates shipping options, rates, and landed costs based on vendor profiles and destinations.
 */

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
      // Estimate parcel box dimensions based on chargeable weight
      let parcelDims = { length: 35, width: 12, height: 12 };
      if (totalWeightKg > 10) {
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
      quotes.push({
        courierName: 'The Courier Guy',
        serviceLevel: 'The Courier Guy - Economy Road',
        serviceCode: 'ECO',
        deliveryType: 'home',
        cost: ecoTotalCost,
        originalCost: ecoTotalCost,
        isFreeDelivery: false,
        estimatedDays: calculatedEco.estimatedDays,
        description: 'Direct door-to-door road courier across South Africa',
        legs: [
          {
            courierName: 'The Courier Guy Road Network',
            origin: originCountry,
            destination: customerAddress.city || destCountry,
            cost: Number((ecoTotalCost * 0.75).toFixed(2))
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
      quotes.push({
        courierName: 'PostNet',
        serviceLevel: 'PostNet Store Collection',
        deliveryType: 'pickup',
        cost: postnetCollectionCost,
        originalCost: postnetCollectionCost,
        isFreeDelivery: false,
        estimatedDays: '2–3 business days',
        description: 'Collect at your preferred PostNet branch counter',
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
    } 
    // 2. EXPORT (SA -> Intl)
    else if (originSA && !destSA) {
      isInternational = true;
      let baseRate = 1800; // R1800 flat rate mock
      if (totalWeightKg > 10) baseRate += 500;
      
      quotes.push({
        courierName: 'DHL Express',
        serviceLevel: 'International Express',
        deliveryType: 'home',
        cost: baseRate,
        estimatedDays: '5-8 business days',
        legs: [
          {
            courierName: 'Local Courier',
            origin: originCountry,
            destination: 'SA Export Hub',
            cost: 200
          },
          {
            courierName: 'DHL International',
            origin: 'SA Export Hub',
            destination: `${destCountry} Import Hub`,
            cost: baseRate * 0.6
          },
          {
            courierName: 'DHL Local Partner',
            origin: `${destCountry} Import Hub`,
            destination: customerAddress.city || destCountry,
            cost: baseRate * 0.15
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
        courierName: 'DHL Express',
        serviceLevel: 'International Priority',
        deliveryType: 'home',
        cost: baseRate,
        estimatedDays: '7-14 business days',
        legs: [
          {
            courierName: 'Global Logistics',
            origin: originCountry,
            destination: 'SA Import Hub',
            cost: baseRate * 0.65
          },
          {
            courierName: 'GS Domestic Logistics',
            origin: 'SA Import Hub',
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
