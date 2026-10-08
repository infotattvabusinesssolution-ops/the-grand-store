const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const dns = require('dns');
if (process.env.MONGO_URI && process.env.MONGO_URI.startsWith('mongodb+srv://')) {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
}
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { slugify } = require('../utils/slugify');

const updates = [
  {
    // Figure 1
    match: { $or: [{ name: /Suduiraut/i }, { slug: /chateau-suduiraut/i }] },
    data: {
      name: 'Lucmo Wines Tshireletso White - Sauvignon Blanc 2025',
      slug: slugify('Lucmo Wines Tshireletso White - Sauvignon Blanc 2025'),
      brand: 'Lucmo Wines',
      subcategory: 'Sauvignon Blanc',
      country: 'South Africa',
      size: '750ml',
      image: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1791269155/grand-store/products/wine-grandstore/tshireletso-white.png',
      description: 'Lucmo Wines Tshireletso White - Sauvignon Blanc 2025 is an exceptional South African white wine expressing vibrant tropical fruit, crisp citrus, and elegant mineral acidity.',
      tastingNotes: ['Tropical Fruit', 'Crisp Citrus', 'Green Apple', 'Fresh Herbs', 'Mineral Finish'],
      approvalStatus: 'approved'
    }
  },
  {
    // Figure 2
    match: { $or: [{ name: /Catena Malbec/i }, { slug: /catena-malbec/i }] },
    data: {
      name: 'Lucmo Wines Tshireletso Red – Shiraz Grenache 2022',
      slug: slugify('Lucmo Wines Tshireletso Red – Shiraz Grenache 2022'),
      brand: 'Lucmo Wines',
      subcategory: 'Shiraz Grenache',
      country: 'South Africa',
      size: '750ml',
      image: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1791269157/grand-store/products/wine-grandstore/tshireletso-red.png',
      description: 'Lucmo Wines Tshireletso Red – Shiraz Grenache 2022 showcases rich dark berry fruit, subtle smoky spice, and a velvety smooth palate reflecting master craftsmanship.',
      tastingNotes: ['Black Cherry', 'Plum', 'Smoked Spice', 'Pepper', 'Fine Velvet Tannins'],
      approvalStatus: 'approved'
    }
  },
  {
    // Figure 3
    match: { $or: [{ name: /Her Royal Highness Sekhothali/i }, { slug: /her-royal-highness-sekhothali/i }] },
    data: {
      name: 'Lucmo Wines Her Royal Highness Sekhothali Estate Sauvignon Blanc 750ml',
      slug: slugify('Lucmo Wines Her Royal Highness Sekhothali Estate Sauvignon Blanc 750ml'),
      brand: 'Lucmo Wines',
      subcategory: 'Sauvignon Blanc',
      country: 'South Africa',
      size: '750ml',
      image: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1791269157/grand-store/products/wine-grandstore/sekhothali.png',
      description: 'Lucmo Wines Her Royal Highness Sekhothali Estate Sauvignon Blanc is an estate-bottled royal vintage presenting delicate floral aromatics, zesty citrus, and an invigorating crisp finish.',
      tastingNotes: ['White Peach', 'Elderflower', 'Lime', 'Zesty Citrus', 'Long Crisp Finish'],
      approvalStatus: 'approved'
    }
  },
  {
    // Figure 4
    match: { $or: [{ name: /King Moremoholo Mopeli/i }, { slug: /king-moremoholo-mopeli/i }] },
    data: {
      name: 'Lucmo Wines His Royal Majesty King Moremoholo Mopeli Estate Cabernet Sauvignon 750ml',
      slug: slugify('Lucmo Wines His Royal Majesty King Moremoholo Mopeli Estate Cabernet Sauvignon 750ml'),
      brand: 'Lucmo Wines',
      subcategory: 'Cabernet Sauvignon',
      country: 'South Africa',
      size: '750ml',
      image: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1791269158/grand-store/products/wine-grandstore/moremoholo.png',
      description: 'Lucmo Wines His Royal Majesty King Moremoholo Mopeli Estate Cabernet Sauvignon pays tribute to royal Basotho heritage with dense cassis, cedarwood, and regal structured tannins.',
      tastingNotes: ['Cassis', 'Blackberry', 'Cedar', 'Dark Chocolate', 'Firm Regal Tannins'],
      approvalStatus: 'approved'
    }
  },
  {
    // Figure 5
    match: { $or: [{ name: /Luc Mo Merlot Reserve/i }, { slug: /luc-mo-merlot-reserve/i }] },
    data: {
      name: 'Lucmo Wines His Royal Majesty King Makhosonke II Estate Merlot 750ml',
      slug: slugify('Lucmo Wines His Royal Majesty King Makhosonke II Estate Merlot 750ml'),
      brand: 'Lucmo Wines',
      subcategory: 'Merlot',
      country: 'South Africa',
      size: '750ml',
      image: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1788160633/grand-store/products/wine-grandstore/king-makhosonke-ii.png',
      description: 'Lucmo Wines His Royal Majesty King Makhosonke II Estate Merlot delivers luscious ripe plums, dark cherries, gentle French oak spice, and an exceptionally smooth mouthfeel.',
      tastingNotes: ['Ripe Plum', 'Black Cherry', 'French Oak', 'Vanilla', 'Velvet Smooth Finish'],
      approvalStatus: 'approved'
    }
  },
  {
    // Figure 6
    match: { $or: [{ name: /Graham Beck Brut Cap Classique/i }, { slug: /graham-beck-brut-cap-classique/i }] },
    data: {
      name: 'De Pizan Sparkling White 750ml',
      slug: slugify('De Pizan Sparkling White 750ml'),
      brand: 'De Pizan',
      subcategory: 'Non-Alcoholic Sparkling White Wine Alternative',
      country: 'South Africa',
      size: '750ml',
      image: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1791269160/grand-store/products/wine-grandstore/depizan-sparkling-white.png',
      description: 'De Pizan Sparkling White is an elegant non-alcoholic sparkling cuvée offering crisp green apple, floral notes, and persistent fine effervescence for celebratory occasions.',
      tastingNotes: ['Crisp Apple', 'White Floral', 'Citrus Blossom', 'Lively Bubbles', 'Clean Refreshing Finish'],
      approvalStatus: 'approved'
    }
  },
  {
    // Figure 7
    match: { $or: [{ name: /Lautus Sparkling Red/i }, { slug: /lautus-sparkling-red/i }] },
    data: {
      name: 'De Pizan Sparkling Red 750ml',
      slug: slugify('De Pizan Sparkling Red 750ml'),
      brand: 'De Pizan',
      subcategory: 'Non-Alcoholic Sparkling Red Wine',
      country: 'South Africa',
      size: '750ml',
      image: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1791269161/grand-store/products/wine-grandstore/depizan-sparkling-red.png',
      description: 'De Pizan Sparkling Red provides festive sparkling luxury without alcohol, packed with red forest berries, spiced undertones, and a fine vibrant bead.',
      tastingNotes: ['Red Forest Berries', 'Black Cherry', 'Spiced Plum', 'Vibrant Fizz', 'Balanced Soft Finish'],
      approvalStatus: 'approved'
    }
  },
  {
    // Figure 8
    match: { $or: [{ name: /Leitz Eins-Zwei-Zero Red/i }, { slug: /leitz-eins-zwei-zero-red/i }] },
    data: {
      name: 'De Pizan Rouge 750ml',
      slug: slugify('De Pizan Rouge 750ml'),
      brand: 'De Pizan',
      subcategory: 'Non-Alcoholic Red Wine Alternative',
      country: 'South Africa',
      size: '750ml',
      image: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1791269162/grand-store/products/wine-grandstore/depizan-rouge.png',
      description: 'De Pizan Rouge is a sophisticated non-alcoholic red vintage featuring juicy dark currants, ripe berries, gentle tannins, and a clean, dry finish.',
      tastingNotes: ['Dark Currants', 'Ripe Blackberry', 'Soft Spice', 'Dry Structured Finish'],
      approvalStatus: 'approved'
    }
  },
  {
    // Figure 9
    match: { $or: [{ name: /Lautus De-Alcoholised Ros[eé]/i }, { slug: /lautus-de-alcoholised-rose/i }] },
    data: {
      name: 'De Pizan Fraisch 750ml',
      slug: slugify('De Pizan Fraisch 750ml'),
      brand: 'De Pizan',
      subcategory: 'Non-Alcoholic White Wine Alternative',
      country: 'South Africa',
      size: '750ml',
      image: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1791269163/grand-store/products/wine-grandstore/depizan-fraisch.png',
      description: 'De Pizan Fraisch is a crisp and refreshing non-alcoholic white wine alternative boasting green fruit, delicate citrus aromas, and pure cooling refreshment.',
      tastingNotes: ['Green Apple', 'Zesty Citrus', 'Subtle Blossom', 'Crisp Invigorating Finish'],
      approvalStatus: 'approved'
    }
  },
  {
    // Figure 10
    match: { $or: [{ name: /Cerise/i }, { slug: /de-pizan.*cerise/i }] },
    data: {
      name: 'De Pizan Cerise 750ml',
      slug: slugify('De Pizan Cerise 750ml'),
      brand: 'De Pizan',
      category: 'Wine',
      type: 'Wine',
      subcategory: 'Non-Alcoholic Rosé Wine',
      country: 'South Africa',
      size: '750ml',
      price: '200.00',
      image: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1791269164/grand-store/products/wine-grandstore/depizan-cerise.png',
      description: 'Pale pink onion skin in colour with a fruity nose. Soft and elegant with cherries and raspberries on the palate and a prolonged aftertaste. Served chilled, it makes it ideal for the perfect spring and summer months.',
      tastingNotes: ['Pale Pink Onion Skin', 'Fruity Nose', 'Cherries', 'Raspberries', 'Prolonged Aftertaste'],
      approvalStatus: 'approved',
      stock: 50,
      featured: true,
      options: ['750ml']
    },
    upsertIfMissing: true
  }
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  for (const item of updates) {
    let product = await Product.findOne(item.match);
    if (!product && item.upsertIfMissing) {
      console.log(`Creating new product for ${item.data.name}...`);
      const newId = `wine_depizan_cerise_${Date.now()}`;
      product = await Product.create({
        id: newId,
        ...item.data
      });
      console.log(`Created new product: ID: ${product._id}, Name: ${product.name}, Slug: ${product.slug}`);
    } else if (product) {
      console.log(`Updating product: Old Name: "${product.name}" -> New Name: "${item.data.name}"`);
      Object.assign(product, item.data);
      await product.save();
      console.log(`Updated successfully. Slug: ${product.slug}`);
    } else {
      console.warn(`No product found matching ${JSON.stringify(item.match)}`);
    }
  }

  console.log('\n--- VERIFICATION OF ALL 10 PRODUCTS IN DATABASE ---');
  const allUpdated = await Product.find({
    $or: [
      { brand: 'Lucmo Wines' },
      { brand: 'De Pizan' },
      { name: /Lucmo/i },
      { name: /De Pizan/i }
    ]
  }).select('id name slug brand subcategory price image').lean();

  console.log(JSON.stringify(allUpdated, null, 2));
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
