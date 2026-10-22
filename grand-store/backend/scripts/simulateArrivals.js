const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const SLOT_DEFINITIONS = [
  {
    name: "Wine",
    match: (p) => {
      const c = String(p.category || p.type || "").toLowerCase();
      return c.includes("wine");
    },
  },
  {
    name: "Beer",
    match: (p) => {
      const c = String(p.category || p.type || "").toLowerCase();
      return c.includes("beer") || c.includes("cider");
    },
  },
  {
    name: "Champagne",
    match: (p) => {
      const c = String(p.category || p.type || "").toLowerCase();
      return c.includes("champagne") || c.includes("sparkling");
    },
  },
  {
    name: "Whisky",
    match: (p) => {
      const c = String(p.category || p.type || "").toLowerCase();
      return c.includes("whisky") || c.includes("scotch");
    },
  },
  {
    name: "Cognac / Tequila",
    match: (p) => {
      const c = String(p.category || p.type || "").toLowerCase();
      return (
        c.includes("cognac") ||
        c.includes("tequila") ||
        c.includes("brandy") ||
        c.includes("spirit") ||
        c.includes("rum") ||
        c.includes("vodka") ||
        c.includes("gin")
      );
    },
  },
];

async function simulateArrivals() {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));

  const products = await Product.find({}).lean();
  
  const validProducts = [...products]
    .filter((p) => !p.vendorId || p.approvalStatus === "approved")
    .filter((p) => String(p.category || p.type || "").toLowerCase() !== "accessories")
    .filter((p) => {
      const name = String(p.name || "").toLowerCase();
      return !name.includes("keg") && !name.includes("draught machine");
    })
    .sort((a, b) => {
      const first = new Date(a.createdAt || a.updatedAt || 0).getTime() || 0;
      const second = new Date(b.createdAt || b.updatedAt || 0).getTime() || 0;
      return second - first;
    });

  const usedIds = new Set();
  const buckets = SLOT_DEFINITIONS.map((def) => {
    const matches = validProducts.filter((p) => def.match(p));
    matches.forEach((m) => usedIds.add(m.id || m._id));
    return matches;
  });

  const unused = validProducts.filter((p) => !usedIds.has(p.id || p._id));
  buckets.forEach((bucket, idx) => {
    if (bucket.length === 0) {
      buckets[idx] = unused.length > 0 ? unused.slice(0, 5) : validProducts.slice(idx * 2, idx * 2 + 5);
    }
  });

  const currentProducts = buckets
    .map((bucket) => {
      if (!bucket || bucket.length === 0) return null;
      return bucket[0];
    })
    .filter(Boolean);

  console.log('--- Current Arrivals Showcase Products ---');
  currentProducts.forEach((p, idx) => {
    console.log(`Slot ${idx + 1} (${SLOT_DEFINITIONS[idx]?.name}):`);
    console.log(`  Name: ${p.name}`);
    console.log(`  Category: ${p.category}`);
    console.log(`  Brand: ${p.brand}`);
    console.log(`  Image: ${p.image}`);
  });

  await mongoose.disconnect();
}

simulateArrivals().catch(console.error);
