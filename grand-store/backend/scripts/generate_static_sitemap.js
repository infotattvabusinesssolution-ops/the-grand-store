require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { getSitemapXml } = require('../controllers/sitemapController');

async function generateStaticSitemap() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    let generatedXml = '';
    const mockRes = {
      header: () => {},
      send: (data) => { generatedXml = data; }
    };

    await getSitemapXml({}, mockRes);

    if (generatedXml && generatedXml.startsWith('<?xml')) {
      const targetPath = path.resolve(__dirname, '../../frontend/public/sitemap.xml');
      fs.writeFileSync(targetPath, generatedXml, 'utf-8');
      console.log(`Successfully updated static sitemap at: ${targetPath}`);
    } else {
      console.error('Failed to generate XML');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

generateStaticSitemap();
