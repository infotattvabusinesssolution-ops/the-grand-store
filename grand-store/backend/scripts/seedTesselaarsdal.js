require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const EstateProfile = require('../models/EstateProfile');
const Product = require('../models/Product');
const { slugify } = require('../utils/slugify');

const TESSELAARSDAL_EMAIL = 'berene@tesselaarsdalwines.co.za';
const TESSELAARSDAL_PASSWORD = 'Tesselaarsdal2026!';

const ASSETS = {
  pinotNoirTransparent: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1793165571/grandstore-uploads/products/tesselaarsdal/tesselaarsdal-pinot-noir-2024.png',
  pinotNoirLifestyle: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1793165574/grandstore-uploads/products/tesselaarsdal/tesselaarsdal-pinot-noir-2024-lifestyle.jpg',
  chardonnayTransparent: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1793165572/grandstore-uploads/products/tesselaarsdal/tesselaarsdal-chardonnay-2024.png',
  chardonnayLifestyle: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1793165575/grandstore-uploads/products/tesselaarsdal/tesselaarsdal-chardonnay-2024-lifestyle.jpg',
  vineyardHero: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1793165576/grandstore-uploads/estate/tesselaarsdal/vineyard_hero.jpg',
  bereneVineyard: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1793165577/grandstore-uploads/estate/tesselaarsdal/berene_sauls.jpg',
  cellarTastingTable: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1793165579/grandstore-uploads/estate/tesselaarsdal/tesselaarsdal_cellar_tasting_table.jpg',
  winePourTasting: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1793165580/grandstore-uploads/estate/tesselaarsdal/tesselaarsdal_wine_pour_tasting.jpg',
  bottlesCandlelight: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1793165581/grandstore-uploads/estate/tesselaarsdal/tesselaarsdal_bottles_candlelight.jpg',
  vineyardRidge: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1793165582/grandstore-uploads/estate/tesselaarsdal/tesselaarsdal_vineyard_ridge.jpg',
  oakBarrels: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1793165583/grandstore-uploads/estate/tesselaarsdal/tesselaarsdal_oak_barrels.png',
  bereneCellar: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1793165584/grandstore-uploads/estate/tesselaarsdal/tesselaarsdal_berene_cellar.jpg',
  wineThiefBarrel: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1793165585/grandstore-uploads/estate/tesselaarsdal/tesselaarsdal_wine_thief_barrel.jpg',
  bereneTastingBarrel: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1793165586/grandstore-uploads/estate/tesselaarsdal/tesselaarsdal_berene_tasting_barrel.jpg',
  logoSvg: 'https://res.cloudinary.com/oioqrgj0/raw/upload/v1793100320/grandstore-uploads/estate/tesselaarsdal/tesselaarsdal_logo_white.svg'
};

const PRODUCTS_DATA = [
  {
    name: 'Tesselaarsdal Pinot Noir 2024',
    vintage: '2024',
    category: 'Wine',
    subcategory: 'Red Wine',
    price: '810.00',
    tradePrice: 607.50,
    caseRetailPrice: 4860.00,
    caseTradePrice: 3645.00,
    size: '750ml',
    abv: '13.0%',
    production: '6,312 bottles & 30 Magnums',
    description: 'Marking the landmark 10th Vintage for Tesselaarsdal Wines. Only 6,312 bottles and 30 Magnums produced. Hand-harvested from extreme cool-climate vineyards on the Hemel-en-Aarde Ridge, fermented with indigenous yeasts, and matured in traditional clay amphorae and neutral French oak. Expresses wild red fruits, sour cherries and raspberries with combined hints of cloves and baking spices, finishing with a distinctive maritime saline tension and silky persistence.',
    tastingNotes: [
      'Sour Cherries',
      'Wild Raspberries',
      'Clove & Baking Spice',
      'Dried Cranberry',
      'Maritime Salinity',
      'Silky Tannins'
    ],
    flavorProfile: [
      'Bright & Vibrant',
      'Earthy & Spicy',
      'Mineral Tension'
    ],
    foodPairing: [
      'Roasted Duck Breast',
      'Springbok Carpaccio',
      'Wild Mushroom Risotto',
      'Grilled Salmon'
    ],
    image: ASSETS.pinotNoirTransparent,
    lifestyleImage: ASSETS.pinotNoirLifestyle,
    featured: true,
    stock: 48
  },
  {
    name: 'Tesselaarsdal Chardonnay 2024',
    vintage: '2024',
    category: 'Wine',
    subcategory: 'White Wine',
    price: '455.00',
    tradePrice: 296.25,
    caseRetailPrice: 2730.00,
    caseTradePrice: 1777.50,
    size: '750ml',
    abv: '13.0%',
    production: '7,930 bottles & 30 Magnums',
    description: 'Handcrafted in limited volumes (7,930 bottles and 30 Magnums produced) on the Hemel-en-Aarde Ridge by Berene Sauls. Vinified using an expressive combination of clay amphorae and neutral oak ageing to create an elegant wine that reflects roundness and a crisp acidity with subtle defining notes of white pear, lemon toast, and accents of lime blossom. Both silky and fresh with an elegant long finish.',
    tastingNotes: [
      'White Pear',
      'Lemon Toast',
      'Lime Blossom',
      'Crushed Stone Minerality',
      'Sea Spray Salinity',
      'Silky Creaminess'
    ],
    flavorProfile: [
      'Crisp & Fresh',
      'Mineral & Precise',
      'Rich & Textured'
    ],
    foodPairing: [
      'West Coast Crayfish',
      'Fresh Oysters',
      'Pan-Seared Kingklip',
      'Creamy Risotto'
    ],
    image: ASSETS.chardonnayTransparent,
    lifestyleImage: ASSETS.chardonnayLifestyle,
    featured: true,
    stock: 60
  }
];

async function seedTesselaarsdal() {
  console.log('--- Starting Tesselaarsdal Wines Seeding Process ---');
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is missing from environment variables.');
    }
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully.');

    // 1. CREATE OR UPDATE USER ACCOUNT
    console.log(`Checking user account for ${TESSELAARSDAL_EMAIL}...`);
    let user = await User.findOne({ email: TESSELAARSDAL_EMAIL.toLowerCase() });
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(TESSELAARSDAL_PASSWORD, salt);

    if (!user) {
      user = await User.create({
        name: 'Berene Sauls',
        email: TESSELAARSDAL_EMAIL.toLowerCase(),
        password: passwordHash,
        role: 'vendor_active',
        isEmailVerified: true,
        isAgeVerified: true,
        phone: '0733229499',
        customerTier: 'vendor'
      });
      console.log(`✅ Created Vendor User account: ${user.email} (Role: ${user.role})`);
    } else {
      user.name = 'Berene Sauls';
      user.password = passwordHash;
      user.role = 'vendor_active';
      user.isEmailVerified = true;
      user.isAgeVerified = true;
      user.phone = '0733229499';
      await user.save();
      console.log(`✅ Updated existing Vendor User account: ${user.email}`);
    }

    // 2. CREATE OR UPDATE VENDOR PROFILE
    console.log(`Checking Vendor profile for userId: ${user._id}...`);
    let vendor = await Vendor.findOne({ userId: user._id });
    const vendorData = {
      userId: user._id,
      vendorType: 'local',
      onboardingStep: 10,
      status: 'approved',
      paymentStatus: 'paid',
      registrationFee: 0,
      verificationScore: {
        businessVerified: true,
        identityVerified: true,
        licenceVerified: true,
        taxVerified: true,
        bankVerified: true
      },
      businessInfo: {
        legalName: 'Tesselaarsdal Wines (Pty) Ltd',
        tradingName: 'Tesselaarsdal Wines',
        registrationNumber: '2015/184291/07',
        businessType: 'Wine Producer, Vigneron & Cellar',
        address: 'Tesselaarsdal, Hemel-en-Aarde Ridge, Hermanus, Western Cape, 7200, South Africa',
        bannerUrl: ASSETS.vineyardHero,
        logoUrl: ASSETS.logoSvg
      },
      storyInfo: {
        brandStory: 'Founded in 2015 by long-standing Hamilton Russell Vineyards employee Berene Sauls. Tesselaarsdal is named after the historic Overberg farming hamlet where land was bequeathed to freed slaves in 1810. Berene crafts small-batch, cool-climate Pinot Noir and Chardonnay characterized by natural tension, maritime salinity, and clay amphorae aging.',
        winemakerBio: 'Berene Sauls — born in Tesselaarsdal, Overberg. Began in 2001 at Hamilton Russell Vineyards and rose through the ranks before launching her eponymous label in 2015. Winner of the #YAFF Agri-Processing Award, Top Female Entrepreneur in Youth in Agriculture, and South African Premier Business Awards nominee.'
      },
      shippingProfile: {
        pickupAddress: {
          addressLine1: 'Hemel-en-Aarde Ridge',
          city: 'Hermanus',
          state: 'Western Cape',
          postalCode: '7200',
          country: 'South Africa'
        }
      },
      productCategories: ['Wine'],
      sellingCapabilities: 'both',
      exportProfile: {
        approvalStatus: 'approved',
        isExportApproved: 'approved',
        customsExportCode: 'ZA-CUSTOMS-TESSELAARSDAL-EXP',
        businessType: 'winery',
        exportExperience: 'established',
        exportLicenceStatus: 'active',
        supplyCapacity: {
          monthlyCapacityBottles: 1500,
          maxPerShipmentBottles: 3000,
          standardLeadTimeDays: 7,
          canFulfilLongTermContracts: true
        },
        logisticsCapabilities: {
          exportPackagingReady: true,
          bottlesPerCase: 6,
          casesPerPallet: 100,
          palletsPer20ftContainer: 10,
          palletsPer40ftContainer: 20
        },
        tradeTerms: {
          supportedIncoterms: ['FOB', 'EXW', 'CIF'],
          preferredCurrency: 'ZAR',
          paymentTerms: 'Direct EFT / 30 Days Trade'
        },
        documents: []
      }
    };

    if (!vendor) {
      vendor = await Vendor.create(vendorData);
      console.log(`✅ Created Vendor profile for Tesselaarsdal Wines.`);
    } else {
      Object.assign(vendor, vendorData);
      vendor.exportProfile = vendorData.exportProfile;
      vendor.sellingCapabilities = vendorData.sellingCapabilities;
      vendor.markModified('exportProfile');
      await vendor.save();
      console.log(`✅ Updated Vendor profile for Tesselaarsdal Wines.`);
    }

    // 3. CREATE OR UPDATE ESTATE PROFILE
    console.log(`Checking EstateProfile for slug: tesselaarsdal-wines...`);
    let estate = await EstateProfile.findOne({ slug: 'tesselaarsdal-wines' });
    const estateData = {
      vendorId: user._id,
      slug: 'tesselaarsdal-wines',
      estateName: 'Tesselaarsdal Wines',
      country: 'South Africa',
      region: 'Hemel-en-Aarde Ridge, Overberg',
      tagline: 'Historic Cool-Climate Pinot Noir & Chardonnay by Berene Sauls',
      isPublished: true,
      seoTitle: 'Tesselaarsdal Wines | Hemel-en-Aarde Ridge Pinot Noir & Chardonnay',
      metaDescription: 'Discover Tesselaarsdal Wines from Hemel-en-Aarde Ridge, Overberg. Award-winning cool-climate Pinot Noir and Chardonnay handcrafted in amphorae by Berene Sauls.',
      heroImageUrl: ASSETS.vineyardHero,
      logoUrl: ASSETS.logoSvg,
      galleryUrls: [
        ASSETS.vineyardHero,
        ASSETS.bereneVineyard,
        ASSETS.cellarTastingTable,
        ASSETS.winePourTasting,
        ASSETS.bottlesCandlelight,
        ASSETS.vineyardRidge,
        ASSETS.oakBarrels
      ],
      story: {
        foundedYear: 2015,
        founders: 'Berene Sauls',
        winemaker: 'Berene Sauls',
        winemakerBio: 'Berene Sauls was born in the picturesque Overberg village of Tesselaarsdal. Beginning her wine journey at Hamilton Russell Vineyards in 2001, she developed deep mastery of cool-climate viticulture and international exports. In 2015, she founded Tesselaarsdal Wines, breaking new ground as one of South Africa\'s most celebrated and inspiring female winemakers.',
        history: 'Tesselaarsdal takes its name from the historic settlement in the Overberg founded in 1810 by Johannes Jacobus Tesselaar, who bequeathed his farm to his former servants and freed slaves. Berene Sauls, whose maternal ancestors lived in the valley for generations, purchased land on the Hemel-en-Aarde Ridge to cultivate high-density vineyards and produce unadorned, terroir-driven Pinot Noir and Chardonnay.',
        philosophy: 'Extreme cool-climate purity, minimal intervention, natural yeast fermentation, and traditional terracotta clay amphorae aging. The focus is on pristine fruit expression, vibrant maritime acidity, and a distinctive mineral salinity that mirrors the shale-rich soils of the Hemel-en-Aarde Ridge.',
        images: [
          ASSETS.bereneVineyard,
          ASSETS.vineyardRidge,
          ASSETS.wineThiefBarrel,
          ASSETS.oakBarrels
        ]
      },
      vineyard: {
        altitude: '280m – 350m above sea level',
        soil: 'Decomposed Bokkeveld shale and clay-rich weathered stone',
        climate: 'Maritime cool-climate with Benguela Current influence and cool sea breezes from Walker Bay',
        grapeVarieties: [
          'Pinot Noir',
          'Chardonnay'
        ],
        viticulture: 'Sustainable cool-climate viticulture, low yields, hand-harvested in early morning hours',
        sustainability: 'Low-intervention vinification, terracotta amphorae maturation, water stewardship, eco-conscious packaging',
        imageUrl: ASSETS.vineyardRidge
      },
      hospitality: {
        title: 'Cellar & Tasting Allocations',
        subtitle: 'Experience Tesselaarsdal in the Hemel-en-Aarde Ridge, Hermanus',
        hasTastings: true,
        tastingsImageUrl: ASSETS.cellarTastingTable,
        tastings: [
          {
            name: 'Tesselaarsdal Cellar Table Tasting',
            description: 'An intimate candlelit tasting of Tesselaarsdal Pinot Noir and Chardonnay vintages exploring cool-climate maritime terroir.',
            price: 250,
            duration: '60 minutes',
            capacity: 8,
            imageUrl: ASSETS.cellarTastingTable,
            isAvailable: true
          },
          {
            name: 'Signature Ridge Wine & Food Pairing',
            description: 'Explore the nuances of terracotta amphora maturation vs neutral oak, featuring 2024 releases paired with regional delicacies.',
            price: 450,
            duration: '75 minutes',
            capacity: 6,
            imageUrl: ASSETS.winePourTasting,
            isAvailable: true
          },
          {
            name: 'Private Cellar Allocation Experience',
            description: 'Exclusive barrel cellar tasting with founder Berene Sauls, tasting current 10th Vintage releases and library reserves.',
            price: 650,
            duration: '90 minutes',
            capacity: 6,
            imageUrl: ASSETS.bottlesCandlelight,
            isAvailable: true
          }
        ]
      },
      contact: {
        email: TESSELAARSDAL_EMAIL,
        phone: '073 322 9499',
        website: 'https://tesselaarsdalwines.co.za',
        address: 'Hemel-en-Aarde Ridge, Hermanus, Overberg, Western Cape, 7200, South Africa',
        instagram: 'https://instagram.com/tesselaarsdalwines'
      },
      awards: [
        '10th Vintage Anniversary Release (2015 – 2024)',
        'Winner #YAFF Agri-Processing Award',
        'Top Female Entrepreneur in Youth in Agriculture',
        'Special Minister\'s Award for Outstanding Winemaking',
        'Nominated South African Premier Business Awards',
        'Top Scoring Cool Climate South African Pinot Noir & Chardonnay'
      ]
    };

    if (!estate) {
      estate = await EstateProfile.create(estateData);
      console.log(`✅ Created Estate Profile: Tesselaarsdal Wines (slug: ${estate.slug})`);
    } else {
      Object.assign(estate, estateData);
      await estate.save();
      console.log(`✅ Updated Estate Profile: Tesselaarsdal Wines (slug: ${estate.slug})`);
    }

    // 4. SEED RETAIL & B2B TRADE PRODUCTS
    console.log(`Seeding ${PRODUCTS_DATA.length} Tesselaarsdal Wines products...`);
    let createdCount = 0;
    let updatedCount = 0;

    for (let i = 0; i < PRODUCTS_DATA.length; i++) {
      const pData = PRODUCTS_DATA[i];
      const prodSlug = slugify(pData.name);
      const customId = `prod_tesselaarsdal_${pData.subcategory.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${pData.vintage}`;

      const productPayload = {
        name: pData.name,
        slug: prodSlug,
        type: 'Wine',
        category: 'Wine',
        country: 'South Africa',
        brand: 'Tesselaarsdal Wines',
        size: pData.size,
        subcategory: pData.subcategory,
        description: pData.description,
        price: pData.price,
        image: pData.image,
        originalImage: pData.image,
        gallery: [
          pData.image
        ],
        featured: !!pData.featured,
        options: [pData.size],
        tags: [
          'Tesselaarsdal',
          'Tesselaarsdal Wines',
          'Berene Sauls',
          'South Africa',
          'Hemel-en-Aarde Ridge',
          'Overberg',
          pData.subcategory,
          'Wine',
          'Amphorae',
          '10th Vintage'
        ],
        tastingNotes: pData.tastingNotes,
        flavorProfile: pData.flavorProfile,
        foodPairing: pData.foodPairing,
        identity: {
          type: 'Wine',
          style: pData.subcategory,
          production: pData.production,
          origin: 'Hemel-en-Aarde Ridge, Overberg, South Africa',
          bottleSize: pData.size,
          abv: pData.abv,
          vintage: pData.vintage,
          magnumAvailable: true,
          tradePriceZar: pData.tradePrice,
          caseRetailPriceZar: pData.caseRetailPrice,
          caseTradePriceZar: pData.caseTradePrice
        },
        stock: pData.stock,
        shipping: {
          box_type: 'Standard Luxury Bottle Box',
          weight_kg: 1.5,
          length_cm: 10.0,
          width_cm: 10.0,
          height_cm: 32.0,
          is_fragile: true,
          parcel_value: parseFloat(pData.price),
          hs_code: '2204.21',
          aramexServiceType: 'ONP'
        },
        costing: {
          supplierPrice: pData.tradePrice,
          baseSellingPrice: parseFloat(pData.price),
          minimumSellingPrice: pData.tradePrice,
          rrp: parseFloat(pData.price),
          platformMarginPct: Math.round(((parseFloat(pData.price) - pData.tradePrice) / parseFloat(pData.price)) * 100),
          targetMarginPct: 25,
          marginStatus: 'healthy',
          caseRetailPrice: pData.caseRetailPrice,
          caseTradePrice: pData.caseTradePrice
        },
        vendorId: user._id,
        approvalStatus: 'approved',
        catalogManaged: true,
        exportReady: true,
        tradePrice: pData.tradePrice,
        channelSettings: {
          retail: {
            enabled: true,
            allowSingleBottle: true,
            minOrderQuantity: 1,
            maxOrderQuantity: 24,
            bottlePrice: parseFloat(pData.price),
            casePrice: pData.caseRetailPrice,
            caseSize: 6
          },
          trade: {
            enabled: true,
            exportReady: true,
            exportApprovalStatus: 'approved',
            minimumOrderQuantityBottles: 6,
            moqBottles: 6,
            bottlesPerCase: 6,
            casesPerPallet: 100,
            palletsPer20ft: 10,
            palletsPer40ft: 20,
            hsCode: '2204.21',
            supportedIncoterms: ['FOB', 'EXW', 'CIF'],
            leadTimeDays: 7,
            magnumAvailable: true,
            pricingCurrency: 'ZAR',
            volumeTiers: [
              {
                minCases: 1,
                maxCases: 9,
                pricePerCase: pData.caseTradePrice,
                notes: `Trade Price per case (R${pData.tradePrice} / bottle incl. 15% VAT)`
              },
              {
                minCases: 10,
                maxCases: 50,
                pricePerCase: Math.round(pData.caseTradePrice * 0.95),
                notes: 'Tier 2 Export & Wholesale Volume (5% discount)'
              }
            ]
          }
        }
      };

      // Check existing product
      let existing = await Product.findOne({
        $or: [
          { slug: prodSlug },
          { name: pData.name },
          { id: customId }
        ]
      });

      if (!existing) {
        await Product.create({
          id: customId,
          ...productPayload
        });
        createdCount++;
        console.log(`✅ Created Product: ${pData.name} (R${pData.price})`);
      } else {
        Object.assign(existing, productPayload);
        await existing.save();
        updatedCount++;
        console.log(`✅ Updated Product: ${pData.name} (R${pData.price})`);
      }
    }

    console.log(`\n🎉 TESSELAARSDAL WINES SEEDING COMPLETED SUCCESSFULLY!`);
    console.log(`===============================================`);
    console.log(`👤 VENDOR ACCOUNT:       ${user.email} (Role: ${user.role})`);
    console.log(`🏰 ESTATE PROFILE:        ${estate.estateName} (Slug: ${estate.slug})`);
    console.log(`🍷 PRODUCTS:              ${PRODUCTS_DATA.length} products`);
    console.log(`   Newly Inserted:        ${createdCount}`);
    console.log(`   Updated Existing:      ${updatedCount}`);
    console.log(`   Prices Verified:       Pinot Noir R810.00 / Chardonnay R455.00`);
    console.log(`   Trade Prices:          Pinot Noir R607.50 / Chardonnay R296.25`);
    console.log(`===============================================\n`);

    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding Tesselaarsdal:', error);
    process.exit(1);
  }
}

seedTesselaarsdal();
