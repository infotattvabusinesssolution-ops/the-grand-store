require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');
const path = require('path');
const fs = require('fs');

if (process.env.MONGO_URI && process.env.MONGO_URI.startsWith('mongodb+srv://')) {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

const User = require('../models/User');
const Vendor = require('../models/Vendor');
const EstateProfile = require('../models/EstateProfile');
const Product = require('../models/Product');

// Read uploaded Cloudinary URLs
const urlsPath = path.resolve(__dirname, '..', 'scratch', 'uploaded_cloudinary_urls.json');
const imgMap = JSON.parse(fs.readFileSync(urlsPath, 'utf8'));

const getUrl = (key) => imgMap[key]?.secure_url || '';

async function seedGiuliani() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB successfully.');

  // 1. Create or Update Vendor User
  const vendorEmail = 'giulianivini@grandstore.co.za';
  let user = await User.findOne({ email: vendorEmail });

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('GiulianiVini2026!', salt);

  if (!user) {
    user = await User.create({
      name: 'Vito Donato Giuliani',
      email: vendorEmail,
      password: hashedPassword,
      phone: '+39 080.891.53.35',
      phoneNumber: '+39 080.891.53.35',
      role: 'vendor_active',
      isEmailVerified: true,
      isAgeVerified: true,
      kycVerified: true,
      customerTier: 'vendor'
    });
    console.log(`Created Vendor User: ${user.name} (${user.email}) [ID: ${user._id}]`);
  } else {
    user.role = 'vendor_active';
    user.isEmailVerified = true;
    user.isAgeVerified = true;
    user.kycVerified = true;
    user.customerTier = 'vendor';
    user.name = 'Vito Donato Giuliani';
    user.phone = '+39 080.891.53.35';
    await user.save();
    console.log(`Updated Vendor User: ${user.name} (${user.email}) [ID: ${user._id}]`);
  }

  // 2. Create or Update Vendor Document
  let vendor = await Vendor.findOne({ userId: user._id });
  const vendorData = {
    userId: user._id,
    vendorType: 'international',
    onboardingStep: 10,
    status: 'approved',
    paymentStatus: 'paid',
    paidAt: new Date(),
    crmWorkflowStage: 'live_active',
    crmExportCapability: true,
    crmExportLicenceVerified: true,
    verificationScore: {
      businessVerified: true,
      identityVerified: true,
      licenceVerified: true,
      taxVerified: true,
      bankVerified: true
    },
    businessInfo: {
      legalName: 'Azienda Agricola Giuliani Raffaele',
      tradingName: 'GIULIANI Vini',
      registrationNumber: 'IT04589210729',
      businessType: 'Winery / Estate Producer',
      address: 'Via Gioia Canale, 18, 70010 Turi (BA), Puglia, Italy',
      logoUrl: getUrl('giuliani_logo') || getUrl('giuliani_emblem'),
      bannerUrl: getUrl('vineyard_hero')
    },
    kycInfo: {
      directorName: 'Vito Donato Giuliani',
      idNumber: 'GLIVDN74H15E038X',
      contactNumber: '+39 080.891.53.35'
    },
    taxInfo: {
      taxNumber: 'IT04589210729',
      vatNumber: 'IT04589210729'
    },
    licenceInfo: {
      licenceNumber: 'DOC-BA-GIULIANI-2026',
      licenceType: 'DOC / DOP Producer License',
      expiryDate: new Date('2032-12-31')
    },
    bankingInfo: {
      bankName: 'Banca Popolare di Puglia e Basilicata',
      accountName: 'Azienda Agricola Giuliani Raffaele',
      accountNumber: 'IT89P0538541520000001234567',
      branchCode: '05385',
      swiftCode: 'BPPBIT2BXXX',
      isVerified: true,
      verifiedAt: new Date(),
      payoutPreference: 'Monthly'
    },
    productCategories: ['Wine', 'Sparkling Wine', 'Dessert Wine'],
    deliveryInfo: {
      fulfillmentMethod: 'Direct Temperature-Controlled International Cellar Dispatch',
      dispatchLocation: 'Turi / Gioia del Colle, Puglia, Italy',
      dispatchDays: 'Monday to Friday',
      cutoffTime: '14:00 CET',
      processingTime: '2-3 Business Days'
    },
    storyInfo: {
      winemakerBio: 'Luca Petrelli (Oenologist) and Vito Donato Giuliani (Agronomist & Owner).',
      brandStory: 'In the heart of Murgia barese, on the hills stretching from the Municipality of Turi to Gioia del Colle, Raffaele Giuliani started the company that today is led by his son Vito Donato Giuliani. 50 hectares in "under the canal" near the archaeological site of Monte Sannace produce high quality Primitivo, Aleatico, Susumaniello and traditional Apulian wines.',
      wineryPhotosUrl: getUrl('vineyard_hero')
    },
    shippingProfile: {
      pickupAddress: {
        street: 'Via Gioia Canale, 18',
        city: 'Turi',
        postalCode: '70010',
        country: 'Italy'
      },
      handlingTimeDays: 2
    },
    maintenanceFee: {
      amount: 500,
      status: 'paid',
      lastPaidAt: new Date(),
      nextDueAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    },
    agreements: {
      termsAccepted: true,
      informationAccurate: true,
      acceptedAt: new Date()
    }
  };

  if (!vendor) {
    vendor = await Vendor.create(vendorData);
    console.log(`Created Vendor Profile for GIULIANI Vini [ID: ${vendor._id}]`);
  } else {
    Object.assign(vendor, vendorData);
    await vendor.save();
    console.log(`Updated Vendor Profile for GIULIANI Vini [ID: ${vendor._id}]`);
  }

  // 3. Create or Update EstateProfile
  let estate = await EstateProfile.findOne({ vendorId: user._id });
  const estateData = {
    vendorId: user._id,
    slug: 'giuliani-vini',
    estateName: 'GIULIANI Vini',
    region: 'Gioia del Colle, Puglia',
    country: 'Italy',
    tagline: 'Love for Nature, Passion for Wines',
    isPublished: true,
    heroImageUrl: getUrl('vineyard_hero'),
    galleryUrls: [
      getUrl('vineyard_hero'),
      getUrl('1922_artwork'),
      getUrl('baronaggio'),
      getUrl('lavarossa')
    ],
    story: {
      foundedYear: 1922,
      founders: 'Raffaele Giuliani',
      winemaker: 'Luca Petrelli (Oenologist) & Vito Donato Giuliani (Agronomist & Owner)',
      history: 'In the heart of Murgia barese, on the hills stretching from the Municipality of Turi to Gioia del Colle, Raffaele Giuliani started the company that today is led by his son Vito Donato Giuliani. The favourable climate lets the grapes reach the right ripening and give wines the unique qualities of the territory, clearly visible in the intense red-purple colour characterizing the grapes of Primitivo and Aleatico, symbolic wine varieties of this area. The company extends over 50 hectares in the territory known as "under the canal", near the archaeological site of "Monte Sannace". The whole production cycle is followed with care and passion: from manual harvest to vinification and bottling.',
      philosophy: 'Love for Nature, Passion for Wines: preserving terroir character through sustainable viticulture, indigenous yeasts, and estate bottling.'
    },
    vineyard: {
      altitude: '250 mt',
      soil: 'Red land with outcropping limestone rocks (terre rosse) that provide roots limestone and relief from summer heat.',
      climate: 'Mediterranean climate with dry hot summers and significant 10-15°C diurnal thermal excursion.',
      grapeVarieties: ['Primitivo', 'Susumaniello', 'Aleatico', 'Nero di Troia', 'Negroamaro', 'Fiano', 'Chardonnay', 'Malvasia'],
      viticulture: 'Spurred Cordon, 4,500 stocks per hectare, manual bunch selection harvest.',
      sustainability: 'Manual harvesting, low environmental impact agro-ecology, indigenous fermentation.',
      imageUrl: getUrl('vineyard_hero')
    },
    contact: {
      email: 'info@giulianivini.com',
      phone: '+39 080.891.53.35',
      website: 'https://www.giulianivini.com',
      address: 'Via Gioia Canale, 18, 70010 Turi (BA), Italy'
    },
    awards: [
      'Gioia del Colle DOP Excellence Distinction',
      'Puglia IGT Quality Recognition',
      'Monte Sannace Historic Terroir Award'
    ]
  };

  if (!estate) {
    estate = await EstateProfile.create(estateData);
    console.log(`Created Estate Profile: ${estate.estateName} [slug: ${estate.slug}]`);
  } else {
    Object.assign(estate, estateData);
    await estate.save();
    console.log(`Updated Estate Profile: ${estate.estateName} [slug: ${estate.slug}]`);
  }

  // 4. Complete 19 Products Definition
  const productsList = [
    {
      id: 'wine_giuliani_01_verzillo',
      name: 'Giuliani Verzillo Spumante Malvasia 750ml',
      slug: 'giuliani-verzillo-spumante-malvasia-750ml',
      type: 'Wine',
      category: 'Wine',
      subcategory: 'Sparkling Wine',
      country: 'Italy',
      brand: 'GIULIANI Vini',
      size: '750ml',
      price: '425.00',
      image: getUrl('verzillo'),
      gallery: [getUrl('verzillo')],
      stock: 60,
      featured: true,
      description: 'Pale yellow with delicate green reflections and a fine, light froth. Verzillo opens with gentle floral aromas, ripe yellow orchard fruits, and subtle almond undertones. Fresh, lively, and harmoniously balanced on the palate, with a clean and fragrant finish. Produced from 100% Malvasia grown on spurred cordon vines in Central Murgia and refined for 4–6 months.',
      options: ['750ml'],
      tags: ['GIULIANI Vini', 'Malvasia', 'Spumante', 'Sparkling Wine', 'Puglia', 'Italy', 'IGT Puglia'],
      tastingNotes: ['Light Froth', 'Flowery Scents', 'Yellow Orchard Fruit', 'Fresh Almond', 'Lively & Soft'],
      flavorProfile: ['Crisp & Lively', 'Floral & Delicate'],
      foodPairing: ['Light Starters', 'Fresh Fish', 'Vegetable Antipasti', 'Seafood'],
      identity: {
        type: 'Sparkling Wine',
        style: 'Malvasia IGT Puglia Spumante',
        production: 'Autoclave Fermented (Charmat) & Bottle Refined',
        origin: 'Central Murgia (Turi, Gioia del Colle), Puglia, Italy',
        bottleSize: '750ml',
        abv: '11.0%'
      },
      shipping: {
        box_type: 'Certified Luxury Bottle Shipper',
        weight_kg: 1.55,
        length_cm: 10,
        width_cm: 10,
        height_cm: 33,
        is_fragile: true,
        hs_code: '2204.21',
        parcel_value: 425
      },
      costing: {
        supplierPrice: 8.00,
        netSupplierCost: 160.00,
        vendorProfitPct: 20,
        vendorPriceToPlatform: 192.00,
        platformMarginPct: 15,
        baseSellingPrice: 425.00,
        minimumSellingPrice: 425.00,
        marginStatus: 'healthy'
      }
    },
    {
      id: 'wine_giuliani_02_ricciolo_rose',
      name: 'Giuliani Ricciolo Spumante Rosé 750ml',
      slug: 'giuliani-ricciolo-spumante-rose-750ml',
      type: 'Wine',
      category: 'Wine',
      subcategory: 'Sparkling Wine',
      country: 'Italy',
      brand: 'GIULIANI Vini',
      size: '750ml',
      price: '545.00',
      image: getUrl('ricciolo_rose'),
      gallery: [getUrl('ricciolo_rose')],
      stock: 50,
      featured: true,
      description: 'Luminous light pink sparkling wine crafted from soft pressing of whole Aleatico grapes grown at 250m altitude in Turi. Rich aromas of blackberries, morello cherries, and fine rose florals explode on the palate, underpinned by vibrant acidity, delicate tannic grip, and an endlessly clean finish.',
      options: ['750ml'],
      tags: ['GIULIANI Vini', 'Aleatico', 'Rosé Spumante', 'Sparkling Wine', 'Puglia', 'Italy'],
      tastingNotes: ['Blackberry', 'Morello Cherry', 'Fresh Roses', 'Vibrant Acidity', 'Delicate Tannins'],
      flavorProfile: ['Berry-Rich', 'Crisp & Refreshing'],
      foodPairing: ['Fish Carpaccio', 'Shellfish', 'Raw Seafood', 'Mediterranean Appetizers'],
      identity: {
        type: 'Sparkling Wine',
        style: 'Aleatico IGT Puglia Sparkling Rosé',
        production: 'Soft Pressing & Autoclave Fermentation',
        origin: 'Turi, Central Murgia, Puglia, Italy',
        bottleSize: '750ml',
        abv: '12.0%'
      },
      shipping: {
        box_type: 'Certified Luxury Bottle Shipper',
        weight_kg: 1.55,
        length_cm: 10,
        width_cm: 10,
        height_cm: 33,
        is_fragile: true,
        hs_code: '2204.21',
        parcel_value: 545
      },
      costing: {
        supplierPrice: 10.40,
        netSupplierCost: 208.00,
        vendorProfitPct: 20,
        vendorPriceToPlatform: 249.60,
        platformMarginPct: 15,
        baseSellingPrice: 545.00,
        minimumSellingPrice: 545.00,
        marginStatus: 'healthy'
      }
    },
    {
      id: 'wine_giuliani_03_ricciolo_gold',
      name: 'Giuliani Ricciolo Gold Spumante Bianco 750ml',
      slug: 'giuliani-ricciolo-gold-spumante-bianco-750ml',
      type: 'Wine',
      category: 'Wine',
      subcategory: 'Sparkling Wine',
      country: 'Italy',
      brand: 'GIULIANI Vini',
      size: '750ml',
      price: '545.00',
      image: getUrl('ricciolo_gold') || getUrl('ricciolo_rose'),
      gallery: [getUrl('ricciolo_gold') || getUrl('ricciolo_rose')],
      stock: 45,
      featured: false,
      description: 'The premier Gold edition sparkling white from Giuliani Vini. Delivers refined aromatic perlage, delicate white blossoms, crisp green apple, and mineral freshness. Masterfully crafted for celebratory occasions and luxury dining.',
      options: ['750ml'],
      tags: ['GIULIANI Vini', 'Ricciolo Gold', 'Spumante Bianco', 'Sparkling Wine', 'Puglia', 'Italy'],
      tastingNotes: ['White Blossom', 'Green Apple', 'Brioche Nuances', 'Mineral Cut', 'Fine Perlage'],
      flavorProfile: ['Crisp & Mineral', 'Refined & Effervescent'],
      foodPairing: ['Oysters', 'Caviar', 'Lobster', 'Artisan Canape'],
      identity: {
        type: 'Sparkling Wine',
        style: 'Bianco IGT Puglia Spumante',
        production: 'Autoclave Metodo Martinotti',
        origin: 'Central Murgia, Puglia, Italy',
        bottleSize: '750ml',
        abv: '12.0%'
      },
      shipping: {
        box_type: 'Certified Luxury Bottle Shipper',
        weight_kg: 1.55,
        length_cm: 10,
        width_cm: 10,
        height_cm: 33,
        is_fragile: true,
        hs_code: '2204.21',
        parcel_value: 545
      },
      costing: {
        supplierPrice: 10.40,
        netSupplierCost: 208.00,
        vendorProfitPct: 20,
        vendorPriceToPlatform: 249.60,
        platformMarginPct: 15,
        baseSellingPrice: 545.00,
        minimumSellingPrice: 545.00,
        marginStatus: 'healthy'
      }
    },
    {
      id: 'wine_giuliani_04_morettino_bianco',
      name: 'Giuliani Morettino Bianco 750ml',
      slug: 'giuliani-morettino-bianco-750ml',
      type: 'Wine',
      category: 'Wine',
      subcategory: 'White Wine',
      country: 'Italy',
      brand: 'GIULIANI Vini',
      size: '750ml',
      price: '265.00',
      image: getUrl('morettino_bianco'),
      gallery: [getUrl('morettino_bianco')],
      stock: 80,
      featured: false,
      description: 'Straw yellow with delicately aromatic greenish reflections, rich in floral scents, fruity notes of yellow-fleshed peach, and flavors of fresh almond. Soft, balanced, and remarkably food-friendly.',
      options: ['750ml'],
      tags: ['GIULIANI Vini', 'Morettino', 'Malvasia', 'White Wine', 'Puglia', 'Italy'],
      tastingNotes: ['Yellow Peach', 'Fresh Almond', 'Floral Scents', 'Soft Acidity', 'Clean Finish'],
      flavorProfile: ['Soft & Fruity', 'Floral'],
      foodPairing: ['Light Starters', 'Grilled Fish', 'Vegetable Pastas', 'Goat Cheese'],
      identity: {
        type: 'White Wine',
        style: 'Malvasia IGT Puglia',
        production: 'Free-run must (60%) steel fermentation & bottle refining',
        origin: 'Central Murgia, Gioia del Colle, Puglia, Italy',
        bottleSize: '750ml',
        abv: '12.0%'
      },
      shipping: {
        box_type: 'Certified Luxury Bottle Shipper',
        weight_kg: 1.55,
        length_cm: 10,
        width_cm: 10,
        height_cm: 33,
        is_fragile: true,
        hs_code: '2204.21',
        parcel_value: 265
      },
      costing: {
        supplierPrice: 4.80,
        netSupplierCost: 96.00,
        vendorProfitPct: 20,
        vendorPriceToPlatform: 115.20,
        platformMarginPct: 15,
        baseSellingPrice: 265.00,
        minimumSellingPrice: 265.00,
        marginStatus: 'healthy'
      }
    },
    {
      id: 'wine_giuliani_05_cannuzze',
      name: 'Giuliani Cannuzze Chardonnay 750ml',
      slug: 'giuliani-cannuzze-chardonnay-750ml',
      type: 'Wine',
      category: 'Wine',
      subcategory: 'Chardonnay',
      country: 'Italy',
      brand: 'GIULIANI Vini',
      size: '750ml',
      price: '425.00',
      image: getUrl('cannuzze'),
      gallery: [getUrl('cannuzze')],
      stock: 65,
      featured: true,
      description: 'Pale yellow with golden reflections. Fine and charming with intense, deep tropical notes of ripe pineapple, banana, and passion fruit. Savoury and full-bodied with a seamless balance between acidity and roundness, delivering memorable persistence.',
      options: ['750ml'],
      tags: ['GIULIANI Vini', 'Cannuzze', 'Chardonnay', 'White Wine', 'Puglia', 'Italy'],
      tastingNotes: ['Pineapple', 'Ripe Banana', 'Passion Fruit', 'Golden Nuances', 'Long Harmonic Closure'],
      flavorProfile: ['Tropical & Expressive', 'Full & Savoury'],
      foodPairing: ['Grilled Fish', 'Shellfish', 'Roast Chicken', 'Medium-Aged Cheeses'],
      identity: {
        type: 'White Wine',
        style: 'Chardonnay IGT Puglia',
        production: 'Soft pressing & low temperature fermentation in steel',
        origin: 'Central Murgia (Gioia del Colle, Sammichele di Bari), Italy',
        bottleSize: '750ml',
        abv: '12.5%'
      },
      shipping: {
        box_type: 'Certified Luxury Bottle Shipper',
        weight_kg: 1.55,
        length_cm: 10,
        width_cm: 10,
        height_cm: 33,
        is_fragile: true,
        hs_code: '2204.21',
        parcel_value: 425
      },
      costing: {
        supplierPrice: 8.00,
        netSupplierCost: 160.00,
        vendorProfitPct: 20,
        vendorPriceToPlatform: 192.00,
        platformMarginPct: 15,
        baseSellingPrice: 425.00,
        minimumSellingPrice: 425.00,
        marginStatus: 'healthy'
      }
    },
    {
      id: 'wine_giuliani_06_chiancaia',
      name: 'Giuliani Chiancaia Fiano 750ml',
      slug: 'giuliani-chiancaia-fiano-750ml',
      type: 'Wine',
      category: 'Wine',
      subcategory: 'White Wine',
      country: 'Italy',
      brand: 'GIULIANI Vini',
      size: '750ml',
      price: '425.00',
      image: getUrl('chiancaia'),
      gallery: [getUrl('chiancaia')],
      stock: 60,
      featured: true,
      description: 'Straw yellow with fine greenish highlights. A complex bouquet of delicate white flowers and citrus zest leads into lively notes of bergamot and Mediterranean minerality. Marked territorial character, rich yet delightfully drinkable throughout the meal.',
      options: ['750ml'],
      tags: ['GIULIANI Vini', 'Chiancaia', 'Fiano', 'White Wine', 'Puglia', 'Italy'],
      tastingNotes: ['Citrus Bergamot', 'White Wildflowers', 'Saline Mineral Vein', 'Crisp Structure'],
      flavorProfile: ['Citrus & Mineral', 'Aromatic'],
      foodPairing: ['Seafood Risotto', 'Grilled Prawns', 'Calamari', 'Pecorino'],
      identity: {
        type: 'White Wine',
        style: 'Fiano IGT Puglia',
        production: 'First-fraction pressing, temperature-controlled steel refinement',
        origin: 'Gioia del Colle & Sammichele di Bari, Puglia, Italy',
        bottleSize: '750ml',
        abv: '12.5%'
      },
      shipping: {
        box_type: 'Certified Luxury Bottle Shipper',
        weight_kg: 1.55,
        length_cm: 10,
        width_cm: 10,
        height_cm: 33,
        is_fragile: true,
        hs_code: '2204.21',
        parcel_value: 425
      },
      costing: {
        supplierPrice: 8.00,
        netSupplierCost: 160.00,
        vendorProfitPct: 20,
        vendorPriceToPlatform: 192.00,
        platformMarginPct: 15,
        baseSellingPrice: 425.00,
        minimumSellingPrice: 425.00,
        marginStatus: 'healthy'
      }
    },
    {
      id: 'wine_giuliani_07_morettino_rosato',
      name: 'Giuliani Morettino Rosato 750ml',
      slug: 'giuliani-morettino-rosato-750ml',
      type: 'Wine',
      category: 'Wine',
      subcategory: 'Rosé',
      country: 'Italy',
      brand: 'GIULIANI Vini',
      size: '750ml',
      price: '265.00',
      image: getUrl('morettino_rosato'),
      gallery: [getUrl('morettino_rosato')],
      stock: 75,
      featured: false,
      description: 'A vibrant rosé blending Malvasia Nera and Primitivo. Unfolds with aromas of red cherries, wild strawberries, pomegranate, and fragrant violet. Fresh, savoury, and dry on the palate, perfectly capturing the warmth and breeze of Southern Italy.',
      options: ['750ml'],
      tags: ['GIULIANI Vini', 'Morettino', 'Rosato', 'Rosé Wine', 'Puglia', 'Italy'],
      tastingNotes: ['Red Cherry', 'Pomegranate', 'Violet', 'Savoury Acidity', 'Dry Clean Finish'],
      flavorProfile: ['Fresh & Fruity', 'Crisp'],
      foodPairing: ['Mediterranean Tapas', 'Shellfish', 'White Meats', 'Legume Soups'],
      identity: {
        type: 'Rosé Wine',
        style: 'Malvasia Nera & Primitivo IGT Puglia Rosato',
        production: 'Soft pressing 60% must, steel and bottle refined 4-6 months',
        origin: 'Central Murgia (Turi, Gioia del Colle), Puglia, Italy',
        bottleSize: '750ml',
        abv: '12.0%'
      },
      shipping: {
        box_type: 'Certified Luxury Bottle Shipper',
        weight_kg: 1.55,
        length_cm: 10,
        width_cm: 10,
        height_cm: 33,
        is_fragile: true,
        hs_code: '2204.21',
        parcel_value: 265
      },
      costing: {
        supplierPrice: 4.80,
        netSupplierCost: 96.00,
        vendorProfitPct: 20,
        vendorPriceToPlatform: 115.20,
        platformMarginPct: 15,
        baseSellingPrice: 265.00,
        minimumSellingPrice: 265.00,
        marginStatus: 'healthy'
      }
    },
    {
      id: 'wine_giuliani_08_topparello',
      name: 'Giuliani Topparello Rosato 750ml',
      slug: 'giuliani-topparello-rosato-750ml',
      type: 'Wine',
      category: 'Wine',
      subcategory: 'Rosé',
      country: 'Italy',
      brand: 'GIULIANI Vini',
      size: '750ml',
      price: '425.00',
      image: getUrl('topparello'),
      gallery: [getUrl('topparello')],
      stock: 70,
      featured: true,
      description: 'Single-varietal Primitivo Rosato from rocky red soils in Gioia del Colle. Lively bouquet highlighting tea rose, violet, cherry, and ripe pomegranate. Savoury and fresh with notable length and a dry, clean finish.',
      options: ['750ml'],
      tags: ['GIULIANI Vini', 'Topparello', 'Primitivo Rosato', 'Rosé Wine', 'Gioia del Colle', 'Italy'],
      tastingNotes: ['Tea Rose', 'Pomegranate', 'Crisp Red Cherry', 'Violet Florals', 'Long Savoury Finish'],
      flavorProfile: ['Floral & Bright', 'Savoury'],
      foodPairing: ['Grilled Langoustines', 'Bouillabaisse', 'Cured Ham', 'Medium Cheeses'],
      identity: {
        type: 'Rosé Wine',
        style: 'Primitivo IGT Puglia Rosato',
        production: 'Manual bunch sorting, gentle destem-pressing, steel aged 4-6 months',
        origin: 'Central Murgia (Turi, Gioia del Colle), Puglia, Italy',
        bottleSize: '750ml',
        abv: '12.5%'
      },
      shipping: {
        box_type: 'Certified Luxury Bottle Shipper',
        weight_kg: 1.55,
        length_cm: 10,
        width_cm: 10,
        height_cm: 33,
        is_fragile: true,
        hs_code: '2204.21',
        parcel_value: 425
      },
      costing: {
        supplierPrice: 8.00,
        netSupplierCost: 160.00,
        vendorProfitPct: 20,
        vendorPriceToPlatform: 192.00,
        platformMarginPct: 15,
        baseSellingPrice: 425.00,
        minimumSellingPrice: 425.00,
        marginStatus: 'healthy'
      }
    },
    {
      id: 'wine_giuliani_09_morettino_rosso',
      name: 'Giuliani Morettino Rosso 750ml',
      slug: 'giuliani-morettino-rosso-750ml',
      type: 'Wine',
      category: 'Wine',
      subcategory: 'Red Wine',
      country: 'Italy',
      brand: 'GIULIANI Vini',
      size: '750ml',
      price: '265.00',
      image: getUrl('morettino_rosso'),
      gallery: [getUrl('morettino_rosso')],
      stock: 90,
      featured: false,
      description: 'Lustrous ruby red with violet reflections. Expresses intense aromas of juicy red cherries, wild blackberries, plums, and subtle Mediterranean spices. Full and balanced with pleasant acidity and velvety tannins.',
      options: ['750ml'],
      tags: ['GIULIANI Vini', 'Morettino', 'Red Wine', 'Malvasia Nera', 'Primitivo', 'Puglia', 'Italy'],
      tastingNotes: ['Ripe Cherry', 'Wild Blackberry', 'Plum', 'Velvety Tannins', 'Pleasant Warmth'],
      flavorProfile: ['Juicy & Smooth', 'Fruit-Forward'],
      foodPairing: ['Pasta Bolognese', 'Roast Lamb', 'Grilled Sausages', 'Aged Cheeses'],
      identity: {
        type: 'Red Wine',
        style: 'Black Malvasia & Primitivo IGT Puglia',
        production: 'Maceration 10 days, steel malolactic, concrete tank aging',
        origin: 'Central Murgia, Puglia, Italy',
        bottleSize: '750ml',
        abv: '12.5%'
      },
      shipping: {
        box_type: 'Certified Luxury Bottle Shipper',
        weight_kg: 1.55,
        length_cm: 10,
        width_cm: 10,
        height_cm: 33,
        is_fragile: true,
        hs_code: '2204.21',
        parcel_value: 265
      },
      costing: {
        supplierPrice: 4.80,
        netSupplierCost: 96.00,
        vendorProfitPct: 20,
        vendorPriceToPlatform: 115.20,
        platformMarginPct: 15,
        baseSellingPrice: 265.00,
        minimumSellingPrice: 265.00,
        marginStatus: 'healthy'
      }
    },
    {
      id: 'wine_giuliani_10_serrone',
      name: 'Giuliani Serrone Nero di Troia 750ml',
      slug: 'giuliani-serrone-nero-di-troia-750ml',
      type: 'Wine',
      category: 'Wine',
      subcategory: 'Red Wine',
      country: 'Italy',
      brand: 'GIULIANI Vini',
      size: '750ml',
      price: '425.00',
      image: getUrl('serrone'),
      gallery: [getUrl('serrone')],
      stock: 70,
      featured: true,
      description: 'Intense ruby red with violet glints. Crafted from indigenous Nero di Troia hand-picked in October. Offers deep aromas of blackberries, fresh raspberries, pomegranate seeds, aromatic garrigue herbs, and violet florals. Full-bodied and structured with noble velvety tannins.',
      options: ['750ml'],
      tags: ['GIULIANI Vini', 'Serrone', 'Nero di Troia', 'Red Wine', 'Puglia', 'Italy'],
      tastingNotes: ['Blackberry', 'Raspberry', 'Pomegranate', 'Balsamic Herbs', 'Velvety Tannins'],
      flavorProfile: ['Rich & Herbal', 'Structured'],
      foodPairing: ['Roasted Game', 'Braised Beef', 'Porcini Mushrooms', 'Cured Cold Cuts'],
      identity: {
        type: 'Red Wine',
        style: 'Nero di Troia IGT Puglia',
        production: 'Manual harvest in October, indigenous yeast, concrete & steel aging',
        origin: 'Central Murgia (Mellito, Bitonto), Puglia, Italy',
        bottleSize: '750ml',
        abv: '13.0%'
      },
      shipping: {
        box_type: 'Certified Luxury Bottle Shipper',
        weight_kg: 1.55,
        length_cm: 10,
        width_cm: 10,
        height_cm: 33,
        is_fragile: true,
        hs_code: '2204.21',
        parcel_value: 425
      },
      costing: {
        supplierPrice: 8.00,
        netSupplierCost: 160.00,
        vendorProfitPct: 20,
        vendorPriceToPlatform: 192.00,
        platformMarginPct: 15,
        baseSellingPrice: 425.00,
        minimumSellingPrice: 425.00,
        marginStatus: 'healthy'
      }
    },
    {
      id: 'wine_giuliani_11_tomegna',
      name: 'Giuliani Tomegna Negroamaro 750ml',
      slug: 'giuliani-tomegna-negroamaro-750ml',
      type: 'Wine',
      category: 'Wine',
      subcategory: 'Red Wine',
      country: 'Italy',
      brand: 'GIULIANI Vini',
      size: '750ml',
      price: '425.00',
      image: getUrl('tomegna'),
      gallery: [getUrl('tomegna')],
      stock: 65,
      featured: true,
      description: 'Authentic Negroamaro cultivated on sandy red soils in Brindisi Cerano. Deep ruby red bouquet of wild bramble berries, dark currants, warm exotic spices, and dried herbs. Balanced acidity and fine-grained tannins with a lingering savory finish.',
      options: ['750ml'],
      tags: ['GIULIANI Vini', 'Tomegna', 'Negroamaro', 'Red Wine', 'Salento', 'Puglia', 'Italy'],
      tastingNotes: ['Small Berries', 'Warm Spices', 'Fine Tannins', 'Bramble Currants', 'Dry Lingering Finish'],
      flavorProfile: ['Warm & Spicy', 'Earthy & Complex'],
      foodPairing: ['Orecchiette al Ragù', 'Grilled Meat Platter', 'Mushroom Stews', 'Aged Cheeses'],
      identity: {
        type: 'Red Wine',
        style: 'Negroamaro IGT Puglia',
        production: 'Thermo-controlled maceration 10 days, aged in steel and concrete',
        origin: 'Brindisi (District Cerano), Puglia, Italy',
        bottleSize: '750ml',
        abv: '13.0%'
      },
      shipping: {
        box_type: 'Certified Luxury Bottle Shipper',
        weight_kg: 1.55,
        length_cm: 10,
        width_cm: 10,
        height_cm: 33,
        is_fragile: true,
        hs_code: '2204.21',
        parcel_value: 425
      },
      costing: {
        supplierPrice: 8.00,
        netSupplierCost: 160.00,
        vendorProfitPct: 20,
        vendorPriceToPlatform: 192.00,
        platformMarginPct: 15,
        baseSellingPrice: 425.00,
        minimumSellingPrice: 425.00,
        marginStatus: 'healthy'
      }
    },
    {
      id: 'wine_giuliani_12_tre_lamie_750',
      name: 'Giuliani Tre Lamie Susumaniello 750ml',
      slug: 'giuliani-tre-lamie-susumaniello-750ml',
      type: 'Wine',
      category: 'Wine',
      subcategory: 'Red Wine',
      country: 'Italy',
      brand: 'GIULIANI Vini',
      size: '750ml',
      price: '545.00',
      image: getUrl('tre_lamie'),
      gallery: [getUrl('tre_lamie')],
      stock: 75,
      featured: true,
      description: 'An exceptional monovarietal Susumaniello showcasing ancient Apulian heritage. Saturated ruby red with violet glints. Crunchy plum, macerated cherries, red roses, and aromatic Mediterranean macchia on the nose. Generous body, balanced structure, and subtle spice on the palate.',
      options: ['750ml'],
      tags: ['GIULIANI Vini', 'Tre Lamie', 'Susumaniello', 'Red Wine', 'Puglia', 'Italy'],
      tastingNotes: ['Crunchy Plum', 'Dark Cherry', 'Red Roses', 'Mediterranean Scrub', 'Slight Spicy Finish'],
      flavorProfile: ['Rich & Floral', 'Complex & Fresh'],
      foodPairing: ['Braised Lamb', 'Ossobuco', 'Aged Pecorino', 'Rich Pasta Dishes'],
      identity: {
        type: 'Red Wine',
        style: 'Susumaniello Puglia IGT',
        production: 'Harvested late September, steel malolactic, concrete & steel refining',
        origin: 'Central Murgia (Turi, Gioia del Colle, Putignano), Italy',
        bottleSize: '750ml',
        abv: '13.0%'
      },
      shipping: {
        box_type: 'Certified Luxury Bottle Shipper',
        weight_kg: 1.55,
        length_cm: 10,
        width_cm: 10,
        height_cm: 33,
        is_fragile: true,
        hs_code: '2204.21',
        parcel_value: 545
      },
      costing: {
        supplierPrice: 10.40,
        netSupplierCost: 208.00,
        vendorProfitPct: 20,
        vendorPriceToPlatform: 249.60,
        platformMarginPct: 15,
        baseSellingPrice: 545.00,
        minimumSellingPrice: 545.00,
        marginStatus: 'healthy'
      }
    },
    {
      id: 'wine_giuliani_13_tre_lamie_magnum',
      name: 'Giuliani Tre Lamie Susumaniello Magnum 1.5L (Wooden Box)',
      slug: 'giuliani-tre-lamie-susumaniello-magnum-15l',
      type: 'Wine',
      category: 'Wine',
      subcategory: 'Red Wine',
      country: 'Italy',
      brand: 'GIULIANI Vini',
      size: '1500ml',
      price: '1590.00',
      image: getUrl('tre_lamie'),
      gallery: [getUrl('tre_lamie')],
      stock: 25,
      featured: true,
      description: 'The collector’s 1.500 ml Magnum of Tre Lamie Susumaniello, individually packaged in an authentic Italian branded wooden gift box. The Magnum format enhances slow maturation, conferring extraordinary aromatics of dark stone fruit, Mediterranean scrub, and velvety persistence.',
      options: ['1500ml (Wooden Box)'],
      tags: ['GIULIANI Vini', 'Tre Lamie Magnum', 'Susumaniello', 'Wooden Box', 'Magnum 1.5L', 'Puglia', 'Italy'],
      tastingNotes: ['Plum Jam', 'Black Cherries', 'Red Rose Florals', 'Balsamic Finish', 'Extended Cellar Potential'],
      flavorProfile: ['Opulent & Structured', 'Cellar Reserve'],
      foodPairing: ['Celebratory Roasts', 'Dry-Aged Tomahawk', 'Wild Boar', 'Truffle Pasta'],
      identity: {
        type: 'Red Wine',
        style: 'Susumaniello Puglia IGT Magnum',
        production: 'Estate Bottled in 1.5L format, individually boxed in wood',
        origin: 'Central Murgia, Puglia, Italy',
        bottleSize: '1500ml',
        abv: '13.0%'
      },
      shipping: {
        box_type: 'Luxury Wooden Gift Box',
        weight_kg: 3.20,
        length_cm: 14,
        width_cm: 14,
        height_cm: 38,
        is_fragile: true,
        hs_code: '2204.21',
        parcel_value: 1590
      },
      costing: {
        supplierPrice: 29.50,
        netSupplierCost: 590.00,
        vendorProfitPct: 20,
        vendorPriceToPlatform: 708.00,
        platformMarginPct: 15,
        baseSellingPrice: 1590.00,
        minimumSellingPrice: 1590.00,
        marginStatus: 'healthy'
      }
    },
    {
      id: 'wine_giuliani_14_petrizza',
      name: 'Giuliani Petrizza Primitivo 750ml',
      slug: 'giuliani-petrizza-primitivo-750ml',
      type: 'Wine',
      category: 'Wine',
      subcategory: 'Red Wine',
      country: 'Italy',
      brand: 'GIULIANI Vini',
      size: '750ml',
      price: '425.00',
      image: getUrl('petrizza'),
      gallery: [getUrl('petrizza')],
      stock: 80,
      featured: false,
      description: 'Intense ruby red with rich violet reflexes. Features pure Primitivo fruit: blackberries, dark cherries, plum, fresh herbs, and soft floral tones. Well-rounded on the palate with deep fruity returns, balanced acidity, and velvety tannins.',
      options: ['750ml'],
      tags: ['GIULIANI Vini', 'Petrizza', 'Primitivo', 'Red Wine', 'Puglia', 'Italy'],
      tastingNotes: ['Black Cherry', 'Sweet Plum', 'Wild Herbs', 'Velvety Tannins', 'Fresh Finish'],
      flavorProfile: ['Fruity & Round', 'Smooth'],
      foodPairing: ['Grilled Steaks', 'Pork Tenderloin', 'Charcuterie', 'Medium-Aged Cheeses'],
      identity: {
        type: 'Red Wine',
        style: 'Primitivo Puglia IGT',
        production: 'Spurred cordon vines, manual harvest, steel and concrete tank aging',
        origin: 'Central Murgia, Puglia, Italy',
        bottleSize: '750ml',
        abv: '13.0%'
      },
      shipping: {
        box_type: 'Certified Luxury Bottle Shipper',
        weight_kg: 1.55,
        length_cm: 10,
        width_cm: 10,
        height_cm: 33,
        is_fragile: true,
        hs_code: '2204.21',
        parcel_value: 425
      },
      costing: {
        supplierPrice: 8.00,
        netSupplierCost: 160.00,
        vendorProfitPct: 20,
        vendorPriceToPlatform: 192.00,
        platformMarginPct: 15,
        baseSellingPrice: 425.00,
        minimumSellingPrice: 425.00,
        marginStatus: 'healthy'
      }
    },
    {
      id: 'wine_giuliani_15_lavarossa',
      name: 'Giuliani Lavarossa Primitivo Gioia del Colle DOP 750ml',
      slug: 'giuliani-lavarossa-primitivo-gioia-del-colle-dop-750ml',
      type: 'Wine',
      category: 'Wine',
      subcategory: 'Red Wine',
      country: 'Italy',
      brand: 'GIULIANI Vini',
      size: '750ml',
      price: '545.00',
      image: getUrl('lavarossa'),
      gallery: [getUrl('lavarossa')],
      stock: 75,
      featured: true,
      description: 'From 20-year-old spurred cordon vines in Gioia del Colle DOP. Intense ruby red with remarkable aromatic depth: wild berry preserves, prominent balsamic notes, and subtle dried sweet spices. Strikes the palate with mild yet structured tannins, balanced warmth, and exceptional terroir definition.',
      options: ['750ml'],
      tags: ['GIULIANI Vini', 'Lavarossa', 'Primitivo', 'Gioia del Colle DOP', 'Red Wine', 'Italy'],
      tastingNotes: ['Wild Berry Preserves', 'Notable Balsamic Scent', 'Sweet Spice', 'Structured Tannins', 'Persistent Warmth'],
      flavorProfile: ['Rich & Full-Bodied', 'Balsamic & Earthy'],
      foodPairing: ['Slow-Cooked Beef Ragout', 'Roast Lamb', 'Aged Parmigiano', 'Hard Aged Cheeses'],
      identity: {
        type: 'Red Wine',
        style: 'Primitivo of Gioia del Colle DOP',
        production: '20-year vines, steel malolactic, concrete tank aging',
        origin: 'Central Murgia (Turi, Gioia del Colle, Putignano), Puglia, Italy',
        bottleSize: '750ml',
        abv: '14.5%'
      },
      shipping: {
        box_type: 'Certified Luxury Bottle Shipper',
        weight_kg: 1.55,
        length_cm: 10,
        width_cm: 10,
        height_cm: 33,
        is_fragile: true,
        hs_code: '2204.21',
        parcel_value: 545
      },
      costing: {
        supplierPrice: 10.40,
        netSupplierCost: 208.00,
        vendorProfitPct: 20,
        vendorPriceToPlatform: 249.60,
        platformMarginPct: 15,
        baseSellingPrice: 545.00,
        minimumSellingPrice: 545.00,
        marginStatus: 'healthy'
      }
    },
    {
      id: 'wine_giuliani_16_baronaggio_750',
      name: 'Giuliani Baronaggio Primitivo Riserva DOC 750ml',
      slug: 'giuliani-baronaggio-primitivo-riserva-doc-750ml',
      type: 'Wine',
      category: 'Wine',
      subcategory: 'Red Wine',
      country: 'Italy',
      brand: 'GIULIANI Vini',
      size: '750ml',
      price: '1380.00',
      image: getUrl('baronaggio'),
      gallery: [getUrl('baronaggio')],
      stock: 40,
      featured: true,
      description: 'The pinnacle of Gioia del Colle Primitivo. Harvested from 35–40 year old spurred cordon vines in the historic district of Baronaggio, where red soils with limestone outcroppings yield concentrated grapes. Matured in French barriques, this wine reveals layered aromas of ripe black cherries in alcohol, blackberries, mulberries, black pepper, cloves, liquorice, and balsamic notes. Silky refined tannins and a commanding, enticing finish.',
      options: ['750ml'],
      tags: ['GIULIANI Vini', 'Baronaggio', 'Primitivo Riserva', 'Gioia del Colle DOC', 'French Barriques', 'Italy'],
      tastingNotes: ['Cherries in Alcohol', 'Blackberry & Mulberry', 'Black Pepper & Cloves', 'Liquorice & Violet', 'French Oak Spice', 'Long Regal Finish'],
      flavorProfile: ['Opulent & Deep', 'Spicy & Balsamic'],
      foodPairing: ['Grilled Lamb Cutlets', 'Venison', 'Florentine Steak', 'Aged Blue Cheeses'],
      identity: {
        type: 'Red Wine',
        style: 'Primitivo Riserva DOC Gioia del Colle DOP',
        production: '35-40 year old vines, French barriques aging',
        origin: 'District of Baronaggio, Gioia del Colle, Puglia, Italy',
        bottleSize: '750ml',
        abv: '15.5%'
      },
      shipping: {
        box_type: 'Certified Luxury Bottle Shipper',
        weight_kg: 1.55,
        length_cm: 10,
        width_cm: 10,
        height_cm: 33,
        is_fragile: true,
        hs_code: '2204.21',
        parcel_value: 1380
      },
      costing: {
        supplierPrice: 26.00,
        netSupplierCost: 520.00,
        vendorProfitPct: 20,
        vendorPriceToPlatform: 624.00,
        platformMarginPct: 15,
        baseSellingPrice: 1380.00,
        minimumSellingPrice: 1380.00,
        marginStatus: 'healthy'
      }
    },
    {
      id: 'wine_giuliani_17_baronaggio_magnum',
      name: 'Giuliani Baronaggio Primitivo Riserva DOC Magnum 1.5L (Wooden Box)',
      slug: 'giuliani-baronaggio-primitivo-riserva-doc-magnum-15l',
      type: 'Wine',
      category: 'Wine',
      subcategory: 'Red Wine',
      country: 'Italy',
      brand: 'GIULIANI Vini',
      size: '1500ml',
      price: '3350.00',
      image: getUrl('baronaggio'),
      gallery: [getUrl('baronaggio')],
      stock: 15,
      featured: true,
      description: 'The monumental 1.500 ml Magnum of Giuliani Baronaggio Primitivo Riserva DOC, presented in an artisanal wooden gift case. Harvested from 35-40 year old old-vine parcels and aged in French oak barriques. A masterpiece of structure, velvet power, and decade-long cellar aging.',
      options: ['1500ml (Wooden Box)'],
      tags: ['GIULIANI Vini', 'Baronaggio Magnum', 'Primitivo Riserva', 'Wooden Box', 'Collectible Wine', 'Puglia', 'Italy'],
      tastingNotes: ['Compote of Black Cherry', 'Cassis', 'Clove & Cedar', 'Smoked Vanilla', 'Velvet Caress', 'Immense Depth'],
      flavorProfile: ['Colossal & Layered', 'French Oak Reserve'],
      foodPairing: ['Prime Rib Roast', 'Wild Boar Ragout', 'Aged Pecorino di Fossa', 'Truffle Filet Mignon'],
      identity: {
        type: 'Red Wine',
        style: 'Primitivo Riserva DOC Gioia del Colle Magnum',
        production: '35-40 year old vines, French barriques, wooden box packaging',
        origin: 'District of Baronaggio, Gioia del Colle, Italy',
        bottleSize: '1500ml',
        abv: '15.5%'
      },
      shipping: {
        box_type: 'Luxury Wooden Gift Box',
        weight_kg: 3.20,
        length_cm: 14,
        width_cm: 14,
        height_cm: 38,
        is_fragile: true,
        hs_code: '2204.21',
        parcel_value: 3350
      },
      costing: {
        supplierPrice: 63.00,
        netSupplierCost: 1260.00,
        vendorProfitPct: 20,
        vendorPriceToPlatform: 1512.00,
        platformMarginPct: 15,
        baseSellingPrice: 3350.00,
        minimumSellingPrice: 3350.00,
        marginStatus: 'healthy'
      }
    },
    {
      id: 'wine_giuliani_18_cantone_di_cristo',
      name: 'Giuliani Cantone di Cristo Aleatico Dolce DOC 500ml',
      slug: 'giuliani-cantone-di-cristo-aleatico-dolce-doc-500ml',
      type: 'Wine',
      category: 'Wine',
      subcategory: 'Dessert Wine',
      country: 'Italy',
      brand: 'GIULIANI Vini',
      size: '500ml',
      price: '895.00',
      image: getUrl('cantone_di_cristo'),
      gallery: [getUrl('cantone_di_cristo')],
      stock: 40,
      featured: true,
      description: 'Lustrous ruby red with vivid glints. Crafted from 30-year-old spurred cordon Aleatico vines in Turi. An intriguing dessert passito revealing opulent notes of plum jam, sun-dried figs, cherries in alcohol, carob, dried fruits, wild oregano, and thyme. Measured natural residual sweetness seamlessly balanced by vibrant Mediterranean acidity.',
      options: ['500ml'],
      tags: ['GIULIANI Vini', 'Cantone di Cristo', 'Aleatico Dolce', 'Dessert Wine', 'Passito', 'DOC Gioia del Colle', 'Italy'],
      tastingNotes: ['Plum Jam', 'Sun-Dried Figs', 'Cherries in Alcohol', 'Carob & Dried Fruit', 'Wild Oregano', 'Vivid Acidity'],
      flavorProfile: ['Sweet & Opulent', 'Herbal & Complex'],
      foodPairing: ['Almond Cantucci', 'Dark Chocolate Truffles', 'Dry Pastries', 'Medium-Aged Caciocavallo'],
      identity: {
        type: 'Dessert Wine',
        style: 'Aleatico Gioia del Colle DOC Dolce',
        production: 'Late harvested in October, 20-day indigenous fermentation, steel aged',
        origin: 'Turi, Central Murgia, Puglia, Italy',
        bottleSize: '500ml',
        abv: '13.5% + 5.5%'
      },
      shipping: {
        box_type: 'Certified Luxury Bottle Shipper',
        weight_kg: 1.15,
        length_cm: 9,
        width_cm: 9,
        height_cm: 30,
        is_fragile: true,
        hs_code: '2204.21',
        parcel_value: 895
      },
      costing: {
        supplierPrice: 17.00,
        netSupplierCost: 340.00,
        vendorProfitPct: 20,
        vendorPriceToPlatform: 408.00,
        platformMarginPct: 15,
        baseSellingPrice: 895.00,
        minimumSellingPrice: 895.00,
        marginStatus: 'healthy'
      }
    },
    {
      id: 'wine_giuliani_19_1922_primitivo',
      name: 'Giuliani 1922 Primitivo Dolce Naturale 500ml',
      slug: 'giuliani-1922-primitivo-dolce-naturale-500ml',
      type: 'Wine',
      category: 'Wine',
      subcategory: 'Dessert Wine',
      country: 'Italy',
      brand: 'GIULIANI Vini',
      size: '500ml',
      price: '895.00',
      image: getUrl('1922_primitivo'),
      gallery: [getUrl('1922_primitivo'), getUrl('1922_artwork')].filter(Boolean),
      stock: 45,
      featured: true,
      description: 'Named in honor of Raffaele Giuliani founding the winery. Deep ruby red nectar from 30-year-old spurred cordon Primitivo vines hand-harvested in October. Explodes with aromas of blackberry, plum compote, ripe black cherries, cherry jam, figs, toasted nuts, dried rose, licorice, and star anise. Soft, warm, and gently sweet, balanced by an important acidic and tannic structure.',
      options: ['500ml'],
      tags: ['GIULIANI Vini', '1922', 'Primitivo Dolce Naturale', 'Dessert Wine', 'Puglia', 'Italy'],
      tastingNotes: ['Black Cherry Jam', 'Figs & Walnuts', 'Licorice & Star Anise', 'Rose & Mediterranean Herbs', 'Lightly Sweet & Structured'],
      flavorProfile: ['Richly Sweet', 'Warm & Aromatic'],
      foodPairing: ['Almond Sweets', 'Artisan Pastries', 'Medium-Aged Stretched Curd Cheese', 'Dark Chocolate'],
      identity: {
        type: 'Dessert Wine',
        style: 'Primitivo Puglia IGT Dolce Naturale',
        production: '30-year-old vines, 20-day indigenous yeast maceration, steel refined',
        origin: 'Central Murgia (Turi, Gioia del Colle), Puglia, Italy',
        bottleSize: '500ml',
        abv: '14.5% + 4.5%'
      },
      shipping: {
        box_type: 'Certified Luxury Bottle Shipper',
        weight_kg: 1.15,
        length_cm: 9,
        width_cm: 9,
        height_cm: 30,
        is_fragile: true,
        hs_code: '2204.21',
        parcel_value: 895
      },
      costing: {
        supplierPrice: 17.00,
        netSupplierCost: 340.00,
        vendorProfitPct: 20,
        vendorPriceToPlatform: 408.00,
        platformMarginPct: 15,
        baseSellingPrice: 895.00,
        minimumSellingPrice: 895.00,
        marginStatus: 'healthy'
      }
    }
  ];

  console.log(`Starting upsert of ${productsList.length} products...`);
  let upsertedCount = 0;

  for (const item of productsList) {
    const productPayload = {
      ...item,
      vendorId: user._id,
      approvalStatus: 'approved',
      catalogManaged: false,
      isSuperCoinEligible: true,
      maxSuperCoinDiscountPct: 10,
      isReferralEligible: true,
      referralDiscountPct: 5,
      metaDescription: `Buy ${item.name} online at The Grand Store. Fast nationwide delivery.`,
      seoTitle: `${item.name} | GIULIANI Vini | The Grand Store`
    };

    const res = await Product.findOneAndUpdate(
      { id: item.id },
      { $set: productPayload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`Upserted [${res.id}]: ${res.name} (Price: R${res.price})`);
    upsertedCount++;
  }

  console.log(`\n🎉 Successfully seeded ${upsertedCount} Giuliani Vini products linked to vendor: ${user.name} (${user.email})!`);

  await mongoose.disconnect();
  console.log('MongoDB connection closed.');
}

seedGiuliani().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
