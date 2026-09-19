require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Product = require('../models/Product');

const MANIFEST_PATH = path.resolve(__dirname, 'dobbe_cloudinary_manifest.json');

const PRODUCT_METADATA = {
  dobbe_vs: {
    name: 'Dobbé Cognac VS 750ml',
    brand: 'Dobbé',
    category: 'Cognac',
    subcategory: 'VS',
    country: 'France',
    region: 'Cognac',
    price: 850,
    offer_price: 795,
    offer_active: true,
    size: '750ml',
    abv: '40.0%',
    stock: 35,
    isPublished: true,
    description: 'Dobbé VS (Very Special) Cognac is a vibrant, golden amber blend of eaux-de-vie carefully aged in French oak casks on the family estate. The nose reveals expressive notes of freshly bloomed vine flowers, crisp yellow fruits, warm vanilla pods, and delicate oak spice. On the palate, it delivers a spirited yet supple texture with hints of apricot, almond, and honeyed malt, culminating in a balanced, pleasantly warming finish. Ideal enjoyed neat, on a large ice cube, or as the refined foundation of iconic Cognac cocktails.',
    tastingNotes: ['Vine Blossom', 'Crisp Yellow Apple', 'Warm Oak', 'Sweet Vanilla', 'Almond'],
    flavorProfile: ['Floral', 'Fruity & Spicy', 'Warm & Balanced'],
    foodPairing: ['Artisanal Charcuterie', 'Mild Cheeses', 'Lemon Tarte', 'Dark Chocolate Truffles'],
    tags: ['Dobbé', 'Cognac', 'VS', 'French Spirits', 'Luxury Cognac', 'Estate Bottled']
  },
  dobbe_vsop: {
    name: 'Dobbé Cognac VSOP 750ml',
    brand: 'Dobbé',
    category: 'Cognac',
    subcategory: 'VSOP',
    country: 'France',
    region: 'Cognac',
    price: 1250,
    offer_price: 1150,
    offer_active: true,
    size: '750ml',
    abv: '40.0%',
    stock: 30,
    isPublished: true,
    description: 'Dobbé VSOP (Very Superior Old Pale) Cognac boasts glowing mahogany reflections with deep golden highlights. Crafted from premier cru reserves nurtured for years in Tronçais and Limousin oak barriques. The aromatic profile bursts with dried figs, stewed apricots, candied orange peel, toasted brioche, and gentle cinnamon warmth. Round and remarkably velvety on the tongue, balancing structured tannin with decadent caramelized stone fruit and vanilla, leaving an opulent, lingering aftertaste.',
    tastingNotes: ['Stewed Apricot', 'Candied Orange', 'Toasted Brioche', 'Limousin Oak', 'Cinnamon Spice'],
    flavorProfile: ['Rich & Sherried', 'Fruity & Spicy', 'Velvety Smooth'],
    foodPairing: ['Smoked Duck Breast', 'Aged Comté Cheese', 'Crème Brûlée', 'Fine Cigars'],
    tags: ['Dobbé', 'Cognac', 'VSOP', 'French Spirits', 'Luxury Cognac', 'Award Winning']
  },
  dobbe_10_ans: {
    name: 'Dobbé Cognac 10 Ans Petite Champagne 750ml',
    brand: 'Dobbé',
    category: 'Cognac',
    subcategory: 'XO',
    country: 'France',
    region: 'Cognac Petite Champagne',
    price: 1850,
    offer_price: 1750,
    offer_active: true,
    size: '750ml',
    abv: '40.0%',
    stock: 24,
    isPublished: true,
    description: 'An exceptional 10-year-aged single terroir Cognac hailing exclusively from the coveted limestone and chalk slopes of Petite Champagne. Deep amber in hue, it presents a complex, aristocratic bouquet marked by dried date, dark honey, saddle leather, crushed walnut, and subtle violet perfume. The mouthfeel is broad, generous, and multi-layered, showing rancio nuances, dark cocoa, and lingering toasted hazelnut. A connoisseur’s masterpiece showing the pedigree of the Dobbé terroir.',
    tastingNotes: ['Dried Dates', 'Crushed Walnut', 'Leather', 'Violet Flower', 'Rancio & Cocoa'],
    flavorProfile: ['Complex & Layered', 'Deep Wood', 'Aristocratic & Polished'],
    foodPairing: ['Roast Venison', 'Roquefort Blue Cheese', 'Walnut Tart', 'Single Origin Espresso'],
    tags: ['Dobbé', 'Cognac', 'Petite Champagne', '10 Years Old', 'Single Cru', 'XO Quality']
  },
  dobbe_xo: {
    name: 'Dobbé Cognac XO Fine Gastronomie 750ml',
    brand: 'Dobbé',
    category: 'Cognac',
    subcategory: 'XO',
    country: 'France',
    region: 'Cognac',
    price: 2950,
    offer_price: 2790,
    offer_active: true,
    size: '750ml',
    abv: '40.0%',
    stock: 20,
    isPublished: true,
    description: 'Dobbé XO (Extra Old) Fine Gastronomie is the estate’s crowning prestige expression. Assembled from ancient family reserves aged for decades in the darkest corners of the Dobbé cellars. Displays a majestic copper-bronze color with golden topaz edges. The nose reveals profound aromas of cedar cigar box, pipe tobacco, dried plum, dark rancio, nutmeg, and dark roasted cocoa nibs. Luxuriously thick and silky on the palate with waves of exotic spices and stewed damson fruit that persist for minutes.',
    tastingNotes: ['Cedar Cigar Box', 'Old Rancio', 'Pipe Tobacco', 'Dried Plum', 'Dark Chocolate Nibs'],
    flavorProfile: ['Opulent & Heavy', 'Intense Rancio', 'Epic Persistence'],
    foodPairing: ['Wagyu Beef with Truffle Jus', 'Vintage Stilton', 'Dark Chocolate Ganache', 'Prestige Habano Cigars'],
    tags: ['Dobbé', 'Cognac', 'XO', 'Prestige', 'Extra Old', 'Fine Gastronomie', 'Collector']
  },
  dobbe_millesime_1999: {
    name: 'Dobbé Cognac Millésime 1999 Vintage 750ml',
    brand: 'Dobbé',
    category: 'Cognac',
    subcategory: 'Other Cognac',
    country: 'France',
    region: 'Cognac',
    price: 4850,
    offer_price: 4500,
    offer_active: false,
    size: '750ml',
    abv: '40.0%',
    stock: 12,
    isPublished: true,
    description: 'A singular, irreplaceable 1999 Millésime vintage Cognac sealed in an artisanal flacon with individual cellar registry number. Harvested exclusively in autumn 1999 and matured undisturbed under strict French state bailiff control. Radiant topaz amber with shimmering gold. Breathtaking aromas of candied citrus peel, exotic saffron, eucalyptus honey, aged sandalwood, and leather bound books. Flawlessly smooth on the palate with crystalline fruit purity and timeless complexity.',
    tastingNotes: ['Candied Citrus', 'Exotic Saffron', 'Aged Sandalwood', 'Eucalyptus Honey', 'Antique Leather'],
    flavorProfile: ['Single Harvest Vintage', 'Ultra Refined', 'Singular Terroir'],
    foodPairing: ['Lobster Thermidor', 'Caviar & Blinis', '36-Month Comté', 'Rare Vintage Cigar'],
    tags: ['Dobbé', 'Cognac', 'Millésime 1999', 'Vintage Cognac', 'Single Harvest', 'Investment Bottle']
  },
  dobbe_extra: {
    name: 'Dobbé Cognac Extra Rare Gift Box 750ml',
    brand: 'Dobbé',
    category: 'Cognac',
    subcategory: 'XXO',
    country: 'France',
    region: 'Cognac',
    price: 8500,
    offer_price: 7999,
    offer_active: false,
    size: '750ml',
    abv: '40.0%',
    stock: 8,
    isPublished: true,
    description: 'Presented in an opulent bespoke collector’s gift showcase, Dobbé Extra represents the pinnacle of eighth-generation family distilling. Blended from century-old family heirloom barrels passed down through master blenders. Deep shimmering mahogany. The bouquet is a breathtaking symphony of aged rancio, black truffle, dried passion fruit, candied ginger, and precious balsam. An ethereal, transformative tasting experience that defines the zenith of Cognac artistry.',
    tastingNotes: ['Black Truffle', 'Century Rancio', 'Candied Ginger', 'Dried Passion Fruit', 'Precious Balsam'],
    flavorProfile: ['Monumental Rancio', 'Silky Nectar', 'Heirloom Casks'],
    foodPairing: ['Black Truffle Risotto', 'Périgord Foie Gras', 'Gourmet Dessert Tasting', 'Special Milestone Celebrations'],
    tags: ['Dobbé', 'Cognac', 'Extra', 'XXO', 'Luxury Presentation Box', 'Century Reserve', 'Crown Jewel']
  },
  dobbe_o_liqueur: {
    name: 'Dobbé "O" Liqueur au Cognac & Orange 750ml',
    brand: 'Dobbé',
    category: 'Liqueur',
    subcategory: 'Liqueur au Cognac',
    country: 'France',
    region: 'Cognac',
    price: 750,
    offer_price: 695,
    offer_active: true,
    size: '750ml',
    abv: '35.0%',
    stock: 40,
    isPublished: true,
    description: 'An enchanting French cordial uniting aged Dobbé Cognac with sun-drenched sweet and bitter Mediterranean orange essences. Glowing warm gold in color with mouthwatering aromas of freshly grated Seville orange zest, tangerine blossom, caramelized citrus syrup, and warm Cognac spirit. On the palate, natural fruit sweetness is masterfully countered by the depth and warmth of oak-aged brandy. Divine served chilled over ice, in a premium Grand Spritz, or flambéed over gourmet crêpes.',
    tastingNotes: ['Seville Orange Zest', 'Tangerine Blossom', 'Caramelized Citrus', 'Honeyed Cognac', 'Vanilla Warmth'],
    flavorProfile: ['Sweet & Citrusy', 'Warming Cognac Base', 'Refreshing'],
    foodPairing: ['Crêpes Suzette', 'Orange Soufflé', 'Dark Chocolate Mousse', 'Citrus Glazed Duck'],
    tags: ['Dobbé', 'Liqueur', 'Cognac Liqueur', 'Orange Cordial', 'Cocktail Essential', 'French Aperitif']
  },
  dobbe_whisky_peated: {
    name: 'Dobbé Peated Single Malt French Whisky 750ml',
    brand: 'Dobbé',
    category: 'Whisky',
    subcategory: 'Single Malt',
    country: 'France',
    region: 'Charente',
    price: 980,
    offer_price: 899,
    offer_active: true,
    size: '750ml',
    abv: '43.0%',
    stock: 35,
    isPublished: true,
    description: 'Distilled by Dobbé cellar masters in historic Charentais copper pot stills using French peated malted barley. Aged extensively in fine French oak casks seasoned with estate Cognac. Straw gold with luminous highlights. The nose reveals delicate aromatic peat smoke, crushed malt, maritime salinity, roasted hazelnut, and poached pear with honey. Full-bodied, crisp, and elegantly smoky on the palate, harmonizing peat embers with orchard fruit and a lingering mineral-peat finish.',
    tastingNotes: ['Peat Smoke', 'Poached Pear', 'Malted Barley', 'Cognac Oak Cask', 'Maritime Brine'],
    flavorProfile: ['Smoky & Peated', 'Crisp Malt', 'French Oak Elegance'],
    foodPairing: ['Smoked Scottish Salmon', 'Charred Oysters', 'Barbecued Ribeye', 'Mature Cheddar'],
    tags: ['Dobbé', 'Whisky', 'French Whisky', 'Single Malt', 'Peated Whisky', 'Cognac Cask Finished']
  }
};

async function seed() {
  try {
    if (!fs.existsSync(MANIFEST_PATH)) {
      console.error(`❌ Manifest not found at: ${MANIFEST_PATH}`);
      console.error('Please run upload_dobbe_cloudinary.js first.');
      process.exit(1);
    }

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    console.log(`Loaded manifest with ${Object.keys(manifest).length} product entries.`);

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB.');

    let inserted = 0;
    let updated = 0;

    for (const [key, meta] of Object.entries(PRODUCT_METADATA)) {
      const manifestItem = manifest[key];
      if (!manifestItem || !manifestItem.images || manifestItem.images.length === 0) {
        console.warn(`⚠️ No images in manifest for product key: ${key}. Skipping.`);
        continue;
      }

      const primaryImg = manifestItem.images.find(img => img.role === 'primary') || manifestItem.images[0];
      const galleryImgs = manifestItem.images.filter(img => img.role === 'gallery').map(img => img.transparentUrl || img.originalUrl);

      const productPayload = {
        ...meta,
        image: primaryImg.transparentUrl,
        originalImage: primaryImg.originalUrl,
        cloudinaryPublicId: primaryImg.publicId,
        gallery: galleryImgs.length > 0 ? galleryImgs : [primaryImg.transparentUrl],
        backgroundRemovalStatus: 'complete',
        backgroundRemovalError: '',
        backgroundRemovedAt: new Date()
      };

      const existing = await Product.findOne({ name: meta.name });

      if (existing) {
        await Product.updateOne({ _id: existing._id }, { $set: productPayload });
        console.log(`✓ Updated: ${meta.name}`);
        updated++;
      } else {
        const id = crypto.randomUUID();
        const slug = meta.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        await Product.create({
          ...productPayload,
          id,
          slug
        });
        console.log(`+ Inserted: ${meta.name} (id: ${id}, slug: ${slug})`);
        inserted++;
      }
    }

    console.log(`\n========================================`);
    console.log(`🎉 Seeding Summary:`);
    console.log(`   Total Inserted: ${inserted}`);
    console.log(`   Total Updated:  ${updated}`);
    console.log(`========================================\n`);

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
