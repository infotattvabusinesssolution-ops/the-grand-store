require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const dns = require('dns');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { keyOf, normalizeProduct } = require('../utils/productNormalization');

const SOURCE_URL = 'https://grandstore.co.za/shop/wine/red-wine';
const DEFAULT_IMAGE = '/assets/hero/wine-bottle.png';

const wines = [
  ['Tshireletso Red 750ml', 'Luc Mo Wines', 'South Africa', 'Cabernet Sauvignon', 'Stellenbosch', '990.00', '750ml', '13.5%', 'Blackcurrant|Plum|Cedar|Cocoa|Fine Tannins', 'Rich & Full-Bodied|Fruity & Spicy', 'Beef & Steak|Cheese', 'Estate Bottled'],
  ['Luc Mo Merlot Reserve 750ml', 'Luc Mo Wines', 'South Africa', 'Merlot', 'Stellenbosch', '895.00', '750ml', '13.5%', 'Black Cherry|Plum|Vanilla|Soft Oak|Velvet Tannins', 'Rich & Full-Bodied|Soft', 'Beef & Steak|Poultry|Cheese', 'Oak Matured'],
  ['Tesselaarsdal Pinot Noir 750ml', 'Tesselaarsdal Wines', 'South Africa', 'Pinot Noir', 'Hemel-en-Aarde', '625.00', '750ml', '13%', 'Red Cherry|Cranberry|Rose Petal|Earth|Silky Finish', 'Light & Floral|Fruity & Spicy', 'Poultry|Seafood|Cheese', 'Cool-Climate Fermentation'],
  ['King Moremoholo Mopeli 750ml', 'Luc Mo Wines', 'South Africa', 'Shiraz / Syrah', 'Stellenbosch', '1560.00', '750ml', '14%', 'Blackberry|Black Pepper|Violet|Smoked Spice|Long Finish', 'Rich & Full-Bodied|Fruity & Spicy', 'Beef & Steak|Game|Cheese', 'Oak Matured'],
  ['Catena Malbec 750ml', 'Catena Zapata', 'Argentina', 'Malbec', 'Mendoza', '469.00', '750ml', '13.5%', 'Black Plum|Blueberry|Violet|Cocoa|Polished Tannins', 'Rich & Full-Bodied|Fruity & Spicy', 'Beef & Steak|Game|Cheese', 'High-Altitude Viticulture'],
  ['Marqués de Riscal Reserva 750ml', 'Marqués de Riscal', 'Spain', 'Tempranillo', 'Rioja', '589.00', '750ml', '14%', 'Red Cherry|Dried Fig|Vanilla|Tobacco|Savory Oak', 'Rich & Full-Bodied|Savory', 'Beef & Steak|Poultry|Cheese', 'Barrel Aged'],
  ['Ridge Lytton Springs Zinfandel 750ml', 'Ridge Vineyards', 'USA', 'Zinfandel', 'Sonoma County', '1199.00', '750ml', '14.5%', 'Blackberry|Raspberry|Licorice|Pepper|Toasted Oak', 'Rich & Full-Bodied|Fruity & Spicy', 'Beef & Steak|Barbecue|Cheese', 'Old-Vine Field Blend'],
  ['E. Guigal Côtes du Rhône Blanc 750ml', 'E. Guigal', 'France', 'Rhone Blend', 'Rhône', '429.00', '750ml', '13%', 'White Peach|Apricot|Honeysuckle|Citrus|Mineral Finish', 'Light & Floral|Fruity & Spicy', 'Seafood|Poultry|Cheese', 'Regional Blend'],
  ['Queen Mother Mathokoana Mopeli Chardonnay 750ml', 'Luc Mo Wines', 'South Africa', 'Chardonnay', 'Stellenbosch', '1530.00', '750ml', '13.5%', 'Citrus|White Pear|Caramel|Roasted Almond|Minerality', 'Rich & Creamy|Fresh', 'Poultry|Pork|Seafood', 'Partial Oak Maturation'],
  ['Her Royal Highness Sekhothali Chenin Blanc 750ml', 'Luc Mo Wines', 'South Africa', 'Chenin Blanc', 'Stellenbosch', '1530.00', '750ml', '13%', 'Lime|Quince|White Peach|Honey|Bright Acidity', 'Light & Floral|Fruity & Spicy', 'Seafood|Poultry|Salads', 'Cool Fermentation'],
  ['La Vieille Ferme Grenache Blanc 750ml', 'La Vieille Ferme', 'France', 'Grenache', 'Rhône', '249.00', '750ml', '12.5%', 'Pear|White Flowers|Citrus Peel|Herbs|Dry Finish', 'Light & Floral|Fresh', 'Seafood|Salads|Cheese', 'Stainless Steel Fermentation'],
  ['Tshireletso White 750ml', 'Luc Mo Wines', 'South Africa', 'White Blend', 'Western Cape', '990.00', '750ml', '13%', 'Pear|Guava|Lime|White Flowers|Clean Finish', 'Light & Floral|Fruity & Spicy', 'Seafood|Poultry|Salads', 'Cape White Blend'],
  ['Cloudy Bay Sauvignon Blanc 750ml', 'Cloudy Bay', 'New Zealand', 'Sauvignon Blanc', 'Marlborough', '699.00', '750ml', '13.5%', 'Passion Fruit|Lime|Gooseberry|Fresh Herbs|Mineral Finish', 'Crisp & Fresh|Fruity & Spicy', 'Seafood|Goat Cheese|Salads', 'Cool Fermentation'],
  ['Dr. Loosen Blue Slate Riesling 750ml', 'Dr. Loosen', 'Germany', 'Riesling', 'Mosel', '429.00', '750ml', '8.5%', 'Green Apple|White Peach|Lime|Slate|Off-Dry Finish', 'Light & Floral|Crisp & Fresh', 'Seafood|Spicy Food|Poultry', 'Slate-Grown Riesling'],
  ['Luc Mo African Royals Rosé 750ml', 'Luc Mo Wines', 'South Africa', 'Rosé', 'Western Cape', '475.00', '750ml', '12.5%', 'Strawberry|Watermelon|Rose Petal|Citrus|Dry Finish', 'Light & Floral|Fruity & Spicy', 'Seafood|Salads|Poultry', 'Direct Press'],
  ['Lautus De-Alcoholised Rosé 750ml', 'Lautus', 'South Africa', 'Non-Alcoholic Rosé Wine', 'Western Cape', '179.00', '750ml', '0.5%', 'Strawberry|Red Apple|Rose Petal|Citrus|Fresh Finish', 'Light & Floral|Soft', 'Salads|Seafood|Dessert', 'De-Alcoholised'],
  ['Lautus Savvy White 750ml', 'Lautus', 'South Africa', 'Non-Alcoholic White Wine Alternative', 'Western Cape', '179.00', '750ml', '0.5%', 'Gooseberry|Lime|Green Apple|Herbs|Crisp Finish', 'Crisp & Fresh|Light & Floral', 'Seafood|Salads|Poultry', 'De-Alcoholised'],
  ['Leitz Eins-Zwei-Zero Red 750ml', 'Leitz', 'Germany', 'Non-Alcoholic Red Wine Alternative', 'Rheingau', '229.00', '750ml', '0.0%', 'Blackberry|Plum|Red Cherry|Soft Spice|Dry Finish', 'Fruity & Spicy|Soft', 'Pasta|Poultry|Cheese', 'De-Alcoholised'],
  ["Graham's 10 Year Old Tawny Port 750ml", "Graham's", 'Portugal', 'Port', 'Douro', '699.00', '750ml', '20%', 'Dried Fig|Walnut|Caramel|Orange Peel|Long Nutty Finish', 'Rich & Full-Bodied|Sweet', 'Cheese|Dessert|Nuts', 'Fortified and Cask Aged'],
  ['Lustau Los Arcos Amontillado Sherry 750ml', 'Lustau', 'Spain', 'Sherry', 'Jerez', '459.00', '750ml', '18.5%', 'Hazelnut|Dried Citrus|Savoury Spice|Saline Notes|Dry Finish', 'Savory|Rich & Full-Bodied', 'Cheese|Tapas|Nuts', 'Solera Aged'],
  ["Blandy's 10 Year Old Bual Madeira 500ml", "Blandy's", 'Portugal', 'Madeira', 'Madeira', '749.00', '500ml', '19%', 'Toffee|Dried Apricot|Walnut|Orange Peel|Bright Acidity', 'Rich & Full-Bodied|Sweet', 'Dessert|Cheese|Nuts', 'Canteiro Aged'],
  ['Cocchi Storico Vermouth di Torino 750ml', 'Cocchi', 'Italy', 'Vermouth', 'Piedmont', '599.00', '750ml', '16.5%', 'Cocoa|Bitter Orange|Rhubarb|Herbs|Warm Spice', 'Herbal|Fruity & Spicy', 'Cheese|Charcuterie|Dessert', 'Botanical Fortification'],
  ['Bottega Prosecco Rosé Brut DOC 200ml', 'Bottega', 'Italy', 'Prosecco', 'Veneto', '4554.00', '200ml', '11.5%', 'Apple|White Peach|Citrus|Wild Strawberry|Fine Bubbles', 'Light & Floral|Fruity & Spicy|Soft', 'Seafood|Cheese|Poultry', 'Tank Method'],
  ['Freixenet Cordon Negro Brut Cava 750ml', 'Freixenet', 'Spain', 'Cava', 'Catalonia', '299.00', '750ml', '11.5%', 'Green Apple|Pear|Citrus|Almond|Fine Bubbles', 'Crisp & Fresh|Light & Floral', 'Seafood|Tapas|Cheese', 'Traditional Method'],
  ['Graham Beck Brut Cap Classique 750ml', 'Graham Beck', 'South Africa', 'General Sparkling Wine', 'Western Cape', '329.00', '750ml', '12%', 'Lime|Green Apple|Brioche|White Flowers|Fine Bubbles', 'Crisp & Fresh|Light & Floral', 'Seafood|Poultry|Cheese', 'Méthode Cap Classique'],
  ['Lautus Sparkling White 750ml', 'Lautus', 'South Africa', 'Non-Alcoholic Sparkling White Wine Alternative', 'Western Cape', '189.00', '750ml', '0.5%', 'Green Apple|Pear|Citrus|White Flowers|Lively Bubbles', 'Crisp & Fresh|Light & Floral', 'Seafood|Salads|Cheese', 'De-Alcoholised'],
  ['Lautus Sparkling Red 750ml', 'Lautus', 'South Africa', 'Non-Alcoholic Sparkling Red Wine', 'Western Cape', '189.00', '750ml', '0.5%', 'Red Cherry|Blackberry|Plum|Soft Spice|Lively Bubbles', 'Fruity & Spicy|Soft', 'Poultry|Cheese|Dessert', 'De-Alcoholised'],
  ['Tshireletso Late Harvest 375ml', 'Luc Mo Wines', 'South Africa', 'Late Harvest Wine', 'Stellenbosch', '545.00', '375ml', '11%', 'Apricot|Honey|Orange Blossom|Peach|Balanced Sweetness', 'Sweet|Fruity & Spicy', 'Dessert|Cheese|Fruit', 'Late Harvest'],
  ['Inniskillin Vidal Icewine 375ml', 'Inniskillin', 'Canada', 'Ice Wine', 'Niagara Peninsula', '1399.00', '375ml', '9.5%', 'Peach|Mango|Honey|Candied Citrus|Bright Acidity', 'Sweet|Fruity & Spicy', 'Dessert|Cheese|Foie Gras', 'Frozen-Grape Pressing'],
  ['Château Suduiraut Sauternes 375ml', 'Château Suduiraut', 'France', 'Sauternes', 'Bordeaux', '1099.00', '375ml', '13.5%', 'Apricot|Honey|Saffron|Orange Marmalade|Long Finish', 'Sweet|Rich & Full-Bodied', 'Dessert|Blue Cheese|Foie Gras', 'Botrytis-Affected'],
  ["Saracco Moscato d'Asti 750ml", 'Saracco', 'Italy', 'Moscato', 'Piedmont', '399.00', '750ml', '5.5%', 'Orange Blossom|Peach|Grape|Pear|Gentle Fizz', 'Light & Floral|Sweet', 'Dessert|Fruit|Cheese', 'Lightly Sparkling']
];

const split = (value) => value.split('|').map((item) => item.trim()).filter(Boolean);

const buildProduct = (row, index) => {
  const [name, brand, country, subcategory, region, price, size, abv, notes, flavor, pairing, production] = row;
  const tastingNotes = split(notes);
  const foodPairing = split(pairing);
  const description = [
    `${name} is a premium ${subcategory.toLowerCase()} from ${brand}, produced in ${region}, ${country}.`,
    `Its aromatic profile opens with ${tastingNotes.slice(0, 3).join(', ').toLowerCase()}, followed by ${tastingNotes.slice(3).join(' and ').toLowerCase()}.`,
    `The palate is balanced and expressive, with the structure and finish expected from a carefully selected ${country} wine.`,
    `${production} shapes the wine's style while preserving fruit definition, freshness and regional character.`,
    `Presented in a ${size} bottle at ${abv} ABV, it is suited to premium retail, gifting, tastings and considered home-cellar selection.`,
    `Serve in appropriate wine glassware and pair with ${foodPairing.join(', ').toLowerCase()} for the best experience.`
  ].join('\n');

  const normalized = normalizeProduct({
    name,
    type: 'Wine',
    category: 'Wine',
    country,
    subcategory,
    brand,
    size,
    description,
    price,
    tags: [brand, 'Wine', subcategory, country, region, size, production],
    tastingNotes,
    flavorProfile: split(flavor),
    foodPairing
  });
  normalized.identity = {
    ...normalized.identity,
    type: 'Wine',
    style: subcategory,
    production,
    origin: `${region}, ${country}`,
    bottleSize: size,
    abv
  };
  normalized.shipping = {
    box_type: 'Certified Wine Shipper (1 Bottle)',
    weight_kg: 1.55,
    length_cm: 10.0,
    width_cm: 10.0,
    height_cm: 33.0,
    is_fragile: true,
    parcel_value: parseFloat(price) || 1199,
    hs_code: '2204.21',
    aramexServiceType: 'ONP'
  };
  return {
    ...normalized,
    id: `wine_${String(index + 1).padStart(2, '0')}_${keyOf(name).replace(/\s+/g, '_')}`,
    stock: 25,
    featured: index < 6,
    options: [size],
    approvalStatus: 'approved',
    catalogManaged: true,
    sourceWorkbooks: ['seedWine.js'],
    sourceUrl: SOURCE_URL,
    imageSource: 'Grand Store wine taxonomy seed'
  };
};

const buildPlan = () => {
  const products = wines.map(buildProduct);
  const forbidden = products.filter((product) => (
    keyOf(product.subcategory) === 'champagne' || keyOf(product.category) === 'champagne'
  ));
  if (forbidden.length) throw new Error('Champagne must remain in its existing main category.');
  return products;
};

const summarize = (products) => ({
  products: products.length,
  countries: [...new Set(products.map((product) => product.country))].sort(),
  subcategories: [...new Set(products.map((product) => product.subcategory))].sort(),
  champagneProducts: products.filter((product) => keyOf(product.subcategory).includes('champagne')).length
});

const applyPlan = async (products) => {
  const existingProducts = await Product.find({ vendorId: null }).lean();
  const existingByName = new Map(existingProducts.map((product) => [keyOf(product.name), product]));
  const operations = [];
  let inserted = 0;
  let updated = 0;

  for (const product of products) {
    const existing = existingByName.get(keyOf(product.name));
    const setData = { ...product };
    delete setData.id;
    if (existing?.image) delete setData.image;
    else setData.image = DEFAULT_IMAGE;
    if (Number(existing?.stock) > 0) setData.stock = existing.stock;

    if (existing) {
      operations.push({
        updateOne: {
          filter: { _id: existing._id },
          update: { $set: setData }
        }
      });
      updated += 1;
    } else {
      operations.push({
        updateOne: {
          filter: { id: product.id },
          update: { $set: setData, $setOnInsert: { id: product.id, vendorId: null } },
          upsert: true
        }
      });
      inserted += 1;
    }
  }

  if (operations.length) await Product.bulkWrite(operations, { ordered: false });
  return { inserted, updated };
};

const main = async () => {
  const products = buildPlan();
  console.log(JSON.stringify({ dryRun: !process.argv.includes('--apply'), summary: summarize(products) }, null, 2));
  if (!process.argv.includes('--apply')) return;
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured.');

  if (process.env.MONGO_URI.startsWith('mongodb+srv://')) {
    const servers = (process.env.MONGO_DNS_SERVERS || '1.1.1.1,8.8.8.8')
      .split(',')
      .map((server) => server.trim())
      .filter(Boolean);
    if (servers.length) dns.setServers(servers);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log(JSON.stringify({ applied: await applyPlan(products) }, null, 2));
};

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    });
}

module.exports = { applyPlan, buildPlan, summarize };
