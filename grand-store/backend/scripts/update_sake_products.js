const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_API_NAME || 'oioqrgj0',
  api_key: process.env.CLOUDINARY_API_KEY || '782922137546894',
  api_secret: process.env.CLOUDINARY_API_SECRET || '9sgEWIPABZjV0aOy1gIFu9i7KXY'
});

const sakeSpecs = [
  {
    localFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch/gekkeikan-traditional-junmai-sake-720ml.png',
    publicId: 'gekkeikan-traditional-junmai-sake-720ml',
    filename: 'gekkeikan-traditional-junmai-sake-720ml.png',
    targetId: 'ws-gekkeikan-gold-sake',
    name: 'Gekkeikan Traditional Junmai-shu Sake 720ml',
    slug: 'gekkeikan-traditional-junmai-shu-sake-720ml',
    brand: 'Gekkeikan',
    category: 'Sake',
    type: 'Sake',
    subcategory: 'Junmai Sake',
    country: 'Japan',
    size: '720ml',
    price: 480,
    stock: 35,
    description: 'Brewed in Fushimi, Kyoto—the historic capital of Japanese sake brewing with over 380 years of craftsmanship. Made using centuries-old yeast strains and pristine natural spring water. Herbaceous with gentle grapefruit acidity, subtle steamed rice notes, and a balanced dry finish. Delicious served chilled, room temperature, or gently warmed.',
    tastingNotes: [
      'Nose: Steamed koji rice, green melon, fresh grapefruit peel, and subtle floral notes.',
      'Palate: Medium-bodied, balanced acidity, rich rice umami with velvety, smooth mouthfeel.',
      'Finish: Clean, crisp, and refreshing with an appetizing dry finish.'
    ],
    flavorProfile: ['Smooth & Earthy', 'Clean Umami', 'Gentle Acidity', 'Steamed Rice'],
    foodPairing: ['Salmon & Tuna Sashimi', 'Crispy Prawn Tempura', 'Yakitori Skewers', 'Miso Black Cod']
  },
  {
    localFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch/gold-gekkeikan-junmai-sake-with-gold-leaf-720ml.png',
    publicId: 'gold-gekkeikan-junmai-sake-with-gold-leaf-720ml',
    filename: 'gold-gekkeikan-junmai-sake-with-gold-leaf-720ml.png',
    targetId: 'ws_1791979597879_57',
    name: 'Gold Gekkeikan Junmai-shu Sake with Gold Leaf 720ml',
    slug: 'gold-gekkeikan-junmai-shu-sake-with-gold-leaf-720ml',
    brand: 'Gekkeikan',
    category: 'Sake',
    type: 'Sake',
    subcategory: 'Junmai Sake',
    country: 'Japan',
    size: '720ml',
    price: 750,
    stock: 25,
    description: 'Gold Gekkeikan is an auspicious celebratory Junmai Sake brewed in Fushimi, Kyoto, famous for its pure, soft subterranean spring water (Miyamizu). Imbued with shimmering flakes of edible pure 24-karat gold leaf, it delivers a harmonious, rounded umami profile that honors Japanese hospitality and tradition.',
    tastingNotes: [
      'Nose: Subtle green apple, crisp melon, steamed rice, and gentle floral minerality.',
      'Palate: Medium-bodied, balanced acidity, rich rice umami with velvety texture and glittering gold leaf flakes.',
      'Finish: Crisp, refreshing, and pristine celebratory finish.'
    ],
    flavorProfile: ['Melon', 'Steamed Rice', 'Soft Mineral Water', 'Delicate Umami'],
    foodPairing: ['Celebration Sashimi Platter', 'Tempura Prawns', 'Grilled Black Cod Miso', 'Wagyu Beef Tataki']
  },
  {
    localFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch/super-kinokuni-junmai-sake-720ml.png',
    publicId: 'super-kinokuni-junmai-sake-720ml',
    filename: 'super-kinokuni-junmai-sake-720ml.png',
    targetId: 'ws_1791979598070_213',
    name: 'Super Kinokuni Junmai Sake 720ml',
    slug: 'super-kinokuni-junmai-sake-720ml',
    brand: 'Kinokuni',
    category: 'Sake',
    type: 'Sake',
    subcategory: 'Junmai Sake',
    country: 'Japan',
    size: '720ml',
    price: 435,
    stock: 20,
    description: 'Super Kinokuni Junmai Sake is brewed using traditional Wakayama regional techniques. Crafted with local Gohyakumangoku sake rice and clear mountain stream water, it produces a hearty, food-friendly Junmai with well-defined umami and crisp refreshing acidity.',
    tastingNotes: [
      'Nose: Steamed rice, green melon, and gentle cedar wood notes.',
      'Palate: Savory, medium-dry, pleasant rice grain sweetness and bright acidity.',
      'Finish: Crisp, dry, and exceptionally appetizing.'
    ],
    flavorProfile: ['Crisp Rice', 'Green Melon', 'Cedar Wood', 'Savory Umami'],
    foodPairing: ['Grilled Unagi Eel', 'Tonkatsu', 'Gyoza', 'Ramen']
  },
  {
    localFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch/dassai-45-junmai-daiginjo-sake-720ml.png',
    publicId: 'dassai-45-junmai-daiginjo-sake-720ml',
    filename: 'dassai-45-junmai-daiginjo-sake-720ml.png',
    targetId: 'ws-dassai-45-sake',
    name: 'Dassai 45 Junmai Daiginjo Sake 720ml',
    slug: 'dassai-45-junmai-daiginjo-sake-720ml',
    brand: 'Dassai',
    category: 'Sake',
    type: 'Sake',
    subcategory: 'Junmai Daiginjo Sake',
    country: 'Japan',
    size: '720ml',
    price: 850,
    stock: 28,
    description: 'Dassai 45 is crafted by Asahi Shuzo in Yamaguchi Prefecture using the king of sake rice, Yamada Nishiki, polished down meticulously until only 45% of the grain heart remains. This yields an exquisite, world-acclaimed sake boasting delicate aromas of white peach, honeydew melon, and a silky, refined finish.',
    tastingNotes: [
      'Nose: Ethereal white peach, honeydew melon, muscat grape, and fresh mountain wildflowers.',
      'Palate: Luscious, silky elegance, gentle fruity sweetness, and balanced vibrant acidity.',
      'Finish: Incredibly clean, crisp, and sophisticated.'
    ],
    flavorProfile: ['White Peach', 'Honeydew Melon', 'Wildflowers', 'Silky Sweetness'],
    foodPairing: ['Yellowtail Hamachi Crudo', 'Hokkaido Scallops', 'Fresh Oysters', 'Light Soba']
  },
  {
    localFile: 'C:/Users/HP/.gemini/antigravity-ide/brain/c29b23bd-fc3d-45b3-aa5e-2b723af6e4d8/scratch/dassai-23-junmai-daiginjo-super-premium-sake-720ml.png',
    publicId: 'dassai-23-junmai-daiginjo-super-premium-sake-720ml',
    filename: 'dassai-23-junmai-daiginjo-super-premium-sake-720ml.png',
    targetId: 'ws_1791979598166_99',
    name: 'Dassai 23 Junmai Daiginjo Super Premium Sake 720ml',
    slug: 'dassai-23-junmai-daiginjo-super-premium-sake-720ml',
    brand: 'Dassai',
    category: 'Sake',
    type: 'Sake',
    subcategory: 'Ultra-Premium Junmai Daiginjo',
    country: 'Japan',
    size: '720ml',
    price: 2890,
    stock: 12,
    description: 'Dassai 23 represents the absolute summit of modern rice polishing technology. Each grain of Yamada Nishiki rice is gently polished down over 168 continuous hours to a breathtaking 23% kernel remnant. Presented in an authentic paulownia wooden presentation box with gold mizuhiki cord, it offers velvet floral aromas and a hauntingly pure finish.',
    tastingNotes: [
      'Nose: Fragrant bouquet of wild strawberries, blooming lilies, and ripe Bartlett pear.',
      'Palate: Astonishingly velvety and seamless, sweet rain water, melon drops, and refined minerality.',
      'Finish: Long, crystalline, and gossamer-smooth.'
    ],
    flavorProfile: ['Wild Strawberry', 'Lily Flower', 'Bartlett Pear', 'Crystalline Purity'],
    foodPairing: ['Otoro Tuna Sashimi', 'Uni Sea Urchin', 'Fresh Belon Oysters with Ponzu', 'Kobe Beef']
  }
];

async function uploadToCloudinary(filePath, publicId) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, {
      folder: 'grandstore-uploads/products/sake',
      public_id: publicId,
      overwrite: true,
      resource_type: 'image'
    }, (error, result) => {
      if (error) reject(error);
      else resolve(result.secure_url);
    });
  });
}

async function run() {
  console.log('--- Step 1: Copying images to local frontend public assets ---');
  const targetDirs = [
    'd:/Grand Store/the-grand-store/grand-store/frontend/public/assets/products/sake',
    'd:/Grand Store/the-grand-store/grand-storelocal/frontend/public/assets/products/sake'
  ];

  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  for (const spec of sakeSpecs) {
    for (const dir of targetDirs) {
      const dest = path.join(dir, spec.filename);
      fs.copyFileSync(spec.localFile, dest);
      console.log(`Copied ${spec.filename} to ${dir}`);
    }
  }

  console.log('\n--- Step 2: Uploading images to Cloudinary ---');
  for (const spec of sakeSpecs) {
    try {
      console.log(`Uploading ${spec.publicId}...`);
      const url = await uploadToCloudinary(spec.localFile, spec.publicId);
      spec.cloudinaryUrl = url;
      console.log(`✓ Uploaded: ${url}`);
    } catch (err) {
      console.error(`Failed to upload ${spec.publicId}:`, err.message);
      spec.cloudinaryUrl = `/assets/products/sake/${spec.filename}`;
    }
  }

  console.log('\n--- Step 3: Connecting to MongoDB and Updating Products ---');
  await mongoose.connect(process.env.MONGO_URI);
  const Product = require('../models/Product');

  for (const spec of sakeSpecs) {
    const filter = {
      $or: [
        { id: spec.targetId },
        { slug: spec.slug },
        { name: spec.name },
        { name: { $regex: spec.brand, $options: 'i' }, subcategory: { $regex: spec.subcategory.split(' ')[0], $options: 'i' } }
      ]
    };

    const updateDoc = {
      name: spec.name,
      slug: spec.slug,
      brand: spec.brand,
      category: spec.category,
      type: spec.type,
      subcategory: spec.subcategory,
      country: spec.country,
      size: spec.size,
      price: String(spec.price),
      stock: spec.stock,
      description: spec.description,
      image: spec.cloudinaryUrl,
      originalImage: spec.cloudinaryUrl,
      gallery: [spec.cloudinaryUrl],
      tastingNotes: spec.tastingNotes,
      flavorProfile: spec.flavorProfile,
      foodPairing: spec.foodPairing,
      isCatalogDuplicate: false,
      catalogDuplicateOf: null,
      approvalStatus: 'approved'
    };

    let p = await Product.findOne({ id: spec.targetId });
    if (!p) {
      p = await Product.findOne({ slug: spec.slug });
    }
    if (!p) {
      p = await Product.findOne({ name: spec.name });
    }

    if (p) {
      Object.assign(p, updateDoc);
      await p.save();
      console.log(`✓ Updated existing product [${p.id || p._id}]: ${p.name} - R${p.price}`);
    } else {
      const newP = new Product({
        id: spec.targetId,
        ...updateDoc
      });
      await newP.save();
      console.log(`✓ Created new product [${spec.targetId}]: ${spec.name} - R${spec.price}`);
    }
  }

  console.log('\n--- Step 4: Verification of all Sake products in DB ---');
  const finalSake = await Product.find({
    $or: [
      { category: 'Sake' },
      { category: 'Baijiu & Sake', subcategory: { $regex: 'sake', $options: 'i' } }
    ]
  }).lean();

  console.log(`Found ${finalSake.length} Sake products in DB:`);
  finalSake.forEach(p => {
    console.log(`- [${p.id}] ${p.name} | Category: ${p.category} | Subcategory: ${p.subcategory} | R${p.price} | Image: ${p.image}`);
  });

  await mongoose.disconnect();
  console.log('\n✓ Sake database update completed successfully!');
}

run().catch(console.error);
