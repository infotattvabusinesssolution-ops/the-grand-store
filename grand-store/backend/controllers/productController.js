const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const { normalizeProduct } = require('../utils/productNormalization');
const { slugify } = require('../utils/slugify');

const INTERNAL_PRODUCT_ROLES = ['admin', 'super_admin', 'product_manager'];
const canManageInternalProducts = (user) => INTERNAL_PRODUCT_ROLES.includes(user?.role);

const parseJsonValue = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const mergeIdentity = (derivedIdentity, identity) => {
  const supplied = parseJsonValue(identity, {});
  return Object.fromEntries(Object.entries({ ...derivedIdentity, ...supplied }).map(([key, value]) => [
    key,
    String(value || '').trim()
  ]));
};

const cleanImageList = (images) => [...new Set(images
  .map((value) => String(value || '').trim())
  .filter(Boolean))].slice(0, 5);

const getOrderedImages = ({ imageOrder, uploadedImages = [], existingImages = [], suppliedImages = [] }) => {
  const order = parseJsonValue(imageOrder, null);
  const allowedExistingImages = new Set(cleanImageList(existingImages));

  if (Array.isArray(order)) {
    const orderedImages = order.map((entry) => {
      if (entry?.kind === 'upload') {
        const uploadIndex = Number(entry.index);
        return Number.isInteger(uploadIndex) ? uploadedImages[uploadIndex] : '';
      }
      if (entry?.kind === 'existing') {
        const url = String(entry.url || '').trim();
        return allowedExistingImages.has(url) ? url : '';
      }
      return '';
    });
    return cleanImageList(orderedImages);
  }

  if (uploadedImages.length) return cleanImageList(uploadedImages);
  if (suppliedImages.length) return cleanImageList(suppliedImages);
  return cleanImageList(existingImages);
};

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const query = { isCatalogDuplicate: { $ne: true } };
    if (req.query.type) {
      query.type = req.query.type;
    }
    if (req.query.category) {
      query.category = { $regex: new RegExp(`^${req.query.category}$`, 'i') };
    }
    if (req.query.country) {
      const c = req.query.country.toLowerCase().trim();
      if (['usa', 'united states', 'us'].includes(c)) {
        query.country = { $in: [/^usa$/i, /^united states$/i, /^us$/i] };
      } else {
        query.country = { $regex: new RegExp(`^${req.query.country}$`, 'i') };
      }
    }
    const products = await Product.find(query).sort({ createdAt: -1 }).lean();
    
    const vendorIds = [...new Set(products.filter(p => p.vendorId).map(p => p.vendorId.toString()))];
    const vendors = await Vendor.find({ userId: { $in: vendorIds } }).lean();
    
    const productsWithStore = products.reduce((acc, product) => {
      if (!product.vendorId) {
        // Internal product (like Accessories) managed by Admin
        acc.push({
          ...product,
          storeId: 'admin',
          storeName: 'The Grand Store'
        });
        return acc;
      }
      
      const vendor = vendors.find(v => v.userId.toString() === product.vendorId.toString());
      if (vendor && vendor.status === 'approved' && vendor.paymentStatus === 'paid') {
        acc.push({
          ...product,
          storeId: vendor.userId,
          storeName: vendor.businessInfo?.tradingName || vendor.businessInfo?.legalName || 'Unknown Store'
        });
      }
      // If vendor is not approved or not paid, skip this product
      return acc;
    }, []);

    res.json(productsWithStore);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id }).lean();
    if (product) {
      if (!product.vendorId) {
        product.storeId = 'admin';
        product.storeName = 'The Grand Store';
      } else {
        const vendor = await Vendor.findOne({ userId: product.vendorId }).lean();
        if (vendor) {
          product.storeId = vendor.userId;
          product.storeName = vendor.businessInfo?.tradingName || vendor.businessInfo?.legalName || 'Unknown Store';
        }
      }
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching product' });
  }
};

// @desc    Fetch single product by slug (Isolated for SEO)
// @route   GET /api/products/slugs/:slug
// @access  Public
const getProductBySlug = async (req, res) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug }).lean();
    if (product) {
      if (!product.vendorId) {
        product.storeId = 'admin';
        product.storeName = 'The Grand Store';
      } else {
        const vendor = await Vendor.findOne({ userId: product.vendorId }).lean();
        if (vendor) {
          product.storeId = vendor.userId;
          product.storeName = vendor.businessInfo?.tradingName || vendor.businessInfo?.legalName || 'Unknown Store';
        }
      }
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching product by slug' });
  }
};
// @desc    Create a new product (Vendor or Admin)
// @route   POST /api/products
// @access  Private (Vendor/Admin)
const createProduct = async (req, res) => {
  try {
    if (req.user.role !== 'vendor_active' && !canManageInternalProducts(req.user)) {
      return res.status(403).json({ message: 'Only approved vendors or admins can add products' });
    }

    const {
      name, type, category, country, subcategory, brand, size, identity, imageOrder,
      description, price, options, tags, tastingNotes, stock, flavorProfile, foodPairing
    } = req.body;
    let { image, gallery } = req.body; // Allows passing image links from frontend for admins

    // Cloudinary storage returns persistent HTTPS URLs in each uploaded file's path.
    let factSheetPdf = null;
    let uploadedImages = [];
    
    // If files are uploaded (multipart/form-data)
    if (req.files) {
      if (req.files.images && req.files.images.length > 0) {
        uploadedImages = req.files.images.map((file) => file.path);
      }
      if (req.files.factSheetPdf && req.files.factSheetPdf[0]) {
        factSheetPdf = req.files.factSheetPdf[0].path;
      }
    }

    const suppliedGallery = parseJsonValue(gallery, gallery ? [gallery] : []);
    const finalImages = getOrderedImages({
      imageOrder,
      uploadedImages,
      suppliedImages: [image, ...(Array.isArray(suppliedGallery) ? suppliedGallery : [])]
    });
    image = finalImages[0] || '';
    gallery = finalImages.slice(1);
    if (!image) {
      return res.status(400).json({ message: 'At least one product image is required.' });
    }

    const requestedCategory = String(category || type || '').trim();
    if (requestedCategory.toLowerCase() === 'wine' && !factSheetPdf && !canManageInternalProducts(req.user)) {
      return res.status(400).json({ message: 'Fact Sheet PDF is required for Wine products' });
    }

    if (requestedCategory.toLowerCase() === 'wine' && (!country || !subcategory || !brand || !size)) {
      return res.status(400).json({
        message: 'Wine products require country, subcategory, brand and bottle size.'
      });
    }

    const normalizedProduct = normalizeProduct({
      name,
      type: requestedCategory,
      category: requestedCategory,
      country,
      subcategory,
      brand,
      size,
      description,
      tags: parseJsonValue(tags, []),
      tastingNotes: parseJsonValue(tastingNotes, []),
      flavorProfile: parseJsonValue(flavorProfile, []),
      foodPairing: parseJsonValue(foodPairing, [])
    });

    const newProduct = new Product({
      id: `prod_${Date.now()}`,
      name: normalizedProduct.name,
      type: normalizedProduct.type,
      category: normalizedProduct.category,
      country: normalizedProduct.country,
      subcategory: normalizedProduct.subcategory,
      brand: normalizedProduct.brand,
      size: normalizedProduct.size,
      identity: mergeIdentity(normalizedProduct.identity, identity),
      description: normalizedProduct.description,
      price,
      image,
      gallery,
      factSheetPdf,
      options: parseJsonValue(options, []),
      tags: normalizedProduct.tags,
      tastingNotes: normalizedProduct.tastingNotes,
      flavorProfile: normalizedProduct.flavorProfile,
      foodPairing: normalizedProduct.foodPairing,
      stock: Number(stock) || 0,
      costing: parseJsonValue(req.body.costing, undefined),
      slug: req.body.slug ? slugify(req.body.slug) : slugify(normalizedProduct.name),
      seoTitle: req.body.seoTitle ? String(req.body.seoTitle).trim() : undefined,
      metaDescription: req.body.metaDescription ? String(req.body.metaDescription).trim() : undefined,
      vendorId: canManageInternalProducts(req.user) ? null : req.user._id,
      approvalStatus: 'approved'
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Server error creating product' });
  }
};
// @desc    Fetch products for a specific vendor
// @route   GET /api/products/vendor/me
// @access  Private (Vendor/Admin)
const getVendorProducts = async (req, res) => {
  try {
    if (req.user.role !== 'vendor_active' && !canManageInternalProducts(req.user)) {
      return res.status(403).json({ message: 'Product management access is required' });
    }
    const filter = canManageInternalProducts(req.user)
      ? { vendorId: null, isCatalogDuplicate: { $ne: true } }
      : { vendorId: req.user._id, isCatalogDuplicate: { $ne: true } };
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching vendor products' });
  }
};

// @desc    Update a product (Vendor or Admin)
// @route   PUT /api/products/:id
// @access  Private (Vendor/Admin)
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const ownsVendorProduct = product.vendorId?.toString() === req.user._id.toString();
    const managesInternalProduct = canManageInternalProducts(req.user) && !product.vendorId;
    if (!ownsVendorProduct && !managesInternalProduct) {
      return res.status(403).json({ message: 'Not authorized to edit this product' });
    }

    const {
      name, type, category, country, subcategory, brand, size, identity, imageOrder,
      description, price, options, tags, tastingNotes, stock,
      image: imageLink, gallery: galleryLinks, flavorProfile, foodPairing
    } = req.body;

    const normalizedProduct = normalizeProduct({
      ...product.toObject(),
      name: name || product.name,
      type: category || type || product.category || product.type,
      category: category || type || product.category || product.type,
      country: country !== undefined ? country : product.country,
      subcategory: subcategory !== undefined ? subcategory : product.subcategory,
      brand: brand !== undefined ? brand : product.brand,
      size: size !== undefined ? size : product.size,
      description: description !== undefined ? description : product.description,
      tags: parseJsonValue(tags, product.tags),
      tastingNotes: parseJsonValue(tastingNotes, product.tastingNotes),
      flavorProfile: parseJsonValue(flavorProfile, product.flavorProfile),
      foodPairing: parseJsonValue(foodPairing, product.foodPairing)
    });

    product.name = normalizedProduct.name;
    product.type = normalizedProduct.type;
    product.category = normalizedProduct.category;
    product.country = normalizedProduct.country;
    product.subcategory = normalizedProduct.subcategory;
    product.brand = normalizedProduct.brand;
    product.size = normalizedProduct.size;
    product.identity = mergeIdentity(normalizedProduct.identity, identity);
    product.description = normalizedProduct.description;
    product.price = price || product.price;
    product.options = parseJsonValue(options, product.options);
    product.tags = normalizedProduct.tags;
    product.tastingNotes = normalizedProduct.tastingNotes;
    product.flavorProfile = normalizedProduct.flavorProfile;
    product.foodPairing = normalizedProduct.foodPairing;
    product.stock = stock !== undefined ? Number(stock) : product.stock;
    if (req.body.costing !== undefined) {
      product.costing = parseJsonValue(req.body.costing, product.costing);
    }
    if (req.body.slug !== undefined) {
      product.slug = req.body.slug ? slugify(req.body.slug) : undefined;
    }
    if (req.body.seoTitle !== undefined) {
      product.seoTitle = req.body.seoTitle ? String(req.body.seoTitle).trim() : undefined;
    }
    if (req.body.metaDescription !== undefined) {
      product.metaDescription = req.body.metaDescription ? String(req.body.metaDescription).trim() : undefined;
    }

    let uploadedImages = [];
    if (req.files) {
      if (req.files.images && req.files.images.length > 0) {
        uploadedImages = req.files.images.map((file) => file.path);
      }
      if (req.files.factSheetPdf && req.files.factSheetPdf[0]) {
        product.factSheetPdf = req.files.factSheetPdf[0].path;
      }
    }

    const currentImages = cleanImageList([product.image, ...(product.gallery || [])]);
    const suppliedGallery = parseJsonValue(galleryLinks, galleryLinks ? [galleryLinks] : []);
    const finalImages = getOrderedImages({
      imageOrder,
      uploadedImages,
      existingImages: currentImages,
      suppliedImages: [imageLink, ...(Array.isArray(suppliedGallery) ? suppliedGallery : [])]
    });
    if (!finalImages.length) {
      return res.status(400).json({ message: 'At least one product image is required.' });
    }
    product.image = finalImages[0];
    product.gallery = finalImages.slice(1);

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Server error updating product' });
  }
};

// @desc    Delete a product (Vendor or Admin)
// @route   DELETE /api/products/:id
// @access  Private (Vendor/Admin)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const ownsVendorProduct = product.vendorId?.toString() === req.user._id.toString();
    const managesInternalProduct = canManageInternalProducts(req.user) && !product.vendorId;
    if (!ownsVendorProduct && !managesInternalProduct) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await Product.deleteOne({ id: req.params.id });
    res.json({ message: 'Product removed' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error deleting product' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getProductBySlug,
  createProduct,
  getVendorProducts,
  updateProduct,
  deleteProduct
};
