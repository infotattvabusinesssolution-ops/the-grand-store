const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
const http = require('http');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  console.log('=== Step 1: Checking MongoDB ===');
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

  const dbProducts = await Product.find({
    $or: [
      { brand: { $regex: /jack daniel/i } },
      { name: { $regex: /jack daniel/i } },
      { name: { $regex: /gentleman jack/i } }
    ]
  }).lean();

  console.log(`Total found in DB: ${dbProducts.length}`);
  dbProducts.forEach((p, i) => {
    console.log(`\n--- DB Product ${i + 1} ---`);
    console.log(`_id: ${p._id}`);
    console.log(`id: ${p.id}`);
    console.log(`name: ${p.name}`);
    console.log(`slug: ${p.slug}`);
    console.log(`brand: ${p.brand}`);
    console.log(`size: ${p.size}`);
    console.log(`price: ${p.price}`);
    console.log(`image: ${p.image}`);
    console.log(`description: ${p.description}`);
  });

  await mongoose.disconnect();

  console.log('\n=== Step 2: Checking API Query ===');
  const checkApi = (url) => new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.products || parsed);
        } catch (e) {
          resolve({ error: e.message, raw: data });
        }
      });
    }).on('error', err => resolve({ error: err.message }));
  });

  const apiFiltered = await checkApi('http://localhost:5015/api/products?brand=' + encodeURIComponent("Jack Daniel's"));
  console.log(`API ?brand=Jack Daniel's count: ${Array.isArray(apiFiltered) ? apiFiltered.length : JSON.stringify(apiFiltered)}`);
  if (Array.isArray(apiFiltered)) {
    apiFiltered.forEach((p, i) => {
      console.log(`${i + 1}. [${p.brand}] ${p.name} (${p.slug})`);
    });
  }

  const allApi = await checkApi('http://localhost:5015/api/products?limit=1000');
  if (Array.isArray(allApi)) {
    const jdFromAll = allApi.filter(p => 
      (p.brand && /jack daniel/i.test(p.brand)) ||
      (p.name && /jack daniel/i.test(p.name)) ||
      (p.name && /gentleman jack/i.test(p.name))
    );
    console.log(`\nAPI all products matching Jack Daniel / Gentleman Jack: ${jdFromAll.length}`);
    jdFromAll.forEach((p, i) => {
      console.log(`${i + 1}. [${p.brand}] ${p.name} (${p.slug}) -> ${p.image}`);
    });
  }
}

run().catch(console.error);
