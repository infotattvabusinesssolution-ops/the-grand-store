const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const Product = require('../models/Product');
  const ids = [
    'ws-ballantines-21',
    'ws-jack-daniels-single-barrel-rye',
    'ws-dimple-15-blended-scotch',
    'ws-dassai-45-sake',
    'ws-ballantines-hardfired',
    'ws-jack-daniels-gentleman-jack'
  ];
  for (const id of ids) {
    const p = await Product.findOne({
      $or: [
        { id: id },
        { slug: new RegExp(id.replace('ws-', '').replace(/-/g, '.*'), 'i') },
        { name: new RegExp(id.replace('ws-', '').replace(/-/g, '.*'), 'i') }
      ]
    }).lean();
    console.log(id, '-->', p ? (`[${p.id}] ${p.name} | R${p.price} | Image: ${p.image}`) : 'NOT FOUND');
  }
  await mongoose.disconnect();
}
check().catch(console.error);
