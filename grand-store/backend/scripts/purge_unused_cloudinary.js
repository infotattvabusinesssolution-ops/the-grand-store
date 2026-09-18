const path = require('path');
const fs = require('fs');
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_API_NAME || 'oioqrgj0',
  api_key: process.env.CLOUDINARY_API_KEY || '782922137546894',
  api_secret: process.env.CLOUDINARY_API_SECRET || '9sgEWIPABZjV0aOy1gIFu9i7KXY'
});

const REPORT_PATH = path.resolve(__dirname, '../scratch/cloudinary_audit_report.json');

async function verifyZeroDbCollisions(candidates) {
  console.log('[Safety Check] Re-verifying candidates against MongoDB before deletion...');
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  const collections = await mongoose.connection.db.listCollections().toArray();

  let collisions = 0;
  for (const item of candidates) {
    const pubId = item.public_id;
    const cleanId = pubId.split('/').pop();
    const regex = new RegExp(cleanId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    for (const colInfo of collections) {
      const col = mongoose.connection.db.collection(colInfo.name);
      const count = await col.countDocuments({
        $or: [
          { image: regex },
          { images: regex },
          { gallery: regex },
          { documentUrl: regex },
          { documentUrls: regex },
          { factSheetPdf: regex },
          { profileImage: regex },
          { banner: regex },
          { logo: regex },
          { url: regex },
          { file: regex }
        ]
      });
      if (count > 0) {
        console.warn(`⚠️ COLLISION DETECTED: ${pubId} is referenced in ${colInfo.name} (${count} docs)! Skipping!`);
        collisions++;
        item.skip = true;
        break;
      }
    }
  }

  await mongoose.disconnect();
  console.log(`[Safety Check Complete] ${collisions} collisions found and protected.`);
}

async function deleteInBatches(publicIds, resourceType, batchSize = 80) {
  let deletedCount = 0;
  let notFoundCount = 0;

  for (let i = 0; i < publicIds.length; i += batchSize) {
    const chunk = publicIds.slice(i, i + batchSize);
    try {
      console.log(`Deleting batch ${Math.floor(i / batchSize) + 1} (${chunk.length} ${resourceType}s)...`);
      const res = await cloudinary.api.delete_resources(chunk, { resource_type: resourceType });
      
      if (res && res.deleted) {
        for (const [id, status] of Object.entries(res.deleted)) {
          if (status === 'deleted') deletedCount++;
          else if (status === 'not_found') notFoundCount++;
          else console.log(`Notice for ${id}: ${status}`);
        }
      }
    } catch (err) {
      console.error(`Error deleting batch for ${resourceType}:`, err.message);
    }
  }

  return { deletedCount, notFoundCount };
}

async function run() {
  if (!fs.existsSync(REPORT_PATH)) {
    throw new Error(`Report not found at ${REPORT_PATH}. Run audit_cloudinary.js first.`);
  }

  const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
  const candidates = report.unusedList;
  console.log(`Loaded ${candidates.length} unused assets for cleanup (${report.summary.unusedSizeMB} MB)`);

  await verifyZeroDbCollisions(candidates);

  const toDelete = candidates.filter(c => !c.skip);
  console.log(`Proceeding with deletion of ${toDelete.length} confirmed safe unused assets...`);

  // Group by resource_type
  const groups = {
    image: toDelete.filter(c => c.resource_type === 'image').map(c => c.public_id),
    video: toDelete.filter(c => c.resource_type === 'video').map(c => c.public_id),
    raw: toDelete.filter(c => c.resource_type === 'raw').map(c => c.public_id)
  };

  console.log(`\nTargets breakdown:`);
  console.log(`- Images: ${groups.image.length}`);
  console.log(`- Videos: ${groups.video.length}`);
  console.log(`- Raw: ${groups.raw.length}`);

  let totalDeleted = 0;

  for (const [type, ids] of Object.entries(groups)) {
    if (ids.length === 0) continue;
    console.log(`\n--- DELETING ${type.toUpperCase()}S (${ids.length} items) ---`);
    const { deletedCount, notFoundCount } = await deleteInBatches(ids, type);
    console.log(`Result for ${type}s: ${deletedCount} deleted, ${notFoundCount} not_found`);
    totalDeleted += deletedCount;
  }

  console.log(`\n=== CLEANUP COMPLETED ===`);
  console.log(`Successfully purged ${totalDeleted} obsolete assets from Cloudinary.`);
  console.log(`Freed approximately ~${report.summary.unusedSizeMB} MB of Cloudinary storage.`);
}

run().catch(err => {
  console.error('Fatal error during cleanup:', err);
  process.exit(1);
});
