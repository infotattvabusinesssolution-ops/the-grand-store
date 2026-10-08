require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const Product = require('./models/Product');

const updates = [
  { namePattern: /Tshireletso White/i, image: '/assets/products/wine-grandstore/tshireletso-white.png' },
  { namePattern: /Tshireletso Red/i, image: '/assets/products/wine-grandstore/tshireletso-red.png' },
  { namePattern: /Her Royal Highness Sekhothali/i, image: '/assets/products/wine-grandstore/sekhothali.png' },
  { namePattern: /King Moremoholo Mopeli/i, image: '/assets/products/wine-grandstore/moremoholo.png' },
  { namePattern: /King Makhosonke II/i, image: '/assets/products/wine-grandstore/makhosonke.png' },
  { namePattern: /(De Pizan|Lautus).*Sparkling White/i, image: '/assets/products/wine-grandstore/depizan-sparkling-white.png' },
  { namePattern: /(De Pizan|Lautus).*Sparkling Red/i, image: '/assets/products/wine-grandstore/depizan-sparkling-red.png' },
  { namePattern: /(De Pizan|Lautus).*Rouge|Leitz Eins-Zwei-Zero Red/i, image: '/assets/products/wine-grandstore/depizan-rouge.png' },
  { namePattern: /(De Pizan|Lautus).*Fraisch|(De Pizan|Lautus).*Savvy White/i, image: '/assets/products/wine-grandstore/depizan-fraisch.png' },
  { namePattern: /(De Pizan|Lautus).*Cerise/i, image: '/assets/products/wine-grandstore/depizan-cerise.png' }
];

const dns = require('dns');

async function updateImages() {
  try {
    if (process.env.MONGO_URI.startsWith('mongodb+srv://')) {
      const servers = (process.env.MONGO_DNS_SERVERS || '1.1.1.1,8.8.8.8').split(',').map((server) => server.trim()).filter(Boolean);
      if (servers.length) dns.setServers(servers);
    }
    await mongoose.connect(process.env.MONGO_URI);
    let totalUpdated = 0;
    
    for (const update of updates) {
      const result = await Product.updateMany(
        { name: update.namePattern },
        { $set: { image: update.image } }
      );
      console.log(`Matched ${result.matchedCount} and updated ${result.modifiedCount} for ${update.namePattern}`);
      totalUpdated += result.modifiedCount;
    }
    
    console.log(`Total images updated: ${totalUpdated}`);
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.disconnect();
  }
}

updateImages();
