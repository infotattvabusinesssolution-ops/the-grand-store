require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const dns = require('dns');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { cloudinary } = require('../config/cloudinary');
const { keyOf } = require('../utils/productNormalization');

const GRAND_STORE_ORIGIN = 'https://grandstore.co.za';
const CLOUDINARY_FOLDER = 'grand-store/products/wine-grandstore';

const GRAND_STORE_IMAGES = {
  tshireletsoWhite: {
    name: 'Tshireletso White',
    productUrl: `${GRAND_STORE_ORIGIN}/product/tshireletso-white`,
    imageUrl: `${GRAND_STORE_ORIGIN}/public/images/products/1786615886_647f8da55e63a504deca.png`
  },
  tshireletsoRed: {
    name: 'Tshireletso Red',
    productUrl: `${GRAND_STORE_ORIGIN}/product/tshireletso-red`,
    imageUrl: `${GRAND_STORE_ORIGIN}/public/images/products/1786615901_9e3c3defee5d41ffa1d7.png`
  },
  queenMother: {
    name: 'Queen Mother Mathokoana Mopeli',
    productUrl: `${GRAND_STORE_ORIGIN}/product/queen-mother-mathokoana-mopeli`,
    imageUrl: `${GRAND_STORE_ORIGIN}/public/images/products/1786615057_c176e552f5bd15bb75e9.png`
  },
  royalHighness: {
    name: 'Her Royal Highness Sekhothali',
    productUrl: `${GRAND_STORE_ORIGIN}/product/her-royal-highness-sekhothali`,
    imageUrl: `${GRAND_STORE_ORIGIN}/public/images/products/1786613799_01b42a78d2b25ee73f1c.png`
  },
  moremoholo: {
    name: 'King Moremoholo Mopeli',
    productUrl: `${GRAND_STORE_ORIGIN}/product/king-moremoholo-mopeli`,
    imageUrl: `${GRAND_STORE_ORIGIN}/public/images/products/1786613170_84a5f22ea4d89f7f1b95.png`
  },
  makhosonke: {
    name: 'King Makhosonke II',
    productUrl: `${GRAND_STORE_ORIGIN}/product/king-makhosonke-ii`,
    imageUrl: `${GRAND_STORE_ORIGIN}/public/images/products/1786970555_64662faab94ddf6ecee1.png`
  },
  dePizanSparklingWhite: {
    name: 'De Pizan Non-Alcoholic Sparkling White 750 ML',
    productUrl: `${GRAND_STORE_ORIGIN}/product/de-pizan-non-alcoholic-sparkling-white-750-ml`,
    imageUrl: `${GRAND_STORE_ORIGIN}/public/images/products/1770813094_c79f99a3cae3bc6786f9.png`
  },
  dePizanRouge: {
    name: 'De Pizan Non-Alcoholic Rouge 750 ML',
    productUrl: `${GRAND_STORE_ORIGIN}/product/de-pizan-non-alcoholic-rouge-750-ml`,
    imageUrl: `${GRAND_STORE_ORIGIN}/public/images/products/1770809562_d398fc633a094e68be6b.png`
  },
  dePizanFraisch: {
    name: 'De Pizan Non-Alcoholic Fraisch 750 ML',
    productUrl: `${GRAND_STORE_ORIGIN}/product/de-pizan-non-alcoholic-fraisch-750-ml`,
    imageUrl: `${GRAND_STORE_ORIGIN}/public/images/products/1770813526_7994e84677d60e55f677.png`
  },
  dePizanCerise: {
    name: 'De Pizan Non-Alcoholic Cerise Wine 750 ML',
    productUrl: `${GRAND_STORE_ORIGIN}/product/de-pizan-non-alcoholic-cerise-wine-750-ml`,
    imageUrl: `${GRAND_STORE_ORIGIN}/public/images/products/1770806764_ac4d25bc39a53f5c8cf8.png`
  },
  dePizanSparklingRed: {
    name: 'De Pizan Non-Alcoholic Sparkling Red 750 ML',
    productUrl: `${GRAND_STORE_ORIGIN}/product/de-pizan-non-alcoholic-sparkling-red-750-ml`,
    imageUrl: `${GRAND_STORE_ORIGIN}/public/images/products/1770804512_469fdb759ad1bbf54856.png`
  }
};

const stripBottleSize = (value) => keyOf(value)
  .replace(/\b\d+(?:\.\d+)?\s*(?:ml|cl|l)\b/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const exactSourceByName = new Map([
  ['tshireletso white', GRAND_STORE_IMAGES.tshireletsoWhite],
  ['lucmo wines tshireletso white sauvignon blanc', GRAND_STORE_IMAGES.tshireletsoWhite],
  ['tshireletso red', GRAND_STORE_IMAGES.tshireletsoRed],
  ['lucmo wines tshireletso red shiraz grenache', GRAND_STORE_IMAGES.tshireletsoRed],
  ['queen mother mathokoana mopeli chardonnay', GRAND_STORE_IMAGES.queenMother],
  ['her royal highness sekhothali chenin blanc', GRAND_STORE_IMAGES.royalHighness],
  ['lucmo wines her royal highness sekhothali estate sauvignon blanc', GRAND_STORE_IMAGES.royalHighness],
  ['king moremoholo mopeli', GRAND_STORE_IMAGES.moremoholo],
  ['lucmo wines his royal majesty king moremoholo mopeli estate cabernet sauvignon', GRAND_STORE_IMAGES.moremoholo],
  ['lucmo wines his royal majesty king makhosonke ii estate merlot', GRAND_STORE_IMAGES.makhosonke],
  ['de pizan sparkling white', GRAND_STORE_IMAGES.dePizanSparklingWhite],
  ['de pizan sparkling red', GRAND_STORE_IMAGES.dePizanSparklingRed],
  ['de pizan rouge', GRAND_STORE_IMAGES.dePizanRouge],
  ['de pizan fraisch', GRAND_STORE_IMAGES.dePizanFraisch],
  ['de pizan cerise', GRAND_STORE_IMAGES.dePizanCerise]
]);

const pickGrandStoreSource = (product) => {
  const exact = exactSourceByName.get(stripBottleSize(product.name));
  if (exact) return { ...exact, exact: true };

  const subcategory = keyOf(product.subcategory);
  if (subcategory.includes('sparkling red')) return { ...GRAND_STORE_IMAGES.dePizanSparklingRed, exact: false };
  if (subcategory.includes('sparkling') || ['prosecco', 'cava'].includes(subcategory)) {
    return { ...GRAND_STORE_IMAGES.dePizanSparklingWhite, exact: false };
  }
  if (subcategory.includes('rose')) {
    return { ...GRAND_STORE_IMAGES.dePizanFraisch, exact: false };
  }
  if (subcategory.includes('non alcoholic red')) return { ...GRAND_STORE_IMAGES.dePizanRouge, exact: false };
  if (subcategory.includes('non alcoholic')) return { ...GRAND_STORE_IMAGES.tshireletsoWhite, exact: false };
  if (['port', 'sherry', 'madeira', 'vermouth'].includes(subcategory)) {
    return { ...GRAND_STORE_IMAGES.tshireletsoRed, exact: false };
  }
  if (['cabernet sauvignon', 'merlot', 'pinot noir', 'shiraz syrah', 'malbec', 'tempranillo', 'zinfandel'].includes(subcategory)) {
    return { ...(subcategory === 'merlot' ? GRAND_STORE_IMAGES.makhosonke : GRAND_STORE_IMAGES.tshireletsoRed), exact: false };
  }
  return { ...GRAND_STORE_IMAGES.tshireletsoWhite, exact: false };
};

const publicIdFor = (source) => `${CLOUDINARY_FOLDER}/${keyOf(source.name).replace(/\s+/g, '-')}`;

const assertGrandStoreSource = (source) => {
  for (const value of [source.productUrl, source.imageUrl]) {
    const url = new URL(value);
    if (url.hostname !== 'grandstore.co.za') {
      throw new Error(`Refusing non-Grand Store Wine image source: ${value}`);
    }
  }
};

const uploadSource = async (source) => {
  assertGrandStoreSource(source);
  return cloudinary.uploader.upload(source.imageUrl, {
    public_id: publicIdFor(source),
    overwrite: true,
    invalidate: true,
    resource_type: 'image',
    tags: ['wine', 'grand-store-source'],
    context: {
      source: 'Grand Store',
      source_product: source.name,
      source_url: source.productUrl
    }
  });
};

const buildAssignments = (products) => products.map((product) => ({
  product,
  source: pickGrandStoreSource(product)
}));

const applyAssignments = async (assignments) => {
  const sources = [...new Map(assignments.map(({ source }) => [source.imageUrl, source])).values()];
  const uploadedBySourceUrl = new Map();

  for (const source of sources) {
    const uploaded = await uploadSource(source);
    uploadedBySourceUrl.set(source.imageUrl, uploaded);
    console.log(`Uploaded Grand Store Wine image: ${source.name}`);
  }

  const syncedAt = new Date();
  const operations = assignments.map(({ product, source }) => {
    const uploaded = uploadedBySourceUrl.get(source.imageUrl);
    return {
      updateOne: {
        filter: { _id: product._id },
        update: {
          $set: {
            image: uploaded.secure_url,
            originalImage: source.imageUrl,
            imageSource: source.exact ? 'Grand Store' : 'Grand Store (temporary subcategory image)',
            imageSourceUrl: source.productUrl,
            imageSyncedAt: syncedAt,
            cloudinaryPublicId: uploaded.public_id,
            backgroundRemovalStatus: 'not_requested'
          }
        }
      }
    };
  });

  if (operations.length) await Product.bulkWrite(operations, { ordered: false });
  return { productsUpdated: operations.length, sourcesUploaded: sources.length };
};

const summarize = (assignments) => ({
  products: assignments.length,
  exactProductImages: assignments.filter(({ source }) => source.exact).length,
  temporarySubcategoryImages: assignments.filter(({ source }) => !source.exact).length,
  uniqueGrandStoreImages: new Set(assignments.map(({ source }) => source.imageUrl)).size,
  sourceHosts: [...new Set(assignments.map(({ source }) => new URL(source.imageUrl).hostname))]
});

const verifySavedProducts = (products) => ({
  products: products.length,
  cloudinaryImages: products.filter((product) => /^https:\/\/res\.cloudinary\.com\//i.test(product.image || '')).length,
  grandStoreOriginals: products.filter((product) => /^https:\/\/grandstore\.co\.za\//i.test(product.originalImage || '')).length,
  grandStoreSourcePages: products.filter((product) => /^https:\/\/grandstore\.co\.za\//i.test(product.imageSourceUrl || '')).length,
  missingImages: products.filter((product) => !String(product.image || '').trim()).length,
  localPlaceholders: products.filter((product) => String(product.image || '').startsWith('/assets/')).length
});

const main = async () => {
  const shouldApply = process.argv.includes('--apply');
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not configured.');
  if (shouldApply && (!process.env.CLOUDINARY_API_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET)) {
    throw new Error('Cloudinary credentials are not configured.');
  }

  if (process.env.MONGO_URI.startsWith('mongodb+srv://')) {
    dns.setServers((process.env.MONGO_DNS_SERVERS || '1.1.1.1,8.8.8.8')
      .split(',')
      .map((server) => server.trim())
      .filter(Boolean));
  }

  await mongoose.connect(process.env.MONGO_URI);
  const products = await Product.find({
    vendorId: null,
    category: { $regex: /^wine$/i },
    isCatalogDuplicate: { $ne: true }
  })
    .select('_id id name subcategory image originalImage imageSource imageSourceUrl cloudinaryPublicId')
    .sort({ name: 1 })
    .lean();
  const assignments = buildAssignments(products);
  assignments.forEach(({ source }) => assertGrandStoreSource(source));

  console.log(JSON.stringify({
    mode: shouldApply ? 'apply' : 'dry_run',
    summary: summarize(assignments),
    mappings: assignments.map(({ product, source }) => ({
      product: product.name,
      grandStoreProduct: source.name,
      exact: source.exact
    }))
  }, null, 2));

  if (shouldApply) {
    const applied = await applyAssignments(assignments);
    const savedProducts = await Product.find({
      vendorId: null,
      category: { $regex: /^wine$/i },
      isCatalogDuplicate: { $ne: true }
    })
      .select('image originalImage imageSourceUrl')
      .lean();
    const verification = verifySavedProducts(savedProducts);
    console.log(JSON.stringify({ applied, verification }, null, 2));

    if (
      verification.products !== verification.cloudinaryImages ||
      verification.products !== verification.grandStoreOriginals ||
      verification.products !== verification.grandStoreSourcePages ||
      verification.missingImages ||
      verification.localPlaceholders
    ) {
      throw new Error('Wine image verification failed after applying the seed.');
    }
  }
};

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
    });
}

module.exports = {
  GRAND_STORE_IMAGES,
  buildAssignments,
  pickGrandStoreSource,
  stripBottleSize,
  summarize,
  verifySavedProducts
};
