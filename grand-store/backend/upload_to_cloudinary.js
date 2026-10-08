require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const Product = require('./models/Product');
const cloudinary = require('cloudinary').v2;
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_API_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const updates = [
  { namePattern: /Tshireletso White/i, file: 'tshireletso-white.png' },
  { namePattern: /Tshireletso Red/i, file: 'tshireletso-red.png' },
  { namePattern: /Her Royal Highness Sekhothali/i, file: 'sekhothali.png' },
  { namePattern: /King Moremoholo Mopeli/i, file: 'moremoholo.png' },
  { namePattern: /King Makhosonke II/i, file: 'makhosonke.png' },
  { namePattern: /(De Pizan|Lautus).*Sparkling White/i, file: 'depizan-sparkling-white.png' },
  { namePattern: /(De Pizan|Lautus).*Sparkling Red/i, file: 'depizan-sparkling-red.png' },
  { namePattern: /(De Pizan|Lautus).*Rouge|Leitz Eins-Zwei-Zero Red/i, file: 'depizan-rouge.png' },
  { namePattern: /(De Pizan|Lautus).*Fraisch|(De Pizan|Lautus).*Savvy White/i, file: 'depizan-fraisch.png' },
  { namePattern: /(De Pizan|Lautus).*Cerise/i, file: 'depizan-cerise.png' }
];

const dns = require('dns');

async function uploadAndUpdate() {
  try {
    if (process.env.MONGO_URI.startsWith('mongodb+srv://')) {
      const servers = (process.env.MONGO_DNS_SERVERS || '1.1.1.1,8.8.8.8').split(',').map((s) => s.trim()).filter(Boolean);
      if (servers.length) dns.setServers(servers);
    }
    await mongoose.connect(process.env.MONGO_URI);
    
    const assetsDir = path.join(__dirname, '..', '..', 'grand-storelocal', 'frontend', 'public', 'assets', 'products', 'wine-grandstore');
    
    let totalUpdated = 0;
    
    for (const update of updates) {
      const filePath = path.join(assetsDir, update.file);
      try {
        console.log(`Uploading ${update.file}...`);
        const result = await cloudinary.uploader.upload(filePath, {
          folder: 'grand-store/products/wine-grandstore',
          overwrite: true,
          unique_filename: false,
          use_filename: true
        });
        
        console.log(`Uploaded! URL: ${result.secure_url}`);
        
        const dbResult = await Product.updateMany(
          { name: update.namePattern },
          { $set: { image: result.secure_url } }
        );
        console.log(`Matched ${dbResult.matchedCount} and updated ${dbResult.modifiedCount} in DB for ${update.namePattern}`);
        totalUpdated += dbResult.modifiedCount;
      } catch (e) {
        console.error(`Failed to process ${update.file}:`, e.message);
      }
    }
    
    console.log(`Total DB entries updated with live Cloudinary URLs: ${totalUpdated}`);
  } catch (error) {
    console.error(error);
  } finally {
    mongoose.disconnect();
  }
}

uploadAndUpdate();
