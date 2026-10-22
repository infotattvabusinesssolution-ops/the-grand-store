const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function updateEstate() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  
  const estateProfileCol = mongoose.connection.db.collection('estateprofiles');
  const updateRes = await estateProfileCol.updateMany(
    { slug: 'bruno-andreu' },
    {
      $set: {
        estateName: 'Bruno Andreu',
        seoTitle: 'Bruno Andreu | Iconic French Languedoc Wines & Estate Allocations',
        metaDescription: 'Discover Bruno Andreu from Languedoc, France. Emotion in every glass across Varietal, Authentic, Iconic, Luxury, and Innovation Alcohol-Free collections.',
        updatedAt: new Date()
      }
    }
  );
  console.log('Updated estateprofiles count:', updateRes.modifiedCount);

  // Also update vendors collection if applicable
  const vendorsCol = mongoose.connection.db.collection('vendors');
  const vendorRes = await vendorsCol.updateMany(
    { storeSlug: 'bruno-andreu' },
    {
      $set: {
        storeName: 'Bruno Andreu',
        updatedAt: new Date()
      }
    }
  );
  console.log('Updated vendors count:', vendorRes.modifiedCount);

  // Also update products collection if applicable
  const productsCol = mongoose.connection.db.collection('products');
  const prodRes = await productsCol.updateMany(
    { $or: [{ brand: 'Maison Bruno Andreu' }, { storeName: 'Maison Bruno Andreu' }] },
    {
      $set: {
        brand: 'Bruno Andreu',
        storeName: 'Bruno Andreu',
        updatedAt: new Date()
      }
    }
  );
  console.log('Updated products count:', prodRes.modifiedCount);

  const updated = await estateProfileCol.findOne({ slug: 'bruno-andreu' });
  console.log('Verified estateName in DB:', updated.estateName);

  await mongoose.disconnect();
}

updateEstate().catch(console.error);
