const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Product = require('../models/Product');
const Category = require('../models/Category');
const { clearCache } = require('../utils/cache');

const OFFICIAL_15_CATEGORIES = [
  { name: 'Baijiu', slug: 'baijiu', description: 'Legendary Chinese grains spirit including Moutai and premium distillates.' },
  { name: 'Beer', slug: 'beer', description: 'Curated international premium and craft beers.' },
  { name: 'Brandy', slug: 'brandy', description: 'Aged grape and fruit brandies of distinction.' },
  { name: 'Champagne', slug: 'champagne', description: 'Iconic French sparkling wines from the Champagne region.' },
  { name: 'Cigars', slug: 'cigars', description: 'Handcrafted luxury cigars and humidor collections.' },
  { name: 'Cognac', slug: 'cognac', description: 'Prestige double-distilled French cognacs and vintage reserves.' },
  { name: 'Gin', slug: 'gin', description: 'Artisanal dry, London dry, and botanical craft gins.' },
  { name: 'Liqueur', slug: 'liqueur', description: 'Herbal, cream, fruit, and dessert liqueurs.' },
  { name: 'Rum', slug: 'rum', description: 'Aged Caribbean, spiced, and artisanal sugarcane rums.' },
  { name: 'Sake', slug: 'sake', description: 'Super-premium Japanese Junmai Daiginjo and artisanal sake.' },
  { name: 'Spirits', slug: 'spirits', description: 'Exclusive aperitifs, digestifs, and world spirits.' },
  { name: 'Tequila', slug: 'tequila', description: '100% Blue Agave blanco, reposado, añejo, and extra añejo tequilas.' },
  { name: 'Vodka', slug: 'vodka', description: 'Ultra-pure grain, wheat, and potato craft vodkas.' },
  { name: 'Whisky', slug: 'whisky', description: 'Single malt, blended, bourbon, and international whiskies.' },
  { name: 'Wine', slug: 'wine', description: 'Benchmark South African estate wines and Old World icons.' }
];

async function sync() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.');

  // 1. Standardize Scotch products to Whisky
  const scotchUpdate = await Product.updateMany(
    { $or: [{ category: 'Scotch' }, { type: 'Scotch' }] },
    { $set: { category: 'Whisky', type: 'Whisky' } }
  );
  console.log(`Updated Scotch products to Whisky: ${scotchUpdate.modifiedCount} modified.`);

  // 2. Standardize Whiskey products to Whisky
  const whiskeyUpdate = await Product.updateMany(
    { $or: [{ category: 'Whiskey' }, { type: 'Whiskey' }] },
    { $set: { category: 'Whisky', type: 'Whisky' } }
  );
  console.log(`Updated Whiskey products to Whisky: ${whiskeyUpdate.modifiedCount} modified.`);

  // 3. Remove obsolete categories from Category table
  await Category.deleteMany({ name: { $in: ['Scotch', 'Ciders'] } });
  console.log('Removed obsolete/empty categories (Scotch, Ciders) from Category model.');

  // 4. Upsert the 15 official categories
  for (const item of OFFICIAL_15_CATEGORIES) {
    await Category.findOneAndUpdate(
      { slug: item.slug },
      {
        $set: {
          name: item.name,
          slug: item.slug,
          description: item.description,
          isActive: true
        }
      },
      { upsert: true, new: true }
    );
  }
  console.log('Upserted 15 official categories into Category model.');

  // 5. Verification
  const activeCats = await Category.find({ isActive: true }).sort({ name: 1 });
  console.log('\n=== VERIFICATION: ACTIVE CATEGORIES IN DB ===');
  console.log(`Count: ${activeCats.length}`);
  activeCats.forEach((c, i) => console.log(`  ${i + 1}. ${c.name} (${c.slug})`));

  const prodCats = await Product.distinct('category');
  console.log('\n=== VERIFICATION: DISTINCT PRODUCT CATEGORIES ===');
  console.log(`Count: ${prodCats.length}`);
  console.log(prodCats.sort());

  clearCache('categories');
  clearCache();
  console.log('\nCache cleared.');

  await mongoose.disconnect();
  console.log('Done.');
}

sync().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
