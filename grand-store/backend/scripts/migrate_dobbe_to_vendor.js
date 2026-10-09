require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
const Product = require('../models/Product');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://crmisa1000_db_user:Ug5sH8m4vxCjmZHN@cluster0.8snrppp.mongodb.net/test?retryWrites=true&w=majority';

const VENDOR_EMAIL = 'vendor@grandstore.com';
const VENDOR_NAME = 'Maison Dobbé';
const VENDOR_LEGAL_NAME = 'Maison Dobbé SAS';

// Authentic descriptions & specifications scraped from dobbecognac.com
const DOBBE_ENRICHED_DATA = {
  'dobbe-cognac-vs-750ml': {
    name: 'Dobbé Cognac VS 750ml',
    brand: 'Dobbé',
    vendorName: VENDOR_NAME,
    category: 'Cognac',
    subcategory: 'VS',
    country: 'France',
    size: '750ml',
    description: 'Intensely fresh and floral. DOBBÉ Cognac VS (Very Special) is a lively, harmonious cognac crafted on the family estate in Salignac-sur-Charente, near Cognac, where the Dobbé family has tended vineyards for ten generations since 1787. Double-distilled in traditional 25-hectolitre Charentais copper pot stills on light lees and aged in handcrafted Limousin oak barrels, it offers delicate aromas of vanilla and fresh grape flowers, alongside subtle hints of oak and hazelnut. Its clear, brilliant golden robe introduces a palate that is both crisp and balanced, culminating in a warm, pleasant finish.',
    identity: {
      type: 'Cognac',
      style: 'VS (Very Special)',
      production: 'Double distilled in copper pot stills on light lees; Limousin oak cask aged',
      origin: 'France – Cognac AOC (Petite Champagne & Fins Bois)',
      age: 'VS Selection',
      bottleSize: '750ml',
      abv: '40% vol'
    },
    tastingNotes: ['Fresh Vanilla', 'White Grape Flowers', 'Dried Herbs', 'Toasted Hazelnut', 'Limousin Oak'],
    flavorProfile: ['Fresh & Floral', 'Harmonious & Balanced', 'Crisp Oak Backbone'],
    foodPairing: ['Fresh Oysters', 'Citrus Seafood Ceviche', 'Tarte aux Pommes', 'Tonic & Lemon Long Drink', 'Aperitif Neat or on Ice'],
    tags: ['Dobbé', 'Dobbe', 'Maison Dobbé', 'Cognac', 'VS', 'Very Special', 'Salignac-sur-Charente', 'French Spirits', 'Estate Bottled', 'Grand Vendor']
  },

  'dobbe-cognac-vsop-750ml': {
    name: 'Dobbé Cognac VSOP 750ml',
    brand: 'Dobbé',
    vendorName: VENDOR_NAME,
    category: 'Cognac',
    subcategory: 'VSOP',
    country: 'France',
    size: '750ml',
    description: 'A delicious pleasure. DOBBÉ Cognac VSOP (Very Superior Old Pale) is aged in French oak barrels on the family estate in Salignac-sur-Charente. Over years of patient aging in the family\'s historic cellars, it has developed intense floral notes of violet and rose, alongside luscious hints of apricot jam and warm Bourbon vanilla. Its golden yellow robe sparkles with rich amber hues. This wonderful harmony reveals a delicate, well-balanced cognac that generates a feeling of warmth lasting several minutes on the palate. Presented with its warm golden and chocolate-coloured gift presentation.',
    identity: {
      type: 'Cognac',
      style: 'VSOP (Very Superior Old Pale)',
      production: 'Estate double distillation in 25-hl Charentais stills; aged in French oak casks',
      origin: 'France – Cognac AOC',
      age: 'VSOP Reserve',
      bottleSize: '750ml',
      abv: '40% vol'
    },
    tastingNotes: ['Wild Violet', 'Rose Petal', 'Apricot Jam', 'Bourbon Vanilla', 'Warm Amber Oak'],
    flavorProfile: ['Velvety & Round', 'Floral & Fruity Harmony', 'Long Warm Finish'],
    foodPairing: ['Duck Breast with Orange Glaze', 'Aged Comté Cheese', 'Crème Brûlée', 'Digestif Neat or on the Rocks'],
    tags: ['Dobbé', 'Dobbe', 'Maison Dobbé', 'Cognac', 'VSOP', 'Very Superior Old Pale', 'Salignac-sur-Charente', 'French Spirits', 'Luxury Cognac', 'Award Winning', 'Grand Vendor']
  },

  'dobbe-cognac-10-ans-petite-champagne-750ml': {
    name: 'Dobbé Cognac 10 Ans Petite Champagne 750ml',
    brand: 'Dobbé',
    vendorName: VENDOR_NAME,
    category: 'Cognac',
    subcategory: 'XO',
    country: 'France',
    size: '750ml',
    description: 'The noble expression of a single Cru. DOBBÉ Cognac 10 Ans Petite Champagne is an exceptional single-terroir cognac hailing exclusively from the coveted limestone and chalk slopes of Petite Champagne—the second most prized cru in the Cognac appellation. Distilled on light lees and aged for a minimum of 10 years in the historic cellars of Salignac-sur-Charente, it presents a complex, aristocratic bouquet marked by dried dates, dark forest honey, saddle leather, crushed walnut, and subtle violet perfume. The mouthfeel is broad, generous, and multi-layered, showing rancio nuances, dark cocoa, and lingering toasted hazelnut.',
    identity: {
      type: 'Cognac',
      style: '10 Ans Petite Champagne (Single Cru XO Tier)',
      production: '100% Petite Champagne single cru harvest, double distilled on light lees, aged 10+ years',
      origin: 'France – Petite Champagne Cognac AOC',
      age: '10 Years Minimum',
      bottleSize: '750ml',
      abv: '40% vol'
    },
    tastingNotes: ['Dried Dates & Figs', 'Crushed Walnut', 'Antique Saddle Leather', 'Violet Flower', 'Dark Cocoa & Rancio'],
    flavorProfile: ['Aristocratic & Structured', 'Deep Terroir Minerality', 'Polished Wood & Long Finish'],
    foodPairing: ['Roasted Venison with Lingonberry', '24-Month Roquefort Blue Cheese', 'Walnut Tart', 'Single Origin Espresso', 'Connoisseur Snifter'],
    tags: ['Dobbé', 'Dobbe', 'Maison Dobbé', 'Cognac', '10 Ans', '10 ans', 'Petite Champagne', '10 Years Old', 'Single Cru', 'XO Quality', 'Grand Vendor']
  },

  'dobbe-cognac-xo-fine-gastronomie-750ml': {
    name: 'Dobbé Cognac XO Fine Gastronomie 750ml',
    brand: 'Dobbé',
    vendorName: VENDOR_NAME,
    category: 'Cognac',
    subcategory: 'XO',
    country: 'France',
    size: '750ml',
    description: 'A wealth of flavours. DOBBÉ Cognac XO Extra (Extra Old) has rich, velvety flavours and notes of jasmine and candied orange, harmoniously blended with a subtle hint of toasted brioche. With its brilliant mahogany robe, it produces true pleasure and an immense wealth of aromas drawn from carefully selected, mature family reserve cognacs. Perfectly balanced, its elegant finish remains on the palate for up to 15 minutes. This smooth, velvety cognac is crafted specifically for fine gastronomy, making it an extraordinary accompaniment to chocolate desserts, tarte tatin, and memorable post-prandial moments. Accompanied by the exclusive DOBBÉ carafe gift box.',
    identity: {
      type: 'Cognac',
      style: 'XO Extra / Fine Gastronomie',
      production: 'Master blend of mature family reserve eaux-de-vie aged in toasted French oak',
      origin: 'France – Cognac AOC',
      age: 'Extra Old (XO)',
      bottleSize: '750ml',
      abv: '40% vol'
    },
    tastingNotes: ['Jasmine Flower', 'Candied Orange Peel', 'Toasted Brioche', 'Sweet Almond', 'Dark Fig & Rancio'],
    flavorProfile: ['Opulent & Velvety', '15-Minute Persistent Finish', 'Gastronomic Harmony'],
    foodPairing: ['Dark Chocolate Fondant', 'Tarte Tatin', 'Roast Duck with Blackberry Reduction', 'Fine Havana Cigar', 'Digestif Neat'],
    tags: ['Dobbé', 'Dobbe', 'Maison Dobbé', 'Cognac', 'XO', 'XO Extra', 'Prestige', 'Extra Old', 'Fine Gastronomie', 'Collector Carafe', 'Grand Vendor']
  },

  'dobbe-cognac-millesime-1999-vintage-750ml': {
    name: 'Dobbé Cognac Millésime 1999 Vintage 750ml',
    brand: 'Dobbé',
    vendorName: VENDOR_NAME,
    category: 'Cognac',
    subcategory: 'Millésime',
    country: 'France',
    size: '750ml',
    description: 'The choice of connoisseurs. Cognac DOBBÉ Collection Vintage 1999 is a rare, numbered, and strictly limited single-harvest vintage estate bottled at the family estate in Salignac-sur-Charente. Recognisable by its deep amber colour with antique copper highlights, the nose is powerful and characterized by the floral and mineral notes of Petite Champagne, intertwined with sensual hints of bourbon vanilla, old leather, candied apricot, and fresh vine flowers. Non-chill filtered to safeguard all natural aromatics, essential oils, and textural depth, delivering an unforgettable, exceptionally long finish.',
    identity: {
      type: 'Cognac',
      style: 'Millésime 1999 (Vintage Single Harvest)',
      production: 'Non-chill filtered, single harvest distillation in 25-hl copper pot stills, hand-bottled & numbered',
      origin: 'France – Petite Champagne Cognac AOC',
      age: 'Vintage 1999 Single Harvest',
      bottleSize: '750ml',
      abv: '40% vol'
    },
    tastingNotes: ['Antique Leather', 'Dried Apricot', 'Bourbon Vanilla Bean', 'Vine Flowers', 'Toasted Cedar & Spice'],
    flavorProfile: ['Powerful & Pure', 'Unfiltered Rich Texture', 'Sensual & Endless Length'],
    foodPairing: ['36-Month Aged Parmigiano-Reggiano', 'Black Truffle Risotto', 'Artisanal Cigar Pairing', 'Collector Tasting Pour'],
    tags: ['Dobbé', 'Dobbe', 'Maison Dobbé', 'Cognac', 'Millésime 1999', 'Vintage Cognac', '1999', 'Single Harvest', 'Non-Chill Filtered', 'Investment Bottle', 'Grand Vendor']
  },

  'dobbe-cognac-extra-rare-gift-box-750ml': {
    name: 'Dobbé Cognac Extra Rare Gift Box 750ml',
    brand: 'Dobbé',
    vendorName: VENDOR_NAME,
    category: 'Cognac',
    subcategory: 'XXO',
    country: 'France',
    size: '750ml',
    description: 'The power of character and the taste of excellence. DOBBÉ Cognac Extra Rare Héritage Petite Champagne is the crown jewel of the house of DOBBÉ, composed of the rarest, oldest family reserve eaux-de-vie preserved in demijohns across ten generations. Its deep amber robe glows with antique mahogany reflections. The clear, transcendent bouquet combines noble woody and fruity notes, complemented by the warm flavours of mocha, roasted cocoa, dried prunes, wild honey, and grilled pistachio. The power and elegance of this distinguished eau-de-vie generate the unique pleasure of an extraordinarily long, silky finish. Housed in a hand-crafted collector\'s coffret.',
    identity: {
      type: 'Cognac',
      style: 'Extra Rare Héritage / Grand Century Prestige',
      production: 'Century family demijohn reserves, non-chill filtered, handcrafted luxury presentation coffret',
      origin: 'France – Petite Champagne Cognac AOC (Family Reserve)',
      age: 'Prestige Century Reserve',
      bottleSize: '750ml',
      abv: '40% vol'
    },
    tastingNotes: ['Mocha & Roasted Cocoa', 'Candied Prunes', 'Wild Forest Honey', 'Grilled Pistachio', 'Aged Cedar & Ancient Rancio'],
    flavorProfile: ['Monumental Depth', 'Silky Warmth', 'Decades-Aged Complexity', 'Endless Finish'],
    foodPairing: ['Standalone Meditative Sip', '85% Single-Origin Madagascar Chocolate', 'Prestige Celebrations', 'Neat in Crystal Snifter'],
    tags: ['Dobbé', 'Dobbe', 'Maison Dobbé', 'Cognac', 'Extra Rare', 'Héritage', 'XXO', 'Grand Century', 'Luxury Presentation Box', 'Century Reserve', 'Crown Jewel', 'Grand Vendor']
  },

  'dobbe-o-liqueur-au-cognac-orange-750ml': {
    name: 'Dobbé "O" Liqueur au Cognac & Orange 750ml',
    brand: 'Dobbé',
    vendorName: VENDOR_NAME,
    category: 'Liqueur',
    subcategory: 'Cognac Liqueur',
    country: 'France',
    size: '750ml',
    description: 'A hint of lightness. DOBBÉ O Liqueur is an original, award-winning blend of prestigious family estate cognac and the delicious natural flavours of sweet and bitter orange peels. Its bouquet reveals an irresistible harmony of orange blossom combined with candied, caramelised zest. The presence of the cognac strengthens the aromas of bitter orange, enriched with subtle notes of compote, hazelnuts, and spiced honey. This golden liqueur with its lingering taste is celebrated for its lightness, sophistication, and versatile elegance. Enjoy neat over ice, with premium mixers, or in classic cocktails like the Sidecar.',
    identity: {
      type: 'Liqueur',
      style: 'Liqueur au Cognac & Orange',
      production: 'Natural maceration of sweet and bitter orange peels blended with family-distilled cognac',
      origin: 'France – Cognac',
      age: 'Artisanal Cordial',
      bottleSize: '750ml',
      abv: '40% vol'
    },
    tastingNotes: ['Orange Blossom', 'Caramelised Orange Zest', 'Candied Citrus Compote', 'Roasted Hazelnut', 'Warm Spiced Cognac'],
    flavorProfile: ['Bright Citrus Perfume', 'Silky & Sweet', 'Warming Cognac Backbone'],
    foodPairing: ['Crêpes Suzette', 'Duck à l\'Orange', 'Dark Chocolate Mousse', 'Classic Sidecar & Champagne Cocktails', 'On the Rocks'],
    tags: ['Dobbé', 'Dobbe', 'Maison Dobbé', 'Liqueur', 'Cognac Liqueur', 'Orange Cordial', 'Cocktail Essential', 'French Aperitif', 'Grand Vendor']
  },

  'dobbe-peated-single-malt-french-whisky-750ml': {
    name: 'Dobbé Peated Single Malt French Whisky 750ml',
    brand: 'Dobbé',
    vendorName: VENDOR_NAME,
    category: 'Whisky',
    subcategory: 'Single Malt',
    country: 'France',
    size: '750ml',
    description: 'French craft distillation meets tenth-generation family expertise. DOBBÉ Peated Single Malt is produced in France from 100% French malted barley smoked over natural peat. Distilled with traditional artisanal care and matured in oak barrels in the Charente region, this rare expression receives an extended secondary maturation in ancient Dobbé Cognac oak casks. The result is a mesmerizing marriage of aromatic peat smoke, earthy heather, and maritime salinity interwoven with the lush fruitiness, rancio notes, and delicate vanilla imparted by historic cognac barrels.',
    identity: {
      type: 'Whisky',
      style: 'Peated Single Malt French Whisky',
      production: '100% French malted barley, artisanal distillation, finished in historic Dobbé Cognac oak casks',
      origin: 'France',
      age: 'Craft Single Malt Selection',
      bottleSize: '750ml',
      abv: '43% vol'
    },
    tastingNotes: ['Elegant Peat Smoke', 'Stewed Orchard Apples', 'Cognac Cask Oak', 'Salted Toffee', 'Dried Heather & Vanilla'],
    flavorProfile: ['Earthy Peat & Smoke', 'Rich Cognac Fruit Elegance', 'Spiced Oak Finish'],
    foodPairing: ['Smoked Salmon & Caviar', 'Venison Carpaccio', 'Mature Farmhouse Cheddar', 'Smoked Barbecue Ribs', 'Neat with a Drop of Spring Water'],
    tags: ['Dobbé', 'Dobbe', 'Maison Dobbé', 'Whisky', 'French Whisky', 'Single Malt', 'Peated Whisky', 'Cognac Cask Finished', 'Grand Vendor']
  }
};

async function migrate() {
  console.log('Connecting to MongoDB Atlas...');
  await mongoose.connect(MONGO_URI);
  console.log('Connected.');

  const User = mongoose.connection.collection('users');
  const Vendor = mongoose.connection.collection('vendors');
  const ProductColl = mongoose.connection.collection('products');

  // 1. Find the target vendor user
  const vendorUser = await User.findOne({ email: VENDOR_EMAIL });
  if (!vendorUser) {
    throw new Error(`Vendor user ${VENDOR_EMAIL} not found in database!`);
  }
  const vendorUserId = vendorUser._id;
  console.log(`Found vendor user: ${vendorUser.email} (ID: ${vendorUserId})`);

  // 2. Ensure Vendor document is configured with Maison Dobbé trading name and approved status
  let vendorDoc = await Vendor.findOne({ userId: vendorUserId });
  if (!vendorDoc) {
    console.log('Creating new Vendor profile for user...');
    const newVendor = {
      userId: vendorUserId,
      status: 'approved',
      paymentStatus: 'paid',
      businessInfo: {
        legalName: VENDOR_LEGAL_NAME,
        tradingName: VENDOR_NAME,
        businessType: 'Private Company',
        address: 'Salignac-sur-Charente, 17800 France',
        email: VENDOR_EMAIL
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const insertRes = await Vendor.insertOne(newVendor);
    vendorDoc = { _id: insertRes.insertedId, ...newVendor };
    console.log(`Created Vendor profile: ${vendorDoc._id}`);
  } else {
    console.log(`Updating existing Vendor profile ${vendorDoc._id} to tradingName: "${VENDOR_NAME}"...`);
    await Vendor.updateOne(
      { _id: vendorDoc._id },
      {
        $set: {
          status: 'approved',
          paymentStatus: 'paid',
          'businessInfo.tradingName': VENDOR_NAME,
          'businessInfo.legalName': VENDOR_LEGAL_NAME,
          updatedAt: new Date()
        }
      }
    );
    console.log('Vendor profile updated.');
  }

  // 3. Migrate and Enrich each of the 8 products
  console.log('\n=== Migrating and Enriching Dobbé Products ===');
  let migratedCount = 0;

  for (const [slug, meta] of Object.entries(DOBBE_ENRICHED_DATA)) {
    const existing = await ProductColl.findOne({ slug });
    if (!existing) {
      console.warn(`Product with slug "${slug}" not found in database! Skipping.`);
      continue;
    }

    const updateFields = {
      vendorId: vendorUserId,
      storeId: vendorUserId.toString(),
      storeName: VENDOR_NAME,
      vendorName: VENDOR_NAME,
      approvalStatus: 'approved',
      catalogManaged: false,

      // Enriched content from dobbecognac.com
      name: meta.name,
      brand: meta.brand,
      category: meta.category,
      subcategory: meta.subcategory,
      country: meta.country,
      size: meta.size,
      description: meta.description,
      identity: meta.identity,
      tastingNotes: meta.tastingNotes,
      flavorProfile: meta.flavorProfile,
      foodPairing: meta.foodPairing,
      tags: meta.tags,

      updatedAt: new Date()
    };

    await ProductColl.updateOne(
      { _id: existing._id },
      { $set: updateFields }
    );

    console.log(`✅ [${slug}] migrated to ${VENDOR_EMAIL} (${VENDOR_NAME}) and enriched.`);
    migratedCount++;
  }

  console.log(`\n🎉 Successfully migrated ${migratedCount} products to vendor ${VENDOR_EMAIL}!`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
