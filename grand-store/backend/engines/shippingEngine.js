/**
 * GS Shipping & Courier Engine
 * Simulates shipping options, rates, and landed costs based on vendor profiles and destinations.
 */

const Vendor = require('../models/Vendor');
const PlatformSettings = require('../models/PlatformSettings');

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

    // 1. DOMESTIC SA
    if (originSA && destSA) {
      // Check if vendor has free shipping threshold
      const freeThreshold = vendor?.shippingProfile?.freeDeliveryThreshold;
      let postnetStandardCost = Number(platformSettings?.postnetStandardFee !== undefined ? platformSettings.postnetStandardFee : 120);
      let postnetExpressCost = Number(platformSettings?.postnetExpressFee !== undefined ? platformSettings.postnetExpressFee : 180);
      let postnetCollectionCost = Number(platformSettings?.postnetPickupFee !== undefined ? platformSettings.postnetPickupFee : 100);
      let courierGuyCost = 150;

      // Simple mock zone check
      if (vendor?.shippingProfile?.shippingZones?.length > 0) {
        const zone = vendor.shippingProfile.shippingZones.find(z => 
          z.name.toLowerCase().includes(customerAddress.city.toLowerCase())
        );
        if (zone) {
          postnetStandardCost = zone.rate || 120;
          postnetExpressCost = postnetStandardCost + 60;
          postnetCollectionCost = Math.max(50, postnetStandardCost - 20);
          courierGuyCost = postnetStandardCost + 30;
        }
      }

      if (freeThreshold && shipmentItemsSubtotal >= freeThreshold) {
        postnetStandardCost = 0;
        postnetCollectionCost = 0;
      }

      // 1A. PostNet Standard Home Delivery
      quotes.push({
        courierName: 'PostNet',
        serviceLevel: 'PostNet Standard Delivery',
        deliveryType: 'home',
        cost: postnetStandardCost,
        estimatedDays: '2–5 business days',
        description: 'PostNet door-to-door delivery',
        legs: [
          {
            courierName: 'PostNet Standard Courier',
            origin: originCountry,
            destination: customerAddress.city || destCountry,
            cost: postnetStandardCost > 0 ? postnetStandardCost * 0.7 : 70
          }
        ]
      });

      // 1B. PostNet Express Home Delivery
      quotes.push({
        courierName: 'PostNet',
        serviceLevel: 'PostNet Express Delivery',
        deliveryType: 'home',
        cost: postnetExpressCost,
        estimatedDays: '1–2 business days',
        description: 'Priority overnight door delivery',
        legs: [
          {
            courierName: 'PostNet Express Air/Road',
            origin: originCountry,
            destination: customerAddress.city || destCountry,
            cost: postnetExpressCost * 0.75
          }
        ]
      });

      // 1C. Courier Guy Alternative Door Delivery
      quotes.push({
        courierName: 'Courier Guy',
        serviceLevel: 'Courier Guy Door Delivery',
        deliveryType: 'home',
        cost: courierGuyCost,
        estimatedDays: '2–4 business days',
        description: 'Direct courier delivery',
        legs: [
          {
            courierName: 'Courier Guy Primary',
            origin: originCountry,
            destination: destCountry,
            cost: courierGuyCost > 0 ? courierGuyCost * 0.6 : 80
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
        estimatedDays: '2–3 business days',
        description: 'Collect at your preferred PostNet branch',
        stores: postnetLookup.stores || [],
        searchedCity: postnetLookup.searchedCity || customerAddress.city || '',
        hasCityMatch: Boolean(postnetLookup.hasCityMatch),
        usingNearestCity: Boolean(postnetLookup.usingNearestCity),
        storeLookupError: postnetLookup.error || '',
        legs: [
          {
            courierName: 'PostNet PUDO Network',
            origin: originCountry,
            destination: customerAddress.city || 'Customer',
            cost: postnetCollectionCost * 0.7
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
