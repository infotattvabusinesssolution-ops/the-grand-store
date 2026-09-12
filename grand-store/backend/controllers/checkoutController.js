const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const PlatformSettings = require('../models/PlatformSettings');
const { calculateTax } = require('../engines/taxEngine');
const { getShippingQuotes } = require('../engines/shippingEngine');
const { findNearestPostnetStores } = require('../services/postnetLocator');

// @desc    Generate a checkout quote (locked price)
// @route   POST /api/checkout/quote
// @access  Private
const generateQuote = async (req, res) => {
  try {
    let settings = await PlatformSettings.findOne();
    if (!settings) settings = await PlatformSettings.create({});
    const platformVatPct = settings.vatPct !== undefined ? settings.vatPct : 15;

    const { cartItems, shippingAddress, deliveryPreference = 'best' } = req.body;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }
    if (!shippingAddress || !shippingAddress.city || !shippingAddress.country) {
      return res.status(400).json({ message: 'A city and country are required to calculate delivery' });
    }
    const destinationCountry = shippingAddress.country.trim().toLowerCase();
    const isSouthAfricanDestination = ['south africa', 'za', 'rsa'].includes(destinationCountry);
    if (deliveryPreference === 'postnet' && !isSouthAfricanDestination) {
      return res.status(400).json({ message: 'PostNet pickup is only available within South Africa.' });
    }

    let postnetLookup = null;
    if (isSouthAfricanDestination && deliveryPreference !== 'home') {
      const postnetSearchAddress = [
        shippingAddress.address,
        shippingAddress.city,
        shippingAddress.postalCode,
        'South Africa'
      ].filter(Boolean).join(', ');

      try {
        postnetLookup = await findNearestPostnetStores({
          address: postnetSearchAddress,
          lat: shippingAddress.lat,
          lng: shippingAddress.lng,
          city: shippingAddress.city,
          limit: 6
        });
      } catch (error) {
        console.error('PostNet quote lookup error:', error.message);
        postnetLookup = {
          stores: [],
          searchedCity: shippingAddress.city,
          hasCityMatch: false,
          usingNearestCity: false,
          error: 'PostNet branches could not be loaded right now. Please retry the search.'
        };
      }
    }

    // 1. Enqueue products and group by vendor
    const vendorGroups = {};
    let globalSubtotal = 0;

    for (const item of cartItems) {
      const productId = item.product || item.id || item._id;
      let product = await Product.findOne({ id: productId }).catch(() => null);
      if (!product && productId && /^[0-9a-fA-F]{24}$/.test(productId.toString())) {
        product = await Product.findById(productId).catch(() => null);
      }

      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.name}` });
      }

      const vId = product.vendorId ? product.vendorId.toString() : 'unknown_vendor';
      if (!vendorGroups[vId]) {
        vendorGroups[vId] = {
          vendorId: product.vendorId,
          items: [],
          subtotal: 0,
          totalWeightKg: 0
        };
      }

      const itemPrice = product.price; // Enforce server-side pricing
      const itemSubtotal = itemPrice * item.quantity;
      
      const resolvedImage = product.image || (Array.isArray(product.gallery) && product.gallery[0]) || product.imageSourceUrl || item.image || item.product_image || '';
      const isSuperCoinEligible = !(product.isSuperCoinEligible === false || product.isSuperCoinEligible === 'false' || product.isSuperCoinEligible === 0 || product.isSuperCoinEligible === '0');
      const maxSuperCoinDiscountPct = Number(product.maxSuperCoinDiscountPct !== undefined ? product.maxSuperCoinDiscountPct : 10);
      const isReferralEligible = !(product.isReferralEligible === false || product.isReferralEligible === 'false' || product.isReferralEligible === 0 || product.isReferralEligible === '0');
      const referralDiscountPct = Number(product.referralDiscountPct !== undefined ? product.referralDiscountPct : 5);

      vendorGroups[vId].items.push({
        ...item,
        price: itemPrice, // overriding with server price
        image: resolvedImage,
        name: product.name || item.name,
        product: product.id || product._id || item.product,
        vendorId: product.vendorId,
        category: product.category || 'Uncategorised',
        subcategory: product.subcategory || '',
        isSuperCoinEligible,
        maxSuperCoinDiscountPct,
        isReferralEligible,
        referralDiscountPct
      });
      vendorGroups[vId].subtotal += itemSubtotal;
      
      // Default weight assumption if missing: 1.5kg per bottle
      vendorGroups[vId].totalWeightKg += (1.5 * item.quantity); 
      globalSubtotal += itemSubtotal;
    }

    // 2. Generate Shipment Quotes per Vendor
    const shipments = [];
    let hasInternational = false;
    let globalEstimatedDuties = 0;
    let globalEstimatedTaxes = 0;
    let globalCustomsFees = 0;

    for (const vId of Object.keys(vendorGroups)) {
      const group = vendorGroups[vId];
      
      let vendorName = 'The Grand Store';
      if (group.vendorId) {
        const vendor = await Vendor.findOne({ userId: group.vendorId }).catch(() => null);
        if (vendor) {
          vendorName = vendor.businessInfo?.tradingName || vendor.businessInfo?.legalName || 'Unknown Vendor';
        }
      }

      const shippingData = await getShippingQuotes(
        group.vendorId, 
        shippingAddress, 
        group.subtotal, 
        group.totalWeightKg,
        { postnetLookup, settings }
      );

      if (shippingData.isInternational) hasInternational = true;

      // Calculate tax for this specific shipment based on origin and dest
      const taxData = calculateTax(shippingData.originCountry, shippingData.destCountry, group.subtotal, platformVatPct);

      let shipmentDuties = 0, shipmentTaxes = 0, shipmentCustoms = 0;
      if (shippingData.landedCostEstimates) {
        shipmentDuties = shippingData.landedCostEstimates.estimatedDuties;
        shipmentTaxes = shippingData.landedCostEstimates.estimatedTaxes;
        shipmentCustoms = shippingData.landedCostEstimates.customsFees;
        
        globalEstimatedDuties += shipmentDuties;
        globalEstimatedTaxes += shipmentTaxes;
        globalCustomsFees += shipmentCustoms;
      }

      const availableQuotes = shippingData.quotes.filter((shippingQuote) => {
        if (deliveryPreference === 'postnet') {
          return shippingQuote.deliveryType === 'pickup' || shippingQuote.serviceLevel.includes('Collection');
        }
        if (deliveryPreference === 'home') {
          return shippingQuote.deliveryType === 'home';
        }
        return true;
      });

      if (availableQuotes.length === 0) {
        return res.status(400).json({
          message: deliveryPreference === 'postnet'
            ? 'PostNet pickup is only available for deliveries within South Africa.'
            : 'No delivery option is available for this destination.'
        });
      }

      shipments.push({
        vendorId: group.vendorId,
        vendorName: vendorName,
        items: group.items,
        subtotal: group.subtotal,
        originCountry: shippingData.originCountry,
        destCountry: shippingData.destCountry,
        isInternational: shippingData.isInternational,
        taxData,
        shippingQuotes: availableQuotes,
        landedCostEstimates: shippingData.landedCostEstimates,
        // Default selected courier is the first one
        selectedCourier: availableQuotes[0] || null,
        selectedPickupStore: (deliveryPreference === 'postnet' || availableQuotes[0]?.deliveryType === 'pickup')
          ? (req.body.preferredPostnetStore || req.body.selectedPostnetStore || null)
          : null
      });
    }

    // Calculate aggregated totals based on default selections
    let defaultShippingTotal = shipments.reduce((sum, shp) => sum + (shp.selectedCourier ? shp.selectedCourier.cost : 0), 0);
    let defaultVatTotal = shipments.reduce((sum, shp) => sum + shp.taxData.vatAmount, 0);
    
    // Note: Duties/Taxes are usually DAP (Customer pays at customs). If we wanted DDP, we'd add it to total.
    // For now, we display them as estimates, but do NOT add them to the Grand Store total to pay at checkout.
    // VAT is also deducted from the vendor's earnings, so it is NOT added to the customer's total to pay.
    const totalToPay = parseFloat((globalSubtotal + defaultShippingTotal).toFixed(2));

    // Calculate Super Coins allowance and earning
    const SuperCoinEngine = require('../engines/superCoinEngine');
    const User = require('../models/User');
    let userCoins = 0;
    let userRewardBalance = 0;
    if (req.user && req.user._id) {
      const dbUser = await User.findById(req.user._id).select('superCoinsBalance rewardBalance');
      if (dbUser) {
        userCoins = dbUser.superCoinsBalance || 0;
        userRewardBalance = Math.max(0, Number(dbUser.rewardBalance) || 0);
      }
    }

    // Calculate product-level eligible subtotals for SuperCoins and Referral discounts
    let superCoinEligibleSubtotal = 0;
    let referralEligibleSubtotal = 0;
    for (const vId in vendorGroups) {
      for (const it of vendorGroups[vId].items) {
        const itemLineTotal = Number(it.price || 0) * Number(it.quantity || 1);
        if (it.isSuperCoinEligible === true) {
          superCoinEligibleSubtotal += itemLineTotal;
        }
        if (it.isReferralEligible === true) {
          referralEligibleSubtotal += itemLineTotal;
        }
      }
    }
    superCoinEligibleSubtotal = parseFloat(superCoinEligibleSubtotal.toFixed(2));
    referralEligibleSubtotal = parseFloat(referralEligibleSubtotal.toFixed(2));

    const superCoinsEstimate = SuperCoinEngine.calculateAllowedRedemption({
      userCoins,
      eligibleSubtotal: superCoinEligibleSubtotal,
      shippingCost: defaultShippingTotal,
      commissionPct: settings.marketplaceCommissionPct || 15,
      gatewayFeePct: settings.gatewayFeePct || 2.5,
      settings
    });

    const potentialCoinsToEarn = SuperCoinEngine.calculateEarnedCoins(superCoinEligibleSubtotal, settings);

    const quoteId = `QUOTE-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 minutes

    res.json({
      quoteId,
      expiresAt,
      deliveryPreference,
      globalSubtotal,
      hasInternational,
      aggregatedTotals: {
        shipping: defaultShippingTotal,
        vat: defaultVatTotal,
        estimatedImportDuties: globalEstimatedDuties,
        estimatedImportTaxes: globalEstimatedTaxes,
        estimatedCustomsFees: globalCustomsFees,
        totalToPay // The amount to charge the card before coin discount
      },
      superCoins: {
        ...superCoinsEstimate,
        eligibleSubtotal: superCoinEligibleSubtotal,
        potentialCoinsToEarn
      },
      rewardBalance: userRewardBalance,
      referralEligibleSubtotal,
      bankDetails: settings.bankDetails,
      shipments
    });
  } catch (error) {
    console.error('Quote Generation Error:', error);
    res.status(500).json({ message: 'Server Error generating quote' });
  }
};

// @desc    Upload Guest 18+ Verification Document (ID, Passport, Driver's License)
// @route   POST /api/checkout/upload-guest-document
// @access  Public / OptionalAuth
const uploadGuestDocument = async (req, res) => {
  try {
    // 1. Direct Multer File Upload
    if (req.file) {
      return res.status(200).json({
        success: true,
        url: req.file.path || req.file.secure_url || req.file.url,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    }

    // 2. Base64 Upload (Useful for React Native or Canvas)
    const base64Data = req.body?.documentBase64 || req.body?.base64 || req.body?.image;
    if (base64Data && typeof base64Data === 'string') {
      const { cloudinary } = require('../config/cloudinary');
      const uploadRes = await cloudinary.uploader.upload(base64Data, {
        folder: 'grandstore-uploads/guest-kyc',
        resource_type: 'auto'
      });
      return res.status(200).json({
        success: true,
        url: uploadRes.secure_url,
        publicId: uploadRes.public_id,
        format: uploadRes.format,
        size: uploadRes.bytes
      });
    }

    // 3. Fallback direct URL reference
    if (req.body?.documentUrl && typeof req.body.documentUrl === 'string') {
      return res.status(200).json({
        success: true,
        url: req.body.documentUrl.trim(),
        originalName: 'provided_document_url'
      });
    }

    return res.status(400).json({
      message: 'No document file uploaded. Please select an image or PDF of your official ID or passport.'
    });
  } catch (error) {
    console.error('Guest document upload error:', error);
    return res.status(500).json({
      message: 'Failed to upload verification document',
      error: error.message
    });
  }
};

module.exports = {
  generateQuote,
  uploadGuestDocument
};

