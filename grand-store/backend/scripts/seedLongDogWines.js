require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const EstateProfile = require('../models/EstateProfile');
const Product = require('../models/Product');
const { slugify } = require('../utils/slugify');

const LONG_DOG_EMAIL = 'info@longdogwines.co.za';
const LONG_DOG_PASSWORD = 'LongDog2026!';

const ASSETS = {
  logo: '/assets/estate/long-dog-wines/long_dog_logo.png',
  blendBottle: '/assets/estate/long-dog-wines/long_dog_blend_2023.webp',
  bottleHero: '/assets/estate/long-dog-wines/bottle_hero.jpg',
  heroVineyard: '/assets/estate/long-dog-wines/hero_vineyard.jpg',
  vineyardLandscape: '/assets/estate/long-dog-wines/vineyard_landscape.jpg',
  cellarBarrels: '/assets/estate/long-dog-wines/cellar_barrels.jpg',
  wineGlassPour: '/assets/estate/long-dog-wines/wine_glass_pour.jpg',
  vineyardSimonsberg: '/assets/estate/long-dog-wines/vineyard_simonsberg.jpg',
  estateTerrace: '/assets/estate/long-dog-wines/estate_terrace.jpg',
  dogPackVineyard: '/assets/estate/long-dog-wines/dog_pack_vineyard.jpg',
  simonsbergSlopes: '/assets/estate/long-dog-wines/simonsberg_slopes.jpg',
};

const PRODUCT_DATA = {
  name: 'Long Dog Blend 2023',
  vintage: '2023',
  category: 'Wine',
  subcategory: 'Red Wine',
  type: 'Wine',
  country: 'South Africa',
  brand: 'Long Dog Wines',
  price: '295.00',
  tradePrice: 215.00,
  caseRetailPrice: 1770.00,
  caseTradePrice: 1290.00,
  size: '750ml',
  abv: '14.0%',
  production: '1.5-Acre Boutique Harvest · 24 Months French Oak',
  description:
    'Long dogs. Big flavour. Plenty to love. Handcrafted on one of South Africa’s smallest registered wine farms beneath the Simonsberg mountain in Stellenbosch, Long Dog Blend 2023 is an award-winning 50/50 marriage of estate-grown Cabernet Franc (1 acre) and Tannat (0.5 acre). Hand-harvested, basket-pressed, and matured for two full years in French oak barrels, it delivers lush ripe blackberry, black plum, and aromatic redcurrant lifted by violet notes, dark chocolate, leather, warm baking spice, and a velvety, mineral-laced finish.',
  tastingNotes: [
    'Ripe Black Plum',
    'Blackberry & Redcurrant',
    'Violet & Crushed Herbs',
    'Dark Chocolate & Cedar',
    'Warm Cinnamon Spice',
    'Velvety French Oak Tannins',
  ],
  flavorProfile: ['Rich & Bold', 'Plum & Warm Spice', 'Velvety Smooth Finish'],
  foodPairing: [
    'Flame-Grilled SA Braai Ribeye',
    'Slow-Braised Karoo Lamb Shanks',
    'Venison Potjie with Root Veg',
    'Aged Farmhouse Cheddar',
  ],
  image: ASSETS.blendBottle,
  gallery: [
    ASSETS.blendBottle,
    ASSETS.bottleHero,
    ASSETS.dogPackVineyard,
    ASSETS.vineyardLandscape,
  ],
  options: ['750ml'],
  bottlesPerCase: 6,
  caseConfiguration: '6 × 750ml',
  casePrice: 1770.0,
  caseWeight: 8.5,
  caseDimensions: { length_cm: 32, width_cm: 24, height_cm: 34 },
  supplyType: 'both',
  featured: true,
  stock: 120,
};

async function seedLongDogWines(existingConnection = null) {
  const shouldDisconnect = !existingConnection;
  if (!existingConnection) {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    console.log('Connected to MongoDB.');
  }

  try {
    console.log('--- Seeding Long Dog Wines (Simonsberg, Stellenbosch, South Africa) ---');

    // 1. CREATE OR UPDATE VENDOR USER ACCOUNT
    let user = await User.findOne({ email: LONG_DOG_EMAIL });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(LONG_DOG_PASSWORD, salt);

    if (!user) {
      user = await User.create({
        name: 'Dennis & Jackie Lamberti',
        email: LONG_DOG_EMAIL,
        password: hashedPassword,
        role: 'vendor_active',
        phone: '+27829043371',
        customerTier: 'vendor',
        isEmailVerified: true,
        isAgeVerified: true,
      });
      console.log(`✅ Created Vendor User: ${user.email}`);
    } else {
      user.name = 'Dennis & Jackie Lamberti';
      user.password = hashedPassword;
      user.role = 'vendor_active';
      user.phone = '+27829043371';
      user.customerTier = 'vendor';
      user.isEmailVerified = true;
      user.isAgeVerified = true;
      await user.save();
      console.log(`✅ Updated Vendor User: ${user.email}`);
    }

    // 2. CREATE OR UPDATE VENDOR PROFILE (Strictly aligned with Vendor.js schema)
    let vendor = await Vendor.findOne({ userId: user._id });
    const vendorData = {
      userId: user._id,
      vendorType: 'local',
      sellingCapabilities: 'both',
      onboardingStep: 10,
      status: 'approved',
      paymentStatus: 'paid',
      registrationFee: 0,
      crmWorkflowStage: 'live_active',
      verificationScore: {
        businessVerified: true,
        identityVerified: true,
        licenceVerified: true,
        taxVerified: true,
        bankVerified: true,
      },
      businessInfo: {
        legalName: 'Sky Ombre Trading (Pty) Ltd t/a Long Dog Wines',
        tradingName: 'Long Dog Wines',
        registrationNumber: '2017/294103/07',
        businessType: 'Boutique Wine Producer & Rescue Sanctuary',
        address: 'Lamberti Winery, Farm 103 Stellenbosch, Western Cape, 7600, South Africa',
        bannerUrl: ASSETS.heroVineyard,
        logoUrl: ASSETS.logo,
      },
      kycInfo: {
        directorName: 'Dennis & Jackie Lamberti',
        contactNumber: '+27 82 904 3371',
      },
      bankingInfo: {
        bankName: 'First National Bank (FNB)',
        accountName: 'Sky Ombre Trading (Pty) Ltd t/a Long Dog Wines',
        accountNumber: '62881944021',
        branchCode: '250655',
        accountType: 'Cheque / Current',
        swiftCode: 'FIRNZAJJ',
        isVerified: true,
        verifiedAt: new Date(),
        payoutPreference: 'Monthly',
      },
      deliveryInfo: {
        fulfillmentMethod: 'South African Courier & Cellar Collection',
        dispatchLocation: 'Lamberti Winery, Farm 103, Stellenbosch',
        dispatchDays: 'Monday – Friday',
        cutoffTime: '14:00 SAST',
        processingTime: '1–2 business days',
      },
      storyInfo: {
        brandStory:
          'Founded in 2017 beneath the Simonsberg mountain in Stellenbosch when Dennis and Jackie Lamberti left Johannesburg for a new chapter in the winelands: Dennis would craft wine from a 1.5-acre vineyard, and Jackie would rescue long-bodied dogs. Today, Long Dog Wines is both one of South Africa’s smallest registered wine farms and a warm working animal sanctuary.',
        winemakerBio:
          'Dennis Lamberti — Hands-on winemaker championing basket-pressed, minimal-intervention Cabernet Franc and Tannat matured 24 months in French oak barrels (assisted closely by Dino the Rescue Pup, Chief Flavour Master).',
      },
      shippingProfile: {
        pickupAddress: {
          street: 'Lamberti Winery, Farm 103, Simonsberg',
          city: 'Stellenbosch',
          postalCode: '7600',
          country: 'South Africa',
        },
        defaultDimensions: { length: 32, width: 24, height: 34, unit: 'cm' },
        defaultWeight: { value: 8.5, unit: 'kg' },
        freeDeliveryThreshold: 1770,
        handlingTimeDays: 2,
      },
      productCategories: ['Wine'],
      agreements: {
        termsAccepted: true,
        informationAccurate: true,
        acceptedAt: new Date(),
      },
      exportProfile: {
        approvalStatus: 'approved',
        isExportApproved: 'approved',
        businessType: 'winery',
        exportExperience: 'occasional',
        exportLicenceStatus: 'active',
        supplyCapacity: {
          monthlyCapacityBottles: 600,
          maxPerShipmentBottles: 1200,
          standardLeadTimeDays: 5,
          canFulfilLongTermContracts: false,
        },
        logisticsCapabilities: {
          exportPackagingReady: true,
          bottlesPerCase: 6,
          casesPerPallet: 80,
          palletsPer20ftContainer: 8,
          palletsPer40ftContainer: 16,
        },
        tradeTerms: {
          supportedIncoterms: ['EXW', 'FOB'],
          preferredCurrency: 'ZAR',
          paymentTerms: 'Direct EFT / 30 Days Trade',
        },
        documents: [],
      },
    };

    if (!vendor) {
      vendor = await Vendor.create(vendorData);
      console.log('✅ Created Vendor Profile: Long Dog Wines');
    } else {
      Object.assign(vendor, vendorData);
      vendor.markModified('exportProfile');
      vendor.markModified('shippingProfile');
      await vendor.save();
      console.log('✅ Updated Vendor Profile: Long Dog Wines');
    }

    // 3. CREATE OR UPDATE ESTATE PROFILE (Shown in Join Wine Farm & /estate/long-dog-wines)
    let estate = await EstateProfile.findOne({ slug: 'long-dog-wines' });
    const estateData = {
      vendorId: user._id,
      slug: 'long-dog-wines',
      estateName: 'Long Dog Wines',
      country: 'South Africa',
      region: 'Simonsberg, Stellenbosch, Western Cape',
      tagline:
        'Where character runs deep, and legacy walks on four legs. Handcrafted Cabernet Franc & Tannat from our boutique 1.5-acre Simonsberg vineyard and working rescue-dog sanctuary in Stellenbosch.',
      isPublished: true,
      seoTitle: 'Long Dog Wines | Simonsberg Stellenbosch Boutique Winery & Rescue Sanctuary',
      metaDescription:
        'Discover Long Dog Wines beneath the Simonsberg mountain in Stellenbosch, South Africa. Award-winning 50/50 Cabernet Franc & Tannat crafted by Dennis & Jackie Lamberti on a working rescue dog sanctuary.',
      heroImageUrl: ASSETS.heroVineyard,
      logoUrl: ASSETS.logo,
      galleryUrls: [
        ASSETS.heroVineyard,
        ASSETS.dogPackVineyard,
        ASSETS.estateTerrace,
        ASSETS.vineyardLandscape,
        ASSETS.vineyardSimonsberg,
        ASSETS.simonsbergSlopes,
        ASSETS.wineGlassPour,
        ASSETS.cellarBarrels,
      ],
      story: {
        foundedYear: 2017,
        founders: 'Dennis & Jackie Lamberti',
        winemaker: 'Dennis Lamberti & The Long Dog Pack',
        winemakerBio:
          'In 2017, Jackie and Dennis Lamberti sold their business in Johannesburg and headed to the Western Cape in search of something slower and deeper in the Stellenbosch winelands. Falling in love with Lamberti Winery Farm 103 beneath the Simonsberg mountain, a deal was struck: Dennis could make wine, and Jackie could rescue dogs. From just 1.5 acres of hand-tended vines, they craft big-hearted, internationally awarded red blends while giving rescued dogs a lifelong sanctuary.',
        history:
          'Long Dog Wines is a vineyard with a long tail and an even longer story. When Dennis and Jackie moved down with four beloved rescues—Dino, Lassy, Noodle, and Gunner—they discovered Sam, a quiet German Shepherd left behind on the farm who was quickly promoted to Vineyard Manager. Over time, Enzo, Ziggy, and Nibby joined the crew. Every bottle celebrates second chances, slow living, and traditional craftsmanship.',
        philosophy:
          'Every vine here is tended by hand. Every barrel is watched over with patience. We choose tools over tech, tradition over shortcuts, and care over speed—basket-pressed and matured for 24 months in French oak barrels.',
        images: [
          ASSETS.dogPackVineyard,
          ASSETS.estateTerrace,
          ASSETS.vineyardLandscape,
          ASSETS.bottleHero,
        ],
      },
      vineyard: {
        altitude: '300m above sea level beneath the Simonsberg Peak',
        soil: 'Deep decomposed granite, weathered Table Mountain sandstone & clay subsoils',
        climate: 'Mediterranean climate cooled by afternoon False Bay breezes channeled by the Simonsberg amphitheatre',
        grapeVarieties: ['Cabernet Franc (1.0 Acre)', 'Tannat (0.5 Acre)'],
        viticulture:
          '100% Hand-pruned, hand-harvested in small parcels across 1.5 acres on one of South Africa’s smallest registered wine farms, traditionally basket-pressed and aged 24 months in French oak.',
        sustainability:
          'Working rescue dog sanctuary & biodiversity haven with minimal-intervention winemaking and regenerative cover crops.',
        imageUrl: ASSETS.wineGlassPour,
      },
      hospitality: {
        title: 'Cellar Door & Sanctuary Experiences',
        subtitle: 'Visit Lamberti Winery in Stellenbosch — Meet the Founders, Sip the Blend & Meet the Pack',
        hasTastings: true,
        tastingsImageUrl: ASSETS.wineGlassPour,
        tastings: [
          {
            name: 'Simonsberg Sanctuary & Signature Blend Tasting',
            description:
              'Enjoy an unhurried guided tasting of the award-winning Long Dog Blend 2023 on the terrace with Dennis, Jackie, and the rescue pack.',
            price: 150,
            duration: '45 minutes',
            capacity: 8,
            imageUrl: ASSETS.wineGlassPour,
            isAvailable: true,
          },
          {
            name: 'French Oak Cellar & Basket-Press Walkthrough',
            description:
              'Step inside our intimate boutique winery cellar to explore traditional basket-pressing and taste maturing Cabernet Franc & Tannat straight from barrel.',
            price: 250,
            duration: '60 minutes',
            capacity: 6,
            imageUrl: ASSETS.vineyardSimonsberg,
            isAvailable: true,
          },
          {
            name: 'Sunset Braai Fire & Vineyard Picnic with the Pack',
            description:
              'Wander between the 1.5-acre vines beneath the Simonsberg Peak with Sam, Dino, and Ziggy, followed by an artisanal farm platter by the wood fire.',
            price: 450,
            duration: '90 minutes',
            capacity: 6,
            imageUrl: ASSETS.cellarBarrels,
            isAvailable: true,
          },
        ],
      },
      contact: {
        email: LONG_DOG_EMAIL,
        phone: '+27 (0) 82 904 3371',
        website: 'https://www.longdogwines.co.za',
        address: 'Lamberti Winery, Farm 103 Stellenbosch, Western Cape, 7600, South Africa',
        mapLink: 'https://maps.google.com/?q=Lamberti+Winery,Farm+103,Stellenbosch,7600,South+Africa',
        facebook: 'https://www.facebook.com/longdogwines',
      },
      awards: [
        'Gold Medal — Michelangelo International Wine & Spirits Awards 2025 (Label Mountain)',
        'Gold Medal — Vitis Vinifera Awards 2026',
        'Gold Medal — The Annual Vine & Spirit Awards 2026',
        'Silver Medal — International Wine & Spirit Competition (IWSC 2026)',
        'Silver Medal — Aurora International Taste Challenge 2026',
        'Silver Medal — South African Food & Beverage Awards 2026',
      ],
    };

    if (!estate) {
      estate = await EstateProfile.create(estateData);
      console.log(`✅ Created Estate Profile: Long Dog Wines (slug: ${estate.slug})`);
    } else {
      Object.assign(estate, estateData);
      await estate.save();
      console.log(`✅ Updated Estate Profile: Long Dog Wines (slug: ${estate.slug})`);
    }

    // Remove redundant separate Case-of-6 duplicate product if present from earlier seed
    const removedDup = await Product.deleteMany({
      slug: 'long-dog-blend-2023-case-of-6',
    });
    if (removedDup.deletedCount > 0) {
      console.log(`🧹 Cleaned ${removedDup.deletedCount} redundant duplicate case SKU (handled dynamically on primary bottle page).`);
    }

    // 4. CREATE OR UPDATE FLAGSHIP PRODUCT
    const prodSlug = slugify(PRODUCT_DATA.name);
    const customId = 'prod_long_dog_blend_2023';

    const fullProductPayload = {
      id: customId,
      slug: prodSlug,
      seoTitle: 'Long Dog Blend 2023 | Cabernet Franc & Tannat — Stellenbosch, South Africa',
      metaDescription:
        'Order Long Dog Blend 2023 directly from Lamberti Winery in Stellenbosch. Award-winning 50% Cabernet Franc & 50% Tannat available by single bottle (R295) or Case of 6 (R1,770).',
      vendorId: user._id,
      name: PRODUCT_DATA.name,
      brand: PRODUCT_DATA.brand,
      category: PRODUCT_DATA.category,
      subcategory: PRODUCT_DATA.subcategory,
      type: PRODUCT_DATA.type,
      country: PRODUCT_DATA.country,
      size: PRODUCT_DATA.size,
      price: PRODUCT_DATA.price,
      description: PRODUCT_DATA.description,
      image: PRODUCT_DATA.image,
      originalImage: PRODUCT_DATA.image,
      sourceUrl: 'https://www.longdogwines.co.za/product/long-dog-blend/',
      importedAt: new Date(),
      gallery: PRODUCT_DATA.gallery,
      featured: PRODUCT_DATA.featured,
      options: PRODUCT_DATA.options,
      tags: [
        'Long Dog Wines',
        'Long Dog Blend 2023',
        'Cabernet Franc',
        'Tannat',
        'Simonsberg',
        'Stellenbosch',
        'South Africa',
        'Red Blend',
        'Wine',
        'Sanctuary Winery',
        'Michelangelo Gold',
        'IWSC Silver',
      ],
      tastingNotes: PRODUCT_DATA.tastingNotes,
      flavorProfile: PRODUCT_DATA.flavorProfile,
      foodPairing: PRODUCT_DATA.foodPairing,
      identity: {
        type: 'Wine',
        style: '50% Cabernet Franc · 50% Tannat',
        production: PRODUCT_DATA.production,
        origin: 'Simonsberg, Stellenbosch, South Africa',
        age: '2023 Vintage (24 Months French Oak)',
        bottleSize: '750ml',
        abv: PRODUCT_DATA.abv,
      },
      stock: PRODUCT_DATA.stock,
      bottlesPerCase: PRODUCT_DATA.bottlesPerCase,
      caseConfiguration: PRODUCT_DATA.caseConfiguration,
      casePrice: PRODUCT_DATA.casePrice,
      caseWeight: PRODUCT_DATA.caseWeight,
      caseDimensions: PRODUCT_DATA.caseDimensions,
      supplyType: PRODUCT_DATA.supplyType,
      shipping: {
        box_type: 'Standard Wine Bottle Shipper',
        weight_kg: 1.45,
        length_cm: 10.0,
        width_cm: 10.0,
        height_cm: 32.0,
        is_fragile: true,
        parcel_value: 295.0,
        hs_code: '2204.21',
        aramexServiceType: 'ONP',
      },
      costing: {
        supplierPrice: PRODUCT_DATA.tradePrice,
        baseSellingPrice: 295.0,
        minimumSellingPrice: PRODUCT_DATA.tradePrice,
        rrp: 295.0,
        platformMarginPct: Math.round(((295 - PRODUCT_DATA.tradePrice) / 295) * 100),
        targetMarginPct: 25,
        marginStatus: 'healthy',
      },
      approvalStatus: 'approved',
      catalogManaged: true,
      channelSettings: {
        retail: {
          enabled: true,
          minOrderQuantity: 1,
          maxOrderQuantity: 24,
        },
        trade: {
          enabled: true,
          exportApprovalStatus: 'approved',
          moqBottles: 6,
          bottlesPerCase: 6,
          casesPerPallet: 80,
          palletsPer20ft: 8,
          palletsPer40ft: 16,
          leadTimeDays: 5,
          hsCode: '2204.21',
          supportedIncoterms: ['EXW', 'FOB'],
          pricingCurrency: 'ZAR',
          volumeTiers: [
            {
              minCases: 1,
              maxCases: 9,
              pricePerCase: PRODUCT_DATA.caseTradePrice,
              notes: 'Trade Case Allocation (6 × 750ml incl. VAT)',
            },
            {
              minCases: 10,
              maxCases: 40,
              pricePerCase: Math.round(PRODUCT_DATA.caseTradePrice * 0.95),
              notes: 'Hospitality & Multi-Case Allocation (5% volume saving)',
            },
          ],
        },
      },
    };

    let existingProduct = await Product.findOne({
      $or: [{ slug: prodSlug }, { id: customId }, { name: PRODUCT_DATA.name }],
    });

    if (!existingProduct) {
      await Product.create(fullProductPayload);
      console.log(`✅ Created Flagship Product: ${PRODUCT_DATA.name} (R295 bottle / R1,770 Case of 6)`);
    } else {
      Object.assign(existingProduct, fullProductPayload);
      await existingProduct.save();
      console.log(`✅ Updated Flagship Product: ${PRODUCT_DATA.name} (R295 bottle / R1,770 Case of 6)`);
    }

    console.log('\n🐾 LONG DOG WINES SEEDING COMPLETE!');
  } catch (err) {
    console.error('❌ Error seeding Long Dog Wines:', err);
    throw err;
  } finally {
    if (shouldDisconnect) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB.');
    }
  }
}

if (require.main === module) {
  seedLongDogWines()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seedLongDogWines;
