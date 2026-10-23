const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const catalogUpdates = [
  // Jack Daniel's
  {
    slug: 'jack-daniels-single-barrel-rye-green-label-700ml',
    name: "Jack Daniel's Single Barrel Rye Green Label 700ml",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792735201/grand-store/catalog-originals/whisky/jack-daniels/jack-daniels-single-barrel-rye-green-label-700ml.png'
  },
  {
    slug: 'jack-daniels-master-distiller-no-5-tennessee-whiskey-750ml',
    name: "Jack Daniel's Master Distiller No. 5 Tennessee Whiskey 750ml",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792735202/grand-store/catalog-originals/whisky/jack-daniels/jack-daniels-master-distiller-no-5-tennessee-whiskey-750ml.png'
  },
  {
    slug: 'gentleman-jack-rare-tennessee-whiskey-750ml',
    name: "Gentleman Jack Rare Tennessee Whiskey 750ml",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792735203/grand-store/catalog-originals/whisky/jack-daniels/gentleman-jack-rare-tennessee-whiskey-750ml.png'
  },
  {
    slug: 'jack-daniels-single-barrel-rye-green-label-750ml',
    name: "Jack Daniel's Single Barrel Rye Green Label 750ml",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792735204/grand-store/catalog-originals/whisky/jack-daniels/jack-daniels-single-barrel-rye-green-label-750ml.png'
  },
  {
    slug: 'jack-daniels-master-distiller-series-no-5-1l',
    name: "Jack Daniel's Master Distiller Series No. 5 1L",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792735205/grand-store/catalog-originals/whisky/jack-daniels/jack-daniels-master-distiller-series-no-5-1l.png'
  },
  {
    slug: 'gentleman-jack-rare-double-mellowed-tennessee-whiskey-750ml',
    name: "Gentleman Jack Rare Double-Mellowed Tennessee Whiskey 750ml",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792735206/grand-store/catalog-originals/whisky/jack-daniels/gentleman-jack-rare-double-mellowed-tennessee-whiskey-750ml.png'
  },
  {
    slug: 'jack-daniels-old-no-7-tennessee-whiskey-750ml',
    name: "Jack Daniel's Old No. 7 Tennessee Whiskey 750ml",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792735207/grand-store/catalog-originals/whisky/jack-daniels/jack-daniels-old-no-7-tennessee-whiskey-750ml.png'
  },
  {
    slug: 'jack-daniels-old-no-7-tennessee-whiskey-15l-magnum',
    name: "Jack Daniel's Old No. 7 Tennessee Whiskey 1.5L Magnum",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792735208/grand-store/catalog-originals/whisky/jack-daniels/jack-daniels-old-no-7-tennessee-whiskey-15l-magnum.png'
  },
  {
    slug: 'jack-daniels-sinatra-select-bold-handcrafted-decanter-1l',
    name: "Jack Daniel's Sinatra Select Bold Handcrafted Decanter 1L",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792735209/grand-store/catalog-originals/whisky/jack-daniels/jack-daniels-sinatra-select-bold-handcrafted-decanter-1l.png'
  },

  // Ballantine's
  {
    slug: 'ballantines-30-year-old-very-rare-blended-scotch-whisky-750ml',
    name: "Ballantine's 30 Year Old Very Rare Blended Scotch Whisky 750ml",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792676882/grand-store/catalog-originals/whisky/ballantines/ballantines-30-year-old-very-rare-blended-scotch-whisky-750ml.png'
  },
  {
    slug: 'ballantines-17-year-old-blended-scotch-whisky-750ml',
    name: "Ballantine's 17 Year Old Blended Scotch Whisky 750ml",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792676883/grand-store/catalog-originals/whisky/ballantines/ballantines-17-year-old-blended-scotch-whisky-750ml.png'
  },
  {
    slug: 'ballantines-original-extra-large-45l-gallon-cradle',
    name: "Ballantine's Original Extra-Large 4.5L Gallon Cradle",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792676884/grand-store/catalog-originals/whisky/ballantines/ballantines-original-extra-large-45l-gallon-cradle.png'
  },
  {
    slug: 'ballantines-finest-blended-scotch-whisky-3l-with-cradle',
    name: "Ballantine's Finest Blended Scotch Whisky 3L with Cradle",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792676885/grand-store/catalog-originals/whisky/ballantines/ballantines-finest-blended-scotch-whisky-3l-with-cradle.png'
  },
  {
    slug: 'ballantines-finest-blended-scotch-whisky-750ml',
    name: "Ballantine's Finest Blended Scotch Whisky 750ml",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792676886/grand-store/catalog-originals/whisky/ballantines/ballantines-finest-blended-scotch-whisky-750ml.png'
  },
  {
    slug: 'ballantines-hard-fired-blended-scotch-whisky-1l',
    name: "Ballantine's Hard Fired Blended Scotch Whisky 1L",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792676887/grand-store/catalog-originals/whisky/ballantines/ballantines-hard-fired-blended-scotch-whisky-1l.png'
  },
  {
    slug: 'ballantines-21-year-old-blended-scotch-whisky-750ml',
    name: "Ballantine's 21 Year Old Blended Scotch Whisky 750ml",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792676888/grand-store/catalog-originals/whisky/ballantines/ballantines-21-year-old-blended-scotch-whisky-750ml.png'
  },

  // Dimple
  {
    slug: 'dimple-15-year-old-blended-scotch-whisky-750ml',
    name: "Dimple 15 Year Old Blended Scotch Whisky 750ml",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792673394/grand-store/catalog-originals/whisky/dimple/dimple-15-year-old-blended-scotch-whisky-750ml.png'
  },
  {
    slug: 'dimple-15-year-old-de-luxe-scotch-whisky-750ml',
    name: "Dimple 15 Year Old De Luxe Scotch Whisky 750ml",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792673396/grand-store/catalog-originals/whisky/dimple/dimple-15-year-old-de-luxe-scotch-whisky-750ml.png'
  },
  {
    slug: 'dimple-golden-selection-blended-scotch-whisky-700ml',
    name: "Dimple Golden Selection Blended Scotch Whisky 700ml",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792673398/grand-store/catalog-originals/whisky/dimple/dimple-golden-selection-blended-scotch-whisky-700ml.png'
  },
  {
    slug: 'dimple-haig-15-year-old-presentation-tin-collector-edition-750ml',
    name: "Dimple Haig 15 Year Old Presentation Tin Collector Edition 750ml",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792673400/grand-store/catalog-originals/whisky/dimple/dimple-haig-15-year-old-presentation-tin-collector-edition-750ml.png'
  },
  {
    slug: 'dimple-3l-1970-rare-heritage-collector-limited-edition',
    name: "Dimple 3L 1970 Rare Heritage Collector Limited Edition",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792673401/grand-store/catalog-originals/whisky/dimple/dimple-3l-1970-rare-heritage-collector-limited-edition.png'
  },
  {
    slug: 'dimple-haig-15-year-old-presentation-tin-scotch-whisky-750ml',
    name: "Dimple Haig 15 Year Old Presentation Tin Scotch Whisky 750ml",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792673403/grand-store/catalog-originals/whisky/dimple/dimple-haig-15-year-old-presentation-tin-scotch-whisky-750ml.png'
  },

  // Sake & Baijiu
  {
    slug: 'dassai-23-junmai-daiginjo-super-premium-sake-720ml',
    name: "Dassai 23 Junmai Daiginjo Super Premium Sake 720ml",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792660144/grand-store/catalog-originals/sake/dassai-23-junmai-daiginjo-super-premium-sake-720ml.png'
  },
  {
    slug: 'dassai-45-junmai-daiginjo-sake-720ml',
    name: "Dassai 45 Junmai Daiginjo Sake 720ml",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792660145/grand-store/catalog-originals/sake/dassai-45-junmai-daiginjo-sake-720ml.png'
  },
  {
    slug: 'gekkeikan-traditional-junmai-sake-720ml',
    name: "Gekkeikan Traditional Junmai Sake 720ml",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792660146/grand-store/catalog-originals/sake/gekkeikan-traditional-junmai-sake-720ml.png'
  },
  {
    slug: 'gold-gekkeikan-junmai-sake-with-gold-leaf-720ml',
    name: "Gold Gekkeikan Junmai Sake with Gold Leaf 720ml",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792660147/grand-store/catalog-originals/sake/gold-gekkeikan-junmai-sake-with-gold-leaf-720ml.png'
  },
  {
    slug: 'super-kinokuni-junmai-sake-720ml',
    name: "Super Kinokuni Junmai Sake 720ml",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792660148/grand-store/catalog-originals/sake/super-kinokuni-junmai-sake-720ml.png'
  },
  {
    slug: 'fenjiu-qinghua-20-year-old',
    name: "Fenjiu Qinghua 20 Year Old",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792660149/grand-store/catalog-originals/baijiu/fenjiu-qinghua-20-year-old.png'
  },
  {
    slug: 'guizhou-xijiu-friends-series-blue-bottle',
    name: "Guizhou Xijiu Friends Series Blue Bottle",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792660150/grand-store/catalog-originals/baijiu/guizhou-xijiu-friends-series-blue-bottle.png'
  },
  {
    slug: 'fen-jiu-red-label-fen-chiew',
    name: "Fen Jiu Red Label (Fen Chiew)",
    url: 'https://res.cloudinary.com/oioqrgj0/image/upload/v1792660151/grand-store/catalog-originals/baijiu/fen-jiu-red-label-fen-chiew.png'
  }
];

async function sync() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  console.log('Connected to MongoDB successfully.');

  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

  let totalUpdated = 0;
  for (const item of catalogUpdates) {
    const filter = {
      $or: [
        { slug: item.slug },
        { name: item.name },
        { name: new RegExp(`^${item.name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
      ]
    };

    const update = {
      $set: {
        image: item.url,
        originalImage: item.url,
        images: [item.url],
        gallery: [item.url],
        updatedAt: new Date()
      }
    };

    const res = await Product.updateMany(filter, update);
    console.log(`Updated [${item.slug}]: matched ${res.matchedCount}, modified ${res.modifiedCount}`);
    if (res.modifiedCount > 0) totalUpdated += res.modifiedCount;
  }

  console.log(`\nSynchronization Complete! Total products updated: ${totalUpdated}`);
  await mongoose.disconnect();
}

sync().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
