const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const Product = require('../models/Product');

  const updateData = {
    'identity.bottleSize': '750ml',
    'identity.abv': '14.5%',
    'identity.origin': 'Dry Creek Valley, Sonoma County, California, USA',
    'identity.style': 'Old-Vine Field Blend',
    shipping: {
      box_type: 'Certified Wine Shipper (1 Bottle)',
      weight_kg: 1.55,          // 0.75kg wine + 0.70kg bottle + 0.10kg protective packaging
      length_cm: 10.0,         // outer carton width/depth
      width_cm: 10.0,
      height_cm: 33.0,         // fits 30.5cm tall bottle with top/bottom foam cushions
      is_fragile: true,
      parcel_value: 1199.00,
      hs_code: '2204.21',      // HS 2204.21: Wine of fresh grapes in containers holding 2L or less
      aramexServiceType: 'ONP'
    }
  };

  const updated = await Product.findOneAndUpdate(
    {
      $or: [
        { id: 'wine_07_ridge_lytton_springs_zinfandel_750ml' },
        { name: { $regex: 'Ridge Lytton Springs', $options: 'i' } }
      ]
    },
    { $set: updateData },
    { new: true }
  );

  console.log('--- UPDATED RIDGE PRODUCT ---');
  console.log(JSON.stringify({
    id: updated.id,
    name: updated.name,
    price: updated.price,
    shipping: updated.shipping
  }, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
