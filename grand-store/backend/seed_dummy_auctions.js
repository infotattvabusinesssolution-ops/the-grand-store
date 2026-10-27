const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://crmisa1000_db_user:Ug5sH8m4vxCjmZHN@cluster0.8snrppp.mongodb.net/test?retryWrites=true&w=majority";

async function seedDummyAuctions() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const User = require('./models/User');
    const AuctionLot = require('./models/AuctionLot');
    const AuctionAuditLog = require('./models/AuctionAuditLog');

    // Find vendor user
    let vendor = await User.findOne({ email: 'vendor@grandstore.com' });
    if (!vendor) {
      vendor = await User.findOne({ role: { $in: ['vendor_active', 'vendor'] } });
    }
    if (!vendor) {
      throw new Error('No vendor user found in database to associate lots with.');
    }
    console.log(`Using vendor: ${vendor.name} (${vendor.email}) - ID: ${vendor._id}`);

    const now = new Date();
    const startDate = new Date(now.getTime() + 1000 * 60 * 60 * 2); // Starts in 2 hours
    const endDate = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7); // 7 days duration

    const dummyLots = [
      {
        title: "The Macallan 1926 60-Year-Old Valerio Adami Edition",
        category: "Whisky",
        distillery: "The Macallan Distillery",
        expression: "Fine & Rare Cask #263",
        vintage: "1926",
        bottlingYear: "1986",
        ageStatement: "60 Years",
        bottleNumber: "12 of 24",
        caskNumber: "Cask #263",
        bottleSizeMl: 750,
        abv: 42.6,
        countryOfOrigin: "Scotland",
        fillLevel: "Into Neck",
        boxCondition: "Original Box / Case Pristine",
        sealCondition: "Intact & Pristine",
        startingBid: 75000,
        reservePrice: 120000,
        bidIncrement: 2500,
        currentBid: 0,
        estimatedValueMin: 110000,
        estimatedValueMax: 165000,
        reserveType: "confidential",
        reserveMet: false,
        provenance: "Acquired directly from a private collector's temperature-controlled cellar in Speyside. Stored continuously at 12°C with full archival paperwork.",
        provenanceHistory: "Bottle #12 remained in the private estate collection of an Edinburgh family from 1986 until 2024. Physical inspection and liquid analysis verified by Grand Store vaulted specialists.",
        description: "One of the most legendary and iconic single malt whiskies ever bottled in human history. Distilled in 1926 and matured in sherry-seasoned oak cask #263 for six decades. Features the iconic limited artwork label by Italian pop artist Valerio Adami. Accompanied by the original bespoke brass and oak lockable presentation case, numbered certificate of authenticity, and formal provenance dossier.",
        images: [
          "https://res.cloudinary.com/oioqrgj0/image/upload/v1792820849/grandstore-auctions/macallan-1926-valerio-adami.jpg"
        ],
        documentationImages: [
          "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800"
        ],
        startDate: startDate,
        endDate: endDate,
        vendor: vendor._id,
        status: "pending_approval",
        authenticationStatus: "Pending",
        custodyLocation: "Seller Custody",
        bidCount: 0,
        extensionCount: 0
      },
      {
        title: "Domaine de la Romanée-Conti Grand Cru 1990",
        category: "Wine",
        distillery: "Domaine de la Romanée-Conti",
        expression: "Monopole Grand Cru Côte de Nuits",
        vintage: "1990",
        bottlingYear: "1992",
        ageStatement: "34 Years Cellared",
        bottleNumber: "02451",
        caskNumber: "Pièce #14",
        bottleSizeMl: 750,
        abv: 13.5,
        countryOfOrigin: "France",
        fillLevel: "High Fill",
        boxCondition: "Original Box / Case Pristine",
        sealCondition: "Wax Seal Intact",
        startingBid: 45000,
        reservePrice: 65000,
        bidIncrement: 1500,
        currentBid: 0,
        estimatedValueMin: 60000,
        estimatedValueMax: 95000,
        reserveType: "confidential",
        reserveMet: false,
        provenance: "Purchased en primeur and held in an underground temperature-regulated chalk cellar in Burgundy before transfer to Grand Store bonded vaults.",
        provenanceHistory: "Single-owner provenance since release. Capsule embossed with DRC Domaine crest; wax seal entirely unblemished. Stored continuously at 11.5°C and 70% relative humidity.",
        description: "The 1990 vintage from DRC is revered as one of the greatest Burgundy expressions of the twentieth century. Possessing an enthralling bouquet of wild violets, black truffles, Asian spices, and macerated dark cherries. Velvety, opulent texture with an endless mineral finish. Ideal for the discerning cellar investor.",
        images: [
          "https://res.cloudinary.com/oioqrgj0/image/upload/v1793077742/grandstore-auctions/drc-romanee-conti-1990.jpg",
          "/assets/auction/drc-romanee-conti-1990.jpg"
        ],
        documentationImages: [
          "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800"
        ],
        startDate: startDate,
        endDate: endDate,
        vendor: vendor._id,
        status: "pending_approval",
        authenticationStatus: "Pending",
        custodyLocation: "Grand Store Bonded Vault",
        bidCount: 0,
        extensionCount: 0
      },
      {
        title: "Dom Pérignon P2 Vintage 2004 Plénitude Brut Champagne",
        category: "Champagne",
        distillery: "Moët & Chandon / Dom Pérignon",
        expression: "Deuxième Plénitude (P2)",
        vintage: "2004",
        bottlingYear: "2022",
        ageStatement: "18 Years on Lees",
        bottleNumber: "DP-2004-9842",
        caskNumber: "Cellar Bin #09",
        bottleSizeMl: 750,
        abv: 12.5,
        countryOfOrigin: "France",
        fillLevel: "Into Neck",
        boxCondition: "Original Box / Case Pristine",
        sealCondition: "Intact & Pristine",
        startingBid: 18000,
        reservePrice: 26000,
        bidIncrement: 1000,
        currentBid: 0,
        estimatedValueMin: 25000,
        estimatedValueMax: 38000,
        reserveType: "confidential",
        reserveMet: false,
        provenance: "Acquired upon inaugural release directly from the Maison cellars in Épernay. In pristine collector condition.",
        provenanceHistory: "Released after 18 years of slow maturation on the lees, reaching its second peak of vitality (Plénitude). Hand-inspected with dark matte presentation coffret intact.",
        description: "The 2004 Plénitude 2 represents the second life of Dom Pérignon, patient maturation leading to enhanced energy, depth, and resonance. Aromas of pink grapefruit, blood orange, cocoa, and toasted brioche mingle with saline minerality and a persistent fine bead. Comes in bespoke collector packaging with certificate.",
        images: [
          "https://res.cloudinary.com/oioqrgj0/image/upload/v1793077737/grandstore-auctions/dom-perignon-p2-2004.jpg",
          "/assets/auction/dom-perignon-p2-2004.jpg"
        ],
        documentationImages: [
          "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800"
        ],
        startDate: startDate,
        endDate: endDate,
        vendor: vendor._id,
        status: "pending_approval",
        authenticationStatus: "Pending",
        custodyLocation: "Seller Custody",
        bidCount: 0,
        extensionCount: 0
      }
    ];

    console.log('Inserting dummy auction lots with status = pending_approval...');
    const insertedLots = [];
    for (const lotData of dummyLots) {
      const lot = await AuctionLot.create(lotData);
      insertedLots.push(lot);

      await AuctionAuditLog.create({
        lot: lot._id,
        user: vendor._id,
        eventType: 'LOT_STATUS_CHANGED',
        details: { newStatus: 'pending_approval', title: lot.title, note: 'Vendor dummy submission awaiting admin approval' },
        ipAddress: '127.0.0.1'
      });

      console.log(`Created: ${lot.title}`);
      console.log(`  -> Lot Number: ${lot.lotNumber}`);
      console.log(`  -> Status: ${lot.status}`);
      console.log(`  -> Media: ${lot.images.length} photos, 1 video (${lot.videoUrl})`);
    }

    console.log(`\nSuccessfully seeded ${insertedLots.length} dummy auction lots!`);
    console.log('They are now waiting in the Admin Auction Panel under "Pending Review" (/admin/auctions).');

  } catch (error) {
    console.error('Error seeding dummy auctions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
}

seedDummyAuctions();
